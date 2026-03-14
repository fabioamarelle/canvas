package com.canvas.server.controllers;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.canvas.server.entities.enums.PermissionType;
import com.canvas.server.models.AllowedUser;
import com.canvas.server.models.User;
import com.canvas.server.utilities.dao.UserDAO;
import com.canvas.server.utilities.dao.WhiteboardDAO;
import com.canvas.server.utilities.logging.LoggingHelper;

@RestController
@RequestMapping("/api/whiteboards/{id}/collaborators")
public class PermissionController {

    @GetMapping
    public ResponseEntity<List<AllowedUser>> getCollaborators(@PathVariable UUID id) {
        try {
            List<AllowedUser> collaborators = WhiteboardDAO.getCollaborators(id);
            return ResponseEntity.ok(collaborators);
        } catch (Exception e) {
            LoggingHelper.logError("PermissionController", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> addCollaborator(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String role = payload.get("role");

        try {
            User targetUser = UserDAO.getUserByEmail(email);
            assert targetUser != null;

            PermissionType permission = PermissionType.valueOf(role);
            boolean success = WhiteboardDAO.addCollaborator(id, targetUser.getId(), permission);

            if (success) {
                AllowedUser allowedUser = new AllowedUser(targetUser.getId(), targetUser.getUsername(), targetUser.getEmail(), permission);
                return ResponseEntity.ok(allowedUser);
            } else {
                return ResponseEntity.badRequest().body(Map.of("message", "L'usuari ja té accés."));
            }
        } catch (Exception e) {
            LoggingHelper.logError("PermissionController", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Error del servidor."));
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateRole(@PathVariable UUID id, @PathVariable UUID userId, @RequestBody Map<String, String> payload) {
        try {
            PermissionType newPermission = PermissionType.valueOf(payload.get("role"));
            boolean success = WhiteboardDAO.updateCollaboratorPermission(id, userId, newPermission);

            return success ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
        } catch (Exception e) {
            LoggingHelper.logError("PermissionController", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> removeCollaborator(@PathVariable UUID id, @PathVariable UUID userId) {
        try {
            boolean success = WhiteboardDAO.deleteCollaborator(id, userId);
            return success ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
        } catch (Exception e) {
            LoggingHelper.logError("PermissionController", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}