<?php
// JWT helper functions - manual HS256 implementation (no Composer required)

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_encode($payload, $secret) {
    $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64url_encode(json_encode($payload));
    $signature = base64url_encode(
        hash_hmac('sha256', "$header.$payload", $secret, true)
    );
    return "$header.$payload.$signature";
}

function jwt_decode($token, $secret) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }

    [$header, $payload, $signature] = $parts;

    // Verify signature
    $validSignature = base64url_encode(
        hash_hmac('sha256', "$header.$payload", $secret, true)
    );

    if (!hash_equals($validSignature, $signature)) {
        return false;
    }

    $decoded = json_decode(base64url_decode($payload), true);
    if (!$decoded) {
        return false;
    }

    // Check expiration
    if (isset($decoded['exp']) && $decoded['exp'] < time()) {
        return false;
    }

    return $decoded;
}

function createToken($user) {
    $payload = [
        'sub' => $user['id'],
        'username' => $user['username'],
        'display_name' => $user['display_name'],
        'role' => $user['role'],
        'iat' => time(),
        'exp' => time() + (24 * 60 * 60), // 24 hours
    ];
    return jwt_encode($payload, JWT_SECRET);
}
