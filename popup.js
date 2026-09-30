/**
 * Mail.md popup script
 * Manages extension settings
 */

// Load saved settings
chrome.storage.sync.get({
  enabled: true,
  theme: 'light',
  focusByDefault: false
}, (items) => {
  document.getElementById('enabled').checked = items.enabled;
  document.getElementById('theme').value = items.theme;
  document.getElementById('focusByDefault').checked = items.focusByDefault;
});

// Save on change
document.getElementById('enabled').addEventListener('change', (e) => {
  chrome.storage.sync.set({ enabled: e.target.checked });
});

document.getElementById('theme').addEventListener('change', (e) => {
  chrome.storage.sync.set({ theme: e.target.value });
});

document.getElementById('focusByDefault').addEventListener('change', (e) => {
  chrome.storage.sync.set({ focusByDefault: e.target.checked });
});
