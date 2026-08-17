# Phaser runtime

`phaser.min.js` is generated locally by `npm install` from the pinned `phaser@3.90.0` package.

The browser source falls back to the official cdnjs copy when the local runtime is absent. Desktop / Steam packaging runs the vendor step first so the game does not require network access.
