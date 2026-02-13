<?php
// Database configuration
// Loads credentials from secrets file outside web root
$isLocalDev = php_sapi_name() === 'cli-server';

// Resolve home directory (HOME not always set under LiteSpeed/Apache)
$homeDir = $_SERVER['HOME'] ?? getenv('HOME') ?: null;
if (!$homeDir && isset($_SERVER['DOCUMENT_ROOT'])) {
    $homeDir = dirname($_SERVER['DOCUMENT_ROOT']);
}

$secretsFile = $isLocalDev
    ? $homeDir . '/auth_secrets_dev.php'
    : $homeDir . '/auth_secrets.php';

if (file_exists($secretsFile)) {
    require_once $secretsFile;
} else {
    // Fallback for backwards compatibility during migration
    if ($isLocalDev) {
        define('GRANDKID_DB_HOST', '127.0.0.1');
        define('GRANDKID_DB_NAME', 'grandkid_arcade');
        define('GRANDKID_DB_USER', 'app_user');
        define('GRANDKID_DB_PASS', 'devpassword');
        define('AUTH_DB_HOST', '127.0.0.1');
        define('AUTH_DB_NAME', 'rickwphillips_auth');
        define('AUTH_DB_USER', 'app_user');
        define('AUTH_DB_PASS', 'devpassword');
        define('JWT_SECRET', 'local-dev-jwt-secret-change-in-production');
        define('ALLOWED_ORIGINS', 'http://localhost:3002');
    } else {
        // Production should always use secrets file
        http_response_code(500);
        echo json_encode(['error' => 'Server configuration error']);
        exit();
    }
}

// Dynamic CORS - check origin against allowed list
$allowedOrigins = array_map('trim', explode(',', ALLOWED_ORIGINS));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Always allow localhost in dev
if ($isLocalDev) {
    $allowedOrigins[] = 'http://localhost:3002';
    $allowedOrigins[] = 'http://localhost:8082';
}

if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} elseif ($isLocalDev) {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Create PDO connection to grandkid database
function getDB() {
    try {
        $pdo = new PDO(
            'mysql:host=' . GRANDKID_DB_HOST . ';dbname=' . GRANDKID_DB_NAME . ';charset=utf8mb4',
            GRANDKID_DB_USER,
            GRANDKID_DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed']);
        exit();
    }
}

// Helper to get JSON input
function getJSONInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

// Helper to send JSON response
function sendJSON($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

// Helper to send error response
function sendError($message, $status = 400) {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit();
}
