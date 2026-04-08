#!/bin/bash
# WhatsApp Bot Standalone Startup Script
# Usage: ./what.sh [--mode fore|back|auto] [--diagnose]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT/whatsapp-bot"

# ═══════════════════════════════════════════════════════════════
# Parse Command-Line Arguments
# ═══════════════════════════════════════════════════════════════

MODE="auto"
RUN_DIAGNOSE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      if [[ -n "$2" && "$2" != --* ]]; then
        MODE="$2"
        shift 2
      else
        echo "Error: --mode requires a value (fore, back, or auto)"
        exit 1
      fi
      ;;
    --diagnose)
      RUN_DIAGNOSE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# ═══════════════════════════════════════════════════════════════
# Run Diagnostics if Requested
# ═══════════════════════════════════════════════════════════════

if [ "$RUN_DIAGNOSE" = true ]; then
  echo "Running diagnostic check..."
  node diagnose.js
  exit $?
fi

# ═══════════════════════════════════════════════════════════════
# Pre-Flight Checks
# ═══════════════════════════════════════════════════════════════

echo "🔍 Running pre-flight checks..."

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed"
  echo "Install from: https://nodejs.org/"
  exit 1
fi
echo "✅ Node.js: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
  echo "❌ npm is not installed"
  exit 1
fi
echo "✅ npm: $(npm --version)"

# ═══════════════════════════════════════════════════════════════
# Ensure Dependencies are Installed
# ═══════════════════════════════════════════════════════════════

if [ ! -d "node_modules" ]; then
  echo "📦 Installing bot dependencies (with Puppeteer support)..."
  npm install --legacy-peer-deps --include=optional --no-audit --no-fund || {
    echo "❌ npm install failed"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check npm logs: cat ~/.npm/_logs/*.log"
    echo "2. Clear cache: npm cache clean --force"
    echo "3. Try again: npm install --legacy-peer-deps"
    exit 1
  }
fi

# ═══════════════════════════════════════════════════════════════
# Ensure Puppeteer-managed Chrome Exists
# ═══════════════════════════════════════════════════════════════

if ! npx --yes puppeteer browsers list 2>/dev/null | grep -qi "chrome"; then
  echo "🌐 Installing Chrome for Puppeteer (first run may take 2-3 minutes)..."
  npx --yes puppeteer browsers install chrome || {
    echo "❌ Failed to install Puppeteer Chrome"
    echo ""
    echo "You can either:"
    echo "1. Wait and try again (downloads ~150-200MB)"
    echo "2. Install Chrome manually: sudo apt install chromium-browser"
    echo "3. Set PUPPETEER_EXECUTABLE_PATH to your Chrome installation"
    exit 1
  }
fi

# ═══════════════════════════════════════════════════════════════
# System Resource Checks
# ═══════════════════════════════════════════════════════════════

echo "📊 Checking system resources..."

# Check memory
FREE_MEM=$(free -m | awk 'NR==2 {print $7}')
if [ "$FREE_MEM" -lt 300 ]; then
  echo "⚠️  Low memory available: ${FREE_MEM}MB"
  echo "    Recommendation: Free up at least 500MB"
fi
echo "✅ Memory available: ${FREE_MEM}MB"

# Check disk space in home
DISK_SPACE=$(df ~ | awk 'NR==2 {print $4}')
if [ "$DISK_SPACE" -lt 1048576 ]; then  # Less than 1GB
  echo "⚠️  Low disk space: $(df -h ~ | awk 'NR==2 {print $4}')"
  echo "    Recommendation: Free up at least 1-2GB"
fi
echo "✅ Disk space: $(df -h ~ | awk 'NR==2 {print $4}')"

# ═══════════════════════════════════════════════════════════════
# Create Sessions Directory
# ═══════════════════════════════════════════════════════════════

mkdir -p sessions
echo "✅ Sessions directory ready"

# ═══════════════════════════════════════════════════════════════
# Port Management
# ═══════════════════════════════════════════════════════════════

echo "🔗 Checking port 3001..."

# Kill any process using port 3001
EXISTING_PID=$(lsof -ti:3001 2>/dev/null || echo "")
if [ -n "$EXISTING_PID" ]; then
  echo "⚠️  Port 3001 is in use (PID: $EXISTING_PID)"
  echo "   Killing existing process..."
  kill -9 "$EXISTING_PID" 2>/dev/null || true
  sleep 1
fi
echo "✅ Port 3001 is available"

# ═══════════════════════════════════════════════════════════════
# Bot Mode Selection
# ═══════════════════════════════════════════════════════════════

SESSION_DIR="sessions/Default"
SESSION_EXISTS=false

if [ -d "$SESSION_DIR" ] && [ -n "$(ls -A "$SESSION_DIR" 2>/dev/null)" ]; then
  SESSION_EXISTS=true
fi

echo ""
echo "📱 WhatsApp Bot Startup"
echo "════════════════════════════════════════════════════════════════"

if [[ "$MODE" == "fore" ]]; then
  echo "🟢 Mode: FOREGROUND (forced by --mode fore)"
  echo ""
  echo "ℹ️  The bot will run in the foreground."
  echo "   You can see all logs in real-time."
  echo "   Press Ctrl+C to stop."
  echo ""
  node bot.js

elif [[ "$MODE" == "back" ]]; then
  echo "🟠 Mode: BACKGROUND (forced by --mode back)"
  echo ""
  nohup node bot.js > bot.log 2>&1 &
  BOT_PID=$!
  sleep 3

  if ps -p $BOT_PID > /dev/null 2>&1; then
    echo "✅ WhatsApp bot started successfully!"
    echo "   PID: $BOT_PID"
    echo "   Logs: tail -f $PROJECT_ROOT/whatsapp-bot/bot.log"
    echo ""
    echo "📝 View logs:"
    echo "   tail -f bot.log"
    echo ""
    echo "🛑 To stop the bot:"
    echo "   kill $BOT_PID"
  else
    echo "❌ WhatsApp bot failed to start"
    echo ""
    echo "Last 30 lines of error log:"
    tail -30 bot.log
    exit 1
  fi

else
  # Auto mode
  if [ "$SESSION_EXISTS" = false ]; then
    echo "🟢 Mode: FOREGROUND (first run - QR scan needed)"
    echo ""
    echo "✨ This is your first run!"
    echo ""
    echo "📱 Next steps:"
    echo "   1. A QR code will appear below"
    echo "   2. Scan it with WhatsApp on your phone"
    echo "   3. Session will be saved automatically"
    echo "   4. Press Ctrl+C after scanning to exit"
    echo "   5. Run ./what.sh again to start in background mode"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    node bot.js
  else
    echo "🟠 Mode: BACKGROUND (session found)"
    echo ""
    nohup node bot.js > bot.log 2>&1 &
    BOT_PID=$!
    sleep 3

    if ps -p $BOT_PID > /dev/null 2>&1; then
      echo "✅ WhatsApp bot started successfully!"
      echo "   PID: $BOT_PID"
      echo "   Logs: tail -f $PROJECT_ROOT/whatsapp-bot/bot.log"
      echo ""
      echo "📝 View logs:"
      echo "   tail -f bot.log"
      echo ""
      echo "🛑 To stop the bot:"
      echo "   kill $BOT_PID"
    else
      echo "❌ WhatsApp bot failed to start"
      echo ""
      echo "Troubleshooting:"
      echo "  1. Run: node diagnose.js"
      echo "  2. Check error details:"
      tail -30 bot.log
      exit 1
    fi
  fi
fi
