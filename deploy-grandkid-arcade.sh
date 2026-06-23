#!/bin/bash
# Grandkid Arcade — Build & Deploy
# Usage: bash deploy-grandkid-arcade.sh [--skip-build] [--php-only] [--static-only]
#
# ┌─────────────────────────────────────────────────────────────────────────┐
# │  REMOTE PATHS — DO NOT CHANGE WITHOUT VERIFYING ON PROD                  │
# │                                                                         │
# │  Static (grandkid):  ~/public_html/app/projects/grandkid-games/         │
# │  PHP API:            ~/public_html/grandkid-api/   (grandkid-only dir)   │
# │                                                                         │
# │  The static target is grandkid's OWN subdirectory, so the --delete      │
# │  static sync is scoped to it and cannot touch the portfolio or          │
# │  commander apps. The PHP API lives in its own grandkid-api/ dir,        │
# │  separate from the shared portfolio/commander php-api — never cross.     │
# │  No secrets live in this file: prod DB creds are read at runtime from    │
# │  the remote ~/auth_secrets.php over ssh.                                 │
# └─────────────────────────────────────────────────────────────────────────┘

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$PROJECT_DIR/out"
PHP_API_DIR="$PROJECT_DIR/app/php-api"
MIGRATION_DIR="$PROJECT_DIR/migrations"

REMOTE_HOST="rickwphillips"
REMOTE_STATIC="$REMOTE_HOST:~/public_html/app/projects/grandkid-games/"
REMOTE_PHP="$REMOTE_HOST:~/public_html/grandkid-api/"

# ── Sanity check: verify we're in the right repo ─────────────
if [ ! -f "$PROJECT_DIR/package.json" ] || [ ! -d "$PROJECT_DIR/app" ]; then
  echo "ERROR: Cannot find package.json / app/ — are you in the grandkid-arcade repo?"
  exit 1
fi
if [ ! -d "$PHP_API_DIR" ]; then
  echo "ERROR: PHP API dir not found at $PHP_API_DIR"
  exit 1
fi

SKIP_BUILD=false
PHP_ONLY=false
STATIC_ONLY=false

for arg in "$@"; do
  case $arg in
    --skip-build)  SKIP_BUILD=true ;;
    --php-only)    PHP_ONLY=true ;;
    --static-only) STATIC_ONLY=true ;;
    --help|-h)
      echo "Usage: bash deploy-grandkid-arcade.sh [OPTIONS]"
      echo ""
      echo "  --skip-build   Skip npm run build (use existing out/)"
      echo "  --php-only     Only deploy PHP API files"
      echo "  --static-only  Only build and deploy static files (no PHP or DB migration)"
      echo "  -h, --help     Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      exit 1
      ;;
  esac
done

# ── Step 1: Build ──────────────────────────────────────────────
if [ "$PHP_ONLY" = false ] && [ "$SKIP_BUILD" = false ]; then
  echo "═══════════════════════════════════════════"
  echo "  Building grandkid-arcade (npm run build)..."
  echo "═══════════════════════════════════════════"
  (cd "$PROJECT_DIR" && npm run build)
  echo ""
  echo "Build complete."
  echo ""
fi

# ── Step 2: Deploy static files via rsync ──────────────────────
# Target is grandkid's own subdir, so --delete is scoped to it. .htaccess is
# excluded so --delete can never remove the live Authorization passthrough file.
if [ "$PHP_ONLY" = false ]; then
  if [ ! -d "$OUT_DIR" ]; then
    echo "ERROR: $OUT_DIR not found — run a build first (omit --skip-build)."
    exit 1
  fi
  echo "═══════════════════════════════════════════"
  echo "  Deploying static files (--delete)..."
  echo "  Source: $OUT_DIR/"
  echo "  Target: $REMOTE_STATIC"
  echo "═══════════════════════════════════════════"
  rsync -avz --delete \
    --exclude '.DS_Store' \
    --exclude '.htaccess' \
    "$OUT_DIR/" "$REMOTE_STATIC"
  echo ""
  echo "Static deploy complete."
  echo ""
fi

