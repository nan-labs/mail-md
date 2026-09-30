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

// Read extension files
const css = fs.readFileSync(path.join(__dirname, '../gmailmd.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'content-test.js'), 'utf8');

test.describe('Mail.md Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Load fixture
    await page.goto(`file://${path.join(__dirname, 'fixture/index.html')}`);
    
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');
  });

  test('01 - Stock Gmail (baseline)', async ({ page }) => {
    // Capture stock Gmail look (no extension)
    await page.screenshot({ 
      path: 'docs/screenshots/01-stock.png',
      fullPage: true 
    });
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
    
    await page.waitForTimeout(500); // Let styles settle
    
    await page.screenshot({ 
      path: 'docs/screenshots/02-inbox-light.png',
      fullPage: true 
    });
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
    
    // Switch to thread view directly via JavaScript
    await page.evaluate(() => {
      document.getElementById('inbox-view').style.display = 'none';
      document.getElementById('thread-view').style.display = 'block';
    });
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'docs/screenshots/03-reading.png',
      fullPage: true 
    });
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
    
    // Open compose directly via JavaScript
    await page.evaluate(() => {
      document.getElementById('compose-dialog').classList.add('visible');
    });
    await page.waitForTimeout(500);
    
    // Add some sample text
    await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]');
      if (editor) {
        editor.textContent = 'This is a sample email being composed in Mail.md.\n\nNotice the focused, centered typography.';
      }
    });
    
    await page.screenshot({ 
      path: 'docs/screenshots/04-compose.png',
      fullPage: true 
    });
  });

  test('05 - Command Palette', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Enable Mail.md
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.setAttribute('data-gmd-theme', 'light');
    });
    
    // Trigger palette with keyboard
    await page.keyboard.press('Meta+k'); // Cmd+K on Mac
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'docs/screenshots/05-palette.png',
      fullPage: true 
    });
  });

  test('06 - Focus Mode', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Switch to thread view first, then enable focus mode
    await page.evaluate(() => {
      document.getElementById('inbox-view').style.display = 'none';
      document.getElementById('thread-view').style.display = 'block';
    });
    await page.waitForTimeout(200);
    
    // Enable Mail.md with focus mode
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.classList.add('gmd-focus');
      document.documentElement.setAttribute('data-gmd-theme', 'light');
    });
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'docs/screenshots/06-focus.png',
      fullPage: true 
    });
  });

  test('07 - Dark Theme', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Enable Mail.md with dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.setAttribute('data-gmd-theme', 'dark');
    });
    
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'docs/screenshots/07-dark.png',
      fullPage: true 
    });
  });

  test('08 - Kill Switch (back to stock)', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Enable then disable Mail.md
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.setAttribute('data-gmd-theme', 'light');
    });
    await page.waitForTimeout(200);
    
    // Kill switch: remove gmd-on class
    await page.evaluate(() => {
      document.documentElement.classList.remove('gmd-on');
    });
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'docs/screenshots/08-killswitch.png',
      fullPage: true 
    });
  });
});
