# Offline rendering runtimes

`phaser.min.js` is generated locally by `npm install` from the pinned `phaser@3.90.0` package.

The browser source falls back to the official cdnjs copy when the local runtime is absent. Desktop / Steam packaging runs the vendor step first so the game does not require network access.

`three.module.min.js` and `three.core.min.js` are pinned Three.js r185 ES modules used by the active combat presentation layer. Both files retain the upstream Three.js Authors copyright and MIT SPDX license header.
