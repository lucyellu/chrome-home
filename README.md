# Chrome Home

A self-contained Manifest V3 new-tab extension inspired by calm focus dashboards.

## Features

- Scenic local backgrounds with daily quote and photo-style credit
- Large clock, personalized greeting, and daily focus
- Search with Google, Bing, DuckDuckGo, or Brave
- Local to-do drawer backed by `chrome.storage.local`
- Editable shortcuts
- Optional weather via Open-Meteo with city search or browser geolocation
- Settings for visibility, units, search provider, name, and background

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select `C:\Users\lucyl\Desktop\hold\projects\chrome_extensions\chrome-home`.

Chrome will ask whether to keep the new-tab override after install. Choose **Keep it** to use Chrome Home on new tabs.

## Files

- `manifest.json` declares Manifest V3 and the `chrome_url_overrides.newtab` page.
- `newtab.html`, `styles.css`, and `newtab.js` contain the dashboard.
- `assets/` contains local wallpapers and extension icons.
