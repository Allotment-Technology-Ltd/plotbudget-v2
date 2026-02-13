# Git Worktrees Guide

This guide explains how to use Git worktrees effectively in the PLOT/plotbudget monorepo for efficient multi-branch development.

## What Are Git Worktrees?

Git worktrees allow you to work on multiple branches simultaneously without having to switch between them in a single working directory. Each worktree is a separate checkout of your repository with its own state, allowing parallel development, testing, and debugging across different branches.

## Why Use Worktrees?

- **Parallel development**: Work on feature branches while keeping main checked out in another worktree
- **Context preservation**: No need to rebuild or re-run dev servers when switching branches
- **Testing**: Test multiple branches side-by-side without conflicts
- **CI/CD efficiency**: Run isolated test suites in parallel worktrees

## Quick Start

### Creating a Worktree

```bash
# From plotbudget root, create a new worktree for a branch
git worktree add ../plotbudget-feature feature/my-feature
cd ../plotbudget-feature
```

Cursor will automatically detect the new worktree and run the setup profile. By default:
- If in a CI environment (GitHub Actions, etc.), the **ci** profile runs
- If in local development, the **full** profile runs

### Automatic Setup

When Cursor detects a new worktree, it reads `.cursor/worktrees.json` and executes the appropriate setup profile:

```json
{
  "setup-worktree": {
    "full": ["pnpm install", "pnpm build", "pnpm type-check"],
    "ci": ["pnpm install", "pnpm build"],
    "fast": ["pnpm install"]
  }
}
```

### Manual Setup

If automatic setup doesn't run, manually execute:

```bash
# Use full setup (recommended for active development)
./scripts/setup-worktree.sh --profile=full

# Use fast setup (dependencies only)
./scripts/setup-worktree.sh --profile=fast

# Use CI setup (build without type-check)
./scripts/setup-worktree.sh --profile=ci

# Auto-detect profile
./scripts/setup-worktree.sh
```

## Setup Profiles Explained

### `full` Profile (Default for Local Development)

**Commands**: `pnpm install` → `pnpm build` → `pnpm type-check`

**Use when:**
- Starting active development on a new branch
- You need to verify the entire codebase compiles and type-checks
- You want to catch issues early

**Time**: ~2-3 minutes depending on cache state

```bash
./scripts/setup-worktree.sh --profile=full
```

### `ci` Profile (Default for CI Environments)

**Commands**: `pnpm install` → `pnpm build`

**Use when:**
- Running in GitHub Actions or other CI systems
- You want faster setup without full type-checking
- Type-checking will be verified separately in CI jobs

**Time**: ~1-2 minutes

```bash
./scripts/setup-worktree.sh --profile=ci
```

### `fast` Profile (Quick Setup)

**Commands**: `pnpm install`

**Use when:**
- You only need dependencies installed
- You plan to manually run build/test commands
- You want the absolute fastest setup

**Time**: ~30 seconds to 1 minute

```bash
./scripts/setup-worktree.sh --profile=fast
```

## Common Workflows

### Scenario 1: Testing a Feature Branch While Main is Checked Out

```bash
# In main worktree
git worktree add ../feature-test feature/payment-security
cd ../feature-test

# Cursor runs full setup automatically
# You can now test the feature while main is still available in the parent worktree

# When done, remove the worktree
cd ..
git worktree remove feature-test
```

### Scenario 2: Parallel E2E Testing

```bash
# Create worktree for testing
git worktree add ../test-branch fix/auth-bug
cd ../test-branch
./scripts/setup-worktree.sh --profile=ci

# In another terminal, run tests
pnpm test:e2e
```

### Scenario 3: Comparing Implementations

```bash
# Branch 1
git worktree add ../impl-a feature/approach-a
cd ../impl-a
./scripts/setup-worktree.sh

# Branch 2 (from another terminal)
git worktree add ../impl-b feature/approach-b
cd ../impl-b
./scripts/setup-worktree.sh

# Now you can run both implementations side-by-side
```

### Scenario 4: CI/CD Testing

When GitHub Actions runs on a PR, it may create temporary worktrees to test branches in isolation:

```bash
# This is handled automatically by CI workflows
# Each test job runs in its own worktree context
# Setup is triggered by .cursor/worktrees.json
```

