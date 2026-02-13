# Grandkid Games — Deployment

## Production URLs
- **App**: `https://rickwphillips.com/app/projects/grandkid-games/`
- **API**: `https://rickwphillips.com/grandkid-api/`

## Remote Paths
- Static files: `~/public_html/app/projects/grandkid-games/`
- PHP API: `~/public_html/grandkid-api/`

## Database Setup (first-time)
1. Create database `rickwphi_app_grandkid` in Bluehost cPanel
2. Run `app/php-api/setup.sql` against it
3. Add `GRANDKID_DB_*` constants to `~/auth_secrets.php`

## Deploy
```bash
bash deploy-grandkid-arcade.sh           # Full build + deploy
bash deploy-grandkid-arcade.sh --php-only  # PHP API only
bash deploy-grandkid-arcade.sh --static-only # Static only
bash deploy-grandkid-arcade.sh --skip-build  # Use existing out/
```

## Secrets Required in `~/auth_secrets.php`
```php
define('GRANDKID_DB_HOST', 'localhost');
define('GRANDKID_DB_NAME', 'rickwphi_app_grandkid');
define('GRANDKID_DB_USER', '...');
define('GRANDKID_DB_PASS', '...');
```

(AUTH_DB_*, JWT_SECRET, ALLOWED_ORIGINS already defined for other apps)

## .htaccess
The deploy script restores `.htaccess` for Authorization header passthrough.
The portfolio deploy script excludes `projects/grandkid-games` to prevent deletion.
