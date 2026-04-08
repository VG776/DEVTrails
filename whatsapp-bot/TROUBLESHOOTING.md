# WhatsApp Bot - TargetCloseError Troubleshooting Guide

## Error Description
```
❌ Unhandled Rejection at [object Promise]: TargetCloseError: Protocol error 
(Page.addScriptToEvaluateOnNewDocument): Session closed. Most likely the page 
has been closed.
```

This error occurs when the WhatsApp bot tries to communicate with the Puppeteer browser instance, but the browser session has already closed. This typically happens during bot initialization.

---

## Common Causes & Solutions

### 1. **Chrome/Chromium Not Installed or Not Found** ⚠️
**Problem**: The bot cannot find a Chrome/Chromium browser to launch.

**Solution**:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install chromium-browser

# Fedora/RHEL
sudo dnf install chromium

# macOS
brew install --cask google-chrome

# Or let Puppeteer install Chrome
npx puppeteer browsers install chrome
```

---

### 2. **Incorrect Puppeteer Executable Path** 🔧
**Problem**: The bot can't find Chrome because the path is wrong or outdated.

**Solution**:
Run the diagnostic tool to find the correct path:
```bash
cd whatsapp-bot
node diagnose.js
```

Then set the environment variable:
```bash
export PUPPETEER_EXECUTABLE_PATH="/path/to/chrome"
node bot.js
```

Or update `bot.js` with the correct path in the `findChromePath()` function.

---

### 3. **Insufficient System Resources** 💾
**Problem**: The browser crashes due to low memory or disk space.

**Check memory**:
```bash
free -h
# Need at least 500MB - 1GB free memory
```

**Check disk space**:
```bash
df -h ~
# Need at least 1-2GB free for Puppeteer + Chrome
```

**Solution**: Free up resources or upgrade hardware.

---

### 4. **Chrome Run Script Sandbox Issues** 🔒
**Problem**: Chrome crashes due to sandboxing conflicts in containers/VMs.

**Current bot.js already includes these flags**:
```javascript
'--no-sandbox',
'--disable-setuid-sandbox',
'--disable-gpu',
'--disable-dev-shm-usage',
```

**If still failing**, try running with explicit environment variables:
```bash
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
node bot.js
```

---

### 5. **Port Already in Use** 📡
**Problem**: Port 3001 is already occupied, preventing the bot from starting properly.

**Check and kill process**:
```bash
# Find process using port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "Port 3001 is free"

# Or use a different port
BOT_PORT=3002 node bot.js
```

---

### 6. **Corrupted Session Files** 📁
**Problem**: Old session files prevent proper initialization.

**Solution**:
```bash
# Remove corrupted session
rm -rf .wwebjs_auth
rm -rf sessions

# Restart and scan QR code again
node bot.js
```

---

### 7. **Node.js or Dependencies Outdated** 📦
**Problem**: Version conflicts between dependencies.

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --include=optional

# Verify dependencies
npm list whatsapp-web.js puppeteer
```

---

## Step-by-Step Troubleshooting

### Step 1: Run Diagnostic Tool
```bash
cd /path/to/whatsapp-bot
node diagnose.js
```
This will show you exactly what's wrong.

### Step 2: Verify Chrome Installation
```bash
# Find Chrome
which google-chrome chromium chromium-browser 2>/dev/null || echo "Chrome not found"

# Test Chrome
google-chrome --version
```

### Step 3: Fresh Installation
```bash
cd /path/to/whatsapp-bot

# Clean everything
rm -rf node_modules package-lock.json .wwebjs_auth sessions

# Reinstall
npm install --legacy-peer-deps --include=optional

# Install Puppeteer-managed Chrome
npx puppeteer browsers install chrome
```

### Step 4: Enable Debug Logging
```bash
# Run with debug mode
DEBUG=true node bot.js
```

### Step 5: Test in Foreground Mode
```bash
# Run in foreground to see real-time output
cd whatsapp-bot
node bot.js
# OR
./what.sh --mode fore
```

---

## Environment Variables

Set these before running the bot:

```bash
# Required
export BOT_PORT=3001
export BACKEND_URL=http://localhost:8000

# Optional but helpful
export DEBUG=true
export NODE_ENV=development
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
```

---

## Quick Fixes Checklist

- [ ] Run `node diagnose.js` and fix reported issues
- [ ] Ensure Chrome/Chromium is installed: `google-chrome --version`
- [ ] Free disk space: `df -h ~` (need 1GB+)
- [ ] Free memory: `free -h` (need 500MB+)
- [ ] Kill existing processes: `lsof -ti:3001 | xargs kill -9`
- [ ] Remove corrupted sessions: `rm -rf .wwebjs_auth sessions`
- [ ] Reinstall dependencies: `npm install --legacy-peer-deps`
- [ ] Run in foreground to see actual errors: `node bot.js`

---

## If All Else Fails

1. **Reset Everything**:
   ```bash
   pkill -f "node bot.js" 2>/dev/null || true
   pkill -f "chrome" 2>/dev/null || true
   pkill -f "chromium" 2>/dev/null || true
   sleep 2
   ```

2. **Fresh Clone**:
   ```bash
   cd ..
   rm -rf whatsapp-bot
   git clone <repo> whatsapp-bot
   cd whatsapp-bot
   npm install --legacy-peer-deps
   ```

3. **Contact Support** with:
   - Output of `node diagnose.js`
   - Output of `npm list` (first 20 lines)
   - Your OS and Chrome version
   - Logs from running `DEBUG=true node bot.js` (first error message)

---

## Prevention Tips

1. **Regular Maintenance**:
   ```bash
   npm audit fix
   npm update
   ```

2. **Monitor Resources**:
   ```bash
   watch -n 1 'free -h && echo "---" && df -h .'
   ```

3. **Use Systemd** (for production):
   Create `/etc/systemd/system/whatsapp-bot.service` to auto-restart on failure.

4. **Keep Chrome Updated**:
   ```bash
   apt update && apt upgrade chromium-browser
   ```

---

**Last Updated**: April 2026  
**Version**: WhatsApp Bot v2.0
