<?php
require_once 'config.php';
require_once 'auth/middleware.php';

$user = requireAuth();
$db = getDB();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Return universal messages + any exclusive to this grandkid
        // is_string first: ?name[]=x makes $_GET['name'] an array, which passes
        // the !== '' check and then triggers an "Array to string conversion"
        // warning inside execute(). With display_errors on that warning is
        // printed ahead of the JSON, so the client cannot parse the response.
        if (isset($_GET['name']) && is_string($_GET['name']) && $_GET['name'] !== '') {
            $stmt = $db->prepare(
                'SELECT id, message FROM love_messages WHERE grandkid_name IS NULL OR grandkid_name = ? ORDER BY id'
            );
            $stmt->execute([$_GET['name']]);
        } else {
            $stmt = $db->query('SELECT id, message FROM love_messages WHERE grandkid_name IS NULL ORDER BY id');
        }
        sendJSON($stmt->fetchAll());
        break;

    default:
        sendError('Method not allowed', 405);
}
