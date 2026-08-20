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
        String liveModel = sessionService.getLiveModel();

        if (apiKeys == null || apiKeys.isEmpty()) {
            logger.warn("Gemini API key is empty for Live API proxy. Sending FALLBACK signal to client.");
            clientSession.sendMessage(new TextMessage("{\"type\":\"FALLBACK\",\"reason\":\"GEMINI_KEY_MISSING\"}"));
            return;
        }

        WebSocketSession geminiSession = null;
        Exception lastException = null;

        for (int i = 0; i < apiKeys.size(); i++) {
            String apiKey = apiKeys.get(i);
            try {
                logger.info("Attempting Live API upstream connection with key index {}...", i);
                String geminiWsUri = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=" + apiKey;
                
                geminiSession = webSocketClient.execute(new AbstractWebSocketHandler() {
                    @Override
                    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                        logger.info("Connected upstream to Gemini Live Bidi WebSocket for client {}", clientSessionId);
                        
                        String systemInstructionText = sessionService.createLiveSession("").getSystemInstruction();
                        String setupJson;
                        if (systemInstructionText != null && !systemInstructionText.trim().isEmpty()) {
                            setupJson = String.format("""
                                {
                                  "setup": {
                                    "model": "models/%s",
                                    "generationConfig": {
                                      "responseModalities": ["AUDIO"],
                                      "speechConfig": {
                                        "voiceConfig": {
                                          "prebuiltVoiceConfig": {
                                            "voiceName": "Puck"
                                          }
                                        }
                                      }
                                    },
                                    "systemInstruction": {
                                      "parts": [
                                        {
                                          "text": %s
                                        }
                                      ]
                                    }
                                  }
                                }
                                """, liveModel, escapeJsonString(systemInstructionText));
                        } else {
                            setupJson = String.format("""
                                {
                                  "setup": {
                                    "model": "models/%s",
                                    "generationConfig": {
                                      "responseModalities": ["AUDIO"],
                                      "speechConfig": {
                                        "voiceConfig": {
                                          "prebuiltVoiceConfig": {
                                            "voiceName": "Puck"
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                                """, liveModel);
                        }
                        
                        logger.info("Sending setupJson to Gemini: {}", setupJson);
                        session.sendMessage(new TextMessage(setupJson));
                    }

                    @Override
                    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
                        logger.info("Gemini -> Client text message: {}", message.getPayload());
                        if (clientSession.isOpen()) {
                            clientSession.sendMessage(message);
                        }
                    }

                    @Override
                    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
                        String payloadStr = new String(message.getPayload().array(), java.nio.charset.StandardCharsets.UTF_8);
                        logger.info("Gemini -> Client binary converted message: {}", payloadStr);
                        if (clientSession.isOpen()) {
                            clientSession.sendMessage(new TextMessage(payloadStr));
                        }
                    }

                    @Override
                    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
                        logger.info("Upstream Gemini session closed for client {}: {}", clientSessionId, status);
                        if (clientSession.isOpen()) {
                            clientSession.sendMessage(new TextMessage("{\"type\":\"DISCONNECTED\",\"status\":\"" + status.getReason() + "\"}"));
                        }
                    }

                    @Override
                    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
                        logger.error("Upstream Gemini transport error for client {}: {}", clientSessionId, exception.getMessage());
                        if (clientSession.isOpen()) {
                            clientSession.sendMessage(new TextMessage("{\"type\":\"FALLBACK\",\"reason\":\"TRANSPORT_ERROR\"}"));
                        }
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
        clientSession.sendMessage(new TextMessage("{\"type\":\"FALLBACK\",\"reason\":\"CONNECTION_FAILED\"}"));
    }

    @Override
    protected void handleTextMessage(WebSocketSession clientSession, TextMessage message) throws Exception {
        String payload = message.getPayload();
        if (payload != null && !payload.contains("mediaChunks") && !payload.contains("audio")) {
            logger.info("Client -> Gemini message: {}", payload);
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
