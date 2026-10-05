"use strict";
/* RAAS Interactive Simulator — Version 2
   Content follows the course reading (see "Recommended Reading" on the page). */

const $ = id => document.getElementById(id);
const stage = $("stage");

/* =====================================================================
   1. PATHWAY STEPS
   base: stays visible in later steps.  own: only while this step is current.
   "id" adds .show, "id.cls" adds a class, "-id.cls" removes a class.
   ===================================================================== */
const STEPS = [
  null,
  {
    name: "Stimulus",
    base: [],
    own: ["trigger.focus"],
    status: "<b>Stimulus:</b> ↓ Body NaCl lowers ECF volume, which lowers arterial blood pressure and so renal perfusion pressure (most often due to systemic hypotension). Baroreceptors in the afferent arteriole detect this and stimulate renin release. Separately, the macula densa senses ↓ NaCl delivery to the distal tubule and also stimulates renin release. Try it in <b>Renin inputs</b>.",
    vars: { nacl: "down", ecf: "down", sbp: "down", rpp: "down" },
    note: "↓ Body NaCl → ↓ ECF volume → ↓ arterial blood pressure → ↓ renal perfusion pressure."
  },
  {
    name: "Kidney",
    base: ["aTriggerKidney", "plusKidney", "kidneyCard.active", "aKidneyRenin", "reninBox", "reninBox.renin-up"],
    own: ["reninBox.focus"],
    status: "<b>Kidney:</b> Renin is produced primarily by the juxtaglomerular (granular) cells in the wall of the afferent arteriole, also described as granular extraglomerular mesangial cells. Renin is an enzyme released into the blood. Tap <b>Renin</b> to see where it is made and what triggers its release.",
    vars: { renin: "up" },
    note: "The decrease, detected by baroreceptors in the afferent arteriole, stimulates renin release."
  },
  {
    name: "Liver",
    base: ["liverCard.active", "aLiver", "angGen", "aReninConversion", "conversion1", "angI"],
    own: ["angI.focus"],
    status: "<b>Liver:</b> Renin catalyzes the transformation of angiotensinogen, which is produced primarily by the liver, to angiotensin I.",
    vars: {},
    note: "Angiotensin I is formed. No variable in this panel changes at this step."
  },
  {
    name: "Lungs",
    base: ["lungsCard.active", "aLungsAce", "aceBox", "aAceConversion", "conversion2", "angII"],
    own: ["angII.focus"],
    status: "<b>Lungs:</b> Angiotensin I is converted to the more active angiotensin II by angiotensin-converting enzyme (ACE), located primarily in the vascular endothelium of the lung.",
    vars: { angii: "up" },
    note: "Plasma angiotensin II rises."
  },
  {
    name: "Adrenal cortex",
    base: ["adrenalCard.active", "aAngIIAdrenal", "plusAdrenal", "aAdrenalAldo", "aldo"],
    own: ["aldo.focus"],
    status: "<b>Adrenal cortex:</b> Circulating angiotensin II stimulates the release of aldosterone from the zona glomerulosa of the adrenal cortex.",
    vars: { aldo: "up" },
    note: "Aldosterone release is stimulated by angiotensin II."
  },
  {
    name: "Angiotensin II",
    base: [],
    own: ["angII.focus", "aAngIITrunk", "plusTrunk", "aDrop1", "aDrop2", "aDrop3", "aDrop4", "aDrop5",
          "vasoCard", "glomCard", "tubuleCard", "vasopressinCard", "thirstCard",
          "aCorr1", "aCorr2", "aCorr3", "aCorr4", "aCorr5", "correctionAngII"],
    status: "<b>Angiotensin II:</b> A potent vasoconstrictor that raises vascular resistance and systemic blood pressure. In the kidney it constricts the efferent arteriole more than the afferent, raising glomerular capillary pressure, so GFR is maintained even though renal blood flow and K<sub>f</sub> fall. It increases Na⁺ uptake in several renal tubules, stimulates aldosterone (adrenal cortex) and vasopressin (posterior pituitary) release, and stimulates thirst. Tap <b>Tubular</b> to see which tubules.",
    vars: { nacl: "up", ecf: "up", vp: "up", vr: "up", sbp: "up", rpp: "up", rbf: "down", kf: "down", pgc: "up", gfr: "range",
            na: "up", water: "up", intake: "up", vol: "up" },
    note: "Angiotensin II increases salt and water retention, water intake, intravascular volume and vascular resistance, raising systemic blood pressure and renal perfusion pressure. Efferent arteriolar constriction keeps GFR within range."
  },
  {
    name: "Aldosterone",
    base: [],
    own: ["aldo.focus", "aAldoEffect", "aldoEffectBox", "aAldoCorrect", "correctionAldo"],
    status: "<b>Aldosterone:</b> Released from the zona glomerulosa of the adrenal cortex in response to angiotensin II. It increases Na⁺ reabsorption and K⁺ secretion in the late distal tubule and collecting duct; Cl⁻ and water follow Na⁺. Vasopressin, by contrast, mainly increases water reabsorption in the collecting duct.",
    vars: { na: "up", k: "up" },
    note: "Aldosterone: ↑ Na⁺ reabsorption and ↑ K⁺ secretion. Vasopressin: ↑ water reabsorption."
  },
  {
    name: "Feedback",
    base: [],
    own: ["aFbAngII", "aFbAldo", "outcomeBox", "aLongLoop", "minusLong", "longLoopNote",
          "aShortLoop", "minusShort", "shortLoopNote", "aRange", "rangeBox",
          "trigger.resolved", "-reninBox.renin-up", "reninBox.renin-down"],
    status: "<b>Negative feedback:</b> The increased extracellular volume and renal perfusion pressure suppress renin release, and elevated plasma angiotensin II suppresses it directly by activating AT1 receptors. This contributes to a negative-feedback system that helps to maintain renal perfusion and GFR within the physiological range.",
    vars: { ecf: "up", rpp: "up", renin: "down" },
    note: "Renin release is suppressed by the resulting increased extracellular volume and renal perfusion pressure, and by angiotensin II via AT1 receptors. The negative feedback helps to maintain renal perfusion and GFR within the physiological range."
  }
];
const LAST = STEPS.length - 1;

