# Piggy Epic — Egg World

A turn-based piggy RPG in the browser. **Five worlds, 60+ battles, 90 birds**, three Bad Piggies on your side (six unlockable), and the entire angry flock on the other. No build step, no dependencies, all art is hand-built inline SVG.

The birds are raiding the egg stores. Corporal Pig, Chef Pig and King Pig are having none of it.

## Play

```bash
python -m http.server 5173
# open http://127.0.0.1:5173
```

Opening `index.html` straight from disk also works — there are no module imports or fetch calls.

## The loop

- **Egg World map** — 15 eggs on a winding road up to the castle. Clear one to unlock the next.
- **Turn-based fights** — heroes act left to right, then the flock acts. Basic attacks build **rage**; skills spend it.
- **Party progression** — shared XP and party levels raise every pig's HP and attack. New pigs join from main-route battles cleared, not from XP: Chef after 2, King after 7, Sapper after 19, Wizard after 36 and Scout after 54.
- **Stars** — 3 stars if nobody is knocked out and the squad stays above half health, 2 for a clean win, 1 if you win with losses.
- **Saving** — progress, stars, levels and unlocks live in `localStorage`. The ↺ button on the map wipes them.

### Heroes

| Pig | Role | Kit |
| --- | --- | --- |
| Corporal Pig | Warrior | Hammer Bonk (rage), Shield Wall (party shields), Skull Crack (stun) |
| Chef Pig | Support | Pan Whack (rage), Hot Soup (party heal), Pepper Supper (squad heal + cleanse) |
| King Pig | Tank | Royal Smash (rage), Royal Guard (taunt + damage reduction), King's Wrath (heavy hit + self heal) |

### Flock

Red Scout, Chuck (double peck), Blue Jay (splits damage across the party), Bomb (lights a fuse, then hits everyone — brace or burst him), Matilda (heals the flock), Hal (hits two pigs), Terence (mini boss) and the Mighty Eagle (final boss).

## Controls

- Click/tap an ability, then a bird if it needs a target.
- `1` / `2` / `3` pick the active pig's abilities, `Esc` cancels targeting.
- Sound can be toggled from the title, map or battle bar.

## Files

```
index.html        screens, script includes
css/style.css     all UI, stage, effects and overlays
js/art.js         inline-SVG pigs and birds
js/data.js        heroes, abilities, enemies, the five worlds and their levels
js/audio.js       WebAudio sound effects (no audio files)
js/battle.js      turn engine, rage/statuses, enemy AI, battle UI
js/game.js        save data, Egg World map, level flow, overlays
tools/balance-sim.mjs  plays every level with a simple AI to check difficulty
```

Balance check:

```bash
node tools/balance-sim.mjs
```

It prints a win rate, average rounds, ending party health and knockouts for each level using a straightforward "heal when hurt, otherwise hit the weakest bird" policy. Tune `hpMul` / `atkMul` per level in `js/data.js` and rerun.
