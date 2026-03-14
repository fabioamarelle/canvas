package com.canvas.server.utilities.dao;

import com.canvas.server.models.User;
import com.canvas.server.utilities.AuthHelper;
import com.canvas.server.utilities.DatabaseHelper;
import com.canvas.server.utilities.logging.LoggingHelper;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

public class UserDAO {
    public static User getUserById(UUID id) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");
            PreparedStatement ps = connection.prepareStatement("SELECT * FROM users WHERE user_id = ?");
            ps.setString(1, id.toString());
            ResultSet rs = ps.executeQuery();
            if (!rs.isBeforeFirst()) { return null; }
            rs.next();

            return new User(
                UUID.fromString(rs.getString(1)),
                rs.getString(2),
                rs.getString(3),
                rs.getString(4));

        } catch (SQLException e) {
            LoggingHelper.logError("UserDAO", e);
            return null;
        }
    }

    public static User getUserByEmail(String email) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");
            PreparedStatement ps = connection.prepareStatement("SELECT * FROM users WHERE email = ?");
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            if (!rs.isBeforeFirst()) { return null; }
            rs.next();

            return new User(
                UUID.fromString(rs.getString(1)),
                rs.getString(2),
                rs.getString(3),
                rs.getString(4));

        } catch (SQLException e) {
            LoggingHelper.logError("UserDAO", e);
            return null;
        }
    }


}
