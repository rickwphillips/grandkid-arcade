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

CREATE TABLE IF NOT EXISTS love_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(255) NOT NULL,
    grandkid_name VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Universal messages (show for all grandkids)
INSERT INTO love_messages (message) VALUES
    ('Grampy loves you so much, {name}!'),
    ('This game was made just for you, {name} ♥'),
    ('{name}, you make Grampy so proud!'),
    ('Keep going, {name} — you''ve got this!'),
    ('Grampy built this with love for you, {name}'),
    ('{name} is Grampy''s favorite puzzle solver!'),
    ('You''re amazing, {name}. Never forget that.'),
    ('Grampy thinks about you every day, {name} ♥'),
    ('Made with love by Grampy, just for {name}'),
    ('{name}, you light up Grampy''s world!'),
    ('Grampy believes in you, {name}!'),
    ('Every piece you solve makes Grampy smile, {name}'),
    ('{name}, Grampy is so lucky to have you ♥'),
    ('This one''s for you, {name}. Love, Grampy'),
    ('Copper, Penny, Lulu, Luna & Stella send puppy kisses, {name}!'),
    ('{name}, Copper is cheering you on with tail wags!'),
    ('Penny says you''re doing great, {name}!'),
    ('Lulu wants to play too, {name}!'),
    ('Luna is watching you win, {name}!'),
    ('Stella thinks you''re a superstar, {name}!'),
    ('The pups are all rooting for you, {name}!'),
    ('{name}, Copper & Penny are snuggled up watching you play ♥'),
    ('Lulu, Luna & Stella say keep going, {name}!');

-- Mason exclusives
INSERT INTO love_messages (message, grandkid_name) VALUES
    ('Mason, you are Grampy''s little superhero!', 'Mason'),
    ('Grampy loves building things with you, Mason ♥', 'Mason'),
    ('Mason, you''re the bravest boy Grampy knows!', 'Mason'),
    ('Copper wants to be just like you, Mason!', 'Mason'),
    ('Grampy''s favorite little man — that''s you, Mason!', 'Mason');

-- Ella-Grace exclusives
INSERT INTO love_messages (message, grandkid_name) VALUES
    ('Ella-Grace, you are Grampy''s sunshine!', 'Ella-Grace'),
    ('Grampy loves your smile, Ella-Grace ♥', 'Ella-Grace'),
    ('Ella-Grace, you''re the smartest girl Grampy knows!', 'Ella-Grace'),
    ('Penny wants to snuggle with you, Ella-Grace!', 'Ella-Grace'),
    ('Grampy''s favorite little princess — that''s you, Ella-Grace!', 'Ella-Grace');

CREATE TABLE IF NOT EXISTS hangman_words (
    id INT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(100) NOT NULL,
    hint VARCHAR(255) DEFAULT NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hangman seed data — family names, dog names, loving phrases
INSERT INTO hangman_words (word, hint, difficulty) VALUES
    ('COPPER', 'One of Grampy''s dogs', 'easy'),
    ('PENNY', 'One of Grampy''s dogs', 'easy'),
    ('LULU', 'One of Grampy''s dogs', 'easy'),
    ('LUNA', 'One of Grampy''s dogs', 'easy'),
    ('STELLA', 'One of Grampy''s dogs', 'easy'),
    ('MASON', 'Someone Grampy loves', 'easy'),
    ('GRAMPY', 'He made this game for you!', 'easy'),
    ('PUPPY', 'A young dog', 'easy'),
    ('LOVE', 'Something Grampy gives you every day', 'easy'),
    ('HUG', 'Something Grampy gives you', 'easy'),
    ('ELLA GRACE', 'Grampy''s favorite girl', 'medium'),
    ('GRAMPY LOVES YOU', 'Something that''s always true', 'medium'),
    ('PUPPY KISSES', 'What Copper and Penny give you', 'medium'),
    ('BEST FRIENDS', 'What you and Grampy are', 'medium'),
    ('BEAR HUG', 'A really big hug from Grampy', 'medium'),
    ('COPPER AND PENNY', 'Two of Grampy''s dogs', 'hard'),
    ('LULU LUNA STELLA', 'Three of Grampy''s dogs', 'hard'),
    ('GRAMPY IS SO PROUD', 'How Grampy feels about you', 'hard'),
    ('MASON IS A SUPERHERO', 'Grampy''s favorite boy', 'hard'),
    ('ELLA GRACE IS SUNSHINE', 'Grampy''s favorite girl', 'hard');
