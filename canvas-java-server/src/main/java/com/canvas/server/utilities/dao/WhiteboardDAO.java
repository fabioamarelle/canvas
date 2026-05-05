package com.canvas.server.utilities.dao;

import com.canvas.server.models.AllowedUser;
import com.canvas.server.models.User;
import com.canvas.server.models.Whiteboard;
import com.canvas.server.models.enums.PermissionType;
import com.canvas.server.utilities.DatabaseHelper;
import com.canvas.server.utilities.logging.LoggingHelper;

import java.sql.*;
import java.util.ArrayList;
import java.util.UUID;

public class WhiteboardDAO {

    public static Whiteboard getWhiteboard(UUID id) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");
            PreparedStatement ps = connection.prepareStatement("""
                SELECT * FROM whiteboards
                WHERE whiteboard_id = ? LIMIT 1;
            """);

            ps.setString(1, id.toString());
            ResultSet rs = ps.executeQuery();

            if (!rs.isBeforeFirst()) { return null; }
            rs.next();
            return new Whiteboard(
                UUID.fromString(rs.getString("whiteboard_id")),
                rs.getString("name"),
                UUID.fromString(rs.getString("owner_id")),
                ElementDAO.getElementsByWhiteboard(id)
            );

        } catch (SQLException e) {
            LoggingHelper.logError("WhiteboardDAO", e);
            return null;
        }
    }

    public static Whiteboard createWhiteboard(UUID id, String name, UUID ownerId) {

        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");
            PreparedStatement ps = connection.prepareStatement("""
                INSERT INTO whiteboards (whiteboard_id, name, owner_id)
                VALUES (?,?,?);
            """);

            ps.setString(1, id.toString());
            ps.setString(2, name);
            ps.setString(3, ownerId.toString());

            if (ps.executeUpdate() != 0) {
                return new Whiteboard(
                    id,
                    name,
                    ownerId,
                    new ArrayList<>());
            } else { return null; }

        } catch (SQLException e) {
            LoggingHelper.logError("WhiteboardDAO", e);
            return null;
        }
    }

    public static ArrayList<Whiteboard> getWhiteBoardsByUser(User user) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");
            PreparedStatement ps = connection.prepareStatement("""
                SELECT whiteboards.whiteboard_id, whiteboards.name,
                whiteboards.owner_id, whiteboards.created_at FROM whiteboards
                LEFT JOIN allowed_users
                ON whiteboards.whiteboard_id = allowed_users.whiteboard_id
                WHERE whiteboards.owner_id = ? OR allowed_users.user_id = ?;
            """);

            ps.setString(1, user.getId().toString());
            ps.setString(2, user.getId().toString());
            ResultSet rs = ps.executeQuery();

            ArrayList<Whiteboard> whiteboardList = new ArrayList<>();

            if (!rs.isBeforeFirst()) { return null; }
            while (rs.next()) {
                whiteboardList.add(
                    new Whiteboard(
                        UUID.fromString(rs.getString("whiteboard_id")),
                        rs.getString("name"),
                        UUID.fromString(rs.getString("owner_id")),
                        new ArrayList<>()
                    )
                );
            }
            return whiteboardList;

        } catch (SQLException e) {
            LoggingHelper.logError("WhiteboardDAO", e);
            return null;
        }
    }

    public static boolean deleteWhiteboard(UUID id) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");
            PreparedStatement ps = connection.prepareStatement(
                "DELETE FROM whiteboards WHERE whiteboard_id = ?;");

            ps.setString(1, id.toString());

            return ps.executeUpdate() != 0;

        } catch (SQLException e) {
            LoggingHelper.logError("WhiteboardDAO", e);
            return false;
        }
    }

    public static ArrayList<AllowedUser> getCollaborators(UUID whiteboardId) {
        ArrayList<AllowedUser> collaborators = new ArrayList<>();
        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");

            try (PreparedStatement ps = connection.prepareStatement("""
            SELECT u.user_id, u.username, u.email, au.permission
            FROM users u
            INNER JOIN allowed_users au ON u.user_id = au.user_id
            WHERE au.whiteboard_id = ?;
        """)) {

                ps.setString(1, whiteboardId.toString());
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        AllowedUser user = new AllowedUser(
                                UUID.fromString(rs.getString("user_id")),
                                rs.getString("username"),
                                rs.getString("email"),
                                PermissionType.valueOf(rs.getString("permission").toUpperCase())
                        );
                        collaborators.add(user);
                    }
                }
            }
        } catch (SQLException e) {
            LoggingHelper.logError("WhiteboardDAO", e);
            return null;
        }
        return collaborators;
    }

    public static boolean addCollaborator(UUID whiteboardId, UUID userId, PermissionType permissionType) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");

            try (PreparedStatement ps = connection.prepareStatement("""
                INSERT INTO allowed_users (user_id, whiteboard_id, permission)
                VALUES (?,?,?);
            """)) {

                ps.setString(1, userId.toString());
                ps.setString(2, whiteboardId.toString());
                ps.setString(3, permissionType.toString());

                return ps.executeUpdate() != 0;
            }
        } catch (SQLException e) {
            LoggingHelper.logError("WhiteboardDAO", e);
            return false;
        }
    }

    public static boolean deleteCollaborator(UUID whiteboardId, UUID userId) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");

            try (PreparedStatement ps = connection.prepareStatement("""
                DELETE FROM allowed_users
                WHERE user_id = ? AND whiteboard_id = ?;
            """)) {

                ps.setString(1, userId.toString());
                ps.setString(2, whiteboardId.toString());

                return ps.executeUpdate() != 0;
            }
        } catch (SQLException e) {
            LoggingHelper.logError("WhiteboardDAO", e);
            return false;
        }
    }

    public static boolean updateCollaboratorPermission(UUID whiteboardId, UUID userId, PermissionType permissionType) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");

            try (PreparedStatement ps = connection.prepareStatement("""
                UPDATE allowed_users
                SET permission = ?
                WHERE user_id = ? AND whiteboard_id = ?;
            """)) {

                ps.setString(1, permissionType.toString());
                ps.setString(2, userId.toString());
                ps.setString(3, whiteboardId.toString());

                return ps.executeUpdate() != 0;
            }
        } catch (SQLException e) {
            LoggingHelper.logError("WhiteboardDAO", e);
            return false;
        }
    }
}
