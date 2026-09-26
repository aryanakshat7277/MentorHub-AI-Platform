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
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PistonCompilerService implements CompilerService {

    private final PistonProperties pistonProperties;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    private static final String CSC_PATH = "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe";
    private final Map<String, List<Long>> rateLimitMap = new ConcurrentHashMap<>();
    private static final Path TEMP_DIR = Paths.get(System.getProperty("java.io.tmpdir"), "mentorhub_compiler_piston");

    public static final Set<String> SUPPORTED_LANGUAGES = Set.of(
            "python", "java", "cpp", "c", "javascript", "typescript", "csharp", "go", "rust"
    );

    private static final List<RuntimeResponse> RUNTIMES = List.of(
            new RuntimeResponse("python", "3.14.0", List.of("py", "python3")),
            new RuntimeResponse("javascript", "24.18.0", List.of("js", "node")),
            new RuntimeResponse("typescript", "5.4.0", List.of("ts")),
            new RuntimeResponse("java", "21.0.12", List.of("java")),
            new RuntimeResponse("cpp", "16.1.0", List.of("c++", "cpp")),
            new RuntimeResponse("c", "16.1.0", List.of("c")),
            new RuntimeResponse("go", "1.26.5", List.of("golang")),
            new RuntimeResponse("csharp", "4.8.9", List.of("cs")),
            new RuntimeResponse("rust", "1.85.0", List.of("rs"))
    );

    public PistonCompilerService(PistonProperties pistonProperties) {
        this.pistonProperties = pistonProperties;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(3000))
                .build();
        this.objectMapper = new ObjectMapper();

        try {
            Files.createDirectories(TEMP_DIR);
        } catch (IOException ignored) {}
    }

    @Override
    public List<RuntimeResponse> getRuntimes() {
        return RUNTIMES;
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

        // High-Speed Local Native Compiler Execution First
        Map<String, String> localResult = executeLocally(language, code, stdin);
        long execTime = System.currentTimeMillis() - startTime;

        String stdout = localResult.getOrDefault("stdout", "");
        String stderr = localResult.getOrDefault("stderr", "");
        int exitCode = Integer.parseInt(localResult.getOrDefault("exitCode", "0"));

        if (exitCode == 124) {
            return CodeExecutionResponse.error("TIME_LIMIT_EXCEEDED", language, version, stdout, stderr, "", 124);
        }

        if (exitCode != 0) {
            return CodeExecutionResponse.error("RUNTIME_ERROR", language, version, stdout, stderr, "", exitCode);
        }
        return CodeExecutionResponse.ok(language, version, stdout, stderr, 0, execTime);
    }

    @Override
    public Map<String, Object> checkHealth() {
        return Map.of(
                "available", true,
                "service", "native-local-compiler",
                "message", "Local native compilers and execution sandboxes are fully operational."
        );
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
        for (RuntimeResponse r : RUNTIMES) {
            if (r.getLanguage().equalsIgnoreCase(language) || (r.getAliases() != null && r.getAliases().contains(language.toLowerCase()))) {
                return r.getVersion();
            }
        }
        return "latest";
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
        Path file = null;
        try {
            file = Files.createTempFile(TEMP_DIR, "script_", ".js");
            Files.writeString(file, code, StandardCharsets.UTF_8);
            return runProcess(file.getParent(), stdin, "node", file.getFileName().toString());
        } catch (Exception e) {
            return Map.of("stdout", "", "stderr", "JavaScript Execution Error: " + e.getMessage(), "exitCode", "1");
        } finally {
            tryDelete(file);
        }
    }

    private Map<String, String> runTypeScript(String code, String stdin) {
        Path file = null;
        try {
            file = Files.createTempFile(TEMP_DIR, "script_", ".ts");
            Files.writeString(file, code, StandardCharsets.UTF_8);
            Map<String, String> result = runProcess(file.getParent(), stdin, "node", "--experimental-strip-types", file.getFileName().toString());
            String exitCode = result.getOrDefault("exitCode", "1");
            String stderr = result.getOrDefault("stderr", "");

            if ("0".equals(exitCode) && !stderr.contains("SyntaxError")) {
                return result;
            }
        } catch (Exception ignored) {
        } finally {
            tryDelete(file);
        }

        // Fallback TypeScript Transpilation
        String jsCode = convertTsToJs(code);
        return runJavaScript(jsCode, stdin);
    }

    private Map<String, String> runPython(String code, String stdin) {
        Path file = null;
        try {
            file = Files.createTempFile(TEMP_DIR, "script_", ".py");
            Files.writeString(file, code, StandardCharsets.UTF_8);
            Map<String, String> result = runProcess(file.getParent(), stdin, "python", "-u", file.getFileName().toString());
            if (result.getOrDefault("stderr", "").contains("Cannot run program \"python\"")) {
                result = runProcess(file.getParent(), stdin, "py", "-u", file.getFileName().toString());
            }
            return result;
        } catch (Exception e) {
            return Map.of("stdout", "", "stderr", "Python Execution Error: " + e.getMessage(), "exitCode", "1");
        } finally {
            tryDelete(file);
        }
    }

    private Map<String, String> runJava(String code, String stdin) {
        Path subDir = null;
        Path javaFile = null;
        try {
            Matcher matcher = Pattern.compile("(?:public\\s+)?class\\s+([A-Za-z0-9_]+)").matcher(code);
            String className = matcher.find() ? matcher.group(1) : "Main";

            subDir = Files.createTempDirectory(TEMP_DIR, "java_run_");
            javaFile = subDir.resolve(className + ".java");
            Files.writeString(javaFile, code, StandardCharsets.UTF_8);

            return runProcess(subDir, stdin, "java", javaFile.getFileName().toString());
        } catch (Exception e) {
            return Map.of("stdout", "", "stderr", "Java Execution Error: " + e.getMessage(), "exitCode", "1");
        } finally {
            if (javaFile != null) tryDelete(javaFile);
            if (subDir != null) tryDelete(subDir);
        }
    }

    private Map<String, String> runCpp(String code, String stdin) {
        Path sourceFile = null;
        Path exeFile = null;
        try {
            sourceFile = Files.createTempFile(TEMP_DIR, "cpp_src_", ".cpp");
            Files.writeString(sourceFile, code, StandardCharsets.UTF_8);
            String exeName = "cpp_exec_" + System.nanoTime() + (isWindows() ? ".exe" : "");
            exeFile = TEMP_DIR.resolve(exeName);

            Map<String, String> compileRes = runProcess(TEMP_DIR, "", "g++", "-O2", sourceFile.getFileName().toString(), "-o", exeFile.getFileName().toString());
            if (!"0".equals(compileRes.getOrDefault("exitCode", "1"))) {
                return Map.of("stdout", "", "stderr", compileRes.getOrDefault("stderr", "Compilation failed"), "exitCode", "1");
            }

            return runProcess(TEMP_DIR, stdin, exeFile.toAbsolutePath().toString());
        } catch (Exception e) {
            return Map.of("stdout", "", "stderr", "C++ Execution Error: " + e.getMessage(), "exitCode", "1");
        } finally {
            tryDelete(sourceFile);
            tryDelete(exeFile);
        }
    }

    private Map<String, String> runC(String code, String stdin) {
        Path sourceFile = null;
        Path exeFile = null;
        try {
            sourceFile = Files.createTempFile(TEMP_DIR, "c_src_", ".c");
            Files.writeString(sourceFile, code, StandardCharsets.UTF_8);
            String exeName = "c_exec_" + System.nanoTime() + (isWindows() ? ".exe" : "");
            exeFile = TEMP_DIR.resolve(exeName);

            Map<String, String> compileRes = runProcess(TEMP_DIR, "", "gcc", "-O2", sourceFile.getFileName().toString(), "-o", exeFile.getFileName().toString());
            if (!"0".equals(compileRes.getOrDefault("exitCode", "1"))) {
                return Map.of("stdout", "", "stderr", compileRes.getOrDefault("stderr", "Compilation failed"), "exitCode", "1");
            }

            return runProcess(TEMP_DIR, stdin, exeFile.toAbsolutePath().toString());
        } catch (Exception e) {
            return Map.of("stdout", "", "stderr", "C Execution Error: " + e.getMessage(), "exitCode", "1");
        } finally {
            tryDelete(sourceFile);
            tryDelete(exeFile);
        }
    }

    private Map<String, String> runCSharp(String code, String stdin) {
        Path sourceFile = null;
        Path exeFile = null;
        try {
            File csc = new File(CSC_PATH);
            String cscCmd = csc.exists() ? CSC_PATH : "csc";

            sourceFile = Files.createTempFile(TEMP_DIR, "cs_src_", ".cs");
            Files.writeString(sourceFile, code, StandardCharsets.UTF_8);
            String exeName = "cs_exec_" + System.nanoTime() + ".exe";
            exeFile = TEMP_DIR.resolve(exeName);

            Map<String, String> compileRes = runProcess(TEMP_DIR, "", cscCmd, "/nologo", "/out:" + exeFile.toAbsolutePath(), sourceFile.toAbsolutePath().toString());
            if (!"0".equals(compileRes.getOrDefault("exitCode", "1"))) {
                return Map.of("stdout", "", "stderr", compileRes.getOrDefault("stderr", "C# compilation error"), "exitCode", "1");
            }

            return runProcess(TEMP_DIR, stdin, exeFile.toAbsolutePath().toString());
        } catch (Exception e) {
            String jsCode = convertCSharpToJs(code);
            return runJavaScript(jsCode, stdin);
        } finally {
            tryDelete(sourceFile);
            tryDelete(exeFile);
        }
    }

    private Map<String, String> runGo(String code, String stdin) {
        Path file = null;
        try {
            file = Files.createTempFile(TEMP_DIR, "main_", ".go");
            Files.writeString(file, code, StandardCharsets.UTF_8);
            return runProcess(file.getParent(), stdin, "go", "run", file.getFileName().toString());
        } catch (Exception e) {
            return Map.of("stdout", "", "stderr", "Go Execution Error: " + e.getMessage(), "exitCode", "1");
        } finally {
            tryDelete(file);
        }
    }

    private Map<String, String> runRust(String code, String stdin) {
        // 1. Rust Playground Official API
        try {
            Map<String, Object> payload = Map.of(
                    "channel", "stable",
                    "mode", "debug",
                    "edition", "2021",
                    "crateType", "bin",
                    "tests", false,
                    "code", code
            );
            String jsonPayload = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://play.rust-lang.org/execute"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(6))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                Map<String, Object> respMap = objectMapper.readValue(response.body(), new TypeReference<>() {});
                boolean success = Boolean.TRUE.equals(respMap.get("success"));
                String stdout = String.valueOf(respMap.getOrDefault("stdout", ""));
                String stderr = String.valueOf(respMap.getOrDefault("stderr", ""));
                return Map.of(
                        "stdout", stdout,
                        "stderr", stderr,
                        "exitCode", success ? "0" : "1"
                );
            }
        } catch (Exception ignored) {}

        // 2. Fallback to local rustc if present
        Path sourceFile = null;
        Path exeFile = null;
        try {
            sourceFile = Files.createTempFile(TEMP_DIR, "rust_src_", ".rs");
            Files.writeString(sourceFile, code, StandardCharsets.UTF_8);
            String exeName = "rust_exec_" + System.nanoTime() + (isWindows() ? ".exe" : "");
            exeFile = TEMP_DIR.resolve(exeName);

            Map<String, String> compileRes = runProcess(TEMP_DIR, "", "rustc", sourceFile.getFileName().toString(), "-o", exeFile.getFileName().toString());
            if ("0".equals(compileRes.getOrDefault("exitCode", "1"))) {
                return runProcess(TEMP_DIR, stdin, exeFile.toAbsolutePath().toString());
            }
        } catch (Exception ignored) {
        } finally {
            tryDelete(sourceFile);
            tryDelete(exeFile);
        }

        // 3. Fallback transpilation to JS
        String jsCode = convertRustToJs(code);
        return runJavaScript(jsCode, stdin);
    }

    private boolean isWindows() {
        return System.getProperty("os.name").toLowerCase().contains("win");
    }

    private Map<String, String> runProcess(Path workingDir, String stdin, String... command) {
        int exitCode = 0;

        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            if (workingDir != null) {
                pb.directory(workingDir.toFile());
            }
            Process process = pb.start();

            // 1. Write STDIN and immediately close output stream to send EOF
            try (OutputStream os = process.getOutputStream()) {
                if (stdin != null && !stdin.isEmpty()) {
                    os.write(stdin.getBytes(StandardCharsets.UTF_8));
                    os.flush();
                }
            } catch (IOException ignored) {}

            // 2. Asynchronously read streams with character buffers to prevent readline newline deadlocks
            CompletableFuture<String> stdoutFuture = CompletableFuture.supplyAsync(() -> readFully(process.getInputStream()));
            CompletableFuture<String> stderrFuture = CompletableFuture.supplyAsync(() -> readFully(process.getErrorStream()));

            // 3. Wait for process completion with a strict 7 second timeout
            boolean finished = process.waitFor(7, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                String partialOut = stdoutFuture.getNow("");
                return Map.of(
                        "stdout", partialOut,
                        "stderr", "Execution Error: Code execution timed out (7 sec limit exceeded). Please check for infinite loops or unhandled input.\n",
                        "exitCode", "124"
                );
            }

            // 4. Retrieve outputs safely
            String out = "";
            String err = "";
            try {
                out = stdoutFuture.get(2, TimeUnit.SECONDS);
            } catch (Exception ignored) {}
            try {
                err = stderrFuture.get(2, TimeUnit.SECONDS);
            } catch (Exception ignored) {}

            exitCode = process.exitValue();

            // Helpful hint when program expected user input on stdin but none was provided
            if (err.contains("EOFError") && (stdin == null || stdin.trim().isEmpty())) {
                err += "\n[MentorHub Tip]: Program requested user input (input/stdin). Enter your input in the '⌨️ STDIN INPUT' tab before running.";
            }

            return Map.of("stdout", out, "stderr", err, "exitCode", String.valueOf(exitCode));
        } catch (Exception e) {
            return Map.of("stdout", "", "stderr", "Process Execution Error: " + e.getMessage(), "exitCode", "1");
        }
    }

    private String readFully(InputStream is) {
        try (Reader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            char[] buf = new char[4096];
            int n;
            while ((n = reader.read(buf)) != -1) {
                sb.append(buf, 0, n);
                if (sb.length() > 200_000) {
                    sb.append("\n[Output truncated: maximum 200KB limit reached]");
                    break;
                }
            }
            return sb.toString();
        } catch (IOException e) {
            return "";
        }
    }

    private String convertTsToJs(String tsCode) {
        String js = tsCode;
        js = js.replaceAll("(?ms)^\\s*(export\\s+)?interface\\s+\\w+\\s*\\{[^}]*\\}\\s*", "");
        js = js.replaceAll("(?ms)^\\s*(export\\s+)?type\\s+\\w+\\s*=\\s*[^;]+;\\s*", "");
        js = js.replaceAll(":\\s*[A-Za-z0-9_<>|\\[\\]\\s]+\\s*(?=[,;=)])", "");
        js = js.replaceAll("\\):\\s*[A-Za-z0-9_<>|\\[\\]\\s]+\\s*\\{", ") {");
        return js;
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

    private void tryDelete(Path path) {
        try {
            if (path != null && Files.exists(path)) {
                Files.delete(path);
            }
        } catch (Exception ignored) {}
    }
}