/* Dashboard rows */
const VARS = [
  { group: "Hormones" },
  { k: "renin", n: "Renin release" },
  { k: "angii", n: "Plasma angiotensin II" },
  { k: "aldo", n: "Aldosterone" },
  { k: "vp", n: "Vasopressin" },
  { group: "Stimulus" },
  { k: "nacl", n: "Body NaCl" },
  { k: "ecf", n: "ECF volume" },
  { k: "sbp", n: "Arterial (systemic) blood pressure" },
  { k: "rpp", n: "Renal perfusion pressure" },
  { group: "Glomerulus" },
  { k: "rbf", n: "Renal blood flow" },
  { k: "kf", n: "Ultrafiltration coefficient (Kf)" },
  { k: "pgc", n: "Glomerular capillary pressure" },
  { k: "gfr", n: "GFR" },
  { group: "Tubules and circulation" },
  { k: "na", n: "Renal Na⁺ reabsorption" },
  { k: "water", n: "Renal water reabsorption" },
  { k: "k", n: "Renal K⁺ secretion" },
  { k: "intake", n: "Water intake (thirst)" },
  { k: "vr", n: "Vascular resistance" },
  { k: "vol", n: "Intravascular volume" }
];
const DIR_TEXT = { up: "↑ up", down: "↓ down", range: "✓ maintained" };

/* =====================================================================
   2. QUESTIONS
   ===================================================================== */
const QUESTIONS = {
  1: { q: "Which sequence lowers renal perfusion pressure and so stimulates renin release?",
       opts: ["↑ Body NaCl → ↑ ECF volume → ↑ arterial blood pressure", "↓ Body NaCl → ↓ ECF volume → ↓ arterial blood pressure", "↑ Plasma angiotensin II → ↑ vascular resistance", "↑ Renal perfusion pressure → ↑ baroreceptor stretch"], a: 1,
       exp: "↓ Body NaCl lowers ECF volume, which lowers arterial blood pressure and renal perfusion pressure. Baroreceptors in the afferent arteriole detect this and stimulate renin release. Separately, the macula densa responds to ↓ NaCl delivery to the distal tubule." },
  2: { q: "Which cells produce renin?",
       opts: ["Cells of the vascular endothelium of the lung", "Juxtaglomerular (granular) cells in the wall of the afferent arteriole", "Cells of the adrenal gland", "Liver cells"], a: 1,
       exp: "Renin is produced primarily by the juxtaglomerular (granular) cells in the wall of the afferent arteriole, also described as granular extraglomerular mesangial cells." },
  3: { q: "Renin acts on angiotensinogen. What does it produce, and where is angiotensinogen mainly made?",
       opts: ["Angiotensin II; the lung", "Angiotensin I; primarily the liver", "Aldosterone; the adrenal cortex", "Angiotensin I; the adrenal cortex"], a: 1,
       exp: "Renin catalyzes the transformation of angiotensinogen, which is produced primarily by the liver, to angiotensin I." },
  4: { q: "In the systemic system, where is angiotensin-converting enzyme (ACE) mainly located?",
       opts: ["Vascular endothelium of the lung", "Wall of the afferent arteriole", "Liver", "Adrenal cortex"], a: 0,
       exp: "Angiotensin I is converted to the more active angiotensin II by ACE, which is located primarily in the vascular endothelium of the lung." },
  5: { q: "Circulating angiotensin II stimulates aldosterone release from which part of the adrenal gland?",
       opts: ["Adrenal medulla", "Zona glomerulosa of the adrenal cortex", "Posterior pituitary", "Zona reticularis of the adrenal cortex"], a: 1,
       exp: "Aldosterone is released from the zona glomerulosa of the adrenal cortex. Angiotensin II also stimulates vasopressin release from the posterior pituitary." },
  6: { q: "Angiotensin II lowers renal blood flow. How is GFR still maintained?",
       opts: ["It dilates the afferent arteriole", "It constricts the efferent arteriole more than the afferent, raising glomerular capillary pressure", "It increases the ultrafiltration coefficient (Kf)", "It increases renal blood flow through the medulla"], a: 1,
       exp: "Angiotensin II constricts the efferent arteriole more than the afferent. This raises glomerular capillary pressure, so GFR is maintained even though renal blood flow and Kf fall." },
  7: { q: "Which statement correctly contrasts aldosterone and vasopressin?",
       opts: ["Aldosterone ↑ water reabsorption only; vasopressin ↑ K⁺ secretion", "Aldosterone ↑ Na⁺ reabsorption and K⁺ secretion; vasopressin ↑ water reabsorption", "Both act only on the proximal tubule", "Aldosterone comes from the posterior pituitary; vasopressin from the adrenal cortex"], a: 1,
       exp: "Aldosterone (adrenal cortex) increases Na⁺ reabsorption and K⁺ secretion in the late distal tubule and collecting duct; Cl⁻ and water follow Na⁺. Vasopressin (posterior pituitary) mainly increases water reabsorption in the collecting duct." },
  8: { q: "Through which receptors does elevated plasma angiotensin II directly suppress renin release?",
       opts: ["Baroreceptors in the afferent arteriole", "AT1 receptors", "Angiotensin-converting enzyme (ACE)", "Aldosterone"], a: 1,
       exp: "Renin release is suppressed by increased extracellular volume and renal perfusion pressure, and by a direct effect of elevated plasma angiotensin II acting on AT1 receptors. This negative feedback helps maintain renal perfusion and GFR within the physiological range." }
};

