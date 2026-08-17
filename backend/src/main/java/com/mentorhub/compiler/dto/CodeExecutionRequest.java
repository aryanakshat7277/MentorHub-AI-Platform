package com.mentorhub.compiler.dto;

public class CodeExecutionRequest {
    private String language;
    private String version;
    private String code;
    private String stdin;

    public CodeExecutionRequest() {}

    public CodeExecutionRequest(String language, String version, String code, String stdin) {
        this.language = language;
        this.version = version;
        this.code = code;
        this.stdin = stdin;
    }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getStdin() { return stdin; }
    public void setStdin(String stdin) { this.stdin = stdin; }
}
