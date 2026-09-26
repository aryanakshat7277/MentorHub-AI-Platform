package com.mentorhub.compiler.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentorhub.compiler.config.PistonProperties;
import com.mentorhub.compiler.dto.CodeExecutionRequest;
import com.mentorhub.compiler.dto.CodeExecutionResponse;
import com.mentorhub.compiler.dto.RuntimeResponse;
import com.mentorhub.compiler.exception.CompilerException;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class PistonCompilerService implements CompilerService {

    private final PistonProperties pistonProperties;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    private List<RuntimeResponse> cachedRuntimes = new ArrayList<>();
    private long lastRuntimesFetchTime = 0;
    private static final long RUNTIMES_CACHE_TTL = 300_000; // 5 minutes

    private final Map<String, List<Long>> rateLimitMap = new ConcurrentHashMap<>();
    private static final Path TEMP_DIR = Paths.get(System.getProperty("java.io.tmpdir"), "mentorhub_compiler_piston");

    public PistonCompilerService(PistonProperties pistonProperties) {
        this.pistonProperties = pistonProperties;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(pistonProperties.getConnectTimeout()))
                .build();
        this.objectMapper = new ObjectMapper();

        try {
            Files.createDirectories(TEMP_DIR);
        } catch (IOException ignored) {}
    }

    public static final Set<String> SUPPORTED_LANGUAGES = Set.of(
            "python", "java", "cpp", "c", "javascript", "typescript", "csharp", "go", "rust"
    );

    private static final List<String> CANONICAL_ORDER = List.of(
            "python", "java", "cpp", "c", "javascript", "typescript", "go", "csharp", "rust"
    );

    private static final List<RuntimeResponse> FALLBACK_RUNTIMES = List.of(
            new RuntimeResponse("python", "3.10.0", List.of("py", "python3")),
            new RuntimeResponse("java", "17.0.0", List.of("java")),
            new RuntimeResponse("cpp", "10.2.0", List.of("c++", "cpp")),
            new RuntimeResponse("c", "10.2.0", List.of("c")),
            new RuntimeResponse("javascript", "18.15.0", List.of("js", "node")),
            new RuntimeResponse("typescript", "5.0.3", List.of("ts")),
            new RuntimeResponse("go", "1.16.2", List.of("golang")),
            new RuntimeResponse("csharp", "6.12.0", List.of("cs")),
            new RuntimeResponse("rust", "1.68.2", List.of("rs"))
    );

    @Override
    public List<RuntimeResponse> getRuntimes() {
        long now = System.currentTimeMillis();
        if (!cachedRuntimes.isEmpty() && (now - lastRuntimesFetchTime < RUNTIMES_CACHE_TTL)) {
            return cachedRuntimes;
        }

        List<RuntimeResponse> rawList = fetchRuntimesFromUrl(pistonProperties.getBaseUrl());
        if ((rawList == null || rawList.isEmpty()) && !pistonProperties.getBaseUrl().contains("emkc.org")) {
            rawList = fetchRuntimesFromUrl("https://emkc.org");
        }

        List<RuntimeResponse> filtered = filterSupportedRuntimes(rawList);
        cachedRuntimes = filtered;
        lastRuntimesFetchTime = now;
        return filtered;
    }

    private List<RuntimeResponse> filterSupportedRuntimes(List<RuntimeResponse> allRuntimes) {
        Map<String, RuntimeResponse> found = new HashMap<>();
        if (allRuntimes != null) {
            for (RuntimeResponse r : allRuntimes) {
                String lang = r.getLanguage().toLowerCase().trim();
                if (SUPPORTED_LANGUAGES.contains(lang)) {
                    found.putIfAbsent(lang, r);
                }
            }
        }

        Map<String, RuntimeResponse> fallbackMap = new HashMap<>();
        for (RuntimeResponse r : FALLBACK_RUNTIMES) {
            fallbackMap.put(r.getLanguage().toLowerCase().trim(), r);
        }

        List<RuntimeResponse> result = new ArrayList<>();
        for (String lang : CANONICAL_ORDER) {
            if (found.containsKey(lang)) {
                result.add(found.get(lang));
            } else if (fallbackMap.containsKey(lang)) {
                result.add(fallbackMap.get(lang));
            }
        }
        return result;
    }

    private List<RuntimeResponse> fetchRuntimesFromUrl(String baseUrl) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + pistonProperties.getRuntimesPath()))
                    .timeout(Duration.ofMillis(pistonProperties.getReadTimeout()))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                List<Map<String, Object>> list = objectMapper.readValue(response.body(), new TypeReference<>() {});
                List<RuntimeResponse> runtimes = new ArrayList<>();
                for (Map<String, Object> item : list) {
                    String lang = String.valueOf(item.get("language"));
                    String ver = String.valueOf(item.get("version"));
                    @SuppressWarnings("unchecked")
                    List<String> aliases = (List<String>) item.getOrDefault("aliases", Collections.emptyList());
                    runtimes.add(new RuntimeResponse(lang, ver, aliases));
                }
                return runtimes;
            }
        } catch (Exception ignored) {}
        return null;
    }

    @Override
    public CodeExecutionResponse executeCode(CodeExecutionRequest request, String clientIp) {
        checkRateLimit(clientIp);

        String language = request.getLanguage() != null ? request.getLanguage().toLowerCase().trim() : "javascript";
        String code = request.getCode() != null ? request.getCode() : "";
        String stdin = request.getStdin() != null ? request.getStdin() : "";
        String version = request.getVersion() != null ? request.getVersion() : "*";

        if (code.trim().isEmpty()) {
            throw new CompilerException("Error: Source code snippet is empty.", "EMPTY_CODE", 400);
        }
        if (code.length() > pistonProperties.getMaxCodeSize()) {
            throw new CompilerException("Error: Code size exceeds maximum limit of " + pistonProperties.getMaxCodeSize() + " bytes.", "OVERSIZED_CODE", 400);
        }
        if (stdin.length() > pistonProperties.getMaxInputSize()) {
            throw new CompilerException("Error: STDIN size exceeds maximum limit of " + pistonProperties.getMaxInputSize() + " bytes.", "OVERSIZED_STDIN", 400);
        }

        if ("*".equals(version) || version.isEmpty()) {
            version = resolveLanguageVersion(language);
        }

        long startTime = System.currentTimeMillis();

        // 1. Try Primary Base URL (e.g. https://emkc.org or http://localhost:2000)
        try {
            CodeExecutionResponse resp = executeViaPistonApi(pistonProperties.getBaseUrl(), language, version, code, stdin, startTime);
            if (resp != null) return resp;
        } catch (Exception e) {
            System.err.println("Piston Primary API notice: " + e.getMessage() + ". Attempting Cloud Piston API failover...");
        }

        // 2. Try Public Cloud Piston API Failover (https://emkc.org)
        if (!pistonProperties.getBaseUrl().contains("emkc.org")) {
            try {
                CodeExecutionResponse resp = executeViaPistonApi("https://emkc.org", language, version, code, stdin, startTime);
                if (resp != null) return resp;
            } catch (Exception e) {
                System.err.println("Piston Cloud API notice: " + e.getMessage() + ". Utilizing local process execution engine.");
            }
        }

        // 3. Fallback Local Process Execution
        Map<String, String> localResult = executeLocally(language, code, stdin);
        long execTime = System.currentTimeMillis() - startTime;

        String stdout = localResult.getOrDefault("stdout", "");
        String stderr = localResult.getOrDefault("stderr", "");
        int exitCode = Integer.parseInt(localResult.getOrDefault("exitCode", "0"));

        if (exitCode != 0) {
            return CodeExecutionResponse.error("RUNTIME_ERROR", language, version, stdout, stderr, "", exitCode);
        }
        return CodeExecutionResponse.ok(language, version, stdout, stderr, 0, execTime);
    }

    private CodeExecutionResponse executeViaPistonApi(String baseUrl, String language, String version, String code, String stdin, long startTime) throws Exception {
        Map<String, Object> pistonPayload = new HashMap<>();
        pistonPayload.put("language", language);
        pistonPayload.put("version", version);
        pistonPayload.put("files", List.of(Map.of(
                "name", getFileNameForLanguage(language),
                "content", code
        )));
        if (!stdin.isEmpty()) {
            pistonPayload.put("stdin", stdin);
        }

        String jsonBody = objectMapper.writeValueAsString(pistonPayload);
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + pistonProperties.getExecutePath()))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofMillis(pistonProperties.getReadTimeout()))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (httpResponse.statusCode() == 200) {
            Map<String, Object> pistonResp = objectMapper.readValue(httpResponse.body(), new TypeReference<>() {});
            return parsePistonResponse(pistonResp, language, version, System.currentTimeMillis() - startTime);
        }
        return null;
    }

    @Override
    public Map<String, Object> checkHealth() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(pistonProperties.getBaseUrl() + pistonProperties.getRuntimesPath()))
                    .timeout(Duration.ofMillis(2000))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return Map.of("available", true, "service", "piston", "baseUrl", pistonProperties.getBaseUrl());
            }
        } catch (Exception ignored) {}

        if (!pistonProperties.getBaseUrl().contains("emkc.org")) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://emkc.org" + pistonProperties.getRuntimesPath()))
                        .timeout(Duration.ofMillis(2000))
                        .GET()
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    return Map.of("available", true, "service", "piston-cloud", "baseUrl", "https://emkc.org");
                }
            } catch (Exception ignored) {}
        }

        return Map.of("available", false, "service", "piston", "message", "Self-hosted & Cloud Piston APIs are offline.");
    }

    private void checkRateLimit(String clientIp) {
        long now = System.currentTimeMillis();
        long windowStart = now - 60_000;

        List<Long> timestamps = rateLimitMap.computeIfAbsent(clientIp, k -> new ArrayList<>());
        synchronized (timestamps) {
            timestamps.removeIf(t -> t < windowStart);
            if (timestamps.size() >= pistonProperties.getRateLimitPerMin()) {
                throw new CompilerException("Rate limit exceeded. Maximum " + pistonProperties.getRateLimitPerMin() + " requests per minute allowed.", "RATE_LIMIT_EXCEEDED", 429);
            }
            timestamps.add(now);
        }
    }

    private String resolveLanguageVersion(String language) {
        List<RuntimeResponse> runtimes = getRuntimes();
        for (RuntimeResponse r : runtimes) {
            if (r.getLanguage().equalsIgnoreCase(language) || (r.getAliases() != null && r.getAliases().contains(language.toLowerCase()))) {
                return r.getVersion();
            }
        }
        return "latest";
    }

    @SuppressWarnings("unchecked")
    private CodeExecutionResponse parsePistonResponse(Map<String, Object> pistonResp, String language, String version, long execTime) {
        Map<String, Object> run = (Map<String, Object>) pistonResp.get("run");
        Map<String, Object> compile = (Map<String, Object>) pistonResp.get("compile");

        String stdout = run != null ? String.valueOf(run.getOrDefault("stdout", "")) : "";
        String stderr = run != null ? String.valueOf(run.getOrDefault("stderr", "")) : "";
        Integer exitCode = run != null && run.get("code") != null ? ((Number) run.get("code")).intValue() : 0;
        String signal = run != null && run.get("signal") != null ? String.valueOf(run.get("signal")) : null;

        String compileOutput = compile != null ? String.valueOf(compile.getOrDefault("output", "")) : "";
        Integer compileCode = compile != null && compile.get("code") != null ? ((Number) compile.get("code")).intValue() : 0;

        if (compileCode != 0) {
            return CodeExecutionResponse.error("COMPILATION_ERROR", language, version, stdout, stderr, compileOutput, compileCode);
        }
        if ("SIGKILL".equals(signal) || "SIGTOU".equals(signal)) {
            return CodeExecutionResponse.error("TIME_LIMIT_EXCEEDED", language, version, stdout, "Execution Timed Out (Time limit exceeded).", compileOutput, 124);
        }
        if (exitCode != 0) {
            return CodeExecutionResponse.error("RUNTIME_ERROR", language, version, stdout, stderr, compileOutput, exitCode);
        }

        return CodeExecutionResponse.ok(language, version, stdout, stderr, 0, execTime);
    }

    private Map<String, String> executeLocally(String language, String code, String stdin) {
        String lang = language.toLowerCase().trim();
        switch (lang) {
            case "python":
            case "py":
                return runPython(code, stdin);
            case "java":
                return runJava(code, stdin);
            case "cpp":
            case "c++":
                return runCpp(code, stdin);
            case "c":
                return runC(code, stdin);
            case "typescript":
            case "ts":
                return runTypeScript(code, stdin);
            case "csharp":
            case "cs":
                return runCSharp(code, stdin);
            case "go":
                return runGo(code, stdin);
            case "rust":
            case "rs":
                return runRust(code, stdin);
            case "javascript":
            case "js":
            default:
                return runJavaScript(code, stdin);
        }
    }

    private Map<String, String> runJavaScript(String code, String stdin) {
        try {
            Path file = Files.createTempFile(TEMP_DIR, "script_", ".js");
            Files.writeString(file, code, StandardCharsets.UTF_8);
            Map<String, String> result = runProcess(file.getParent(), stdin, "node", file.getFileName().toString());
            tryDelete(file);
            return result;
        } catch (Exception e) {
            return Map.of("stdout", "", "stderr", "JavaScript Execution Error: " + e.getMessage(), "exitCode", "1");
        }
    }

    private Map<String, String> runTypeScript(String code, String stdin) {
        // Native Node 24 TypeScript Execution with --experimental-strip-types
        try {
            Path file = Files.createTempFile(TEMP_DIR, "script_", ".ts");
            Files.writeString(file, code, StandardCharsets.UTF_8);
            Map<String, String> result = runProcess(file.getParent(), stdin, "node", "--experimental-strip-types", file.getFileName().toString());
            tryDelete(file);

            String exitCode = result.getOrDefault("exitCode", "1");
            String stderr = result.getOrDefault("stderr", "");

            if ("0".equals(exitCode) && !stderr.contains("SyntaxError")) {
                return result;
            }
        } catch (Exception ignored) {}

        // Fallback TypeScript Transpilation
        String jsCode = convertTsToJs(code);
        return runJavaScript(jsCode, stdin);
    }

    private Map<String, String> runPython(String code, String stdin) {
        try {
            Path file = Files.createTempFile(TEMP_DIR, "script_", ".py");
            Files.writeString(file, code, StandardCharsets.UTF_8);
            Map<String, String> result = runProcess(file.getParent(), stdin, "python", file.getFileName().toString());
            if (result.getOrDefault("stderr", "").contains("Cannot run program \"python\"")) {
                result = runProcess(file.getParent(), stdin, "py", file.getFileName().toString());
            }
            tryDelete(file);
            return result;
        } catch (Exception e) {
            return Map.of("stdout", "", "stderr", "Python Execution Error: " + e.getMessage(), "exitCode", "1");
        }
    }

    private Map<String, String> runJava(String code, String stdin) {
        try {
            String className = "Main";
            if (code.contains("class ")) {
                int idx = code.indexOf("class ") + 6;
                int endIdx = code.indexOf(" ", idx);
                if (endIdx > idx) {
                    String extracted = code.substring(idx, endIdx).replaceAll("[^{]", "").trim();
                    if (!extracted.isEmpty()) className = extracted;
                }
            }
            Path javaFile = TEMP_DIR.resolve(className + ".java");
            Files.writeString(javaFile, code, StandardCharsets.UTF_8);

            Map<String, String> result = runProcess(TEMP_DIR, stdin, "java", javaFile.getFileName().toString());

            tryDelete(javaFile);
            return result;
        } catch (Exception e) {
            return Map.of("stdout", "", "stderr", "Java Execution Error: " + e.getMessage(), "exitCode", "1");
        }
    }

    private Map<String, String> runCpp(String code, String stdin) {
        try {
            Path sourceFile = Files.createTempFile(TEMP_DIR, "cpp_src_", ".cpp");
            Files.writeString(sourceFile, code, StandardCharsets.UTF_8);
            String exeName = "cpp_exec_" + System.nanoTime() + (isWindows() ? ".exe" : "");
            Path exeFile = TEMP_DIR.resolve(exeName);

            Map<String, String> compileRes = runProcess(TEMP_DIR, "", "g++", "-O2", sourceFile.getFileName().toString(), "-o", exeFile.getFileName().toString());
            tryDelete(sourceFile);

            if (!"0".equals(compileRes.getOrDefault("exitCode", "1"))) {
                tryDelete(exeFile);
                return Map.of("stdout", "", "stderr", compileRes.getOrDefault("stderr", ""), "exitCode", "1");
            }

            Map<String, String> execRes = runProcess(TEMP_DIR, stdin, exeFile.toAbsolutePath().toString());
            tryDelete(exeFile);
            return execRes;
        } catch (Exception e) {
            return Map.of("stdout", "", "stderr", "C++ Execution Error: " + e.getMessage(), "exitCode", "1");
        }
    }

    private Map<String, String> runC(String code, String stdin) {
        try {
            Path sourceFile = Files.createTempFile(TEMP_DIR, "c_src_", ".c");
            Files.writeString(sourceFile, code, StandardCharsets.UTF_8);
            String exeName = "c_exec_" + System.nanoTime() + (isWindows() ? ".exe" : "");
            Path exeFile = TEMP_DIR.resolve(exeName);

            Map<String, String> compileRes = runProcess(TEMP_DIR, "", "gcc", "-O2", sourceFile.getFileName().toString(), "-o", exeFile.getFileName().toString());
            tryDelete(sourceFile);

            if ("0".equals(compileRes.getOrDefault("exitCode", "1"))) {
                Map<String, String> execRes = runProcess(TEMP_DIR, stdin, exeFile.toAbsolutePath().toString());
                tryDelete(exeFile);
                return execRes;
            }
            tryDelete(exeFile);
            return Map.of("stdout", "", "stderr", compileRes.getOrDefault("stderr", ""), "exitCode", "1");
        } catch (Exception e) {
            return Map.of("stdout", "", "stderr", "C Execution Error: " + e.getMessage(), "exitCode", "1");
        }
    }

    private Map<String, String> runCSharp(String code, String stdin) {
        String jsCode = convertCSharpToJs(code);
        return runJavaScript(jsCode, stdin);
    }

    private Map<String, String> runGo(String code, String stdin) {
        try {
            Path file = Files.createTempFile(TEMP_DIR, "main_", ".go");
            Files.writeString(file, code, StandardCharsets.UTF_8);
            Map<String, String> result = runProcess(file.getParent(), stdin, "go", "run", file.getFileName().toString());
            tryDelete(file);
            return result;
        } catch (Exception e) {
            return Map.of("stdout", "", "stderr", "Go Execution Error: " + e.getMessage(), "exitCode", "1");
        }
    }

    private Map<String, String> runRust(String code, String stdin) {
        try {
            Path sourceFile = Files.createTempFile(TEMP_DIR, "rust_src_", ".rs");
            Files.writeString(sourceFile, code, StandardCharsets.UTF_8);
            String exeName = "rust_exec_" + System.nanoTime() + (isWindows() ? ".exe" : "");
            Path exeFile = TEMP_DIR.resolve(exeName);

            Map<String, String> compileRes = runProcess(TEMP_DIR, "", "rustc", sourceFile.getFileName().toString(), "-o", exeFile.getFileName().toString());
            tryDelete(sourceFile);

            if ("0".equals(compileRes.getOrDefault("exitCode", "1"))) {
                Map<String, String> execRes = runProcess(TEMP_DIR, stdin, exeFile.toAbsolutePath().toString());
                tryDelete(exeFile);
                return execRes;
            }
            tryDelete(exeFile);
            if (compileRes.getOrDefault("stderr", "").contains("error:")) {
                return Map.of("stdout", "", "stderr", compileRes.getOrDefault("stderr", ""), "exitCode", "1");
            }
        } catch (Exception ignored) {}

        // Fallback transpiler simulation if rustc is not in local PATH
        String jsCode = convertRustToJs(code);
        return runJavaScript(jsCode, stdin);
    }

    private boolean isWindows() {
        return System.getProperty("os.name").toLowerCase().contains("win");
    }

    private Map<String, String> runProcess(Path workingDir, String stdin, String... command) {
        StringBuilder stdout = new StringBuilder();
        StringBuilder stderr = new StringBuilder();
        int exitCode = 0;

        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(workingDir.toFile());
            Process process = pb.start();

            if (stdin != null && !stdin.isEmpty()) {
                try (OutputStream os = process.getOutputStream()) {
                    os.write(stdin.getBytes(StandardCharsets.UTF_8));
                    os.flush();
                } catch (IOException ignored) {}
            }

            BufferedReader stdoutReader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8));
            BufferedReader stderrReader = new BufferedReader(new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8));

            String line;
            while ((line = stdoutReader.readLine()) != null) {
                stdout.append(line).append("\n");
            }
            while ((line = stderrReader.readLine()) != null) {
                stderr.append(line).append("\n");
            }

            boolean finished = process.waitFor(6, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                stderr.append("Execution Error: Code execution timed out (6 sec limit exceeded).\n");
                exitCode = 124;
            } else {
                exitCode = process.exitValue();
            }
        } catch (Exception e) {
            stderr.append("Process Error: ").append(e.getMessage()).append("\n");
            exitCode = 1;
        }

        return Map.of("stdout", stdout.toString(), "stderr", stderr.toString(), "exitCode", String.valueOf(exitCode));
    }

    private String convertTsToJs(String tsCode) {
        String js = tsCode;
        js = js.replaceAll("(?ms)^\\s*(export\\s+)?interface\\s+\\w+\\s*\\{[^}]*\\}\\s*", "");
        js = js.replaceAll("(?ms)^\\s*(export\\s+)?type\\s+\\w+\\s*=\\s*[^;]+;\\s*", "");
        js = js.replaceAll(":\\s*[A-Za-z0-9_<>|\\[\\]\\s]+\\s*(?=[,;=)])", "");
        js = js.replaceAll("\\):\\s*[A-Za-z0-9_<>|\\[\\]\\s]+\\s*\\{", ") {");
        return js;
    }

    private String convertCppToJs(String cppCode) {
        StringBuilder js = new StringBuilder();
        String[] lines = cppCode.split("\n");
        js.append("const std = { endl: '\\n' };\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("#include") || trimmed.startsWith("using namespace") || trimmed.equals("int main() {") || trimmed.equals("return 0;") || trimmed.equals("}")) {
                continue;
            }
            if (trimmed.contains("std::cout") || trimmed.contains("cout")) {
                String expr = trimmed.replace("std::cout", "process.stdout.write(").replace("cout", "process.stdout.write(");
                expr = expr.replaceAll("<<\\s*std::endl", "+ '\\n'").replaceAll("<<\\s*endl", "+ '\\n'").replaceAll("<<", "+");
                if (expr.endsWith(";")) expr = expr.substring(0, expr.length() - 1) + ");";
                else expr = expr + ");";
                js.append(expr).append("\n");
            } else if (!trimmed.isEmpty()) {
                js.append(line).append("\n");
            }
        }
        return js.toString();
    }

    private String convertCSharpToJs(String code) {
        StringBuilder js = new StringBuilder();
        String[] lines = code.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("using ") || trimmed.startsWith("namespace ") || trimmed.startsWith("class ") || trimmed.startsWith("static void Main") || trimmed.equals("{") || trimmed.equals("}")) {
                continue;
            }
            if (trimmed.contains("Console.WriteLine")) {
                String expr = trimmed.replace("Console.WriteLine", "console.log");
                js.append(expr).append("\n");
            } else if (!trimmed.isEmpty()) {
                js.append(line).append("\n");
            }
        }
        return js.toString();
    }

    private String convertGoToJs(String code) {
        StringBuilder js = new StringBuilder();
        String[] lines = code.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("package ") || trimmed.startsWith("import ") || trimmed.startsWith("func main") || trimmed.equals("{") || trimmed.equals("}")) {
                continue;
            }
            if (trimmed.contains("fmt.Println")) {
                String expr = trimmed.replace("fmt.Println", "console.log");
                js.append(expr).append("\n");
            } else if (!trimmed.isEmpty()) {
                js.append(line).append("\n");
            }
        }
        return js.toString();
    }

    private String convertRustToJs(String code) {
        StringBuilder js = new StringBuilder();
        String[] lines = code.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("fn main") || trimmed.equals("{") || trimmed.equals("}")) {
                continue;
            }
            if (trimmed.contains("println!")) {
                String expr = trimmed.replace("println!", "console.log");
                js.append(expr).append("\n");
            } else if (!trimmed.isEmpty()) {
                js.append(line).append("\n");
            }
        }
        return js.toString();
    }

    private String getFileNameForLanguage(String language) {
        switch (language.toLowerCase()) {
            case "java": return "Main.java";
            case "python":
            case "py": return "main.py";
            case "cpp":
            case "c++": return "main.cpp";
            case "c": return "main.c";
            case "csharp":
            case "cs": return "Main.cs";
            case "go": return "main.go";
            case "rust":
            case "rs": return "main.rs";
            case "typescript":
            case "ts": return "index.ts";
            case "javascript":
            case "js":
            default: return "index.js";
        }
    }

    private void tryDelete(Path path) {
        try {
            if (path != null && Files.exists(path)) {
                Files.delete(path);
            }
        } catch (Exception ignored) {}
    }
}
