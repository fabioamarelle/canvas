package com.canvas.mobile.entities;

import java.util.UUID;

public class User {
    private UUID id;
    private String username;
    private String email;

    public UUID getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
}