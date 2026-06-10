# X-Token-Extractor

A browser extension that extracts your X/Twitter session cookies (`auth_token`, `ct0`, `twid`) and exports them as `cookies.json` — ready for use with [twikit](https://github.com/d60/twikit).

## How it works

### The Problem

[twikit](https://github.com/d60/twikit) authenticates to X's API by loading a browser cookie jar via `client.load_cookies("cookies.json")`. It needs three specific cookies:

- **`auth_token`** — the primary session token that proves you're logged in
- **`ct0`** — the CSRF token required for every API mutation request
- **`twid`** — your X user ID (e.g. `u%3D1234567890`)

Manually extracting these from browser DevTools is tedious and error-prone. This extension automates it.

### The Architecture

The extension is a vanilla Manifest V3 extension (~140 lines) with no dependencies:

1. **Popup opens** (click the toolbar icon)
2. **Cookie read** — calls `chrome.cookies.get({url, name})` for each of the three cookies, trying both `.twitter.com` and `.x.com` domains
3. **Status display** — each cookie shows a ✓ FOUND or ✗ MISSING badge with a masked value preview
4. **Download** — when all three are present, clicking the button constructs a JSON array matching twikit's expected format, creates a Blob, and triggers a file download via a hidden `<a>` tag

```
            ┌─────────────┐
            │  Popup UI   │
            │  (popup.js) │
            └──────┬──────┘
                   │ chrome.cookies.get()
                   ▼
            ┌─────────────┐
            │  Browser    │
            │  Cookie     │
            │  Store      │
            └──────┬──────┘
                   │ returns { value, domain }
                   ▼
            ┌─────────────┐
            │  Build JSON │
            │  Blob → <a> │
            │  → Download │
            └─────────────┘
                   │
                   ▼
            cookies.json ──→ client.load_cookies("cookies.json")
```

### Security Model

- **Zero network requests** — no `fetch()`, no `XMLHttpRequest`, no analytics, no telemetry
- **All data stays local** — cookies are read into memory, serialized to JSON, and downloaded to the user's machine
- **Minimal permissions** — only `"cookies"` permission for `.twitter.com` and `.x.com`
- **Auditable** — 140 lines of vanilla JS, no minified code, no third-party dependencies

## Installation

### Chrome / Edge / Brave / Opera

1. Clone or download this repo
2. Open `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `X-Token-Extractor` folder

### Firefox

1. Clone or download this repo
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select `manifest.json`

## Usage

```bash
# 1. Clone the repo
git clone https://github.com/your-username/X-Token-Extractor.git
cd X-Token-Extractor

# 2. Load in browser as unpacked extension (see Installation above)

# 3. Log into X.com or Twitter.com in your browser

# 4. Click the extension icon
```

The popup shows three cookie cards:

| Cookie | Status | Meaning |
|---|---|---|
| `auth_token` | ✓ FOUND / ✗ MISSING | Primary session token |
| `ct0` | ✓ FOUND / ✗ MISSING | CSRF token |
| `twid` | ✓ FOUND / ✗ MISSING | User ID |

When all three show **FOUND** (green badge), click **Download cookies.json**.

### Using the exported file with twikit

```python
from twikit import Client

client = Client('en-US')
client.load_cookies('cookies.json')

# You're now authenticated — use the API
# tweets = client.get_tweet_by_id('...')
```

## Project Structure

```
X-Token-Extractor/
├── manifest.json              # Extension manifest (MV3)
├── popup.html                 # Popup UI (dark theme)
├── popup.js                   # Cookie extraction + download logic
├── styles.css                 # Dark theme styles
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md                  # This file
└── AMO_SUBMISSION_NOTES.md    # Firefox store submission guide
```

## Development

No build step. Edit any file and reload the extension in the browser.

```bash
# All source files you'll likely edit:
├── popup.js         # Core logic (~140 lines)
├── popup.html       # Layout
└── styles.css       # Styling
```

## License

MIT
