package com.canvas.server.controllers;

import com.canvas.server.models.Element;
import com.canvas.server.utilities.dao.ElementDAO;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/elements")
@CrossOrigin(origins = "*")
public class ElementController {
    @PostMapping("/{whiteboardId}")
    public Element createElement(@PathVariable UUID whiteboardId, @RequestBody Element element) {
        element.setId(UUID.randomUUID());

        element.setWhiteboardId(whiteboardId);

        return ElementDAO.createElement(
                element.getId(),
                element.getWhiteboardId(),
                element.getType(),
                element.getProperties(),
                element.getZIndex()
        );
    }

    @DeleteMapping("/{id}")
    public boolean deleteElement(@PathVariable String id) {
        UUID elementId = UUID.fromString(id);

        return ElementDAO.deleteElement(elementId);
    }
}