package com.mentorhub.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final WorkspaceWebSocketHandler workspaceWebSocketHandler;
    private final LiveWebSocketProxyHandler liveWebSocketProxyHandler;

    public WebSocketConfig(WorkspaceWebSocketHandler workspaceWebSocketHandler,
                           LiveWebSocketProxyHandler liveWebSocketProxyHandler) {
        this.workspaceWebSocketHandler = workspaceWebSocketHandler;
        this.liveWebSocketProxyHandler = liveWebSocketProxyHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(workspaceWebSocketHandler, "/ws-workspace")
                .setAllowedOrigins("*");

        registry.addHandler(liveWebSocketProxyHandler, "/ws-ai-live")
                .setAllowedOrigins("*");
    }
}
