# Changelog

## 0.89.0 — Encounter and Presentation Director

- replaced the 700-hostile runtime ceiling with a progression-aware encounter budget that scales by difficulty, sector, contract, boss state, and ascension
- added population-pressure braking before the active cap, reduced burst-packet size, and reserved space for readable elite and boss encounters
- added audio-group budgets, cue priorities, short focus windows, crowd-aware attenuation, and narrower pitch variance so routine fire cannot bury impacts or rewards
- expanded the Three.js presentation pipeline with contact shadows, hostile rim lighting, stronger player grounding, and quality-scaled depth layers
- preserved weapon damage, hostile health, boss timing, upgrade probabilities, input behavior, and save compatibility

- replaced quote-based field pickups with rare Time Fractures that slow the full simulation, animated environment, and music while retaining full player movement speed
- added a dedicated Time Fracture music layer, slowed playback rates, a countdown HUD, kill-extension milestones, and persistent recovery statistics
- expanded the adaptive score from three to seven full-length licensed tracks with alternating exploration, combat, and boss arrangements
- fixed piercing projectiles so one overlap cannot consume multiple penetration charges on the same target
- reduced hostile inflow and disabled elite additions during the 20-second boss approach window
- added three distinct hostile behaviors: flanking Veil Stalkers, paired-shot Needle Weavers, and protective Pale Wardens
- expanded the environment director to six states and cooled the launch palette to remove the yellow cast while preserving the neon-decay theme
- corrected the shared Three.js sprite rotation transform so projectile bodies, dark silhouettes, and trails align with their actual velocity in every firing direction
- added earned Ark Reliquaries to boss encounters, with distinct world silhouettes and staged one-, three-, or five-reward recovery sequences
- guaranteed a three-reward first Reliquary, added dry-streak protection, keyboard/gamepad and instant-reveal controls, and persistent recovery statistics
- replaced the generated combat and reward cues with a curated commercial-safe CC0 library from Lentikula, ObsydianX, Spring Spring and NenadSimic
- assigned distinct full-length weapon, hostile, phase, destruction, interface and reward recordings, then retuned voice levels and cooldowns for the mastered source material
- added third-party provenance, source URLs, per-file processing notes and runtime checks for every active external sound
- replaced the active short prototype SFX mapping with a dedicated 48 kHz stereo combat set, including unique flak, rift, heavy-alien-fire, system-install, artifact, streak, graze, sub and engine cues
- routed Phaser's loaded samples and adaptive music through the real dynamic-range compressor, added world-position stereo placement and distance control, and preserved the procedural path only as failure recovery
- separated weapon, kill, reward and progression identities so routine events no longer reuse the same mobile-style UI samples
- shortened level-up and doctrine cards to one mechanical effect plus one compact build link, while retaining full details in native tooltips and accessibility labels
- lifted environmental midtones, star visibility, ash-field separation, and navigation guides while reducing the stacked dark filter and outer vignette
- rebuilt the launch hangar around three primary decisions, one deployment action, compact frame comparisons, and an optional collapsed progression summary
- replaced text-heavy configuration cards with labeled semantic SVG icons, persistent accessible descriptions, and native hover tooltips
- introduced a neon-noir interface palette using cyan, magenta, acid green, violet, and amber as functional signals over damaged near-black surfaces
- extended the same color language to the combat HUD, XP and rush meters, reward feedback, and upgrade cards without brightening the ashen playfield
- refreshed both verified Electron screenshots so repository presentation reflects the current runtime rather than concept artwork
- added desktop audio autoplay handling plus explicit Phaser mixer unmute, unlock, and suspended-context recovery
- added a movement-reactive low engine layer, alternate weapon samples, stronger default output, and a layered output check
- separated the ashen environment grade from the combat grade so hostile silhouettes, friendly fire, pickups, and the ark retain clear color identities
- added dark silhouette backplates to hostile organisms and friendly projectiles for crowd readability without changing hitboxes or balance
- replaced the fixed 1440 × 810 Three.js buffer with display-size- and DPI-aware rendering, capped per graphics-quality profile
- enabled hardware-aware anisotropic sampling while retaining stable mipmaps for rotating high-resolution ship textures
- corrected player banking so it changes the apparent hull profile without rotating the vessel away from its travel direction
- changed hostile and allied facing to follow measured travel instead of continuously pointing at an attack target
- increased the combat-scale silhouettes and retuned engine trails for clearer motion reads without changing collision sizes or balance
- replaced the overly rigid fixed player heading with damped limited-angle steering, visible banking, inertia, acceleration response, and independently loaded engine plumes
- strengthened combat color separation for the ark, hostile bodies, projectiles, and all eight pickup classes while preserving the ashen environment grade
- added restrained role colors, semantic intent glyphs, and priority-scaled threat rings for non-scout enemies
- added dark separation rings to hostile projectiles and clearer health bars for bosses, elites, Echo Hunters, and bounty targets
- added visible attitude thrusters and an animated life-support core to the player vessel
- added class-specific hostile sway, velocity stretch, firing recoil, and short organic motion wakes without changing simulation speed or combat balance
- replaced generic square pickups with eight semantic glyphs covering experience, caches, support signals, archives, relics, and hazards
- expanded the real Electron smoke test with render-buffer and directional-heading assertions

