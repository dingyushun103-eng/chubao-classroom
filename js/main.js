// ============ 主逻辑：渲染科目卡片 + 练习入口 + 交互 ============

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initQuizBank();
  initNav();
  renderSubjects();
  initHeroStats();
  initReveal();
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

/* ---------- 统计真实题库总数 ---------- */
function initQuizBank() {
  // 语文分册题（人教版 6 册）+ 英语单元单词（外研版全部）计入“练习题”统计
  let total = 0;
  for (const key in CHINESE_BOOK_QUIZZES) total += CHINESE_BOOK_QUIZZES[key].questions.length;
  for (const g in EN_UNITS) EN_UNITS[g].forEach((b) => b.units.forEach((u) => (total += u.words.length)));
  const qEl = document.getElementById("statQuestions");
  if (qEl) qEl.dataset.count = Math.max(total, 1);

  // 更新“知识点”统计：所有科目知识模块总数
  let modules = 0;
  for (const sid in SUBJECT_CONTENT) {
    SUBJECT_CONTENT[sid].primary?.forEach((g) => (modules += g.length));
  }
  const pEl = document.getElementById("statPoints");
  if (pEl) pEl.dataset.count = Math.max(modules, 1);

  // 更新“科目”统计
  const sEl = document.getElementById("statSubjects");
  if (sEl) sEl.dataset.count = Math.max(SUBJECTS.length, 1);
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
    card.addEventListener("click", () => (location.href = `subject.html?id=${s.id}`));
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
