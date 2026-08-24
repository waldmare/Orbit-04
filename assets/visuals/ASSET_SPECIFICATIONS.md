# Visual asset specifications

This directory contains static PNG files loaded by the active top-down Phaser runtime. Runtime mappings are defined in `game.js`, and sprite selection is handled by `visual-engine.js`.

## Active background files

| File | Dimensions | Runtime role |
|---|---:|---|
| `background-dead-universe-v1.png` | 1672 × 941 | Ash Field and dead-star states |
| `background-alien-veil-v1.png` | 1672 × 941 | Alien occupation, rift, and boss states |

Backgrounds are scaled above the 1440 × 810 render target to allow controlled drift. Important high-contrast content should remain outside the central combat area.

## Active entity files

| File | Dimensions | Runtime role |
|---|---:|---|
| `player-last-ark-v1.png` | 1024 × 1536 | ORBIT//04 last-human ark base sprite |
| `enemy-void-larva-v1.png` | 1024 × 1536 | Void Larva, Hunger Hound, and Grief Bloom behaviors |
| `enemy-ossuary-v1.png` | 1024 × 1536 | Ossuary and Choir Node behaviors |
| `enemy-witness-v1.png` | 1024 × 1536 | Witness behavior |
| `boss-conquest-leviathan-v1.png` | 1024 × 1536 | Conqueror boss |

Entity images use genuine transparent alpha, point upward in source orientation, and contain no rectangular matte. The renderer preserves source aspect ratios. Glow, health bars, threat markers, and telegraphs are drawn by runtime vector layers.

## Inactive alternatives

The following legacy spacecraft alternatives remain in the repository but are not loaded by version 0.81.0:

- `player-interceptor-v3.png`
- `player-interceptor-v2.png`
- `enemy-sniper-v3.png`
- `boss-carrier-v3.png`
- `enemy-scout-v3.png`
- `enemy-charger-v3.png`
- `enemy-tank-v3.png`
- `enemy-gunner-v3.png`
- `enemy-splitter-v3.png`
- `enemy-hunter-v2.png`
- `boss-carrier-v2.png`

Do not reference inactive files in documentation as current gameplay assets.

## Validation

Run the asset audit after adding or replacing a runtime file:

```bat
npm.cmd run test:assets
```

The audit checks file references, PNG signatures, image dimensions, audio containers, and the local Phaser bundle. If a filename changes, update the `ENGINE_ASSETS` mapping in `game.js` and the associated regression checks in the same commit.
