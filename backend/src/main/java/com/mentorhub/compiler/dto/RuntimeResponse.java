package com.mentorhub.compiler.dto;

import java.util.List;

public class RuntimeResponse {
    private String language;
    private String version;
    private List<String> aliases;

    public RuntimeResponse() {}

    public RuntimeResponse(String language, String version, List<String> aliases) {
        this.language = language;
        this.version = version;
        this.aliases = aliases;
    }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public List<String> getAliases() { return aliases; }
    public void setAliases(List<String> aliases) { this.aliases = aliases; }
}
