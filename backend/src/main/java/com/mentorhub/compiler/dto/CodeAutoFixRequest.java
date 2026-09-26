package com.mentorhub.compiler.dto;

public class CodeAutoFixRequest {
    private String language;
    private String code;
    private String error;
    private String status;

    public CodeAutoFixRequest() {}

    public CodeAutoFixRequest(String language, String code, String error, String status) {
        this.language = language;
        this.code = code;
        this.error = error;
        this.status = status;
    }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
