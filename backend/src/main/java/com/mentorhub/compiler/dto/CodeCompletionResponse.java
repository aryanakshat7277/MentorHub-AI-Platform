package com.mentorhub.compiler.dto;

public class CodeCompletionResponse {
    private boolean success;
    private String completion;
    private String provider;
    private String model;
    private Long latencyMs;

    public CodeCompletionResponse() {}

    public CodeCompletionResponse(boolean success, String completion, String provider, String model, Long latencyMs) {
        this.success = success;
        this.completion = completion;
        this.provider = provider;
        this.model = model;
        this.latencyMs = latencyMs;
    }

    public static CodeCompletionResponse ok(String completion, String provider, String model, Long latencyMs) {
        return new CodeCompletionResponse(true, completion, provider, model, latencyMs);
    }

    public static CodeCompletionResponse fail(String message) {
        return new CodeCompletionResponse(false, message, "NONE", "none", 0L);
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getCompletion() { return completion; }
    public void setCompletion(String completion) { this.completion = completion; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public Long getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Long latencyMs) { this.latencyMs = latencyMs; }
}
