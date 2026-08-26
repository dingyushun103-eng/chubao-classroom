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

/* ---------- 页面初始化 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initTabs();
  initUpload();
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
    card.className = "note-card";
    const date = new Date(note.created).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const badge = `<span class="badge" style="background:${NB_SUBJECTS[note.subject].color}">${NB_SUBJECTS[note.subject].name}</span>`;

    if (note.kind === "image" && note.img instanceof Blob) {
      const url = URL.createObjectURL(note.img);
      card.innerHTML = `
        <img src="${url}" alt="错题照片" loading="lazy" />
        <div class="note-body">
          <div class="note-meta">${badge}<span>${date}</span></div>
        </div>
        <button class="del-btn">🗑 删除</button>`;
    } else {
      card.innerHTML = `
        <div class="note-body">
          <p class="note-text">${note.title}</p>
          <p class="answer-line">✅ 正确答案：${note.answerText}</p>
          <div class="note-meta">${badge}<span>${date} · 来自随堂练习</span></div>
        </div>
        <button class="del-btn">🗑 删除</button>`;
    }

    card.querySelector(".del-btn").addEventListener("click", async () => {
      if (!confirm("确定删除这条错题吗？")) return;
      await dbDelete(note.id);
      renderNotes();
    });

    list.appendChild(card);
  }
}

/* ---------- 供练习模块调用：自动收录答错的题目 ---------- */
async function addWrongQuestion(subjectId, question, options, answerIndex) {
  try {
    await dbAdd({
      subject: subjectId,
      kind: "text",
      title: `${question}<br />你选了：${options.find ? "" : ""}`,
      options,
      answerIndex,
      answerText: options[answerIndex],
      created: Date.now(),
    });
  } catch (e) {
    /* 静默失败，不打断答题流程 */
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
