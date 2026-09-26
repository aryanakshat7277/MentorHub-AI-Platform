package com.mentorhub.dto;

import java.time.LocalDateTime;

public class ChatResponse {
    private String response;
    private String provider;
    private String model;
    private String spokenText;
    private Boolean voiceMode = false;
    private LocalDateTime timestamp;

    public ChatResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public ChatResponse(String response, String provider, String model) {
        this.response = response;
        this.provider = provider;
        this.model = model;
        this.spokenText = cleanForSpeech(response);
        this.timestamp = LocalDateTime.now();
    }

    public ChatResponse(String response, String provider, String model, Boolean voiceMode) {
        this.response = response;
        this.provider = provider;
        this.model = model;
        this.voiceMode = voiceMode;
        this.spokenText = cleanForSpeech(response);
        this.timestamp = LocalDateTime.now();
    }

    private String cleanForSpeech(String text) {
        if (text == null) return "";
        return text.replaceAll("```[\\s\\S]*?```", " Code snippet shown on screen. ")
                   .replaceAll("`([^`]+)`", "$1")
                   .replaceAll("\\*\\*([^*]+)\\*\\*", "$1")
                   .replaceAll("###\\s*", "")
                   .replaceAll("[-*#]", "")
                   .replaceAll("\\[([^\\]]+)\\]\\([^)]+\\)", "$1")
                   .trim();
    }

    public String getResponse() { return response; }
    public void setResponse(String response) { 
        this.response = response; 
        if (this.spokenText == null) {
            this.spokenText = cleanForSpeech(response);
        }
    }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getSpokenText() { return spokenText; }
    public void setSpokenText(String spokenText) { this.spokenText = spokenText; }

    public Boolean getVoiceMode() { return voiceMode; }
    public void setVoiceMode(Boolean voiceMode) { this.voiceMode = voiceMode; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
