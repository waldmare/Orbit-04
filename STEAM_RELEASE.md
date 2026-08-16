# Steam release checklist

This repository contains the game and a desktop packaging scaffold. Steam publication still requires a Steamworks partner account, an app credit, store setup, a packaged build and Valve review.

## 1. Test the browser build first

Open `index.html` and complete full runs on:

- Standard
- Hardline
- Blackout after unlock

Test fresh save, save export/import, all frames, all weapons and pause/settings.

## 2. Create the Windows desktop build

Install current Node.js LTS, then in the repository folder run:

```bash
npm install
npm run package
```

Electron Forge writes the packaged application to `out/`.

Run the generated executable on a clean Windows machine before uploading it anywhere.

## 3. Steamworks onboarding

Create the Steamworks partner account and purchase one Steam Direct app credit for the game.

Do not add Steam-specific code until an App ID exists.

## 4. Steamworks integration

Before release, decide whether to connect these local systems to Steamworks:

- achievements
- statistics
- cloud saves
- leaderboards

The game currently exposes local achievement/stat hooks in `game.js` through the `PLATFORM` adapter. They intentionally do nothing until a Steam integration is added.

## 5. Upload

Use SteamPipe to upload the packaged game files to the application's depot, configure the Windows launch option to the packaged executable, set a private testing branch, and test through the Steam client.

## 6. Store release

Prepare final store assets, description, pricing, supported languages and required questionnaires. Complete Valve's store-page and build review before selecting the release date.

## Release gate

Do not call the build final until all of the following are verified:

- no JavaScript console errors
- no progression dead ends
- all achievements trigger once
- no save corruption after update
- stable frame rate under late-run enemy density
- gamepad behavior documented accurately
- clean Windows packaged build
- Steam branch install / uninstall / update test passed
