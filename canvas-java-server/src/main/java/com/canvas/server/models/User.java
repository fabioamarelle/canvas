package com.canvas.server.models;

import java.util.UUID;

public class User {
    private final UUID id;
    private final String username;
    private final String email;
    private final String passwordHash;

    public User(UUID id, String username, String email, String passwordHash) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }
}
