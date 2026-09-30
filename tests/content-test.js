/**
 * Mail.md content script (Test Version)
 * Simplified version for Playwright tests without Chrome extension API
 */

(function() {
  'use strict';

  // State management
  let isEnabled = true;
  let isFocusMode = false;
  let paletteOpen = false;
  let paletteHost = null;

  // Initialize with defaults (no storage in tests)
  function applyState() {
    document.documentElement.classList.toggle('gmd-on', isEnabled);
    document.documentElement.classList.toggle('gmd-focus', isFocusMode && isEnabled);
    document.documentElement.setAttribute('data-gmd-theme', 'light');
  }

  // MutationObserver to tag Gmail regions
  const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;

    const nav = document.querySelector('[role="navigation"]');
    if (nav && !nav.hasAttribute('data-gmd')) {
      nav.setAttribute('data-gmd', 'nav');
    }

    const main = document.querySelector('[role="main"]');
    if (main && !main.hasAttribute('data-gmd')) {
      main.setAttribute('data-gmd', 'main');
    }

    document.querySelectorAll('[role="dialog"]').forEach(dialog => {
      if (!dialog.hasAttribute('data-gmd')) {
        const hasEditor = dialog.querySelector('[contenteditable="true"]');
        if (hasEditor) {
          dialog.setAttribute('data-gmd', 'compose');
        }
      }
    });

    const listBox = document.querySelector('[role="main"] [role="list"]');
    if (listBox && !listBox.hasAttribute('data-gmd')) {
      listBox.setAttribute('data-gmd', 'inbox-list');
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.indexOf('Mac') > -1;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (cmdOrCtrl && e.key === 'k') {
      e.preventDefault();
      togglePalette();
      return;
    }

    if (cmdOrCtrl && e.key === '.') {
      e.preventDefault();
      toggleFocusMode();
      return;
    }

    if (cmdOrCtrl && e.shiftKey && e.key === 'G') {
      e.preventDefault();
      toggleEnabled();
      return;
    }

    if (e.key === 'Escape') {
      if (paletteOpen) {
        e.preventDefault();
        closePalette();
      } else if (isFocusMode) {
        e.preventDefault();
        toggleFocusMode();
      }
      return;
    }
  });

  function toggleEnabled() {
    isEnabled = !isEnabled;
    applyState();
  }

  function toggleFocusMode() {
    if (!isEnabled) return;
    isFocusMode = !isFocusMode;
    applyState();
  }

  // Command Palette
  function createPalette() {
    if (paletteHost) return paletteHost;

    paletteHost = document.createElement('div');
    paletteHost.id = 'gmd-palette-host';
    
    const shadow = paletteHost.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        background: rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(3px);
      }

      .palette {
        width: 600px;
        max-width: 90vw;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        font-family: 'iA Writer Duo', 'SF Mono', Monaco, Menlo, Consolas, monospace;
        margin-top: 15vh;
      }

      [data-gmd-theme="dark"] .palette {
        background: #1e1e1e;
        border-color: #404040;
      }

      .search-input {
        width: 100%;
        padding: 16px 20px;
        border: none;
        border-bottom: 1px solid #e0e0e0;
        font-size: 15px;
        outline: none;
        font-family: inherit;
        background: transparent;
        color: inherit;
      }

      [data-gmd-theme="dark"] .search-input {
        border-bottom-color: #404040;
      }

      .results {
        max-height: 400px;
        overflow-y: auto;
      }

      .result-item {
        padding: 10px 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        background: transparent;
        transition: background 0.15s;
      }

      .result-item:hover {
        background: #f5f5f5;
      }

      [data-gmd-theme="dark"] .result-item:hover {
        background: #2d2d2d;
      }

      .result-item.selected {
        background: rgba(26, 115, 232, 0.08);
        border-left: 2px solid #1a73e8;
        padding-left: 18px;
      }

      [data-gmd-theme="dark"] .result-item.selected {
        background: rgba(74, 158, 255, 0.12);
        border-left-color: #4a9eff;
      }

      .result-icon {
        font-size: 13px;
        opacity: 0.5;
        font-family: inherit;
        font-weight: 500;
        min-width: 20px;
      }

      .result-item.selected .result-icon {
        opacity: 0.8;
      }

      .result-label {
        flex: 1;
        font-size: 14px;
      }

      .result-shortcut {
        font-size: 11px;
        opacity: 0.4;
        font-family: inherit;
        letter-spacing: 0.05em;
      }

      .result-item.selected .result-shortcut {
        opacity: 0.7;
      }
    `;

    const container = document.createElement('div');
    container.className = 'palette';
    container.innerHTML = `
      <input type="text" class="search-input" placeholder="Search commands..." />
      <div class="results"></div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(container);

    const input = shadow.querySelector('.search-input');
    const results = shadow.querySelector('.results');

    const commands = [
      { id: 'inbox', label: 'Inbox', icon: '▣', action: () => navigate('#inbox') },
      { id: 'starred', label: 'Starred', icon: '★', action: () => navigate('#starred') },
      { id: 'sent', label: 'Sent', icon: '↗', action: () => navigate('#sent') },
      { id: 'drafts', label: 'Drafts', icon: '✎', action: () => navigate('#drafts') },
      { id: 'compose', label: 'Compose', icon: '⊕', action: () => clickCompose() },
      { id: 'focus', label: 'Toggle Focus Mode', icon: '◉', shortcut: '⌘.', action: () => toggleFocusMode() },
      { id: 'stock', label: 'Toggle Stock Gmail', icon: '↻', shortcut: '⌘⇧G', action: () => toggleEnabled() },
    ];

    let selectedIndex = 0;

    function renderResults(filter = '') {
      const filtered = commands.filter(cmd => 
        cmd.label.toLowerCase().includes(filter.toLowerCase())
      );

      results.innerHTML = filtered.map((cmd, index) => `
        <div class="result-item ${index === selectedIndex ? 'selected' : ''}" data-index="${index}">
          <span class="result-icon">${cmd.icon}</span>
          <span class="result-label">${cmd.label}</span>
          ${cmd.shortcut ? `<span class="result-shortcut">${cmd.shortcut}</span>` : ''}
        </div>
      `).join('');

      results.querySelectorAll('.result-item').forEach((item, index) => {
        item.addEventListener('click', () => {
          const cmd = filtered[index];
          cmd.action();
          closePalette();
        });
      });

      return filtered;
    }

    input.addEventListener('input', (e) => {
      selectedIndex = 0;
      renderResults(e.target.value);
    });

    input.addEventListener('keydown', (e) => {
      const filtered = renderResults(input.value);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
        renderResults(input.value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        renderResults(input.value);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          closePalette();
        }
      }
    });

    renderResults();

    paletteHost.addEventListener('click', (e) => {
      if (e.target === paletteHost) {
        closePalette();
      }
    });

    return paletteHost;
  }

  function togglePalette() {
    if (paletteOpen) {
      closePalette();
    } else {
      openPalette();
    }
  }

  function openPalette() {
    if (!isEnabled) return;
    
    const palette = createPalette();
    document.body.appendChild(palette);
    paletteOpen = true;

    setTimeout(() => {
      const shadow = palette.shadowRoot;
      const input = shadow.querySelector('.search-input');
      if (input) {
        input.value = '';
        input.focus();
      }
    }, 0);
  }

  function closePalette() {
    if (paletteHost && paletteHost.parentNode) {
      paletteHost.parentNode.removeChild(paletteHost);
    }
    paletteOpen = false;
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  function clickCompose() {
    const composeButton = document.querySelector('[gh="cm"]') || 
                         Array.from(document.querySelectorAll('div[role="button"]'))
                           .find(btn => btn.textContent.trim().toLowerCase() === 'compose');
    if (composeButton) {
      composeButton.click();
    }
  }

  applyState();

  // Expose for testing
  window._gmdTest = {
    togglePalette,
    toggleFocusMode,
    toggleEnabled
  };
})();
