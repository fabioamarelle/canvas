package com.canvas.server.controllers;

import java.util.ArrayList;
import java.util.Objects;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.canvas.server.models.User;
import com.canvas.server.models.Whiteboard;
import com.canvas.server.utilities.dao.UserDAO;
import com.canvas.server.utilities.dao.WhiteboardDAO;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @GetMapping("/{id}/whiteboards")
    public ArrayList<Whiteboard> getWhiteboardsByUser(@PathVariable String id) {
        UUID uuid = UUID.fromString(id);

        return WhiteboardDAO.getWhiteBoardsByUser(
            Objects.requireNonNull(UserDAO.getUserById(uuid))
        );
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable String id) {
        UUID uuid = UUID.fromString(id);

        return UserDAO.getUserById(uuid);
    }
}
