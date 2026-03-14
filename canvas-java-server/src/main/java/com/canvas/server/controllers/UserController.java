package com.canvas.server.controllers;

import com.canvas.server.models.Whiteboard;
import com.canvas.server.models.User;
import com.canvas.server.utilities.dao.UserDAO;
import com.canvas.server.utilities.dao.WhiteboardDAO;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
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
