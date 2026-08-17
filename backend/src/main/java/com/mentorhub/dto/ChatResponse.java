package com.mentorhub.dto;

import java.time.LocalDateTime;

public class ChatResponse {
    private String response;
    private String provider;
    private String model;
    private LocalDateTime timestamp;

    public ChatResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public ChatResponse(String response, String provider, String model) {
        this.response = response;
        this.provider = provider;
        this.model = model;
        this.timestamp = LocalDateTime.now();
    }

    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
