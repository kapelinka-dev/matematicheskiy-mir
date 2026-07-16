(() => {
  "use strict";

  const STORAGE_KEY = "mathWorldProgress_v1";
  const ROUND_SIZE = 10;
  const PRIZE_EVERY = 10;

  const OPS = {
    add: { id: "add", label: "Сложение", symbol: "+" },
    sub: { id: "sub", label: "Вычитание", symbol: "−" },
    mul: { id: "mul", label: "Умножение", symbol: "×" },
    div: { id: "div", label: "Деление", symbol: "÷" },
  };

  const PRIZE_CATALOG = {
    candy: {
      id: "candy",
      label: "Конфетка",
      items: ["🍬", "🍭", "🍡", "🧁"],
      names: ["Конфетка", "Леденец", "Сладость", "Кексик"],
    },
    star: {
      id: "star",
      label: "Звёздочка",
      items: ["⭐", "🌟", "✨", "💫"],
      names: ["Звёздочка", "Звезда", "Блёстка", "Космозвёздка"],
    },
    berry: {
      id: "berry",
      label: "Ягодка",
      items: ["🍓", "🫐", "🍒", "🍇"],
      names: ["Клубничка", "Черничка", "Вишенка", "Виноградинка"],
    },
    fruit: {
      id: "fruit",
      label: "Фрукт",
      items: ["🍎", "🍊", "🍌", "🍑"],
      names: ["Яблочко", "Апельсинчик", "Бананик", "Персик"],
    },
    chocolate: {
      id: "chocolate",
      label: "Шоколадка",
      items: ["🍫", "🍪", "🍩", "🧇"],
      names: ["Шоколадка", "Печенька", "Пончик", "Вафелька"],
    },
    surprise: {
      id: "surprise",
      label: "Сюрприз",
      items: ["🎁", "🎀", "🎈", "🎉"],
      names: ["Сюрприз", "Бантик", "Шарик", "Праздник"],
    },
    toy: {
      id: "toy",
      label: "Игрушка",
      items: ["🧸", "🪀", "🎲", "🚗"],
      names: ["Мишка", "Йо-йо", "Кубик", "Машинка"],
    },
    cute: {
      id: "cute",
      label: "Миляшка",
      items: ["🐱", "🐰", "🦄", "🦊"],
      names: ["Котик", "Зайчик", "Единорог", "Лисичка"],
    },
  };

  const SUPERPRIZES = [
    { emoji: "🪽", title: "Крылья чемпиона", desc: "Ты собрал 3 приза одной категории!" },
    { emoji: "👑", title: "Корона героя", desc: "Суперприз за коллекцию!" },
    { emoji: "🎩", title: "Шляпа волшебника", desc: "Ты настоящий мастер чисел!" },
    { emoji: "🎸", title: "Гитара рок-звезды", desc: "Числа покорены под музыку!" },
    { emoji: "🛡️", title: "Щит хранителя", desc: "Защитник математического мира!" },
    { emoji: "🌈", title: "Радуга удачи", desc: "Суперприз сверкает всеми цветами!" },
    { emoji: "🚀", title: "Ракета исследователя", desc: "Полёт к новым примерам!" },
    { emoji: "💎", title: "Кристалл знаний", desc: "Самый редкий суперприз!" },
  ];

  const MASCOTS = ["🤖", "🦸", "🐱", "🦊", "🦄", "👾", "🐯", "🐼"];
  const SPEECH_OK = [
    "Супер! Так держать!",
    "Ура, верно!",
    "Ты огонь! 🔥",
    "Отлично решено!",
    "Ещё один правильный!",
  ];
  const SPEECH_ERR = [
    "Почти! Запомним и потренируемся.",
    "Ничего, похожий пример ещё встретится!",
    "Ошибки помогают учиться!",
    "Давай дальше — получится!",
  ];
  const SPEECH_START = [
    "Давай решим этот пример!",
    "Готов? Поехали!",
    "Считаем вместе!",
    "Твой ход, герой!",
  ];

  // ——— State ———
  const defaultState = () => ({
    totalCorrect: 0,
    correctSincePrize: 0,
    inventory: Object.fromEntries(
      Object.keys(PRIZE_CATALOG).map((k) => [k, { count: 0, lastEmoji: PRIZE_CATALOG[k].items[0] }])
    ),
    superprizes: [],
    mistakes: [], // { op, a, b, answer, wrongAnswer, at }
  });

  let state = loadState();
  let round = null;
  let pendingPrize = null;
  let pendingSuper = null;

  // ——— DOM ———
  const $ = (sel) => document.querySelector(sel);
  const screens = {
    home: $("#screen-home"),
    game: $("#screen-game"),
    round: $("#screen-round"),
  };

  const els = {
    btnStart: $("#btn-start"),
    btnHome: $("#btn-home"),
    btnAgain: $("#btn-again"),
    btnToHome: $("#btn-to-home"),
    btnPrizeOk: $("#btn-prize-ok"),
    btnSuperOk: $("#btn-super-ok"),
    statCorrect: $("#stat-correct"),
    statUntil: $("#stat-until-prize"),
    statMistakes: $("#stat-mistakes"),
    prizeProgress: $("#prize-progress"),
    inventoryGrid: $("#inventory-grid"),
    roundCounter: $("#round-counter"),
    streakChip: $("#streak-chip"),
    mascot: $("#mascot"),
    mascotSpeech: $("#mascot-speech"),
    opLabel: $("#op-label"),
    problemText: $("#problem-text"),
    answerForm: $("#answer-form"),
    answerInput: $("#answer-input"),
    feedback: $("#feedback"),
    numpad: $("#numpad"),
    roundCorrect: $("#round-correct"),
    roundWrong: $("#round-wrong"),
    roundMessage: $("#round-message"),
    overlayPrize: $("#overlay-prize"),
    prizeEmoji: $("#prize-emoji"),
    prizeName: $("#prize-name"),
    prizeCat: $("#prize-cat"),
    overlaySuper: $("#overlay-super"),
    superTitle: $("#super-title"),
    superEmoji: $("#super-emoji"),
    superDesc: $("#super-desc"),
  };

  // ——— Storage ———
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = defaultState();
      return {
        ...base,
        ...parsed,
        inventory: { ...base.inventory, ...(parsed.inventory || {}) },
        mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes.slice(-80) : [],
        superprizes: Array.isArray(parsed.superprizes) ? parsed.superprizes : [],
      };
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ——— Utils ———
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[rand(0, arr.length - 1)];
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.remove("active"));
    screens[name].classList.add("active");
  }

  // ——— Problem generation ———
  /** Сложение: десятки и сотни (10–999) */
  function genAdd(hint) {
    let a, b;
    if (hint && hint.op === "add") {
      const scale = hint.a >= 100 || hint.b >= 100 ? "hundreds" : "tens";
      if (scale === "hundreds") {
        a = rand(100, 450);
        b = rand(100, 450);
      } else {
        a = rand(10, 90) * 10;
        b = rand(10, 90) * 10;
        if (Math.random() < 0.4) a = rand(20, 199);
        if (Math.random() < 0.4) b = rand(20, 199);
      }
    } else {
      if (Math.random() < 0.55) {
        a = rand(100, 500);
        b = rand(50, 400);
      } else {
        a = rand(20, 90) * (Math.random() < 0.5 ? 10 : 1);
        b = rand(20, 90) * (Math.random() < 0.5 ? 10 : 1);
        if (a < 10) a *= 10;
        if (b < 10) b *= 10;
      }
    }
    return { op: "add", a, b, answer: a + b };
  }

  /** Вычитание: десятки и сотни, ответ ≥ 0 */
  function genSub(hint) {
    let a, b;
    if (hint && hint.op === "sub") {
      if (hint.a >= 100) {
        a = rand(150, 700);
        b = rand(20, Math.min(a - 10, 350));
      } else {
        a = rand(40, 200);
        b = rand(10, a - 5);
      }
    } else if (Math.random() < 0.55) {
      a = rand(120, 800);
      b = rand(20, Math.min(a - 10, 400));
    } else {
      a = rand(30, 90) * 10;
      b = rand(10, Math.floor(a / 10) - 1) * 10;
      if (b <= 0) b = 10;
    }
    if (b >= a) b = Math.max(10, a - rand(5, 40));
    return { op: "sub", a, b, answer: a - b };
  }

  /** Умножение: максимум десятки и единицы (оба множителя ≤ 99, обычно таблица + двузначное×однозначное) */
  function genMul(hint) {
    let a, b;
    if (hint && hint.op === "mul") {
      const hard = Math.max(hint.a, hint.b) >= 10;
      if (hard) {
        a = rand(11, 49);
        b = rand(2, 9);
      } else {
        a = rand(2, 12);
        b = rand(2, 12);
      }
    } else if (Math.random() < 0.45) {
      a = rand(2, 12);
      b = rand(2, 12);
    } else {
      a = rand(11, 59);
      b = rand(2, 9);
    }
    if (Math.random() < 0.5) [a, b] = [b, a];
    return { op: "mul", a, b, answer: a * b };
  }

  /** Деление: делимое из десяток/единиц, целое частное */
  function genDiv(hint) {
    let divisor, quotient, dividend;
    if (hint && hint.op === "div") {
      divisor = rand(2, 12);
      quotient = hint.answer <= 12 ? rand(2, 12) : rand(2, 9);
      if (hint.a > 50) {
        divisor = rand(2, 9);
        quotient = rand(5, 15);
      }
    } else if (Math.random() < 0.5) {
      divisor = rand(2, 12);
      quotient = rand(2, 12);
    } else {
      divisor = rand(2, 9);
      quotient = rand(2, 15);
    }
    dividend = divisor * quotient;
    if (dividend > 99) {
      quotient = Math.floor(99 / divisor);
      if (quotient < 2) {
        divisor = rand(2, 9);
        quotient = rand(2, Math.floor(99 / divisor));
      }
      dividend = divisor * quotient;
    }
    return { op: "div", a: dividend, b: divisor, answer: quotient };
  }

  const GENERATORS = { add: genAdd, sub: genSub, mul: genMul, div: genDiv };

  function problemKey(p) {
    return `${p.op}:${p.a}:${p.b}`;
  }

  function formatProblem(p) {
    return `${p.a} ${OPS[p.op].symbol} ${p.b} = ?`;
  }

  /**
   * Похожий пример: та же операция и близкий масштаб чисел.
   */
  function similarFromMistake(m) {
    const gen = GENERATORS[m.op];
    if (!gen) return GENERATORS[pick(Object.keys(GENERATORS))]();
    let p = gen(m);
    // лёгкая вариация вокруг ошибочных чисел
    if (m.op === "add" || m.op === "sub") {
      const da = rand(-20, 20);
      const db = rand(-20, 20);
      let a = Math.max(10, m.a + da);
      let b = Math.max(5, m.b + db);
      if (m.op === "sub" && b >= a) b = Math.max(5, a - rand(5, 30));
      p = { op: m.op, a, b, answer: m.op === "add" ? a + b : a - b };
    } else if (m.op === "mul") {
      const a = clampNear(m.a, 2, 59);
      const b = clampNear(m.b, 2, 12);
      p = { op: "mul", a, b, answer: a * b };
    } else if (m.op === "div") {
      const divisor = clampNear(m.b, 2, 12);
      const quotient = clampNear(m.answer, 2, 15);
      let dividend = divisor * quotient;
      if (dividend > 99) {
        const q = Math.max(2, Math.floor(99 / divisor));
        p = { op: "div", a: divisor * q, b: divisor, answer: q };
      } else {
        p = { op: "div", a: dividend, b: divisor, answer: quotient };
      }
    }
    return p;
  }

  function clampNear(n, min, max) {
    const v = n + rand(-2, 2);
    return Math.min(max, Math.max(min, v));
  }

  function buildRound() {
    const problems = [];
    const used = new Set();
    const mistakes = shuffle(state.mistakes);

    // ~40% слотов — отработка похожих на ошибки (если есть)
    const practiceSlots = Math.min(mistakes.length, Math.floor(ROUND_SIZE * 0.4));
    for (let i = 0; i < practiceSlots; i++) {
      let p = similarFromMistake(mistakes[i % mistakes.length]);
      let guard = 0;
      while (used.has(problemKey(p)) && guard++ < 20) {
        p = similarFromMistake(mistakes[i % mistakes.length]);
      }
      used.add(problemKey(p));
      problems.push({ ...p, isPractice: true });
    }

    const opKeys = Object.keys(GENERATORS);
    while (problems.length < ROUND_SIZE) {
      const op = pick(opKeys);
      let p = GENERATORS[op]();
      let guard = 0;
      while (used.has(problemKey(p)) && guard++ < 30) {
        p = GENERATORS[op]();
      }
      used.add(problemKey(p));
      problems.push({ ...p, isPractice: false });
    }

    return shuffle(problems);
  }

  // ——— Round flow ———
  function startRound() {
    round = {
      problems: buildRound(),
      index: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      waiting: false,
    };
    els.mascot.textContent = pick(MASCOTS);
    showScreen("game");
    showProblem();
  }

  function showProblem() {
    const p = round.problems[round.index];
    els.roundCounter.textContent = `Пример ${round.index + 1} / ${ROUND_SIZE}`;
    els.streakChip.textContent = `Серия: ${round.streak}`;
    els.opLabel.textContent = p.isPractice
      ? `${OPS[p.op].label} · отработка`
      : OPS[p.op].label;
    els.problemText.textContent = formatProblem(p);
    els.answerInput.value = "";
    els.answerInput.classList.remove("wrong", "right");
    els.feedback.hidden = true;
    els.feedback.textContent = "";
    els.mascotSpeech.textContent = p.isPractice
      ? "Этот пример похож на тот, где была ошибка — давай победим!"
      : pick(SPEECH_START);
    els.mascot.classList.remove("happy", "sad");
    round.waiting = false;
    els.answerInput.focus();
  }

  function submitAnswer() {
    if (!round || round.waiting) return;
    const raw = els.answerInput.value.trim();
    if (raw === "" || raw === "-") return;

    const userAnswer = Number(raw);
    if (!Number.isFinite(userAnswer)) return;

    const p = round.problems[round.index];
    const ok = userAnswer === p.answer;
    round.waiting = true;

    if (ok) {
      round.correct += 1;
      round.streak += 1;
      state.totalCorrect += 1;
      state.correctSincePrize += 1;
      // убрать из журнала ошибок точное совпадение
      state.mistakes = state.mistakes.filter(
        (m) => !(m.op === p.op && m.a === p.a && m.b === p.b)
      );
      els.answerInput.classList.add("right");
      els.feedback.hidden = false;
      els.feedback.className = "feedback ok";
      els.feedback.textContent = "Верно!";
      els.mascotSpeech.textContent = pick(SPEECH_OK);
      els.mascot.classList.remove("sad");
      els.mascot.classList.add("happy");

      const prizeDue = state.correctSincePrize >= PRIZE_EVERY;
      if (prizeDue) {
        state.correctSincePrize = 0;
        pendingPrize = grantPrize();
      }
      saveState();
      updateHomeStats();

      setTimeout(() => {
        if (pendingPrize) {
          showPrizeOverlay(pendingPrize);
        } else {
          advanceOrFinish();
        }
      }, 700);
    } else {
      round.wrong += 1;
      round.streak = 0;
      logMistake(p, userAnswer);
      els.answerInput.classList.add("wrong");
      els.feedback.hidden = false;
      els.feedback.className = "feedback err";
      els.feedback.textContent = `Правильный ответ: ${p.answer}`;
      els.mascotSpeech.textContent = pick(SPEECH_ERR);
      els.mascot.classList.remove("happy");
      els.mascot.classList.add("sad");
      saveState();
      updateHomeStats();

      setTimeout(() => advanceOrFinish(), 1400);
    }
  }

  function logMistake(p, wrongAnswer) {
    state.mistakes.push({
      op: p.op,
      a: p.a,
      b: p.b,
      answer: p.answer,
      wrongAnswer,
      at: Date.now(),
    });
    if (state.mistakes.length > 80) {
      state.mistakes = state.mistakes.slice(-80);
    }
  }

  function advanceOrFinish() {
    round.index += 1;
    if (round.index >= ROUND_SIZE) {
      finishRound();
    } else {
      showProblem();
    }
  }

  function finishRound() {
    els.roundCorrect.textContent = String(round.correct);
    els.roundWrong.textContent = String(round.wrong);
    if (round.wrong === 0) {
      els.roundMessage.textContent = "Идеальный раунд! Ты настоящий герой математического мира!";
    } else if (round.correct >= 7) {
      els.roundMessage.textContent = "Отличная работа! Ошибки сохранены — потренируем похожие в следующий раз.";
    } else {
      els.roundMessage.textContent = "Хорошая попытка! В следующих раундах появятся похожие примеры для отработки.";
    }
    showScreen("round");
    updateHomeStats();
  }

  // ——— Prizes ———
  function grantPrize() {
    const catId = pick(Object.keys(PRIZE_CATALOG));
    const cat = PRIZE_CATALOG[catId];
    const idx = rand(0, cat.items.length - 1);
    const prize = {
      categoryId: catId,
      categoryLabel: cat.label,
      emoji: cat.items[idx],
      name: cat.names[idx],
    };

    const slot = state.inventory[catId];
    slot.count += 1;
    slot.lastEmoji = prize.emoji;

    if (slot.count > 0 && slot.count % 3 === 0) {
      pendingSuper = grantSuperprize(cat.label);
    }

    return prize;
  }

  function grantSuperprize(fromCategory) {
    const sp = pick(SUPERPRIZES);
    const awarded = {
      ...sp,
      fromCategory,
      at: Date.now(),
    };
    state.superprizes.push(awarded);
    return awarded;
  }

  function showPrizeOverlay(prize) {
    els.prizeEmoji.textContent = prize.emoji;
    els.prizeName.textContent = prize.name;
    els.prizeCat.textContent = `Категория: ${prize.categoryLabel}`;
    els.overlayPrize.hidden = false;
  }

  function closePrizeOverlay() {
    els.overlayPrize.hidden = true;
    const prize = pendingPrize;
    pendingPrize = null;
    if (pendingSuper) {
      showSuperOverlay(pendingSuper);
    } else {
      advanceOrFinish();
    }
    return prize;
  }

  function showSuperOverlay(sp) {
    els.superEmoji.textContent = sp.emoji;
    els.superTitle.textContent = sp.title;
    els.superDesc.textContent = `${sp.desc} (из категории «${sp.fromCategory}»)`;
    els.overlaySuper.hidden = false;
  }

  function closeSuperOverlay() {
    els.overlaySuper.hidden = true;
    pendingSuper = null;
    advanceOrFinish();
  }

  // ——— Home UI ———
  function updateHomeStats() {
    els.statCorrect.textContent = String(state.totalCorrect);
    const until = PRIZE_EVERY - state.correctSincePrize;
    els.statUntil.textContent = String(until);
    els.statMistakes.textContent = String(state.mistakes.length);
    const pct = (state.correctSincePrize / PRIZE_EVERY) * 100;
    els.prizeProgress.style.width = `${pct}%`;
    renderInventory();
  }

  function renderInventory() {
    const frag = document.createDocumentFragment();
    Object.values(PRIZE_CATALOG).forEach((cat) => {
      const slot = state.inventory[cat.id] || { count: 0, lastEmoji: cat.items[0] };
      const div = document.createElement("div");
      div.className = "inv-item" + (slot.count === 0 ? " empty" : "");
      if (slot.count >= 3) div.classList.add("has-super");
      div.innerHTML = `
        <span class="emoji">${slot.lastEmoji || cat.items[0]}</span>
        <span class="count">×${slot.count}</span>
        <span class="label">${cat.label}</span>
      `;
      frag.appendChild(div);
    });

    if (state.superprizes.length) {
      const last = state.superprizes[state.superprizes.length - 1];
      const div = document.createElement("div");
      div.className = "inv-item has-super";
      div.innerHTML = `
        <span class="emoji">${last.emoji}</span>
        <span class="count">×${state.superprizes.length}</span>
        <span class="label">Суперприз</span>
      `;
      frag.appendChild(div);
    }

    els.inventoryGrid.innerHTML = "";
    els.inventoryGrid.appendChild(frag);
  }

  // ——— Events ———
  els.btnStart.addEventListener("click", startRound);
  els.btnAgain.addEventListener("click", startRound);
  els.btnToHome.addEventListener("click", () => {
    updateHomeStats();
    showScreen("home");
  });
  els.btnHome.addEventListener("click", () => {
    if (round && round.index > 0 && round.index < ROUND_SIZE) {
      const leave = confirm("Выйти из раунда? Прогресс раунда не сохранится, но призы и ошибки — да.");
      if (!leave) return;
    }
    updateHomeStats();
    showScreen("home");
  });

  els.answerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitAnswer();
  });

  els.numpad.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-key]");
    if (!btn || round?.waiting) return;
    const key = btn.dataset.key;
    if (key === "clear") {
      els.answerInput.value = els.answerInput.value.slice(0, -1);
    } else if (key === "enter") {
      submitAnswer();
    } else {
      if (els.answerInput.value.length >= 5) return;
      els.answerInput.value += key;
    }
    els.answerInput.focus();
  });

  els.btnPrizeOk.addEventListener("click", closePrizeOverlay);
  els.btnSuperOk.addEventListener("click", closeSuperOverlay);

  // init
  updateHomeStats();
})();
