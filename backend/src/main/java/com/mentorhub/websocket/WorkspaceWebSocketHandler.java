package com.mentorhub.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Component
public class WorkspaceWebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> activeSessions = Collections.synchronizedSet(new HashSet<>());

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        activeSessions.add(session);
        // Send welcome acknowledgment
        session.sendMessage(new TextMessage("{\"type\":\"CONNECTED\",\"message\":\"Connected to MentorHub Real-Time Workspace Workspace WebSocket Server\"}"));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        // Broadcast incoming message to all connected sessions except sender
        synchronized (activeSessions) {
            for (WebSocketSession s : activeSessions) {
                if (s.isOpen()) {
                    try {
                        s.sendMessage(new TextMessage(payload));
                    } catch (IOException e) {
                        // ignore failed session
                    }
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        activeSessions.remove(session);
    }
}