const IR_QUESTIONS = [
  { q: "In the intrarenal RAS, where is ACE located primarily?",
    opts: ["Vascular endothelium of the lung", "Interstitial capillary endothelium and proximal tubule", "Liver", "Adrenal cortex"], a: 1,
    exp: "In the intrarenal RAS, angiotensin-converting enzyme is located primarily in the interstitial capillary endothelium and proximal tubule." },
  { q: "Which intrarenal component can be activated locally to convert angiotensinogen to angiotensin I?",
    opts: ["Aldosterone", "Vasopressin", "Prorenin", "Angiotensin II"], a: 2,
    exp: "Components of the intrarenal RAS include prorenin, which can be activated locally to convert angiotensinogen to angiotensin I." },
  { q: "How does the intrarenal RAS relate to the systemic renin-angiotensin system?",
    opts: ["It always depends on the systemic system", "It may act in concert with it or function independently of it", "It operates only in pathologic conditions", "It does not affect glomerular filtration"], a: 1,
    exp: "Depending on the condition, the intrarenal RAS may operate in concert with the systemic system but also may function independently of it. It regulates glomerular filtration in both physiologic and pathologic conditions." }
];

/* =====================================================================
   3. STATE
   ===================================================================== */
const state = {
  step: 0,
  view: "systemic",   // systemic | intrarenal
  mode: "learn",      // learn | quiz
  tab: "changes",     // changes | inputs | label | intrarenal
  playing: false,
  timer: null,
  pending: null,      // step waiting for a quiz answer
  answered: {},
  score: { right: 0, total: 0 },
  predictions: {},
  predictResults: {},
  rel: "concert",
  inputs: { nacl: "normal", ecf: "normal", abp: "normal" },
  label: { placed: {}, selected: null }
};

const DEFAULT_STATUS = "Select <b>1 Stimulus</b> or press <b>▶ Play</b> to begin.";

/* =====================================================================
   4. DRAWING
   ===================================================================== */
const TRANSIENT = ["show", "focus", "active", "resolved", "renin-up", "renin-down", "renin-mixed", "on", "idle",
                   "blocked", "greyed", "placed", "wrong", "drop-hover"];

function clearStage() {
  stage.querySelectorAll("*").forEach(node => {
    if (node.closest(".intrarenal-layer")) return;
    node.classList.remove(...TRANSIENT);
  });
}

function applyEntry(entry) {
  let remove = false;
  if (entry.startsWith("-")) { remove = true; entry = entry.slice(1); }
  const dot = entry.indexOf(".");
  const id = dot === -1 ? entry : entry.slice(0, dot);
  const cls = dot === -1 ? "show" : entry.slice(dot + 1);
  const node = $(id);
  if (!node) return;
  node.classList[remove ? "remove" : "add"](cls);
}

function drawStep(n) {
  clearStage();
  for (let i = 1; i <= n; i++) STEPS[i].base.forEach(applyEntry);
  if (n > 0) STEPS[n].own.forEach(applyEntry);
  updateReninBadge();
}

function updateReninBadge() {
  const box = $("reninBox");
  if (state.tab === "inputs" && box.classList.contains("show")) {
    const r = reninNet();
    box.classList.remove("renin-up", "renin-down", "renin-mixed");
    if (r.dir === "up") box.classList.add("renin-up");
    if (r.dir === "down") box.classList.add("renin-down");
    if (r.dir === "mixed") box.classList.add("renin-mixed");
  }
  const badge = $("reninBadge");
  badge.textContent = box.classList.contains("renin-up") ? "↑ release"
                    : box.classList.contains("renin-down") ? "↓ release"
                    : box.classList.contains("renin-mixed") ? "? release" : "";
}

function setStatus(html) { $("status").innerHTML = html; }

/* =====================================================================
   5. RENDER A STEP (state + all UI)
   ===================================================================== */
function render(n) {
  state.step = n;
  drawStep(n);
  setStatus(n === 0 ? DEFAULT_STATUS : STEPS[n].status);

  document.querySelectorAll("#stepControls button[data-step]").forEach(btn => {
    const s = Number(btn.dataset.step);
    btn.classList.toggle("active", s === n || (s <= Math.min(n, 5)));
    btn.classList.toggle("current", s === n);
    btn.setAttribute("aria-current", s === n ? "step" : "false");
  });
  $("stepIndicator").textContent = n === 0 ? `Step 0 of ${LAST}` : `Step ${n} of ${LAST}: ${STEPS[n].name}`;
  $("btnBack").disabled = n === 0;
  $("btnNext").disabled = n === LAST;
  renderDash();
}

/* =====================================================================
   6. DASHBOARD
   ===================================================================== */
function computeVars(n) {
  const values = {};
  const changed = new Set();
  for (let i = 1; i <= n; i++) {
    Object.entries(STEPS[i].vars).forEach(([k, v]) => {
      if (i === n && values[k] !== v) changed.add(k);
      values[k] = v;
    });
  }
  return { values, changed };
}

function renderDash() {
  const dash = $("dash");
  const n = state.step;
  const { values, changed } = computeVars(n);
  const pending = state.pending;
  const pendingChanged = pending ? computeVars(pending).changed : new Set();
  const pendingValues = pending ? computeVars(pending).values : {};

  dash.innerHTML = "";
  VARS.forEach(v => {
    if (v.group) {
      const g = document.createElement("div");
      g.className = "dash-group";
      g.textContent = v.group;
      dash.appendChild(g);
      return;
    }
    const row = document.createElement("div");
    row.className = "dash-row";
    if (changed.has(v.k) && !pending) row.classList.add("changed");

    const name = document.createElement("span");
    name.className = "dash-name";
    name.textContent = v.n;
    row.appendChild(name);

    const val = document.createElement("span");
    val.className = "dash-val";

    const canPredict = pending && pendingChanged.has(v.k) && pendingValues[v.k] !== "range";
    if (canPredict) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "predict-btn";
      const p = state.predictions[v.k];
      b.textContent = p === "up" ? "↑" : p === "down" ? "↓" : "?";
      b.title = "Tap to predict: ↑ or ↓";
      b.setAttribute("aria-label", `Predict ${v.n}: currently ${p || "no prediction"}`);
      b.addEventListener("click", () => {
        const cur = state.predictions[v.k];
        state.predictions[v.k] = cur === undefined ? "up" : cur === "up" ? "down" : undefined;
        renderDash();
      });
      val.appendChild(b);
    } else {
      const d = values[v.k];
      val.textContent = d ? DIR_TEXT[d] : "—";
      val.classList.add(d ? `dir-${d}` : "dir-none");
      const res = state.predictResults[v.k];
      if (res) {
        const m = document.createElement("span");
        m.className = res === "ok" ? "mark-ok" : "mark-bad";
        m.textContent = res === "ok" ? " ✓" : " ✗";
        m.title = res === "ok" ? "Your prediction was right" : "Your prediction was different";
        val.appendChild(m);
      }
    }
    row.appendChild(val);
    dash.appendChild(row);
  });

  if (pending) {
    $("dashTitle").textContent = `Predict step ${pending}: ${STEPS[pending].name}`;
    $("changeNote").textContent = "Tap each ? to predict whether it goes up or down, then answer the question.";
  } else {
    $("dashTitle").textContent = n === 0 ? "What changes" : `After step ${n}: ${STEPS[n].name}`;
    const results = Object.values(state.predictResults);
    const extra = results.length ? ` Predictions: ${results.filter(r => r === "ok").length} of ${results.length} right.` : "";
    $("changeNote").textContent = n === 0 ? "" : STEPS[n].note + extra;
  }
}

