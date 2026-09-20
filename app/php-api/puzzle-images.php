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
            $stmt->execute([getIntParam('id')]);
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
        // is_string before mb_strlen()/preg_match(): both throw an uncaught
        // TypeError on array input under PHP 8, escaping as a fatal 500 instead
        // of the JSON error envelope the guards beside them return.
        if (!is_string($input['title'])) sendError('Title must be a string');
        if (mb_strlen($input['title']) > 255) sendError('Title must be 255 characters or less');
        if (empty($input['image_data'])) sendError('Image data is required');
        if (!is_string($input['image_data'])) sendError('Image data must be a string');
        if (!preg_match('/^data:image\/(jpeg|png|gif|webp);base64,/', $input['image_data'], $declared)) {
            sendError('Invalid image format: only JPEG, PNG, GIF, and WebP are allowed');
        }
        // The 5MB the admin page promises ("Image must be under 5MB") is the size
        // of the file the user picked, but base64 inflates it by ~4/3, so this
        // used to reject anything the client accepted above ~3.75MB. Bound the
        // transported string generously here, then hold the real 5MB limit
        // against the decoded bytes below, so both ends mean the same thing.
        if (strlen($input['image_data']) > 7 * 1024 * 1024) sendError('Image data exceeds 5MB limit');

        // The prefix match only proves what the client *claims* the payload is.
        // Decode it strictly and check the actual magic number, so a truncated,
        // corrupt or mislabelled blob is rejected here rather than stored and
        // then failing to render in jigsaw-puzzle, slide-puzzle and color-match
        // with no diagnostic. image_data is MEDIUMTEXT, so a stored dud is
        // invisible until a grandkid opens the game.
        $binary = base64_decode(substr($input['image_data'], strpos($input['image_data'], ',') + 1), true);
        if ($binary === false || $binary === '') {
            sendError('Invalid image data: payload is not valid base64');
        }
        if (strlen($binary) > 5 * 1024 * 1024) sendError('Image data exceeds 5MB limit');
        // No default arm needed: the regex above already restricted $declared[1]
        // to these four.
        $magicMatches = match ($declared[1]) {
            'jpeg' => str_starts_with($binary, "\xFF\xD8\xFF"),
            'png' => str_starts_with($binary, "\x89PNG\r\n\x1A\n"),
            'gif' => str_starts_with($binary, 'GIF87a') || str_starts_with($binary, 'GIF89a'),
            'webp' => str_starts_with($binary, 'RIFF') && substr($binary, 8, 4) === 'WEBP',
        };
        if (!$magicMatches) {
            sendError('Invalid image data: contents are not a valid ' . $declared[1] . ' image');
        }

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
        $stmt->execute([getIntParam('id')]);
        if (!$stmt->fetch()) sendError('Image not found', 404);

        $stmt = $db->prepare('DELETE FROM puzzle_images WHERE id = ?');
        $stmt->execute([getIntParam('id')]);
        sendJSON(['success' => true]);
        break;

    default:
        sendError('Method not allowed', 405);
}
