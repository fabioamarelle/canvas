package com.canvas.server;

import com.canvas.server.utilities.logging.LoggingHelper;

public class Main {
    public static void main(String[] args) {
        try {
            Integer.parseInt("test");
        } catch (Exception e) {
            LoggingHelper.logError("main", e);
        }

    }
}
