#!/usr/bin/env node

/**
 * WhatsApp Bot Diagnostic Tool
 * Helps troubleshoot browser and environment issues
 */

import { execSync } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.blue}${msg}${colors.reset}`),
};

function checkCommand(cmd, name) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getChromePath() {
  const possiblePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    `/home/${process.env.USER}/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome`,
  ];

  for (const pathPattern of possiblePaths) {
    try {
      if (pathPattern.includes('*')) {
        const dir = path.dirname(pathPattern);
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir).filter((f) => f.includes('chrome') || f.includes('chromium'));
          if (files.length > 0) {
            return path.join(dir, files[0]);
          }
        }
      } else if (fs.existsSync(pathPattern)) {
        return pathPattern;
      }
    } catch {
      // Continue to next path
    }
  }
  return null;
}

function testChromeStart(chromePath) {
  try {
    log.info(`Testing Chrome binary at: ${chromePath}`);
    execSync(`timeout 5 "${chromePath}" --headless --disable-gpu --version 2>&1 || true`, {
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

async function runDiagnostics() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  WhatsApp Bot Diagnostic Tool${colors.reset}         `);
  console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);

  let issuesFound = 0;

  // ─────────────────────────────────────────────────────────
  // 1. Node.js and npm
  // ─────────────────────────────────────────────────────────
  log.header('1. Node.js & npm');

  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    log.success(`Node.js: ${nodeVersion}`);
  } catch (e) {
    log.error('Node.js not found');
    issuesFound++;
  }

  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log.success(`npm: ${npmVersion}`);
  } catch (e) {
    log.error('npm not found');
    issuesFound++;
  }

  // ─────────────────────────────────────────────────────────
  // 2. Dependencies
  // ─────────────────────────────────────────────────────────
  log.header('2. Project Dependencies');

  const packagePath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packagePath)) {
    log.success('package.json found');

    const nodeModulesPath = path.join(__dirname, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      log.success('node_modules directory exists');

      const requiredModules = ['whatsapp-web.js', 'express', 'dotenv', 'chalk'];
      for (const module of requiredModules) {
        const modulePath = path.join(nodeModulesPath, module);
        if (fs.existsSync(modulePath)) {
          log.success(`${module}: installed`);
        } else {
          log.warn(`${module}: NOT installed`);
          issuesFound++;
        }
      }
    } else {
      log.warn('node_modules not found - run: npm install');
      issuesFound++;
    }
  } else {
    log.error('package.json not found');
    issuesFound++;
  }

  // ─────────────────────────────────────────────────────────
  // 3. Environment
  // ─────────────────────────────────────────────────────────
  log.header('3. System Environment');

  log.info(`OS: ${os.platform()} (${os.type()})`);
  log.info(`Architecture: ${os.arch()}`);
  log.info(`Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB total, ${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB free`);

  // ─────────────────────────────────────────────────────────
  // 4. Chrome/Chromium
  // ─────────────────────────────────────────────────────────
  log.header('4. Browser (Chrome/Chromium)');

  const chromePath = getChromePath();
  if (chromePath) {
    log.success(`Chrome/Chromium found: ${chromePath}`);

    // Try to get version
    try {
      const version = execSync(`"${chromePath}" --version 2>&1`, { encoding: 'utf8' }).trim();
      log.success(`Chrome version: ${version}`);
    } catch (e) {
      log.warn('Could not determine Chrome version');
    }

    // Test if Chrome can start
    if (testChromeStart(chromePath)) {
      log.success('Chrome can be launched and responds to commands');
    } else {
      log.warn('Chrome exists but may have issues launching');
      issuesFound++;
    }
  } else {
    log.error('Chrome/Chromium not found in standard locations');
    log.warn('Install Chrome/Chromium or set PUPPETEER_EXECUTABLE_PATH environment variable');
    issuesFound++;
  }

  // ─────────────────────────────────────────────────────────
  // 5. Puppeteer
  // ─────────────────────────────────────────────────────────
  log.header('5. Puppeteer Configuration');

  const puppeteerPath = path.join(__dirname, 'node_modules', 'puppeteer');
  if (fs.existsSync(puppeteerPath)) {
    log.success('Puppeteer is installed');

    try {
      const stdout = execSync('npx puppeteer browsers list 2>&1', { cwd: __dirname, encoding: 'utf8' });
      if (stdout.includes('chrome')) {
        log.success('Puppeteer-managed Chrome is available');
      } else {
        log.warn('Puppeteer-managed Chrome not found');
        issuesFound++;
      }
    } catch (e) {
      log.warn('Could not check Puppeteer browsers');
    }
  } else {
    log.warn('Puppeteer not installed (required by whatsapp-web.js)');
    issuesFound++;
  }

  // ─────────────────────────────────────────────────────────
  // 6. Required Ports
  // ─────────────────────────────────────────────────────────
  log.header('6. Network Ports');

  const requiredPorts = [3001, 8000]; // Bot API, Backend
  for (const port of requiredPorts) {
    try {
      execSync(`lsof -ti:${port}`, { stdio: 'pipe' });
      log.warn(`Port ${port} is already in use`);
      issuesFound++;
    } catch {
      log.success(`Port ${port} is available`);
    }
  }

  // ─────────────────────────────────────────────────────────
  // 7. Session Data
  // ─────────────────────────────────────────────────────────
  log.header('7. WhatsApp Session Data');

  const sessionsDir = path.join(__dirname, '.wwebjs_auth');
  if (fs.existsSync(sessionsDir)) {
    const files = fs.readdirSync(sessionsDir);
    log.success(`Session directory found with ${files.length} files`);
  } else {
    log.info('No session data found (first run will scan QR code)');
  }

  // ─────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────
  log.header('Summary');

  if (issuesFound === 0) {
    log.success('All systems operational! ✨');
    console.log(`\nYou can now run: ./what.sh`);
  } else {
    log.warn(`${issuesFound} issue(s) found`);
    console.log(`\n${colors.yellow}Troubleshooting steps:${colors.reset}`);
    console.log('1. Ensure Chrome/Chromium is installed:');
    console.log('   Ubuntu/Debian: sudo apt install chromium-browser');
    console.log('   Fedora/RHEL: sudo dnf install chromium');
    console.log('   macOS: brew install --cask google-chrome');
    console.log('');
    console.log('2. Install project dependencies:');
    console.log('   npm install --legacy-peer-deps');
    console.log('');
    console.log('3. Ensure sufficient disk space for Puppeteer browser');
    console.log('');
    console.log('4. Check available memory: free -h');
  }

  console.log('');
}

runDiagnostics().catch((err) => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});
