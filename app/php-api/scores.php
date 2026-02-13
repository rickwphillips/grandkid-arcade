<?php
require_once 'config.php';
require_once 'auth/middleware.php';

$user = requireAuth();
$db = getDB();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $where = [];
        $params = [];

        if (isset($_GET['grandkid_id'])) {
            $where[] = 'gp.grandkid_id = ?';
            $params[] = (int) $_GET['grandkid_id'];
        }
        if (isset($_GET['game_slug'])) {
            $where[] = 'gp.game_slug = ?';
            $params[] = $_GET['game_slug'];
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $stmt = $db->prepare("
            SELECT gp.*, g.name AS grandkid_name
            FROM game_plays gp
            LEFT JOIN grandkids g ON gp.grandkid_id = g.id
            $whereClause
            ORDER BY gp.played_at DESC
            LIMIT 100
        ");
        $stmt->execute($params);
        sendJSON($stmt->fetchAll());
        break;

    case 'POST':
        $input = getJSONInput();
        if (empty($input['grandkid_id'])) sendError('grandkid_id is required');
        if (empty($input['game_slug'])) sendError('game_slug is required');
        if (!isset($input['score'])) sendError('score is required');

        $stmt = $db->prepare(
            'INSERT INTO game_plays (grandkid_id, game_slug, score, completed) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            (int) $input['grandkid_id'],
            $input['game_slug'],
            (int) $input['score'],
            (int) ($input['completed'] ?? 0),
        ]);

        $id = $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM game_plays WHERE id = ?');
        $stmt->execute([$id]);
        sendJSON($stmt->fetch(), 201);
        break;

    default:
        sendError('Method not allowed', 405);
}
