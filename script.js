(function() {
  "use strict";

  /* 1. LOCALIZATION DICTIONARY */
  const I18N = {
    en: {
      subtitle: "BEYOND TIC TAC TOE // CYBER ARENA",
      nav_home: "HOME", nav_arena: "ARENA", nav_online: "ONLINE ROOMS",
      nav_tourney: "TOURNAMENT", nav_stats: "PROFILE & RANKS", nav_settings: "SETTINGS & TESTS",
      hero_desc: "Select a tactical protocol below. Authoritative move validation, Alpha-Beta AI, and Neon Reactor systems online."
    },
    hi: {
      subtitle: "बियॉन्ड टिक टैक टो // साइबर एरीना",
      nav_home: "होम", nav_arena: "एरीना", nav_online: "ऑनलाइन रूम",
      nav_tourney: "टूर्नामेंट", nav_stats: "प्रोफ़ाइल और रैंक", nav_settings: "सेटिंग्स और टेस्ट",
      hero_desc: "नीचे अपना गेम मोड चुनें। अल्फा-बीटा AI, नियॉन रिएक्टर और लाइव मल्टीप्लेयर तैयार हैं।"
    },
    es: {
      subtitle: "MÁS ALLÁ DEL TRES EN RAYA // ARENA CYBER",
      nav_home: "INICIO", nav_arena: "ARENA", nav_online: "SALAS ONLINE",
      nav_tourney: "TORNEO", nav_stats: "PERFIL Y RANGOS", nav_settings: "AJUSTES Y TESTS",
      hero_desc: "Selecciona un protocolo táctico. Validación autoritativa, IA Alfa-Beta y Reactor Neón activos."
    }
  };

  /* 2. PROCEDURAL WEB AUDIO SYNTHESIZER */
  class CyberAudioEngine {
    constructor() {
      this.ctx = null;
      this.sfxEnabled = true;
      this.musicOsc = null;
      this.musicGain = null;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    }
    playTone(freq, type, duration, vol = 0.12, slideTo = null) {
      if (!this.sfxEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideTo) {
          osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        }
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }
    playMoveX() { this.playTone(520, "sawtooth", 0.14, 0.1, 880); }
    playMoveO() { this.playTone(340, "triangle", 0.16, 0.12, 220); }
    playAbility() { this.playTone(660, "sine", 0.25, 0.14, 1320); }
    playError() { this.playTone(150, "sawtooth", 0.2, 0.12, 95); }
    playWin() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        setTimeout(() => this.playTone(f, "triangle", 0.28, 0.14), i * 90);
      });
    }
    playDraw() {
      [400, 350, 300].forEach((f, i) => {
        setTimeout(() => this.playTone(f, "sine", 0.22, 0.1), i * 110);
      });
    }
    toggleMusic(on) {
      try {
        this.init();
        if (!this.ctx) return;
        if (on && !this.musicOsc) {
          this.musicOsc = this.ctx.createOscillator();
          this.musicGain = this.ctx.createGain();
          this.musicOsc.type = "sawtooth";
          this.musicOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
          this.musicGain.gain.setValueAtTime(0.025, this.ctx.currentTime);
          this.musicOsc.connect(this.musicGain);
          this.musicGain.connect(this.ctx.destination);
          this.musicOsc.start();
        } else if (!on && this.musicOsc) {
          this.musicOsc.stop();
          this.musicOsc.disconnect();
          this.musicOsc = null;
        }
      } catch (e) {}
    }
  }

  /* 3. AUTHORITATIVE GAME LOGIC & VALIDATION ENGINE */
  class AuthoritativeEngine {
    static computeHash(state) {
      const raw = JSON.stringify({
        b: state.board,
        t: state.turn,
        m: state.moveCount,
        u: state.ultimateMacro
      });
      let hash = 2166136261;
      for (let i = 0; i < raw.length; i++) {
        hash ^= raw.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return "#" + (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
    }

    static generateWinLines(size, winLen) {
      const lines = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c <= size - winLen; c++) {
          const rowLine = [];
          const colLine = [];
          for (let k = 0; k < winLen; k++) {
            rowLine.push(r * size + (c + k));
            colLine.push((c + k) * size + r);
          }
          lines.push(rowLine, colLine);
        }
      }
      for (let r = 0; r <= size - winLen; r++) {
        for (let c = 0; c <= size - winLen; c++) {
          const d1 = [];
          const d2 = [];
          for (let k = 0; k < winLen; k++) {
            d1.push((r + k) * size + (c + k));
            d2.push((r + k) * size + (c + winLen - 1 - k));
          }
          lines.push(d1, d2);
        }
      }
      return lines;
    }

    static checkStandardWinner(board, size, winLen) {
      const lines = AuthoritativeEngine.generateWinLines(size, winLen);
      for (const line of lines) {
        const first = board[line[0]];
        if (!first) continue;
        let match = true;
        for (let i = 1; i < line.length; i++) {
          if (board[line[i]] !== first) {
            match = false;
            break;
          }
        }
        if (match) {
          return { winner: first, line };
        }
      }
      if (board.every(cell => cell !== null)) {
        return { winner: "DRAW", line: [] };
      }
      return null;
    }

    static validateAndApplyMove(state, action) {
      if (!state || state.status !== "PLAYING") {
        return { ok: false, reason: "MATCH_NOT_ACTIVE" };
      }
      if (action.player !== state.turn) {
        return { ok: false, reason: "OUT_OF_TURN_ACTION" };
      }
      if (typeof action.expectedMoveCount === "number" && action.expectedMoveCount !== state.moveCount) {
        return { ok: false, reason: "STALE_TURN_SUBMISSION" };
      }

      if (state.mode === "ultimate") {
        const { macroIdx, microIdx } = action;
        if (macroIdx < 0 || macroIdx > 8 || microIdx < 0 || microIdx > 8) {
          return { ok: false, reason: "OUT_OF_BOUNDS" };
        }
        if (state.activeMacro !== null && state.activeMacro !== macroIdx) {
          return { ok: false, reason: "INVALID_ULTIMATE_SECTOR" };
        }
        if (state.ultimateMacro[macroIdx] !== null) {
          return { ok: false, reason: "SECTOR_ALREADY_DECIDED" };
        }
        if (state.ultimateBoards[macroIdx][microIdx] !== null) {
          return { ok: false, reason: "CELL_OCCUPIED" };
        }

        state.ultimateBoards[macroIdx][microIdx] = action.player;
        state.moveCount++;

        const microRes = AuthoritativeEngine.checkStandardWinner(state.ultimateBoards[macroIdx], 3, 3);
        if (microRes) {
          state.ultimateMacro[macroIdx] = microRes.winner;
        }

        const macroNormalized = state.ultimateMacro.map(v => (v === "DRAW" ? null : v));
        const macroRes = AuthoritativeEngine.checkStandardWinner(macroNormalized, 3, 3);
        if (macroRes && macroRes.winner !== "DRAW") {
          state.status = "FINISHED";
          state.winner = macroRes.winner;
          state.winLine = macroRes.line;
        } else if (state.ultimateMacro.every(m => m !== null)) {
          const xCount = state.ultimateMacro.filter(m => m === "X").length;
          const oCount = state.ultimateMacro.filter(m => m === "O").length;
          state.status = "FINISHED";
          state.winner = xCount > oCount ? "X" : (oCount > xCount ? "O" : "DRAW");
          state.winLine = [];
        } else {
          state.activeMacro = state.ultimateMacro[microIdx] === null ? microIdx : null;
          state.turn = state.turn === "X" ? "O" : "X";
        }
        return { ok: true };
      }

      const idx = action.index;
      if (typeof idx !== "number" || idx < 0 || idx >= state.board.length) {
        return { ok: false, reason: "OUT_OF_BOUNDS" };
      }
      if (state.board[idx] !== null) {
        return { ok: false, reason: "CELL_OCCUPIED" };
      }
      if (state.shieldedCell === idx) {
        return { ok: false, reason: "CELL_AEGIS_SHIELDED" };
      }

      state.board[idx] = action.player;
      state.moveCount++;
      state.shieldedCell = null;
      state.hintCell = null;

      if (state.mode === "reactor" || state.reactorEnabled) {
        let gained = 0;
        if (state.reactorNodes.includes(idx)) {
          gained += 2;
        } else {
          const r = Math.floor(idx / state.size);
          const c = idx % state.size;
          for (const rn of state.reactorNodes) {
            const rr = Math.floor(rn / state.size);
            const rc = rn % state.size;
            if (Math.abs(r - rr) + Math.abs(c - rc) === 1) {
              gained += 1;
              break;
            }
          }
        }
        state.energy[action.player] = Math.min(6, (state.energy[action.player] || 0) + gained);
      }

      const outcome = AuthoritativeEngine.checkStandardWinner(state.board, state.size, state.winLen);
      if (outcome) {
        state.status = "FINISHED";
        state.winner = outcome.winner;
        state.winLine = outcome.line;
      } else {
        state.turn = state.turn === "X" ? "O" : "X";
      }
      return { ok: true };
    }
  }

  /* 4. AI ENGINE (MINIMAX WITH ALPHA-BETA PRUNING + HEURISTIC SEARCH) */
  class CyberAIEngine {
    static chooseMove(state, difficulty = "ai_expert") {
      if (state.mode === "ultimate") {
        return CyberAIEngine.chooseUltimateMove(state, difficulty);
      }

      const validMoves = [];
      for (let i = 0; i < state.board.length; i++) {
        if (state.board[i] === null && state.shieldedCell !== i) validMoves.push(i);
      }
      if (validMoves.length === 0) return null;

      const roll = Math.random();
      if (difficulty === "ai_beginner" && roll < 0.62) {
        return validMoves[Math.floor(Math.random() * validMoves.length)];
      }
      if (difficulty === "ai_intermediate" && roll < 0.30) {
        return validMoves[Math.floor(Math.random() * validMoves.length)];
      }

      const aiSym = state.turn;
      const humanSym = aiSym === "X" ? "O" : "X";

      for (const m of validMoves) {
        state.board[m] = aiSym;
        const res = AuthoritativeEngine.checkStandardWinner(state.board, state.size, state.winLen);
        state.board[m] = null;
        if (res && res.winner === aiSym) return m;
      }

      for (const m of validMoves) {
        state.board[m] = humanSym;
        const res = AuthoritativeEngine.checkStandardWinner(state.board, state.size, state.winLen);
        state.board[m] = null;
        if (res && res.winner === humanSym) return m;
      }

      if (state.size === 3) {
        const maxDepth = difficulty === "ai_intermediate" ? 3 : (difficulty === "ai_advanced" ? 5 : 9);
        let bestScore = -Infinity;
        let bestMove = validMoves[0];

        for (const m of validMoves) {
          state.board[m] = aiSym;
          const score = CyberAIEngine.minimax(
            state.board, 0, false, aiSym, humanSym, -Infinity, Infinity, maxDepth
          );
          state.board[m] = null;
          if (score > bestScore) {
            bestScore = score;
            bestMove = m;
          }
        }
        return bestMove;
      }

      const lines = AuthoritativeEngine.generateWinLines(state.size, state.winLen);
      let bestMove = validMoves[0];
      let bestHeuristic = -Infinity;
      const center = (state.size - 1) / 2;

      for (const m of validMoves) {
        let score = 0;
        const r = Math.floor(m / state.size);
        const c = m % state.size;
        score -= (Math.abs(r - center) + Math.abs(c - center)) * 1.5;

        for (const line of lines) {
          if (!line.includes(m)) continue;
          let aiCount = 0;
          let humCount = 0;
          for (const cellIdx of line) {
            if (state.board[cellIdx] === aiSym) aiCount++;
            else if (state.board[cellIdx] === humanSym) humCount++;
          }
          if (humCount === 0) score += Math.pow(10, aiCount + 1);
          else if (aiCount === 0) score += Math.pow(9, humCount + 1);
        }

        if (state.reactorNodes && state.reactorNodes.includes(m)) {
          score += 18;
        }

        if (score > bestHeuristic) {
          bestHeuristic = score;
          bestMove = m;
        }
      }
      return bestMove;
    }

    static minimax(board, depth, isMax, aiSym, humSym, alpha, beta, maxDepth) {
      const res = AuthoritativeEngine.checkStandardWinner(board, 3, 3);
      if (res) {
        if (res.winner === aiSym) return 100 - depth;
        if (res.winner === humSym) return depth - 100;
        return 0;
      }
      if (depth >= maxDepth) return 0;

      if (isMax) {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (board[i] === null) {
            board[i] = aiSym;
            best = Math.max(best, CyberAIEngine.minimax(board, depth + 1, false, aiSym, humSym, alpha, beta, maxDepth));
            board[i] = null;
            alpha = Math.max(alpha, best);
            if (beta <= alpha) break;
          }
        }
        return best;
      } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
          if (board[i] === null) {
            board[i] = humSym;
            best = Math.min(best, CyberAIEngine.minimax(board, depth + 1, true, aiSym, humSym, alpha, beta, maxDepth));
            board[i] = null;
            beta = Math.min(beta, best);
            if (beta <= alpha) break;
          }
        }
        return best;
      }
    }

    static chooseUltimateMove(state, difficulty) {
      const candidates = [];
      const allowedMacros = state.activeMacro !== null ? [state.activeMacro] : [0,1,2,3,4,5,6,7,8];
      for (const mac of allowedMacros) {
        if (state.ultimateMacro[mac] !== null) continue;
        for (let mic = 0; mic < 9; mic++) {
          if (state.ultimateBoards[mac][mic] === null) {
            candidates.push({ macroIdx: mac, microIdx: mic });
          }
        }
      }
      if (candidates.length === 0) return null;
      if (difficulty === "ai_beginner") {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }

      const aiSym = state.turn;
      const humSym = aiSym === "X" ? "O" : "X";
      let bestCandidate = candidates[0];
      let bestScore = -Infinity;

      for (const cand of candidates) {
        let score = 0;
        const microBoard = state.ultimateBoards[cand.macroIdx];
        microBoard[cand.microIdx] = aiSym;
        const winMicro = AuthoritativeEngine.checkStandardWinner(microBoard, 3, 3);
        if (winMicro && winMicro.winner === aiSym) score += 150;
        microBoard[cand.microIdx] = humSym;
        const blockMicro = AuthoritativeEngine.checkStandardWinner(microBoard, 3, 3);
        if (blockMicro && blockMicro.winner === humSym) score += 120;
        microBoard[cand.microIdx] = null;

        if (cand.microIdx === 4) score += 15;
        if (state.ultimateMacro[cand.microIdx] !== null) score -= 45;

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = cand;
        }
      }
      return bestCandidate;
    }
  }

  /* 5. CANVAS ATMOSPHERIC & CINEMATIC BURST PARTICLES */
  class ParticleSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.ambient = [];
      this.bursts = [];
      this.enabled = true;
      this.resize();
      window.addEventListener("resize", () => this.resize());
      this.initAmbient();
      this.loop();
    }
    resize() {
      if (!this.canvas) return;
      this.canvas.width = Math.max(300, window.innerWidth || 1000);
      this.canvas.height = Math.max(500, window.innerHeight || 760);
    }
    initAmbient() {
      this.ambient = [];
      for (let i = 0; i < 32; i++) {
        this.ambient.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          r: Math.random() * 1.8 + 0.6,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          color: i % 2 === 0 ? "#00f0ff" : "#b829ff"
        });
      }
    }
    triggerBurst(color = "#ffd700") {
      if (!this.enabled) return;
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1.5;
        this.bursts.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color
        });
      }
    }
    loop() {
      if (this.enabled) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const p of this.ambient) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = this.canvas.width;
          if (p.x > this.canvas.width) p.x = 0;
          if (p.y < 0) p.y = this.canvas.height;
          if (p.y > this.canvas.height) p.y = 0;
          this.ctx.fillStyle = p.color;
          this.ctx.globalAlpha = 0.35;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          this.ctx.fill();
        }
        for (let i = this.bursts.length - 1; i >= 0; i--) {
          const b = this.bursts[i];
          b.x += b.vx;
          b.y += b.vy;
          b.alpha -= 0.022;
          if (b.alpha <= 0) {
            this.bursts.splice(i, 1);
            continue;
          }
          this.ctx.fillStyle = b.color;
          this.ctx.globalAlpha = b.alpha;
          this.ctx.beginPath();
          this.ctx.arc(b.x, b.y, 2.8, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
      }
      requestAnimationFrame(() => this.loop());
    }
  }

  /* 6. MAIN APPLICATION CONTROLLER */
  const MODES_CATALOG = [
    { id: "classic", tag: "RANKED CORE", title: "Classic Tic Tac Toe", desc: "Pure 3×3 competitive grid. Zero special abilities allowed. Full ELO rating impact." },
    { id: "reactor", tag: "SIGNATURE MODE", title: "Neon Reactor", desc: "Harvest ⚡ Energy from Reactor Nodes to unleash Scanner Pulse, Aegis Shield, and Oracle Hints.", signature: true },
    { id: "ultimate", tag: "MACRO STRATEGY", title: "Ultimate Tic Tac Toe", desc: "9 interconnected 3×3 micro-boards. Every move dictates which sector your opponent must play next!" },
    { id: "mega5", tag: "EXPANDED ARENA", title: "Mega Grid 5×5", desc: "High-density 25-cell cyber matrix. Connect 4-in-a-row to trigger the golden laser sweep." },
    { id: "mega7", tag: "WARZONE GRID", title: "Mega Grid 7×7", desc: "Massive 49-cell tactical battlefield with 4-in-a-row victory conditions." },
    { id: "timeattack", tag: "BLITZ CLOCK", title: "Time Attack", desc: "5.0 seconds per move! Hesitate and the reactor clock forfeits your turn immediately." },
    { id: "survival", tag: "ENDLESS GAUNTLET", title: "Survival Mode", desc: "Face endless waves of increasingly lethal AI drones. How many waves can you survive?" },
    { id: "daily", tag: "SEEDED PUZZLE", title: "Daily Challenge", desc: "A deterministic mid-game tactical puzzle seeded by today's date. Find the winning sequence!" },
    { id: "blind", tag: "FOG OF WAR", title: "Blind Strategy", desc: "Placed symbols encrypt into hidden holograms after 2 turns. Track coordinates or use Scanner!" },
    { id: "custom", tag: "SANDBOX", title: "Custom Arena", desc: "Configure grid dimensions, winning line length, turn timers, and opponent parameters." }
  ];

  const audio = new CyberAudioEngine();
  const particles = new ParticleSystem(document.getElementById("tt-canvas"));

  const defaultStats = {
    callsign: "CYBER_RUNNER",
    elo: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    bestWave: 1,
    firebaseUrl: ""
  };
  let profile = Object.assign({}, defaultStats);
  try {
    const saved = JSON.parse(localStorage.getItem("tictockie_profile_v1") || "{}");
    profile = Object.assign({}, defaultStats, saved);
  } catch (e) {}

  function saveProfile() {
    try {
      localStorage.setItem("tictockie_profile_v1", JSON.stringify(profile));
    } catch (e) {}
    renderProfileAndStats();
  }

  let gameState = null;
  let timerInterval = null;
  let survivalWave = 1;
  let activeTournamentMatch = false;

  let bcChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("tictockie_sync_v1") : null;
  let roomConfig = { connected: false, code: "NEON-77", role: "X" };

  if (bcChannel) {
    bcChannel.onmessage = (ev) => {
      const data = ev.data;
      if (!roomConfig.connected || !data || data.roomCode !== roomConfig.code) return;
      if (data.type === "MOVE_ACTION" && gameState) {
        applyMoveWithUI(data.action, true);
      } else if (data.type === "NEW_MATCH" && data.state) {
        gameState = data.state;
        renderArena();
      }
    };
  }

  let tourneyState = {
    round: 0,
    qf: [
      { p1: profile.callsign, p2: "DROID_ALPHA", winner: null },
      { p1: "NEXUS_7", p2: "VORTEX_AI", winner: "VORTEX_AI" },
      { p1: "KRONOS_X", p2: "CIPHER_9", winner: "KRONOS_X" },
      { p1: "OMEGA_CORE", p2: "VALKYRIE", winner: "OMEGA_CORE" }
    ],
    sf: [
      { p1: "TBD", p2: "VORTEX_AI", winner: null },
      { p1: "KRONOS_X", p2: "OMEGA_CORE", winner: "OMEGA_CORE" }
    ],
    final: [
      { p1: "TBD", p2: "OMEGA_CORE", winner: null }
    ]
  };

  /* 7. INITIALIZE & RENDER HOME SCREEN */
  function renderHomeCards() {
    const container = document.getElementById("tt-modes-container");
    container.innerHTML = "";
    MODES_CATALOG.forEach(m => {
      const card = document.createElement("div");
      card.className = "tt-mode-card" + (m.signature ? " signature" : "");
      card.innerHTML = `
        <div>
          <span class="tt-mode-tag">${m.tag}</span>
          <h3 class="tt-mode-title">${m.title}</h3>
          <p class="tt-mode-desc">${m.desc}</p>
        </div>
        <button type="button" class="tt-btn ${m.signature ? 'gold' : ''}" style="width:100%;">LAUNCH PROTOCOL →</button>
      `;
      card.addEventListener("click", () => {
        document.getElementById("tt-sel-mode").value = m.id;
        switchView("arena");
        startNewMatch();
      });
      container.appendChild(card);
    });
  }

  function switchView(viewId) {
    document.querySelectorAll(".tt-view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".tt-nav-btn[data-view]").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-view") === viewId);
    });
    const target = document.getElementById("view-" + viewId);
    if (target) target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => particles.resize(), 60);
  }

  /* 8. START NEW MATCH & BUILD STATE */
  function startNewMatch() {
    clearInterval(timerInterval);
    const mode = document.getElementById("tt-sel-mode").value;
    const opp = document.getElementById("tt-sel-opp").value;
    document.getElementById("tt-custom-controls").style.display = mode === "custom" ? "block" : "none";

    let size = 3;
    let winLen = 3;
    let turnTime = 0;
    let reactorEnabled = false;

    if (mode === "mega5") { size = 5; winLen = 4; }
    else if (mode === "mega7") { size = 7; winLen = 4; }
    else if (mode === "timeattack") { turnTime = 5; }
    else if (mode === "reactor") { reactorEnabled = true; }
    else if (mode === "custom") {
      size = parseInt(document.getElementById("tt-custom-size").value, 10) || 5;
      winLen = Math.min(size, parseInt(document.getElementById("tt-custom-win").value, 10) || 4);
      turnTime = parseInt(document.getElementById("tt-custom-timer").value, 10) || 0;
    }

    const reactorNodes = [];
    if (reactorEnabled) {
      reactorNodes.push(1, 3, 5, 7);
    }

    gameState = {
      mode,
      opp,
      size,
      winLen,
      turnTime,
      timeLeft: turnTime,
      reactorEnabled,
      reactorNodes,
      energy: { X: 2, O: 2 },
      shieldedCell: null,
      hintCell: null,
      scannerActive: false,
      board: Array(size * size).fill(null),
      moveTimestamps: Array(size * size).fill(0),
      ultimateBoards: Array.from({ length: 9 }, () => Array(9).fill(null)),
      ultimateMacro: Array(9).fill(null),
      activeMacro: null,
      turn: "X",
      moveCount: 0,
      status: "PLAYING",
      winner: null,
      winLine: [],
      history: []
    };

    if (mode === "daily") {
      const today = new Date().toISOString().slice(0, 10);
      gameState.board[0] = "X";
      gameState.board[4] = "O";
      gameState.board[8] = "X";
      gameState.board[2] = "O";
      gameState.moveCount = 4;
      gameState.history.push(`DAILY SEED [${today}]: Find the winning fork as X!`);
    }

    updateModeBriefing(mode);
    document.getElementById("tt-match-banner").classList.remove("show");
    document.getElementById("tt-laser-svg").innerHTML = "";

    renderArena();
    startTurnTimer();

    if (roomConfig.connected && bcChannel) {
      bcChannel.postMessage({ type: "NEW_MATCH", roomCode: roomConfig.code, state: gameState });
    }
  }

  function updateModeBriefing(mode) {
    const rulesMap = {
      classic: "Ranked Classic 3×3: Standard rules. Special abilities are strictly disabled. Full ELO rating adjustments active.",
      reactor: "Neon Reactor: Claim ⚡ Reactor Nodes (+2⚡) or adjacent cells (+1⚡). Spend energy on Scanner (2⚡), Aegis Shield (3⚡), or Oracle Hint (4⚡).",
      ultimate: "Ultimate 9×3×3: The micro-cell you pick determines which macro-board your opponent must play in next. Win 3 macro-boards in a line!",
      mega5: "Mega Grid 5×5: Expanded 25-cell matrix. Align 4 matching symbols horizontally, vertically, or diagonally.",
      mega7: "Mega Grid 7×7: Strategic 49-cell grid. Connect 4-in-a-row while blocking opponent multi-forks.",
      timeattack: "Time Attack: Each player has strictly 5.0 seconds per turn. Letting the clock expire forfeits your turn!",
      survival: `Survival Mode (Current Wave ${survivalWave}): Defeat consecutive AI waves. AI difficulty scales upward every wave!`,
      daily: "Daily Challenge: Pre-configured tactical puzzle seeded by today's date. Create an unstoppable fork to win!",
      blind: "Blind Strategy: Marks older than 2 turns become hidden under encrypted holographic fog (`?`). Remember your placements!",
      custom: "Custom Arena: Personalized grid size, win line length, and turn timer."
    };
    document.getElementById("tt-mode-rules-text").textContent = rulesMap[mode] || rulesMap.classic;
  }

  /* 9. RENDER ARENA & SVG MARKS */
  function createMarkSVG(symbol, isFogged) {
    if (isFogged) {
      return `<span style="font-family:var(--font-mono);font-size:clamp(12px,2.2vw,16px);color:var(--neon-grid);">?</span>`;
    }
    if (symbol === "X") {
      return `<svg class="tt-mark-svg" viewBox="0 0 100 100">
        <line class="tt-x-stroke s1" x1="20" y1="20" x2="80" y2="80" />
        <line class="tt-x-stroke s2" x1="80" y1="20" x2="20" y2="80" />
      </svg>`;
    }
    if (symbol === "O") {
      return `<svg class="tt-mark-svg" viewBox="0 0 100 100">
        <circle class="tt-o-ring" cx="50" cy="50" r="32" />
      </svg>`;
    }
    return "";
  }

  function renderArena() {
    if (!gameState) return;

    document.getElementById("tt-name-x").textContent = profile.callsign + " (X)";
    document.getElementById("tt-meta-x").textContent = `ELO ${profile.elo}`;
    const oppLabel = document.getElementById("tt-sel-opp").selectedOptions[0].text;
    document.getElementById("tt-name-o").textContent = oppLabel.split("—")[0].trim() + " (O)";
    document.getElementById("tt-meta-o").textContent = gameState.mode === "survival" ? `WAVE ${survivalWave}` : gameState.mode.toUpperCase();

    document.getElementById("tt-card-x").classList.toggle("active-x", gameState.turn === "X" && gameState.status === "PLAYING");
    document.getElementById("tt-card-o").classList.toggle("active-o", gameState.turn === "O" && gameState.status === "PLAYING");
    document.getElementById("tt-turn-txt").textContent = gameState.status === "PLAYING" ? `TURN: ${gameState.turn}` : `RESULT: ${gameState.winner}`;
    document.getElementById("tt-state-hash").textContent = "HASH: " + AuthoritativeEngine.computeHash(gameState);

    const showReactor = gameState.mode === "reactor" && gameState.mode !== "classic";
    document.getElementById("tt-reactor-dock").style.display = showReactor ? "block" : "none";
    if (showReactor) {
      document.getElementById("tt-energy-readout").textContent = `X: ${gameState.energy.X}⚡ | O: ${gameState.energy.O}⚡`;
      const curE = gameState.energy[gameState.turn] || 0;
      document.getElementById("tt-abi-scan").disabled = curE < 2 || gameState.status !== "PLAYING";
      document.getElementById("tt-abi-shield").disabled = curE < 3 || gameState.status !== "PLAYING";
      document.getElementById("tt-abi-oracle").disabled = curE < 4 || gameState.status !== "PLAYING";
    }

    const gridEl = document.getElementById("tt-grid");
    gridEl.innerHTML = "";

    if (gameState.mode === "ultimate") {
      gridEl.className = "tt-grid-ultimate";
      gridEl.style.gridTemplateColumns = "";
      gridEl.style.gridTemplateRows = "";

      for (let mac = 0; mac < 9; mac++) {
        const macDiv = document.createElement("div");
        const isTarget = gameState.status === "PLAYING" && (gameState.activeMacro === null || gameState.activeMacro === mac) && gameState.ultimateMacro[mac] === null;
        macDiv.className = "tt-macro-cell" + (isTarget ? " target-active" : "");

        for (let mic = 0; mic < 9; mic++) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "tt-cell";
          const val = gameState.ultimateBoards[mac][mic];
          btn.innerHTML = createMarkSVG(val, false);
          btn.disabled = gameState.status !== "PLAYING" || val !== null || !isTarget;
          btn.addEventListener("click", () => handlePlayerAction({ player: gameState.turn, macroIdx: mac, microIdx: mic, expectedMoveCount: gameState.moveCount }));
          macDiv.appendChild(btn);
        }

        if (gameState.ultimateMacro[mac] !== null) {
          const ov = document.createElement("div");
          ov.className = "tt-macro-overlay";
          const w = gameState.ultimateMacro[mac];
          ov.style.color = w === "X" ? "var(--neon-x)" : (w === "O" ? "var(--neon-o)" : "var(--neon-gold)");
          ov.textContent = w === "DRAW" ? "=" : w;
          macDiv.appendChild(ov);
        }
        gridEl.appendChild(macDiv);
      }
    } else {
      gridEl.className = "tt-grid-standard";
      gridEl.style.gridTemplateColumns = `repeat(${gameState.size}, 1fr)`;
      gridEl.style.gridTemplateRows = `repeat(${gameState.size}, 1fr)`;

      for (let i = 0; i < gameState.board.length; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        const val = gameState.board[i];
        const isWin = gameState.winLine.includes(i);
        const isReactor = gameState.reactorEnabled && gameState.reactorNodes.includes(i);
        const isShielded = gameState.shieldedCell === i;
        const isHint = gameState.hintCell === i;

        btn.className = "tt-cell" +
          (isWin ? " win-cell" : "") +
          (isReactor ? " reactor-node" : "") +
          (isShielded ? " shielded-cell" : "") +
          (isHint ? " hint-cell" : "");

        const age = gameState.moveCount - (gameState.moveTimestamps[i] || 0);
        const isFogged = gameState.mode === "blind" && val !== null && age >= 2 && gameState.status === "PLAYING" && !gameState.scannerActive;

        btn.innerHTML = createMarkSVG(val, isFogged);
        btn.disabled = gameState.status !== "PLAYING" || val !== null || isShielded;
        btn.setAttribute("aria-label", `Row ${Math.floor(i / gameState.size) + 1} Column ${(i % gameState.size) + 1}`);
        btn.addEventListener("click", () => handlePlayerAction({ player: gameState.turn, index: i, expectedMoveCount: gameState.moveCount }));
        gridEl.appendChild(btn);
      }
    }

    const logEl = document.getElementById("tt-move-log");
    if (gameState.history.length === 0) {
      logEl.innerHTML = `<div style="color:var(--text-muted);">Awaiting opening move...</div>`;
    } else {
      logEl.innerHTML = gameState.history.slice(-14).map(h => `<div class="tt-move-entry"><span>${h}</span></div>`).join("");
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  /* 10. HANDLE MOVES, LASER SWEEP, & AI RESPONSE */
  function handlePlayerAction(action) {
    if (!gameState || gameState.status !== "PLAYING") return;

    if (roomConfig.connected && roomConfig.role === "SPECTATOR") {
      audio.playError();
      return;
    }

    if (gameState.opp.startsWith("ai_") && gameState.turn === "O") return;

    applyMoveWithUI(action, false);
  }

  function applyMoveWithUI(action, fromNetwork) {
    const prevTurn = gameState.turn;
    const res = AuthoritativeEngine.validateAndApplyMove(gameState, action);
    if (!res.ok) {
      audio.playError();
      return;
    }

    if (typeof action.index === "number") {
      gameState.moveTimestamps[action.index] = gameState.moveCount;
      const r = Math.floor(action.index / gameState.size) + 1;
      const c = (action.index % gameState.size) + 1;
      gameState.history.push(`#${gameState.moveCount} [${prevTurn}] → R${r}:C${c}`);
    } else {
      gameState.history.push(`#${gameState.moveCount} [${prevTurn}] → M${action.macroIdx + 1}:C${action.microIdx + 1}`);
    }

    gameState.scannerActive = false;
    if (prevTurn === "X") audio.playMoveX();
    else audio.playMoveO();

    if (!fromNetwork && roomConfig.connected && bcChannel) {
      bcChannel.postMessage({ type: "MOVE_ACTION", roomCode: roomConfig.code, action });
    }
    if (!fromNetwork && roomConfig.connected && profile.firebaseUrl) {
      syncStateToFirebase();
    }

    renderArena();

    if (gameState.status === "FINISHED") {
      handleMatchEnd();
      return;
    }

    startTurnTimer();

    if (gameState.status === "PLAYING" && gameState.turn === "O" && gameState.opp.startsWith("ai_")) {
      setTimeout(() => {
        if (!gameState || gameState.status !== "PLAYING" || gameState.turn !== "O") return;
        const aiDiff = gameState.mode === "survival"
          ? (survivalWave <= 2 ? "ai_intermediate" : (survivalWave <= 4 ? "ai_advanced" : "ai_expert"))
          : gameState.opp;

        const choice = CyberAIEngine.chooseMove(gameState, aiDiff);
        if (choice !== null) {
          if (gameState.mode === "ultimate") {
            applyMoveWithUI({ player: "O", macroIdx: choice.macroIdx, microIdx: choice.microIdx, expectedMoveCount: gameState.moveCount }, false);
          } else {
            applyMoveWithUI({ player: "O", index: choice, expectedMoveCount: gameState.moveCount }, false);
          }
        }
      }, 280);
    }
  }

  function drawWinningLaser(line, size) {
    const svg = document.getElementById("tt-laser-svg");
    if (!line || line.length < 2) {
      svg.innerHTML = "";
      return;
    }
    const first = line[0];
    const last = line[line.length - 1];
    const cellSpan = 100 / size;
    const x1 = ((first % size) + 0.5) * cellSpan;
    const y1 = (Math.floor(first / size) + 0.5) * cellSpan;
    const x2 = ((last % size) + 0.5) * cellSpan;
    const y2 = (Math.floor(last / size) + 0.5) * cellSpan;

    svg.innerHTML = `<line class="tt-laser-beam" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }

  function handleMatchEnd() {
    clearInterval(timerInterval);
    const banner = document.getElementById("tt-match-banner");
    const msgEl = document.getElementById("tt-banner-msg");
    banner.classList.add("show");

    if (gameState.winner === "DRAW") {
      audio.playDraw();
      particles.triggerBurst("#00f0ff");
      msgEl.textContent = "⚖️ TACTICAL STALEMATE — DRAW!";
      profile.draws++;
    } else {
      audio.playWin();
      particles.triggerBurst("#ffd700");
      if (gameState.mode !== "ultimate") {
        drawWinningLaser(gameState.winLine, gameState.size);
      }
      msgEl.textContent = `🏆 PLAYER ${gameState.winner} CLAIMS VICTORY!`;

      if (gameState.winner === "X") {
        profile.wins++;
        profile.elo += 16;
        if (gameState.mode === "survival") {
          survivalWave++;
          if (survivalWave > profile.bestWave) profile.bestWave = survivalWave;
          msgEl.textContent = `🔥 WAVE ${survivalWave - 1} CLEARED! PREPARE FOR WAVE ${survivalWave}!`;
        }
        if (activeTournamentMatch) {
          advanceTournament(true);
          activeTournamentMatch = false;
        }
      } else {
        profile.losses++;
        profile.elo = Math.max(800, profile.elo - 12);
        if (gameState.mode === "survival") {
          survivalWave = 1;
        }
        if (activeTournamentMatch) {
          advanceTournament(false);
          activeTournamentMatch = false;
        }
      }
    }
    saveProfile();
    renderArena();
  }

  /* 11. TURN TIMER */
  function startTurnTimer() {
    clearInterval(timerInterval);
    const timerTxt = document.getElementById("tt-timer-txt");
    if (!gameState || gameState.turnTime <= 0 || gameState.status !== "PLAYING") {
      timerTxt.textContent = "∞";
      return;
    }
    gameState.timeLeft = gameState.turnTime;
    timerTxt.textContent = gameState.timeLeft.toFixed(1) + "s";

    timerInterval = setInterval(() => {
      if (!gameState || gameState.status !== "PLAYING") {
        clearInterval(timerInterval);
        return;
      }
      gameState.timeLeft = Math.max(0, gameState.timeLeft - 0.1);
      timerTxt.textContent = gameState.timeLeft.toFixed(1) + "s";
      if (gameState.timeLeft <= 0) {
        clearInterval(timerInterval);
        audio.playError();
        gameState.history.push(`⏰ TIMEOUT: ${gameState.turn} forfeited turn!`);
        gameState.turn = gameState.turn === "X" ? "O" : "X";
        renderArena();
        startTurnTimer();
        if (gameState.turn === "O" && gameState.opp.startsWith("ai_")) {
          const choice = CyberAIEngine.chooseMove(gameState, gameState.opp);
          if (choice !== null) applyMoveWithUI({ player: "O", index: choice, expectedMoveCount: gameState.moveCount }, false);
        }
      }
    }, 100);
  }

  /* 12. NEON REACTOR SIGNATURE ABILITIES */
  document.getElementById("tt-abi-scan").addEventListener("click", () => {
    if (!gameState || gameState.energy[gameState.turn] < 2) return;
    gameState.energy[gameState.turn] -= 2;
    gameState.scannerActive = true;
    audio.playAbility();
    gameState.history.push(`📡 [${gameState.turn}] activated SCANNER PULSE (-2⚡)`);
    renderArena();
  });

  document.getElementById("tt-abi-shield").addEventListener("click", () => {
    if (!gameState || gameState.energy[gameState.turn] < 3) return;
    const emptyCells = [];
    gameState.board.forEach((v, i) => { if (v === null) emptyCells.push(i); });
    if (emptyCells.length <= 1) return;
    gameState.energy[gameState.turn] -= 3;
    const oppMove = CyberAIEngine.chooseMove(gameState, "ai_expert");
    gameState.shieldedCell = oppMove !== null ? oppMove : emptyCells[0];
    audio.playAbility();
    gameState.history.push(`🛡️ [${gameState.turn}] deployed AEGIS SHIELD on cell #${gameState.shieldedCell + 1} (-3⚡)`);
    renderArena();
  });

  document.getElementById("tt-abi-oracle").addEventListener("click", () => {
    if (!gameState || gameState.energy[gameState.turn] < 4) return;
    gameState.energy[gameState.turn] -= 4;
    const best = CyberAIEngine.chooseMove(gameState, "ai_expert");
    gameState.hintCell = best;
    audio.playAbility();
    gameState.history.push(`🎯 [${gameState.turn}] invoked ORACLE VECTOR (-4⚡)`);
    renderArena();
  });

  /* 13. TOURNAMENT BRACKET SYSTEM */
  function renderTournament() {
    const container = document.getElementById("tt-bracket-container");
    tourneyState.qf[0].p1 = profile.callsign;
    container.innerHTML = `
      <div class="tt-bracket-col">
        <h4 class="tt-panel-title">QUARTERFINALS</h4>
        ${tourneyState.qf.map(m => `
          <div class="tt-match-box">
            <div class="tt-match-slot ${m.winner === m.p1 ? 'winner' : ''}"><span>${m.p1}</span><span>${m.winner === m.p1 ? 'WIN' : ''}</span></div>
            <div class="tt-match-slot ${m.winner === m.p2 ? 'winner' : ''}"><span>${m.p2}</span><span>${m.winner === m.p2 ? 'WIN' : ''}</span></div>
          </div>
        `).join("")}
      </div>
      <div class="tt-bracket-col">
        <h4 class="tt-panel-title">SEMIFINALS</h4>
        ${tourneyState.sf.map(m => `
          <div class="tt-match-box">
            <div class="tt-match-slot ${m.winner === m.p1 ? 'winner' : ''}"><span>${m.p1}</span><span>${m.winner === m.p1 ? 'WIN' : ''}</span></div>
            <div class="tt-match-slot ${m.winner === m.p2 ? 'winner' : ''}"><span>${m.p2}</span><span>${m.winner === m.p2 ? 'WIN' : ''}</span></div>
          </div>
        `).join("")}
      </div>
      <div class="tt-bracket-col">
        <h4 class="tt-panel-title">GRAND FINALS</h4>
        ${tourneyState.final.map(m => `
          <div class="tt-match-box" style="border-color:var(--neon-gold);">
            <div class="tt-match-slot ${m.winner === m.p1 ? 'winner' : ''}"><span>${m.p1}</span><span>${m.winner === m.p1 ? '🏆 CHAMP' : ''}</span></div>
            <div class="tt-match-slot ${m.winner === m.p2 ? 'winner' : ''}"><span>${m.p2}</span><span>${m.winner === m.p2 ? '🏆 CHAMP' : ''}</span></div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function advanceTournament(playerWon) {
    if (tourneyState.round === 0) {
      tourneyState.qf[0].winner = playerWon ? profile.callsign : "DROID_ALPHA";
      tourneyState.sf[0].p1 = tourneyState.qf[0].winner;
      if (playerWon) tourneyState.round = 1;
    } else if (tourneyState.round === 1) {
      tourneyState.sf[0].winner = playerWon ? profile.callsign : "VORTEX_AI";
      tourneyState.final[0].p1 = tourneyState.sf[0].winner;
      if (playerWon) tourneyState.round = 2;
    } else if (tourneyState.round === 2) {
      tourneyState.final[0].winner = playerWon ? profile.callsign : "OMEGA_CORE";
      if (playerWon) {
        tourneyState.round = 3;
        profile.elo += 35;
        saveProfile();
      }
    }
    renderTournament();
  }

  document.getElementById("tt-btn-play-tourney-match").addEventListener("click", () => {
    if (tourneyState.round >= 3) {
      tourneyState.round = 0;
    }
    activeTournamentMatch = true;
    document.getElementById("tt-sel-mode").value = "classic";
    document.getElementById("tt-sel-opp").value = tourneyState.round === 0 ? "ai_intermediate" : (tourneyState.round === 1 ? "ai_advanced" : "ai_expert");
    switchView("arena");
    startNewMatch();
  });

  document.getElementById("tt-btn-reset-tourney").addEventListener("click", () => {
    tourneyState.round = 0;
    tourneyState.qf[0].winner = null;
    tourneyState.sf[0].p1 = "TBD";
    tourneyState.sf[0].winner = null;
    tourneyState.final[0].p1 = "TBD";
    tourneyState.final[0].winner = null;
    renderTournament();
  });

  /* 14. PROFILE & AUTHENTIC LEADERBOARD */
  function renderProfileAndStats() {
    document.getElementById("tt-welcome-callsign").textContent = `WELCOME, ${profile.callsign}`;
    document.getElementById("tt-input-callsign").value = profile.callsign;
    document.getElementById("st-elo").textContent = profile.elo;
    document.getElementById("st-wins").textContent = profile.wins;
    document.getElementById("st-losses").textContent = profile.losses;
    document.getElementById("st-draws").textContent = profile.draws;
    document.getElementById("st-survival").textContent = `Wave ${profile.bestWave}`;

    const entries = [
      { name: `${profile.callsign} (YOU)`, elo: profile.elo, badge: "VERIFIED PLAYER", you: true },
      { name: "ALPHA-BETA CORE [AI TIER 4]", elo: 1650, badge: "OPTIMAL MINIMAX BENCHMARK" },
      { name: "NEURAL CORE [AI TIER 3]", elo: 1420, badge: "ADVANCED AI BENCHMARK" },
      { name: "TACTICAL BOT [AI TIER 2]", elo: 1180, badge: "INTERMEDIATE AI BENCHMARK" },
      { name: "ROOKIE DRONE [AI TIER 1]", elo: 950, badge: "BEGINNER AI BENCHMARK" }
    ].sort((a, b) => b.elo - a.elo);

    const lbEl = document.getElementById("tt-leaderboard-list");
    lbEl.innerHTML = entries.map((e, idx) => `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;border-radius:8px;background:${e.you ? 'rgba(0,240,255,0.14)' : 'rgba(255,255,255,0.03)'};border:1px solid ${e.you ? 'var(--neon-x)' : 'rgba(255,255,255,0.08)'};">
        <div>
          <strong style="font-family:var(--font-display);font-size:12.5px;">#${idx + 1} ${e.name}</strong>
          <div style="font-size:10.5px;color:var(--text-muted);">${e.badge}</div>
        </div>
        <div style="font-family:var(--font-mono);font-size:14px;color:var(--neon-gold);font-weight:700;">${e.elo} ELO</div>
      </div>
    `).join("");
  }

  /* 15. ONLINE MULTIPLAYER ROOMS */
  async function syncStateToFirebase() {
    if (!profile.firebaseUrl || !roomConfig.connected || !gameState) return;
    try {
      const cleanUrl = profile.firebaseUrl.replace(/\/$/, "");
      await fetch(`${cleanUrl}/rooms/${encodeURIComponent(roomConfig.code)}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: gameState,
          hash: AuthoritativeEngine.computeHash(gameState),
          updatedAt: Date.now()
        })
      });
    } catch (e) {}
  }

  document.getElementById("tt-btn-connect-room").addEventListener("click", () => {
    const code = document.getElementById("tt-room-code-input").value.trim().toUpperCase() || "NEON-77";
    const role = document.getElementById("tt-room-role").value;
    roomConfig = { connected: true, code, role };
    document.getElementById("tt-net-pill").textContent = `● ROOM: ${code} (${role})`;
    document.getElementById("tt-mp-feedback").textContent = `Connected to Room [${code}] as ${role}. Open another browser tab on this page and connect with the same code to test real-time P2P sync!`;
    document.getElementById("tt-sel-opp").value = "online";
    audio.playAbility();
  });

  document.getElementById("tt-btn-gen-code").addEventListener("click", () => {
    const rnd = "CYBER-" + Math.floor(1000 + Math.random() * 9000);
    document.getElementById("tt-room-code-input").value = rnd;
  });

  document.getElementById("tt-btn-copy-invite").addEventListener("click", () => {
    const code = document.getElementById("tt-room-code-input").value.trim();
    if (navigator.clipboard) navigator.clipboard.writeText(`Join my TICTOCKIE Cyber Room! Code: ${code}`);
    document.getElementById("tt-mp-feedback").textContent = `Room invite [${code}] copied to clipboard!`;
  });

  document.getElementById("tt-btn-disconnect-room").addEventListener("click", () => {
    roomConfig.connected = false;
    document.getElementById("tt-net-pill").textContent = "● SYNC READY";
    document.getElementById("tt-mp-feedback").textContent = "Disconnected from room.";
  });

  /* 16. AUTOMATED UNIT & INTEGRATION TEST SUITE (12 LIVE TESTS) */
  function runAutomatedTests() {
    const logs = [];
    let passed = 0;
    function assert(name, condition) {
      if (condition) {
        passed++;
        logs.push(`<div style="color:var(--neon-green);">✔ PASS: ${name}</div>`);
      } else {
        logs.push(`<div style="color:var(--neon-o);">✘ FAIL: ${name}</div>`);
      }
    }

    const st1 = { mode: "classic", size: 3, winLen: 3, board: Array(9).fill(null), turn: "X", moveCount: 0, status: "PLAYING" };
    const r1 = AuthoritativeEngine.validateAndApplyMove(st1, { player: "X", index: 4, expectedMoveCount: 0 });
    assert("1. Legal opening move mutates board & advances turn", r1.ok && st1.board[4] === "X" && st1.turn === "O");

    const r2 = AuthoritativeEngine.validateAndApplyMove(st1, { player: "O", index: 4, expectedMoveCount: 1 });
    assert("2. Occupied cell overwrite is rejected", !r2.ok && r2.reason === "CELL_OCCUPIED");

    const r3 = AuthoritativeEngine.validateAndApplyMove(st1, { player: "X", index: 0, expectedMoveCount: 1 });
    assert("3. Out-of-turn action is rejected", !r3.ok && r3.reason === "OUT_OF_TURN_ACTION");

    const r4 = AuthoritativeEngine.validateAndApplyMove(st1, { player: "O", index: 0, expectedMoveCount: 0 });
    assert("4. Stale/duplicate turn packet is rejected", !r4.ok && r4.reason === "STALE_TURN_SUBMISSION");

    const winBoard = ["X", "X", "X", "O", "O", null, null, null, null];
    const wRes = AuthoritativeEngine.checkStandardWinner(winBoard, 3, 3);
    assert("5. 3x3 Horizontal win detection & laser line indices", wRes && wRes.winner === "X" && wRes.line.join(",") === "0,1,2");

    const drawBoard = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];
    const dRes = AuthoritativeEngine.checkStandardWinner(drawBoard, 3, 3);
    assert("6. 3x3 Stalemate draw detection", dRes && dRes.winner === "DRAW");

    const mega5 = Array(25).fill(null);
    [0, 6, 12, 18].forEach(i => mega5[i] = "O");
    const m5Res = AuthoritativeEngine.checkStandardWinner(mega5, 5, 4);
    assert("7. Mega Grid 5x5 diagonal 4-in-a-row detection", m5Res && m5Res.winner === "O");

    const aiWinState = { mode: "classic", size: 3, winLen: 3, board: ["O", "O", null, "X", "X", null, null, null, null], turn: "O", shieldedCell: null };
    const aiChoice1 = CyberAIEngine.chooseMove(aiWinState, "ai_expert");
    assert("8. Expert Alpha-Beta AI selects immediate winning cell (idx 2)", aiChoice1 === 2);

    const aiBlockState = { mode: "classic", size: 3, winLen: 3, board: ["X", "X", null, null, "O", null, null, null, null], turn: "O", shieldedCell: null };
    const aiChoice2 = CyberAIEngine.chooseMove(aiBlockState, "ai_expert");
    assert("9. Expert Alpha-Beta AI blocks opponent winning threat (idx 2)", aiChoice2 === 2);

    const ultState = {
      mode: "ultimate",
      ultimateBoards: Array.from({ length: 9 }, () => Array(9).fill(null)),
      ultimateMacro: Array(9).fill(null),
      activeMacro: null,
      turn: "X",
      moveCount: 0,
      status: "PLAYING"
    };
    AuthoritativeEngine.validateAndApplyMove(ultState, { player: "X", macroIdx: 4, microIdx: 2, expectedMoveCount: 0 });
    const wrongSector = AuthoritativeEngine.validateAndApplyMove(ultState, { player: "O", macroIdx: 0, microIdx: 0, expectedMoveCount: 1 });
    assert("10. Ultimate TTT routes next player to macro #2 & rejects wrong sector", ultState.activeMacro === 2 && !wrongSector.ok);

    const reactState = {
      mode: "reactor", size: 3, winLen: 3, board: Array(9).fill(null),
      reactorEnabled: true, reactorNodes: [1, 3, 5, 7], energy: { X: 2, O: 2 },
      shieldedCell: 8, turn: "X", moveCount: 0, status: "PLAYING"
    };
    const shieldReject = AuthoritativeEngine.validateAndApplyMove(reactState, { player: "X", index: 8, expectedMoveCount: 0 });
    AuthoritativeEngine.validateAndApplyMove(reactState, { player: "X", index: 1, expectedMoveCount: 0 });
    assert("11. Neon Reactor blocks shielded cell & grants +2⚡ on Reactor Node", !shieldReject.ok && reactState.energy.X === 4);

    const h1 = AuthoritativeEngine.computeHash(reactState);
    const h2 = AuthoritativeEngine.computeHash(reactState);
    assert("12. FNV-1a state hash is deterministic and non-empty", h1 === h2 && h1.length === 9);

    logs.unshift(`<div style="margin-bottom:8px;color:#fff;font-weight:700;">TEST SUMMARY: ${passed} / 12 PASSED</div>`);
    document.getElementById("tt-test-output").innerHTML = logs.join("");
    audio.playWin();
  }

  /* 17. EVENT LISTENERS & UI BINDINGS */
  document.querySelectorAll(".tt-nav-btn[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      const v = btn.getAttribute("data-view");
      switchView(v);
      if (v === "tournament") renderTournament();
      if (v === "stats") renderProfileAndStats();
    });
  });

  document.getElementById("tt-brand-home").addEventListener("click", () => switchView("home"));

  document.getElementById("tt-quick-daily").addEventListener("click", () => {
    document.getElementById("tt-sel-mode").value = "daily";
    switchView("arena");
    startNewMatch();
  });

  document.getElementById("tt-quick-reactor").addEventListener("click", () => {
    document.getElementById("tt-sel-mode").value = "reactor";
    switchView("arena");
    startNewMatch();
  });

  document.getElementById("tt-sel-mode").addEventListener("change", () => startNewMatch());
  document.getElementById("tt-sel-opp").addEventListener("change", () => startNewMatch());
  document.getElementById("tt-custom-size").addEventListener("change", () => startNewMatch());
  document.getElementById("tt-custom-win").addEventListener("change", () => startNewMatch());
  document.getElementById("tt-btn-newgame").addEventListener("click", () => startNewMatch());
  document.getElementById("tt-btn-rematch").addEventListener("click", () => startNewMatch());

  document.getElementById("tt-btn-forfeit").addEventListener("click", () => {
    if (!gameState || gameState.status !== "PLAYING") return;
    gameState.status = "FINISHED";
    gameState.winner = gameState.turn === "X" ? "O" : "X";
    gameState.history.push(`🏳️ [${gameState.turn}] forfeited the match.`);
    handleMatchEnd();
  });

  document.getElementById("tt-btn-fullscreen").addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        document.getElementById("tictockie-app").classList.toggle("tt-fullscreen");
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    setTimeout(() => particles.resize(), 100);
  });

  document.getElementById("tt-btn-save-profile").addEventListener("click", () => {
    const val = document.getElementById("tt-input-callsign").value.trim().toUpperCase();
    if (val) profile.callsign = val;
    saveProfile();
    audio.playAbility();
  });

  document.getElementById("tt-btn-reset-stats").addEventListener("click", () => {
    profile = Object.assign({}, defaultStats);
    saveProfile();
  });

  document.getElementById("tt-set-fx").addEventListener("change", (e) => {
    const mode = e.target.value;
    document.getElementById("tictockie-app").setAttribute("data-fx", mode);
    particles.enabled = mode !== "off";
  });

  document.getElementById("tt-set-motion").addEventListener("change", (e) => {
    document.getElementById("tictockie-app").setAttribute("data-motion", e.target.value);
  });

  document.getElementById("tt-set-sfx").addEventListener("change", (e) => {
    audio.sfxEnabled = e.target.value === "on";
  });

  document.getElementById("tt-set-music").addEventListener("change", (e) => {
    audio.toggleMusic(e.target.value === "on");
  });

  document.getElementById("tt-set-lang").addEventListener("change", (e) => {
    const dict = I18N[e.target.value] || I18N.en;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });
  });

  document.getElementById("tt-set-firebase").addEventListener("change", (e) => {
    profile.firebaseUrl = e.target.value.trim();
    saveProfile();
  });

  document.getElementById("tt-btn-run-tests").addEventListener("click", runAutomatedTests);

  window.addEventListener("offline", () => {
    const pill = document.getElementById("tt-net-pill");
    pill.textContent = "● OFFLINE (LOCAL MODE)";
    pill.className = "tt-pill offline";
  });
  window.addEventListener("online", () => {
    const pill = document.getElementById("tt-net-pill");
    pill.textContent = "● SYNC READY";
    pill.className = "tt-pill";
  });

  renderHomeCards();
  renderProfileAndStats();
  renderTournament();
  startNewMatch();
})();
