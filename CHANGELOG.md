# Changelog

## 0.63.0 — Premium Asset Edition

- added eight role-specific premium spacecraft sprites with transparent alpha
- gave scout, charger, tank, gunner, splitter, sniper and boss distinct silhouettes
- preserved source aspect ratios instead of forcing every ship into a square
- replaced image-duplicate shadows and hull glows that could render as black rectangles
- replaced active procedural WAV effects with licensed Kenney Sci-Fi Sounds samples
- layered sub-bass impacts under rail, nova, elite, boss and destruction events
- replaced the three procedural music loops with full-length Mixkit tracks
- retained adaptive exploration/combat/boss crossfades and impact ducking
- did not change enemy statistics, weapon balance, spawn timing or progression

## 0.62.0 — Studio Edition

- added an independent Phase Dash readiness widget and low-hull danger treatment
- added optional critical/all damage numbers with a pooled retained-text renderer
- added pre-attack telegraphs for ranged hostiles, chargers and bosses
- added pilot hints, reduced-motion mode, pause-screen restart and R-to-retry
- added CINEMA, BALANCED and NIGHT dynamic-range profiles
- expanded the original audio pack to 27 distinct 48 kHz stereo assets
- separated enemy fire, drone, nova, mine, beam, critical, dash, phase-shift, elite and boss-down sounds
- expanded all three synchronized adaptive music layers from 24 to 48 seconds
- added impact-driven music ducking, micro-pitch variation and mix-specific mastering
- extended regression coverage for QoL controls, readability systems and studio audio assets

## 0.61.0 — Luminous Edition

- restored the polished top-down Phaser runtime as the active game direction
- added PHASE DASH with directional control, invulnerability and a readable cooldown
- added dash echoes, stronger engine plumes, dual energy waves and nearby bullet phasing
- made SIGNAL RUSH pull XP from a wider radius and at much higher speed
- added restrained cinematic lighting drift, panel motion and luminous interface feedback
- improved HUD hierarchy, XP and boss bars, choice hover feedback and event impact
- kept the complete 0.60 combat, progression, adaptive audio and dynamic-space feature set
- added automated regression coverage for dash behavior and the active top-down renderer

## 0.60.0 — Resonance Edition

- replaced the previous short music loop with three phase-locked 24-second adaptive stems
- added exploration, combat and boss mixes with continuous state-driven crossfades
- regenerated 14 combat and interface effects as layered 48 kHz stereo assets
- added a four-scene background director with deep-space, pulsar, rift and supernova plates
- added animated supernova shockwaves, pulsar beams and gravitational-rift lensing rings
- connected scene changes to run time and boss encounters
- expanded regression checks for the dynamic visual and audio asset pipeline

## 0.50.0 — Reforged Edition

- replaced immediate-mode combat drawing with a retained Phaser sprite renderer
- added original high-detail player, hostile and boss spacecraft assets
- added pooled rendering for ships, projectiles, loot, particles and orbital weapons
- added layered hull shadows, engine plumes, reactor glow, elite markers and sprite health bars
- moved beams, arcs and gravity rifts to a dedicated additive effects pass
- added an animated presentation model to the hangar screen
- preserved the previous vector presentation as an automatic renderer fallback
- expanded asset and syntax checks for the new visual engine

## 0.40.0 — Vanguard Edition

- forced the desktop renderer onto Phaser WebGL with automatic Canvas fallback
- added a cinematic deep-space background, parallax and ambient engine particles
- rebuilt ship rendering with material shadows, layered hull panels, cockpit cores and animated thrusters
- integrated combat impact with the Phaser camera
- redesigned menu, button and HUD materials around a premium glass interface
- replaced oscillator-first audio with 15 locally generated 48 kHz stereo WAV assets
- added a sample-based adaptive combat soundtrack and dynamic mix controls
- retained procedural audio only as a missing-asset fallback
- expanded asset and renderer regression tests

## 0.30.0 — Engine Edition

- migrated runtime rendering from direct Canvas 2D drawing to Phaser 3.90
- raised internal render output to 1440×810
- replaced pixelated mobile-style presentation with smooth vector ships and hostiles
- added additive glow, engine trails, sector fog and orbital navigation layers
- redesigned HUD and menus for desktop 16:9 presentation
- added HIGH / MEDIUM / LOW FX quality setting
- rebalanced ship outliers, XP curve, boss HP and hostile pressure
- moved first boss to ~3:30 and second boss to ~7:30
- reduced late-game health-sponge behavior
- updated Electron window target to 1440×810
- added local Phaser vendoring for offline desktop / Steam packages
- expanded smoke tests to exercise renderer-facing draw calls

## 0.20.0

- Added four selectable sectors with distinct encounter rules and unlocks.
- Added 28 permanent Operations and claimable progression rewards.
- Added two run-defining Doctrine drafts at levels 10 and 20.
- Added optional post-clear Ascension endless mode with escalating bosses and multipliers.
- Added adaptive Echo Hunter nemesis encounters and PARADOX caches.
- Added post-evolution Overcharge ranks.
- Added Flak Matrix, Photon Blades and Rift Projector weapon systems.
- Expanded the hangar to 10 frames and added a unique intrinsic trait to every frame.
- Added three hidden cross-system synergies for the new weapons.
- Expanded profile statistics, Codex metrics, run summary and HUD telemetry.
- Added new audio cues for doctrines, Operations, nemesis encounters, Paradox rewards and Ascension.
- Added full gamepad menu navigation with spatial focus, A-to-select and B-to-back.
- Preserved keyboard, mouse, gamepad and touch movement.
- Added runtime caps for enemies, projectiles and particles to protect late-run performance.


## 0.10.1

- Added native mouse steering for browser and desktop builds.
- Added HOLD mouse mode: hold left mouse button to steer toward the cursor.
- Added FOLLOW mouse mode for cursor-only movement.
- Added mouse control selector to Settings with OFF fallback.
- Added canvas coordinate scaling for correct mouse steering at any display size.
- Updated control hints and documentation.

## 0.10.0

- Added frame mastery with persistent progression and mastery perks.
- Added five optional run contracts with risk/reward modifiers.
- Added six cross-system weapon synergies.
- Added five ultra-rare run artifacts.
- Added multi-phase boss behavior and flawless boss rewards.
- Added escalating four-tier OVERDRIVE and graze streak milestones.
- Added chain-scaled kill audio, distinct critical feedback and short critical hit-stop.
- Added layered procedural music that reacts to bosses, threat, REDLINE and OVERDRIVE.
- Added cache decryption, evolution ceremonies and rarity-specific audio cues.
- Added secret transmission events.
- Expanded IFF allies with hostile archetypes, ally modules and scuttle behavior.
- Added hidden evolution, synergy and artifact discovery tracking to the Codex.
- Expanded run-end telemetry and next-run progression hooks.
- Added boss phase, contract and graze state to HUD feedback.
- Expanded automated smoke tests for new systems.

## 0.9.0

- Expanded the prototype into a complete progression loop.
- Added 7 frames and 8 weapon systems.
- Added weapon evolutions and volatile protocols.
- Added three boss encounters and additional hostile archetypes.
- Added Research meta-progression.
- Added local achievements, codex and lifetime statistics.
- Added Standard, Hardline and Blackout difficulty modes.
- Added Signal Windows, anomalies, caches, graze, REDLINE and OVERDRIVE.
- Added IFF hostile conversion.
- Added save export/import and expanded display settings.
- Added touch movement and gamepad movement.
- Added desktop Electron packaging scaffold.
