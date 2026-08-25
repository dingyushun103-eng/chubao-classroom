// ============ 主逻辑：渲染科目卡片 + 练习模块 + 交互 ============

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  renderSubjects();
  renderQuizTabs();
  initHeroStats();
});

/* ---------- 导航 ---------- */
function initNav() {
  const menuBtn = document.getElementById("menuBtn");
  const navMobile = document.getElementById("navMobile");

  menuBtn.addEventListener("click", () => navMobile.classList.toggle("open"));
  navMobile.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => navMobile.classList.remove("open"))
  );

  // 底部标签栏高亮当前区块
  const tabLinks = document.querySelectorAll(".tabbar a");
  const sections = [...tabLinks].map((a) =>
    document.querySelector(a.getAttribute("href"))
  );

  window.addEventListener(
    "scroll",
    throttle(() => {
      const y = window.scrollY + 120;
      let current = 0;
      sections.forEach((sec, i) => {
        if (sec && sec.offsetTop <= y) current = i;
      });
      tabLinks.forEach((a, i) => a.classList.toggle("active", i === current));
    }, 120)
  );
}

/* ---------- 科目卡片 ---------- */
function renderSubjects() {
  const grid = document.getElementById("subjectsGrid");

  SUBJECTS.forEach((s) => {
    const card = document.createElement("article");
    card.className = "subject-card";
    card.style.setProperty("--accent", s.color);
    card.innerHTML = `
      <div class="icon">${s.icon}</div>
      <h3>${s.name}</h3>
      <p>${s.desc}</p>
    `;
    // 点击卡片滚动到练习区并切换到对应科目
    card.addEventListener("click", () => {
      switchTab(s.id);
      document.getElementById("quiz").scrollIntoView({ behavior: "smooth" });
    });
    grid.appendChild(card);

    // 悬停提示知识点
    card.title = s.points.join(" · ");
  });
}

/* ---------- 数字动画 ---------- */
function initHeroStats() {
  const els = document.querySelectorAll("[data-count]");
  els.forEach((el) => animateCount(el, +el.dataset.count));
}

function animateCount(el, target) {
  const duration = 900;
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ---------- 练习模块 ---------- */
let currentSubject = "math";
let questionIndex = 0;
let score = 0;

function renderQuizTabs() {
  const tabs = document.getElementById("quizTabs");
  tabs.innerHTML = "";

  SUBJECTS.forEach((s) => {
    const btn = document.createElement("button");
    btn.className = "quiz-tab";
    btn.textContent = `${s.icon} ${s.name}`;
    btn.dataset.subject = s.id;
    btn.addEventListener("click", () => switchTab(s.id));
    tabs.appendChild(btn);
  });

  switchTab("math", false);
}

function switchTab(subjectId, restart = true) {
  currentSubject = subjectId;
  if (restart) {
    questionIndex = 0;
    score = 0;
  }

  document
    .querySelectorAll(".quiz-tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.subject === subjectId));

  showQuestion();
}

function showQuestion() {
  const list = QUIZZES[currentSubject] || [];
  const counterEl = document.getElementById("quizCounter");
  const questionEl = document.getElementById("quizQuestion");
  const optionsEl = document.getElementById("quizOptions");
  const feedbackEl = document.getElementById("quizFeedback");
  const nextBtn = document.getElementById("quizNext");
  const progressBar = document.getElementById("quizProgressBar");

  feedbackEl.textContent = "";
  feedbackEl.className = "quiz-feedback";
  nextBtn.hidden = true;

  if (questionIndex >= list.length) {
    // 全部完成
    progressBar.style.width = "100%";
    counterEl.textContent = "完成！";
    questionEl.textContent =
      score === list.length ? `🎉 满分！答对了全部 ${list.length} 题` : `本次得分：${score} / ${list.length}`;
    optionsEl.innerHTML = "";
    nextBtn.textContent = "🔄 再来一次";
    nextBtn.hidden = false;
    return;
  }

  const item = list[questionIndex];
  progressBar.style.width = `${(questionIndex / list.length) * 100}%`;
  counterEl.textContent = `第 ${questionIndex + 1} / ${list.length} 题`;
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
  const list = QUIZZES[currentSubject];
  const item = list[questionIndex];
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
    questionIndex + 1 >= list.length ? "查看结果 🏁" : "下一题 →";
}

document.getElementById("quizNext").addEventListener("click", () => {
  const list = QUIZZES[currentSubject];
  if (questionIndex >= list.length) {
    questionIndex = 0;
    score = 0;
  } else {
    questionIndex++;
  }
  showQuestion();
});

/* ---------- 工具 ---------- */
function throttle(fn, wait) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    }
  };
}
