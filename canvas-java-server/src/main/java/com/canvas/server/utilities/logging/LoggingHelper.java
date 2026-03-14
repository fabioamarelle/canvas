package com.canvas.server.utilities.logging;

import java.util.Arrays;
import java.util.logging.FileHandler;
import java.util.logging.Logger;

public class LoggingHelper {
    private static Logger logger;

    public static Logger getLogger() {
        if (logger == null) {
            try {
                logger = Logger.getLogger("com.canvas.server");

                FileHandler fileTxt = new FileHandler("logs.txt", true);
                fileTxt.setFormatter(new LoggingFormatter());

                logger.addHandler(fileTxt);

                logger.setUseParentHandlers(false);

            } catch (Exception e) {
                throw new RuntimeException("Failed to initialize logger", e);
            }
        }
        return logger;
    }
    public static void logError(String message, Exception exception) {
        LoggingHelper.getLogger().severe(message + ": " + Arrays.toString(exception.getStackTrace()));

    }
}
