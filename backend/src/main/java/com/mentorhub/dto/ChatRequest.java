package com.mentorhub.dto;

import java.util.List;
import java.util.Map;

public class ChatRequest {
    private String message;
    private String provider; // GEMINI, GROQ, DEEPSEEK
    private String model;
    private String systemPrompt;
    private String language;
    private List<Map<String, String>> history; // Multi-turn conversation history

    public ChatRequest() {}

    public ChatRequest(String message, String provider, String model, String systemPrompt, String language, List<Map<String, String>> history) {
        this.message = message;
        this.provider = provider;
        this.model = model;
        this.systemPrompt = systemPrompt;
        this.language = language;
        this.history = history;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getSystemPrompt() { return systemPrompt; }
    public void setSystemPrompt(String systemPrompt) { this.systemPrompt = systemPrompt; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public List<Map<String, String>> getHistory() { return history; }
    public void setHistory(List<Map<String, String>> history) { this.history = history; }
}
