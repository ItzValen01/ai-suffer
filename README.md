# AI Suffer

AI Suffer is a roguelite platform/shooter game with a browser-based frontend and a Go backend for persistent progression and high scores.

## Architecture

The project's architectural requirements, separation-of-concerns rules, ownership decisions, and AI audit trail are documented in **[ARCHITECTURE.md](ARCHITECTURE.md)**.

If you want to understand how the project is expected to be organized and which boundaries must be preserved when adding new features, start there.

## Requirements

- **Go 1.27.1 or newer**
- A modern web browser with JavaScript enabled
- Windows users running the current development setup can use `go1.27.1 windows/amd64`.

The Go version is declared in `go.mod`, so the project and its contributors use the same minimum language/toolchain baseline.

## Clone and run

Clone the repository and enter the project directory:

```bash
git clone https://github.com/ItzValen01/ai-suffer
cd ai-suffer
```

Verify your Go installation:

```bash
go version
```

The expected minimum is:

```text
go version go1.27.1 windows/amd64
```

Download/verify the Go module dependencies:

```bash
go mod download
```

Start the server:

```bash
go run .
```

Then open:

```text
http://localhost:8080
```

The server serves the frontend from `static/` and exposes the persistence API under `/api/`.

To build a standalone executable instead:

```bash
go build -o ai-suffer.exe .
```

Then run it with:

```bash
./ai-suffer.exe
```

## Data and persistence

Player progression and high scores are stored by the Go backend. The game does **not** use `localStorage` for progression.

The browser communicates with the backend through:

- `GET /api/profile?name=...`
- `POST /api/profile?name=...`
- `GET /api/highscores`
- `POST /api/highscores`

The server creates `data.json` automatically when persistent data needs to be written. This file contains local player profiles and high scores and should normally be treated as runtime data rather than source code.

## Controls

- `A/D` or `Left/Right`: move
- `W`, `Up`, or `Space`: jump
- `Shift`: dash after Phase Dash is unlocked
- `Mouse`: aim
- `Left Click`: shoot
- `J/Z`: shoot
- `1-5`: switch weapon
- `Esc`: pause

## Development notes

The frontend is served directly from `static/` and currently contains the game's HTML, CSS, and JavaScript presentation/runtime code. The backend is implemented in Go and is responsible for the HTTP server and persistent player data.

When making structural changes, keep the separation-of-concerns rules in `ARCHITECTURE.md` in mind. Do not turn the project into a new monolithic script or mix runtime configuration, assets, tests, and documentation without an explicit architectural decision.

## Version history highlights

### V18

- Combat feedback, damage numbers, hit markers, and combos
- Multiple weapons and boss phases
- Scrap shop and perk synergies
- Events/secrets and New Game+
- Run statistics
- Persistent Go-backed scores and profiles
- HUD improvements

### V30 — Pets and achievements

- Pet unlocks scale by rarity and progression requirements.
- Persistent achievements are stored through the Go backend.
- Advanced requirements include accuracy, no-hit boss victories, hard/HACKER wins, and HACKER boss victories.
- Progression remains server-backed; `localStorage` is not used for persistent progression.

### V31 — Adaptive AI and advanced progression

- Hordes can spawn from both sides of the arena.
- Enemies patrol/rebound instead of becoming stuck at arena edges.
- Predictive bullet-dodging AI adapts to difficulty.
- Bosses react to projectile trajectories with dodges, movement, and jumps.
- Persistent `enemyDodges` and `bossDodges` statistics are tracked by Go.


## Features Currently Available

AI Suffer currently includes the following implemented systems and gameplay features:

- **2D roguelite platform-shooter gameplay** with a programmer protagonist fighting AI-themed enemies and bosses.
- **Tower-based progression** consisting of enemy hordes, boss encounters, an elevator-based floor transition, and upgrade selection between floors.
- **Six standard tower floors**, with an additional secret SimSimi floor when the Easter egg is unlocked.
- **Multiple difficulty levels:** Easy, Normal, Hard, and Hacker. Difficulty changes enemy and boss health, damage, speed, attack frequency, spawn pressure, hazards, and AI reaction behavior.
- **Adaptive enemy AI**, including movement, predictive projectile dodging, directional changes, and two-sided horde spawning.
- **Boss AI with reactive movement**, including projectile-aware dodging, movement patterns, and jump/evasive behavior.
- **Multiple weapons**, weapon switching, aiming, shooting, and combat feedback.
- **Dash and mobility mechanics**, including temporary invulnerability and upgrade-based movement progression.
- **Health and shield systems**, damage feedback, low-health visual effects, hit markers, damage numbers, critical hits, and combat effects.
- **Upgrade system** with offensive, defensive, and mobility choices after boss encounters, plus repair options.
- **Scrap economy and in-run purchases**, including persistent progression-related statistics and purchase sound effects.
- **Pet companion system** with multiple pets, rarity tiers, passive benefits, unique abilities, sounds, progression-based unlock conditions, and persistent selection.
- **Achievement system** with multiple difficulty tiers and persistent unlock state.
- **Character customization**, including persistent player color selection.
- **Tutorial and gameplay guidance** covering movement, combat, upgrades, tower progression, and mechanics.
- **Audio system** with menu/game music, sound effects, boss sounds, pet-specific sounds, achievement notifications, finishing music, and upgrade purchase audio.
- **Persistent player profiles and high scores** through the Go backend. Persistent progression is not stored in `localStorage`.
- **Run statistics**, including kills, combo records, accuracy, damage, completion time, boss statistics, and AI-dodge statistics.
- **New Game+ and progression-oriented systems** from previous development iterations.
- **SimSimi Easter egg boss**, with dedicated attacks, dialogue/insult behavior, audio feedback, and firing-rate interference when the player is hit.
- **Easter egg shortcuts from the main menu:** the Konami code can unlock the SimSimi Easter egg without requiring the normal achievement/pet completion conditions, while `S I M S I M I` can directly enter the SimSimi battle without defeating the preceding bosses.

## Features We Did Not Manage to Add

The following features were discussed during development but are not part of the current implementation:

- **Corrected title** — the requested final title/typographic correction was not considered a completed standalone feature in the current project documentation.
- **Online system** — no online multiplayer, online matchmaking, or networked gameplay system was implemented.
- **Local cooperative mode** — there is no local two-player cooperative gameplay mode.
- **Local VS mode** — there is no local versus mode in which one player controls the protagonist while another player controls the AI.
- **Session streak** — there is no dedicated session-streak progression system.

These items are intentionally documented as unimplemented rather than represented as partially completed features.

## Easter Egg Access Codes

The SimSimi Easter egg has two main-menu access methods:

### Konami Code

The standard Konami input sequence can be entered from the main menu to unlock the Easter egg without requiring the normal condition of unlocking every achievement and pet.

**Sequence:** `↑ ↑ ↓ ↓ ← → ← → B A`

### Direct SimSimi Battle Code

The sequence `S I M S I M I` can be entered from the main menu to access the SimSimi Easter egg battle directly, bypassing the need to defeat the preceding bosses.

These codes are intended as Easter-egg/debug-style shortcuts and do not represent the normal progression path.

## Project Creators

AI Suffer was created by:

- **Valentino Modaffari**
- **Santiago Muñoz**
- **Martin Coronel**
- **Tomas Delgadillo**
- **Juan Ignacio Alzuagaray**
