// ============ 错题本：IndexedDB 本地存储 + 拍照上传 + 练习错题自动收录 ============

const NB_SUBJECTS = {
  chinese: { name: "语文", color: "#ef4444" },
  math: { name: "数学", color: "#3b82f6" },
  english: { name: "英语", color: "#f59e0b" },
};

let currentNbSubject = localStorage.getItem("cb-nb-subject") || "chinese";

/* ---------- IndexedDB 封装 ---------- */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("cb-wrongnotes", 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("notes", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbAdd(note) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction("notes", "readwrite");
        tx.objectStore("notes").add(note).onsuccess = (e) => resolve(e.target.result);
        tx.onerror = () => reject(tx.error);
      })
  );
}

function dbGetAll(subject) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const req = db.transaction("notes").objectStore("notes").getAll();
        req.onsuccess = () =>
          resolve(req.result.filter((n) => n.subject === subject).sort((a, b) => b.id - a.id));
        req.onerror = () => reject(req.error);
      })
  );
}

function dbDelete(id) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction("notes", "readwrite");
        tx.objectStore("notes").delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

function dbPut(note) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction("notes", "readwrite");
        tx.objectStore("notes").put(note);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

/* ---------- 页面初始化 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initTabs();
  initUpload();
  initReview();
  renderNotes();
});

/* ---------- 科目切换 ---------- */
function initTabs() {
  document.querySelectorAll(".nb-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentNbSubject = btn.dataset.subject;
      localStorage.setItem("cb-nb-subject", currentNbSubject);
      document.querySelectorAll(".nb-tab").forEach((b) => b.classList.toggle("active", b === btn));
      renderNotes();
    });
    if (btn.dataset.subject === currentNbSubject) btn.click();
  });
}

/* ---------- 拍照 / 选图上传 ---------- */
function initUpload() {
  const btn = document.getElementById("uploadBtn");
  const input = document.getElementById("fileInput");
  btn.addEventListener("click", () => input.click());
  input.addEventListener("change", async () => {
    const file = input.files[0];
    input.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const blob = await compressImage(file);
      await dbAdd({ subject: currentNbSubject, kind: "image", img: blob, created: Date.now() });
      renderNotes();
    } catch (err) {
      alert("保存失败：" + err.message);
    }
  });
}

