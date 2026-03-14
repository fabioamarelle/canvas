package com.canvas.server.models;

import java.util.ArrayList;
import java.util.UUID;

public class Whiteboard {
    private final UUID id;
    private final String name;
    private final UUID ownerId;
    private final ArrayList<Element> elementList;

    public Whiteboard(UUID id, String name, UUID ownerId, ArrayList<Element> elementList) {
        this.id = id;
        this.name = name;
        this.ownerId = ownerId;
        this.elementList = elementList;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public ArrayList<Element> getElementList() {
        return elementList;
    }
}

