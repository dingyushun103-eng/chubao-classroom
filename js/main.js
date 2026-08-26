// ============ 主逻辑：渲染科目卡片 + 练习模块 + 交互 ============

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initQuizBank();
  initNav();
  renderSubjects();
  renderQuizTabs();
  initHeroStats();
  initReveal();
  initBackTop();
  initModal();
});

/* ---------- 深色模式 ---------- */
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

/* ---------- 科目详情弹窗 ---------- */
let modalSubject = null;

function openModal(subject) {
  modalSubject = subject;
  document.getElementById("modalIcon").textContent = subject.icon;
  document.getElementById("modalTitle").textContent = subject.name;
  document.getElementById("modalDesc").textContent = subject.desc;
  document.querySelector(".modal").style.setProperty("--accent", subject.color);

  const ul = document.getElementById("modalPoints");
  ul.innerHTML = "";
  subject.points.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = "✅ " + p;
    ul.appendChild(li);
  });

  document.getElementById("modalMask").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("modalMask").classList.remove("open");
  document.body.style.overflow = "";
}

function initModal() {
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalMask").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeModal());
  document.getElementById("modalQuizBtn").addEventListener("click", () => {
    closeModal();
    switchTab(modalSubject.id);
    document.getElementById("quiz").scrollIntoView({ behavior: "smooth" });
  });
}

/* ---------- 随机口算训练 + 统计真实题库总数 ---------- */
let drillMode = false;
let drillList = [];

// 随机口算训练：每次点击生成 10 道混合难度口算题
function startDrill() {
  drillMode = true;
  drillList = genDrillSet();
  questionIndex = 0;
  score = 0;
  currentSubject = "__drill__";
  // 取消科目/学段/年级标签高亮
  document.querySelectorAll("#quizTabs .quiz-tab, #quizStages .quiz-tab, #quizGrades .quiz-tab")
    .forEach((t) => t.classList.remove("active"));
  updateDrillBtn();
  showQuestion();
}

// 随机口算按钮仅在数学练习下显示（训练进行中保持显示，方便再次刷新题目）
function updateDrillBtn() {
  const wrap = document.getElementById("drillBtn")?.parentElement;
  if (!wrap) return;
  wrap.style.display = drillMode || currentSubject === "math" ? "" : "none";
}

function initQuizBank() {
  // 计算全站题库总数，更新首页“练习题”统计数字
  let total = 0;
  for (const sid in QUIZZES) {
    const bank = QUIZZES[sid];
    for (const stage in bank) {
      const st = bank[stage];
      if (Array.isArray(st)) { total += st.length; continue; }
      for (const g in st) total += st[g].length;
    }
  }
  const el = document.querySelector('[data-count="300"]');
  if (el) el.dataset.count = Math.max(total, 1);

  // 更新“知识点”统计：所有科目知识模块总数
  let modules = 0;
  for (const sid in SUBJECT_CONTENT) {
    SUBJECT_CONTENT[sid].primary?.forEach((g) => (modules += g.length));
  }
  const mEl = document.querySelector('[data-count="120"]');
  if (mEl) mEl.dataset.count = Math.max(modules, 1);
}

/* ---------- 导航 ---------- */
function initNav() {
  const menuBtn = document.getElementById("menuBtn");
  const navMobile = document.getElementById("navMobile");

  menuBtn.addEventListener("click", () => navMobile.classList.toggle("open"));
  navMobile.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => navMobile.classList.remove("open"))
  );

  // 返回顶部按钮显隐（与底部标签栏共用滚动监听）
  const backTop = document.getElementById("backTop");
  backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

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
      backTop.classList.toggle("show", window.scrollY > 500);
    }, 120)
  );
}

/* ---------- 科目卡片 ---------- */
function renderSubjects() {
  const grid = document.getElementById("subjectsGrid");

  SUBJECTS.forEach((s, i) => {
    const card = document.createElement("article");
    card.className = "subject-card reveal";
    card.style.setProperty("--accent", s.color);
    card.style.transitionDelay = `${i * 70}ms`;
    card.innerHTML = `
      <div class="icon">${s.icon}</div>
      <h3>${s.name}</h3>
      <p>${s.desc}</p>
      <div class="tags">${s.points.slice(0, 2).map((p) => `<span class="tag">${p}</span>`).join("")}</div>
    `;
    // 点击语文/数学/英语进入分年级页面；物理/化学打开知识点弹窗
    const hasPage = !!SUBJECT_CONTENT[s.id];
    if (hasPage) {
      card.addEventListener("click", () => (location.href = `subject.html?id=${s.id}`));
    } else {
      card.addEventListener("click", () => openModal(s));
    }
    grid.appendChild(card);
  });
}

/* ---------- 数字动画 ---------- */
function initHeroStats() {
  const els = document.querySelectorAll("[data-count]");
  els.forEach((el) => animateCount(el, +el.dataset.count));
}

/* ---------- 滚动渐入 ---------- */
function initReveal() {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }
    }),
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

