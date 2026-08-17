package com.mentorhub.websocket;

import com.mentorhub.service.GeminiLiveSessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
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
    private final WebSocketClient webSocketClient = new StandardWebSocketClient();

    public LiveWebSocketProxyHandler(GeminiLiveSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession clientSession) throws Exception {
        String clientSessionId = clientSession.getId();
        logger.info("Client connected to Live Voice Proxy on /ws-ai-live: {}", clientSessionId);

        String apiKey = sessionService.getGeminiApiKey();
        String liveModel = sessionService.getLiveModel();

        if (apiKey == null || apiKey.trim().isEmpty()) {
            logger.warn("Gemini API key is empty for Live API proxy. Sending FALLBACK signal to client.");
            clientSession.sendMessage(new TextMessage("{\"type\":\"FALLBACK\",\"reason\":\"GEMINI_KEY_MISSING\"}"));
            return;
        }

        try {
            String geminiWsUri = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=" + apiKey;
            
            WebSocketSession geminiSession = webSocketClient.execute(new AbstractWebSocketHandler() {
                @Override
                public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                    logger.info("Connected upstream to Gemini Live Bidi WebSocket for client {}", clientSessionId);
                    
                    // Send initial Live setup configuration
                    String setupJson = String.format("""
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
                    
                    session.sendMessage(new TextMessage(setupJson));
                }

                @Override
                protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
                    if (clientSession.isOpen()) {
                        clientSession.sendMessage(message);
                    }
                }

                @Override
                protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
                    if (clientSession.isOpen()) {
                        clientSession.sendMessage(message);
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

            clientToGeminiSessions.put(clientSessionId, geminiSession);

        } catch (Exception e) {
            logger.error("Failed to establish upstream Gemini Live Bidi connection: {}", e.getMessage());
            clientSession.sendMessage(new TextMessage("{\"type\":\"FALLBACK\",\"reason\":\"CONNECTION_FAILED\"}"));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession clientSession, TextMessage message) throws Exception {
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
}
