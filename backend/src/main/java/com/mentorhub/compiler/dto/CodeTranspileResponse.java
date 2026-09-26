package com.mentorhub.compiler.dto;

import java.util.List;

public class CodeTranspileResponse {
    private boolean success;
    private String sourceLanguage;
    private String targetLanguage;
    private String translatedCode;
    private String explanation;
    private List<String> keyDifferences;
    private String provider;
    private String model;
    private Long latencyMs;

    public CodeTranspileResponse() {}

    public CodeTranspileResponse(boolean success, String sourceLanguage, String targetLanguage,
                                 String translatedCode, String explanation, List<String> keyDifferences,
                                 String provider, String model, Long latencyMs) {
        this.success = success;
        this.sourceLanguage = sourceLanguage;
        this.targetLanguage = targetLanguage;
        this.translatedCode = translatedCode;
        this.explanation = explanation;
        this.keyDifferences = keyDifferences;
        this.provider = provider;
        this.model = model;
        this.latencyMs = latencyMs;
    }

    public static CodeTranspileResponse ok(String sourceLanguage, String targetLanguage,
                                           String translatedCode, String explanation, List<String> keyDifferences,
                                           String provider, String model, Long latencyMs) {
        return new CodeTranspileResponse(true, sourceLanguage, targetLanguage, translatedCode, explanation, keyDifferences, provider, model, latencyMs);
    }

    public static CodeTranspileResponse fail(String sourceLanguage, String targetLanguage, String message) {
        return new CodeTranspileResponse(false, sourceLanguage, targetLanguage, "", message, List.of(), "NONE", "none", 0L);
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getSourceLanguage() { return sourceLanguage; }
    public void setSourceLanguage(String sourceLanguage) { this.sourceLanguage = sourceLanguage; }

    public String getTargetLanguage() { return targetLanguage; }
    public void setTargetLanguage(String targetLanguage) { this.targetLanguage = targetLanguage; }

    public String getTranslatedCode() { return translatedCode; }
    public void setTranslatedCode(String translatedCode) { this.translatedCode = translatedCode; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public List<String> getKeyDifferences() { return keyDifferences; }
    public void setKeyDifferences(List<String> keyDifferences) { this.keyDifferences = keyDifferences; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public Long getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Long latencyMs) { this.latencyMs = latencyMs; }
}