# ── Step 3: DB Migrations — apply pending to prod (dev best-effort) ─────
if [ "$STATIC_ONLY" = false ]; then
  echo "═══════════════════════════════════════════"
  echo "  Auditing DB migrations (prod)..."
  echo "═══════════════════════════════════════════"

  MIGRATION_FILES=($(ls "$MIGRATION_DIR"/v*.sql 2>/dev/null | sort -V))

  if [ ${#MIGRATION_FILES[@]} -eq 0 ]; then
    echo "  No migration files found — skipping."
  else
    # Prod credentials from remote auth_secrets.php (grandkid constants)
    DB_USER=$(ssh "$REMOTE_HOST" "php -r \"include getenv('HOME') . '/auth_secrets.php'; echo GRANDKID_DB_USER;\"")
    DB_PASS=$(ssh "$REMOTE_HOST" "php -r \"include getenv('HOME') . '/auth_secrets.php'; echo GRANDKID_DB_PASS;\"")
    DB_NAME=$(ssh "$REMOTE_HOST" "php -r \"include getenv('HOME') . '/auth_secrets.php'; echo GRANDKID_DB_NAME;\"")

    ssh "$REMOTE_HOST" "mysql -h localhost -u $DB_USER -p\"$DB_PASS\" $DB_NAME -e \
      \"CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(20) NOT NULL, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (version));\""

    PROD_APPLIED=$(ssh "$REMOTE_HOST" "mysql -h localhost -u $DB_USER -p\"$DB_PASS\" $DB_NAME -sNe \"SELECT version FROM schema_migrations;\"")

    # Dev applied versions (best-effort; local mysql may be down)
    DEV_APPLIED=$(mysql -u root grandkid_arcade -sNe "SELECT version FROM schema_migrations;" 2>/dev/null || echo "__DEV_UNAVAILABLE__")

    PROD_PENDING=0
    DEV_PENDING=0

    for MIGRATION_FILE in "${MIGRATION_FILES[@]}"; do
      FILENAME=$(basename "$MIGRATION_FILE")
      MIG_VERSION=$(echo "$FILENAME" | sed 's/^v//; s/\.sql$//')

      # Prod
      if echo "$PROD_APPLIED" | grep -qx "$MIG_VERSION"; then
        echo "  [prod] v${MIG_VERSION} already applied."
      else
        echo "  [prod] Applying v${MIG_VERSION}..."
        scp "$MIGRATION_FILE" "$REMOTE_HOST:/tmp/grandkid_migration_${MIG_VERSION}.sql"
        ssh "$REMOTE_HOST" "mysql -h localhost -u $DB_USER -p\"$DB_PASS\" $DB_NAME \
          < /tmp/grandkid_migration_${MIG_VERSION}.sql \
          && mysql -h localhost -u $DB_USER -p\"$DB_PASS\" $DB_NAME -e \
            \"INSERT IGNORE INTO schema_migrations (version) VALUES ('$MIG_VERSION');\" \
          && rm /tmp/grandkid_migration_${MIG_VERSION}.sql"
        echo "  [prod] v${MIG_VERSION} done."
        PROD_PENDING=$((PROD_PENDING + 1))
      fi

      # Dev (best-effort — never aborts the deploy)
      if [ "$DEV_APPLIED" = "__DEV_UNAVAILABLE__" ]; then
        :
      elif echo "$DEV_APPLIED" | grep -qx "$MIG_VERSION"; then
        echo "  [dev]  v${MIG_VERSION} already applied."
      else
        echo "  [dev]  Applying v${MIG_VERSION}..."
        if mysql -u root grandkid_arcade < "$MIGRATION_FILE" 2>/dev/null; then
          mysql -u root grandkid_arcade -e "INSERT IGNORE INTO schema_migrations (version) VALUES ('$MIG_VERSION');" 2>/dev/null || true
          echo "  [dev]  v${MIG_VERSION} done."
          DEV_PENDING=$((DEV_PENDING + 1))
        else
          echo "  [dev]  v${MIG_VERSION} skipped (local mysql unavailable)."
        fi
      fi
    done

    if [ "$DEV_APPLIED" = "__DEV_UNAVAILABLE__" ]; then
      echo "  Prod: $PROD_PENDING new migration(s). Dev: skipped (local mysql unavailable)."
    else
      echo "  Prod: $PROD_PENDING new migration(s). Dev: $DEV_PENDING new migration(s)."
    fi
  fi
  echo ""
fi

# ── Step 4: Deploy PHP API via rsync (no --delete) ─────────────────────
# Target is the dedicated grandkid-api/ dir. No --delete so the remote
# .htaccess and any server-side logs are never removed.
if [ "$STATIC_ONLY" = false ]; then
  echo "═══════════════════════════════════════════"
  echo "  Deploying PHP API via rsync..."
  echo "  Source: $PHP_API_DIR/"
  echo "  Target: $REMOTE_PHP"
  echo "═══════════════════════════════════════════"
  rsync -avz --exclude '.DS_Store' "$PHP_API_DIR/" "$REMOTE_PHP"
  echo ""
  echo "PHP API deploy complete."
  echo ""
fi

echo "═══════════════════════════════════════════"
echo "  Grandkid Arcade deploy complete!"
echo "  https://rickwphillips.com/app/projects/grandkid-games/"
echo "═══════════════════════════════════════════"
