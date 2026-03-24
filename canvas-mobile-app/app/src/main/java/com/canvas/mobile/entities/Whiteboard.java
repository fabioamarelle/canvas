package com.canvas.mobile.entities;

import java.util.ArrayList;

public class Whiteboard {
    private final String id;
    private final String name;
    private final String ownerId;
    private final ArrayList<Element> elementList;

    public Whiteboard(String id, String name, String ownerId, ArrayList<Element> elementList) {
        this.id = id;
        this.name = name;
        this.ownerId = ownerId;
        this.elementList = elementList;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public ArrayList<Element> getElementList() {
        return elementList;
    }
}

