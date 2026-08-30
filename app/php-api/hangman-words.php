<?php
require_once 'config.php';
require_once 'auth/middleware.php';

$user = requireAuth();
$db = getDB();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // If random=1, return one random word (optionally filtered by difficulty)
        if (isset($_GET['random'])) {
            $where = [];
            $params = [];

            if (isset($_GET['difficulty'])) {
                if (!in_array($_GET['difficulty'], ['easy', 'medium', 'hard'], true)) {
                    sendError('difficulty must be easy, medium, or hard');
                }
                $where[] = 'difficulty = ?';
                $params[] = $_GET['difficulty'];
            }

            $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

            $stmt = $db->prepare("
                SELECT id, word, hint, difficulty, created_at
                FROM hangman_words
                $whereClause
                ORDER BY RAND()
                LIMIT 1
            ");
            $stmt->execute($params);
            $row = $stmt->fetch();

            if (!$row) {
                sendError('No words found', 404);
            }

            sendJSON($row);
        }

        // Otherwise return all words (admin listing). This is the answer key for
        // the game, so it needs the same admin gate as POST/DELETE below — the
        // only caller is the AdminGuard-wrapped admin page (api.getHangmanWords).
        // Gameplay uses the ?random=1 branch above, which stays open to any
        // authenticated user.
        requireAdmin();

        $stmt = $db->prepare('SELECT id, word, hint, difficulty, created_at FROM hangman_words ORDER BY difficulty, word');
        $stmt->execute();
        sendJSON($stmt->fetchAll());
        break;

    case 'POST':
        requireAdmin();

        $input = getJSONInput();
        if (empty($input['word'])) sendError('word is required');
        if (!is_string($input['word'])) sendError('word must be a string');
        if (isset($input['hint']) && !is_string($input['hint'])) sendError('hint must be a string');

        $word = strtoupper(trim($input['word']));
        $hint = isset($input['hint']) ? trim($input['hint']) : null;
        $difficulty = $input['difficulty'] ?? 'easy';

        if (mb_strlen($word) > 100) sendError('Word must be 100 characters or less');
        if ($hint !== null && mb_strlen($hint) > 255) sendError('Hint must be 255 characters or less');
        if (!in_array($difficulty, ['easy', 'medium', 'hard'], true)) {
            sendError('difficulty must be easy, medium, or hard');
        }

        $stmt = $db->prepare(
            'INSERT INTO hangman_words (word, hint, difficulty) VALUES (?, ?, ?)'
        );
        $stmt->execute([$word, $hint, $difficulty]);

        sendJSON(['success' => true, 'id' => (int) $db->lastInsertId()], 201);
        break;

    case 'DELETE':
        requireAdmin();

        if (empty($_GET['id'])) sendError('id is required');

        $stmt = $db->prepare('DELETE FROM hangman_words WHERE id = ?');
        $stmt->execute([(int) $_GET['id']]);

        if ($stmt->rowCount() === 0) {
            sendError('Word not found', 404);
        }

        sendJSON(['success' => true]);
        break;

    default:
        sendError('Method not allowed', 405);
}