## 0.88.1 — Three.js Motion Parity

- restored frame-rate-independent interpolation for the player, hostile organisms, and allied vessels
- added direction-aware rotation, turn banking, movement anticipation, idle motion, organic breathing, charge deformation, and spawn easing
- added layered player and allied thrust trails with velocity, dash, and reduced-motion scaling
- anchored hostile glows and health bars to interpolated render positions instead of raw simulation coordinates
- expanded the real Electron smoke test to measure player simulation travel, rendered player travel, hostile simulation travel, and rendered hostile travel
- preserved movement speed, controls, enemy behavior, weapon output, progression, and save compatibility

## 0.88.0 — Three.js Combat Presentation

- moved the active player, enemy, projectile, pickup, signal, health-bar, and combat-effect presentation to a pooled Three.js r185 WebGL layer
- retained the top-down camera, established simulation, audio, save data, animated environment, and Phaser compatibility fallback
- added transparent high-resolution muzzle-flash and projectile plates with per-weapon proportions, additive materials, hostile firing flashes, and directional recoil
- added ACES filmic tone mapping, sRGB texture handling, orthographic projection, reduced-motion handling, quality-aware exposure, and deterministic camera response
- removed the remaining Polish player-facing strings from the supported runtime and translated the inactive third-person prototype for repository consistency
- expanded renderer, asset-alpha, English-copy, offline-bundle, and runtime-capture regression coverage
- preserved weapon statistics, enemy pressure, progression probabilities, rewards, input behavior, and save compatibility

## 0.87.0 — Studio Interface and Cinematic Pipeline

- replaced ambiguous click-to-cycle deployment values with explicit previous, current, and next controls for difficulty, sector, and contract
- added a concise deployment summary and a frame-specific launch action so the final selection is visible before a run begins
- established one studio-style component language across launch, level-up, settings, pause, research, operations, achievements, Codex, and results screens
- increased interface depth, focus visibility, typography hierarchy, selection feedback, and minimum control sizes without adding menu density
- reorganized settings into a wider two-column control surface with a live renderer and pipeline status indicator
- enabled WebGL antialiasing options, a smoother high-refresh timing profile, and a quality-aware cinematic presentation path with Canvas fallback
- added restrained object-level life-core bloom plus quality-aware vignette and color grading instead of expensive full-scene bloom
- preserved combat balance, progression values, encounter composition, reward rates, and save compatibility

## 0.86.0 — Focused Launch Hangar

- replaced the dense full-detail frame grid with one large selected-frame presentation and a compact visual frame bay
- added authentic vector previews for all ten playable configurations using their runtime silhouettes and individual hull palettes
- reduced comparison noise to hull, speed, output, starting system, and one concrete frame trait
- reorganized difficulty, sector, contract, profile progress, and launch actions to fit without horizontal scrolling at the target resolution
- introduced restrained rotten olive, oxidized metal, old gold, dried blood, and ashen-blue accents while preserving the depressive dark-space direction
- removed all real-author names and literary-work references from Archive records
- reframed all eighteen Archive entries as original, fictional ORBIT//04 crew records with no external quotation or attribution
- migrated legacy archive discovery IDs to neutral record keys so existing save files retain every recovered entry

## 0.85.0 — Field Directives

- added one deterministic secondary directive per run instead of a stack of simultaneous checklist objectives
- added three directive routes: secure three field signals, travel 6.0 km, or destroy 150 hostile organisms
- rewards use existing systems only: a reroll and salvage, a skip and salvage, or a standard Data Cache
- added a compact directive tracker plus progress in Pause, Run Intel, run results, lifetime statistics, and automated tests
- added the Field Officer achievement for completing five directives
- preserved enemy pressure, procedural signal frequency, weapon balance, XP pacing, and the primary boss timeline

## 0.84.0 — Navigation control and run safety

- added an in-run signal scanner with All, Support, Archive, and Risk filters, cycled with `N`
- added a timestamped six-entry install log to Run Intel for weapons, modules, doctrines, protocols, artifacts, repairs, and salvage conversions
- added the current scanner filter and latest installation to the pause summary
- made the existing focus-loss pause behavior configurable while keeping its safe default enabled
- expanded automated coverage for filtered procedural navigation, installation history, and focus-loss behavior
- preserved combat balance, procedural generation rates, rewards, and upgrade probabilities

## 0.83.0 — Tactical control and upgrade planning

