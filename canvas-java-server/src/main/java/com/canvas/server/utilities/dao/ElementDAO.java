package com.canvas.server.utilities.dao;

import com.canvas.server.models.Element;
import com.canvas.server.models.enums.ElementType;
import com.canvas.server.utilities.DatabaseHelper;
import com.canvas.server.utilities.logging.LoggingHelper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.UUID;

public class ElementDAO {
    private static final ObjectMapper mapper = new ObjectMapper();

    public static Element createElement(UUID elementId, UUID whiteboardId, ElementType type, JsonNode properties, int zIndex) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");
            PreparedStatement ps = connection.prepareStatement("""
                INSERT INTO elements (element_id, whiteboard_id, type, properties, z_index)
                VALUES (?,?,?,?,?);
            """);

            ps.setString(1, elementId.toString());
            ps.setString(2, whiteboardId.toString());
            ps.setString(3, type.toString());
            ps.setString(4, properties.toString());
            ps.setInt(5, zIndex);

            if (ps.executeUpdate() != 0) {
                return new Element(
                        elementId,
                        whiteboardId,
                        type,
                        properties,
                        zIndex);
            } else { return null; }

        } catch (SQLException e) {
            LoggingHelper.logError("ElementDAO", e);
            return null;
        }
    }

    public static ArrayList<Element> getElementsByWhiteboard(UUID whiteboardId) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");
            PreparedStatement ps = connection.prepareStatement("""
                SELECT * FROM elements
                WHERE whiteboard_id = ?;
            """);

            ps.setString(1, whiteboardId.toString());
            ResultSet rs = ps.executeQuery();

            ArrayList<Element> elementList = new ArrayList<>();

            while (rs.next()) {
                JsonNode propertiesNode = mapper.readTree(rs.getString("properties"));
                elementList.add(
                    new Element(
                        UUID.fromString(rs.getString("element_id")),
                        UUID.fromString(rs.getString("whiteboard_id")),
                        ElementType.valueOf(rs.getString("type")),
                        propertiesNode,
                        rs.getInt("z_index")
                    )
                );
            }
            return elementList;

        } catch (Exception e) {
            LoggingHelper.logError("ElementDAO", e);
            return null;
        }
    }

    public static boolean deleteElement(UUID id) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");
            PreparedStatement ps = connection.prepareStatement(
                    "DELETE FROM elements WHERE element_id = ?;");

            ps.setString(1, id.toString());

            return ps.executeUpdate() != 0;

        } catch (SQLException e) {
            LoggingHelper.logError("ElementDAO", e);
            return false;
        }
    }

    public static void saveOrUpdateElement(UUID elementId, UUID whiteboardId, ElementType type, JsonNode properties, int zIndex) {
        try (Connection connection = DatabaseHelper.getConnection()) {
            assert connection != null;
            connection.setCatalog("Canvas");
            PreparedStatement ps = connection.prepareStatement("""
                INSERT INTO elements (element_id, whiteboard_id, type, properties, z_index)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE properties = VALUES(properties), z_index = VALUES(z_index);
            """);

            ps.setString(1, elementId.toString());
            ps.setString(2, whiteboardId.toString());
            ps.setString(3, type.toString());
            ps.setString(4, properties.toString());
            ps.setInt(5, zIndex);

            ps.executeUpdate();
        } catch (SQLException e) {
            LoggingHelper.logError("ElementDAO", e);
        }
    }
}