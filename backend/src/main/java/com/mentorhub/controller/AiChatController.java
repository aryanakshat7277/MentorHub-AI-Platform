package com.mentorhub.controller;

import com.mentorhub.dto.ChatRequest;
import com.mentorhub.dto.ChatResponse;
import com.mentorhub.service.AiChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;

@RestController
@RequestMapping({"/api/ai/chat", "/api/v1/ai/chat"})
public class AiChatController {

    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @PostMapping("/send")
    public ResponseEntity<ChatResponse> sendMessage(@RequestBody ChatRequest request) {
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ChatResponse("Error: Message text cannot be empty.", request.getProvider(), request.getModel()));
        }
        ChatResponse response = aiChatService.processChat(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Dedicated Multimodal Screen Intelligence Endpoint
     * Uses Gemini 3.1 Flash-Lite to read visual screen snapshot + semantic context
     * and responds to user questions in voice or text form.
     */
    @PostMapping("/screen-ask")
    public ResponseEntity<ChatResponse> askAboutScreen(@RequestBody ChatRequest request) {
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ChatResponse("Error: Question cannot be empty.", "GEMINI", "gemini-3.1-flash-lite"));
        }
        if (request.getModel() == null || request.getModel().isEmpty()) {
            request.setModel("gemini-3.1-flash-lite");
        }
        if (request.getProvider() == null || request.getProvider().isEmpty()) {
            request.setProvider("GEMINI");
        }
        ChatResponse response = aiChatService.processChat(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMessage(@RequestBody ChatRequest request) {
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            SseEmitter emitter = new SseEmitter();
            try {
                emitter.send(SseEmitter.event().data("Error: Message text cannot be empty."));
                emitter.complete();
            } catch (Exception e) {}
            return emitter;
        }
        return aiChatService.streamChat(request);
    }

    @GetMapping("/providers")
    public ResponseEntity<Map<String, List<String>>> getProvidersAndModels() {
        Map<String, List<String>> map = new LinkedHashMap<>();
        map.put("GEMINI", List.of("gemini-3.1-flash-lite", "gemini-3.1-flash-lite-preview", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"));
        map.put("GROQ", List.of("qwen/qwen3.8-27b", "openai/gpt-oss-120b", "llama-3.1-8b-instant", "whisper-large-v3-turbo", "canopylabs/orpheus-v1-english"));
        map.put("DEEPSEEK", List.of("deepseek-chat", "deepseek-coder"));
        map.put("BRAIN", List.of("cutm-academic-brain-copilot", "viva-defense-evaluator"));
        return ResponseEntity.ok(map);
    }
}
