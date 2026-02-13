-- Local development database setup for Grandkid Games
-- Run: mysql -u root < scripts/setup-local-db.sql

CREATE DATABASE IF NOT EXISTS grandkid_arcade
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE grandkid_arcade;

CREATE TABLE IF NOT EXISTS grandkids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age TINYINT UNSIGNED NOT NULL,
    interests JSON DEFAULT NULL,
    avatar_color VARCHAR(20) DEFAULT '#D2691E',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS game_plays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grandkid_id INT NOT NULL,
    game_slug VARCHAR(100) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    completed TINYINT(1) NOT NULL DEFAULT 0,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grandkid_id) REFERENCES grandkids(id) ON DELETE CASCADE,
    INDEX idx_grandkid_game (grandkid_id, game_slug),
    INDEX idx_played_at (played_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grandkid_id INT NOT NULL,
    game_slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grandkid_id) REFERENCES grandkids(id) ON DELETE CASCADE,
    UNIQUE KEY uq_grandkid_game (grandkid_id, game_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS puzzle_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_data MEDIUMTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create app_user if it doesn't exist, then grant access
CREATE USER IF NOT EXISTS 'app_user'@'localhost' IDENTIFIED BY 'devpassword';
GRANT ALL PRIVILEGES ON grandkid_arcade.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