/* =====================================================================
   7. NAVIGATION, PLAY, QUIZ
   ===================================================================== */
function cancelPending() {
  if (state.pending !== null) {
    state.pending = null;
    state.predictions = {};
    hideQuiz();
  }
}

function goTo(n) {
  if (state.view !== "systemic") return;
  n = Math.max(0, Math.min(LAST, n));
  if (isActivity()) setTab("changes", true);
  cancelPending();

  if (state.mode === "quiz" && n > state.step && !state.answered[n]) {
    // Jumping ahead: show everything up to the step before, then ask
    if (n - 1 > state.step) { state.predictResults = {}; render(n - 1); }
    startStepQuestion(n);
    return;
  }
  state.predictResults = {};
  render(n);
}

function startStepQuestion(n) {
  state.pending = n;
  state.predictions = {};
  state.predictResults = {};
  renderDash();
  setStatus(`Answer the question to reveal <b>step ${n}: ${STEPS[n].name}</b>. You can also predict the arrows in the <b>Changes</b> panel.`);
  openQuestion(QUESTIONS[n], `Predict before step ${n}: ${STEPS[n].name}`, `Show step ${n}`, revealPending, true);
}

function revealPending() {
  const n = state.pending;
  if (n === null) return;
  state.answered[n] = true;
  const { values } = computeVars(n);
  const results = {};
  Object.entries(state.predictions).forEach(([k, p]) => {
    if (p) results[k] = p === values[k] ? "ok" : "bad";
  });
  state.pending = null;
  state.predictions = {};
  state.predictResults = results;
  hideQuiz();
  render(n);
  if (state.playing) scheduleNext();
}

function openQuestion(q, tag, revealLabel, onReveal, scored) {
  const card = $("quizCard");
  $("quizTag").textContent = tag;
  $("quizQuestion").textContent = q.q;
  const opts = $("quizOptions");
  const fb = $("quizFeedback");
  const reveal = $("quizReveal");
  opts.innerHTML = "";
  fb.innerHTML = "";
  reveal.hidden = true;
  reveal.textContent = revealLabel;
  reveal.onclick = onReveal;
  $("quizSkip").onclick = onReveal;
  $("quizSkip").hidden = false;

  q.opts.forEach((text, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "quiz-opt";
    b.textContent = text;
    b.addEventListener("click", () => {
      const right = i === q.a;
      opts.querySelectorAll(".quiz-opt").forEach((o, j) => {
        o.disabled = true;
        if (j === q.a) o.classList.add("correct");
      });
      if (!right) b.classList.add("incorrect");
      if (scored) {
        state.score.total++;
        if (right) state.score.right++;
        updateScore();
      } else if (q._track) {
        q._track(right);
      }
      fb.innerHTML = `<b>${right ? "Correct." : "Not quite."}</b>${q.exp}`;
      reveal.hidden = false;
      $("quizSkip").hidden = true;
      reveal.focus();
    });
    opts.appendChild(b);
  });
  card.hidden = false;
  const first = opts.querySelector(".quiz-opt");
  if (first) first.focus({ preventScroll: true });
}

function hideQuiz() { $("quizCard").hidden = true; }

function updateScore() {
  $("scoreBox").textContent = `Score: ${state.score.right} / ${state.score.total}`;
}

function scheduleNext() {
  clearTimeout(state.timer);
  if (state.step >= LAST) { stopPlay(); return; }
  state.timer = setTimeout(advance, 3400);
}

function advance() {
  if (!state.playing) return;
  if (state.step >= LAST) { stopPlay(); return; }
  goTo(state.step + 1);
  if (state.pending === null) scheduleNext();
}

function startPlay() {
  if (state.view !== "systemic") return;
  if (isActivity()) setTab("changes", true);
  state.playing = true;
  $("btnPlay").textContent = "❚❚ Pause";
  if (state.step >= LAST) { cancelPending(); state.predictResults = {}; render(0); }
  advance();
}

function stopPlay() {
  state.playing = false;
  clearTimeout(state.timer);
  $("btnPlay").textContent = "▶ Play";
}

function togglePlay() { state.playing ? stopPlay() : startPlay(); }

/* =====================================================================
   8. MODES AND VIEWS
   ===================================================================== */
function setMode(mode) {
  state.mode = mode;
  $("modeLearn").classList.toggle("on", mode === "learn");
  $("modeQuiz").classList.toggle("on", mode === "quiz");
  $("modeLearn").setAttribute("aria-pressed", mode === "learn");
  $("modeQuiz").setAttribute("aria-pressed", mode === "quiz");
  $("scoreBox").hidden = mode !== "quiz";
  if (mode === "learn") cancelPending();
  renderDash();
  updateSubtitle();
}

