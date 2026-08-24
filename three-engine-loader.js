'use strict';

// Start loading the active Three.js presentation layer before the simulation boots.
// The Phaser renderer remains available only as a compatibility fallback.
globalThis.OrbitThreeEngineReady=import('./three-visual-engine.mjs');
