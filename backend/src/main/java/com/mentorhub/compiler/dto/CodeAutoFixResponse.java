package com.mentorhub.compiler.dto;

import java.util.List;

public class CodeAutoFixResponse {
    private boolean success;
    private String explanation;
    private String fixSummary;
    private String fixedCode;
    private String errorSnippet;
    private String fixedSnippet;
    private List<Integer> diffLines;
    private String provider;
    private String model;
    private Long latencyMs;

    public CodeAutoFixResponse() {}

    public CodeAutoFixResponse(boolean success, String explanation, String fixSummary, String fixedCode,
                               String errorSnippet, String fixedSnippet, List<Integer> diffLines,
                               String provider, String model, Long latencyMs) {
        this.success = success;
        this.explanation = explanation;
        this.fixSummary = fixSummary;
        this.fixedCode = fixedCode;
        this.errorSnippet = errorSnippet;
        this.fixedSnippet = fixedSnippet;
        this.diffLines = diffLines;
        this.provider = provider;
        this.model = model;
        this.latencyMs = latencyMs;
    }

    public static CodeAutoFixResponse ok(String explanation, String fixSummary, String fixedCode,
                                         String errorSnippet, String fixedSnippet, List<Integer> diffLines,
                                         String provider, String model, Long latencyMs) {
        return new CodeAutoFixResponse(true, explanation, fixSummary, fixedCode, errorSnippet, fixedSnippet, diffLines, provider, model, latencyMs);
    }

    public static CodeAutoFixResponse fail(String message) {
        return new CodeAutoFixResponse(false, message, "Unable to fix", "", "", "", List.of(), "NONE", "none", 0L);
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getFixSummary() { return fixSummary; }
    public void setFixSummary(String fixSummary) { this.fixSummary = fixSummary; }

    public String getFixedCode() { return fixedCode; }
    public void setFixedCode(String fixedCode) { this.fixedCode = fixedCode; }

    public String getErrorSnippet() { return errorSnippet; }
    public void setErrorSnippet(String errorSnippet) { this.errorSnippet = errorSnippet; }

    public String getFixedSnippet() { return fixedSnippet; }
    public void setFixedSnippet(String fixedSnippet) { this.fixedSnippet = fixedSnippet; }

    public List<Integer> getDiffLines() { return diffLines; }
    public void setDiffLines(List<Integer> diffLines) { this.diffLines = diffLines; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public Long getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Long latencyMs) { this.latencyMs = latencyMs; }
}
