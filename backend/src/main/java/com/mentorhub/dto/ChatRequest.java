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
    private String screenImage; // Base64 JPEG snapshot of active screen
    private String screenContext; // Structured DOM semantic text context

    public ChatRequest() {}

    public ChatRequest(String message, String provider, String model, String systemPrompt, String language, List<Map<String, String>> history) {
        this.message = message;
        this.provider = provider;
        this.model = model;
        this.systemPrompt = systemPrompt;
        this.language = language;
        this.history = history;
    }

    public ChatRequest(String message, String provider, String model, String systemPrompt, String language, List<Map<String, String>> history, String screenImage, String screenContext) {
        this.message = message;
        this.provider = provider;
        this.model = model;
        this.systemPrompt = systemPrompt;
        this.language = language;
        this.history = history;
        this.screenImage = screenImage;
        this.screenContext = screenContext;
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

    public String getScreenImage() { return screenImage; }
    public void setScreenImage(String screenImage) { this.screenImage = screenImage; }

    public String getScreenContext() { return screenContext; }
    public void setScreenContext(String screenContext) { this.screenContext = screenContext; }
}
