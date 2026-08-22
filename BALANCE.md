# ORBIT//04 — Balance Targets

## Epistemic status

This is a design-driven balance pass. It is not telemetry-validated yet.

## Target run shape

| Time | Intended state |
|---|---|
| 0:00–2:00 | Learn movement, establish first weapon direction |
| 2:00–4:00 | Build identity appears; first serious elite pressure |
| ~3:30 | Boss 1: positioning check |
| 4:00–7:30 | Synergies and first evolution become plausible |
| ~7:30 | Boss 2: build check |
| 8:00–11:30 | High-density survival / chain management |
| 12:00 | Final boss: execution + build check |
| post-clear | Optional Ascension risk/reward |

## Difficulty philosophy

Difficulty should come primarily from:

1. readable projectile patterns;
2. enemy composition;
3. positioning pressure;
4. maintaining chain / graze opportunities;
5. build decisions.

It should not come primarily from excessive enemy HP.

## 0.66 encounter correction

- Tanks may enter the standard encounter pool after 0:25, but their selection ceiling is limited to 14% until 0:55.
- The previous early window selected Tanks for 79% of ordinary spawns, which created unintended low-level durability pressure.
- After 0:55, the established Charger and Tank composition remains unchanged.
- Enemy hull, damage, speed, elite timing, boss timing, weapon output, XP, and progression values are unchanged in this correction.

## 0.67 exploration signals

| Signal | Classification | Effect |
|---|---|---|
| Repair Relay | Benefit | Restores 18% maximum hull and clears nearby hostile fire; grants 6 CR at full hull |
| Flux Amplifier | Benefit | Grants +25% weapon output for 18 seconds and immediately refreshes Phase Dash |
| Salvage Probe | Benefit | Grants 12 CR and 6 data |
| Unstable Relic | Risk / reward | Grants 24 CR and +25% weapon output for 22 seconds, but causes hull damage and a hostile echo |
| Null Jammer | Hazard | Reduces movement by 28% for 14 seconds, delays Phase Dash, damages the hull, and emits a hostile signal |

Exploration effects are temporary or event-scoped. Baseline frame statistics, weapon values, enemy growth, boss timing, and progression remain unchanged.

## 0.30 changes

### Hostiles

- early hull growth reduced;
- late hull growth remains meaningful;
- first elite moved to ~36 seconds;
- late spawn floor raised to avoid pathological entity spam;
- Hardline and Blackout keep pressure mainly through density, speed and damage.

### Bosses

- Sentinel: 2250 base HP;
- Warden: 4550 base HP;
- Null Carrier: 7700 base HP;
- boss damage rises more than boss health between tiers;
- first boss moved to ~3:30;
- second boss moved to ~7:30.

### Frames

- Bastion effective durability reduced slightly;
- Bulwark output reduced to avoid carrier dominance;
- Vector burst reduced slightly while receiving a small hull increase;
- EVENT output increased to compensate for lower mobility.

### Progression

- XP requirement curve changed from `×1.22 + 3` to `×1.16 + 4`;
- early choices remain frequent;
- mid-run levels scale more smoothly;
- revive hull reduced to 30%.

## Telemetry required before 1.0

- clear rate by frame / sector / difficulty;
- death time distribution;
- weapon pick rate;
- weapon damage share;
- evolution frequency;
- average level at 4 / 8 / 12 minutes;
- damage taken per minute;
- boss kill time;
- frame win rate;
- Ascension entry rate;
- reroll and skip usage.
