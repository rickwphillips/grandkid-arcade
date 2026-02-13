#!/bin/bash
# Stop all local dev servers

echo "Stopping PHP server..."
pkill -f 'php -S localhost:8082' 2>/dev/null

echo "Stopping Next.js dev server..."
pkill -f 'next dev.*3002' 2>/dev/null

echo "All dev servers stopped."
