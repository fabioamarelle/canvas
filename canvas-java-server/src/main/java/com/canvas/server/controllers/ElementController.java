package com.canvas.server.controllers;

import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.canvas.server.models.Element;
import com.canvas.server.utilities.dao.ElementDAO;

@RestController
@RequestMapping("/api/elements")
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