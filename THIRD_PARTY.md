# Third-party software

## Three.js

ORBIT//04 uses Three.js r185 as its active top-down combat presentation engine.

Three.js is distributed under the MIT License. The pinned offline modules retain their upstream SPDX license headers in `vendor/three.module.min.js` and `vendor/three.core.min.js`.

## Phaser

ORBIT//04 uses Phaser 3.90.0 as its simulation-facing scene, audio and animated-environment host, and rendering compatibility fallback.

Phaser is distributed under the MIT License. The runtime is installed from the `phaser` npm package and copied into `vendor/phaser.min.js` during local installation and packaging so the game can run offline.

## Active game sound libraries — CC0

The supported runtime uses a curated selection from four freely licensed libraries:

- **Sci-Fi Weapon Shots SFX** by Lentikula — 48 kHz / 24-bit stereo weapon and energy recordings — https://lentikula.itch.io/sci-fi-weapon-shots-sfx-freecc0
- **Interface SFX Pack 1** by ObsydianX — interface, confirmation and warning cues — https://obsydianx.itch.io/interface-sfx-pack-1
- **Mechanical Explosion** by Spring Spring — physical destruction impact — https://opengameart.org/content/mechanical-explosion
- **Muffled Distant Explosion** by NenadSimic — low-frequency boss and destruction tail — https://opengameart.org/content/muffled-distant-explosion

All four sources are distributed under Creative Commons Zero 1.0 Universal (CC0-1.0) and permit modification and commercial use. Runtime provenance, file mapping and processing notes are recorded in `assets/audio/professional/LICENSES.md`.

## Kenney — Sci-Fi Sounds (inactive legacy files)

Older builds used selected files from **Sci-Fi Sounds 1.0**, created and distributed by Kenney under Creative Commons Zero. The pack is no longer referenced by the supported runtime, but its original license remains at `assets/audio/premium/kenney-sci-fi-sounds/LICENSE.txt` while the legacy files remain in source history.

Source: https://kenney.nl/assets/sci-fi-sounds

## OpenGameArt music — active soundtrack

The adaptive dark-space synthwave soundtrack uses these Creative Commons Zero 1.0 Universal (CC0-1.0) tracks:

- **Space City** — MintoDog — exploration layer — https://opengameart.org/content/space-city
- **Synth Wave** — Pro Sensory — combat layer — https://opengameart.org/content/synth-wave
- **Cybershaman** — Ruskerdax — boss layer — https://opengameart.org/content/cybershaman

The CC0 dedication permits copying, modification, distribution and commercial use without attribution. These notices are retained for provenance and project auditability.

## Pixabay music — active Time Fracture layer and retained legacy files

**Dystopian Ambient** by leberch is the active Time Fracture layer under the Pixabay Content License. **Dystopian Thriller** by leberch and **Blood Red Sky** by ShadowsAndEchoes remain inactive legacy files.

License summary: https://pixabay.com/service/license-summary/

## Mixkit music — active alternate soundtrack

The adaptive score uses these alternate tracks under the Mixkit Free License:

- **Spirit in the Woods** — Alejandro Magaña (A. M.)
- **Sci-Fi Score** — Arulo
- **Xanthos** — Eugenio Mininni

Source and license: https://mixkit.co/free-stock-music/tag/sci-fi/ and https://mixkit.co/license/
