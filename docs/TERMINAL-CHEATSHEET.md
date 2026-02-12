# PlotBudget V2 - Terminal Command Cheat Sheet

> Quick reference for daily development workflow

---

## 🚀 Starting Development
```bash
# Navigate to project and start dev server
cd ~/plotbudget-v2/apps/web
pnpm dev
```

**Then open:** http://localhost:3000

**Stop server:** Press `Ctrl + C`

---

## 📁 Project Navigation
```bash
# Go to project root (from anywhere)
cd ~/plotbudget-v2

# Go to web app
cd apps/web

# Go back to project root
cd ../..

# Go to packages
cd packages/ui
cd packages/logic

# List files in current directory
ls -la

# Show current directory path
pwd
```

---

## 💻 Development Server
```bash
# Start dev server (from apps/web)
pnpm dev

# Stop dev server
Ctrl + C

# Start on different port
pnpm dev -- -p 3001

# Clear Next.js cache and restart
rm -rf .next
pnpm dev

# Build for production (test before deployment)
pnpm build

# Run production build locally
pnpm build && pnpm start
```

---

## 📦 Install Dependencies
```bash
# Install new package in web app (from apps/web)
pnpm add package-name

# Install dev dependency
pnpm add -D package-name

# Install package in root workspace (from project root)
pnpm add -w package-name

# Install shadcn component (from apps/web)
npx shadcn-ui@latest add component-name

# Install all dependencies after pulling code
pnpm install
```

---

## 🔧 Git Commands

### Checking Status
```bash
# See changed files
git status

# View commit history
git log --oneline -10

# See current branch
git branch
```

### Staging & Committing
```bash
# Stage all changes
git add .

# Stage specific file
git add apps/web/app/page.tsx

# Commit with message
git commit -m "feat: your message here"

# Common commit prefixes:
# feat: New feature
# fix: Bug fix
# docs: Documentation changes
# style: Code formatting
# refactor: Code restructuring
# test: Adding tests
# chore: Maintenance tasks
```

### Pushing & Pulling
```bash
# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main
```

### Branches
```bash
# Create new branch
git checkout -b feature-name

# Switch to existing branch
git checkout main
git checkout feature-name

# Delete branch
git branch -d feature-name
```

### Undo Commands
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes (⚠️ DANGER!)
git reset --hard HEAD

# Discard changes to specific file
git checkout -- apps/web/app/page.tsx
```

---

## 📄 View & Edit Files
```bash
# View file contents
cat apps/web/app/page.tsx

# View first 20 lines
head -n 20 apps/web/app/page.tsx

# View last 20 lines
tail -n 20 apps/web/app/page.tsx

# Open current directory in Cursor
cursor .

# Open specific file in Cursor
cursor apps/web/app/page.tsx
```

---

## 🔐 Environment Variables
```bash
# From repo root; env lives in apps/web only
cd apps/web
touch .env.local
nano .env.local
# Save: Ctrl+X, then Y, then Enter

# View env file
cat .env.local

# Copy example env
cp .env.example .env.local
```

---

## 🧹 Clear Caches (When Things Break)
```bash
# Clear Next.js cache (from apps/web)
rm -rf .next

# Clear node_modules and reinstall (from project root)
rm -rf node_modules
rm -rf apps/web/node_modules
rm -rf packages/*/node_modules
pnpm install

# Clear pnpm cache (nuclear option)
pnpm store prune
pnpm install
```

**Clear browser data:**
- Chrome: `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
- Check: Cached images and files, Cookies

---

## 🗄️ Supabase CLI (Optional)
```bash
# Login to Supabase
npx supabase login

# Link to project
npx supabase link --project-ref jxykecjepxtxzprxheaz

# Pull remote schema
npx supabase db pull

# Generate TypeScript types
npx supabase gen types typescript --project-id jxykecjepxtxzprxheaz > apps/web/lib/supabase/database.types.ts
```

---

## 🔄 Common Workflows

### After Pulling New Code
```bash
cd ~/plotbudget-v2
git pull origin main
pnpm install
cd apps/web
rm -rf .next
pnpm dev
```

### Before Starting New Feature
```bash
cd ~/plotbudget-v2
git checkout main
git pull origin main
git checkout -b feature-name
cd apps/web
pnpm dev
```

### Committing & Pushing Changes
```bash
# From project root
git status
git add .
git commit -m "feat: description of changes"
git push origin main
```

### Quick Reset (Something Broke)
```bash
cd ~/plotbudget-v2/apps/web
rm -rf .next
pnpm dev

# If still broken:
cd ../..
pnpm install
cd apps/web
pnpm dev
```

---

## ⌨️ Terminal Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + L` | Clear screen (or type `clear`) |
| `Ctrl + C` | Cancel current command / Stop server |
| `Ctrl + D` | Exit terminal/program |
| `Ctrl + R` | Search command history |
| `Tab` | Auto-complete file/folder names |
| `Ctrl + A` | Go to start of line |
| `Ctrl + E` | Go to end of line |
| `Ctrl + W` | Delete word |
| `Ctrl + U` | Delete entire line |

---

## 🚢 Vercel Deployment
```bash
# Trigger deployment (automatic on push to main)
git push origin main

# View logs: https://vercel.com/dashboard

# Install Vercel CLI (optional)
pnpm add -g vercel

# Deploy from terminal
vercel --prod
```

---

## 🧪 Testing & Debugging
```bash
# Check for TypeScript errors (from apps/web)
pnpm tsc --noEmit

# Run linter
pnpm lint

# Fix linting issues automatically
pnpm lint --fix

# Build and check for errors
pnpm build
```

---

## 🔧 Troubleshooting

### Port 3000 Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or start on different port
pnpm dev -- -p 3001
```

### Permission Denied Errors
```bash
# Make script executable
chmod +x script.sh

# Fix ownership (replace 'yourusername')
sudo chown -R yourusername:yourusername ~/plotbudget-v2
```

### Cannot Find Module Errors
```bash
# Reinstall dependencies
cd ~/plotbudget-v2
rm -rf node_modules
rm -rf apps/web/node_modules
rm -rf packages/*/node_modules
rm pnpm-lock.yaml
pnpm install
```

---

## ⚡ Your Most Common Commands
```bash
# 1️⃣ Start working
cd ~/plotbudget-v2/apps/web
pnpm dev

# 2️⃣ Save work
git add .
git commit -m "feat: what I changed"
git push origin main

# 3️⃣ Fix broken state
rm -rf .next
pnpm dev

# 4️⃣ Pull latest changes
cd ~/plotbudget-v2
git pull origin main
pnpm install
cd apps/web
pnpm dev
```

---

## 📝 Notes

- Always run `pnpm dev` from `apps/web` directory
- Always run `git` commands from project root (`~/plotbudget-v2`)
- If something breaks, try clearing `.next` folder first
- Remember to pull latest code before starting new features
- Use descriptive commit messages with prefixes (feat, fix, etc.)

---

**Last Updated:** February 2026  
**Project:** PlotBudget V2  
**Stack:** Next.js 14 + TurboRepo + Supabase
