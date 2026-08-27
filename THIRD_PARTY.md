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

## Pixabay music — active soundtrack

The adaptive dark-ambient soundtrack uses these files under the Pixabay Content License:

- **Dystopian Ambient** — leberch — exploration / last-human state — https://pixabay.com/music/ambient-dystopian-ambient-520165/
- **Dystopian Thriller** — leberch — high-threat combat state — https://pixabay.com/music/ambient-dystopian-thriller-520374/
- **Blood Red Sky — Dark Ambient Crime Thriller and Horror Music** — ShadowsAndEchoes — boss / Conqueror state — https://pixabay.com/music/horror-scene-blood-red-sky-dark-ambient-crime-thriller-and-horror-music-152335/

License summary: https://pixabay.com/service/license-summary/

The license permits free use, adaptation, and commercial use subject to its prohibited-use and standalone-distribution restrictions. The downloaded tracks ship only as integrated game soundtrack assets.

## Mixkit music — inactive legacy files

Older builds used these tracks under the Mixkit Free License. The files may remain in source history but are not referenced by version 0.80.0:

- **Spirit in the Woods** — Alejandro Magaña (A. M.)
- **Sci-Fi Score** — Arulo
- **Xanthos** — Eugenio Mininni

Source and license: https://mixkit.co/free-stock-music/tag/sci-fi/ and https://mixkit.co/license/
