package com.mentorhub.dto;

public class VoiceSessionResponse {
    private String sessionId;
    private String liveModel;
    private String wsEndpoint;
    private String status;
    private String systemInstruction;

    public VoiceSessionResponse() {}

    public VoiceSessionResponse(String sessionId, String liveModel, String wsEndpoint, String status, String systemInstruction) {
        this.sessionId = sessionId;
        this.liveModel = liveModel;
        this.wsEndpoint = wsEndpoint;
        this.status = status;
        this.systemInstruction = systemInstruction;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getLiveModel() {
        return liveModel;
    }

    public void setLiveModel(String liveModel) {
        this.liveModel = liveModel;
    }

    public String getWsEndpoint() {
        return wsEndpoint;
    }

    public void setWsEndpoint(String wsEndpoint) {
        this.wsEndpoint = wsEndpoint;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSystemInstruction() {
        return systemInstruction;
    }

    public void setSystemInstruction(String systemInstruction) {
        this.systemInstruction = systemInstruction;
    }
}