function updateSubtitle() {
  if (state.view === "intrarenal") {
    $("subtitle").textContent = "The kidney's own local renin-angiotensin system. Tap any box to learn its role.";
  } else if (state.mode === "quiz") {
    $("subtitle").textContent = "Quiz mode: answer each question to reveal the next step.";
  } else {
    $("subtitle").textContent = "Start with the stimulus and follow the pathway step by step.";
  }
}

function setView(view) {
  if (view === state.view) return;
  stopPlay();
  cancelPending();
  state.view = view;
  const ir = view === "intrarenal";
  $("viewSystemic").classList.toggle("on", !ir);
  $("viewIntrarenal").classList.toggle("on", ir);
  $("viewSystemic").setAttribute("aria-pressed", !ir);
  $("viewIntrarenal").setAttribute("aria-pressed", ir);
  $("stepControls").classList.toggle("disabled", ir);
  document.querySelectorAll("#player button:not(#reset)").forEach(b => b.classList.toggle("off", ir));
  $("player").classList.toggle("ir", ir);
  $("tabs").hidden = ir;
  stage.classList.toggle("mode-intrarenal", ir);

  if (ir) {
    stage.classList.remove("mode-label");
    showPanel("intrarenal");
    state.tab = "intrarenal";
    setRelation(state.rel);
    setStatus("<b>Intrarenal RAS:</b> A local renin-angiotensin system in the kidney also regulates intrarenal hemodynamics, glomerular filtration and glomerular permeability. Tap any box to learn more.");
  } else {
    setTab("changes");
  }
  updateSubtitle();
}

const REL_TEXT = {
  concert: "Depending on the condition, the intrarenal RAS may operate in concert with the systemic renin-angiotensin system.",
  independent: "The intrarenal RAS may also function independently of the systemic system.",
  inappropriate: "The intrarenal RAS may be activated inappropriately and contribute to pathologic conditions."
};

function setRelation(rel) {
  state.rel = rel;
  document.querySelectorAll("#relation .chip-btn").forEach(b => b.classList.toggle("on", b.dataset.rel === rel));
  const layer = $("intrarenalLayer");
  layer.classList.remove("rel-concert", "rel-independent", "rel-inappropriate");
  layer.classList.add(`rel-${rel}`);
  $("irCaption").textContent = REL_TEXT[rel];
  $("irCaption").classList.toggle("warn", rel === "inappropriate");
}

const IR_INFO = {
  irSystemic: "<b>Systemic RAS:</b> angiotensinogen produced primarily by the liver, and ACE located primarily in the vascular endothelium of the lung. Use the buttons in the panel to see how the two systems relate.",
  irAgt: "<b>Angiotensinogen:</b> components of the intrarenal RAS include local production of angiotensinogen.",
  irPro: "<b>Prorenin:</b> can be activated locally to convert angiotensinogen to angiotensin I.",
  irAI: "<b>Angiotensin I:</b> formed when locally activated prorenin converts angiotensinogen.",
  irRenin: "<b>Renin:</b> components of the intrarenal RAS include local production of renin.",
  irAce: "<b>ACE (intrarenal):</b> located primarily in the interstitial capillary endothelium and proximal tubule. In the systemic system, ACE is located primarily in the vascular endothelium of the lung.",
  irTargets: "<b>What the local RAS regulates:</b> intrarenal hemodynamics, glomerular filtration and glomerular permeability, in both physiologic and pathologic conditions."
};

function selectIr(id) {
  document.querySelectorAll(".intrarenal-layer .selected").forEach(n => n.classList.remove("selected"));
  $(id).classList.add("selected");
  setStatus(IR_INFO[id]);
}

function runIrQuiz() {
  let i = 0, right = 0;
  const ask = () => {
    const q = Object.assign({}, IR_QUESTIONS[i], { _track: ok => { if (ok) right++; } });
    const last = i === IR_QUESTIONS.length - 1;
    openQuestion(q, `Intrarenal RAS: question ${i + 1} of ${IR_QUESTIONS.length}`, last ? "Finish" : "Next question", () => {
      i++;
      if (i < IR_QUESTIONS.length) ask();
      else { hideQuiz(); setStatus(`<b>Intrarenal check complete:</b> ${right} of ${IR_QUESTIONS.length} correct.`); }
    }, false);
  };
  ask();
}

/* =====================================================================
   9. SIDE PANEL TABS
   ===================================================================== */
function showPanel(name) {
  document.querySelectorAll(".tab-panel").forEach(p => { p.hidden = p.dataset.panel !== name; });
  document.querySelectorAll(".tab").forEach(t => {
    const on = t.dataset.tab === name;
    t.classList.toggle("on", on);
    t.setAttribute("aria-selected", on);
  });
}

function isActivity() { return state.tab === "label" || state.tab === "inputs"; }

function setTab(tab, silent) {
  const leavingActivity = isActivity();
  state.tab = tab;
  showPanel(tab);
  stage.classList.remove("mode-label", "inputs-mode");

  if (tab === "label" || tab === "inputs") {
    stopPlay();
    cancelPending();
  }
  if (tab === "label") { stage.classList.add("mode-label"); renderLabel(); return; }
  if (tab === "inputs") { stage.classList.add("inputs-mode"); renderInputs(); return; }
  if (!silent || leavingActivity) render(state.step);
}

/* =====================================================================
   10. RENIN INPUTS
   ===================================================================== */
const INPUTS = [
  { k: "nacl", n: "Body NaCl",
    opts: [["down", "↓ Decreased"], ["normal", "Normal"]],
    eff: { down: ["stim", "Stimulates renin release: ↓ ECF volume → ↓ arterial BP → ↓ renal perfusion pressure"] } },
  { k: "ecf", n: "ECF volume",
    opts: [["down", "↓ Decreased"], ["normal", "Normal"], ["up", "↑ Increased"]],
    eff: { down: ["stim", "Stimulates renin release: ↓ arterial BP → ↓ renal perfusion pressure"],
           up: ["supp", "Suppresses renin release"] } },
  { k: "abp", n: "Arterial blood pressure (renal perfusion pressure)",
    opts: [["down", "↓ Decreased"], ["normal", "Normal"], ["up", "↑ Increased"]],
    eff: { down: ["stim", "Stimulates renin release: ↓ renal perfusion pressure is detected by baroreceptors in the afferent arteriole"],
           up: ["supp", "Suppresses renin release (↑ renal perfusion pressure)"] } }
];

