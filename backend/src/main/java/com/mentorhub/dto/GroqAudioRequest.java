package com.mentorhub.dto;

public class GroqAudioRequest {
    private String text;
    private String model;
    private String voice;

    public GroqAudioRequest() {}

    public GroqAudioRequest(String text, String model, String voice) {
        this.text = text;
        this.model = model;
        this.voice = voice;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getVoice() {
        return voice;
    }

    public void setVoice(String voice) {
        this.voice = voice;
    }
}
