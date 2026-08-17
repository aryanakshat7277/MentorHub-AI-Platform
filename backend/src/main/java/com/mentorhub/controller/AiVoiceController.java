package com.mentorhub.controller;

import com.mentorhub.dto.GroqAudioRequest;
import com.mentorhub.dto.GroqAudioResponse;
import com.mentorhub.dto.VoiceSessionResponse;
import com.mentorhub.service.GeminiLiveSessionService;
import com.mentorhub.service.GroqAudioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/ai/voice")
public class AiVoiceController {

    private final GeminiLiveSessionService liveSessionService;
    private final GroqAudioService groqAudioService;

    public AiVoiceController(GeminiLiveSessionService liveSessionService, GroqAudioService groqAudioService) {
        this.liveSessionService = liveSessionService;
        this.groqAudioService = groqAudioService;
    }

    @PostMapping("/session")
    public ResponseEntity<VoiceSessionResponse> createLiveSession(@RequestParam(required = false, defaultValue = "user") String username) {
        VoiceSessionResponse response = liveSessionService.createLiveSession(username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/stt")
    public ResponseEntity<GroqAudioResponse> transcribeAudio(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(new GroqAudioResponse("Empty audio payload.", null, "whisper-large-v3-turbo", "ERROR"));
        }
        try {
            byte[] bytes = file.getBytes();
            GroqAudioResponse response = groqAudioService.transcribeAudio(bytes, file.getOriginalFilename());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new GroqAudioResponse(e.getMessage(), null, "whisper-large-v3-turbo", "ERROR"));
        }
    }

    @PostMapping("/tts")
    public ResponseEntity<GroqAudioResponse> synthesizeSpeech(@RequestBody GroqAudioRequest request) {
        GroqAudioResponse response = groqAudioService.synthesizeSpeech(request);
        return ResponseEntity.ok(response);
    }
}
