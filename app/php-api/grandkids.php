<?php
require_once 'config.php';
require_once 'auth/middleware.php';

$user = requireAuth();
$db = getDB();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Get single grandkid
            $stmt = $db->prepare('SELECT * FROM grandkids WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $grandkid = $stmt->fetch();
            if (!$grandkid) sendError('Grandkid not found', 404);
            $grandkid['interests'] = json_decode($grandkid['interests'] ?? '[]', true);
            sendJSON($grandkid);
        } else {
            // List all grandkids
            $stmt = $db->query('SELECT * FROM grandkids ORDER BY name ASC');
            $grandkids = $stmt->fetchAll();
            foreach ($grandkids as &$g) {
                $g['interests'] = json_decode($g['interests'] ?? '[]', true);
            }
            sendJSON($grandkids);
        }
        break;

    case 'POST':
        $input = getJSONInput();
        if (empty($input['name'])) sendError('Name is required');
        if (!isset($input['age']) || $input['age'] < 1) sendError('Valid age is required');

        $stmt = $db->prepare(
            'INSERT INTO grandkids (name, age, interests, avatar_color) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            $input['name'],
            (int) $input['age'],
            json_encode($input['interests'] ?? []),
            $input['avatar_color'] ?? '#D2691E',
        ]);

        $id = $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM grandkids WHERE id = ?');
        $stmt->execute([$id]);
        $grandkid = $stmt->fetch();
        $grandkid['interests'] = json_decode($grandkid['interests'] ?? '[]', true);
        sendJSON($grandkid, 201);
        break;

    case 'PUT':
        if (!isset($_GET['id'])) sendError('ID is required');
        $input = getJSONInput();

        $fields = [];
        $values = [];
        if (isset($input['name'])) { $fields[] = 'name = ?'; $values[] = $input['name']; }
        if (isset($input['age'])) { $fields[] = 'age = ?'; $values[] = (int) $input['age']; }
        if (isset($input['interests'])) { $fields[] = 'interests = ?'; $values[] = json_encode($input['interests']); }
        if (isset($input['avatar_color'])) { $fields[] = 'avatar_color = ?'; $values[] = $input['avatar_color']; }

        if (empty($fields)) sendError('No fields to update');

        $values[] = $_GET['id'];
        $stmt = $db->prepare('UPDATE grandkids SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($values);

        sendJSON(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) sendError('ID is required');
        $stmt = $db->prepare('DELETE FROM grandkids WHERE id = ?');
        $stmt->execute([$_GET['id']]);
        sendJSON(['success' => true]);
        break;

    default:
        sendError('Method not allowed', 405);
}
