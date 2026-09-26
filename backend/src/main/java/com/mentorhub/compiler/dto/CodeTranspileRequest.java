package com.mentorhub.compiler.dto;

public class CodeTranspileRequest {
    private String sourceLanguage;
    private String targetLanguage;
    private String code;

    public CodeTranspileRequest() {}

    public CodeTranspileRequest(String sourceLanguage, String targetLanguage, String code) {
        this.sourceLanguage = sourceLanguage;
        this.targetLanguage = targetLanguage;
        this.code = code;
    }

    public String getSourceLanguage() { return sourceLanguage; }
    public void setSourceLanguage(String sourceLanguage) { this.sourceLanguage = sourceLanguage; }

    public String getTargetLanguage() { return targetLanguage; }
    public void setTargetLanguage(String targetLanguage) { this.targetLanguage = targetLanguage; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
