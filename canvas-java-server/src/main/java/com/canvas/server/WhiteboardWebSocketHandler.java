package com.canvas.server;

import com.canvas.server.models.enums.ElementType;
import com.canvas.server.utilities.dao.ElementDAO;
import com.canvas.server.utilities.logging.LoggingHelper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WhiteboardWebSocketHandler extends TextWebSocketHandler {

    private final Map<String, Set<WebSocketSession>> whiteboardSessions = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) {
        String whiteboardId = getWhiteboardId(session);
        whiteboardSessions.computeIfAbsent(whiteboardId, k -> ConcurrentHashMap.newKeySet()).add(session);
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, TextMessage message) throws Exception {
        String whiteboardId = getWhiteboardId(session);
        JsonNode jsonMessage = mapper.readTree(message.getPayload());
        String action = jsonMessage.get("action").asText();

        try {
            if ("CREATE".equals(action) || "UPDATE".equals(action)) {
                JsonNode elNode = jsonMessage.get("element");

                UUID elementId = UUID.fromString(elNode.get("id").asText());
                ElementType type = ElementType.valueOf(elNode.get("type").asText());
                JsonNode properties = elNode.get("properties");

                int zIndex = elNode.has("zIndex") ? elNode.get("zIndex").asInt() : 0;

                ElementDAO.saveOrUpdateElement(elementId, UUID.fromString(whiteboardId), type, properties, zIndex);

            } else if ("DELETE".equals(action)) {
                UUID elementId = UUID.fromString(jsonMessage.get("elementId").asText());
                ElementDAO.deleteElement(elementId);
            }

            broadcast(whiteboardId, message, session);

        } catch (Exception e) {
            LoggingHelper.logError("WebSockerHandler - " + session.getId() , e);
        }
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) {
        String whiteboardId = getWhiteboardId(session);
        Set<WebSocketSession> sessions = whiteboardSessions.get(whiteboardId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                whiteboardSessions.remove(whiteboardId);
            }
        }
    }

    private String getWhiteboardId(WebSocketSession session) {
        try {
            String path = Objects.requireNonNull(session.getUri()).getPath();
            return path.substring(path.lastIndexOf('/') + 1);
        } catch (Exception e) {
            LoggingHelper.logError("WebSockerHandler - " + session.getId() , e);
        }
        return "";
    }

    private void broadcast(String whiteboardId, TextMessage message, WebSocketSession senderSession) {
        Set<WebSocketSession> sessions = whiteboardSessions.getOrDefault(whiteboardId, Collections.emptySet());

        for (WebSocketSession session : sessions) {
            if (session.isOpen() && !session.getId().equals(senderSession.getId())) {
                try {
                    session.sendMessage(message);
                } catch (Exception e) {
                    LoggingHelper.logError("WebSockerHandler - " + session.getId() , e);
                }
            }
        }
    }
}