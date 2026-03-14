package com.canvas.server.utilities.logging;

import java.util.logging.Formatter;
import java.util.logging.LogRecord;
import java.util.Date;
import java.text.SimpleDateFormat;

public class LoggingFormatter extends Formatter {
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    @Override
    public String format(LogRecord record) {
        StringBuilder sb = new StringBuilder();

        sb.append(dateFormat.format(new Date(record.getMillis()))).append(" ");
        sb.append("[").append(record.getLevel().getName()).append("] ");
        sb.append(record.getMessage()).append("\n");

        if (record.getThrown() != null) {
            sb.append(record.getThrown().toString()).append("\n");
        }

        return sb.toString();
    }
}