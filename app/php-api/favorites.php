<?php
require_once 'config.php';
require_once 'auth/middleware.php';

$user = requireAuth();
$db = getDB();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (!isset($_GET['grandkid_id'])) sendError('grandkid_id is required');

        $stmt = $db->prepare('SELECT * FROM favorites WHERE grandkid_id = ? ORDER BY created_at DESC');
        $stmt->execute([(int) $_GET['grandkid_id']]);
        sendJSON($stmt->fetchAll());
        break;

    case 'POST':
        // Toggle: if favorite exists, remove it; otherwise add it
        $input = getJSONInput();
        if (empty($input['grandkid_id'])) sendError('grandkid_id is required');
        if (empty($input['game_slug'])) sendError('game_slug is required');

        $grandkidId = (int) $input['grandkid_id'];
        $gameSlug = $input['game_slug'];

        // Check if already favorited
        $stmt = $db->prepare('SELECT id FROM favorites WHERE grandkid_id = ? AND game_slug = ?');
        $stmt->execute([$grandkidId, $gameSlug]);
        $existing = $stmt->fetch();

        if ($existing) {
            $stmt = $db->prepare('DELETE FROM favorites WHERE id = ?');
            $stmt->execute([$existing['id']]);
            sendJSON(['favorited' => false]);
        } else {
            $stmt = $db->prepare('INSERT INTO favorites (grandkid_id, game_slug) VALUES (?, ?)');
            $stmt->execute([$grandkidId, $gameSlug]);
            sendJSON(['favorited' => true], 201);
        }
        break;

    default:
        sendError('Method not allowed', 405);
}
