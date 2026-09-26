package com.mentorhub.compiler.dto;

public class CodeCompletionRequest {
    private String language;
    private String code;
    private String prefix;
    private String suffix;

    public CodeCompletionRequest() {}

    public CodeCompletionRequest(String language, String code, String prefix, String suffix) {
        this.language = language;
        this.code = code;
        this.prefix = prefix;
        this.suffix = suffix;
    }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getPrefix() { return prefix; }
    public void setPrefix(String prefix) { this.prefix = prefix; }

    public String getSuffix() { return suffix; }
    public void setSuffix(String suffix) { this.suffix = suffix; }
}
