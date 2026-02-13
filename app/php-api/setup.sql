-- Grandkid Games — Production Schema
-- Run against rickwphi_app_grandkid on Bluehost

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
