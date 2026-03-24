package com.canvas.mobile.entities;

import com.canvas.mobile.entities.enums.ElementType;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.UUID;

public class Element {
    private UUID id;
    private UUID whiteboardId;
    private final ElementType type;
    private final JsonNode properties;
    private final int zIndex;

    public Element(UUID id, UUID whiteboardId, ElementType type, JsonNode properties, int zIndex) {
        this.id = id;
        this.whiteboardId = whiteboardId;
        this.type = type;
        this.properties = properties;
        this.zIndex = zIndex;
    }

    public UUID getId() {
        return id;
    }

    public int getZIndex() {
        return zIndex;
    }

    public JsonNode getProperties() {
        return properties;
    }

    public ElementType getType() {
        return type;
    }

    public UUID getWhiteboardId() {
        return whiteboardId;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setWhiteboardId(UUID whiteboardId) {
        this.whiteboardId = whiteboardId;
    }
}
