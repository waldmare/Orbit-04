# Changelog

## 0.68.0 — Motion direction and combat animation pass

- replaced frame-by-frame ship snapping with time-based position, heading, and turn smoothing
- added thrust-responsive dual player engines, hostile and allied engine trails, hull light, shield response, and controlled idle motion
- expanded Phase Dash from four static echoes to an eight-step eased afterimage sequence
- added spawn easing, directional hit recoil, elite and boss motion signatures, and readable projectile velocity stretching
- replaced single-frame enemy removal with persistent expanding rings, light blooms, and deterministic debris trails
- animated pickups, exploration signals, orbital weapons, world sites, particles, and damage readouts
- moved glow and rank accents out of nested bitmap overlays to eliminate rectangular WebGL artifacts
- replaced random camera jitter with a damped procedural impact response
- added smoothed directional background parallax and speed-sensitive depth zoom
- made particle drag frame-rate independent and extended automated motion-system coverage
- preserved all ship statistics, enemy balance, spawn timing, weapons, progression, and rewards

## 0.67.0 — Procedural field exploration and verified audio

- identified the reported silent output as a persisted `AUDIO: OFF` profile setting and restored audio for the active local profile
- changed the Settings status from asset-loaded inference to confirmed playback reporting
- added explicit muted-state warnings, playback attempt telemetry, renderer mute detection, and asset load-error logging
- added deterministic space generation beyond the starting view with asteroid, wreck, ion, and void landmarks
- added Repair Relay, Flux Amplifier, Salvage Probe, Unstable Relic, and Null Jammer field signals
- added clear benefit, risk/reward, and hazard color language with directional navigation and distance readouts
- added temporary Flux weapon amplification and Null Jammer movement interference without changing baseline ship or weapon statistics
- added exploration distance, field-signal, and triggered-hazard run telemetry
- expanded smoke and integration coverage for world expansion, beneficial pickups, hazards, navigation, and confirmed audio fallback

## 0.66.0 — Continuous travel and encounter correction

- reduced the Tank selection ceiling from 79% to 14% during the 0:25–0:55 early-run window
- preserved the established post-0:55 composition and all existing hostile statistics, boss timing, weapon balance, and progression
- replaced hard arena-edge clamping with continuous directional travel and a stable camera-safe zone
- preserved the relative positions of enemies, projectiles, pickups, hazards, allies, and combat effects while the world scrolls
- added distant-entity cleanup outside the active encounter radius to prevent long-session accumulation
- repaired licensed sample fallback when Phaser reports a failed or locked playback attempt
- added explicit Phaser and fallback audio-context recovery on pointer and keyboard input
- added an Audio Output Check control with live playback status to Settings
- expanded automated coverage for encounter composition, continuous travel, audio status, and output recovery

## 0.65.0 — Run intelligence and interface profiles

- added an in-run intelligence panel for weapon contribution, modules, synergies, doctrines, protocols, artifacts, and mission conditions
- added live objective, frame, build, hull, and transmission telemetry to the pause screen
- added direct keyboard access to Run Intel with Tab or B and a predictable return-to-pause flow
- added curated Readability, Cinematic, Performance, and Defaults setting profiles
- kept every profile control individually editable and identified custom configurations explicitly
- expanded automated coverage for the new runtime panels and setting profiles
- did not change enemy statistics, weapon balance, spawn timing, or progression

## 0.64.0 — Windows and Steam release hardening

- added a project-owned Windows application icon and deterministic ICO build step
- pinned Electron Forge packaging dependencies instead of resolving moving `latest` versions
- restricted the declared release package to the tested 64-bit Windows target
- added single-instance handling, permission denial, webview blocking, packaged DevTools restrictions, and stricter navigation handling
- added five automated 1920 × 1080 Steam store captures from the real Electron/WebGL runtime
- added a fail-fast packaged-build validator for the executable, ASAR payload, branding, version, Phaser runtime, and SteamPipe inputs
- added Windows SteamPipe templates without credentials or fabricated App/depot IDs
- expanded CI with a Windows package verification artifact
- documented the real Steamworks upload, store, review, and release gates
- did not change enemy statistics, weapon balance, spawn timing, or progression

## 0.63.1 — Runtime reliability and verified capture

