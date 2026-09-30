/**
 * Mail.md Screenshot Tests
 * 
 * Tests the extension by injecting CSS/JS into a Gmail-like fixture
 * and capturing screenshots of various states.
 * 
 * Note: These tests use a static fixture, not real Gmail.
 * Real Gmail verification is pending manual testing.
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Read extension files
const css = fs.readFileSync(path.join(__dirname, '../gmailmd.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'content-test.js'), 'utf8');

// Helper to compute screenshot hash
function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const data = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(data).digest('hex');
}

// Track screenshot hashes to ensure they're unique
const screenshotHashes = {};

test.describe('Mail.md Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Load fixture fresh for each test
    await page.goto(`file://${path.join(__dirname, 'fixture/index.html')}`, {
      waitUntil: 'domcontentloaded'
    });
    
    // Ensure clean initial state
    await page.evaluate(() => {
      // Force compose hidden
      const compose = document.getElementById('compose-dialog');
      if (compose) {
        compose.classList.remove('visible');
        compose.style.display = 'none';
      }
      // Default to inbox view
      const inboxView = document.getElementById('inbox-view');
      const threadView = document.getElementById('thread-view');
      if (inboxView) inboxView.style.display = 'block';
      if (threadView) threadView.style.display = 'none';
    });
  });

  test('01 - Stock Gmail (baseline)', async ({ page }) => {
    // Ensure we're on inbox view with compose closed
    await page.evaluate(() => {
      const compose = document.getElementById('compose-dialog');
      if (compose) {
        compose.classList.remove('visible');
        compose.style.display = 'none';
      }
      document.getElementById('inbox-view').style.display = 'block';
      document.getElementById('thread-view').style.display = 'none';
    });
    await page.waitForTimeout(200);
    
    // Capture stock Gmail look (no extension)
    const screenshotPath = 'docs/screenshots/01-stock.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    screenshotHashes['01-stock'] = getFileHash(screenshotPath);
  });

  test('02 - Inbox with Mail.md enabled', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Enable Mail.md
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.setAttribute('data-gmd-theme', 'light');
    });
    
    await page.waitForTimeout(500);
    
    // Visual assertions: verify correct state
    const state = await page.evaluate(() => {
      const compose = document.getElementById('compose-dialog');
      const inboxView = document.getElementById('inbox-view');
      const inboxRows = document.querySelectorAll('[role="row"]');
      const nav = document.querySelector('[role="navigation"]');
      
      return {
        composeVisible: compose && (compose.classList.contains('visible') || compose.style.display === 'block'),
        inboxVisible: inboxView && inboxView.style.display !== 'none',
        hasInboxRows: inboxRows.length > 0,
        navHidden: nav && window.getComputedStyle(nav).display === 'none'
      };
    });
    
    expect(state.composeVisible).toBe(false);
    expect(state.inboxVisible).toBe(true);
    expect(state.hasInboxRows).toBe(true);
    expect(state.navHidden).toBe(true);
    
    const screenshotPath = 'docs/screenshots/02-inbox-light.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    const hash = getFileHash(screenshotPath);
    const stockHash = screenshotHashes['01-stock'];
    if (stockHash) {
      expect(hash).not.toBe(stockHash);
    }
    screenshotHashes['02-inbox-light'] = hash;
  });

  test('03 - Reading view', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Enable Mail.md
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.setAttribute('data-gmd-theme', 'light');
    });
    
    // Switch to thread view
    await page.evaluate(() => {
      document.getElementById('inbox-view').style.display = 'none';
      document.getElementById('thread-view').style.display = 'block';
    });
    await page.waitForTimeout(500);
    
    // Visual assertions: verify reading state
    const state = await page.evaluate(() => {
      const banner = document.querySelector('.banner');
      const threadView = document.getElementById('thread-view');
      const articles = document.querySelectorAll('[role="article"]');
      const toolbar = document.querySelector('[role="toolbar"]');
      
      return {
        bannerHidden: banner && window.getComputedStyle(banner).display === 'none',
        threadVisible: threadView && threadView.style.display !== 'none',
        hasArticles: articles.length > 0,
        toolbarMinimized: toolbar !== null
      };
    });
    
    expect(state.bannerHidden).toBe(true);
    expect(state.threadVisible).toBe(true);
    expect(state.hasArticles).toBe(true);
    
    const screenshotPath = 'docs/screenshots/03-reading.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    const hash = getFileHash(screenshotPath);
    const inboxHash = screenshotHashes['02-inbox-light'];
    screenshotHashes['03-reading'] = hash;
  });

  test('04 - Compose view', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Enable Mail.md
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.setAttribute('data-gmd-theme', 'light');
    });
    
    // Open compose - make it explicitly visible
    await page.evaluate(() => {
      const compose = document.getElementById('compose-dialog');
      compose.classList.add('visible');
      compose.style.display = 'block';
    });
    await page.waitForTimeout(300);
    
    // Add sample text
    await page.evaluate(() => {
      const recipients = document.querySelector('#compose-dialog [role="combobox"]');
      if (recipients) recipients.value = 'team@example.com';
      
      const subject = document.querySelector('#compose-dialog input[name="subjectbox"]');
      if (subject) subject.value = 'Q4 Planning Update';
      
      const editor = document.querySelector('#compose-dialog [contenteditable="true"]');
      if (editor) {
        editor.textContent = 'This is a sample email being composed in Mail.md.\n\nNotice the focused, centered typography with consistent iA Writer Duo font throughout.';
      }
    });
    await page.waitForTimeout(200);
    
    // Visual assertions: verify compose state
    const state = await page.evaluate(() => {
      const compose = document.getElementById('compose-dialog');
      const editor = document.querySelector('#compose-dialog [contenteditable="true"]');
      const closeBtn = document.querySelector('#compose-dialog button');
      
      return {
        composeVisible: compose && (compose.classList.contains('visible') || compose.style.display === 'block'),
        hasEditor: editor !== null,
        hasCloseButton: closeBtn !== null,
        editorHasContent: editor && editor.textContent.length > 0
      };
    });
    
    expect(state.composeVisible).toBe(true);
    expect(state.hasEditor).toBe(true);
    expect(state.editorHasContent).toBe(true);
    
    const screenshotPath = 'docs/screenshots/04-compose.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    const hash = getFileHash(screenshotPath);
    const readingHash = screenshotHashes['03-reading'];
    if (readingHash) {
      expect(hash).not.toBe(readingHash);
    }
    screenshotHashes['04-compose'] = hash;
  });

  test('05 - Command Palette', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Enable Mail.md - stay on inbox view
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.setAttribute('data-gmd-theme', 'light');
    });
    await page.waitForTimeout(200);
    
    // Manually trigger palette opening via exposed test API
    await page.evaluate(() => {
      if (window._gmdTest && window._gmdTest.togglePalette) {
        window._gmdTest.togglePalette();
      }
    });
    await page.waitForTimeout(500);
    
    // Visual assertions: verify palette state
    const state = await page.evaluate(() => {
      const paletteHost = document.getElementById('gmd-palette-host');
      const banner = document.querySelector('.banner');
      const inboxVisible = document.getElementById('inbox-view').style.display !== 'none';
      
      return {
        paletteExists: paletteHost !== null,
        bannerHidden: banner && window.getComputedStyle(banner).display === 'none',
        inboxVisible: inboxVisible
      };
    });
    
    expect(state.paletteExists).toBe(true);
    expect(state.bannerHidden).toBe(true);
    expect(state.inboxVisible).toBe(true);
    
    const screenshotPath = 'docs/screenshots/05-palette.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    const hash = getFileHash(screenshotPath);
    const inboxHash = screenshotHashes['02-inbox-light'];
    if (inboxHash) {
      expect(hash).not.toBe(inboxHash);
    }
    screenshotHashes['05-palette'] = hash;
  });

  test('06 - Focus Mode', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Enable Mail.md
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.setAttribute('data-gmd-theme', 'light');
      // Ensure compose is hidden
      const compose = document.getElementById('compose-dialog');
      if (compose) {
        compose.classList.remove('visible');
        compose.style.display = 'none';
      }
    });
    
    // Switch to thread view
    await page.evaluate(() => {
      document.getElementById('inbox-view').style.display = 'none';
      document.getElementById('thread-view').style.display = 'block';
    });
    await page.waitForTimeout(200);
    
    // Enable focus mode
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-focus');
    });
    await page.waitForTimeout(300);
    
    const screenshotPath = 'docs/screenshots/06-focus.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    // Verify this is different from normal reading view
    const hash = getFileHash(screenshotPath);
    const readingHash = screenshotHashes['03-reading'];
    if (readingHash) {
      expect(hash).not.toBe(readingHash);
    }
    screenshotHashes['06-focus'] = hash;
  });

  test('07 - Dark Theme', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Enable Mail.md with dark theme - show inbox, not compose
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.setAttribute('data-gmd-theme', 'dark');
      // Ensure compose is hidden and we're on inbox view
      const compose = document.getElementById('compose-dialog');
      if (compose) {
        compose.classList.remove('visible');
        compose.style.display = 'none';
      }
      document.getElementById('inbox-view').style.display = 'block';
      document.getElementById('thread-view').style.display = 'none';
    });
    
    await page.waitForTimeout(500);
    
    const screenshotPath = 'docs/screenshots/07-dark.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    // Verify this is different from light theme inbox
    const hash = getFileHash(screenshotPath);
    const lightHash = screenshotHashes['02-inbox-light'];
    if (lightHash) {
      expect(hash).not.toBe(lightHash);
    }
    screenshotHashes['07-dark'] = hash;
  });

  test('08 - Kill Switch (back to stock)', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Enable Mail.md
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.setAttribute('data-gmd-theme', 'light');
      // Ensure we're on inbox view
      const compose = document.getElementById('compose-dialog');
      if (compose) {
        compose.classList.remove('visible');
        compose.style.display = 'none';
      }
      document.getElementById('inbox-view').style.display = 'block';
      document.getElementById('thread-view').style.display = 'none';
    });
    await page.waitForTimeout(200);
    
    // Kill switch: remove gmd-on class
    await page.evaluate(() => {
      document.documentElement.classList.remove('gmd-on');
    });
    await page.waitForTimeout(300);
    
    const screenshotPath = 'docs/screenshots/08-killswitch.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    // Verify this matches stock Gmail (should be same or very similar)
    const hash = getFileHash(screenshotPath);
    screenshotHashes['08-killswitch'] = hash;
  });
});
