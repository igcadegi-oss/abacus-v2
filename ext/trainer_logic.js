
// ext/trainer_logic.js — session + rendering
import { state } from "../core/state.js";
import { t } from "../core/i18n.js";

export function mountTrainerUI(root){
  if (root.dataset.mwsMounted === "1") return;
  root.dataset.mwsMounted = "1";

  // Build layout
  const shell = document.createElement("div");
  shell.className = "mws-trainer";

  const area = document.createElement("div");
  area.id = "area-example";

  const right = document.createElement("div");
  right.id = "panel-controls";

  // Panels
  const answerCard = document.createElement("div");
  answerCard.className = "panel-card";
  const input = document.createElement("input");
  input.type = "number";
  input.id = "answer-input";
  input.placeholder = t("game.answerPlaceholder") || "Введи відповідь";
  const submit = document.createElement("button");
  submit.id = "btn-submit";
  submit.className = "btn btn--primary";
  submit.textContent = t("buttons.submit") || "Ответить";
  answerCard.append(input, submit);

  const timerCard = document.createElement("div");
  timerCard.className = "panel-card";
  const timerEl = document.createElement("div");
  timerEl.id = "timer";
  timerEl.textContent = "00:00";
  timerCard.append(timerEl);

  const statsCard = document.createElement("div");
  statsCard.className = "panel-card";
  const statsTop = document.createElement("div");
  statsTop.className = "stats";
  const sOk = document.createElement("div"); const sBad = document.createElement("div"); const sLeft = document.createElement("div");
  statsTop.append(sOk, sBad, sLeft);
  const progress = document.createElement("div");
  progress.className = "progress";
  const bar = document.createElement("div"); bar.className = "progress__bar";
  progress.append(bar);
  statsCard.append(statsTop, progress);

  const abacusCard = document.createElement("div");
  abacusCard.className = "panel-card";
  const abBtn = document.createElement("button");
  abBtn.id = "btn-abacus";
  abBtn.className = "btn btn--secondary";
  abBtn.textContent = (t("game.abacus") || "Абакус");
  abacusCard.append(abBtn);

  right.append(answerCard, timerCard, statsCard, abacusCard);

  shell.append(area, right);
  root.appendChild(shell);

  // Leo modal
  const leo = createLeoModal();
  document.body.appendChild(leo.node);

  // Abacus overlay/panel (inline panel inside area for simplicity)
  const abacusPanel = createAbacusPanel();
  abacusPanel.node.style.display = "none";
  area.appendChild(abacusPanel.node);
  abBtn.addEventListener("click", () => {
    const visible = abacusPanel.node.style.display !== "none";
    abacusPanel.node.style.display = visible ? "none" : "block";
  });

  // If mode == "abacus" show by default
  if (state.settings.mode === "abacus") {
    abacusPanel.node.style.display = "block";
  }

  // Session logic
  const phrases = {
    ok: [
      "Отлично! Лео доволен твоей скоростью!",
      "Супер! Мозг качается, как лев!",
      "Точно в цель! Продолжаем!",
      "Есть контакт! Ты считаешь мощно!",
      "Браво! Следующий пример ещё интереснее!",
      "Лев рычит от радости — правильно!"
    ],
    bad: [
      "Чуть-чуть мимо. Давай попробуем иначе!",
      "Не страшно! Ошибки — ступеньки к силе.",
      "Стоп! Вдох-выдох — и ещё раз.",
      "Лео подскажет: смотри на знак и шаг.",
      "Мы ближе, чем кажется. Ещё попытка!",
      "Хорошая попытка! Сейчас возьмём верный ход."
    ]
  };

  const audio = {
    ok: new Audio("./assets/sfx_correct.mp3"),
    bad: new Audio("./assets/sfx_wrong.mp3"),
    next: new Audio("./assets/sfx_next.mp3")
  };

  let session = createSessionController({ renderArea: area, bar, sOk, sBad, sLeft, timerEl, leo, audio });

  // Start training
  session.start();
}

