package com.canvas.mobile.utilities;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class Whiteboard {
    public static String getWhiteboard(String id) {
        try {
            String urlString = "https://api-canvas.fabioamarelle.com/api/whiteboards/" + id;

            URL url = new URL(urlString);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.connect();

            int responseCode = connection.getResponseCode();
            if (responseCode == 200) {
                BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder content = new StringBuilder();
                String inputLine;

                while ((inputLine = in.readLine()) != null) {
                    content.append(inputLine);
                }
                in.close();
                return content.toString();
            } else {
                return "Error: Codi HTTP " + responseCode;
            }
        } catch (Exception e) {
            return e.getMessage();
        }
    }
}