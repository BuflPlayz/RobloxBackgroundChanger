# Roblox Background Changer

A Chrome extension that lets you set a custom background image on roblox.com, with a frosted-glass dark overlay on the home container so labels and game cards stay readable.

## Features

- Pick any local image as the Roblox background
- Adjustable **background blur** (0–30px) — blurs the image behind the home container
- Adjustable **darkness** (0–90%) — semi-transparent dark tint over the home container
- Adjustable **container padding** (0–60px)
- Adjustable **corner radius** (0–50px)
- Settings persist via `chrome.storage.local`
- Works across Roblox SPA navigations (uses a `MutationObserver` to re-apply)

## Install (developer mode)

1. Clone this repo.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this folder.
5. Open [roblox.com](https://www.roblox.com/home) and click the extension icon to configure.

## Files

- `manifest.json` — extension manifest (MV3)
- `content.js` — injects styles into roblox.com
- `popup.html` / `popup.js` — settings UI
