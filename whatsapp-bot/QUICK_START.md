# WhatsApp Bot - Quick Reference Guide

## TL;DR - Get Started Now

```bash
# First time setup
cd whatsapp-bot
npm install --legacy-peer-deps
node bot.js

# After first run (scan QR code), future runs:
./what.sh
```

---

## The Error You're Facing
```
❌ TargetCloseError: Protocol error (Page.addScriptToEvaluateOnNewDocument): 
Session closed. Most likely the page has been closed.
```

**Root causes**: Chrome not installed, browser crash, low system resources, or port conflict

---

## 30-Second Fix

### Option 1: Install Chrome (Most Common Fix)
```bash
# Ubuntu/Debian
sudo apt install chromium-browser

# Fedora/RHEL
sudo dnf install chromium

# macOS
brew install --cask google-chrome
```

Then run:
```bash
cd whatsapp-bot
node bot.js
```

### Option 2: Let Puppeteer Handle It
```bash
cd whatsapp-bot
npx puppeteer browsers install chrome
node bot.js
```

### Option 3: Run Diagnostic Tool
```bash
cd whatsapp-bot
node diagnose.js
```

This will tell you exactly what's wrong!

---

## Usage After Setup

### First Run (Must Scan QR Code)
```bash
./what.sh
# OR explicitly
./what.sh --mode fore
```
- A QR code appears in terminal
- Scan with WhatsApp on your phone
- Press Ctrl+C after scanning
- Re-run to start in background

### Subsequent Runs (Background Mode)
```bash
./what.sh
# Runs in background automatically
```

### Manual Modes
```bash
./what.sh --mode fore   # Always run in foreground
./what.sh --mode back   # Always run in background  
./what.sh --mode auto   # Smart auto-detection (default)
./what.sh --diagnose    # Run diagnostic checks
```

---

## Troubleshooting

### Check What's Wrong
```bash
cd whatsapp-bot
node diagnose.js
```

### View Real-Time Logs
```bash
cd whatsapp-bot
node bot.js
```

### View Background Logs
```bash
cd whatsapp-bot
tail -f bot.log
```

### Stop the Bot
```bash
pkill -f "node bot.js"
# OR find PID and kill it
lsof -ti:3001 | xargs kill -9
```

### Reset Everything
```bash
cd whatsapp-bot
rm -rf node_modules .wwebjs_auth sessions
npm install --legacy-peer-deps
node bot.js
```

---

## Common Issues

### "Chrome not found"
```bash
# Install it
sudo apt install chromium-browser    # Ubuntu/Debian
sudo dnf install chromium            # Fedora
brew install --cask google-chrome    # macOS
```

### "Port 3001 already in use"
```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9
# Then try again
./what.sh
```

### "Not enough memory"
```bash
# Check memory
free -h
# Need at least 500MB free
# Close other apps
```

### "Session closed"
```bash
# Remove corrupted session
rm -rf .wwebjs_auth sessions
# Try again
node bot.js
```

### "npm install fails"
```bash
# Clear npm cache
npm cache clean --force
# Try again
npm install --legacy-peer-deps
```

---

## API Endpoints (After Bot Starts)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/send-message` | POST | Send message to worker |
| `/broadcast-disruption-alert` | POST | Alert multiple workers |
| `/send-payout-confirmation` | POST | Send payout details |
| `/send-fraud-alert` | POST | Alert of fraud flag |
| `/health` | GET | Check bot status |
| `/stats` | GET | View statistics |

### Example: Send Message
```bash
curl -X POST http://localhost:3001/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "919876543210",
    "message": "Hello! Your payout is ready.",
    "messageType": "payout"
  }'
```

---

## File Locations

| File | Purpose |
|------|---------|
| `bot.js` | Main bot application |
| `diagnose.js` | Diagnostic tool |
| `bot.log` | Background mode logs |
| `.wwebjs_auth/` | WhatsApp session data |
| `sessions/` | Local session cache |

---

## Environment Variables

Set before running:
```bash
export BOT_PORT=3001
export BACKEND_URL=http://localhost:8000
export DEBUG=true           # Show debug logs
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

Or in `.env` file (if supported):
```
BOT_PORT=3001
BACKEND_URL=http://localhost:8000
DEBUG=true
```

---

## Getting Help

1. **Run diagnostics**:
   ```bash
   node diagnose.js
   ```

2. **Check logs**:
   ```bash
   tail -f bot.log
   ```

3. **See foreground output**:
   ```bash
   node bot.js
   ```

4. **Read full guide**:
   ```bash
   cat TROUBLESHOOTING.md
   ```

---

## Quick Checklist

- [ ] Chrome/Chromium installed: `google-chrome --version`
- [ ] Node.js v16+: `node --version`
- [ ] Port 3001 free: `lsof -ti:3001` (empty output = good)
- [ ] 500MB+ memory: `free -h`
- [ ] Dependencies installed: `npm list --depth=0`
- [ ] Run diagnostic: `node diagnose.js`
- [ ] Try foreground mode: `node bot.js`

---

## Version Info
- **WhatsApp Bot**: v2.0
- **whatsapp-web.js**: ^1.23.0
- **Node.js**: >=16.0.0
- **Last Updated**: April 2026
