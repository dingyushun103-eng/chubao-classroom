// ============ 科目分级页面：小学 / 初中 / 高中 ============

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderSubjectPage();
});

function getSubjectId() {
  return new URLSearchParams(location.search).get("id") || "chinese";
}

function renderSubjectPage() {
  const id = getSubjectId();
  const subject = SUBJECTS.find((s) => s.id === id);
  if (!subject || !SUBJECT_CONTENT[id]) {
    document.querySelector("main .container").innerHTML =
      "<p style='padding:60px 0;text-align:center'>未找到该科目。<a href='index.html' style='color:var(--primary)'>返回首页</a></p>";
    return;
  }

  document.title = `${subject.name}知识清单 · 楚宝课堂`;
  document.getElementById("subIcon").textContent = subject.icon;
  const nameEl = document.getElementById("subName");
  nameEl.textContent = subject.name;
  document.getElementById("subDesc").textContent = subject.desc;
  document.documentElement.style.setProperty("--accent", subject.color);

  // 学段切换标签（仅一个学段时隐藏）
  const tabs = document.getElementById("stageTabs");
  if (STAGES.length < 2) {
    tabs.style.display = "none";
  } else {
    tabs.innerHTML = "";
    STAGES.forEach((stage) => {
      const btn = document.createElement("button");
      btn.className = "stage-tab";
      btn.textContent = stage.name;
      btn.dataset.stage = stage.id;
      btn.addEventListener("click", () => showStage(id, stage.id));
      tabs.appendChild(btn);
    });
  }

  showStage(id, "primary");
}

function showStage(subjectId, stageId) {
  document.querySelectorAll(".stage-tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.stage === stageId)
  );

  const stage = STAGES.find((s) => s.id === stageId);
  const content = SUBJECT_CONTENT[subjectId][stageId] || [];
  const grid = document.getElementById("gradeGrid");
  grid.innerHTML = "";

  stage.grades.forEach((grade, i) => {
    const points = content[i] || [];
    const card = document.createElement("article");
    card.className = "grade-card";
    card.innerHTML = `
      <h3>${grade}</h3>
      <div class="count">共 ${points.length} 个知识模块 · 点击展开详情</div>
      <ul>${points
        .map((p) => {
          const [title, detail] = Array.isArray(p) ? p : [p, ""];
          return `<li><b>✅ ${title}</b>${detail ? `<span>${detail}</span>` : ""}</li>`;
        })
        .join("")}</ul>
    `;
    card.addEventListener("click", () => card.classList.toggle("open"));
    grid.appendChild(card);
  });
}

/* ---------- 深色模式（与首页一致） ---------- */
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
