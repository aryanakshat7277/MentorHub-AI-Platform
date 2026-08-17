package com.mentorhub.dto;

public class GroqAudioResponse {
    private String text;
    private String audioBase64;
    private String model;
    private String status;

    public GroqAudioResponse() {}

    public GroqAudioResponse(String text, String audioBase64, String model, String status) {
        this.text = text;
        this.audioBase64 = audioBase64;
        this.model = model;
        this.status = status;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getAudioBase64() {
        return audioBase64;
    }

    public void setAudioBase64(String audioBase64) {
        this.audioBase64 = audioBase64;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