function reninNet() {
  let st = 0, sp = 0;
  INPUTS.forEach(inp => {
    const e = inp.eff[state.inputs[inp.k]];
    if (!e) return;
    if (e[0] === "stim") st++;
    if (e[0] === "supp") sp++;
  });
  if (!st && !sp) return { dir: "none", big: "Baseline", text: "No input has changed." };
  if (st && !sp) return { dir: "up", big: "↑ Renin release", text: "The changed inputs all stimulate renin release." };
  if (sp && !st) return { dir: "down", big: "↓ Renin release", text: "The changed inputs all suppress renin release." };
  return { dir: "mixed", big: "Opposing inputs", text: "Some inputs stimulate renin release and others suppress it." };
}

function renderInputs() {
  const wrap = $("inputs");
  wrap.innerHTML = "";
  INPUTS.forEach(inp => {
    const row = document.createElement("div");
    row.className = "input-row";
    row.innerHTML = `<div class="input-name">${inp.n}</div>`;
    const opts = document.createElement("div");
    opts.className = "input-opts";
    opts.setAttribute("role", "group");
    opts.setAttribute("aria-label", inp.n);
    inp.opts.forEach(([val, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "opt" + (state.inputs[inp.k] === val ? " on" : "");
      b.textContent = label;
      b.setAttribute("aria-pressed", state.inputs[inp.k] === val);
      b.addEventListener("click", () => { state.inputs[inp.k] = val; renderInputs(); });
      opts.appendChild(b);
    });
    row.appendChild(opts);
    const e = inp.eff[state.inputs[inp.k]];
    const eff = document.createElement("div");
    eff.className = "input-effect" + (e ? ` ${e[0]}` : "");
    eff.textContent = e ? (e[0] === "stim" ? "+ " : e[0] === "supp" ? "− " : "± ") + e[1] : "No effect on renin";
    row.appendChild(eff);
    wrap.appendChild(row);
  });
  const r = reninNet();
  $("reninResult").innerHTML = `<span class="big">${r.big}</span>${r.text}`;
  drawInputs();
}

/* The diagram follows the inputs while the Renin inputs tab is open */
const STIM_NAME = { nacl: "↓ body NaCl", ecf: "↓ ECF volume", abp: "↓ arterial blood pressure" };
const SUPP_NAME = { ecf: "↑ ECF volume", abp: "↑ arterial blood pressure (↑ renal perfusion pressure)" };
const listText = arr => arr.length < 2 ? arr.join("") : arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];

function drawInputs() {
  clearStage();
  const inp = state.inputs;
  const stim = ["nacl", "ecf", "abp"].filter(k => inp[k] === "down");
  const supp = ["ecf", "abp"].filter(k => inp[k] === "up");
  const S = stim.length > 0, P = supp.length > 0;

  $("chipNacl").classList.toggle("on", stim.includes("nacl"));
  $("chipEcf").classList.toggle("on", stim.includes("ecf"));
  $("chipAbp").classList.toggle("on", stim.includes("abp"));
  $("trigger").classList.add(S ? "focus" : "idle");

  if (!S && !P) {
    updateReninBadge();
    setStatus("<b>Renin inputs:</b> all inputs are normal, so renin release stays at baseline and the pathway is not activated.");
    return;
  }

  ["kidneyCard.active", "aKidneyRenin", "reninBox"].forEach(applyEntry);

  if (S) {
    ["aTriggerKidney", "plusKidney"].forEach(applyEntry);
    for (let i = 3; i <= 5; i++) STEPS[i].base.forEach(applyEntry);
    // With no opposing input, show angiotensin II's effects as well
    if (!P) STEPS[6].own.filter(e => e !== "angII.focus").forEach(applyEntry);
  }

  if (P) {
    $("inputBoxText").textContent = listText(supp.map(k => SUPP_NAME[k]));
    ["inputBox", "aLongLoop", "minusLong", "longLoopNote"].forEach(applyEntry);
  }
  updateReninBadge();

  const sText = listText(stim.map(k => STIM_NAME[k]));
  const pText = listText(supp.map(k => SUPP_NAME[k]));
  if (S && !P) {
    setStatus(`<b>Renin inputs:</b> ${sText} → ↓ renal perfusion pressure → <b>↑ renin release</b>. The pathway runs through angiotensin II and its effects.`);
  } else if (P && !S) {
    setStatus(`<b>Renin inputs:</b> ${pText} ${supp.length > 1 ? "suppress" : "suppresses"} renin release (<b>negative feedback</b>). Renin release ↓.`);
  } else {
    setStatus(`<b>Renin inputs:</b> ${sText} ${stim.length > 1 ? "stimulate" : "stimulates"} renin release, while ${pText} ${supp.length > 1 ? "suppress" : "suppresses"} it: <b>opposing inputs</b>.`);
  }
}

const PRESETS = {
  hypo: { nacl: "down", ecf: "down", abp: "down" },
  restored: { nacl: "normal", ecf: "up", abp: "up" },
  clear: { nacl: "normal", ecf: "normal", abp: "normal" }
};

/* =====================================================================
   11. LABEL IT
   ===================================================================== */
