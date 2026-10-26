# ⚡ TICTOCKIE — Beyond Tic Tac Toe (Cyberpunk Edition)

> **A next-generation, zero-dependency holographic strategy arena built in a single self-contained HTML/CSS/JS module.**  
> Fully responsive across mobile, tablet, and desktop, and engineered with strict CSS isolation for seamless embedding in **Blogger XML themes**, static sites, or standalone web apps.

---

## 🔥 Key Highlights

- 🎮 **10 Tactical Game Modes**:
  1. **Classic Ranked (3×3)**: Pure competitive Tic Tac Toe with ELO rating progression.
  2. **☢️ Neon Reactor (Signature Mode)**: Harvest `⚡` energy from Reactor Nodes to trigger **Scanner Pulse (2⚡)**, **Aegis Shield (3⚡)**, and **Oracle Vector Hint (4⚡)**.
  3. **Ultimate Tic Tac Toe (9×3×3)**: Interconnected macro/micro grids where every move dictates your opponent's next sector.
  4. **Mega Grid 5×5**: 25-cell tactical matrix (4-in-a-row to win).
  5. **Mega Grid 7×7**: 49-cell warzone grid (4-in-a-row to win).
  6. **Time Attack Blitz**: High-pressure 5.0-second turn clock.
  7. **Survival Wave Rush**: Endless gauntlet against scaling AI tiers.
  8. **Daily Tactical Challenge**: Deterministic mid-game puzzle seeded by today's date.
  9. **Blind Strategy (Fog of War)**: Placed symbols encrypt into hidden `?` holograms after 2 turns.
  10. **Custom Sandbox Arena**: Customize board size (`3×3` to `7×7`), win length, and turn timers.

- 🧠 **4-Tier AI Engine**: Powered by **Minimax with Alpha-Beta Pruning** (for `3×3`), Ultimate sector evaluation, and heuristic threat scoring (for `5×5` & `7×7` Mega Grids).
- 🌐 **Real-Time Multiplayer & Room Sync**: Instant cross-tab P2P sync via `BroadcastChannel` + optional **Firebase Realtime Database REST hook** for cloud rooms & spectator mode.
- 🛡️ **Authoritative Move Validation**: Every action is verified for turn order, bounds, cell occupancy, Aegis locks, and cryptographic **FNV-1a board state hashes**.
- 🎹 **Procedural Web Audio Synth**: Zero external audio files—all laser sweeps, moves, and ambient cyberpunk drone pads are synthesized in real time via the Web Audio API.
- 🌍 **Multi-Language Support (i18n)**: Switch instantaneously between **English (EN)**, **Hindi/Hinglish (HI)**, and **Español (ES)**.
- 🧪 **Built-In Automated Verification Suite**: Execute **12 live unit & integration tests** directly inside the Settings panel.

---

## 🚀 Quick Start

1. Clone or download this repository.
2. Open `index.html` directly in any modern browser **OR** paste the `<div id="tictockie-app">...</div>` snippet directly into a **Blogger Post/Page (HTML View)**.
3. No build step, no `npm install`, and no external assets required!

---

## 🧪 Built-in Diagnostics (12 Automated Tests)
Navigate to **⚙️ Settings & Tests → Execute All 12 Automated Tests** to verify:
- Legal move mutation & turn progression
- Occupied cell & out-of-turn rejection
- Stale/duplicate packet rejection
- Horizontal, diagonal & Mega Grid 4-in-a-row win detection
- Alpha-Beta AI immediate win & threat blocking
- Ultimate 9×3×3 sector routing
- Neon Reactor energy harvesting & Aegis Shield locking
- FNV-1a deterministic state hashing
