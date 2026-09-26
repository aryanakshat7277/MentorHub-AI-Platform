package com.mentorhub.websocket;

import com.mentorhub.service.GeminiLiveSessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class LiveWebSocketProxyHandler extends AbstractWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(LiveWebSocketProxyHandler.class);

    private final GeminiLiveSessionService sessionService;
    private final Map<String, WebSocketSession> clientToGeminiSessions = new ConcurrentHashMap<>();
    private final WebSocketClient webSocketClient;
    private final AtomicInteger currentKeyIndex = new AtomicInteger(0);

    public LiveWebSocketProxyHandler(GeminiLiveSessionService sessionService) {
        this.sessionService = sessionService;
        jakarta.websocket.WebSocketContainer container = jakarta.websocket.ContainerProvider.getWebSocketContainer();
        container.setDefaultMaxTextMessageBufferSize(1024 * 1024); // 1MB
        container.setDefaultMaxBinaryMessageBufferSize(1024 * 1024); // 1MB
        this.webSocketClient = new org.springframework.web.socket.client.standard.StandardWebSocketClient(container);
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession clientSession) throws Exception {
        String clientSessionId = clientSession.getId();
        logger.info("Client connected to Live Voice Proxy on /ws-ai-live: {}", clientSessionId);

        // Clean up any previous upstream session for this client
        WebSocketSession oldSession = clientToGeminiSessions.remove(clientSessionId);
        if (oldSession != null && oldSession.isOpen()) {
            try {
                oldSession.close();
            } catch (Exception ignored) {}
        }

        java.util.List<String> apiKeys = sessionService.getGeminiApiKeys();
        String requestedModel = sessionService.getLiveModel();
        if (requestedModel == null || requestedModel.trim().isEmpty()) {
            requestedModel = "gemini-3.1-flash-live-preview";
        }

        if (apiKeys == null || apiKeys.isEmpty()) {
            logger.warn("Gemini API key is empty for Live API proxy. Sending FALLBACK signal to client.");
            clientSession.sendMessage(new TextMessage("{\"type\":\"FALLBACK\",\"reason\":\"GEMINI_KEY_MISSING\"}"));
            return;
        }

        WebSocketSession geminiSession = null;
        Exception lastException = null;

        String requestedVoice = sessionService.getLiveVoice();
        if (requestedVoice == null || requestedVoice.isBlank()) {
            requestedVoice = "Kore";
        }
        try {
            if (clientSession.getUri() != null && clientSession.getUri().getQuery() != null) {
                for (String param : clientSession.getUri().getQuery().split("&")) {
                    String[] pair = param.split("=");
                    if (pair.length == 2 && "model".equalsIgnoreCase(pair[0])) {
                        String m = pair[1].trim();
                        if (!m.isEmpty()) {
                            requestedModel = m;
                        }
                    } else if (pair.length == 2 && "voice".equalsIgnoreCase(pair[0])) {
                        String v = pair[1].trim();
                        if (!v.isEmpty()) {
                            requestedVoice = v;
                        }
                    }
                }
            }
        } catch (Exception ignored) {}

        // Google BidiGenerateContent endpoint exclusively supports gemini-3.1-flash-live-preview.
        if (requestedModel == null || !requestedModel.contains("live") || requestedModel.contains("3.8") || requestedModel.contains("3.6")) {
            logger.info("Normalizing live model '{}' to Google BidiGenerateContent live streaming model 'gemini-3.1-flash-live-preview'", requestedModel);
            requestedModel = "gemini-3.1-flash-live-preview";
        }

        final String effectiveVoice = requestedVoice;
        final String effectiveModel = requestedModel;
        logger.info("Live Voice Proxy for client {}: Model={}, Voice={}", clientSessionId, effectiveModel, effectiveVoice);

        int totalKeys = apiKeys.size();
        int startIndex = currentKeyIndex.get() % totalKeys;

        for (int attempt = 0; attempt < totalKeys; attempt++) {
            int keyIdx = (startIndex + attempt) % totalKeys;
            String apiKey = apiKeys.get(keyIdx);
            try {
                logger.info("Attempting Live API upstream connection with key index {}...", keyIdx);
                String geminiWsUri = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=" + apiKey;
                
                geminiSession = webSocketClient.execute(new AbstractWebSocketHandler() {
                    @Override
                    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                        logger.info("Connected upstream to Gemini Live Bidi WebSocket for client {} (Model: {}, Voice: {})", clientSessionId, effectiveModel, effectiveVoice);
                        
                        String systemInstructionText = sessionService.createLiveSession("").getSystemInstruction();
                        String setupTemplate = """
                            {
                              "setup": {
                                "model": "models/{{MODEL}}",
                                "generationConfig": {
                                  "responseModalities": ["AUDIO"],
                                  "speechConfig": {
                                    "voiceConfig": {
                                      "prebuiltVoiceConfig": {
                                        "voiceName": "{{VOICE}}"
                                      }
                                    }
                                  }
                                },
                                "inputAudioTranscription": {},
                                "outputAudioTranscription": {},
                                "systemInstruction": {
                                  "parts": [
                                    {
                                      "text": {{SYSTEM_INSTRUCTION}}
                                    }
                                  ]
                                }
                              }
                            }
                            """;
                        String setupJson = setupTemplate
                                .replace("{{MODEL}}", effectiveModel)
                                .replace("{{VOICE}}", effectiveVoice)
                                .replace("{{SYSTEM_INSTRUCTION}}", escapeJsonString(systemInstructionText));
                        
                        logger.info("Sending setupJson to Gemini Live (Model: {}, Voice: {})", effectiveModel, effectiveVoice);
                        session.sendMessage(new TextMessage(setupJson));
                    }

                    @Override
                    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
                        String payloadStr = message.getPayload();
                        if (logger.isDebugEnabled() || (!payloadStr.contains("inlineData") && !payloadStr.contains("audio/pcm"))) {
                            logger.info("Gemini -> Client text: {}", payloadStr.length() > 200 ? payloadStr.substring(0, 200) + "..." : payloadStr);
                        }
                        if (clientSession.isOpen()) {
                            clientSession.sendMessage(message);
                        }
                    }

                    @Override
                    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
                        String payloadStr = java.nio.charset.StandardCharsets.UTF_8.decode(message.getPayload()).toString();
                        if (logger.isDebugEnabled() || (!payloadStr.contains("inlineData") && !payloadStr.contains("audio/pcm"))) {
                            logger.info("Gemini -> Client binary message: {}", payloadStr.length() > 200 ? payloadStr.substring(0, 200) + "..." : payloadStr);
                        }
                        if (clientSession.isOpen()) {
                            clientSession.sendMessage(new TextMessage(payloadStr));
                        }
                    }

                    @Override
                    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
                        logger.info("Upstream Gemini session closed for client {}: {}", clientSessionId, status);
                        if (status.getCode() == 1011 || (status.getReason() != null && status.getReason().toLowerCase().contains("quota"))) {
                            logger.warn("Upstream Gemini quota exceeded for key index {}. Rotating to next key.", keyIdx);
                            currentKeyIndex.incrementAndGet();
                        }
                        try {
                            if (clientSession.isOpen()) {
                                clientSession.sendMessage(new TextMessage("{\"type\":\"DISCONNECTED\",\"status\":\"" + status.getReason() + "\"}"));
                            }
                        } catch (Exception ignored) {}
                    }

                    @Override
                    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
                        logger.error("Upstream Gemini transport error for client {}: {}", clientSessionId, exception.getMessage());
                        try {
                            if (clientSession.isOpen()) {
                                clientSession.sendMessage(new TextMessage("{\"type\":\"FALLBACK\",\"reason\":\"TRANSPORT_ERROR\"}"));
                            }
                        } catch (Exception ignored) {}
                    }
                }, new WebSocketHttpHeaders(), URI.create(geminiWsUri)).get();

                if (geminiSession != null && geminiSession.isOpen()) {
                    clientToGeminiSessions.put(clientSessionId, geminiSession);
                    logger.info("Successfully established Live API session for client {} using key index {}", clientSessionId, keyIdx);
                    return;
                }
            } catch (Exception e) {
                lastException = e;
                logger.warn("Failed to connect to Gemini Live Bidi WebSocket using key index {}: {}", keyIdx, e.getMessage());
                currentKeyIndex.incrementAndGet();
            }
        }

        logger.error("All Gemini API keys failed to establish connection for client {}. Last error: {}", clientSessionId, lastException != null ? lastException.getMessage() : "Unknown");
        try {
            if (clientSession.isOpen()) {
                clientSession.sendMessage(new TextMessage("{\"type\":\"FALLBACK\",\"reason\":\"CONNECTION_FAILED\"}"));
            }
        } catch (Exception ignored) {}
    }

    @Override
    protected void handleTextMessage(WebSocketSession clientSession, TextMessage message) throws Exception {
        String payload = message.getPayload();
        if (payload != null && !payload.contains("mediaChunks") && !payload.contains("audio")) {
            logger.info("Client -> Gemini message: {}", payload);
        }

        // Drop deprecated mediaChunks to prevent Gemini 3.1 Flash Live Preview CloseStatus 1007
        if (payload != null && payload.contains("mediaChunks")) {
            logger.warn("LiveWebSocketProxyHandler: Blocked deprecated mediaChunks payload for client {} (use video/audio/text instead)", clientSession.getId());
            return;
        }

        WebSocketSession geminiSession = clientToGeminiSessions.get(clientSession.getId());
        if (geminiSession != null && geminiSession.isOpen()) {
            geminiSession.sendMessage(message);
        }
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession clientSession, BinaryMessage message) throws Exception {
        WebSocketSession geminiSession = clientToGeminiSessions.get(clientSession.getId());
        if (geminiSession != null && geminiSession.isOpen()) {
            geminiSession.sendMessage(message);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession clientSession, CloseStatus status) throws Exception {
        String clientSessionId = clientSession.getId();
        logger.info("Client disconnected from Live Voice Proxy: {}", clientSessionId);
        
        WebSocketSession geminiSession = clientToGeminiSessions.remove(clientSessionId);
        if (geminiSession != null && geminiSession.isOpen()) {
            try {
                geminiSession.close(status);
            } catch (IOException e) {
                logger.debug("Error closing upstream session: {}", e.getMessage());
            }
        }
    }

    private String escapeJsonString(String input) {
        if (input == null) return "\"\"";
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(input);
        } catch (Exception e) {
            return "\"" + input
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t")
                + "\"";
        }
    }
}
