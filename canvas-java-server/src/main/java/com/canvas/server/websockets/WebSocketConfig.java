package com.canvas.server.websockets;

import com.canvas.server.WhiteboardWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final WhiteboardWebSocketHandler whiteboardWebSocketHandler;

    public WebSocketConfig(WhiteboardWebSocketHandler whiteboardWebSocketHandler) {
        this.whiteboardWebSocketHandler = whiteboardWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(whiteboardWebSocketHandler, "/ws/whiteboard/**") 
            .setAllowedOriginPatterns("*")
            .withSockJS();
    }
}
