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

@Component
public class LiveWebSocketProxyHandler extends AbstractWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(LiveWebSocketProxyHandler.class);

    private final GeminiLiveSessionService sessionService;
    private final Map<String, WebSocketSession> clientToGeminiSessions = new ConcurrentHashMap<>();
    private final WebSocketClient webSocketClient;

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
        try {
            if (clientSession.getUri() != null && clientSession.getUri().getQuery() != null) {
                for (String param : clientSession.getUri().getQuery().split("&")) {
                    String[] pair = param.split("=");
                    if (pair.length == 2) {
                        if ("voice".equalsIgnoreCase(pair[0])) {
                            String v = pair[1].trim();
                            if (v.equalsIgnoreCase("Aoede") || v.equalsIgnoreCase("Charon") ||
                                v.equalsIgnoreCase("Fenrir") || v.equalsIgnoreCase("Kore") ||
                                v.equalsIgnoreCase("Puck")) {
                                requestedVoice = v.substring(0, 1).toUpperCase() + v.substring(1).toLowerCase();
                            }
                        } else if ("model".equalsIgnoreCase(pair[0])) {
                            String m = pair[1].trim();
                            if (!m.isEmpty()) {
                                requestedModel = m;
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        final String effectiveVoice = requestedVoice;
        final String effectiveModel = requestedModel;
        logger.info("Live Voice Proxy for client {}: Model={}, Voice={}", clientSessionId, effectiveModel, effectiveVoice);

        for (int i = 0; i < apiKeys.size(); i++) {
            String apiKey = apiKeys.get(i);
            try {
                logger.info("Attempting Live API upstream connection with key index {}...", i);
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
                    logger.info("Successfully established Live API session for client {} using key index {}", clientSessionId, i);
                    return;
                }
            } catch (Exception e) {
                lastException = e;
                logger.warn("Failed to connect to Gemini Live Bidi WebSocket using key index {}: {}", i, e.getMessage());
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

        // Sanitize incoming mediaChunks to prevent Gemini Live CloseStatus 1007 (malformed base64)
        if (payload != null && payload.contains("mediaChunks")) {
            if (payload.contains("\"data\":\"data:,") ||
                payload.contains("\"data\":\"data:image") ||
                payload.contains("\"data\":\"\"") ||
                payload.contains("\"data\": \"data:,")) {
                logger.warn("LiveWebSocketProxyHandler: Dropped malformed mediaChunk to prevent upstream 1007 crash for client {}", clientSession.getId());
                return;
            }
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
        return "\"" + input
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t")
            + "\"";
    }
}
