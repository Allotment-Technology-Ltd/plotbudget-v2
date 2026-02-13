#!/usr/bin/env bash
# Start ngrok tunnel for Polar webhooks alongside Next.js dev server
# Usage: pnpm dev:with-webhooks (or this script directly)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting ngrok tunnel for Polar webhooks...${NC}"
echo -e "${YELLOW}Tip: Stop any existing 'pnpm dev' or 'ngrok' first to avoid port/endpoint conflicts.${NC}"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
  echo -e "${YELLOW}ngrok not found. Install with: brew install ngrok${NC}"
  echo "Continuing without ngrok (webhooks will not work)."
  exec pnpm run dev
  exit 0
fi

# Use port 3000 (Next.js default). If 3000 is in use, Next.js will auto-select 3001/3002.
# Ensure only one ngrok instance: run `pkill ngrok` first if you see "endpoint already online"
ngrok http 3000 --log=stdout &
NGROK_PID=$!

# Give ngrok a moment to start and fetch the URL
sleep 2

# Fetch the ngrok URL and display it
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])" 2>/dev/null || echo "unknown")

echo -e "${GREEN}ngrok tunnel started${NC}"
echo -e "${GREEN}Webhook URL: ${NGROK_URL}/api/webhooks/polar${NC}"
echo -e "${YELLOW}Important: Update the webhook URL in Polar sandbox dashboard if this URL is different from what's registered.${NC}"

# Start the Next.js dev server in the foreground
# When the dev server exits, kill ngrok
trap "kill $NGROK_PID 2>/dev/null" EXIT

exec pnpm run dev