// 压缩图片：最长边 1200px，JPEG 质量 0.7，节省存储空间
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("图片处理失败"))), "image/jpeg", 0.7);
      };
      img.onerror = () => reject(new Error("无法读取该图片"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

/* ---------- 渲染错题列表 ---------- */
async function renderNotes() {
  const list = document.getElementById("noteList");
  list.innerHTML = "";
  const notes = await dbGetAll(currentNbSubject);

  // 复习入口栏：显示待复习（未掌握）数量
  const pending = notes.filter((n) => !n.mastered).length;
  const bar = document.getElementById("reviewBar");
  const barCount = document.getElementById("reviewCount");
  if (bar && barCount) {
    bar.hidden = !notes.length;
    barCount.textContent = pending
      ? `共 ${notes.length} 题 · 待复习 ${pending} 题`
      : `共 ${notes.length} 题 · 全部已掌握 🎉`;
    document.getElementById("reviewBtn").disabled = !pending;
  }

  if (!notes.length) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="big">📭</span>
        ${NB_SUBJECTS[currentNbSubject].name}错题本还是空的<br />
        拍照上传写错的题目，或去<a href="index.html#quiz" style="color:var(--primary);font-weight:600">做练习</a>（答错的题会自动收进来）
      </div>`;
    return;
  }

  for (const note of notes) {
    const card = document.createElement("article");
    card.className = "note-card" + (note.mastered ? " mastered" : "");
    const date = new Date(note.created).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const badge = `<span class="badge" style="background:${NB_SUBJECTS[note.subject].color}">${NB_SUBJECTS[note.subject].name}</span>`;
    const masteredBadge = note.mastered ? `<span class="badge" style="background:#22c55e">✅ 已掌握</span>` : "";

    if (note.kind === "image" && note.img instanceof Blob) {
      const url = URL.createObjectURL(note.img);
      card.innerHTML = `
        <img src="${url}" alt="错题照片" loading="lazy" />
        <div class="note-body">
          <div class="note-meta">${badge}${masteredBadge}<span>${date}</span></div>
        </div>
        <div class="note-actions">
          ${note.mastered ? '<button class="restore-btn">↩ 恢复复习</button>' : ""}
          <button class="del-btn">🗑 删除</button>
        </div>`;
    } else {
      card.innerHTML = `
        <div class="note-body">
          <p class="note-text">${note.title}</p>
          <p class="answer-line">✅ 正确答案：${note.answerText}</p>
          <div class="note-meta">${badge}${masteredBadge}<span>${date} · 来自随堂练习</span></div>
        </div>
        <div class="note-actions">
          ${note.mastered ? '<button class="restore-btn">↩ 恢复复习</button>' : ""}
          <button class="del-btn">🗑 删除</button>
        </div>`;
    }

    card.querySelector(".del-btn").addEventListener("click", async () => {
      if (!confirm("确定删除这条错题吗？")) return;
      await dbDelete(note.id);
      renderNotes();
    });
    card.querySelector(".restore-btn")?.addEventListener("click", async () => {
      note.mastered = false;
      await dbPut(note);
      renderNotes();
    });

    list.appendChild(card);
  }
}

/* ---------- 复习模式：隐藏答案自测、标记已掌握 ---------- */
let reviewQueue = [];
let reviewIndex = 0;
let reviewAnswered = false;

function initReview() {
  document.getElementById("reviewBtn")?.addEventListener("click", startReview);
  document.getElementById("reviewExit")?.addEventListener("click", exitReview);
  document.getElementById("reviewMaster")?.addEventListener("click", async () => {
    const note = reviewQueue[reviewIndex];
    if (!note) return;
    note.mastered = true;
    await dbPut(note);
    reviewQueue.splice(reviewIndex, 1); // 已掌握即移出本轮队列
    renderReviewNote();
  });
}

async function startReview() {
  const notes = await dbGetAll(currentNbSubject);
  reviewQueue = notes.filter((n) => !n.mastered);
  reviewIndex = 0;
  if (!reviewQueue.length) return;

  document.getElementById("noteList").hidden = true;
  document.querySelector(".upload-zone").hidden = true;
  document.getElementById("reviewBar").hidden = true;
  document.getElementById("reviewCard").hidden = false;
  renderReviewNote();
}

function exitReview() {
  document.getElementById("reviewCard").hidden = true;
  document.getElementById("noteList").hidden = false;
  document.querySelector(".upload-zone").hidden = false;
  document.getElementById("reviewBar").hidden = false;
  renderNotes();
}

function renderReviewNote() {
  const body = document.getElementById("reviewBody");
  const feedback = document.getElementById("reviewFeedback");
  const progress = document.getElementById("reviewProgress");
  const masterBtn = document.getElementById("reviewMaster");
  const nextBtn = document.getElementById("reviewNext");
  feedback.textContent = "";
  feedback.className = "quiz-feedback";
  reviewAnswered = false;

  // 本轮复习完成
  if (reviewIndex >= reviewQueue.length) {
    progress.textContent = "复习完成";
    body.innerHTML = `<div class="review-done"><span class="big">🎉</span>本轮复习完成，继续保持！</div>`;
    masterBtn.hidden = true;
    nextBtn.textContent = "↩ 返回错题本";
    nextBtn.onclick = exitReview;
    return;
  }

  nextBtn.onclick = () => { reviewIndex++; renderReviewNote(); };
  const note = reviewQueue[reviewIndex];
  progress.textContent = `第 ${reviewIndex + 1} / ${reviewQueue.length} 题`;
  masterBtn.hidden = false;
  nextBtn.textContent = reviewIndex + 1 >= reviewQueue.length ? "完成 ✓" : "下一题 →";

  if (note.options && note.options.length) {
    // 有选项：隐藏答案自测
    body.innerHTML = `<h3 class="quiz-question">${note.title}</h3><div class="quiz-options"></div>`;
    const optionsEl = body.querySelector(".quiz-options");
    note.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        if (reviewAnswered) return;
        reviewAnswered = true;
        const buttons = optionsEl.querySelectorAll(".quiz-option");
        buttons.forEach((b) => (b.disabled = true));
        buttons[note.answerIndex].classList.add("correct");
        if (i === note.answerIndex) {
          feedback.textContent = "✅ 回答正确！";
          feedback.classList.add("ok");
        } else {
          btn.classList.add("wrong");
          feedback.textContent = "❌ 再想想，正确答案已标出";
          feedback.classList.add("err");
        }
      });
      optionsEl.appendChild(btn);
    });
  } else if (note.kind === "image" && note.img instanceof Blob) {
    // 图片错题：直接看图自测
    const url = URL.createObjectURL(note.img);
    body.innerHTML = `<img class="review-img" src="${url}" alt="错题照片" /><p class="review-tip">看着题目在心里作答，然后点击下方按钮</p>`;
  } else {
    // 老数据（无选项）：先想后显示答案
    body.innerHTML = `
      <h3 class="quiz-question">${note.title}</h3>
      <p class="answer-line" hidden>✅ 正确答案：${note.answerText}</p>
      <button class="btn btn-outline review-reveal">👀 显示答案</button>`;
    body.querySelector(".review-reveal").addEventListener("click", (e) => {
      body.querySelector(".answer-line").hidden = false;
      e.target.hidden = true;
      reviewAnswered = true;
    });
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
