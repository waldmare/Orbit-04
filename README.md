# ORBIT//04

Minimalist retro space survivor for browser and desktop.

## Current build

`0.10.1`

- 12-minute runs with multi-phase bosses
- 7 playable frames with persistent mastery
- 8 weapon systems, evolutions and cross-system synergies
- passive modules, volatile protocols and ultra-rare artifacts
- 5 optional run contracts
- hostile conversion and expandable IFF ally builds
- chain, graze, REDLINE and 4-tier OVERDRIVE systems
- data cache decrypt sequences and rarity-specific feedback
- secret transmissions and run events
- flawless boss rewards
- Research meta-progression, achievements and discovery Codex
- procedural layered music and combat SFX
- keyboard, mouse, gamepad and touch movement
- local save export / import

## Run

Open `index.html` in a modern browser.

No web build step is required.

## Controls

- `WASD` / arrow keys — move
- hold left mouse button — steer toward cursor (default)
- optional mouse `FOLLOW` mode — steer toward cursor without holding a button
- gamepad left stick / D-pad — move
- `P` / `Esc` — pause
- `M` — audio
- `F` — fullscreen

Weapons fire automatically.

## Test

```bash
npm test
```

## Desktop

Desktop packaging uses Electron.

```bash
npm install
npm start
```

Package the application:

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
tests/smoke.js      automated smoke tests
package.json        desktop tooling
forge.config.cjs    Electron Forge config
STEAM_RELEASE.md    release checklist
```

## Monetization

Inactive adapter hooks exist for rewarded/interstitial portal ads. No advertising SDK is bundled.

`SUPPORT_URL` in `game.js` may be set for a support page where permitted by the target platform.

## Save data

Browser progress is stored in `localStorage` under `orbit04-save-v2`.

The Settings screen supports manual save export/import.

## License

Source-visible proprietary project. See `LICENSE.md`.
