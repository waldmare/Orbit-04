# ORBIT//04

Minimalist retro space survivor for browser and desktop.

## Current build

`0.9.0`

- 12-minute runs with 3 boss signatures
- 7 playable frames
- 8 weapon systems and 8 evolutions
- 10 in-run passive modules
- 5 volatile risk/reward protocols
- 6 hostile archetypes, elites and boss patterns
- XP, level choices, rerolls and skips
- Signal Window events, anomalies and data caches
- chain / graze / REDLINE / OVERDRIVE systems
- IFF corruption: hostile-to-ally conversion
- permanent Research progression
- local achievements, codex and lifetime statistics
- 3 difficulty modes
- procedural music and sound effects
- keyboard, gamepad movement and touch movement
- configurable HP bars, XP readout, particles, flash and screen shake
- local save export / import

## Run

Open `index.html` in a modern browser.

No web build step is required.

## Controls

- `WASD` / arrow keys — move
- gamepad left stick / D-pad — move
- `P` / `Esc` — pause
- `M` — audio
- `F` — fullscreen

Weapons fire automatically.

## Desktop

Desktop packaging uses Electron.

```bash
npm install
npm start
```

Create a packaged application:

```bash
npm run package
```

Output is written to `out/`.

## Repository layout

```text
index.html          UI shell
styles.css          interface styles
game.js             game logic and content
desktop/main.cjs    desktop entry point
package.json        desktop tooling
forge.config.cjs    Electron Forge config
STEAM_RELEASE.md    release checklist
```

## Monetization

The game contains inactive adapter hooks for rewarded/interstitial portal ads. No advertising SDK is bundled.

`SUPPORT_URL` in `game.js` may be set for a web support page. Keep it empty for store builds unless the target platform permits external support links.

## Save data

Browser progress is stored in `localStorage` under `orbit04-save-v2`.

The Settings screen supports manual save export/import.

## License

Source-visible proprietary project. See `LICENSE.md`.
