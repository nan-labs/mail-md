# Mail.md

A focused, Markdown-editor-style visual reskin for Gmail. **CSS-only cosmetic changes** – your emails remain unchanged.

> Modern successor to [Gmail Better Plain Text](https://dribbble.com/shots/1551102-Gmail-Better-Plain-Text-install) (2014)

## Principles

1. **The text is the interface.** Everything else is hidden until summoned.
2. **One column, one typeface family.** iA Writer–style typography, ~70ch measure, generous leading.
3. **Keyboard first.** ⌘K reaches anything we hid.
4. **Opinionated, reversible.** One toggle returns stock Gmail instantly.
5. **Look, don't touch.** Purely visual. What you send and receive is exactly what stock Gmail would send and receive.

## What It Does

### Hidden by Default
- Left navigation sidebar
- Right add-ons panel (Calendar, Keep, Tasks)
- Chat/Meet rail
- Promo/upsell banners
- Category tabs (Primary, Social, Promotions)
- Avatars in inbox list
- Label chips
- Most toolbar icons (still accessible via hover or palette)

### Visual Changes
- **Inbox**: Typographic list with sender · subject · date on one line
- **Reading**: Centered ~70ch column, monospace font, quoted text dimmed
- **Compose**: Full-screen centered "writing room" with minimal chrome
- **Typography**: iA Writer Duo (bundled) with 18px, 1.6 line-height
- **Themes**: Light and dark modes

### Features
- **⌘K Command Palette**: Navigate to Inbox, Starred, Sent, Drafts, labels, or Compose without leaving keyboard
- **Focus Mode (⌘.)**: Hides even more UI for distraction-free reading/writing
- **Kill Switch (⌘⇧G)**: Instantly restore stock Gmail
- **Esc**: Exit focus mode or close palette

## Installation (Development)

### Chrome (Unpacked Extension)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/mail-md.git
   cd mail-md
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top-right)

4. Click **Load unpacked** and select the repository folder

5. Visit [mail.google.com](https://mail.google.com) – Mail.md should be active

6. Click the extension icon to adjust settings (theme, focus by default)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` or `Ctrl+K` | Open Command Palette |
| `⌘.` or `Ctrl+.` | Toggle Focus Mode |
| `⌘⇧G` or `Ctrl+Shift+G` | Kill Switch (stock Gmail) |
| `Esc` | Exit focus mode / close palette |

Gmail's native shortcuts (`c`, `j/k`, `e`, `r`, etc.) remain unchanged.

## Project Structure

```
mail-md/
├── manifest.json          # Chrome extension manifest (MV3)
├── content.js             # Minimal JS: class toggles, palette, shortcuts
├── gmailmd.css            # Main visual skin (CSS-only)
├── popup.html/css/js      # Extension settings popup
├── fonts/                 # iA Writer Duo (OFL licensed)
│   ├── iAWriterDuoS-Regular.woff2
│   ├── iAWriterDuoS-Bold.woff2
│   └── iAWriterDuoS-Italic.woff2
├── icons/                 # Extension icons
├── LICENSE-fonts.txt      # iA Writer font license (OFL)
├── tests/
│   ├── fixture/           # Gmail-like test fixture
│   └── screenshots.spec.js # Playwright screenshot tests
└── docs/
    └── screenshots/       # Generated test screenshots
```

## Development & Testing

### Run Screenshot Tests

```bash
npm install
npm test
```

Screenshots will be saved to `docs/screenshots/`:
- `01-stock.png` – Baseline (no extension)
- `02-inbox-light.png` – Inbox with Mail.md
- `03-reading.png` – Thread view
- `04-compose.png` – Compose view
- `05-palette.png` – Command palette open
- `06-focus.png` – Focus mode
- `07-dark.png` – Dark theme
- `08-killswitch.png` – Kill switch activated

### Known Limitations (v0)

⚠️ **These tests use a static Gmail-like fixture, not real Gmail.** Real Gmail verification is pending manual testing with an actual Gmail account.

The fixture mimics Gmail's DOM structure and ARIA roles, but Gmail's obfuscated classes and dynamic behavior may differ.

## Known Fragile Selectors

Mail.md anchors styles on **stable hooks** (ARIA roles, `contenteditable`, `data-*` attributes) wherever possible. However, some Gmail UI requires obfuscated class selectors that may break when Gmail updates.

### ⚠️ Update These When Gmail Changes

Located in `gmailmd.css`:

1. **Chat/Meet Rail**
   ```css
   html.gmd-on .bkK > .nH.aJl { display: none !important; }
   ```
   - Hides Chat/Meet sidebar on far right
   - Gmail classes: `.bkK`, `.nH`, `.aJl`

2. **Promo Banners**
   ```css
   html.gmd-on .vh { display: none !important; }
   ```
   - Hides top promotional banners
   - Gmail class: `.vh`

If Mail.md stops working after a Gmail update, check these selectors first. Use DevTools to inspect the new class names and update `gmailmd.css`.

### Why Not More Stable Selectors?

Gmail doesn't provide ARIA landmarks or stable attributes for all UI elements (especially chat, banners, and some toolbars). We minimize fragile selectors to a small, isolated set that's easy to update.

## Technical Details

### CSS-Only Approach

Mail.md is **purely visual**. It does NOT:
- Modify email content or formatting
- Convert Markdown to HTML
- Force plain-text mode
- Rewrite sent messages
- Touch Gmail's send/save functionality

JavaScript is limited to:
- Toggling classes on `<html>` (`gmd-on`, `gmd-focus`, `data-gmd-theme`)
- Tagging Gmail regions with `data-gmd` attributes via MutationObserver
- Implementing the command palette (shadow DOM, no Gmail CSS interference)
- Handling keyboard shortcuts (Cmd+K, Cmd+., Cmd+Shift+G, Esc)

### Permissions

- **`storage`**: Save extension settings (enabled, theme, focus preference)
- **Content script on `mail.google.com` only**: No other sites

No remote code, no external API calls, no Gmail API usage.

### Fonts

- **iA Writer Duo**: Bundled locally from [iA-Fonts](https://github.com/iaolo/iA-Fonts) (OFL license)
- Fallback: SF Mono, Monaco, Menlo, Consolas, system monospace

## Roadmap (Beyond v0)

- [ ] Optional "Plain Reading Mode" to visually flatten newsletter HTML
- [ ] More keyboard shortcuts (navigate threads, archive, star)
- [ ] Customizable accent color
- [ ] User-configurable font size and column width
- [ ] Publish to Chrome Web Store
- [ ] Consider Stylus userstyle version

## Contributing

This is an early v0 spike. Contributions welcome, especially:
- Reporting broken selectors after Gmail updates
- Improved fixture tests
- Real Gmail verification screenshots
- Better icon design

## License

MIT License – see LICENSE file

Fonts: iA Writer Duo (OFL) – see LICENSE-fonts.txt

---

**Note**: Mail.md is a personal project and is not affiliated with Google or iA Writer.
