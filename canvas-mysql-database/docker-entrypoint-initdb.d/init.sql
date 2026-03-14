DROP DATABASE IF EXISTS Canvas;
CREATE DATABASE IF NOT EXISTS Canvas;
USE Canvas;

CREATE TABLE users (
    user_id CHAR(36),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);

CREATE TABLE whiteboards (
    whiteboard_id CHAR(36),
    name VARCHAR(100) NOT NULL,
    owner_id CHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (whiteboard_id),
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE allowed_users (
    user_id CHAR(36),
    whiteboard_id CHAR(36),	
    permission ENUM('VIEWER', 'EDITOR', 'OWNER') DEFAULT 'EDITOR',
    PRIMARY KEY (user_id, whiteboard_id), -- Composite Primary Key
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (whiteboard_id) REFERENCES whiteboards(whiteboard_id) ON DELETE CASCADE
);

CREATE TABLE elements (
    element_id CHAR(36),
    whiteboard_id CHAR(36) NOT NULL,
    type ENUM('TEXT', 'IMAGE', 'NOTE', 'DRAWING') NOT NULL,
    properties JSON,
    z_index INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (element_id),
    FOREIGN KEY (whiteboard_id) REFERENCES whiteboards(whiteboard_id) ON DELETE CASCADE
);