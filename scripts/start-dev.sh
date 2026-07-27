#!/bin/bash
# Start all local dev servers (all in background)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Starting MySQL..."
brew services start mysql

echo "Waiting for MySQL to start..."
sleep 2

echo "Starting PHP server on port 8082..."
cd "$PROJECT_DIR/app"
# 0.0.0.0 binds both IPv4 and IPv6 so the Next.js proxy reaches PHP regardless
# of how the OS resolves "localhost" (macOS prefers ::1, Linux prefers 127.0.0.1).
php -S 0.0.0.0:8082 > /tmp/grandkid-php-server.log 2>&1 &
echo "PHP server PID: $!"

echo "Starting Next.js dev server on port 3002..."
cd "$PROJECT_DIR"
npm run dev > /tmp/grandkid-nextjs-server.log 2>&1 &
echo "Next.js PID: $!"

sleep 3
echo ""
echo "All servers started!"
echo "  - PHP API:  http://localhost:8082/php-api/"
echo "  - Next.js:  http://localhost:3002"
echo ""
echo "Logs:"
echo "  - PHP:     tail -f /tmp/grandkid-php-server.log"
echo "  - Next.js: tail -f /tmp/grandkid-nextjs-server.log"
echo ""
echo "Run ./scripts/stop-dev.sh to stop all servers"

if [ "$NO_BROWSER" != "1" ]; then
  # Once Next answers on :3002 (basePath '' in dev), pop an incognito Chrome
  # window at the app.
  ( for _ in $(seq 1 60); do
      curl -s -o /dev/null --max-time 2 http://localhost:3002/ && { "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --incognito "http://localhost:3002/" >/dev/null 2>&1 & break; }
      sleep 1
    done ) &
fi

if [ "$FOREGROUND" = "1" ]; then
  # Foreground mode (MissionControl play/stop button): stay attached so stopping
  # this command tears down the servers it started. kill 0 signals this script's
  # own process group only, so a Portfolio dev server started in a separate
  # session by the play-button guard is left running.
  trap 'kill 0' INT TERM
  wait
fi