function createSessionController(ctx){
  const { renderArea, bar, sOk, sBad, sLeft, timerEl, leo, audio } = ctx;
  const S = state.settings;

  // Validate speed requirement for long/∞ actions
  const actionsN = S.actions.infinite ? Infinity : Number(S.actions.count || 1);
  const examplesN = S.examples.infinite ? Infinity : Number(S.examples.count || 1);
  const stepwise = (actionsN === Infinity) || (actionsN > 15);

  let speedMs = 0;
  if (S.speed === "off" || S.speed === undefined || S.speed === null){
    speedMs = 0;
  } else {
    const n = Number(S.speed);
    speedMs = Number.isFinite(n) ? Math.max(100, n) : 0;
  }

  if (stepwise && (!speedMs || speedMs <= 0)){
    // Highlight the settings speed field if present
    // Non-invasive: just show inline notice above area
    const warn = document.createElement("div");
    warn.textContent = "Выбери скорость показа в Настройках (требуется для длинных или бесконечных примеров).";
    warn.style.color = "#d93025";
    warn.style.marginBottom = "8px";
    renderArea.prepend(warn);
    // Do not block, but default to 1000ms
    speedMs = 1000;
  }

  let progress = { ok: 0, bad: 0, total: 0 };
  let exLeft = examplesN === Infinity ? "∞" : examplesN;

  updateStats();
  let timerId = null;
  let seconds = 0;
  function resetTimer(){
    if (timerId) clearInterval(timerId);
    seconds = 0; timerEl.textContent = "00:00";
    timerId = setInterval(() => {
      seconds++;
      const mm = String(Math.floor(seconds/60)).padStart(2, "0");
      const ss = String(seconds%60).padStart(2, "0");
      timerEl.textContent = `${mm}:${ss}`;
    }, 1000);
  }

  let stepTimer = null;

  function startExample(){
    resetTimer();
    const example = generateExample(S,  actionsN);
    renderExample(renderArea, example, S.inline, stepwise ? speedMs : 0);
    const submitBtn = document.getElementById("btn-submit");
    const input = document.getElementById("answer-input");
    input.value = "";
    input.focus();
    submitBtn.onclick = () => {
      const val = Number(input.value);
      const correct = (val === example.answer);
      if (correct) {
        progress.ok++;
        leo.open(true);
        try{ audio.ok.play(); }catch{}
      } else {
        progress.bad++;
        leo.open(false);
        try{ audio.bad.play(); }catch{}
      }
      progress.total++;
      updateStats();
      // auto next after 3 sec
      setTimeout(() => {
        if (!isFinished()){
          try{ audio.next.play(); }catch{}
          startExample();
        } else {
          // navigate to results via global route if available
          if (window.route) window.route("results");
        }
      }, 3000);
    };
  }

  function isFinished(){
    if (examplesN === Infinity) return false;
    return (progress.total >= examplesN);
  }

  function updateStats(){
    sOk.textContent = `✅ ${progress.ok}`;
    sBad.textContent = `❌ ${progress.bad}`;
    sLeft.textContent = `⬅️ ${examplesN === Infinity ? "∞" : (examplesN - progress.total)}`;
    if (examplesN === Infinity){
      bar.style.width = "0%";
    } else {
      const pct = Math.min(100, Math.round((progress.total / examplesN) * 100));
      bar.style.width = `${pct}%`;
    }
  }

  return {
    start(){
      startExample();
    }
  };
}

// Rendering
function renderExample(container, example, inline, stepDelayMs){
  // Clear
  container.querySelectorAll(".example-root")?.forEach(el => el.remove());

  // Root
  const root = document.createElement("div");
  root.className = "example-root " + (inline ? "example--inline" : "example--column");
  container.appendChild(root);

  // Content generation
  const lines = example.steps.map(s => `${s.op}${s.val}`);

  if (!inline){
    // Column mode with auto font size
    const L = Math.min(lines.length, 15);
    const vh = Math.max(document.documentElement.clientHeight || 800, 600);
    const fontSize = Math.max(24, Math.min(72, Math.floor((vh * 0.75) / (L + 2))));
    root.style.fontSize = fontSize + "px";

    if (stepDelayMs > 0){
      let i = 0;
      const addLine = () => {
        if (i < lines.length){
          const lineEl = document.createElement("div");
          lineEl.className = "example__line";
          lineEl.textContent = lines[i];
          root.appendChild(lineEl);
          i++;
          setTimeout(addLine, stepDelayMs);
        }
      };
      addLine();
    } else {
      lines.forEach(txt => {
        const lineEl = document.createElement("div");
        lineEl.className = "example__line";
        lineEl.textContent = txt;
        root.appendChild(lineEl);
      });
    }
  } else {
    // Inline mode
    root.textContent = lines.join(" ");
  }
}

