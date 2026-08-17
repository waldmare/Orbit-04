# ORBIT//04 — Steam build notes

## Local prerequisites

- Node.js LTS
- npm
- Windows for final Windows package validation

## Install

```bash
npm install
```

This installs Phaser and creates a local `vendor/phaser.min.js`, so the desktop build does not depend on a CDN.

## Test desktop runtime

```bash
npm start
```

## Package

```bash
npm run package
```

Output is written to `out/`.

## Pre-Steam checklist

- complete multiple fresh-save 12-minute runs;
- test all 10 frames;
- verify mouse, keyboard and controller input;
- validate fullscreen / window resize behavior;
- test audio mute and settings persistence;
- test save export / import;
- test offline launch;
- validate late-game FPS and entity caps;
- add final application icon and Steam capsule art;
- add Steamworks App ID / achievements only after the local build is stable.
