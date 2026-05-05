package com.canvas.server.models;

import com.canvas.server.models.enums.PermissionType;

import java.util.UUID;

public class AllowedUser{
    private UUID id;
    private String name;
    private String email;
    private PermissionType permissionType;

    public AllowedUser(UUID id, String name, String email, PermissionType permissionType) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.permissionType = permissionType;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public PermissionType getPermissionType() {
        return permissionType;
    }
}
