#!/bin/bash

# setup-worktree.sh
# Orchestrates Git worktree setup with context-aware profiles.
#
# Usage:
#   ./scripts/setup-worktree.sh [--profile=PROFILE]
#
# Profiles:
#   full   - Complete setup: dependencies + build + type-check (default for local)
#   ci     - CI optimized: dependencies + build
#   fast   - Quick setup: dependencies only
#
# Examples:
#   ./scripts/setup-worktree.sh                 # Auto-detect profile
#   ./scripts/setup-worktree.sh --profile=fast  # Override with fast profile

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

# Detect context (CI vs local)
detect_context() {
  if [[ -n "${CI}" ]] || [[ -n "${GITHUB_ACTIONS}" ]] || [[ -n "${GITLAB_CI}" ]]; then
    echo "ci"
  else
    echo "local"
  fi
}

# Parse command-line arguments
PROFILE=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --profile=*)
      PROFILE="${1#--profile=}"
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Auto-detect profile if not specified
if [[ -z "$PROFILE" ]]; then
  CONTEXT=$(detect_context)
  if [[ "$CONTEXT" == "ci" ]]; then
    PROFILE="ci"
    log_info "Detected CI environment, using profile: ci"
  else
    PROFILE="full"
    log_info "Detected local development, using profile: full"
  fi
else
  log_info "Using specified profile: $PROFILE"
fi

# Validate profile
case $PROFILE in
  full|ci|fast)
    ;;
  *)
    log_error "Invalid profile: $PROFILE (must be: full, ci, or fast)"
    exit 1
    ;;
esac

# Get the root directory (parent of scripts directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

log_info "Working directory: $ROOT_DIR"
log_info "Profile: $PROFILE"

# Ensure pnpm is available
if ! command -v pnpm &> /dev/null; then
  log_error "pnpm is not installed or not in PATH"
  exit 1
fi

log_info "pnpm version: $(pnpm --version)"

# Execute setup steps based on profile
execute_step() {
  local step=$1
  log_info "Running: $step"
  if eval "$step"; then
    log_success "$step"
  else
    log_error "$step failed"
    exit 1
  fi
}

case $PROFILE in
  full)
    log_info "Starting FULL setup (dependencies + build + type-check)..."
    execute_step "pnpm install"
    execute_step "pnpm build"
    execute_step "pnpm type-check"
    ;;
  ci)
    log_info "Starting CI setup (dependencies + build)..."
    execute_step "pnpm install"
    execute_step "pnpm build"
    ;;
  fast)
    log_info "Starting FAST setup (dependencies only)..."
    execute_step "pnpm install"
    ;;
esac

log_success "Worktree setup complete!"
log_info "Your worktree is ready for development."
log_info "Run 'pnpm dev' to start the development server."