/* ---------- 返回顶部 ---------- */
function initBackTop() {
  document.getElementById("backTop");
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
let currentStage = "primary";
let currentGrade = "一年级";
let questionIndex = 0;
let score = 0;

// 获取题库列表，支持三级结构：科目 → 学段 → 年级
function getQuizList(subjectId) {
  const bank = QUIZZES[subjectId];
  if (Array.isArray(bank)) return bank;          // 物理/化学：不分学段
  const st = bank?.[currentStage] || [];
  if (Array.isArray(st)) return st;              // 初中/高中：学段直接是数组
  return st[currentGrade] || [];                 // 小学：按年级分组
}

// 当前学段的年级分组题库（无则返回 null）
function getGradeBank() {
  const bank = QUIZZES[currentSubject];
  if (Array.isArray(bank)) return null;
  const st = bank?.[currentStage];
  return Array.isArray(st) ? null : st || null;
}

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

function renderStageTabs() {
  const stageWrap = document.getElementById("quizStages");
  // 目前只有小学一个学段，隐藏学段标签行
  if (STAGES.length < 2) {
    stageWrap.hidden = true;
    renderGradeTabs();
    return;
  }
  const staged = !Array.isArray(QUIZZES[currentSubject]);
  stageWrap.hidden = !staged;
  stageWrap.innerHTML = "";
  if (!staged) { document.getElementById("quizGrades").hidden = true; return; }

  STAGES.forEach((st) => {
    const btn = document.createElement("button");
    btn.className = "quiz-tab stage-subtab";
    btn.textContent = st.name;
    btn.dataset.stage = st.id;
    btn.addEventListener("click", () => {
      currentStage = st.id;
      questionIndex = 0;
      score = 0;
      document.querySelectorAll("#quizStages .quiz-tab").forEach((t) =>
        t.classList.toggle("active", t.dataset.stage === st.id)
      );
      currentGrade = STAGES[0].grades[0]; // 重置到一年级
      renderGradeTabs();
      showQuestion();
    });
    stageWrap.appendChild(btn);
  });
  renderGradeTabs();
}

// 年级子标签：仅当该学段题库按年级分组时显示
function renderGradeTabs() {
  const gradeWrap = document.getElementById("quizGrades");
  if (!gradeWrap) return; // 防御：元素缺失时不阻断后续初始化
  const gradeBank = getGradeBank();
  const grades = gradeBank ? Object.keys(gradeBank) : null;
  gradeWrap.hidden = !grades;
  gradeWrap.innerHTML = "";
  if (!grades) return;

  if (!grades.includes(currentGrade)) currentGrade = grades[0];

  grades.forEach((g) => {
    const btn = document.createElement("button");
    btn.className = "quiz-tab stage-subtab";
    btn.textContent = g.replace("年级", "");
    btn.dataset.grade = g;
    btn.addEventListener("click", () => {
      currentGrade = g;
      questionIndex = 0;
      score = 0;
      document.querySelectorAll("#quizGrades .quiz-tab").forEach((t) =>
        t.classList.toggle("active", t.dataset.grade === g)
      );
      showQuestion();
    });
    gradeWrap.appendChild(btn);
  });
  showQuestion();
}

function switchTab(subjectId, restart = true) {
  currentSubject = subjectId;
  drillMode = false; // 切回普通练习模式
  if (restart) {
    questionIndex = 0;
    score = 0;
  }
  currentStage = "primary";
  renderStageTabs();
  updateDrillBtn();

  document
    .querySelectorAll("#quizTabs .quiz-tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.subject === subjectId));

  showQuestion();
}

function showQuestion() {
  const list = drillMode ? drillList : getQuizList(currentSubject);
  const counterEl = document.getElementById("quizCounter");
  const questionEl = document.getElementById("quizQuestion");
  const optionsEl = document.getElementById("quizOptions");
  const feedbackEl = document.getElementById("quizFeedback");
  const nextBtn = document.getElementById("quizNext");
  const progressBar = document.getElementById("quizProgressBar");

  feedbackEl.textContent = "";
  feedbackEl.className = "quiz-feedback";
  nextBtn.hidden = true;
  renderBestScore(list.length);

  if (questionIndex >= list.length) {
    // 全部完成：记录最佳成绩
    progressBar.style.width = "100%";
    counterEl.textContent = "完成！";
    questionEl.textContent =
      score === list.length ? `🎉 满分！答对了全部 ${list.length} 题` : `本次得分：${score} / ${list.length}`;
    saveBestScore(score);
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
  const list = drillMode ? drillList : getQuizList(currentSubject);
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
    feedbackEl.textContent = "❌ 再想想，正确答案已标出（已收录错题本）";
    feedbackEl.classList.add("err");
    // 语/数/英答错的题自动收进错题本
    if (currentSubject in { chinese: 1, math: 1, english: 1 }) {
      saveWrongToNotebook(item.q, item.options, item.answer);
    }
  }

  nextBtn.hidden = false;
  nextBtn.textContent =
    questionIndex + 1 >= list.length ? "查看结果 🏁" : "下一题 →";
}

/* ---------- 最佳成绩 ---------- */
/* ---------- 错题本：自动收录答错题目 ---------- */
function saveWrongToNotebook(question, options, answerIndex) {
  try {
    const req = indexedDB.open("cb-wrongnotes", 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("notes", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("notes", "readwrite");
      tx.objectStore("notes").add({
        subject: currentSubject,
        kind: "text",
        title: question,
        answerText: options[answerIndex],
        created: Date.now(),
      });
    };
  } catch (e) { /* 静默失败，不打断答题 */ }
}

function bestKey() {
  return `${currentSubject}-${currentGrade}`; // 目前仅小学，按年级记录
}

function getBestScores() {
  try { return JSON.parse(localStorage.getItem("cb-best") || "{}"); } catch { return {}; }
}

function saveBestScore(score) {
  const best = getBestScores();
  const key = bestKey();
  if (!(key in best) || score > best[key]) {
    best[key] = score;
    localStorage.setItem("cb-best", JSON.stringify(best));
  }
}

function renderBestScore(total) {
  const el = document.querySelector(".quiz-best");
  const b = drillMode ? null : getBestScores()[bestKey()];
  el.textContent = b != null ? `🏆 最佳成绩：${b} / ${total}` : "";
}

document.getElementById("drillBtn")?.addEventListener("click", startDrill);

document.getElementById("quizNext").addEventListener("click", () => {
  const list = drillMode ? drillList : getQuizList(currentSubject);
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
