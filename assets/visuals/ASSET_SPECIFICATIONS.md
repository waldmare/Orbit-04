# Visual asset specifications

This directory contains static PNG files loaded by the active top-down Phaser runtime. Runtime mappings are defined in `game.js`, and sprite selection is handled by `visual-engine.js`.

## Active background files

| File | Dimensions | Runtime role |
|---|---:|---|
| `deep-space-arena-v1.png` | 1672 × 941 | Default background |
| `space-pulsar-v1.png` | 1672 × 941 | Pulsar state |
| `space-rift-v1.png` | 1672 × 941 | Gravitational-rift state |
| `space-supernova-v1.png` | 1672 × 941 | Supernova and boss state |

Backgrounds are scaled above the 1440 × 810 render target to allow controlled drift. Important high-contrast content should remain outside the central combat area.

## Active ship files

| File | Dimensions | Runtime role |
|---|---:|---|
| `player-interceptor-v2.png` | 1254 × 1254 | Player frame base sprite |
| `enemy-scout-v3.png` | 1201 × 1310 | Scout |
| `enemy-charger-v3.png` | 1161 × 1355 | Charger |
| `enemy-tank-v3.png` | 1159 × 1358 | Armored node |
| `enemy-gunner-v3.png` | 1214 × 1295 | Gunner |
| `enemy-splitter-v3.png` | 1238 × 1271 | Splitter |
| `enemy-hunter-v2.png` | 1254 × 1254 | Lancer |
| `boss-carrier-v2.png` | 1254 × 1254 | Boss |

Ship images must use a transparent background, point upward in source orientation, and contain no rectangular matte. The renderer preserves source aspect ratios. Glow, engine trails, health bars, and elite markers are drawn by runtime vector layers.

## Inactive alternatives

The following high-resolution alternatives remain in the repository but are not loaded by version 0.63.1 because their baked dark matte is visible at gameplay scale:

- `player-interceptor-v3.png`
- `enemy-sniper-v3.png`
- `boss-carrier-v3.png`

Do not reference inactive files in documentation as current gameplay assets.

## Validation

Run the asset audit after adding or replacing a runtime file:

```bat
npm.cmd run test:assets
```

The audit checks file references, PNG signatures, image dimensions, audio containers, and the local Phaser bundle. If a filename changes, update the `ENGINE_ASSETS` mapping in `game.js` and the associated regression checks in the same commit.
