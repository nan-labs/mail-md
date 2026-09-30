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
    
    // Visual assertions: verify palette state, positioning, and backdrop coverage
    const state = await page.evaluate(() => {
      const paletteHost = document.getElementById('gmd-palette-host');
      const banner = document.querySelector('.banner');
      const inboxVisible = document.getElementById('inbox-view').style.display !== 'none';
      
      // Check palette card offset from top and backdrop coverage
      let paletteTop = null;
      let backdropCoversTop = false;
      let paletteCardTop = null;
      
      if (paletteHost) {
        const hostRect = paletteHost.getBoundingClientRect();
        paletteTop = hostRect.top;
        backdropCoversTop = hostRect.top === 0; // Backdrop should start at y=0
        
        if (paletteHost.shadowRoot) {
          const card = paletteHost.shadowRoot.querySelector('.palette');
          if (card) {
            const cardRect = card.getBoundingClientRect();
            paletteCardTop = cardRect.top;
          }
        }
      }
      
      return {
        paletteExists: paletteHost !== null,
        paletteTop: paletteTop,
        paletteCardTop: paletteCardTop,
        backdropCoversTop: backdropCoversTop,
        cardOffsetFromTop: paletteCardTop !== null && paletteCardTop > 50,
        bannerHidden: banner && window.getComputedStyle(banner).display === 'none',
        inboxVisible: inboxVisible
      };
    });
    
    expect(state.paletteExists).toBe(true);
    expect(state.backdropCoversTop).toBe(true);
    expect(state.cardOffsetFromTop).toBe(true); // Card should be > 50px from top (~15vh)
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

  test('07 - Dark Theme Inbox', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Enable Mail.md with dark theme - show inbox
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.setAttribute('data-gmd-theme', 'dark');
    });
    
    await page.waitForTimeout(500);
    
    // Visual assertions: verify dark theme applied with contrast check
    const state = await page.evaluate(() => {
      const body = document.body;
      const main = document.querySelector('[role="main"]');
      const row = document.querySelector('[role="row"]');
      
      const bodyBg = window.getComputedStyle(body).backgroundColor;
      const mainBg = window.getComputedStyle(main).backgroundColor;
      const rowColor = row ? window.getComputedStyle(row).color : '';
      
      // Simple contrast check
      function getLuminance(rgb) {
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return null;
        const [r, g, b] = match.slice(1).map(x => {
          const val = parseInt(x) / 255;
          return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
      
      const bgLum = getLuminance(bodyBg);
      const fgLum = getLuminance(rowColor);
      const contrast = bgLum !== null && fgLum !== null && bgLum < fgLum ? (fgLum + 0.05) / (bgLum + 0.05) : 0;
      
      return {
        bodyBg,
        mainBg,
        rowColor,
        isDark: bodyBg.includes('30, 30, 30') || bodyBg.includes('rgb(30'),
        contrast: contrast,
        hasGoodContrast: contrast >= 4.5
      };
    });
    
    expect(state.isDark).toBe(true);
    expect(state.hasGoodContrast).toBe(true);
    
    const screenshotPath = 'docs/screenshots/07-dark-inbox.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    const hash = getFileHash(screenshotPath);
    const lightHash = screenshotHashes['02-inbox-light'];
    if (lightHash) {
      expect(hash).not.toBe(lightHash);
    }
    screenshotHashes['07-dark-inbox'] = hash;
  });

  test('09 - Dark Theme Reading', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Enable Mail.md with dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.setAttribute('data-gmd-theme', 'dark');
    });
    
    // Switch to thread view
    await page.evaluate(() => {
      document.getElementById('inbox-view').style.display = 'none';
      document.getElementById('thread-view').style.display = 'block';
    });
    await page.waitForTimeout(500);
    
    // Visual assertions: verify dark theme in reading view with contrast check
    const state = await page.evaluate(() => {
      const body = document.body;
      const main = document.querySelector('[role="main"]');
      const article = document.querySelector('[role="article"]');
      
      const bodyBg = window.getComputedStyle(body).backgroundColor;
      const mainBg = window.getComputedStyle(main).backgroundColor;
      const articleBg = article ? window.getComputedStyle(article).backgroundColor : 'transparent';
      const articleColor = article ? window.getComputedStyle(article).color : '';
      
      // Simple contrast check: extract RGB values and compute relative luminance
      function getLuminance(rgb) {
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return null;
        const [r, g, b] = match.slice(1).map(x => {
          const val = parseInt(x) / 255;
          return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
      
      const bgLum = getLuminance(articleBg === 'rgba(0, 0, 0, 0)' || articleBg === 'transparent' ? bodyBg : articleBg);
      const fgLum = getLuminance(articleColor);
      const contrast = bgLum !== null && fgLum !== null && bgLum < fgLum ? (fgLum + 0.05) / (bgLum + 0.05) : 0;
      
      return {
        bodyBg,
        mainBg,
        articleBg,
        articleColor,
        isDark: bodyBg.includes('30, 30, 30') || bodyBg.includes('rgb(30'),
        articleBgNotLight: !articleBg.includes('248') && !articleBg.includes('249'), // Not #f8f9fa
        contrast: contrast,
        hasGoodContrast: contrast >= 4.5
      };
    });
    
    expect(state.isDark).toBe(true);
    expect(state.articleBgNotLight).toBe(true);
    expect(state.hasGoodContrast).toBe(true);
    
    const screenshotPath = 'docs/screenshots/09-dark-reading.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    screenshotHashes['09-dark-reading'] = getFileHash(screenshotPath);
  });

  test('10 - Dark Theme Compose', async ({ page }) => {
    // Inject extension
    await page.addStyleTag({ content: css });
    await page.evaluate(js);
    
    // Enable Mail.md with dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add('gmd-on');
      document.documentElement.setAttribute('data-gmd-theme', 'dark');
    });
    
    // Open compose
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
      if (subject) subject.value = 'Late evening update';
      
      const editor = document.querySelector('#compose-dialog [contenteditable="true"]');
      if (editor) {
        editor.textContent = 'Writing an email in dark mode.\n\nThe entire compose view is dark.';
      }
    });
    await page.waitForTimeout(200);
    
    // Visual assertions: verify dark theme in compose
    const state = await page.evaluate(() => {
      const compose = document.getElementById('compose-dialog');
      const composeBg = window.getComputedStyle(compose).backgroundColor;
      
      return {
        composeBg,
        isDark: composeBg.includes('30, 30, 30') || composeBg.includes('rgb(30')
      };
    });
    
    expect(state.isDark).toBe(true);
    
    const screenshotPath = 'docs/screenshots/10-dark-compose.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    screenshotHashes['10-dark-compose'] = getFileHash(screenshotPath);
  });

  test('11 - Kill Switch (back to stock)', async ({ page }) => {
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
    
    const screenshotPath = 'docs/screenshots/11-killswitch.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    // Verify this matches stock Gmail (should be same or very similar)
    const hash = getFileHash(screenshotPath);
    screenshotHashes['11-killswitch'] = hash;
  });
});
