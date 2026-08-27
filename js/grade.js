// ============ 年级详情页：单个年级的知识清单平铺展示 ============

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderGradePage();
});

function getGradeParams() {
  const p = new URLSearchParams(location.search);
  return { id: p.get("id") || "chinese", grade: p.get("grade") || "" };
}

function renderGradePage() {
  const { id, grade } = getGradeParams();
  const subject = SUBJECTS.find((s) => s.id === id);
  const grades = STAGES[0].grades;
  const gradeIndex = grades.indexOf(grade);
  const content = SUBJECT_CONTENT[id]?.primary || [];

  // 年级切换标签：同科目各年级间直接跳转
  const tabs = document.getElementById("gradeTabs");
  grades.forEach((g) => {
    const a = document.createElement("a");
    a.className = "grade-tab" + (g === grade ? " active" : "");
    a.textContent = g.replace("年级", "");
    a.href = `grade.html?id=${id}&grade=${encodeURIComponent(g)}`;
    tabs.appendChild(a);
  });

  if (!subject || gradeIndex < 0 || !content[gradeIndex]) {
    document.title = "未找到页面 · 楚宝课堂";
    document.getElementById("gTitle").textContent = "未找到该年级";
    document.getElementById("gDesc").textContent = "请返回重新选择科目和年级";
    document.getElementById("kpList").innerHTML =
      "<p style='padding:60px 0;text-align:center'>页面不存在。<a href='index.html' style='color:var(--primary)'>返回首页</a></p>";
    return;
  }

  const points = content[gradeIndex];
  document.documentElement.style.setProperty("--accent", subject.color);
  document.title = `${subject.name}${grade}知识清单 · 楚宝课堂`;
  document.getElementById("gIcon").textContent = subject.icon;
  document.getElementById("gTitle").textContent = `${subject.name} · ${grade}`;
  document.getElementById("gDesc").textContent = `共 ${points.length} 个知识模块 · 点击上方年级可切换`;
  document.getElementById("backLink").href = `subject.html?id=${id}`;

  const list = document.getElementById("kpList");
  points.forEach((p) => {
    const [title, detail, extra] = Array.isArray(p) ? p : [p, "", ""];
    const card = document.createElement("article");
    card.className = "kp-card";
    card.innerHTML = `
      <h3>✅ ${title}</h3>
      ${detail ? `<p class="kp-detail">${detail}</p>` : ""}
      ${extra ? `<div class="point-extra">${extra}</div>` : ""}`;
    list.appendChild(card);
  });
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
