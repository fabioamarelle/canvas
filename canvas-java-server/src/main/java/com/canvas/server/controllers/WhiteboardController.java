package com.canvas.server.controllers;

import java.util.Map;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.canvas.server.models.User;
import com.canvas.server.models.Whiteboard;
import com.canvas.server.utilities.dao.UserDAO;
import com.canvas.server.utilities.dao.WhiteboardDAO;

@RestController
@RequestMapping("/api/whiteboards")
public class WhiteboardController {
    @PostMapping("")
    public Whiteboard createWhiteboard(@RequestBody Map<String, String> body) {
        UUID whiteboardId = UUID.randomUUID();

        String name = body.get("name");
        UUID ownerId = UUID.fromString(body.get("ownerId"));

        return WhiteboardDAO.createWhiteboard(
            whiteboardId,
            name,
            ownerId
        );
    }

    @DeleteMapping("/{id}")
    public boolean deleteWhiteboard(@PathVariable String id) {
        UUID whiteboardId = UUID.fromString(id);

        return WhiteboardDAO.deleteWhiteboard(whiteboardId);
    }

    @GetMapping("/{id}")
    public Whiteboard getWhiteboard(@PathVariable String id) {
        UUID whiteboardId = UUID.fromString(id);
        return WhiteboardDAO.getWhiteboard(whiteboardId);
    }

    @GetMapping("/{id}/owner")
    public User getWhiteboardOwner(@PathVariable String id) {
        UUID whiteboardId = UUID.fromString(id);
        
        return UserDAO.getUserById(
            WhiteboardDAO.getWhiteboard(whiteboardId).getOwnerId());
    }
}

