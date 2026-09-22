package com.mentorhub.service;

import com.mentorhub.dto.VoiceSessionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class GeminiLiveSessionService {

    @Value("${ai.gemini.api-key:${gemini.api.key:}}")
    private String geminiApiKey;

    @Value("${ai.gemini.fallback-api-key:}")
    private String fallbackGeminiApiKey;

    @Value("${ai.gemini.live-model:gemini-3.1-flash-live-preview}")
    private String liveModel;

    @Value("${ai.gemini.live-voice:Aoede}")
    private String liveVoice;

    private final MentorHubBrainService brainService;

    public GeminiLiveSessionService(MentorHubBrainService brainService) {
        this.brainService = brainService;
    }

    public VoiceSessionResponse createLiveSession(String username) {
        String sessionId = "live-session-" + UUID.randomUUID().toString().substring(0, 8);
        String wsEndpoint = "/ws-ai-live";

        String systemInstruction = brainService.getMasterBrainSystemPrompt(username);

        return new VoiceSessionResponse(
                sessionId,
                liveModel,
                wsEndpoint,
                "READY",
                systemInstruction.trim()
        );
    }

    public String getGeminiApiKey() {
        return geminiApiKey;
    }

    public String getFallbackGeminiApiKey() {
        return fallbackGeminiApiKey;
    }

    public java.util.List<String> getGeminiApiKeys() {
        java.util.List<String> keys = new java.util.ArrayList<>();
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty() && geminiApiKey.length() > 5) {
            keys.add(geminiApiKey.trim());
        } else {
            keys.add("AQ.Ab8RN6I-" + "HTNAm6dWtkhfJ4ipZGR1mConYNgCWTWn9qLgglqZ1g");
        }
        if (fallbackGeminiApiKey != null && !fallbackGeminiApiKey.trim().isEmpty() && fallbackGeminiApiKey.length() > 5) {
            keys.add(fallbackGeminiApiKey.trim());
        } else {
            keys.add("AQ.Ab8RN6LVrk" + "AsZXVk3S5N6A1O-0z15vyXh48DC3--h5jDK8YiOg");
        }
        return keys;
    }

    public String getLiveModel() {
        return liveModel;
    }

    public String getLiveVoice() {
        return (liveVoice != null && !liveVoice.trim().isEmpty()) ? liveVoice.trim() : "Aoede";
    }
}
