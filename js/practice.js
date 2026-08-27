// ============ 分科专项练习页：语文分册（人教版） / 英语单元单词（外研版） ============

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initPractice();
});

const SUBJECT_META = {
  chinese: { name: "语文", icon: "📖", color: "#ef4444" },
  english: { name: "英语", icon: "🔤", color: "#f59e0b" },
};

const params = new URLSearchParams(location.search);
const subject = params.get("subject") === "english" ? "english" : "chinese";

let currentList = null;   // 当前题组
let currentLabel = "";    // 当前题组名称（结果显示用）
let qIndex = 0;
let score = 0;
let startTime = 0;

function initPractice() {
  const meta = SUBJECT_META[subject];
  document.documentElement.style.setProperty("--accent", meta.color);
  document.title = `${meta.name}专项练习 · 楚宝课堂`;
  document.getElementById("pIcon").textContent = meta.icon;
  document.getElementById("pTitle").textContent = `${meta.name}专项练习`;
  document.getElementById("pDesc").textContent =
    subject === "chinese"
      ? "人教版（部编版）教材分册 · 常见古诗词 + 字词，每册 10 题"
      : "外研社《新交际》教材 · 选年级和单元，按 Unit 1-6 顺序练习全部单词";

  const sel = document.getElementById("pSelect");
  if (subject === "chinese") renderChineseSelect(sel);
  else renderEnglishSelect(sel);

  document.getElementById("pNext").addEventListener("click", () => {
    if (qIndex >= currentList.length) {
      startList(currentList, currentLabel); // 完成后重做本组
    } else {
      qIndex++;
      showQuestion();
    }
  });
}

/* ---------- 语文：分册选择 ---------- */
const BOOK_SHORT = {
  g1a: "一上", g1b: "一下", g2a: "二上", g2b: "二下", g3a: "三上", g3b: "三下",
};

function renderChineseSelect(sel) {
  sel.innerHTML = '<p class="sel-hint">人教版（部编版）教材 · 选择分册开始练习：</p><div class="chips" id="bookChips"></div>';
  const chips = sel.querySelector("#bookChips");
  for (const key in CHINESE_BOOK_QUIZZES) {
    const b = document.createElement("button");
    b.className = "drill-chip";
    b.textContent = `${BOOK_SHORT[key] || key}（${CHINESE_BOOK_QUIZZES[key].questions.length}题）`;
    b.addEventListener("click", () => {
      chips.querySelectorAll(".drill-chip").forEach((c) => c.classList.toggle("active", c === b));
      startList(CHINESE_BOOK_QUIZZES[key].questions, `人教版·${CHINESE_BOOK_QUIZZES[key].name}`);
    });
    chips.appendChild(b);
  }
}

/* ---------- 英语：年级 → 册 → 单元 ---------- */
let enGrade = 1;
let enBook = 0;

function renderEnglishSelect(sel) {
  sel.innerHTML = `
    <p class="sel-hint">外研社《新交际》教材 · 依次选择年级、册、单元，按 Unit 顺序练习全部单词：</p>
    <div class="chips" id="enGrades"></div>
    <div class="chips" id="enBooks"></div>
    <div class="chips" id="enUnits"></div>`;
  const gradeWrap = sel.querySelector("#enGrades");
  const bookWrap = sel.querySelector("#enBooks");
  const unitWrap = sel.querySelector("#enUnits");

  const GRADE_NAMES = { 1: "一年级", 2: "二年级", 3: "三年级", 4: "四年级", 5: "五年级", 6: "六年级" };

  const renderBooks = () => {
    bookWrap.innerHTML = "";
    (EN_UNITS[enGrade] || []).forEach((book, bi) => {
      const b = document.createElement("button");
      b.className = "drill-chip" + (bi === enBook ? " active" : "");
      b.textContent = book.name.replace(/一年级|二年级|三年级/, "");
      b.addEventListener("click", () => {
        enBook = bi;
        renderBooks();
        renderUnits();
      });
      bookWrap.appendChild(b);
    });
  };

  const renderUnits = () => {
    unitWrap.innerHTML = "";
    const book = EN_UNITS[enGrade][enBook];
    book.units.forEach((u, ui) => {
      const b = document.createElement("button");
      b.className = "drill-chip";
      b.textContent = u.name;
      b.addEventListener("click", () => {
        unitWrap.querySelectorAll(".drill-chip").forEach((c) => c.classList.toggle("active", c === b));
        startList(buildUnitQuestions(enGrade, enBook, ui), `${book.name}·${u.name}`);
      });
      unitWrap.appendChild(b);
    });
  };

  Object.keys(EN_UNITS).forEach((g, i) => {
    const b = document.createElement("button");
    b.className = "drill-chip" + (Number(g) === enGrade ? " active" : "");
    b.textContent = GRADE_NAMES[g] || `${g}年级`;
    b.addEventListener("click", () => {
      enGrade = Number(g);
      enBook = 0;
      gradeWrap.querySelectorAll(".drill-chip").forEach((c) => c.classList.toggle("active", c === b));
      renderBooks();
      renderUnits();
    });
    gradeWrap.appendChild(b);
  });

  renderBooks();
  renderUnits();
}

