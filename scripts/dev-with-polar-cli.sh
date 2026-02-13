#!/usr/bin/env bash
# Start dev server for webhook testing (run polar listen in a separate terminal)
# Usage: pnpm dev:polar (from plotbudget root)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
WEB_PORT="${WEB_PORT:-3000}"

echo -e "${YELLOW}Starting dev server + Polar CLI for webhook testing...${NC}"
echo ""

# Stop any existing dev processes and clear lock
echo -e "${YELLOW}Cleaning up existing dev processes...${NC}"
pkill -f "turbo dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2
rm -f "$(dirname "$SCRIPT_DIR")/apps/web/.next/dev/lock" 2>/dev/null || true
echo ""

# Start web app only (webhooks live in apps/web, not marketing)
echo -e "${GREEN}Starting web app on port $WEB_PORT...${NC}"
cd "$ROOT_DIR"
pnpm --filter @repo/web dev &
DEV_PID=$!

# Cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Stopping dev server...${NC}"
  kill $DEV_PID 2>/dev/null || true
  wait $DEV_PID 2>/dev/null || true
  exit 0
}
trap cleanup EXIT INT TERM

# Wait for server to be ready
echo -e "${YELLOW}Waiting for dev server to be ready...${NC}"
MAX_WAIT=60
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
  if curl -sL -o /dev/null -w "%{http_code}" "http://localhost:$WEB_PORT" 2>/dev/null | grep -qE "^(200|201|204|301|302|304|307|308)$"; then
    echo -e "${GREEN}Dev server ready.${NC}"
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo -e "${RED}Dev server did not become ready in time. Check that port $WEB_PORT is free.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}Dev server is ready.${NC}"
echo ""
echo -e "${YELLOW}In a SEPARATE terminal (where you can type), run:${NC}"
echo -e "  polar listen http://localhost:$WEB_PORT/"
echo ""
echo -e "${YELLOW}Agent/read-only terminals cannot complete the org selection—you must run polar listen in your own terminal.${NC}"
echo -e "After selecting org (Cmd+Enter), copy the webhook secret to .env.local as POLAR_WEBHOOK_SECRET."
echo ""
echo -e "${GREEN}Dev server running (Ctrl+C to stop)...${NC}"
echo ""

wait $DEV_PID
