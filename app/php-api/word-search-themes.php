<?php
require_once 'config.php';
require_once 'auth/middleware.php';

$user = requireAuth();
$db = getDB();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Return single theme with its words
            $stmt = $db->prepare(
                'SELECT id, title, difficulty, emoji, description, created_at
                 FROM word_search_themes WHERE id = ?'
            );
            $stmt->execute([(int) $_GET['id']]);
            $theme = $stmt->fetch();

            if (!$theme) {
                sendError('Theme not found', 404);
            }

            $stmt = $db->prepare(
                'SELECT id, theme_id, word, created_at
                 FROM word_search_words WHERE theme_id = ? ORDER BY word'
            );
            $stmt->execute([(int) $_GET['id']]);
            $theme['words'] = $stmt->fetchAll();
            $theme['word_count'] = count($theme['words']);

            sendJSON($theme);
        }

        // List all themes with word counts
        $stmt = $db->prepare(
            'SELECT t.id, t.title, t.difficulty, t.emoji, t.description, t.created_at,
                    COUNT(w.id) AS word_count
             FROM word_search_themes t
             LEFT JOIN word_search_words w ON w.theme_id = t.id
             GROUP BY t.id
             ORDER BY t.title'
        );
        $stmt->execute();
        sendJSON($stmt->fetchAll());
        break;

    case 'POST':
        requireAdmin();

        if (isset($_GET['id']) && isset($_GET['words'])) {
            // Add a word to an existing theme
            $themeId = (int) $_GET['id'];

            $stmt = $db->prepare('SELECT id FROM word_search_themes WHERE id = ?');
            $stmt->execute([$themeId]);
            if (!$stmt->fetch()) {
                sendError('Theme not found', 404);
            }

            $input = getJSONInput();
            if (empty($input['word'])) sendError('word is required');

            $word = strtoupper(trim($input['word']));
            if (str_contains($word, ' ')) sendError('Words cannot contain spaces');
            if (strlen($word) < 2) sendError('Word must be at least 2 characters');
            if (strlen($word) > 50) sendError('Word must be 50 characters or fewer');

            $stmt = $db->prepare(
                'INSERT INTO word_search_words (theme_id, word) VALUES (?, ?)'
            );
            $stmt->execute([$themeId, $word]);

            $id = (int) $db->lastInsertId();
            $stmt = $db->prepare(
                'SELECT id, theme_id, word, created_at FROM word_search_words WHERE id = ?'
            );
            $stmt->execute([$id]);
            sendJSON($stmt->fetch(), 201);
        }

        // Create a new theme
        $input = getJSONInput();
        if (empty($input['title'])) sendError('title is required');

        $title = trim($input['title']);
        $difficulty = $input['difficulty'] ?? 'easy';
        $emoji = trim($input['emoji'] ?? '🔍');
        $description = isset($input['description']) ? trim($input['description']) : null;

        if (!in_array($difficulty, ['easy', 'medium', 'hard'])) {
            sendError('difficulty must be easy, medium, or hard');
        }

        $stmt = $db->prepare(
            'INSERT INTO word_search_themes (title, difficulty, emoji, description)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$title, $difficulty, $emoji, $description]);

        $id = (int) $db->lastInsertId();
        $stmt = $db->prepare(
            'SELECT t.id, t.title, t.difficulty, t.emoji, t.description, t.created_at,
                    0 AS word_count
             FROM word_search_themes t WHERE t.id = ?'
        );
        $stmt->execute([$id]);
        sendJSON($stmt->fetch(), 201);
        break;

    case 'DELETE':
        requireAdmin();

        if (isset($_GET['word_id'])) {
            // Delete a single word
            $stmt = $db->prepare('DELETE FROM word_search_words WHERE id = ?');
            $stmt->execute([(int) $_GET['word_id']]);

            if ($stmt->rowCount() === 0) {
                sendError('Word not found', 404);
            }
            sendJSON(['success' => true]);
        }

        if (empty($_GET['id'])) sendError('id is required');

        // Delete theme (cascades to words)
        $stmt = $db->prepare('DELETE FROM word_search_themes WHERE id = ?');
        $stmt->execute([(int) $_GET['id']]);

        if ($stmt->rowCount() === 0) {
            sendError('Theme not found', 404);
        }
        sendJSON(['success' => true]);
        break;

    default:
        sendError('Method not allowed', 405);
}
