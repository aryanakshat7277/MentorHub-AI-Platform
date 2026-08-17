package com.mentorhub.service;

import com.mentorhub.dto.GroqAudioRequest;
import com.mentorhub.dto.GroqAudioResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.Map;

@Service
public class GroqAudioService {

    @Value("${ai.groq.api-key:${groq.api.key:}}")
    private String groqApiKey;

    @Value("${ai.groq.stt-model:whisper-large-v3-turbo}")
    private String sttModel;

    @Value("${ai.groq.tts-model:canopylabs/orpheus-v1-english}")
    private String ttsModel;

    private final RestTemplate restTemplate;

    public GroqAudioService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Speech-to-Text (STT) via Groq Whisper Large V3 Turbo
     */
    @SuppressWarnings("rawtypes")
    public GroqAudioResponse transcribeAudio(byte[] audioBytes, String filename) {
        if (!hasValidKey()) {
            return new GroqAudioResponse("Fallback Audio Input Received", null, sttModel, "LOCAL_FALLBACK");
        }

        try {
            String url = "https://api.groq.com/openai/v1/audio/transcriptions";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(groqApiKey);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("model", sttModel);
            body.add("language", "en");
            body.add("response_format", "json");

            ByteArrayResource fileResource = new ByteArrayResource(audioBytes) {
                @Override
                public String getFilename() {
                    return (filename != null && !filename.isEmpty()) ? filename : "audio.wav";
                }
            };
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String text = (String) response.getBody().get("text");
                return new GroqAudioResponse(text, null, sttModel, "SUCCESS");
            }
        } catch (Exception e) {
            System.err.println("Groq STT Fallback Error: " + e.getMessage());
        }

        return new GroqAudioResponse("Could not transcribe audio.", null, sttModel, "ERROR");
    }

    /**
     * Text-to-Speech (TTS) via Groq Orpheus V1 English
     */
    public GroqAudioResponse synthesizeSpeech(GroqAudioRequest request) {
        String textToSpeak = request.getText();
        String modelToUse = (request.getModel() != null && !request.getModel().isEmpty()) ? request.getModel() : ttsModel;

        if (!hasValidKey() || textToSpeak == null || textToSpeak.trim().isEmpty()) {
            return new GroqAudioResponse(textToSpeak, null, modelToUse, "LOCAL_FALLBACK");
        }

        try {
            String url = "https://api.groq.com/openai/v1/audio/speech";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            Map<String, Object> body = Map.of(
                    "model", modelToUse,
                    "input", textToSpeak,
                    "voice", (request.getVoice() != null) ? request.getVoice() : "orpheus-en-standard",
                    "response_format", "mp3"
            );

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<byte[]> response = restTemplate.postForEntity(url, requestEntity, byte[].class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String base64 = Base64.getEncoder().encodeToString(response.getBody());
                return new GroqAudioResponse(textToSpeak, base64, modelToUse, "SUCCESS");
            }
        } catch (Exception e) {
            System.err.println("Groq TTS Fallback Error: " + e.getMessage());
        }

        return new GroqAudioResponse(textToSpeak, null, modelToUse, "ERROR");
    }

    private boolean hasValidKey() {
        return groqApiKey != null && !groqApiKey.trim().isEmpty() && groqApiKey.startsWith("gsk_");
    }
}
