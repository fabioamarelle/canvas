package com.canvas.server.utilities;

import com.canvas.server.utilities.logging.LoggingHelper;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import java.sql.*;
import java.util.UUID;

public class AuthHelper {
    private static final Argon2PasswordEncoder ENCODER = new Argon2PasswordEncoder(16, 32, 4, 65536, 4);

    public static boolean register(String username, String email, String password) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            connection.setCatalog("Canvas");
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO users (user_id, username, email, password_hash) VALUES (?,?,?,?);"
            );
            ps.setString(1, UUID.randomUUID().toString());
            ps.setString(2, username);
            ps.setString(3, email);
            ps.setString(4, ENCODER.encode(password));

            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            LoggingHelper.logError("WhiteboardDAO", e);
            return false;
        }
    }

    public static boolean login(String email, String password) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            connection.setCatalog("Canvas");
            PreparedStatement ps = connection.prepareStatement(
                "SELECT password_hash FROM users WHERE email = ?"
            );
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();

            if (rs.next() && ENCODER.matches(password, rs.getString("password_hash"))) {
                return true;
            }
        } catch (SQLException e) {
            LoggingHelper.logError("WhiteboardDAO", e);
        }
        return false;
    }
}