// ============ 网站数据：科目与练习题 ============
// 在这里添加 / 修改科目内容即可，无需改动其他代码

const SUBJECTS = [
  {
    id: "chinese",
    name: "语文",
    icon: "📖",
    desc: "阅读理解 · 古诗词 · 写作技巧",
    color: "#ef4444",
    points: ["记叙文六要素", "古诗词鉴赏方法", "修辞手法辨析", "作文开头结尾技巧"],
  },
  {
    id: "math",
    name: "数学",
    icon: "🔢",
    desc: "代数 · 几何 · 应用题",
    color: "#3b82f6",
    points: ["一元一次方程", "平面几何基础", "分数与小数运算", "行程问题套路"],
  },
  {
    id: "english",
    name: "英语",
    icon: "🔤",
    desc: "词汇 · 语法 · 听说读写",
    color: "#f59e0b",
    points: ["核心词汇 500 词", "一般过去时", "常用口语 100 句", "阅读理解策略"],
  },
  {
    id: "physics",
    name: "物理",
    icon: "🧲",
    desc: "力学 · 电学 · 光学",
    color: "#10b981",
    points: ["牛顿三大定律", "欧姆定律", "光的反射与折射", "简单机械与功"],
  },
  {
    id: "chemistry",
    name: "化学",
    icon: "⚗️",
    desc: "元素 · 反应 · 实验",
    color: "#a855f7",
    points: ["常见元素周期表", "化学方程式配平", "酸碱盐基础", "实验室安全规范"],
  },
];

const QUIZZES = {
  chinese: [
    { q: "“床前明月光”的作者是谁？", options: ["杜甫", "李白", "白居易", "王维"], answer: 1 },
    { q: "下列哪个是比喻句？", options: ["他跑得像风一样快", "他跑得很快", "他跑步很努力", "他在跑步"], answer: 0 },
    { q: "“欲穷千里目”的下一句是？", options: ["更上一层楼", "黄河入海流", "白日依山尽", "一览众山小"], answer: 0 },
  ],
  math: [
    { q: "方程 2x + 3 = 11 的解是？", options: ["x = 3", "x = 4", "x = 5", "x = 7"], answer: 1 },
    { q: "一个三角形的内角和是多少度？", options: ["90°", "180°", "270°", "360°"], answer: 1 },
    { q: "0.25 化成分数是？", options: ["1/2", "1/3", "1/4", "1/5"], answer: 2 },
  ],
  english: [
    { q: "Choose the correct word: She ___ to school every day.", options: ["go", "goes", "going", "gone"], answer: 1 },
    { q: "What is the past tense of “eat”?", options: ["eated", "ate", "eaten", "eating"], answer: 1 },
    { q: "“图书馆”用英语怎么说？", options: ["bookstore", "library", "laboratory", "lecture"], answer: 1 },
  ],
  physics: [
    { q: "光在真空中的传播速度约为？", options: ["340 m/s", "3×10⁸ m/s", "3×10⁶ m/s", "150 m/s"], answer: 1 },
    { q: "公式 U = IR 中，R 表示？", options: ["电压", "电流", "电阻", "功率"], answer: 2 },
    { q: "重力的方向总是？", options: ["水平向外", "竖直向下", "指向地心偏东", "任意方向"], answer: 1 },
  ],
  chemistry: [
    { q: "水的化学式是？", options: ["H₂O₂", "HO", "H₂O", "OH₃"], answer: 2 },
    { q: "下列哪种气体能使澄清石灰水变浑浊？", options: ["氧气", "氢气", "二氧化碳", "氮气"], answer: 2 },
    { q: "铁锈的主要成分是？", options: ["FeO", "Fe₂O₃", "FeCl₂", "FeS"], answer: 1 },
  ],
};
