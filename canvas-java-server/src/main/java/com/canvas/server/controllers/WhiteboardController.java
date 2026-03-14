package com.canvas.server.controllers;

import com.canvas.server.models.Whiteboard;
import com.canvas.server.utilities.dao.WhiteboardDAO;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/whiteboards")
@CrossOrigin(origins = "*")
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
}

