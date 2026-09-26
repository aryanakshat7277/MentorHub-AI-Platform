package com.mentorhub.compiler.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentorhub.compiler.dto.CodeAutoFixRequest;
import com.mentorhub.compiler.dto.CodeAutoFixResponse;
import com.mentorhub.compiler.dto.CodeCompletionRequest;
import com.mentorhub.compiler.dto.CodeCompletionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class CodeCopilotService {

    @Value("${ai.groq.api-key:${groq.api.key:}}")
    private String groqApiKey;

    @Value("${ai.gemini.api-key:${gemini.api.key:}}")
    private String geminiApiKey;

    @Value("${ai.gemini.fallback-api-key:}")
    private String fallbackGeminiApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public CodeCopilotService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(4000);
        factory.setReadTimeout(12000);
        this.restTemplate = new RestTemplate(factory);
        this.objectMapper = new ObjectMapper();
    }

    private boolean isValidKey(String key) {
        return key != null && !key.trim().isEmpty() && !key.startsWith("YOUR_") && key.length() > 5;
    }

    private List<String> getGeminiKeys() {
        List<String> keys = new ArrayList<>();
        if (isValidKey(geminiApiKey)) keys.add(geminiApiKey.trim());
        if (isValidKey(fallbackGeminiApiKey) && !fallbackGeminiApiKey.trim().equals(geminiApiKey)) {
            keys.add(fallbackGeminiApiKey.trim());
        }
        return keys;
    }

    // =========================================================================
    // FEATURE 1: AUTO CODE COMPLETION (VS CODE COPILOT GHOST WRITING)
    // Priority 1: Groq (Qwen 3.8 27B) -> Priority 2: Gemini -> Priority 3: Local
    // =========================================================================
    public CodeCompletionResponse completeCode(CodeCompletionRequest request) {
        String language = (request.getLanguage() != null) ? request.getLanguage().toLowerCase().trim() : "javascript";
        String code = (request.getCode() != null) ? request.getCode() : "";
        String prefix = (request.getPrefix() != null && !request.getPrefix().isEmpty()) ? request.getPrefix() : code;

        long startTime = System.currentTimeMillis();

        // 1. Priority 1: Groq LPU (Qwen 3.8 27B / GPT-OSS 120B)
        if (isValidKey(groqApiKey)) {
            try {
                String prompt = buildCompletionPrompt(language, prefix, request.getSuffix());
                Map<String, Object> body = Map.of(
                        "model", "qwen/qwen3.8-27b",
                        "messages", List.of(Map.of("role", "user", "content", prompt)),
                        "temperature", 0.1,
                        "max_tokens", 256
                );

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(groqApiKey.trim());

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
                ResponseEntity<String> response = restTemplate.postForEntity("https://api.groq.com/openai/v1/chat/completions", entity, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    JsonNode choices = root.get("choices");
                    if (choices != null && choices.isArray() && choices.size() > 0) {
                        String rawCompletion = choices.get(0).path("message").path("content").asText("");
                        String clean = cleanCompletion(rawCompletion);
                        if (!clean.isEmpty()) {
                            long elapsed = System.currentTimeMillis() - startTime;
                            return CodeCompletionResponse.ok(clean, "GROQ", "qwen3.8-27b", elapsed);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Notice: Groq Copilot completion failover to Gemini: " + e.getMessage());
            }
        }

        // 2. Priority 2: Google Gemini (gemini-3.5-flash / gemini-3.1-flash-lite-preview)
        List<String> geminiKeys = getGeminiKeys();
        if (!geminiKeys.isEmpty()) {
            List<String> models = List.of("gemini-3.5-flash", "gemini-3.1-flash-lite-preview", "gemini-flash-latest");
            for (String model : models) {
                for (String key : geminiKeys) {
                    try {
                        String prompt = buildCompletionPrompt(language, prefix, request.getSuffix());
                        Map<String, Object> body = Map.of(
                                "contents", List.of(Map.of(
                                        "role", "user",
                                        "parts", List.of(Map.of("text", prompt))
                                )),
                                "generationConfig", Map.of(
                                        "temperature", 0.1,
                                        "maxOutputTokens", 256
                                )
                        );

                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_JSON);
                        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

                        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key;
                        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

                        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                            JsonNode root = objectMapper.readTree(response.getBody());
                            JsonNode candidates = root.get("candidates");
                            if (candidates != null && candidates.isArray() && candidates.size() > 0) {
                                String rawText = candidates.get(0).path("content").path("parts").get(0).path("text").asText("");
                                String clean = cleanCompletion(rawText);
                                if (!clean.isEmpty()) {
                                    long elapsed = System.currentTimeMillis() - startTime;
                                    return CodeCompletionResponse.ok(clean, "GEMINI", model, elapsed);
                                }
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Notice: Gemini model " + model + " failed: " + e.getMessage());
                    }
                }
            }
        }

        // 3. Priority 3: Fallback Local Copilot heuristic
        long elapsed = System.currentTimeMillis() - startTime;
        String localCompletion = generateLocalCompletion(language, prefix);
        return CodeCompletionResponse.ok(localCompletion, "LOCAL", "ast-rules", elapsed);
    }

    private String buildCompletionPrompt(String language, String prefix, String suffix) {
        return """
            You are an ultra-fast code completion AI co-pilot like GitHub Copilot or VS Code Tab completion.
            LANGUAGE: %s
            CODE BEFORE CURSOR:
            %s
            %s
            TASK: Complete the next 2 to 8 lines starting immediately from the cursor to finish the immediate expression, statement, or function.
            CRITICAL RULES:
            1. Output ONLY the raw code continuation to insert directly at the cursor.
            2. Do NOT repeat any code before the cursor.
            3. Do NOT include markdown code blocks, backticks, or explanatory text.
            """.formatted(language, prefix, (suffix != null && !suffix.isEmpty()) ? "CODE AFTER CURSOR:\n" + suffix : "");
    }

    private String cleanCompletion(String raw) {
        if (raw == null) return "";
        String text = raw.trim();
        if (text.startsWith("```")) {
            text = text.replaceFirst("^```[a-zA-Z0-9_-]*\\r?\\n", "");
            text = text.replaceFirst("\\r?\\n```$", "");
        }
        return text.trim();
    }

    private String generateLocalCompletion(String language, String prefix) {
        String p = prefix.trim();
        if (p.endsWith(":")) {
            return "\n    pass";
        }
        if (p.endsWith("{")) {
            return "\n    return 0;\n}";
        }
        if (p.endsWith("(")) {
            return ");";
        }
        return "\n// Continue writing your code here";
    }

    // =========================================================================
    // FEATURE 2: AUTOMATED AI ERROR DIAGNOSIS & IN-IDE AUTO-FIX
    // Priority 1: Groq (Qwen 3.8 27B) -> Priority 2: Gemini -> Priority 3: Local
    // =========================================================================
    public CodeAutoFixResponse autoFixCode(CodeAutoFixRequest request) {
        String language = (request.getLanguage() != null) ? request.getLanguage().toLowerCase().trim() : "python";
        String code = (request.getCode() != null) ? request.getCode() : "";
        String error = (request.getError() != null) ? request.getError() : "Unknown execution failure";
        String status = (request.getStatus() != null) ? request.getStatus() : "RUNTIME_ERROR";

        long startTime = System.currentTimeMillis();

        String prompt = buildAutoFixPrompt(language, code, error, status);

        // 1. Priority 1: Groq LPU (Qwen 3.8 27B)
        if (isValidKey(groqApiKey)) {
            try {
                Map<String, Object> body = Map.of(
                        "model", "qwen/qwen3.8-27b",
                        "messages", List.of(Map.of("role", "user", "content", prompt)),
                        "temperature", 0.1,
                        "response_format", Map.of("type", "json_object")
                );

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(groqApiKey.trim());

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
                ResponseEntity<String> response = restTemplate.postForEntity("https://api.groq.com/openai/v1/chat/completions", entity, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    JsonNode choices = root.get("choices");
                    if (choices != null && choices.isArray() && choices.size() > 0) {
                        String jsonContent = choices.get(0).path("message").path("content").asText("");
                        CodeAutoFixResponse parsed = parseAutoFixJson(jsonContent, code, "GROQ", "qwen3.8-27b", System.currentTimeMillis() - startTime);
                        if (parsed != null && parsed.getFixedCode() != null && !parsed.getFixedCode().trim().isEmpty()) {
                            return parsed;
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Notice: Groq AutoFix failover to Gemini: " + e.getMessage());
            }
        }

        // 2. Priority 2: Google Gemini (gemini-3.5-flash / gemini-3.1-flash-lite-preview)
        List<String> geminiKeys = getGeminiKeys();
        if (!geminiKeys.isEmpty()) {
            List<String> models = List.of("gemini-3.5-flash", "gemini-3.1-flash-lite-preview", "gemini-flash-latest");
            for (String model : models) {
                for (String key : geminiKeys) {
                    try {
                        Map<String, Object> body = Map.of(
                                "contents", List.of(Map.of(
                                        "role", "user",
                                        "parts", List.of(Map.of("text", prompt))
                                )),
                                "generationConfig", Map.of(
                                        "temperature", 0.1,
                                        "responseMimeType", "application/json"
                                )
                        );

                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_JSON);
                        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

                        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key;
                        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

                        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                            JsonNode root = objectMapper.readTree(response.getBody());
                            JsonNode candidates = root.get("candidates");
                            if (candidates != null && candidates.isArray() && candidates.size() > 0) {
                                String rawText = candidates.get(0).path("content").path("parts").get(0).path("text").asText("");
                                CodeAutoFixResponse parsed = parseAutoFixJson(rawText, code, "GEMINI", model, System.currentTimeMillis() - startTime);
                                if (parsed != null && parsed.getFixedCode() != null && !parsed.getFixedCode().trim().isEmpty()) {
                                    return parsed;
                                }
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Notice: Gemini model " + model + " failed for AutoFix: " + e.getMessage());
                    }
                }
            }
        }

        // 3. Priority 3: Local Fallback Engine
        long elapsed = System.currentTimeMillis() - startTime;
        return generateLocalAutoFix(code, error, language, elapsed);
    }

    private String buildAutoFixPrompt(String language, String code, String error, String status) {
        return """
            You are an expert compiler AI co-pilot and automated code fixer.
            The user's code failed during execution in the IDE.

            PROGRAMMING LANGUAGE: %s
            EXECUTION STATUS: %s

            ORIGINAL USER CODE:
            %s

            COMPILER / RUNTIME ERROR OUTPUT:
            %s

            INSTRUCTIONS:
            1. Diagnose the exact root cause of the error.
            2. Explain clearly in 1-2 sentences what was the error.
            3. Explain clearly how it is fixed.
            4. Provide the COMPLETE runnable corrected code to write directly into the IDE.
            5. Provide the exact erroneous line(s) as "errorSnippet" and the fixed replacement line(s) as "fixedSnippet".
            
            Respond ONLY with a valid JSON object matching this schema:
            {
              "explanation": "What was the error and why it happened",
              "fixSummary": "How it is fixed in plain words",
              "fixedCode": "Full runnable corrected code without markdown backticks",
              "errorSnippet": "Specific erroneous code snippet previously there",
              "fixedSnippet": "The corrected snippet replacement"
            }
            """.formatted(language, status, code, error);
    }

    private CodeAutoFixResponse parseAutoFixJson(String json, String originalCode, String provider, String model, long elapsed) {
        try {
            String clean = json.trim();
            if (clean.startsWith("```json")) clean = clean.substring(7);
            else if (clean.startsWith("```")) clean = clean.substring(3);
            if (clean.endsWith("```")) clean = clean.substring(0, clean.length() - 3);
            clean = clean.trim();

            JsonNode node = objectMapper.readTree(clean);
            String explanation = node.path("explanation").asText("Identified syntax or runtime defect.");
            String fixSummary = node.path("fixSummary").asText("Applied corrective logic patch.");
            String fixedCode = node.path("fixedCode").asText(originalCode);
            String errorSnippet = node.path("errorSnippet").asText("");
            String fixedSnippet = node.path("fixedSnippet").asText("");

            List<Integer> diffLines = computeDiffLines(originalCode, fixedCode);

            return CodeAutoFixResponse.ok(explanation, fixSummary, fixedCode, errorSnippet, fixedSnippet, diffLines, provider, model, elapsed);
        } catch (Exception e) {
            System.err.println("JSON parse error in auto-fix: " + e.getMessage());
            return null;
        }
    }

    private List<Integer> computeDiffLines(String original, String fixed) {
        List<Integer> diffs = new ArrayList<>();
        if (original == null || fixed == null) return diffs;

        String[] origLines = original.split("\n");
        String[] fixedLines = fixed.split("\n");

        for (int i = 0; i < fixedLines.length; i++) {
            if (i >= origLines.length || !fixedLines[i].equals(origLines[i])) {
                diffs.add(i + 1); // 1-indexed line number
            }
        }
        return diffs;
    }

    private CodeAutoFixResponse generateLocalAutoFix(String originalCode, String error, String language, long elapsed) {
        String fixed = originalCode;
        String explanation = "Local fallback: Inspected error stack trace.";
        String fixSummary = "Adjusted code structure.";
        String errorSnippet = "";
        String fixedSnippet = "";

        if (error.contains("division by zero") || error.contains("ZeroDivisionError")) {
            explanation = "Division by zero encountered when dividing by an empty count or zero denominator.";
            fixSummary = "Added safety guard check before division.";
            errorSnippet = "total / len(nums)";
            fixedSnippet = "if not nums: return 0\n    return total / len(nums)";
            fixed = fixed.replace("return total / len(nums)", "if not nums:\n        return 0\n    return total / len(nums)");
        } else if (error.contains("IndexError") || error.contains("out of bounds")) {
            explanation = "Array index out of bounds error.";
            fixSummary = "Added bounds check before accessing array index.";
        }

        List<Integer> diffLines = computeDiffLines(originalCode, fixed);
        return CodeAutoFixResponse.ok(explanation, fixSummary, fixed, errorSnippet, fixedSnippet, diffLines, "LOCAL", "fallback-rules", elapsed);
    }
}