- added Nearest, Low Hull, and Elites First automatic targeting priorities without changing the default targeting behavior
- added one-card pinning so a preferred level-up choice can survive a reroll while the other cards refresh
- added a compact in-combat tracker for the nearest weapon evolution once the build approaches its requirements
- exposed the selected targeting priority in Run Intel and included the new option in curated settings profiles
- expanded automated coverage for target selection, pinned rerolls, evolution guidance, and the new interface controls
- preserved enemy statistics, weapon output, upgrade weights, spawn timing, and run economy

## 0.82.0 — Progression cadence and navigation QoL

- versioned the verified runtime screenshot so repository front pages cannot retain the previous build through image caching
- added a compact off-screen priority compass for bosses, Echo Hunters, and timed signal targets
- added a restrained imminent-level state that reports the exact XP remaining and gently increases pickup convergence near a level breakpoint
- added a boss-clear Salvage Sweep that pulls earned XP across the arena without changing reward amounts
- prevented rerolls from returning an identical three-card selection when alternatives are available
- fixed large XP gains so every pending level is presented in sequence instead of waiting for another pickup
- kept combat statistics, XP values, drop quantities, upgrade weights, and enemy pressure unchanged

## 0.81.0 — Last Ark interaction and feedback polish

- replaced the legacy player interceptor with a dedicated, transparent last-human ark sprite using battered graphite metal, bone-white repair panels, and a warm life-support core
- preserved the ark's source aspect ratio and added a restrained breathing core, asymmetric engines, improved dash silhouettes, hit response, and installation pulse
- removed spacecraft-style engine plumes from alien creatures and added per-species organic breathing, undulation, hover, spawn unfolding, and boss-scale body motion
- added a compact Build Compass showing the nearest evolution breakpoint and current system/link count
- redesigned level-up cards around immediate effect, affected scope, and one closest evolution or synergy path
- added explicit synergy recipes for projected upgrade-path feedback while keeping full build detail in Run Intel
- replaced routine alien destruction samples with lower-pitched organic material sounds, added layered boss-body collapse, softened repetitive voices, and slowed adaptive dark-ambient crossfades
- added a separate installation sound and reserved large reward feedback for breakpoints, evolutions, links, artifacts, and bosses
- preserved combat balance, upgrade probabilities, weapon output, enemy statistics, and run economy

## 0.80.0 — Ashen Requiem art-direction rework

- reframed ORBIT//04 as the final human-crewed ark in an alien-conquered universe
- replaced the active enemy spacecraft and boss art with transparent organic alien creatures
- replaced the colorful space plates with two ashen, low-saturation environment backgrounds and restrained celestial animation
- renamed all ship configurations, weapons, evolutions, passive modules, sectors, world signals, enemy classes, and bosses around the last-human premise
- replaced the active soundtrack with three licensed dark-ambient tracks and preserved adaptive exploration, combat, and boss crossfades
- expanded the persistent fictional crew archive from 9 to 18 original in-world records
- kept archive records separate from real authors and published works
- reserved red for danger cues while moving navigation, progression, and interface effects into a graphite, ash, bone, and tarnished-silver palette
- preserved enemy health, movement, damage, spawn composition, weapon output, progression, and reward balance

## 0.70.0 — Readability, reward feedback, and mix hierarchy

- replaced the short Archive Fragment popup with a full Archive Reader that pauses combat and remains open until the player dismisses it
- deferred archive data rewards until the reader closes so level-up screens cannot overlap the recovered text
- added keyboard, mouse, and gamepad dismissal plus permanent Codex recovery progress
- reorganized combat HUD values into labeled metrics and shortened the live weapon summary to prevent overflow
- moved transient notifications away from the exploration navigator and added a dedicated reward ribbon for chains, Signal Rush, Overdrive, signal captures, and boss defeats
- added an Effect Clarity control with stronger hostile projectile cores, dark separation outlines, priority telegraphs, a player focus ring, and reduced non-critical particle density
- added audio voice limits for repeated weapon, pickup, kill, graze, and hostile-shot samples
- rebalanced per-cue levels and added immediate music ducking around archives, rewards, hits, evolutions, and major encounters
- expanded smoke and integration coverage for persistent archive reading, deferred rewards, reward ribbons, audio limiting, and clarity controls
- preserved enemy statistics, weapon damage, spawn timing, and progression balance

## 0.69.0 — Archive fragments and destruction hotfix

- fixed the `ReferenceError: line is not defined` crash triggered by the retained renderer during an enemy destruction animation
- moved effects-line drawing to an engine-level method shared by energy and destruction effects
- added a direct renderer regression test that executes a destruction effect instead of relying only on static integration checks
- added procedurally generated Archive Fragment signals with modest credit, data, score, sound, and visual feedback
- added 9 persistent Codex discoveries containing original in-world crew records
- presented every fragment as fictional ORBIT//04 archive material
- added recovered-archive progress to lifetime statistics and the run summary
- preserved all ship statistics, enemy balance, spawn timing, weapons, and combat progression

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
