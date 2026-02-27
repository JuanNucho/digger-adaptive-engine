/* engine.js — Signal Mine (Gold-digger CAT Reading)
   - Arrow/WASD movement
   - Mouse click dig
   - Shop + upgrades (shovel, dynamite, ping)
   - CAT difficulty selection + weak-skill targeting
   - Auto-save to localStorage
*/

(() => {
  // ---------- DOM ----------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const elGold = document.getElementById("gold");
  const elShovel = document.getElementById("shovelLevel");
  const elDyn = document.getElementById("dynamite");
  const elCat = document.getElementById("catLevel");
  const elAcc = document.getElementById("acc");

  const elQCount = document.getElementById("qCount");
  const elQCorrect = document.getElementById("qCorrect");
  const elMiScore = document.getElementById("miScore");
  const elEvScore = document.getElementById("evScore");
  const elTarget = document.getElementById("targetBox");

  const btnHelp = document.getElementById("btnHelp");
  const btnShop = document.getElementById("btnShop");
  const btnReset = document.getElementById("btnReset");

  // Question modal
  const modal = document.getElementById("modal");
  const mClose = document.getElementById("mClose");
  const mTitle = document.getElementById("mTitle");
  const mSkill = document.getElementById("mSkill");
  const mDiff = document.getElementById("mDiff");
  const mPassage = document.getElementById("mPassage");
  const mQuestion = document.getElementById("mQuestion");
  const mChoices = document.getElementById("mChoices");
  const mSubmit = document.getElementById("mSubmit");
  const mNext = document.getElementById("mNext");
  const mFeedback = document.getElementById("mFeedback");

  // Shop modal
  const shop = document.getElementById("shop");
  const sClose = document.getElementById("sClose");
  const buyShovel = document.getElementById("buyShovel");
  const buyDynamite = document.getElementById("buyDynamite");
  const buyPing = document.getElementById("buyPing");
  const elShovelCost = document.getElementById("shovelCost");

  // Help modal
  const help = document.getElementById("help");
  const hClose = document.getElementById("hClose");

  // ---------- CONSTANTS ----------
  const SAVE_KEY = "signal_mine_save_v1";

  const GRID_W = 24;
  const GRID_H = 18;
  const TILE = 30;

  // Tile types (hidden until dug)
  const TILE_HIDDEN = 0;
  const TILE_DIRT = 1;        // empty dug
  const TILE_ORE = 2;         // gold
  const TILE_QNODE = 3;       // question node

  // ---------- STATE ----------
  const defaultState = () => ({
    // player
    px: 2,
    py: 2,

    // economy
    gold: 10,
    shovelLevel: 1,
    dynamite: 0,

    // CAT stats
    catLevel: 2.0,         // 1.0..5.0
    answered: 0,
    correct: 0,
    streak: 0,
    wrongStreak: 0,

    skillStats: {
      mainIdea: { answered: 0, correct: 0 },
      evidence: { answered: 0, correct: 0 }
    },

    // map
    tiles: [],             // discovered state (hidden/dug)
    contents: [],          // what's inside (ore/qnode)
    depth: 1,

    // question tracking
    usedQuestionIds: {},
    currentQuestion: null,

    // ping direction
    lastPing: null
  });

  let S = load() ?? initFresh();

  function initFresh() {
    const s = defaultState();
    generateMine(s);
    save(s);
    return s;
  }

  function save(state) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // ---------- MINE GENERATION ----------
  function generateMine(state) {
    state.tiles = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(TILE_HIDDEN));
    state.contents = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(TILE_DIRT));

    // carve a small starting area
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const dist = Math.abs(x - state.px) + Math.abs(y - state.py);
        if (dist <= 2) state.tiles[y][x] = TILE_DIRT;
      }
    }

    // place ore + qnodes with probability influenced by shovelLevel and depth
    const baseOre = 0.10;
    const baseQ = 0.06;

    const qBoost = Math.min(0.05, (state.shovelLevel - 1) * 0.01); // better shovel finds more qnodes
    const depthBoost = Math.min(0.05, (state.depth - 1) * 0.01);

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        // don't overwrite starting zone
        const dist = Math.abs(x - state.px) + Math.abs(y - state.py);
        if (dist <= 2) continue;

        const r = Math.random();
        const pQ = baseQ + qBoost + depthBoost;
        const pOre = baseOre + depthBoost;

        if (r < pQ) state.contents[y][x] = TILE_QNODE;
        else if (r < pQ + pOre) state.contents[y][x] = TILE_ORE;
        else state.contents[y][x] = TILE_DIRT;
      }
    }

    state.lastPing = null;
  }

  // ---------- INPUT ----------
  const keys = new Set();

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys.add(k);

    if (k === "e") toggleShop();
    if (k === "d") useDynamite();
    if (k === "escape") closeAllModals();
  });

  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

  canvas.addEventListener("click", (e) => {
    if (isAnyModalOpen()) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    const tx = Math.floor(mx / TILE);
    const ty = Math.floor(my / TILE);

    // only allow digging adjacent (or same tile) to player
    const d = Math.abs(tx - S.px) + Math.abs(ty - S.py);
    if (d <= 1) dig(tx, ty);
  });

  // ---------- UI BUTTONS ----------
  btnHelp.onclick = () => openModal(help);
  hClose.onclick = () => closeModal(help);

  btnShop.onclick = () => toggleShop();
  sClose.onclick = () => closeModal(shop);

  btnReset.onclick = () => {
    localStorage.removeItem(SAVE_KEY);
    S = initFresh();
    renderHUD();
  };

  buyShovel.onclick = () => {
    const cost = shovelUpgradeCost();
    if (S.gold < cost) return flashTarget("Not enough gold for shovel upgrade.");
    S.gold -= cost;
    S.shovelLevel += 1;
    S.depth += 1; // unlock deeper mine generation feeling
    generateMine(S); // new mine layer
    flashTarget(`Upgraded shovel to Level ${S.shovelLevel}. New layer opened!`);
    save(S);
    renderHUD();
  };

  buyDynamite.onclick = () => {
    if (S.gold < 15) return flashTarget("Not enough gold for dynamite.");
    S.gold -= 15;
    S.dynamite += 1;
    save(S);
    renderHUD();
  };

  buyPing.onclick = () => {
    if (S.gold < 10) return flashTarget("Not enough gold for ping.");
    S.gold -= 10;
    doPing();
    save(S);
    renderHUD();
  };

  // ---------- GAME LOOP ----------
  let lastMove = 0;
  function tick(ts) {
    if (!isAnyModalOpen()) {
      if (ts - lastMove > 110) {
        const moved = handleMove();
        if (moved) lastMove = ts;
      }
    }

    draw();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function handleMove() {
    let dx = 0, dy = 0;
    if (keys.has("arrowup") || keys.has("w")) dy = -1;
    else if (keys.has("arrowdown") || keys.has("s")) dy = 1;
    else if (keys.has("arrowleft") || keys.has("a")) dx = -1;
    else if (keys.has("arrowright") || keys.has("d")) dx = 1; // note: "d" is dynamite too; arrow keys recommended
    // prevent conflict: if "d" pressed and not moving with arrows, dynamite already triggered on keydown
    if (dx === 0 && dy === 0) return false;

    const nx = clamp(S.px + dx, 0, GRID_W - 1);
    const ny = clamp(S.py + dy, 0, GRID_H - 1);

    // allow movement only on revealed/dug tiles
    if (S.tiles[ny][nx] !== TILE_HIDDEN) {
      S.px = nx;
      S.py = ny;
      save(S);
      return true;
    }
    return false;
  }

  // ---------- DIGGING ----------
  function dig(x, y) {
    if (S.tiles[y][x] !== TILE_HIDDEN) return;

    const cost = digCost();
    if (S.gold < cost) {
      flashTarget("You’re broke. Mine ore or answer questions to earn gold.");
      return;
    }

    S.gold -= cost;

    // reveal
    S.tiles[y][x] = S.contents[y][x];

    // rewards
    if (S.tiles[y][x] === TILE_ORE) {
      const oreValue = 6 + Math.floor(Math.random() * 6) + Math.floor(S.depth * 0.5);
      S.gold += oreValue;
      flashTarget(`Ore found! +${oreValue} gold.`);
    } else if (S.tiles[y][x] === TILE_QNODE) {
      flashTarget("📘 Question node found! Answer to earn rewards.");
      openQuestion();
    }

    save(S);
    renderHUD();
  }

  function digCost() {
    // higher shovel reduces cost
    return Math.max(1, 3 - Math.floor((S.shovelLevel - 1) / 2));
  }

  function shovelUpgradeCost() {
    // grows with level
    return 25 + (S.shovelLevel - 1) * 15;
  }

  // ---------- DYNAMITE ----------
  function useDynamite() {
    if (isAnyModalOpen()) return;
    if (S.dynamite <= 0) return flashTarget("No dynamite. Buy some in the shop.");
    S.dynamite -= 1;

    // clear 3x3 centered on player (reveal + apply effects)
    for (let yy = S.py - 1; yy <= S.py + 1; yy++) {
      for (let xx = S.px - 1; xx <= S.px + 1; xx++) {
        if (xx < 0 || yy < 0 || xx >= GRID_W || yy >= GRID_H) continue;
        if (S.tiles[yy][xx] === TILE_HIDDEN) {
          S.tiles[yy][xx] = S.contents[yy][xx];
          if (S.tiles[yy][xx] === TILE_ORE) {
            const oreValue = 4 + Math.floor(Math.random() * 6);
            S.gold += oreValue;
          }
        }
      }
    }

    flashTarget("💥 Boom! Area cleared.");
    save(S);
    renderHUD();

    // if any qnode revealed, auto-open one
    const q = findNearestRevealedQnode();
    if (q) openQuestion();
  }

  function findNearestRevealedQnode() {
    let best = null, bestD = 1e9;
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (S.tiles[y][x] === TILE_QNODE) {
          const d = Math.abs(x - S.px) + Math.abs(y - S.py);
          if (d < bestD) { bestD = d; best = { x, y }; }
        }
      }
    }
    return best;
  }

  // ---------- PING ----------
  function doPing() {
    // find nearest hidden tile that contains qnode
    let best = null, bestD = 1e9;
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (S.tiles[y][x] === TILE_HIDDEN && S.contents[y][x] === TILE_QNODE) {
          const d = Math.abs(x - S.px) + Math.abs(y - S.py);
          if (d < bestD) { bestD = d; best = { x, y }; }
        }
      }
    }
    if (!best) {
      S.lastPing = null;
      flashTarget("No question nodes detected (this layer is wild).");
      return;
    }

    const dx = best.x - S.px;
    const dy = best.y - S.py;

    const dir = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? "➡️ Right" : "⬅️ Left")
      : (dy > 0 ? "⬇️ Down" : "⬆️ Up");

    S.lastPing = { dir, dist: bestD };
    flashTarget(`🗺️ Ping: Nearest question node is ${dir} (≈ ${bestD} steps).`);
  }

  // ---------- CAT QUESTION SELECTION ----------
  function chooseSkillTarget() {
    const mi = S.skillStats.mainIdea;
    const ev = S.skillStats.evidence;

    const miAcc = mi.answered ? mi.correct / mi.answered : 1;
    const evAcc = ev.answered ? ev.correct / ev.answered : 1;

    // target weaker skill; tie-break random
    if (miAcc < evAcc) return "mainIdea";
    if (evAcc < miAcc) return "evidence";
    return Math.random() < 0.5 ? "mainIdea" : "evidence";
  }

  function targetDifficulty() {
    // streak-based nudges
    let t = S.catLevel;
    if (S.streak >= 2) t += 0.6;
    if (S.wrongStreak >= 1) t -= 0.6;
    return clamp(t, 1, 5);
  }

  function pickQuestion() {
    const skill = chooseSkillTarget();
    const td = targetDifficulty();

    // filter unused
    const candidates = window.QUESTION_BANK
      .filter(q => q.skill === skill)
      .filter(q => !S.usedQuestionIds[q.id]);

    // fallback if ran out
    const pool = candidates.length ? candidates : window.QUESTION_BANK.filter(q => q.skill === skill);

    // choose closest difficulty
    let best = null, bestGap = 1e9;
    for (const q of pool) {
      const gap = Math.abs(q.difficulty - td);
      if (gap < bestGap) { bestGap = gap; best = q; }
    }

    // if still null, just grab any
    return best ?? window.QUESTION_BANK[Math.floor(Math.random() * window.QUESTION_BANK.length)];
  }

  // ---------- QUESTION MODAL ----------
  let selectedIndex = null;

  function openQuestion() {
    const q = pickQuestion();
    S.currentQuestion = q;
    selectedIndex = null;

    mTitle.textContent = "📘 Question Node";
    mSkill.textContent = q.skill === "mainIdea" ? "Main Idea" : "Evidence";
    mDiff.textContent = `Difficulty ${q.difficulty}`;
    mPassage.textContent = q.passage;
    mQuestion.textContent = q.question;

    mChoices.innerHTML = "";
    q.choices.forEach((c, idx) => {
      const div = document.createElement("div");
      div.className = "choice";
      div.textContent = `${String.fromCharCode(65 + idx)}. ${c}`;
      div.onclick = () => {
        [...mChoices.children].forEach(n => n.classList.remove("selected"));
        div.classList.add("selected");
        selectedIndex = idx;
      };
      mChoices.appendChild(div);
    });

    mFeedback.classList.add("hidden");
    mFeedback.classList.remove("good", "bad");
    mSubmit.classList.remove("hidden");
    mNext.classList.add("hidden");

    openModal(modal);
  }

  mClose.onclick = () => closeModal(modal);

  mSubmit.onclick = () => {
    const q = S.currentQuestion;
    if (!q) return;
    if (selectedIndex === null) return flashFeedback("Pick an answer first.", false);

    const correct = selectedIndex === q.answerIndex;
    gradeQuestion(q, correct);

    mSubmit.classList.add("hidden");
    mNext.classList.remove("hidden");

    // feedback UI
    if (correct) {
      flashFeedback(`✅ Correct. +${rewardGold(q, true)} gold.\n\n${q.explanation}`, true);
    } else {
      flashFeedback(`❌ Not quite. Correct answer: ${String.fromCharCode(65 + q.answerIndex)}.\n\n${q.explanation}`, false);
    }

    save(S);
    renderHUD();
  };

  mNext.onclick = () => {
    closeModal(modal);
    S.currentQuestion = null;
    save(S);
  };

  function flashFeedback(text, good) {
    mFeedback.textContent = text;
    mFeedback.classList.remove("hidden");
    mFeedback.classList.toggle("good", !!good);
    mFeedback.classList.toggle("bad", !good);
  }

  function gradeQuestion(q, isCorrect) {
    S.answered += 1;
    if (isCorrect) S.correct += 1;

    // skill stats
    const ss = S.skillStats[q.skill];
    ss.answered += 1;
    if (isCorrect) ss.correct += 1;

    // streaks
    if (isCorrect) { S.streak += 1; S.wrongStreak = 0; }
    else { S.wrongStreak += 1; S.streak = 0; }

    // CAT update (simple rating adjustment)
    const diffFactor = q.difficulty / 5;
    if (isCorrect) S.catLevel += 0.20 + 0.18 * diffFactor;
    else S.catLevel -= 0.28 + 0.22 * diffFactor;
    S.catLevel = clamp(S.catLevel, 1, 5);

    // mark used (prevents repeats until exhausted)
    S.usedQuestionIds[q.id] = true;

    // rewards
    const gain = rewardGold(q, isCorrect);
    S.gold += gain;
  }

  function rewardGold(q, isCorrect) {
    // reward scales with difficulty; wrong still gives small reward to keep engagement
    const base = 6 + Math.floor(q.difficulty * 3);
    return isCorrect ? base : Math.max(2, Math.floor(base * 0.35));
  }

  // ---------- MODALS ----------
  function openModal(el) {
    closeAllModals();
    el.classList.remove("hidden");
  }
  function closeModal(el) {
    el.classList.add("hidden");
  }
  function closeAllModals() {
    modal.classList.add("hidden");
    shop.classList.add("hidden");
    help.classList.add("hidden");
  }
  function isAnyModalOpen() {
    return !modal.classList.contains("hidden")
      || !shop.classList.contains("hidden")
      || !help.classList.contains("hidden");
  }
  function toggleShop() {
    if (!shop.classList.contains("hidden")) closeModal(shop);
    else openModal(shop);
    renderHUD();
  }

  // ---------- RENDER ----------
  function renderHUD() {
    elGold.textContent = S.gold;
    elShovel.textContent = S.shovelLevel;
    elDyn.textContent = S.dynamite;
    elCat.textContent = S.catLevel.toFixed(1);

    const acc = S.answered ? Math.round((S.correct / S.answered) * 100) : 0;
    elAcc.textContent = `${acc}%`;

    elQCount.textContent = S.answered;
    elQCorrect.textContent = S.correct;

    const mi = S.skillStats.mainIdea;
    const ev = S.skillStats.evidence;
    const miAcc = mi.answered ? Math.round((mi.correct / mi.answered) * 100) : 0;
    const evAcc = ev.answered ? Math.round((ev.correct / ev.answered) * 100) : 0;
    elMiScore.textContent = `${miAcc}%`;
    elEvScore.textContent = `${evAcc}%`;

    elShovelCost.textContent = shovelUpgradeCost();

    if (S.lastPing) {
      elTarget.textContent = `🗺️ Ping: Nearest question node is ${S.lastPing.dir} (≈ ${S.lastPing.dist} steps).`;
    } else {
      elTarget.textContent = "Dig around to find a question node 📘. Buy a Scanner Ping in the shop to locate one.";
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background grid
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        drawTile(x, y, S.tiles[y][x], S.contents[y][x]);
      }
    }

    // player
    const cx = S.px * TILE + TILE / 2;
    const cy = S.py * TILE + TILE / 2;

    // glow
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(96,165,250,.18)";
    ctx.fill();

    // body
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.fill();

    // outline
    ctx.strokeStyle = "rgba(96,165,250,.7)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // legend
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = "12px Segoe UI";
    ctx.fillText("Click adjacent tile to dig", 10, canvas.height - 10);
  }

  function drawTile(x, y, visibleType, hiddenContent) {
    const px = x * TILE;
    const py = y * TILE;

    // base
    ctx.fillStyle = "rgba(10,14,25,1)";
    ctx.fillRect(px, py, TILE, TILE);

    // hidden rock
    if (visibleType === TILE_HIDDEN) {
      ctx.fillStyle = "rgba(15,23,42,1)";
      ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);

      // rock specks
      ctx.fillStyle = "rgba(148,163,184,.12)";
      ctx.fillRect(px + 6, py + 10, 4, 3);
      ctx.fillRect(px + 16, py + 18, 5, 3);
      ctx.fillRect(px + 10, py + 22, 3, 2);
      return;
    }

    // dug dirt
    ctx.fillStyle = "rgba(30,41,59,.9)";
    ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);

    if (visibleType === TILE_ORE) {
      // ore
      ctx.fillStyle = "rgba(251,191,36,.95)";
      ctx.beginPath();
      ctx.arc(px + 10, py + 12, 4, 0, Math.PI * 2);
      ctx.arc(px + 18, py + 18, 3, 0, Math.PI * 2);
      ctx.arc(px + 14, py + 22, 2.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (visibleType === TILE_QNODE) {
      // question node book icon
      ctx.fillStyle = "rgba(96,165,250,.95)";
      ctx.fillRect(px + 8, py + 7, 14, 16);
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.fillRect(px + 10, py + 10, 10, 2);
      ctx.fillRect(px + 10, py + 14, 10, 2);
      ctx.fillRect(px + 10, py + 18, 8, 2);
    }

    // subtle border
    ctx.strokeStyle = "rgba(255,255,255,.05)";
    ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
  }

  // ---------- UTIL ----------
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function flashTarget(text) {
    elTarget.textContent = text;
    elTarget.style.boxShadow = "0 0 0 2px rgba(52,211,153,.15) inset";
    setTimeout(() => (elTarget.style.boxShadow = "none"), 650);
  }

  // ---------- INIT ----------
  renderHUD();
})();