const LABELS = [
  { k: "aldo", text: "Aldosterone", organ: "adrenal", show: ["aldo", "aAdrenalAldo"],
    ok: "Correct. Circulating angiotensin II stimulates aldosterone release from the zona glomerulosa of the adrenal cortex.",
    hint: "Angiotensin II stimulates its release from the outer layer of a gland above the kidney." },
  { k: "renin", text: "Renin", organ: "kidney", show: ["reninBox", "aKidneyRenin"],
    ok: "Correct. Renin is produced primarily by the juxtaglomerular (granular) cells in the wall of the afferent arteriole.",
    hint: "Renin comes from cells in the wall of the afferent arteriole." },
  { k: "ace", text: "ACE", organ: "lungs", show: ["aceBox", "aLungsAce"],
    ok: "Correct. In the systemic system, ACE is located primarily in the vascular endothelium of the lung.",
    hint: "In the systemic system, ACE sits in the vascular endothelium of one organ." },
  { k: "agt", text: "Angiotensinogen", organ: "liver", show: ["angGen", "aLiver"],
    ok: "Correct. Angiotensinogen is produced primarily by the liver.",
    hint: "It is produced primarily by one organ outside the kidney." }
];
const ORGAN_NAME = { liver: "liver", kidney: "kidney", lungs: "lungs", adrenal: "adrenal cortex" };

function renderLabel() {
  clearStage();
  const tray = $("labelTray");
  tray.innerHTML = "";
  LABELS.forEach(l => {
    if (state.label.placed[l.k]) {
      l.show.forEach(applyEntry);
      document.querySelector(`[data-organ="${l.organ}"]`).classList.add("placed");
    }
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "drag-chip" + (state.label.placed[l.k] ? " done" : "");
    chip.textContent = (state.label.placed[l.k] ? "✓ " : "") + l.text;
    chip.dataset.label = l.k;
    chip.disabled = !!state.label.placed[l.k];
    chip.setAttribute("aria-pressed", state.label.selected === l.k);
    if (!chip.disabled) attachDrag(chip);
    tray.appendChild(chip);
  });
  const count = Object.keys(state.label.placed).length;
  if (count === LABELS.length) {
    const last = $("labelFeedback").textContent;
    $("labelFeedback").textContent = (last.startsWith("Correct") ? last + " " : "") + "All four placed. Press Start again to repeat.";
  } else if (!$("labelFeedback").textContent) {
    $("labelFeedback").textContent = `${count} of ${LABELS.length} placed.`;
  }
  setStatus("<b>Label it (systemic RAS):</b> drag each label onto its main source organ in the systemic system.");
  updateReninBadge();
}

function dropLabel(k, organ) {
  const l = LABELS.find(x => x.k === k);
  const card = document.querySelector(`[data-organ="${organ}"]`);
  if (!l || !card) return;
  state.label.selected = null;
  if (l.organ === organ) {
    state.label.placed[k] = true;
    $("labelFeedback").textContent = l.ok;
    renderLabel();
  } else {
    const irNote = organ === "kidney" && (k === "agt" || k === "ace")
      ? ` (The kidney does have local ${k === "agt" ? "angiotensinogen" : "ACE"} in the intrarenal RAS, but this exercise asks about the systemic system.)` : "";
    $("labelFeedback").textContent = `Not the main systemic source. ${l.hint}${irNote}`;
    renderLabel();
    const c = document.querySelector(`[data-organ="${organ}"]`);
    c.classList.add("wrong");
    setTimeout(() => c.classList.remove("wrong"), 450);
  }
}

function attachDrag(chip) {
  let startX = 0, startY = 0, dragging = false, ghost = null, hover = null;

  const organAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el ? el.closest(".organ-card") : null;
  };

  chip.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    startX = e.clientX; startY = e.clientY; dragging = false;
    chip.setPointerCapture(e.pointerId);
  });

  chip.addEventListener("pointermove", e => {
    if (!chip.hasPointerCapture(e.pointerId)) return;
    if (!dragging && Math.hypot(e.clientX - startX, e.clientY - startY) > 6) {
      dragging = true;
      ghost = chip.cloneNode(true);
      ghost.classList.add("drag-ghost");
      document.body.appendChild(ghost);
    }
    if (dragging) {
      ghost.style.left = e.clientX + "px";
      ghost.style.top = e.clientY + "px";
      const o = organAt(e.clientX, e.clientY);
      if (hover && hover !== o) hover.classList.remove("drop-hover");
      hover = o;
      if (hover) hover.classList.add("drop-hover");
    }
  });

  const end = e => {
    if (!chip.hasPointerCapture(e.pointerId)) return;
    chip.releasePointerCapture(e.pointerId);
    if (ghost) { ghost.remove(); ghost = null; }
    if (hover) hover.classList.remove("drop-hover");
    if (dragging) {
      const o = organAt(e.clientX, e.clientY);
      chip.dataset.justDragged = "1";
      hover = null;
      if (o) dropLabel(chip.dataset.label, o.dataset.organ);
    }
  };
  chip.addEventListener("pointerup", end);
  chip.addEventListener("pointercancel", end);

  // Tap/click (or keyboard) selects the label; then tap an organ
  chip.addEventListener("click", () => {
    if (chip.dataset.justDragged) { delete chip.dataset.justDragged; return; }
    const k = chip.dataset.label;
    state.label.selected = state.label.selected === k ? null : k;
    document.querySelectorAll(".drag-chip").forEach(c => c.setAttribute("aria-pressed", c.dataset.label === state.label.selected));
    if (state.label.selected) {
      $("labelFeedback").textContent = `Now tap the organ that produces ${chip.textContent}.`;
    }
  });
}

/* =====================================================================
   12. DETAIL POP-UPS
   ===================================================================== */
function openDialog(id) {
  const d = $(id);
  if (!d.open) d.showModal();
}
document.querySelectorAll("dialog.detail").forEach(d => {
  d.addEventListener("click", e => {
    if (e.target === d || e.target.closest("[data-close]")) d.close();
  });
});

/* Tubules: reveal one at a time for recall */
function tubulesReset() {
  document.querySelectorAll("#tubuleList li").forEach(li => { li.hidden = true; });
  $("tubuleNext").hidden = false;
}
$("tubuleNext").addEventListener("click", () => {
  const next = document.querySelector("#tubuleList li[hidden]");
  if (next) next.hidden = false;
  if (!document.querySelector("#tubuleList li[hidden]")) $("tubuleNext").hidden = true;
});
$("tubuleAll").addEventListener("click", () => {
  document.querySelectorAll("#tubuleList li").forEach(li => { li.hidden = false; });
  $("tubuleNext").hidden = true;
});
$("tubuleHide").addEventListener("click", tubulesReset);

