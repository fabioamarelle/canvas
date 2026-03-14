package com.canvas.server.utilities;

import com.canvas.server.utilities.logging.LoggingHelper;

import java.sql.*;

public class DatabaseHelper {
    public static Connection getConnection() throws SQLException {
        String url = System.getenv("SPRING_DATASOURCE_URL");
        String user = System.getenv("SPRING_DATASOURCE_USERNAME");
        String password = System.getenv("SPRING_DATASOURCE_PASSWORD");

        if (url == null) url = "jdbc:mysql://db:3306/Canvas?useSSL=false";
        if (user == null) user = "root";
        if (password == null) password = "password";

        System.out.println("INTENTANT CONNECTAR A: " + url + " AMB USUARI: " + user);

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            return DriverManager.getConnection(url, user, password);
        } catch (Exception e) {
            System.err.println("ERROR DE CONNEXIÓ: " + e.getMessage());
            return null;
        }
    }
}
