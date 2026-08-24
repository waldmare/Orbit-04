# Third-party software

## Three.js

ORBIT//04 uses Three.js r185 as its active top-down combat presentation engine.

Three.js is distributed under the MIT License. The pinned offline modules retain their upstream SPDX license headers in `vendor/three.module.min.js` and `vendor/three.core.min.js`.

## Phaser

ORBIT//04 uses Phaser 3.90.0 as its simulation-facing scene, audio and animated-environment host, and rendering compatibility fallback.

Phaser is distributed under the MIT License. The runtime is installed from the `phaser` npm package and copied into `vendor/phaser.min.js` during local installation and packaging so the game can run offline.

## Kenney — Sci-Fi Sounds

The active gameplay sound effects use selected files from **Sci-Fi Sounds 1.0**, created and distributed by Kenney. The pack is licensed under Creative Commons Zero (CC0) and can be used in commercial projects. The original license is included at `assets/audio/premium/kenney-sci-fi-sounds/LICENSE.txt`.

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