## Troubleshooting

### Issue: Setup didn't run automatically

**Solution**: Manually run the setup script:

```bash
cd /path/to/worktree
/path/to/plotbudget/scripts/setup-worktree.sh
```

### Issue: `pnpm install` is taking too long

**Solution**: Use the `fast` profile if you don't need a full build:

```bash
./scripts/setup-worktree.sh --profile=fast
```

### Issue: Node modules are stale or broken

**Solution**: Clean and reinstall:

```bash
rm -rf node_modules
./scripts/setup-worktree.sh --profile=full
```

### Issue: Build fails in a worktree

**Solution**: Verify your environment and try a clean rebuild:

```bash
pnpm clean
./scripts/setup-worktree.sh --profile=full
```

### Issue: Type-check fails but build succeeds

**Solution**: Run type-check manually:

```bash
pnpm type-check
```

## Listing and Managing Worktrees

### List all worktrees

```bash
git worktree list
```

Example output:
```
/Users/adamboon/PLOT - Workspace/plotbudget                                  abcd123 [main]
/Users/adamboon/PLOT - Workspace/plotbudget-feature                          ef01234 [feature/my-feature]
/Users/adamboon/PLOT - Workspace/plotbudget-test                             gh56789 [fix/auth-bug]
```

### Remove a worktree

```bash
git worktree remove feature-test
# or remove with cleanup
git worktree remove --force feature-test
```

### Prune stale worktree references

```bash
git worktree prune
```

## Development Tips

### Run specific app in a worktree

```bash
# From the worktree root
cd apps/web
pnpm dev
```

### Run only tests for an app

```bash
cd apps/web
pnpm test:unit
```

### Using multiple terminals with worktrees

You can use separate terminal tabs/windows for each worktree:

```bash
# Terminal 1 - main branch
cd ~/PLOT\ -\ Workspace/plotbudget
pnpm dev

# Terminal 2 - feature branch (in new terminal)
cd ~/PLOT\ -\ Workspace/plotbudget-feature
pnpm dev

# Terminal 3 - testing branch (in new terminal)
cd ~/PLOT\ -\ Workspace/plotbudget-test
pnpm test:e2e
```

## Performance Considerations

### Disk Space

Each worktree is a full checkout of the repository plus its own `node_modules`:

- Repository: ~200 MB
- node_modules per worktree: ~500 MB – 1 GB

Plan accordingly if creating many worktrees.

### Build Cache

Each worktree has its own build cache. Builds may be slower in a new worktree before the cache is populated. Use the `full` profile for initial setup to build the cache.

### Turbo Cache

If you have a shared Turbo cache, it will be reused across worktrees, speeding up builds.

## CI/CD Integration

### GitHub Actions

When `.cursor/worktrees.json` is present, CI environments automatically detect and use the `ci` profile for worktree setup. This ensures:

- Dependencies are installed
- Code builds successfully
- Parallel test jobs can run in isolated worktrees

### Example: Parallel E2E Testing

See `.github/workflows/worktree-ci.yml` for an example of how to leverage worktrees in CI for parallel testing without checkout conflicts.

## Best Practices

1. **Use descriptive branch names**: Makes it easier to track which worktree is which
   ```bash
   git worktree add ../feature-auth feature/user-authentication
   ```

2. **Clean up old worktrees**: Remove worktrees when you're done to save disk space
   ```bash
   git worktree remove feature-auth
   ```

3. **Keep worktrees near the root**: Easier to navigate
   ```bash
   # Good
   git worktree add ../plotbudget-feature feature/x
   
   # Less convenient
   git worktree add ../../deep/nested/path feature/x
   ```

4. **Use the right profile for the context**:
   - Local development: `full`
   - CI/CD: `ci`
   - Quick tests: `fast`

5. **Verify setup completed**:
   ```bash
   ls -la node_modules  # Should exist and contain packages
   ```

6. **Check status before committing**:
   ```bash
   git status
   git diff
   ```

## References

- [Git Worktrees Documentation](https://git-scm.com/docs/git-worktree)
- [Plotbudget CI/CD Guide](./plotbudget/.cursor/rules/ci-cd-and-branch-sync.mdc)
- [Setup Worktree Script](./scripts/setup-worktree.sh)