- added automatic recovery from the last valid local save when the primary profile is malformed
- made save writes resilient to unavailable browser storage without interrupting gameplay
- added a deterministic Electron/WebGL gameplay capture with renderer, HUD, and scene readiness checks
- replaced nested bitmap glow and rank layers that appeared as black rectangles at runtime
- moved glow, engine, and elite indicators to the dedicated vector effects pass
- selected matte-free player, sniper, and boss assets for the active top-down camera scale
- added a verified 1440 × 810 runtime screenshot to the technical project documentation
- did not change enemy statistics, weapon balance, spawn timing, or progression

## 0.63.0 — Sprite and licensed-audio integration

- added eight role-specific spacecraft sprites with transparent alpha
- gave scout, charger, tank, gunner, splitter, sniper and boss distinct silhouettes
- preserved source aspect ratios instead of forcing every ship into a square
- replaced image-duplicate shadows and hull glows that could render as black rectangles
- replaced active procedural WAV effects with licensed Kenney Sci-Fi Sounds samples
- layered sub-bass impacts under rail, nova, elite, boss and destruction events
- replaced the three procedural music loops with full-length Mixkit tracks
- retained adaptive exploration/combat/boss crossfades and impact ducking
- did not change enemy statistics, weapon balance, spawn timing or progression

## 0.62.0 — Readability and audio controls

- added an independent Phase Dash readiness widget and low-hull danger treatment
- added optional critical/all damage numbers with a pooled retained-text renderer
- added pre-attack telegraphs for ranged hostiles, chargers and bosses
- added pilot hints, reduced-motion mode, pause-screen restart and R-to-retry
- added CINEMA, BALANCED and NIGHT dynamic-range profiles
- expanded the original audio pack to 27 distinct 48 kHz stereo assets
- separated enemy fire, drone, nova, mine, beam, critical, dash, phase-shift, elite and boss-down sounds
- expanded all three synchronized adaptive music layers from 24 to 48 seconds
- added impact-driven music ducking, micro-pitch variation and mix-specific mastering
- extended regression coverage for usability controls, readability systems and audio assets

## 0.61.0 — Top-down runtime restoration

- restored the top-down Phaser runtime as the active implementation
- added PHASE DASH with directional control, invulnerability and a readable cooldown
- added dash echoes, stronger engine plumes, dual energy waves and nearby bullet phasing
- made SIGNAL RUSH pull XP from a wider radius and at much higher speed
- added background lighting drift, panel motion and interface state feedback
- improved HUD hierarchy, XP and boss bars, choice hover feedback and event impact
- kept the complete 0.60 combat, progression, adaptive audio and dynamic-space feature set
- added automated regression coverage for dash behavior and the active top-down renderer

## 0.60.0 — Adaptive audio and background states

- replaced the previous short music loop with three phase-locked 24-second adaptive stems
- added exploration, combat and boss mixes with continuous state-driven crossfades
- regenerated 14 combat and interface effects as layered 48 kHz stereo assets
- added a four-scene background director with deep-space, pulsar, rift and supernova plates
- added animated supernova shockwaves, pulsar beams and gravitational-rift lensing rings
- connected scene changes to run time and boss encounters
- expanded regression checks for the dynamic visual and audio asset pipeline

## 0.50.0 — Retained sprite renderer

- replaced immediate-mode combat drawing with a retained Phaser sprite renderer
- added original high-detail player, hostile and boss spacecraft assets
- added pooled rendering for ships, projectiles, loot, particles and orbital weapons
- added layered hull shadows, engine plumes, reactor glow, elite markers and sprite health bars
- moved beams, arcs and gravity rifts to a dedicated additive effects pass
- added an animated presentation model to the hangar screen
- preserved the previous vector presentation as an automatic renderer fallback
- expanded asset and syntax checks for the new visual engine

## 0.40.0 — Phaser WebGL renderer

- forced the desktop renderer onto Phaser WebGL with automatic Canvas fallback
- added a deep-space background, parallax and ambient engine particles
- rebuilt ship rendering with material shadows, layered hull panels, cockpit cores and animated thrusters
- integrated combat impact with the Phaser camera
- redesigned menu, button and HUD materials around a translucent panel interface
- replaced oscillator-first audio with 15 locally generated 48 kHz stereo WAV assets
- added a sample-based adaptive combat soundtrack and dynamic mix controls
- retained procedural audio only as a missing-asset fallback
- expanded asset and renderer regression tests

## 0.30.0 — Phaser migration

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
