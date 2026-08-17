package com.mentorhub.compiler.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "piston")
public class PistonProperties {

    private String baseUrl = "http://localhost:2000";
    private String executePath = "/api/v2/execute";
    private String runtimesPath = "/api/v2/runtimes";
    private int connectTimeout = 5000;
    private int readTimeout = 10000;
    private int maxCodeSize = 65536;
    private int maxInputSize = 10240;
    private int rateLimitPerMin = 20;

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public String getExecutePath() { return executePath; }
    public void setExecutePath(String executePath) { this.executePath = executePath; }

    public String getRuntimesPath() { return runtimesPath; }
    public void setRuntimesPath(String runtimesPath) { this.runtimesPath = runtimesPath; }

    public int getConnectTimeout() { return connectTimeout; }
    public void setConnectTimeout(int connectTimeout) { this.connectTimeout = connectTimeout; }

    public int getReadTimeout() { return readTimeout; }
    public void setReadTimeout(int readTimeout) { this.readTimeout = readTimeout; }

    public int getMaxCodeSize() { return maxCodeSize; }
    public void setMaxCodeSize(int maxCodeSize) { this.maxCodeSize = maxCodeSize; }

    public int getMaxInputSize() { return maxInputSize; }
    public void setMaxInputSize(int maxInputSize) { this.maxInputSize = maxInputSize; }

    public int getRateLimitPerMin() { return rateLimitPerMin; }
    public void setRateLimitPerMin(int rateLimitPerMin) { this.rateLimitPerMin = rateLimitPerMin; }
}