// Simple generator (MVP). Can be replaced with a stronger one.
function generateExample(S, actionsN){
  const digits = Number(S.digits || "1");
  const maxVal = (digits <= 1) ? 9 : Math.pow(10, digits) - 1;
  const minVal = 0;

  const N = (actionsN === Infinity) ? 20 : actionsN; // generate 20 for “∞” visual flow
  const steps = [];
  let cur = Math.floor(Math.random() * (maxVal+1));

  for (let i=0; i<N; i++){
    const chooseUpper = Math.random() < 0.25; // occasionally ±5
    let delta;
    if (chooseUpper){
      delta = (Math.random() < 0.5 ? +5 : -5);
    } else {
      const low = [1,2,3,4][Math.floor(Math.random()*4)];
      delta = (Math.random() < 0.5 ? +low : -low);
    }
    // Clamp to range: retry few times
    let tries = 0;
    while ((cur + delta < minVal) or (cur + delta > maxVal)){
      delta = -delta;
      tries++;
      if (tries>2){ delta = 0; break; }
    }
    if (delta === 0){
      i--; continue;
    }
    steps.push({ op: delta>=0?"+":"-", val: Math.abs(delta) });
    cur += delta;
  }

  return { start: null, steps, answer: cur };
}

// Leo modal
function createLeoModal(){
  const node = document.createElement("div");
  node.className = "leo-modal";
  const card = document.createElement("div");
  card.className = "leo-modal__card";
  const title = document.createElement("div");
  title.className = "leo-modal__title";
  const text = document.createElement("div");
  text.className = "leo-modal__text";
  card.append(title, text);
  node.appendChild(card);

  function open(ok){
    node.classList.add("leo-modal--open");
    title.textContent = ok ? "Правильно!" : "Неправильно";
    const arr = ok ? [
      "Отлично! Лео доволен твоей скоростью!",
      "Супер! Мозг качается, как лев!",
      "Точно в цель! Продолжаем!",
      "Есть контакт! Ты считаешь мощно!",
      "Браво! Следующий пример ещё интереснее!",
      "Лев рычит от радости — правильно!"
    ] : [
      "Чуть-чуть мимо. Давай попробуем иначе!",
      "Не страшно! Ошибки — ступеньки к силе.",
      "Стоп! Вдох-выдох — и ещё раз.",
      "Лео подскажет: смотри на знак и шаг.",
      "Мы ближе, чем кажется. Ещё попытка!",
      "Хорошая попытка! Сейчас возьмём верный ход."
    ];
    text.textContent = arr[Math.floor(Math.random()*arr.length)];
    setTimeout(() => node.classList.remove("leo-modal--open"), 2500);
  }
  return { node, open };
}

// Abacus MVP (2+ columns, click-to-toggle)
function createAbacusPanel(){
  const wrapper = document.createElement("div");
  wrapper.className = "panel-card";
  const title = document.createElement("div");
  title.style.marginBottom = "8px";
  title.textContent = "Абакус (MVP)";
  const ab = document.createElement("div");
  ab.className = "abacus";

  const digits = Number(state.settings.digits || "1");
  const cols = Math.max(2, digits + 1);

  for (let i=0; i<cols; i++){
    ab.appendChild(createAbacusColumn());
  }

  wrapper.append(title, ab);
  return { node: wrapper };
}

function createAbacusColumn(){
  const col = document.createElement("div");
  col.className = "abacus__col";

  const bar = document.createElement("div");
  bar.className = "abacus__bar";

  const upper = document.createElement("div");
  upper.className = "bead bead--upper";
  upper.textContent = "5";

  const lowers = [1,2,3,4].map((n, idx) => {
    const b = document.createElement("div");
    b.className = "bead bead--lower bead--l"+(idx+1);
    b.textContent = "1";
    return b;
  });

  let upperOn = false;
  let lowerCount = 0;

  function setUpper(on){
    upperOn = on;
    upper.classList.toggle("bead--engaged", upperOn);
  }
  function setLower(count){
    lowerCount = Math.max(0, Math.min(4, count));
    lowers.forEach((b, i) => {
      b.classList.toggle("bead--engaged", i < lowerCount);
    });
  }

  upper.addEventListener("click", () => setUpper(!upperOn));
  lowers.forEach((b, idx) => {
    b.addEventListener("click", () => {
      setLower(idx+1 === lowerCount ? idx : idx+1);
    });
  });

  col.append(upper, ...lowers, bar);
  return col;
}
