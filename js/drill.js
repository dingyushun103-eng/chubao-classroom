// ============ 口算专项练习页：随机题库生成 + 答题 + 计时计分 ============

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initDrillControls();
});

let drillOp = "addsub";   // 运算类型：addsub/add/sub/mul/div/mixed
let drillLevel = "easy";  // 难度：easy/medium/hard
let drillList = [];
let questionIndex = 0;
let score = 0;
let startTime = 0;

// 支持 URL 参数预选（首页练习区带参跳转）：drill.html?op=mul&level=hard
const _drillParams = new URLSearchParams(location.search);
if (DRILL_LEVEL_LABELS[_drillParams.get("op")]) drillOp = _drillParams.get("op");
if (["easy", "medium", "hard"].includes(_drillParams.get("level"))) drillLevel = _drillParams.get("level");

function updateLevelLabels() {
  const labels = DRILL_LEVEL_LABELS[drillOp] || DRILL_LEVEL_LABELS.mixed;
  document.querySelectorAll("#drillLevels .drill-chip").forEach((chip, i) => {
    if (labels[i]) chip.textContent = labels[i];
  });
}

function initDrillControls() {
  document.querySelectorAll("#drillOps .drill-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      drillOp = chip.dataset.op;
      document.querySelectorAll("#drillOps .drill-chip").forEach((c) =>
        c.classList.toggle("active", c === chip));
      updateLevelLabels();
    });
  });
  document.querySelectorAll("#drillLevels .drill-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      drillLevel = chip.dataset.level;
      document.querySelectorAll("#drillLevels .drill-chip").forEach((c) =>
        c.classList.toggle("active", c === chip));
    });
  });
  document.getElementById("startBtn").addEventListener("click", startDrill);
  document.getElementById("quizNext").addEventListener("click", onNext);

  // 按（URL 预选的）当前状态同步芯片高亮与难度标签
  document.querySelectorAll("#drillOps .drill-chip").forEach((c) =>
    c.classList.toggle("active", c.dataset.op === drillOp));
  document.querySelectorAll("#drillLevels .drill-chip").forEach((c) =>
    c.classList.toggle("active", c.dataset.level === drillLevel));
  updateLevelLabels();
}

function startDrill() {
  drillList = genDrillSet(drillOp, drillLevel);
  questionIndex = 0;
  score = 0;
  startTime = Date.now();
  document.getElementById("quizCard").hidden = false;
  document.getElementById("startBtn").textContent = "🔄 重新生成题目";
  showQuestion();
}

function showQuestion() {
  const counterEl = document.getElementById("quizCounter");
  const questionEl = document.getElementById("quizQuestion");
  const optionsEl = document.getElementById("quizOptions");
  const feedbackEl = document.getElementById("quizFeedback");
  const nextBtn = document.getElementById("quizNext");
  const progressBar = document.getElementById("quizProgressBar");

  feedbackEl.textContent = "";
  feedbackEl.className = "quiz-feedback";
  nextBtn.hidden = true;

  if (questionIndex >= drillList.length) {
    const secs = Math.round((Date.now() - startTime) / 1000);
    progressBar.style.width = "100%";
    counterEl.textContent = "完成！";
    questionEl.textContent =
      score === drillList.length
        ? `🎉 满分！答对了全部 ${drillList.length} 题 · 用时 ${secs} 秒`
        : `本次得分：${score} / ${drillList.length} · 用时 ${secs} 秒`;
    optionsEl.innerHTML = "";
    nextBtn.textContent = "🔄 再来一次";
    nextBtn.hidden = false;
    return;
  }

  const item = drillList[questionIndex];
  progressBar.style.width = `${(questionIndex / drillList.length) * 100}%`;
  counterEl.textContent = `第 ${questionIndex + 1} / ${drillList.length} 题 · 已答对 ${score} 题`;
  questionEl.textContent = item.q;
  optionsEl.innerHTML = "";

  item.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = opt;
    btn.addEventListener("click", () => selectAnswer(i, btn));
    optionsEl.appendChild(btn);
  });
}

function selectAnswer(index, clickedBtn) {
  const item = drillList[questionIndex];
  const buttons = document.querySelectorAll(".quiz-option");
  const feedbackEl = document.getElementById("quizFeedback");
  const nextBtn = document.getElementById("quizNext");

  buttons.forEach((b) => (b.disabled = true));
  buttons[item.answer].classList.add("correct");

  if (index === item.answer) {
    score++;
    feedbackEl.textContent = "✅ 回答正确！";
    feedbackEl.classList.add("ok");
  } else {
    clickedBtn.classList.add("wrong");
    feedbackEl.textContent = "❌ 再想想，正确答案已标出";
    feedbackEl.classList.add("err");
  }

  nextBtn.hidden = false;
  nextBtn.textContent =
    questionIndex + 1 >= drillList.length ? "查看结果 🏁" : "下一题 →";
}

function onNext() {
  if (questionIndex >= drillList.length) {
    startDrill(); // 完成后直接重新生成一组新题
  } else {
    questionIndex++;
    showQuestion();
  }
}

/* ---------- 深色模式（与其他页面一致） ---------- */
function initTheme() {
  const btn = document.getElementById("themeBtn");
  const apply = (dark) => {
    document.body.classList.toggle("dark", dark);
    btn.textContent = dark ? "☀️" : "🌙";
  };
  let dark = localStorage.getItem("cb-theme") === "dark";
  if (!localStorage.getItem("cb-theme") && matchMedia("(prefers-color-scheme: dark)").matches) dark = true;
  apply(dark);

  btn.addEventListener("click", () => {
    dark = !document.body.classList.contains("dark");
    localStorage.setItem("cb-theme", dark ? "dark" : "light");
    apply(dark);
  });
}