/* =====================================================================
   14. EVENT WIRING
   ===================================================================== */
document.querySelectorAll("#stepControls button[data-step]").forEach(btn =>
  btn.addEventListener("click", () => { stopPlay(); goTo(Number(btn.dataset.step)); }));

$("btnBack").addEventListener("click", () => { stopPlay(); goTo(state.step - 1); });
$("btnNext").addEventListener("click", () => { stopPlay(); goTo(state.step + 1); });
$("btnPlay").addEventListener("click", togglePlay);
$("btnComplete").addEventListener("click", () => { stopPlay(); goTo(LAST); });

$("reset").addEventListener("click", () => {
  stopPlay();
  cancelPending();
  hideQuiz();
  state.answered = {};
  state.score = { right: 0, total: 0 };
  state.predictResults = {};
  state.label = { placed: {}, selected: null };
  state.inputs = { ...PRESETS.clear };
  $("labelFeedback").textContent = "";
  updateScore();
  if (state.view === "intrarenal") setView("systemic");
  setTab("changes", true);
  render(0);
});

$("modeLearn").addEventListener("click", () => setMode("learn"));
$("modeQuiz").addEventListener("click", () => setMode("quiz"));
$("viewSystemic").addEventListener("click", () => setView("systemic"));
$("viewIntrarenal").addEventListener("click", () => setView("intrarenal"));

document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => setTab(t.dataset.tab)));
document.querySelectorAll("[data-preset]").forEach(b => b.addEventListener("click", () => {
  state.inputs = { ...PRESETS[b.dataset.preset] };
  renderInputs();
}));
document.querySelectorAll("#relation .chip-btn").forEach(b => b.addEventListener("click", () => setRelation(b.dataset.rel)));
$("irQuizBtn").addEventListener("click", runIrQuiz);
$("labelRestart").addEventListener("click", () => {
  state.label = { placed: {}, selected: null };
  $("labelFeedback").textContent = "";
  renderLabel();
});

/* Clicking things on the diagram */
const STAGE_CLICKS = {
  trigger: () => goTo(1),
  kidneyCard: () => goTo(2),
  liverCard: () => goTo(3),
  lungsCard: () => goTo(4),
  adrenalCard: () => goTo(5),
  angGen: () => goTo(3),
  angI: () => goTo(3),
  aceBox: () => goTo(4),
  angII: () => goTo(6),
  aldo: () => goTo(7),
  reninBox: () => openDialog("reninDialog"),
  tubuleCard: () => { tubulesReset(); openDialog("tubuleDialog"); }
};

Object.entries(STAGE_CLICKS).forEach(([id, fn]) => {
  const node = $(id);
  const handler = () => {
    if (state.tab === "label") {
      if (node.dataset.organ && state.label.selected) dropLabel(state.label.selected, node.dataset.organ);
      else if (node.dataset.organ) $("labelFeedback").textContent = "Pick a label first, then tap the organ.";
      return;
    }
    stopPlay();
    fn();
  };
  node.addEventListener("click", handler);
  node.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(); }
  });
});

Object.keys(IR_INFO).forEach(id => {
  const node = $(id);
  node.addEventListener("click", () => selectIr(id));
  node.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectIr(id); } });
});

/* Keyboard shortcuts for presenting: ← → and space */
document.addEventListener("keydown", e => {
  if (document.querySelector("dialog[open]")) return;
  const tag = (e.target.tagName || "").toLowerCase();
  if (["input", "textarea", "select"].includes(tag)) return;
  if (state.view !== "systemic" || isActivity()) return;
  if (e.key === "ArrowRight") { e.preventDefault(); stopPlay(); goTo(state.step + 1); }
  if (e.key === "ArrowLeft") { e.preventDefault(); stopPlay(); goTo(state.step - 1); }
  if (e.key === " " && (e.target === document.body)) { e.preventDefault(); togglePlay(); }
});

/* =====================================================================
   15. ZOOM (30% to 100% in 5% steps, centred)
   ===================================================================== */
const zoomSlider = $("zoomSlider");
const zoomValue = $("zoomValue");
const stageViewport = $("stageViewport");
const stageScroll = $("stageScroll");
const ZOOM_MIN = 30, ZOOM_MAX = 100, ZOOM_STEP = 5;
const STAGE_W = 1600, STAGE_H = 1250;
let currentZoom = 60;

function applySimulatorZoom() {
  currentZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, currentZoom));
  const scale = currentZoom / 100;
  stageViewport.style.width = STAGE_W * scale + "px";
  stageViewport.style.height = STAGE_H * scale + "px";
  stage.style.transform = `translateX(-50%) scale(${scale})`;
  zoomSlider.value = currentZoom;
  zoomValue.textContent = currentZoom + "%";
  requestAnimationFrame(() => {
    stageScroll.scrollLeft = Math.max(0, stageScroll.scrollWidth - stageScroll.clientWidth) / 2;
  });
}
let userZoomed = false;
function fitZoom() {
  const avail = stageScroll.clientWidth - 4;
  currentZoom = Math.floor((avail / STAGE_W) * 100 / ZOOM_STEP) * ZOOM_STEP;
  applySimulatorZoom();
}
$("zoomOut").addEventListener("click", () => { userZoomed = true; currentZoom -= ZOOM_STEP; applySimulatorZoom(); });
$("zoomIn").addEventListener("click", () => { userZoomed = true; currentZoom += ZOOM_STEP; applySimulatorZoom(); });
zoomSlider.addEventListener("input", e => { userZoomed = true; currentZoom = Number(e.target.value); applySimulatorZoom(); });
$("zoomFit").addEventListener("click", () => { userZoomed = false; fitZoom(); });
window.addEventListener("resize", () => { if (!userZoomed) fitZoom(); });

/* =====================================================================
   16. START
   ===================================================================== */
setRelation("concert");
updateScore();
render(0);
fitZoom();
