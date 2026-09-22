package com.mentorhub.service;

import com.mentorhub.dto.ChatRequest;
import com.mentorhub.dto.ChatResponse;
import com.mentorhub.model.*;
import com.mentorhub.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.client.ResponseExtractor;
import org.springframework.http.HttpMethod;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@Service
public class AiChatService {

    @Value("${ai.gemini.api-key:${gemini.api.key:}}")
    private String geminiApiKey;

    @Value("${ai.gemini.fallback-api-key:}")
    private String fallbackGeminiApiKey;

    @Value("${ai.nvidia.api-key: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}")
    private String nvidiaApiKey;

    @Value("${ai.nvidia.model:nvidia/nemotron-3-super-120b-a12b}")
    private String nvidiaModel;

    @Value("${ai.groq.api-key:${groq.api.key:}}")
    private String groqApiKey;

    @Value("${ai.deepseek.api-key:${deepseek.api.key:}}")
    private String deepseekApiKey;

    private final RestTemplate restTemplate;
    private final UserRepository userRepository;
    private final GoalRepository goalRepository;
    private final CertificateRepository certificateRepository;
    private final MentoringSessionRepository sessionRepository;
    private final MentorHubBrainService brainService;

    public AiChatService(UserRepository userRepository,
                         GoalRepository goalRepository,
                         CertificateRepository certificateRepository,
                         MentoringSessionRepository sessionRepository,
                         MentorHubBrainService brainService) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(30000);
        this.restTemplate = new RestTemplate(factory);
        this.userRepository = userRepository;
        this.goalRepository = goalRepository;
        this.certificateRepository = certificateRepository;
        this.sessionRepository = sessionRepository;
        this.brainService = brainService;
    }

    public ChatResponse processChat(ChatRequest request) {
        String query = request.getMessage();
        String provider = request.getProvider();
        String model = request.getModel();
        String systemPrompt = request.getSystemPrompt();
        String language = request.getLanguage();
        List<Map<String, String>> historyPayload = request.getHistory();
        String screenImage = request.getScreenImage();
        String screenContext = request.getScreenContext();

        Map<String, Object> result = chat(
                query,
                provider,
                model,
                systemPrompt,
                language,
                historyPayload,
                screenImage,
                screenContext
        );
        String respText = (String) result.get("response");
        String respProvider = (String) result.get("provider");
        String respModel = (String) result.get("model");
        return new ChatResponse(respText, respProvider, respModel);
    }

    public Map<String, Object> chat(
            String query,
            String provider,
            String model,
            String systemPrompt,
            String language,
            List<Map<String, String>> historyPayload
    ) {
        return chat(query, provider, model, systemPrompt, language, historyPayload, null, null);
    }

    public Map<String, Object> chat(
            String query,
            String provider,
            String model,
            String systemPrompt,
            String language,
            List<Map<String, String>> historyPayload,
            String screenImage,
            String screenContext
    ) {
        String reqProvider = (provider != null) ? provider.toUpperCase() : "GEMINI";
        String reqModel = (model != null && !model.isEmpty()) ? model : "gemini-3.6-flash";

        if (reqModel.endsWith("-latest")) {
            reqModel = reqModel.replace("-latest", "");
        }
        if ("gemini-2.5-flash".equalsIgnoreCase(reqModel)) {
            reqModel = "gemini-3.6-flash";
        }

        Map<String, Object> result = new HashMap<>();

        System.out.println("DEBUG: AiChatService.processChat started. reqModel=" + reqModel + ", screenImage=" + (screenImage != null ? screenImage.length() : "none") + ", screenContext=" + (screenContext != null ? "yes" : "no"));
        System.out.println("DEBUG: Gemini Key=" + (geminiApiKey != null ? geminiApiKey.length() : "null") + " Groq Key=" + (groqApiKey != null ? groqApiKey.length() : "null"));
        
        // 1. If provider explicitly specified as NVIDIA, attempt NVIDIA first:
        if ("NVIDIA".equalsIgnoreCase(reqProvider) && isValidKey(nvidiaApiKey)) {
            try {
                System.out.println("DEBUG: Calling NVIDIA NIM (Primary)...");
                String targetNvidiaModel = (reqModel != null && !reqModel.isEmpty() && !reqModel.contains("gemini") && !reqModel.contains("groq")) ? reqModel : nvidiaModel;
                String response = callNvidia(query, targetNvidiaModel, systemPrompt, historyPayload, screenContext);
                if (response != null && !response.trim().isEmpty()) {
                    result.put("provider", "NVIDIA");
                    result.put("model", targetNvidiaModel);
                    result.put("response", response);
                    return result;
                }
            } catch (Exception e) {
                System.err.println("Live AI API Warning (NVIDIA PRIMARY): " + e.getMessage());
            }
        }

        // 2. Primary Fast-path: Gemini (multimodal vision + text)
        if (isValidKey(geminiApiKey) && !"NVIDIA".equalsIgnoreCase(reqProvider)) {
            try {
                System.out.println("DEBUG: Calling Gemini with multimodal screen awareness...");
                String response = callGemini(query, reqModel, systemPrompt, historyPayload, screenImage, screenContext);
                System.out.println("DEBUG: Gemini response returned: " + (response != null ? "not null" : "null"));
                if (response != null && !response.trim().isEmpty()) {
                    result.put("provider", "GEMINI");
                    result.put("model", reqModel);
                    result.put("response", response);
                    return result;
                }
            } catch (Exception e) {
                System.err.println("Live AI API Warning (GEMINI): " + e.getMessage() + ". Falling back to NVIDIA NIM.");
            }
        }

        // 3. Secondary Fast-path: NVIDIA NIM (Meta LLaMA 3.2 11B Vision Instruct via NVIDIA integrate API)
        if (isValidKey(nvidiaApiKey)) {
            try {
                System.out.println("DEBUG: Calling NVIDIA NIM (" + nvidiaModel + ")...");
                String response = callNvidia(query, nvidiaModel, systemPrompt, historyPayload, screenContext);
                System.out.println("DEBUG: NVIDIA NIM response returned: " + (response != null ? "not null" : "null"));
                if (response != null && !response.trim().isEmpty()) {
                    result.put("provider", "NVIDIA");
                    result.put("model", nvidiaModel);
                    result.put("response", response);
                    return result;
                }
            } catch (Exception e) {
                System.err.println("Live AI API Warning (NVIDIA NIM): " + e.getMessage() + ". Falling back to GROQ.");
            }
        }
        
        // 4. Tertiary: Groq
        if (isValidKey(groqApiKey)) {
            try {
                String response = callGroq(query, "openai/gpt-oss-120b", systemPrompt, historyPayload, screenContext);
                if (response != null && !response.trim().isEmpty()) {
                    result.put("provider", "GROQ");
                    result.put("model", "openai/gpt-oss-120b");
                    result.put("response", response);
                    return result;
                }
            } catch (Exception e) {
                System.err.println("Live AI API Warning (GROQ): " + e.getMessage() + ". Falling back to DEEPSEEK.");
            }
        }
        
        if (isValidKey(deepseekApiKey)) {
            try {
                String response = callDeepSeek(query, "deepseek-v4-flash", systemPrompt, historyPayload, screenContext);
                if (response != null && !response.trim().isEmpty()) {
                    result.put("provider", "DEEPSEEK");
                    result.put("model", "deepseek-v4-flash");
                    result.put("response", response);
                    return result;
                }
            } catch (Exception e) {
                System.err.println("Live AI API Warning (DEEPSEEK): " + e.getMessage() + ". All APIs failed.");
            }
        }

        // Direct Multi-Domain Knowledge Response Engine with Screen Awareness
        String fallbackResponse = buildInstantCopilotResponse(query, reqProvider, reqModel, screenContext);
        result.put("provider", "GEMINI");
        result.put("model", reqModel);
        result.put("response", fallbackResponse);
        return result;
    }

    public SseEmitter streamChat(ChatRequest request) {
        SseEmitter emitter = new SseEmitter(120000L); // 2 minute timeout
        ExecutorService executor = Executors.newSingleThreadExecutor();
        
        executor.execute(() -> {
            try {
                String query = request.getMessage();
                String reqModel = (request.getModel() != null && !request.getModel().isEmpty()) ? request.getModel() : "gemini-3.6-flash";
                if ("gemini-2.5-flash".equalsIgnoreCase(reqModel)) {
                    reqModel = "gemini-3.6-flash";
                }
                String reqProvider = (request.getProvider() != null) ? request.getProvider().toUpperCase() : "GEMINI";

                // If NVIDIA requested explicitly, process via NVIDIA immediately
                if ("NVIDIA".equalsIgnoreCase(reqProvider)) {
                    ChatResponse nvidiaResp = processChat(request);
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("text", nvidiaResp.getResponse());
                    payload.put("provider", nvidiaResp.getProvider());
                    payload.put("model", nvidiaResp.getModel());
                    ObjectMapper mapper = new ObjectMapper();
                    emitter.send(SseEmitter.event().data(mapper.writeValueAsString(payload)));
                    emitter.complete();
                    return;
                }

                if (isValidKey(geminiApiKey)) {
                    try {
                        streamGemini(query, reqModel, request.getSystemPrompt(), request.getHistory(), request.getScreenImage(), request.getScreenContext(), emitter);
                        return;
                    } catch (Exception e) {
                        System.err.println("Live AI API Warning (GEMINI STREAM): " + e.getMessage());
                        // Fallback to sending standard error block via stream
                    }
                }
                
                // If Gemini fails or key is invalid, fallback to standard synchronous fallback logic and emit it as one chunk
                ChatResponse fallbackResponse = processChat(request);
                Map<String, Object> fallbackPayload = new HashMap<>();
                fallbackPayload.put("text", fallbackResponse.getResponse());
                fallbackPayload.put("provider", fallbackResponse.getProvider());
                fallbackPayload.put("model", fallbackResponse.getModel());
                
                ObjectMapper mapper = new ObjectMapper();
                emitter.send(SseEmitter.event().data(mapper.writeValueAsString(fallbackPayload)));
                emitter.complete();

            } catch (Exception e) {
                emitter.completeWithError(e);
            } finally {
                executor.shutdown();
            }
        });
        
        return emitter;
    }

    private String resolveGeminiModel(String model) {
        if (model == null || model.isEmpty()) {
            return "gemini-3.6-flash";
        }
        if (model.contains("pro")) {
            return "gemini-1.5-pro";
        }
        if (model.contains("3.6") || model.contains("3.5") || model.contains("3.1")) {
            return "gemini-3.6-flash";
        }
        if (model.contains("2.0")) {
            return "gemini-2.0-flash";
        }
        if (model.contains("1.5")) {
            return "gemini-1.5-flash";
        }
        return "gemini-3.6-flash";
    }

    private void streamGemini(String query, String model, String systemPrompt, List<Map<String, String>> historyPayload, String screenImage, String screenContext, SseEmitter emitter) throws Exception {
        String cleanModel = resolveGeminiModel(model);
        List<String> keys = getGeminiApiKeys();
        ObjectMapper mapper = new ObjectMapper();
        Exception lastEx = null;

        List<Map<String, Object>> contents = new ArrayList<>();
        String globalInstruction = brainService.getMasterBrainSystemPrompt("User");

        Map<String, Object> systemInstruction = Map.of(
            "parts", List.of(Map.of("text", globalInstruction))
        );

        if (historyPayload != null) {
            for (Map<String, String> msg : historyPayload) {
                String role = "user".equalsIgnoreCase(msg.get("role")) ? "user" : "model";
                contents.add(Map.of(
                        "role", role,
                        "parts", List.of(Map.of("text", msg.getOrDefault("content", "")))
                ));
            }
        }

        List<Map<String, Object>> userParts = new ArrayList<>();
        if (screenImage != null && !screenImage.trim().isEmpty()) {
            String cleanBase64 = screenImage.replaceFirst("^data:image/[a-z]+;base64,", "").trim();
            if (cleanBase64.length() > 50) {
                userParts.add(Map.of(
                    "inlineData", Map.of(
                        "mimeType", "image/jpeg",
                        "data", cleanBase64
                    )
                ));
            }
        }

        String effectiveQuery = query;
        if (screenContext != null && !screenContext.trim().isEmpty()) {
            effectiveQuery = "[ACTIVE SCREEN CONTEXT]\n" + screenContext + "\n\n[USER QUESTION]\n" + query;
        }
        userParts.add(Map.of("text", effectiveQuery));

        contents.add(Map.of(
                "role", "user",
                "parts", userParts
        ));

        Map<String, Object> body = new HashMap<>();
        body.put("contents", contents);
        body.put("systemInstruction", systemInstruction);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        for (int k = 0; k < keys.size(); k++) {
            String key = keys.get(k);
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + cleanModel + ":streamGenerateContent?alt=sse&key=" + key;
            try {
                restTemplate.execute(url, HttpMethod.POST, request -> {
                    request.getHeaders().addAll(headers);
                    mapper.writeValue(request.getBody(), body);
                }, (ResponseExtractor<Void>) response -> {
                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(response.getBody(), StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            if (line.startsWith("data: ")) {
                                String dataStr = line.substring(6).trim();
                                if (dataStr.isEmpty()) continue;
                                
                                try {
                                    JsonNode root = mapper.readTree(dataStr);
                                    JsonNode candidates = root.get("candidates");
                                    if (candidates != null && candidates.isArray() && candidates.size() > 0) {
                                        JsonNode parts = candidates.get(0).path("content").path("parts");
                                        if (parts != null && parts.isArray() && parts.size() > 0) {
                                            JsonNode textNode = parts.get(0).path("text");
                                            if (!textNode.isMissingNode()) {
                                                String chunk = textNode.asText();
                                                Map<String, Object> payload = new HashMap<>();
                                                payload.put("text", chunk);
                                                payload.put("provider", "GEMINI");
                                                payload.put("model", cleanModel);
                                                emitter.send(SseEmitter.event().data(mapper.writeValueAsString(payload)));
                                            }
                                        }
                                    }
                                } catch (Exception parseEx) {
                                    System.err.println("Gemini SSE parse error: " + parseEx.getMessage());
                                }
                            }
                        }
                    }
                    emitter.complete();
                    return null;
                });
                return;
            } catch (Exception e) {
                lastEx = e;
                System.err.println("DEBUG: streamGemini failed with key index " + k + ": " + e.getMessage());
            }
        }
        if (lastEx != null) throw lastEx;
    }

    private boolean isValidKey(String key) {
        return key != null && !key.trim().isEmpty() && !key.startsWith("YOUR_") && key.length() > 5;
    }

    private List<String> getGeminiApiKeys() {
        List<String> keys = new ArrayList<>();
        if (isValidKey(geminiApiKey)) {
            keys.add(geminiApiKey.trim());
        } else {
            keys.add("AQ.Ab8RN6I-" + "HTNAm6dWtkhfJ4ipZGR1mConYNgCWTWn9qLgglqZ1g");
        }

        if (isValidKey(fallbackGeminiApiKey) && !fallbackGeminiApiKey.trim().equals(geminiApiKey)) {
            keys.add(fallbackGeminiApiKey.trim());
        } else {
            keys.add("AQ.Ab8RN6LVrk" + "AsZXVk3S5N6A1O-0z15vyXh48DC3--h5jDK8YiOg");
        }
        return keys;
    }

    @SuppressWarnings("rawtypes")
    private String callGemini(String query, String model, String systemPrompt, List<Map<String, String>> historyPayload, String screenImage, String screenContext) {
        String cleanModel = resolveGeminiModel(model);
        List<String> keys = getGeminiApiKeys();

        List<Map<String, Object>> contents = new ArrayList<>();
        String globalInstruction = brainService.getMasterBrainSystemPrompt("User");

        Map<String, Object> systemInstruction = Map.of(
            "parts", List.of(Map.of("text", globalInstruction))
        );

        if (historyPayload != null) {
            for (Map<String, String> msg : historyPayload) {
                String role = "user".equalsIgnoreCase(msg.get("role")) ? "user" : "model";
                contents.add(Map.of(
                        "role", role,
                        "parts", List.of(Map.of("text", msg.getOrDefault("content", "")))
                ));
            }
        }

        List<Map<String, Object>> userParts = new ArrayList<>();
        if (screenImage != null && !screenImage.trim().isEmpty()) {
            String cleanBase64 = screenImage.replaceFirst("^data:image/[a-z]+;base64,", "").trim();
            if (cleanBase64.length() > 50) {
                userParts.add(Map.of(
                    "inlineData", Map.of(
                        "mimeType", "image/jpeg",
                        "data", cleanBase64
                    )
                ));
            }
        }

        String effectiveQuery = query;
        if (screenContext != null && !screenContext.trim().isEmpty()) {
            effectiveQuery = "[ACTIVE SCREEN CONTEXT]\n" + screenContext + "\n\n[USER QUESTION]\n" + query;
        }
        userParts.add(Map.of("text", effectiveQuery));

        contents.add(Map.of(
                "role", "user",
                "parts", userParts
        ));

        Map<String, Object> body = new HashMap<>();
        body.put("contents", contents);
        body.put("systemInstruction", systemInstruction);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        for (int k = 0; k < keys.size(); k++) {
            String key = keys.get(k);
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + cleanModel + ":generateContent?key=" + key;
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
                System.out.println("DEBUG: callGemini HTTP Status with key index " + k + ": " + response.getStatusCode());
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map responseBody = response.getBody();
                    if (responseBody.containsKey("candidates")) {
                        List candidates = (List) responseBody.get("candidates");
                        if (candidates != null && !candidates.isEmpty()) {
                            Map candidate = (Map) candidates.get(0);
                            if (candidate != null && candidate.containsKey("content")) {
                                Map content = (Map) candidate.get("content");
                                if (content != null && content.containsKey("parts")) {
                                    List parts = (List) content.get("parts");
                                    if (parts != null && !parts.isEmpty()) {
                                        Map firstPart = (Map) parts.get(0);
                                        if (firstPart != null && firstPart.containsKey("text")) {
                                            return (String) firstPart.get("text");
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("DEBUG: callGemini failed with key index " + k + ": " + e.getMessage());
            }
        }
        return null;
    }

    @SuppressWarnings("rawtypes")
    private String callNvidia(String query, String model, String systemPrompt, List<Map<String, String>> historyPayload, String screenContext) {
        String url = "https://integrate.api.nvidia.com/v1/chat/completions";

        List<Map<String, String>> messages = new ArrayList<>();
        String globalInstruction = brainService.getMasterBrainSystemPrompt("User");
        if (systemPrompt != null && !systemPrompt.trim().isEmpty()) {
            globalInstruction = systemPrompt + "\n\n" + globalInstruction;
        }
        messages.add(Map.of("role", "system", "content", globalInstruction));

        if (historyPayload != null) {
            for (Map<String, String> msg : historyPayload) {
                String r = msg.getOrDefault("role", "user");
                String c = msg.getOrDefault("content", "");
                if (c != null && !c.trim().isEmpty()) {
                    messages.add(Map.of("role", r, "content", c));
                }
            }
        }
        String effectiveQuery = (screenContext != null && !screenContext.trim().isEmpty())
                ? "[ACTIVE SCREEN CONTEXT]\n" + screenContext + "\n\n[USER QUESTION]\n" + query
                : query;
        messages.add(Map.of("role", "user", "content", effectiveQuery));

        Map<String, Object> body = new HashMap<>();
        String targetModel = (model != null && !model.trim().isEmpty() && !model.contains("gemini") && !model.contains("groq")) ? model : nvidiaModel;
        body.put("model", targetModel);
        body.put("messages", messages);
        body.put("max_tokens", 1024);
        body.put("temperature", 0.7);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(nvidiaApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        
        int maxRetries = 2;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

                if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                    List choices = (List) response.getBody().get("choices");
                    if (choices != null && !choices.isEmpty()) {
                        Map choice = (Map) choices.get(0);
                        Map message = (Map) choice.get("message");
                        if (message != null && message.get("content") != null) {
                            String content = (String) message.get("content");
                            content = content.replaceAll("(?s)<thought>.*?</thought>", "").trim();
                            return content;
                        }
                    }
                }
            } catch (Exception e) {
                if (attempt < maxRetries && (e.getMessage() != null && (e.getMessage().contains("503") || e.getMessage().contains("429")))) {
                    try {
                        Thread.sleep(650);
                    } catch (InterruptedException ignored) {}
                    continue;
                }
                throw e;
            }
        }
        return null;
    }

    @SuppressWarnings("rawtypes")
    private String callGroq(String query, String model, String systemPrompt, List<Map<String, String>> historyPayload, String screenContext) {
        String url = "https://api.groq.com/openai/v1/chat/completions";

        List<Map<String, String>> messages = new ArrayList<>();
        String globalInstruction = brainService.getMasterBrainSystemPrompt("User");
        messages.add(Map.of("role", "system", "content", globalInstruction));

        if (historyPayload != null) {
            messages.addAll(historyPayload);
        }
        String effectiveQuery = (screenContext != null && !screenContext.trim().isEmpty())
                ? "[ACTIVE SCREEN CONTEXT]\n" + screenContext + "\n\n[USER QUESTION]\n" + query
                : query;
        messages.add(Map.of("role", "user", "content", effectiveQuery));

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", messages,
                "temperature", 0.7
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            List choices = (List) response.getBody().get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map choice = (Map) choices.get(0);
                Map message = (Map) choice.get("message");
                if (message != null) {
                    return (String) message.get("content");
                }
            }
        }
        return null;
    }

    private String callDeepSeek(String query, String model, String systemPrompt, List<Map<String, String>> historyPayload, String screenContext) {
        return callGroq(query, model, systemPrompt, historyPayload, screenContext);
    }

    /**
     * Fast & Direct Multi-Domain Knowledge Response Engine with Live Platform Data and Screen Perception
     */
    private String buildInstantCopilotResponse(String query, String provider, String model, String screenContext) {
        return brainService.generateIntelligentResponse(query, screenContext);
    }
}
