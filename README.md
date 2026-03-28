# Screen Portal

Capture any region of your screen and relay it live into a Chrome tab, so you can share just that area in Google Meet.

## The problem

Google Meet lets you share your entire screen, an application window, or a Chrome tab — but not an arbitrary region. If you want to show a single panel inside an IDE, a design preview in Figma, or a Slack conversation without revealing all your channels, you're stuck sharing far more than you intended.

Screen Portal fixes this. It uses the browser's [Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API) to capture your screen, lets you draw a selection rectangle over the area you care about, and renders just that cropped region — live, at native resolution — into a Chrome tab you can share.

## How it works

1. **Capture** — click "Start Screen Capture" and pick your screen or a window
2. **Select** — draw and adjust a rectangle over the region you want to share
3. **Portal** — the tab now shows only your selected region, updating every frame

Share the tab in Google Meet (or Zoom, Teams, etc.) and your audience sees exactly what you want them to see — nothing more.

## Usage

### Chrome Extension (recommended)

You can load the extension directly:

1. Clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `extension/` folder
5. Click the Screen Portal icon in your toolbar

### Standalone HTML

Open `index.html` in Chrome. No server, build step, or dependencies required.

## Project structure

```
index.html              # Standalone single-file demo
extension/
  manifest.json         # Chrome extension manifest (Manifest V3)
  background.js         # Opens portal tab on icon click
  portal.html           # Portal UI
  portal.js             # Capture, selection, and rendering logic
  icons/                # Extension toolbar icons
```

## Read more

For a deeper look at how it works under the hood — the `getDisplayMedia` flow, coordinate mapping, and the `display: none` gotcha that turns your live portal into a frozen screenshot — see the full writeup: [Screen Portal: sharing a partial screen region in Google Meet](https://www.conroyp.com/articles/screen-portal-share-partial-screen-region-google-meet).

## License

MIT