// 按单元单词顺序出题：偶数题 中→英，奇数题 英→中；干扰项取同册其他单词
function buildUnitQuestions(grade, bookIdx, unitIdx) {
  const book = EN_UNITS[grade][bookIdx];
  const unit = book.units[unitIdx];
  const pool = book.units.flatMap((u) => u.words.map(([en, zh]) => ({ en, zh })));

  return unit.words.map(([en, zh], i) => {
    const askEn = i % 2 === 0;
    const answer = askEn ? en : zh;
    const others = shuffle(
      pool.filter((p) => (askEn ? p.en : p.zh) !== answer).map((p) => (askEn ? p.en : p.zh))
    );
    const opts = new Set([answer]);
    for (const o of others) {
      if (opts.size >= 4) break;
      opts.add(o);
    }
    const options = shuffle([...opts]);
    return {
      q: askEn
        ? `【${unit.name}】“${zh}”的英文是？`
        : `【${unit.name}】单词 “${en}” 的中文意思是？`,
      options,
      answer: options.indexOf(answer),
    };
  });
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

/* ---------- 答题流程 ---------- */
function startList(list, label) {
  currentList = list;
  currentLabel = label;
  qIndex = 0;
  score = 0;
  startTime = Date.now();
  document.getElementById("pCard").hidden = false;
  showQuestion();
}

function showQuestion() {
  const counterEl = document.getElementById("pCounter");
  const questionEl = document.getElementById("pQuestion");
  const optionsEl = document.getElementById("pOptions");
  const feedbackEl = document.getElementById("pFeedback");
  const nextBtn = document.getElementById("pNext");
  const progressBar = document.getElementById("pProgressBar");

  feedbackEl.textContent = "";
  feedbackEl.className = "quiz-feedback";
  nextBtn.hidden = true;

  if (qIndex >= currentList.length) {
    const secs = Math.round((Date.now() - startTime) / 1000);
    progressBar.style.width = "100%";
    counterEl.textContent = "完成！";
    questionEl.textContent =
      score === currentList.length
        ? `🎉 满分！答对了全部 ${currentList.length} 题 · 用时 ${secs} 秒`
        : `本次得分：${score} / ${currentList.length} · 用时 ${secs} 秒`;
    optionsEl.innerHTML = "";
    nextBtn.textContent = "🔄 再做一遍";
    nextBtn.hidden = false;
    return;
  }

  const item = currentList[qIndex];
  progressBar.style.width = `${(qIndex / currentList.length) * 100}%`;
  counterEl.textContent = `${currentLabel} · 第 ${qIndex + 1} / ${currentList.length} 题 · 已答对 ${score} 题`;
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
  const item = currentList[qIndex];
  const buttons = document.querySelectorAll("#pOptions .quiz-option");
  const feedbackEl = document.getElementById("pFeedback");
  const nextBtn = document.getElementById("pNext");

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
    saveWrongToNotebook(item.q, item.options, item.answer);
  }

  nextBtn.hidden = false;
  nextBtn.textContent =
    qIndex + 1 >= currentList.length ? "查看结果 🏁" : "下一题 →";
}

/* ---------- 错题本：自动收录答错题目（同题去重） ---------- */
function saveWrongToNotebook(question, options, answerIndex) {
  try {
    const req = indexedDB.open("cb-wrongnotes", 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("notes", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => {
      const db = req.result;
      const store = db.transaction("notes", "readwrite").objectStore("notes");
      const scan = store.getAll();
      scan.onsuccess = () => {
        const dup = scan.result.some((n) => n.subject === subject && n.title === question);
        if (dup) return;
        store.add({
          subject,
          kind: "text",
          title: question,
          options,
          answerIndex,
          answerText: options[answerIndex],
          mastered: false,
          created: Date.now(),
        });
      };
    };
  } catch (e) { /* 静默失败，不打断答题 */ }
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
