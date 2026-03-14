package com.canvas.server.controllers;

import com.canvas.server.models.User;
import com.canvas.server.utilities.AuthHelper;
import com.canvas.server.utilities.dao.UserDAO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String email = body.get("email");
        String password = body.get("password");

        if (UserDAO.getUserByEmail(email) != null) {
            return ResponseEntity.status(409).body(Map.of("message", "L'email ja està registrat"));
        }

        boolean success = AuthHelper.register(username, email, password);
        if (success) {
            User user = UserDAO.getUserByEmail(email);
            return ResponseEntity.status(201).body(user);
        } else {
            return ResponseEntity.status(400).body(Map.of("message", "Error en les dades del registre"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        boolean success = AuthHelper.login(email, password);
        if (success) {
            User user = UserDAO.getUserByEmail(email);
            return ResponseEntity.ok(user);
        } else {
            return ResponseEntity.status(401).body(Map.of("message", "Credencials incorrectes"));
        }
    }
}