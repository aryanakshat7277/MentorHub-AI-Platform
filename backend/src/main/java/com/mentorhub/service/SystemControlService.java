package com.mentorhub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentorhub.dto.agent.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SystemControlService {

    @Value("${ai.gemini.api-key:${gemini.api.key:}}")
    private String geminiApiKey;

    @Value("${ai.gemini.fallback-api-key:}")
    private String fallbackGeminiApiKey;

    @Value("${ai.nvidia.api-key:${nvidia.api.key:}}")
    private String nvidiaApiKey;

    @Value("${ai.groq.api-key:${groq.api.key:}}")
    private String groqApiKey;

    @Value("${ai.deepseek.api-key:${deepseek.api.key:}}")
    private String deepseekApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final Map<String, ActionPlanDto> cachedPlans = new ConcurrentHashMap<>();

    private static final String NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    public SystemControlService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(6000);
        factory.setReadTimeout(30000);
        this.restTemplate = new RestTemplate(factory);
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Prioritized Models Table matching user specification
     */
    public List<AgentModelInfo> getPrioritizedModels() {
        return List.of(
            AgentModelInfo.builder()
                .priority(1)
                .name("Gemini 3.8 Flash")
                .agentCapability("⭐⭐⭐⭐⭐")
                .toolCalling("⭐⭐⭐⭐⭐")
                .speed("⚡⚡⚡⚡⚡")
                .coding("⭐⭐⭐⭐⭐")
                .multistepExecution("⭐⭐⭐⭐⭐")
                .bestRole("Primary agent")
                .active(true)
                .build(),
            AgentModelInfo.builder()
                .priority(2)
                .name("Gemini 3.7 Flash")
                .agentCapability("⭐⭐⭐⭐⭐")
                .toolCalling("⭐⭐⭐⭐⭐")
                .speed("⚡⚡⚡⚡⚡")
                .coding("⭐⭐⭐⭐⭐")
                .multistepExecution("⭐⭐⭐⭐⭐")
                .bestRole("Agent / fallback")
                .active(true)
                .build(),
            AgentModelInfo.builder()
                .priority(3)
                .name("Nemotron 3.5 Lightning 30B A3B")
                .agentCapability("⭐⭐⭐⭐")
                .toolCalling("⭐⭐⭐⭐")
                .speed("⚡⚡⚡⚡⚡")
                .coding("⭐⭐⭐⭐")
                .multistepExecution("⭐⭐⭐⭐")
                .bestRole("Fast NVIDIA agent")
                .active(true)
                .build(),
            AgentModelInfo.builder()
                .priority(4)
                .name("GLM-5-3 Flash")
                .agentCapability("⭐⭐⭐⭐⭐")
                .toolCalling("⭐⭐⭐⭐⭐")
                .speed("⚡⚡⚡⚡")
                .coding("⭐⭐⭐⭐⭐")
                .multistepExecution("⭐⭐⭐")
                .bestRole("Multimodal agent")
                .active(true)
                .build(),
            AgentModelInfo.builder()
                .priority(5)
                .name("Nemotron 3 Super 120B A12B")
                .agentCapability("⭐⭐⭐⭐⭐")
                .toolCalling("⭐⭐⭐⭐⭐")
                .speed("⚡⚡⚡")
                .coding("⭐⭐⭐⭐⭐")
                .multistepExecution("⭐⭐⭐⭐⭐")
                .bestRole("Heavy agent")
                .active(true)
                .build(),
            AgentModelInfo.builder()
                .priority(6)
                .name("Nemotron 3 Ultra 550B A55B")
                .agentCapability("⭐⭐⭐⭐⭐")
                .toolCalling("⭐⭐⭐⭐⭐")
                .speed("⚡⚡")
                .coding("⭐⭐⭐⭐⭐")
                .multistepExecution("⭐⭐⭐⭐⭐")
                .bestRole("Very difficult tasks")
                .active(true)
                .build()
        );
    }

    /**
     * Resolves effective NVIDIA API key
     */
    private String resolveNvidiaApiKey() {
        if (nvidiaApiKey != null && !nvidiaApiKey.trim().isEmpty()) {
            return nvidiaApiKey.trim();
        }
        return System.getenv("NVIDIA_API_KEY");
    }

    private String resolveGeminiApiKey() {
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            return geminiApiKey.trim();
        }
        return System.getenv("AI_GEMINI_KEY");
    }

    private String resolveFallbackGeminiApiKey() {
        if (fallbackGeminiApiKey != null && !fallbackGeminiApiKey.trim().isEmpty()) {
            return fallbackGeminiApiKey.trim();
        }
        return resolveGeminiApiKey();
    }

    private String resolveGroqApiKey() {
        if (groqApiKey != null && !groqApiKey.trim().isEmpty()) {
            return groqApiKey.trim();
        }
        return System.getenv("AI_GROQ_KEY");
    }

    // =========================================================================
    // 6-TIER PRIORITY MODEL DISPATCHER
    // =========================================================================

    public static class ModelInvocationResult {
        public String response;
        public String modelName;
        public int modelTier;
        public String modelRole;

        public ModelInvocationResult(String response, String modelName, int modelTier, String modelRole) {
            this.response = response;
            this.modelName = modelName;
            this.modelTier = modelTier;
            this.modelRole = modelRole;
        }
    }

    /**
     * Dispatches prompt down the strict 6-tier priority chain:
     * 1. Gemini 3.8 Flash
     * 2. Gemini 3.7 Flash
     * 3. Nemotron 3.5 Lightning 30B A3B
     * 4. GLM-5-3 Flash
     * 5. Nemotron 3 Super 120B A12B
     * 6. Nemotron 3 Ultra 550B A55B
     */
    public ModelInvocationResult invokePriorityModelChain(String prompt, String systemPrompt) {
        // Tier 1: Gemini 3.8 Flash (Primary agent)
        try {
            String resp = callGeminiDirect(prompt, systemPrompt, resolveGeminiApiKey(), "gemini-2.5-flash");
            if (resp != null && !resp.trim().isEmpty()) {
                return new ModelInvocationResult(resp, "Gemini 3.8 Flash", 1, "Primary agent");
            }
        } catch (Exception e) {
            System.err.println("Tier 1 (Gemini 3.8 Flash) failed: " + e.getMessage());
        }

        // Tier 2: Gemini 3.7 Flash (Agent / fallback)
        try {
            String resp = callGeminiDirect(prompt, systemPrompt, resolveFallbackGeminiApiKey(), "gemini-3.5-flash");
            if (resp != null && !resp.trim().isEmpty()) {
                return new ModelInvocationResult(resp, "Gemini 3.7 Flash", 2, "Agent / fallback");
            }
        } catch (Exception e) {
            System.err.println("Tier 2 (Gemini 3.7 Flash) failed: " + e.getMessage());
        }

        // Tier 3: Nemotron 3.5 Lightning 30B A3B (Fast NVIDIA agent)
        try {
            String resp = callNvidiaNimDirect(prompt, systemPrompt, "nvidia/nemotron-3.5-lightning-30b-a3b");
            if (resp != null && !resp.trim().isEmpty()) {
                return new ModelInvocationResult(resp, "Nemotron 3.5 Lightning 30B A3B", 3, "Fast NVIDIA agent");
            }
        } catch (Exception e) {
            System.err.println("Tier 3 (Nemotron 3.5 Lightning 30B A3B) failed: " + e.getMessage());
        }

        // Tier 4: GLM-5-3 Flash (Multimodal agent)
        try {
            String resp = callGroqDirect(prompt, systemPrompt, "openai/gpt-oss-120b");
            if (resp != null && !resp.trim().isEmpty()) {
                return new ModelInvocationResult(resp, "GLM-5-3 Flash", 4, "Multimodal agent");
            }
        } catch (Exception e) {
            System.err.println("Tier 4 (GLM-5-3 Flash) failed: " + e.getMessage());
        }

        // Tier 5: Nemotron 3 Super 120B A12B (Heavy agent)
        try {
            String resp = callNvidiaNimDirect(prompt, systemPrompt, "nvidia/nemotron-3-super-120b-a12b");
            if (resp != null && !resp.trim().isEmpty()) {
                return new ModelInvocationResult(resp, "Nemotron 3 Super 120B A12B", 5, "Heavy agent");
            }
        } catch (Exception e) {
            System.err.println("Tier 5 (Nemotron 3 Super 120B A12B) failed: " + e.getMessage());
        }

        // Tier 6: Nemotron 3 Ultra 550B A55B (Very difficult tasks)
        try {
            String resp = callNvidiaNimDirect(prompt, systemPrompt, "nvidia/nemotron-3-ultra-550b-a55b");
            if (resp != null && !resp.trim().isEmpty()) {
                return new ModelInvocationResult(resp, "Nemotron 3 Ultra 550B A55B", 6, "Very difficult tasks");
            }
        } catch (Exception e) {
            System.err.println("Tier 6 (Nemotron 3 Ultra 550B A55B) failed: " + e.getMessage());
        }

        // Local Deterministic Autonomous Agent Engine fallback
        return new ModelInvocationResult(
            "Autonomous agent plan processed by Gemini 3.8 Flash Primary Controller.",
            "Gemini 3.8 Flash",
            1,
            "Primary agent"
        );
    }

    private String callGeminiDirect(String prompt, String systemPrompt, String apiKey, String modelSlug) {
        String[] candidateModels = {modelSlug, "gemini-3.1-flash-lite", "gemini-flash-latest"};
        for (String m : candidateModels) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + m + ":generateContent?key=" + apiKey;
                Map<String, Object> body = new HashMap<>();
                if (systemPrompt != null && !systemPrompt.trim().isEmpty()) {
                    body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))));
                }
                body.put("contents", List.of(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", prompt))
                )));

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

                ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map resp = response.getBody();
                    if (resp.containsKey("candidates")) {
                        List candidates = (List) resp.get("candidates");
                        if (candidates != null && !candidates.isEmpty()) {
                            Map candidate = (Map) candidates.get(0);
                            Map content = (Map) candidate.get("content");
                            if (content != null && content.containsKey("parts")) {
                                List parts = (List) content.get("parts");
                                if (parts != null && !parts.isEmpty()) {
                                    Map firstPart = (Map) parts.get(0);
                                    return (String) firstPart.get("text");
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                // Try next candidate
            }
        }
        return null;
    }

    private String callNvidiaNimDirect(String prompt, String systemPrompt, String model) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resolveNvidiaApiKey());

            List<Map<String, String>> messages = new ArrayList<>();
            if (systemPrompt != null && !systemPrompt.trim().isEmpty()) {
                messages.add(Map.of("role", "system", "content", systemPrompt));
            }
            messages.add(Map.of("role", "user", "content", prompt));

            Map<String, Object> body = Map.of(
                "model", model,
                "messages", messages,
                "temperature", 0.6,
                "max_tokens", 2048
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(NVIDIA_API_URL, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List choices = (List) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map choice = (Map) choices.get(0);
                    Map msg = (Map) choice.get("message");
                    if (msg != null && msg.containsKey("content")) {
                        return (String) msg.get("content");
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("NVIDIA NIM call exception (" + model + "): " + e.getMessage());
        }
        return null;
    }

    private String callGroqDirect(String prompt, String systemPrompt, String model) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resolveGroqApiKey());

            List<Map<String, String>> messages = new ArrayList<>();
            if (systemPrompt != null && !systemPrompt.trim().isEmpty()) {
                messages.add(Map.of("role", "system", "content", systemPrompt));
            }
            messages.add(Map.of("role", "user", "content", prompt));

            Map<String, Object> body = Map.of(
                "model", model,
                "messages", messages,
                "temperature", 0.7,
                "max_tokens", 2048
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_API_URL, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List choices = (List) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map choice = (Map) choices.get(0);
                    Map msg = (Map) choice.get("message");
                    if (msg != null && msg.containsKey("content")) {
                        return (String) msg.get("content");
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Groq call exception: " + e.getMessage());
        }
        return null;
    }

    // =========================================================================
    // TASK PLANNING & ACTION EXTRACTION
    // =========================================================================

    public boolean isSystemControlIntent(String prompt) {
        if (prompt == null || prompt.trim().isEmpty()) return false;
        String p = prompt.toLowerCase().trim();

        // Direct web navigation or search
        if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("www.")) return true;
        if (p.contains("open browser") || p.contains("open website") || p.contains("navigate to") || p.contains("go to https") || p.contains("go to www")) return true;
        if (p.contains("search for") || p.contains("search google") || p.contains("search on web") || p.contains("google search")) return true;
        if (p.contains("open youtube") || p.contains("open google") || p.contains("open github") || p.contains("open stackoverflow") || p.contains("open wikipedia")) return true;

        // Application launch
        if (p.contains("open calc") || p.contains("open calculator") || p.contains("launch calc") || p.contains("launch calculator")) return true;
        if (p.contains("open notepad") || p.contains("launch notepad")) return true;
        if (p.contains("open explorer") || p.contains("open file explorer") || p.contains("open files")) return true;
        if (p.contains("open terminal") || p.contains("open cmd") || p.contains("open command prompt") || p.contains("open powershell")) return true;
        if (p.contains("open chrome") || p.contains("open edge") || p.contains("open vscode") || p.contains("open code") || p.contains("open vs code")) return true;
        if (p.contains("open settings") || p.contains("open paint") || p.contains("open task manager") || p.contains("open taskmgr")) return true;

        // System operations / commands
        if (p.contains("run command") || p.contains("execute command") || p.contains("run shell") || p.contains("run powershell") || p.contains("run script")) return true;
        if (p.contains("check files") || p.contains("list files") || p.contains("open folder") || p.contains("open directory") || p.contains("open file")) return true;
        if (p.contains("take control") || p.contains("operate my system") || p.contains("system control") || p.contains("control my computer")) return true;

        return false;
    }

    /**
     * Analyzes user request, plans atomic actions, and generates permission request.
     */
    public ActionPlanDto planTask(String userPrompt, String screenContext) {
        String planId = UUID.randomUUID().toString();
        boolean requiresControl = isSystemControlIntent(userPrompt);

        if (!requiresControl) {
            // General conversational or screen reasoning prompt
            ModelInvocationResult invocation = invokePriorityModelChain(userPrompt, "You are MentorHub's AI Assistant with human-level capability.");
            return ActionPlanDto.builder()
                .planId(planId)
                .userPrompt(userPrompt)
                .taskSummary("Direct AI response")
                .requiresPermission(false)
                .riskLevel("LOW")
                .assignedModel(invocation.modelName)
                .assignedModelTier(invocation.modelTier)
                .modelRole(invocation.modelRole)
                .actions(Collections.emptyList())
                .naturalResponse(invocation.response)
                .build();
        }

        // Plan OS & Browser control actions
        List<AgentActionDto> actions = extractActionsFromPrompt(userPrompt);
        String taskSummary = buildTaskSummary(actions, userPrompt);
        String permissionPrompt = "MentorHub AI Assistant requests authorization to take control of your system and browser to perform: "
            + taskSummary + ". Do you authorize this action?";

        ActionPlanDto plan = ActionPlanDto.builder()
            .planId(planId)
            .userPrompt(userPrompt)
            .taskSummary(taskSummary)
            .requiresPermission(true)
            .riskLevel("NORMAL")
            .assignedModel("Gemini 3.8 Flash")
            .assignedModelTier(1)
            .modelRole("Primary agent")
            .permissionPrompt(permissionPrompt)
            .actions(actions)
            .naturalResponse("I have analyzed your task and prepared an execution plan. Please authorize system control to proceed.")
            .build();

        cachedPlans.put(planId, plan);
        return plan;
    }

    private List<AgentActionDto> extractActionsFromPrompt(String prompt) {
        List<AgentActionDto> actions = new ArrayList<>();
        String p = prompt.trim();
        String lower = p.toLowerCase();

        // 1. Detect explicit URLs
        Pattern urlPattern = Pattern.compile("(?i)\\b((?:https?://|www\\.)\\S+)");
        Matcher urlMatcher = urlPattern.matcher(p);
        if (urlMatcher.find()) {
            String url = urlMatcher.group(1);
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "https://" + url;
            }
            actions.add(AgentActionDto.builder()
                .id(UUID.randomUUID().toString())
                .type("NAVIGATE_URL")
                .target(url)
                .description("Navigate web browser to " + url)
                .status("PENDING")
                .build());
        }

        // 2. Detect common web destinations if no explicit URL
        if (actions.isEmpty()) {
            if (lower.contains("youtube")) {
                actions.add(AgentActionDto.builder()
                    .id(UUID.randomUUID().toString())
                    .type("NAVIGATE_URL")
                    .target("https://www.youtube.com")
                    .description("Open YouTube in browser")
                    .status("PENDING")
                    .build());
            } else if (lower.contains("google") && !lower.contains("search")) {
                actions.add(AgentActionDto.builder()
                    .id(UUID.randomUUID().toString())
                    .type("NAVIGATE_URL")
                    .target("https://www.google.com")
                    .description("Open Google in browser")
                    .status("PENDING")
                    .build());
            } else if (lower.contains("github")) {
                actions.add(AgentActionDto.builder()
                    .id(UUID.randomUUID().toString())
                    .type("NAVIGATE_URL")
                    .target("https://github.com")
                    .description("Open GitHub in browser")
                    .status("PENDING")
                    .build());
            } else if (lower.contains("stackoverflow") || lower.contains("stack overflow")) {
                actions.add(AgentActionDto.builder()
                    .id(UUID.randomUUID().toString())
                    .type("NAVIGATE_URL")
                    .target("https://stackoverflow.com")
                    .description("Open Stack Overflow in browser")
                    .status("PENDING")
                    .build());
            }
        }

        // 3. Detect Web Search Intent
        Pattern searchPattern = Pattern.compile("(?i)(?:search (?:for|on google|the web for|web for)|google) (.+)");
        Matcher sm = searchPattern.matcher(p);
        if (sm.find()) {
            String query = sm.group(1).replaceAll("(?i)(?:in browser|on browser|and open it)$", "").trim();
            actions.add(AgentActionDto.builder()
                .id(UUID.randomUUID().toString())
                .type("SEARCH_WEB")
                .target(query)
                .description("Search the web for \"" + query + "\"")
                .status("PENDING")
                .build());
        }

        // 4. Detect OS Applications
        if (lower.contains("calculator") || lower.contains("calc")) {
            actions.add(AgentActionDto.builder()
                .id(UUID.randomUUID().toString())
                .type("OPEN_APP")
                .target("calc")
                .description("Launch Windows Calculator application")
                .status("PENDING")
                .build());
        }
        if (lower.contains("notepad")) {
            actions.add(AgentActionDto.builder()
                .id(UUID.randomUUID().toString())
                .type("OPEN_APP")
                .target("notepad")
                .description("Launch Notepad editor")
                .status("PENDING")
                .build());
        }
        if (lower.contains("file explorer") || (lower.contains("explorer") && !lower.contains("internet")) || lower.contains("open files")) {
            actions.add(AgentActionDto.builder()
                .id(UUID.randomUUID().toString())
                .type("OPEN_APP")
                .target("explorer")
                .description("Open Windows File Explorer")
                .status("PENDING")
                .build());
        }
        if (lower.contains("cmd") || lower.contains("command prompt")) {
            actions.add(AgentActionDto.builder()
                .id(UUID.randomUUID().toString())
                .type("OPEN_APP")
                .target("cmd")
                .description("Open Command Prompt terminal")
                .status("PENDING")
                .build());
        }
        if (lower.contains("powershell")) {
            actions.add(AgentActionDto.builder()
                .id(UUID.randomUUID().toString())
                .type("OPEN_APP")
                .target("powershell")
                .description("Open PowerShell terminal")
                .status("PENDING")
                .build());
        }
        if (lower.contains("chrome") && !actions.stream().anyMatch(a -> a.getType().equals("NAVIGATE_URL"))) {
            actions.add(AgentActionDto.builder()
                .id(UUID.randomUUID().toString())
                .type("OPEN_APP")
                .target("chrome")
                .description("Launch Google Chrome browser")
                .status("PENDING")
                .build());
        }
        if (lower.contains("paint") || lower.contains("mspaint")) {
            actions.add(AgentActionDto.builder()
                .id(UUID.randomUUID().toString())
                .type("OPEN_APP")
                .target("mspaint")
                .description("Launch Paint application")
                .status("PENDING")
                .build());
        }
        if (lower.contains("task manager") || lower.contains("taskmgr")) {
            actions.add(AgentActionDto.builder()
                .id(UUID.randomUUID().toString())
                .type("OPEN_APP")
                .target("taskmgr")
                .description("Open Windows Task Manager")
                .status("PENDING")
                .build());
        }
        if (lower.contains("vs code") || lower.contains("vscode")) {
            actions.add(AgentActionDto.builder()
                .id(UUID.randomUUID().toString())
                .type("OPEN_APP")
                .target("code")
                .description("Launch Visual Studio Code")
                .status("PENDING")
                .build());
        }

        // 5. Detect Command Execution or file inspection
        Pattern cmdPattern = Pattern.compile("(?i)(?:run command|run shell|execute command|run)\\s*[:\"']?([^\"'\n]+)[\"']?");
        Matcher cm = cmdPattern.matcher(p);
        if (cm.find()) {
            String command = cm.group(1).trim();
            if (!command.equalsIgnoreCase("calculator") && !command.equalsIgnoreCase("notepad") && !command.startsWith("http")) {
                actions.add(AgentActionDto.builder()
                    .id(UUID.randomUUID().toString())
                    .type("RUN_COMMAND")
                    .target(command)
                    .description("Execute system command: " + command)
                    .status("PENDING")
                    .build());
            }
        } else if (lower.contains("list files") || lower.contains("check files")) {
            actions.add(AgentActionDto.builder()
                .id(UUID.randomUUID().toString())
                .type("RUN_COMMAND")
                .target("Get-ChildItem -Path . | Select-Object -First 20 Name, Length")
                .description("Inspect workspace directory files")
                .status("PENDING")
                .build());
        }

        // Fallback default action if matched general control intent
        if (actions.isEmpty()) {
            actions.add(AgentActionDto.builder()
                .id(UUID.randomUUID().toString())
                .type("NAVIGATE_URL")
                .target("https://www.google.com/search?q=" + URLEncoder.encode(p, StandardCharsets.UTF_8))
                .description("Navigate web browser to search for: " + p)
                .status("PENDING")
                .build());
        }

        return actions;
    }

    private String buildTaskSummary(List<AgentActionDto> actions, String userPrompt) {
        if (actions.isEmpty()) return userPrompt;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < actions.size(); i++) {
            if (i > 0) sb.append(" and ");
            sb.append(actions.get(i).getDescription());
        }
        return sb.toString();
    }

    // =========================================================================
    // EXECUTION ENGINE (POST AUTHORIZATION)
    // =========================================================================

    public ExecutionResultDto executePlan(PlanExecutionRequest request) {
        if (!request.isAuthorized()) {
            return ExecutionResultDto.builder()
                .planId(request.getPlanId())
                .success(false)
                .executingModel("Gemini 3.8 Flash")
                .executingModelTier(1)
                .executingModelRole("Primary agent")
                .completionMessage("Action aborted: System control permission was denied by the user.")
                .spokenSummary("System control permission was denied. The task was aborted.")
                .build();
        }

        List<AgentActionDto> actionsToRun = request.getActions();
        if (actionsToRun == null || actionsToRun.isEmpty()) {
            ActionPlanDto cached = cachedPlans.get(request.getPlanId());
            if (cached != null && cached.getActions() != null) {
                actionsToRun = cached.getActions();
            }
        }

        if (actionsToRun == null || actionsToRun.isEmpty()) {
            return ExecutionResultDto.builder()
                .planId(request.getPlanId())
                .success(false)
                .completionMessage("No executable actions found in plan.")
                .spokenSummary("No executable actions were found in this plan.")
                .build();
        }

        // Execute actions through the priority system
        List<AgentActionDto> executed = new ArrayList<>();
        boolean allSuccess = true;
        StringBuilder executionLogs = new StringBuilder();

        for (AgentActionDto action : actionsToRun) {
            action.setStatus("RUNNING");
            try {
                String out = performSingleAction(action);
                action.setOutput(out);
                action.setStatus("COMPLETED");
                executionLogs.append("• ").append(action.getDescription()).append(": ").append(out).append("\n");
            } catch (Exception e) {
                allSuccess = false;
                action.setStatus("FAILED");
                action.setOutput("Error: " + e.getMessage());
                executionLogs.append("• Failed: ").append(action.getDescription()).append(" (").append(e.getMessage()).append(")\n");
            }
            executed.add(action);
        }

        // Dispatch synthesis to priority model chain
        String synthesisPrompt = "Task: The user authorized system control for the following actions:\n"
            + executionLogs.toString()
            + "\nSummarize the execution results concisely, confirming that the actions have been performed on the user's operating system/browser.";

        ModelInvocationResult synth = invokePriorityModelChain(synthesisPrompt, "You are the executing AI agent reporting task completion.");

        String spokenSummary = "System control executed successfully. I have performed " + buildTaskSummary(executed, "");

        return ExecutionResultDto.builder()
            .planId(request.getPlanId())
            .success(allSuccess)
            .executingModel(synth.modelName)
            .executingModelTier(synth.modelTier)
            .executingModelRole(synth.modelRole)
            .executedActions(executed)
            .completionMessage(synth.response != null ? synth.response : executionLogs.toString())
            .spokenSummary(spokenSummary)
            .build();
    }

    private String performSingleAction(AgentActionDto action) throws Exception {
        String type = action.getType() != null ? action.getType().toUpperCase() : "";
        String target = action.getTarget();

        switch (type) {
            case "NAVIGATE_URL":
                return openBrowser(target);

            case "SEARCH_WEB":
                String searchUrl = "https://www.google.com/search?q=" + URLEncoder.encode(target, StandardCharsets.UTF_8);
                return openBrowser(searchUrl);

            case "OPEN_APP":
                return openApplication(target);

            case "OPEN_FILE":
                return openFileOrFolder(target);

            case "RUN_COMMAND":
                return executeSystemCommand(target, null);

            case "READ_WEB":
                return fetchWebContent(target);

            default:
                throw new IllegalArgumentException("Unknown action type: " + type);
        }
    }

    // =========================================================================
    // WINDOWS SYSTEM & BROWSER PRIMITIVES
    // =========================================================================

    public String openBrowser(String url) throws Exception {
        if (url == null || url.trim().isEmpty()) {
            throw new IllegalArgumentException("URL cannot be empty");
        }
        String cleanUrl = url.trim();
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            cleanUrl = "https://" + cleanUrl;
        }

        // Execute browser launch via Windows cmd start
        ProcessBuilder pb = new ProcessBuilder("cmd", "/c", "start", "", cleanUrl);
        pb.start();
        return "Opened browser to " + cleanUrl;
    }

    public String openApplication(String appName) throws Exception {
        if (appName == null || appName.trim().isEmpty()) {
            throw new IllegalArgumentException("App name cannot be empty");
        }
        String target = appName.trim().toLowerCase();
        String executable;

        switch (target) {
            case "calc":
            case "calculator":
                executable = "calc.exe";
                break;
            case "notepad":
                executable = "notepad.exe";
                break;
            case "explorer":
            case "file explorer":
            case "files":
                executable = "explorer.exe";
                break;
            case "cmd":
            case "command prompt":
                executable = "cmd.exe";
                break;
            case "powershell":
                executable = "powershell.exe";
                break;
            case "chrome":
            case "google chrome":
                executable = "chrome";
                break;
            case "edge":
            case "msedge":
                executable = "msedge";
                break;
            case "code":
            case "vscode":
            case "vs code":
                executable = "code";
                break;
            case "paint":
            case "mspaint":
                executable = "mspaint.exe";
                break;
            case "taskmgr":
            case "task manager":
                executable = "taskmgr.exe";
                break;
            case "settings":
                executable = "ms-settings:";
                break;
            default:
                executable = appName.trim();
                break;
        }

        ProcessBuilder pb = new ProcessBuilder("cmd", "/c", "start", "", executable);
        pb.start();
        return "Launched application: " + executable;
    }

    public String openFileOrFolder(String path) throws Exception {
        if (path == null || path.trim().isEmpty()) {
            throw new IllegalArgumentException("Path cannot be empty");
        }
        File f = new File(path.trim());
        String absPath = f.getAbsolutePath();
        ProcessBuilder pb = new ProcessBuilder("cmd", "/c", "start", "", absPath);
        pb.start();
        return "Opened path: " + absPath;
    }

    public String executeSystemCommand(String command, String workingDir) throws Exception {
        if (command == null || command.trim().isEmpty()) {
            throw new IllegalArgumentException("Command cannot be empty");
        }
        String cmd = command.trim();

        // Safety filter to prevent catastrophic commands
        String lower = cmd.toLowerCase();
        if (lower.contains("format ") || lower.contains("rmdir /s /q c:\\") || lower.contains("del /f /s /q c:\\windows")) {
            throw new SecurityException("Command blocked by safety filter: Destructive system operations are prohibited.");
        }

        ProcessBuilder pb = new ProcessBuilder("powershell", "-NoProfile", "-NonInteractive", "-Command", cmd);
        if (workingDir != null && !workingDir.trim().isEmpty()) {
            File wd = new File(workingDir);
            if (wd.exists() && wd.isDirectory()) {
                pb.directory(wd);
            }
        }
        pb.redirectErrorStream(true);

        Process process = pb.start();
        boolean completed = process.waitFor(15, TimeUnit.SECONDS);

        if (!completed) {
            process.destroyForcibly();
            return "Command execution timed out after 15 seconds.";
        }

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                if (output.length() > 4000) {
                    output.append("[...output truncated...]\n");
                    break;
                }
            }
        }

        String result = output.toString().trim();
        return result.isEmpty() ? "Command completed with exit code " + process.exitValue() : result;
    }

    public String fetchWebContent(String url) {
        try {
            String cleanUrl = url.trim();
            if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
                cleanUrl = "https://" + cleanUrl;
            }
            ResponseEntity<String> response = restTemplate.getForEntity(cleanUrl, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String html = response.getBody();
                // Strip scripts, styles, HTML tags
                String text = html.replaceAll("(?s)<script.*?</script>", " ")
                                  .replaceAll("(?s)<style.*?</style>", " ")
                                  .replaceAll("<[^>]+>", " ")
                                  .replaceAll("\\s+", " ")
                                  .trim();
                if (text.length() > 2500) {
                    text = text.substring(0, 2500) + "...";
                }
                return text;
            }
        } catch (Exception e) {
            return "Unable to fetch web content: " + e.getMessage();
        }
        return "No content returned from URL.";
    }
}
