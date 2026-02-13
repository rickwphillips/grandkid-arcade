<?php
require_once 'config.php';
require_once 'auth/middleware.php';

$db = getDB();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        requireAuth();
        if (isset($_GET['id'])) {
            // Get single image with full data
            $stmt = $db->prepare('SELECT id, title, image_data, created_at FROM puzzle_images WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $image = $stmt->fetch();
            if (!$image) sendError('Image not found', 404);
            sendJSON($image);
        } else {
            // List all images (no image_data for performance)
            $stmt = $db->query('SELECT id, title, created_at FROM puzzle_images ORDER BY created_at DESC');
            sendJSON($stmt->fetchAll());
        }
        break;

    case 'POST':
        requireAdmin();
        $input = getJSONInput();

        if (empty($input['title'])) sendError('Title is required');
        if (strlen($input['title']) > 255) sendError('Title must be 255 characters or less');
        if (empty($input['image_data'])) sendError('Image data is required');
        if (strpos($input['image_data'], 'data:image/') !== 0) sendError('Invalid image data format');
        if (strlen($input['image_data']) > 5 * 1024 * 1024) sendError('Image data exceeds 5MB limit');

        $stmt = $db->prepare('INSERT INTO puzzle_images (title, image_data) VALUES (?, ?)');
        $stmt->execute([$input['title'], $input['image_data']]);

        $id = $db->lastInsertId();
        $stmt = $db->prepare('SELECT id, title, created_at FROM puzzle_images WHERE id = ?');
        $stmt->execute([$id]);
        sendJSON($stmt->fetch(), 201);
        break;

    case 'DELETE':
        requireAdmin();
        if (!isset($_GET['id'])) sendError('ID is required');

        $stmt = $db->prepare('SELECT id FROM puzzle_images WHERE id = ?');
        $stmt->execute([$_GET['id']]);
        if (!$stmt->fetch()) sendError('Image not found', 404);

        $stmt = $db->prepare('DELETE FROM puzzle_images WHERE id = ?');
        $stmt->execute([$_GET['id']]);
        sendJSON(['success' => true]);
        break;

    default:
        sendError('Method not allowed', 405);
}
