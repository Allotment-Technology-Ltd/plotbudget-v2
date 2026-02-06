#!/bin/bash
# Optional: run before build to log production deployments.
# To use: in package.json set "build": "./scripts/pre-deploy.sh && next build"

if [ "$VERCEL_ENV" = "production" ]; then
  echo "🚨 PRODUCTION DEPLOYMENT"
  echo "   Environment: $VERCEL_ENV"
  echo "   Branch: $VERCEL_GIT_COMMIT_REF"
  echo "   This will affect LIVE USERS."
  echo ""
fi

exit 0
