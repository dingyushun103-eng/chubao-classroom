// ============ 网站数据：小学科目 / 分级知识清单 / 练习题 ============
// 目前专注小学内容：语文 / 数学 / 英语，按 1-6 年级分类

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
];

// ============ 学段划分（目前仅小学） ============
const STAGES = [
  { id: "primary", name: "小学", grades: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"] },
];

// ============ 随机口算题库生成器 ============
// 支持四种运算（加减/乘/除/混合）× 三个难度档位（简单/中等/挑战）
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

// 生成 4 个选项（含正确答案），返回 { options, answer: 正确项下标 }
function makeOptions(ans) {
  const opts = new Set([ans]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 300) {
    const delta = rnd(1, Math.max(3, Math.ceil((Math.abs(ans) + 1) * 0.3)));
    const wrong = Math.random() < 0.5 ? ans + delta : ans - delta;
    if (wrong >= 0) opts.add(wrong);
  }
  for (let v = ans + 1; opts.size < 4; v++) if (v >= 0) opts.add(v); // 兜底（答案很小时）
  const options = [...opts].sort(() => Math.random() - 0.5);
  return { options, answer: options.indexOf(ans) };
}

// 加减法各难度的操作数范围与和上限
const ADDSUB_LEVELS = {
  easy:   { min: 1,  max: 10, cap: 10 },   // 10 以内
  medium: { min: 1,  max: 20, cap: 20 },   // 20 以内
  hard:   { min: 10, max: 90, cap: 100 },  // 100 以内
};

// 乘除法各难度的最大因数（乘法表范围）
const MUL_LEVELS = { easy: 4, medium: 6, hard: 9 };

// 难度标签文案随运算类型变化（首页练习区与口算页共用）
const DRILL_LEVEL_LABELS = {
  addsub: ["10以内", "20以内", "100以内"],
  add:    ["10以内", "20以内", "100以内"],
  sub:    ["10以内", "20以内", "100以内"],
  mul:    ["口诀≤5", "口诀≤7", "全乘法表"],
  div:    ["表内÷5", "表内÷7", "全表内除法"],
  mixed:  ["简单", "中等", "挑战"],
};

function genAddSubQ(level, mode = "both") {
  const cfg = ADDSUB_LEVELS[level];
  for (let i = 0; i < 60; i++) {
    const a = rnd(cfg.min, cfg.max), b = rnd(cfg.min, cfg.max);
    if (mode === "both" && Math.random() < 0.5 && a >= b) {
      const { options, answer } = makeOptions(a - b);
      return { q: `${a} − ${b} = ?`, options, answer };
    }
    const ans = a + b;
    if (ans > cfg.cap) continue; // 和超过上限则重取
    const { options, answer } = makeOptions(ans);
    return { q: `${a} + ${b} = ?`, options, answer };
  }
  const { options, answer } = makeOptions(cfg.min + cfg.min);
  return { q: `${cfg.min} + ${cfg.min} = ?`, options, answer };
}

// 减法专项：被减数落在对应数域（10以内 / 11-20 / 21-100）
const SUB_LEVELS = {
  easy:   { min: 2,  max: 10 },
  medium: { min: 11, max: 20 },
  hard:   { min: 21, max: 100 },
};

function genSubQ(level) {
  const cfg = SUB_LEVELS[level];
  const a = rnd(cfg.min, cfg.max);
  const b = rnd(1, a);
  const { options, answer } = makeOptions(a - b);
  return { q: `${a} − ${b} = ?`, options, answer };
}

function genMulQ(level) {
  const m = MUL_LEVELS[level];
  const a = rnd(1, m), b = rnd(1, m);
  const { options, answer } = makeOptions(a * b);
  return { q: `${a} × ${b} = ?`, options, answer };
}

function genDivQ(level) {
  const m = MUL_LEVELS[level];
  const divisor = rnd(2, m), quotient = rnd(1, m); // 除数≥2，保证整除
  const dividend = divisor * quotient;
  const { options, answer } = makeOptions(quotient);
  return { q: `${dividend} ÷ ${divisor} = ?`, options, answer };
}

function genOneQ(op, level) {
  if (op === "addsub") return genAddSubQ(level, "both");
  if (op === "add") return genAddSubQ(level, "add");
  if (op === "sub") return genSubQ(level);
  if (op === "mul") return genMulQ(level);
  if (op === "div") return genDivQ(level);
  return genAddSubQ(level, "both");
}

// 随机口算训练：按运算类型 + 难度生成一组题目（在 main.js 中调用）
function genDrillSet(op = "mixed", level = "medium", count = 10) {
  const seen = new Set();
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 80) {
    const actualOp = op === "mixed" ? ["addsub", "mul", "div"][rnd(0, 2)] : op;
    const item = genOneQ(actualOp, level);
    if (seen.has(item.q)) continue; // 按题干去重
    seen.add(item.q);
    out.push(item);
  }
  return out;
}

// ============ 知识扩展内容（四线三格范文 / 拼音 / 字母 / 单词库） ============
// 四线三格字母格：items 为 [字母, 注释] 数组
function sxtgRow(items) {
  return '<div class="py-row">' + items.map(([ch, note]) =>
    '<span class="py-cell"><span class="sxtg">' + ch + '</span>' +
    (note ? '<i>' + note + '</i>' : '') + '</span>'
  ).join('') + '</div>';
}

// 拼音标注（逐字 ruby）
function rubyWord(text, pys) {
  return [...text].map((c, i) => '<ruby>' + c + '<rt>' + pys[i] + '</rt></ruby>').join('');
}

const PINYIN_EXTRA = `
<h5 class="extra-h">① 23 个声母（读得轻短）</h5>
<div class="py-group"><b>双唇音</b>${sxtgRow([['b', '玻'], ['p', '坡'], ['m', '摸'], ['f', '佛']])}</div>
<div class="py-group"><b>舌尖音</b>${sxtgRow([['d', '得'], ['t', '特'], ['n', '讷'], ['l', '勒']])}</div>
<div class="py-group"><b>舌根音</b>${sxtgRow([['g', '哥'], ['k', '科'], ['h', '喝']])}</div>
<div class="py-group"><b>舌面音</b>${sxtgRow([['j', '基'], ['q', '七'], ['x', '西']])}</div>
<div class="py-group"><b>翘舌音</b>${sxtgRow([['zh', '织'], ['ch', '吃'], ['sh', '诗'], ['r', '日']])}</div>
<div class="py-group"><b>平舌音</b>${sxtgRow([['z', '资'], ['c', '次'], ['s', '思']])}</div>
<div class="py-group"><b>半元音</b>${sxtgRow([['y', '衣'], ['w', '乌']])}</div>
<h5 class="extra-h">② 声母书写要点（四线三格）</h5>
<ul class="extra-list">
<li>占上中格：b d f t l k h —— 顶到第一线，f、t 的横写在第二线。</li>
<li>占中格：m n z c s r —— 撑满中格、不出头。</li>
<li>占中下格：g p q y —— 尾巴伸到第四线。</li>
<li>占上中下格：j —— 点在上格，竖钩穿过三格。</li>
<li>笔顺示范：b 先竖再右半圆；d 先左半圆再竖；x 先右斜再左斜；z 一笔写成（横-左弯-横）。</li>
</ul>
<h5 class="extra-h">③ 24 个韵母（发音响亮）</h5>
<div class="py-group"><b>单韵母 6 个</b>${sxtgRow([['a', '啊'], ['o', '喔'], ['e', '鹅'], ['i', '衣'], ['u', '乌'], ['ü', '迂']])}</div>
<div class="py-group"><b>复韵母 9 个</b>${sxtgRow([['ai', '挨'], ['ei', '欸'], ['ui', '威'], ['ao', '袄'], ['ou', '欧'], ['iu', '优'], ['ie', '耶'], ['üe', '约'], ['er', '耳']])}</div>
<div class="py-group"><b>前鼻韵母 5 个</b>${sxtgRow([['an', '安'], ['en', '恩'], ['in', '因'], ['un', '温'], ['ün', '晕']])}</div>
<div class="py-group"><b>后鼻韵母 4 个</b>${sxtgRow([['ang', '昂'], ['eng', '鞥'], ['ing', '英'], ['ong', '轰']])}</div>
<h5 class="extra-h">④ 16 个整体认读音节（整体认读，不用拼）</h5>
${sxtgRow([['zhi', '织'], ['chi', '吃'], ['shi', '诗'], ['ri', '日'], ['zi', '资'], ['ci', '次'], ['si', '思'], ['yi', '衣']])}
${sxtgRow([['wu', '乌'], ['yu', '迂'], ['ye', '耶'], ['yue', '约'], ['yuan', '冤'], ['yin', '因'], ['yun', '晕'], ['ying', '英']])}
<h5 class="extra-h">⑤ 四线三格书写规则 + 范文</h5>
<ul class="extra-list">
<li>四线分三格：一、二线之间是上格，二、三线之间是中格，三、四线之间是下格。</li>
<li>a o e u ü 占中格；i 占上中格（点在上格）；声调标在主要元音上，如 ā á ǎ à。</li>
<li>书写范文：${'<span class="py-cell"><span class="sxtg">mā</span><i>妈 m-a→mā</i></span>'}${'<span class="py-cell"><span class="sxtg">mǎ</span><i>马</i></span>'}${'<span class="py-cell"><span class="sxtg">tù</span><i>兔</i></span>'}</li>
</ul>`;

const LETTERS = [
  ['A', 'a', '/eɪ/'], ['B', 'b', '/biː/'], ['C', 'c', '/siː/'], ['D', 'd', '/diː/'],
  ['E', 'e', '/iː/'], ['F', 'f', '/ef/'], ['G', 'g', '/dʒiː/'], ['H', 'h', '/eɪtʃ/'],
  ['I', 'i', '/aɪ/'], ['J', 'j', '/dʒeɪ/'], ['K', 'k', '/keɪ/'], ['L', 'l', '/el/'],
  ['M', 'm', '/em/'], ['N', 'n', '/en/'], ['O', 'o', '/əʊ/'], ['P', 'p', '/piː/'],
  ['Q', 'q', '/kjuː/'], ['R', 'r', '/ɑː/'], ['S', 's', '/es/'], ['T', 't', '/tiː/'],
  ['U', 'u', '/juː/'], ['V', 'v', '/viː/'], ['W', 'w', '/ˈdʌbljuː/'], ['X', 'x', '/eks/'],
  ['Y', 'y', '/waɪ/'], ['Z', 'z', '/ziː/'],
];

const LETTER_EXTRA = `
<h5 class="extra-h">① 26 个字母大小写与名称音（音标）</h5>
${sxtgRow(LETTERS.map(([U, L, ipa]) => [U + L, ipa]))}
<h5 class="extra-h">② 四线三格书写规范</h5>
<ul class="extra-list">
<li>大写字母：A–Z 都占上中格，顶第一线、落第三线（Q 的小尾巴伸到下格）。</li>
<li>小写占中格：a c e m n o r s u v w x z —— 饱满居中，不碰上下线。</li>
<li>小写占上中格：b d f h i k l t（i 的点在上格，f、t 的横在第二线）。</li>
<li>小写占中下格：g p q y；j 占上中下三格（点在上格）。</li>
<li>笔顺规律：圆形字母（a c e o）右上起笔逆时针写；b d 先竖后半圆；p q 先竖后半圆向下伸。</li>
</ul>
<h5 class="extra-h">③ 书写示范（观察占格）</h5>
<div class="py-row">
<span class="py-cell"><span class="sxtg">Gg</span><i>占上中格</i></span>
<span class="py-cell"><span class="sxtg">f t</span><i>横在第二线</i></span>
<span class="py-cell"><span class="sxtg">p y</span><i>尾到下格</i></span>
<span class="py-cell"><span class="sxtg">i j</span><i>点在上格</i></span>
</div>`;

const SHICI_EXTRA = `
<div class="poem">
<p class="poem-title">石灰吟 · [明] 于谦</p>
<p class="poem-line">${rubyWord('千锤万凿出深山', ['qiān', 'chuí', 'wàn', 'záo', 'chū', 'shēn', 'shān'])}，</p>
<p class="poem-line">${rubyWord('烈火焚烧若等闲', ['liè', 'huǒ', 'fén', 'shāo', 'ruò', 'děng', 'xián'])}。</p>
<p class="poem-line">${rubyWord('粉骨碎身浑不怕', ['fěn', 'gǔ', 'suì', 'shēn', 'hún', 'bú', 'pà'])}。</p>
<p class="poem-line">${rubyWord('要留清白在人间', ['yào', 'liú', 'qīng', 'bái', 'zài', 'rén', 'jiān'])}。</p>
</div>
<h5 class="extra-h">词语注释</h5>
<ul class="extra-list">
<li>吟（yín）：古代诗歌体裁，也有吟咏、诵读之意。</li>
<li>锤（chuí）：锤打、敲击。凿（záo）：开凿。</li>
<li>焚烧（fén shāo）：烈火燃烧，指烧制石灰的过程。</li>
<li>若（ruò）：好像。等闲（děng xián）：平常、轻易。</li>
<li>浑（hún）：全、都。清白（qīng bái）：指高尚节操、纯洁无瑕。</li>
</ul>
<h5 class="extra-h">诗意赏析</h5>
<p class="extra-p">这首诗托物言志：借石灰历经"千锤万凿""烈火焚烧"仍"若等闲"，表达诗人不畏艰难、坚贞不屈，要把清白品格留在人间的志向。背诵时先逐句读准拼音，再结合注释理解诗意。</p>`;

// 英语分单元单词库（外语教学与研究出版社《英语》一年级起点 教材词汇表整理）

// ============ 语文 1-6 年级必背古诗文（按人教版/部编版教材顺序，逐字拼音） ============
// 行书写格式：'字(拼音)' 连写，如 '远(yuǎn)看(kàn)'；不带括号的字符（标点、空格）原样显示不注音。
// 类型 k：古诗 / 词 / 课文 / 文言文；g 为一句大意或注释提示。
function pyLine(src) {
  let out = "";
  String(src).replace(/([^\s()])\(([^()]+)\)|([\s\S])/g, (m, c, p) => {
    if (p !== undefined) out += "<ruby>" + c + "<rt>" + p + "</rt></ruby>";
    else out += m;
    return "";
  });
  return out;
}

function beiJiItem(it) {
  const prose = it.k === "课文" || it.k === "文言文";
  return (
    '<div class="poem' + (prose ? " bj-prose" : "") + '">' +
    '<p class="poem-title"><span class="bj-tag">' + it.k + '</span>' + it.n +
    (it.a ? ' <small>· ' + it.a + '</small>' : "") + '</p>' +
    it.l.map((l) => '<p class="poem-line">' + pyLine(l) + '</p>').join("") +
    (it.g ? '<p class="extra-p">' + it.g + '</p>' : "") +
    '</div>'
  );
}

// gi：0-5 对应一年级~六年级；返回该年级上下两册全部必背内容的 HTML
function cnBeiJiExtra(gi) {
  const d = CN_BEIJI[gi];
  if (!d) return "";
  return '<h5 class="extra-h">上册（按教材顺序）</h5>' + d.up.map(beiJiItem).join("") +
    '<h5 class="extra-h">下册（按教材顺序）</h5>' + d.down.map(beiJiItem).join("");
}

// 每个元素对应一个年级：{ up: 上册篇目数组, down: 下册篇目数组 }，由下方逐年级 push 填充
const CN_BEIJI = [];

// ---------- 一年级 ----------
CN_BEIJI.push({
  up: [
    { k: "古诗", n: "咏鹅", a: "唐·骆宾王", l: [
      "鹅(é)，鹅(é)，鹅(é)，",
      "曲(qū)项(xiàng)向(xiàng)天(tiān)歌(gē)。",
      "白(bái)毛(máo)浮(fú)绿(lǜ)水(shuǐ)，",
      "红(hóng)掌(zhǎng)拨(bō)清(qīng)波(bō)。"] },
    { k: "古诗", n: "江南", a: "汉乐府", l: [
      "江(jiāng)南(nán)可(kě)采(cǎi)莲(lián)，",
      "莲(lián)叶(yè)何(hé)田(tián)田(tián)。",
      "鱼(yú)戏(xì)莲(lián)叶(yè)间(jiān)：",
      "鱼(yú)戏(xì)莲(lián)叶(yè)东(dōng)，鱼(yú)戏(xì)莲(lián)叶(yè)西(xī)，",
      "鱼(yú)戏(xì)莲(lián)叶(yè)南(nán)，鱼(yú)戏(xì)莲(lián)叶(yè)北(běi)。"] },
    { k: "古诗", n: "画", l: [
      "远(yuǎn)看(kàn)山(shān)有(yǒu)色(sè)，",
      "近(jìn)听(tīng)水(shuǐ)无(wú)声(shēng)。",
      "春(chūn)去(qù)花(huā)还(hái)在(zài)，",
      "人(rén)来(lái)鸟(niǎo)不(bù)惊(jīng)。"] },
    { k: "古诗", n: "悯农（其二）", a: "唐·李绅", l: [
      "锄(chú)禾(hé)日(rì)当(dāng)午(wǔ)，",
      "汗(hàn)滴(dī)禾(hé)下(xià)土(tǔ)。",
      "谁(shuí)知(zhī)盘(pán)中(zhōng)餐(cān)，",
      "粒(lì)粒(lì)皆(jiē)辛(xīn)苦(kǔ)。"] },
    { k: "古诗", n: "古朗月行（节选）", a: "唐·李白", l: [
      "小(xiǎo)时(shí)不(bù)识(shí)月(yuè)，",
      "呼(hū)作(zuò)白(bái)玉(yù)盘(pán)。",
      "又(yòu)疑(yí)瑶(yáo)台(tái)镜(jìng)，",
      "飞(fēi)在(zài)青(qīng)云(yún)端(duān)。"] },
    { k: "古诗", n: "风", a: "唐·李峤", l: [
      "解(jiě)落(luò)三(sān)秋(qiū)叶(yè)，",
      "能(néng)开(kāi)二(èr)月(yuè)花(huā)。",
      "过(guò)江(jiāng)千(qiān)尺(chǐ)浪(làng)，",
      "入(rù)竹(zhú)万(wàn)竿(gān)斜(xié)。"] },
    { k: "课文", n: "小小的船（节选）", l: [
      "弯(wān)弯(wān)的(de)月(yuè)儿(ér)小(xiǎo)小(xiǎo)的(de)船(chuán)，",
      "小(xiǎo)小(xiǎo)的(de)船(chuán)儿(ér)两(liǎng)头(tóu)尖(jiān)。",
      "我(wǒ)在(zài)小(xiǎo)小(xiǎo)的(de)船(chuán)里(lǐ)坐(zuò)，",
      "只(zhǐ)看(kàn)见(jiàn)闪(shǎn)闪(shǎn)的(de)星(xīng)星(xing)蓝(lán)蓝(lán)的(de)天(tiān)。"],
      g: "叠词“弯弯、小小、闪闪、蓝蓝”读出儿歌的节奏感。" },
    { k: "课文", n: "四季（节选）", l: [
      "草(cǎo)芽(yá)尖(jiān)尖(jiān)，他(tā)对(duì)小(xiǎo)鸟(niǎo)说(shuō)：我(wǒ)是(shì)春(chūn)天(tiān)。",
      "荷(hé)叶(yè)圆(yuán)圆(yuán)，他(tā)对(duì)青(qīng)蛙(wā)说(shuō)：我(wǒ)是(shì)夏(xià)天(tiān)。",
      "谷(gǔ)穗(suì)弯(wān)弯(wān)，他(tā)鞠(jū)着(zhe)躬(gōng)说(shuō)：我(wǒ)是(shì)秋(qiū)天(tiān)。",
      "雪(xuě)人(rén)大(dà)肚(dù)子(zi)一(yí)挺(tǐng)，他(tā)顽(wán)皮(pí)地(de)说(shuō)：我(wǒ)就(jiù)是(shì)冬(dōng)天(tiān)。"] },
    { k: "课文", n: "雪地里的小画家（节选）", l: [
      "下(xià)雪(xuě)啦(la)，下(xià)雪(xuě)啦(la)！雪(xuě)地(dì)里(lǐ)来(lái)了(le)一(yì)群(qún)小(xiǎo)画(huà)家(jiā)。",
      "小(xiǎo)鸡(jī)画(huà)竹(zhú)叶(yè)，小(xiǎo)狗(gǒu)画(huà)梅(méi)花(huā)，小(xiǎo)鸭(yā)画(huà)枫(fēng)叶(yè)，小(xiǎo)马(mǎ)画(huà)月(yuè)牙(yá)。",
      "不(bú)用(yòng)颜(yán)料(liào)不(bú)用(yòng)笔(bǐ)，几(jǐ)步(bù)就(jiù)成(chéng)一(yí)幅(fú)画(huà)。",
      "青(qīng)蛙(wā)为(wèi)什(shén)么(me)没(méi)参(cān)加(jiā)？他(tā)在(zài)洞(dòng)里(lǐ)睡(shuì)着(zháo)啦(la)。"] },
  ],
  down: [
    { k: "古诗", n: "春晓", a: "唐·孟浩然", l: [
      "春(chūn)眠(mián)不(bú)觉(jué)晓(xiǎo)，处(chù)处(chù)闻(wén)啼(tí)鸟(niǎo)。",
      "夜(yè)来(lái)风(fēng)雨(yǔ)声(shēng)，花(huā)落(luò)知(zhī)多(duō)少(shǎo)。"] },
    { k: "古诗", n: "赠汪伦", a: "唐·李白", l: [
      "李(lǐ)白(bái)乘(chéng)舟(zhōu)将(jiāng)欲(yù)行(xíng)，忽(hū)闻(wén)岸(àn)上(shàng)踏(tà)歌(gē)声(shēng)。",
      "桃(táo)花(huā)潭(tán)水(shuǐ)深(shēn)千(qiān)尺(chǐ)，不(bù)及(jí)汪(wāng)伦(lún)送(sòng)我(wǒ)情(qíng)。"] },
    { k: "古诗", n: "静夜思", a: "唐·李白", l: [
      "床(chuáng)前(qián)明(míng)月(yuè)光(guāng)，疑(yí)是(shì)地(dì)上(shàng)霜(shuāng)。",
      "举(jǔ)头(tóu)望(wàng)明(míng)月(yuè)，低(dī)头(tóu)思(sī)故(gù)乡(xiāng)。"] },
    { k: "古诗", n: "寻隐者不遇", a: "唐·贾岛", l: [
      "松(sōng)下(xià)问(wèn)童(tóng)子(zǐ)，言(yán)师(shī)采(cǎi)药(yào)去(qù)。",
      "只(zhǐ)在(zài)此(cǐ)山(shān)中(zhōng)，云(yún)深(shēn)不(bù)知(zhī)处(chù)。"] },
    { k: "古诗", n: "池上", a: "唐·白居易", l: [
      "小(xiǎo)娃(wá)撑(chēng)小(xiǎo)艇(tǐng)，偷(tōu)采(cǎi)白(bái)莲(lián)回(huí)。",
      "不(bù)解(jiě)藏(cáng)踪(zōng)迹(jì)，浮(fú)萍(píng)一(yí)道(dào)开(kāi)。"] },
    { k: "古诗", n: "小池", a: "宋·杨万里", l: [
      "泉(quán)眼(yǎn)无(wú)声(shēng)惜(xī)细(xì)流(liú)，树(shù)荫(yīn)照(zhào)水(shuǐ)爱(ài)晴(qíng)柔(róu)。",
      "小(xiǎo)荷(hé)才(cái)露(lù)尖(jiān)尖(jiān)角(jiǎo)，早(zǎo)有(yǒu)蜻(qīng)蜓(tíng)立(lì)上(shàng)头(tóu)。"] },
    { k: "古诗", n: "画鸡", a: "明·唐寅", l: [
      "头(tóu)上(shàng)红(hóng)冠(guān)不(bú)用(yòng)裁(cái)，满(mǎn)身(shēn)雪(xuě)白(bái)走(zǒu)将(jiāng)来(lái)。",
      "生(shēng)平(píng)不(bù)敢(gǎn)轻(qīng)言(yán)语(yǔ)，一(yí)叫(jiào)千(qiān)门(mén)万(wàn)户(hù)开(kāi)。"] },
    { k: "课文", n: "姓氏歌（节选）", l: [
      "你(nǐ)姓(xìng)什(shén)么(me)？我(wǒ)姓(xìng)李(lǐ)。什(shén)么(me)李(lǐ)？木(mù)子(zǐ)李(lǐ)。",
      "他(tā)姓(xìng)什(shén)么(me)？他(tā)姓(xìng)张(zhāng)。什(shén)么(me)张(zhāng)？弓(gōng)长(zhǎng)张(zhāng)。",
      "古(gǔ)月(yuè)胡(hú)，口(kǒu)天(tiān)吴(wú)，双(shuāng)人(rén)徐(xú)，言(yán)午(wǔ)许(xǔ)。"],
      g: "拆字介绍姓氏，边拍手边问答，越读越顺口。" },
  ],
});

// ---------- 二年级 ----------
CN_BEIJI.push({
  up: [
    { k: "古诗", n: "登鹳雀楼", a: "唐·王之涣", l: [
      "白(bái)日(rì)依(yī)山(shān)尽(jìn)，黄(huáng)河(hé)入(rù)海(hǎi)流(liú)。",
      "欲(yù)穷(qióng)千(qiān)里(lǐ)目(mù)，更(gèng)上(shàng)一(yì)层(céng)楼(lóu)。"] },
    { k: "古诗", n: "望庐山瀑布", a: "唐·李白", l: [
      "日(rì)照(zhào)香(xiāng)炉(lú)生(shēng)紫(zǐ)烟(yān)，遥(yáo)看(kàn)瀑(pù)布(bù)挂(guà)前(qián)川(chuān)。",
      "飞(fēi)流(liú)直(zhí)下(xià)三(sān)千(qiān)尺(chǐ)，疑(yí)是(shì)银(yín)河(hé)落(luò)九(jiǔ)天(tiān)。"] },
    { k: "古诗", n: "夜宿山寺", a: "唐·李白", l: [
      "危(wēi)楼(lóu)高(gāo)百(bǎi)尺(chǐ)，手(shǒu)可(kě)摘(zhāi)星(xīng)辰(chén)。",
      "不(bù)敢(gǎn)高(gāo)声(shēng)语(yǔ)，恐(kǒng)惊(jīng)天(tiān)上(shàng)人(rén)。"] },
    { k: "古诗", n: "敕勒歌", a: "北朝民歌", l: [
      "敕(chì)勒(lè)川(chuān)，阴(yīn)山(shān)下(xià)，",
      "天(tiān)似(sì)穹(qióng)庐(lú)，笼(lǒng)盖(gài)四(sì)野(yě)。",
      "天(tiān)苍(cāng)苍(cāng)，野(yě)茫(máng)茫(máng)，",
      "风(fēng)吹(chuī)草(cǎo)低(dī)见(xiàn)牛(niú)羊(yáng)。"],
      g: "“见”读 xiàn，同“现”，是显露出来的意思。" },
    { k: "古诗", n: "梅花", a: "宋·王安石", l: [
      "墙(qiáng)角(jiǎo)数(shù)枝(zhī)梅(méi)，凌(líng)寒(hán)独(dú)自(zì)开(kāi)。",
      "遥(yáo)知(zhī)不(bú)是(shì)雪(xuě)，为(wèi)有(yǒu)暗(àn)香(xiāng)来(lái)。"],
      g: "“为”读 wèi，是因为的意思——因为有淡淡香气传来，才知不是雪。" },
    { k: "古诗", n: "小儿垂钓", a: "唐·胡令能", l: [
      "蓬(péng)头(tóu)稚(zhì)子(zǐ)学(xué)垂(chuí)纶(lún)，侧(cè)坐(zuò)莓(méi)苔(tái)草(cǎo)映(yìng)身(shēn)。",
      "路(lù)人(rèn)借(jiè)问(wèn)遥(yáo)招(zhāo)手(shǒu)，怕(pà)得(de)鱼(yú)惊(jīng)不(bú)应(yìng)人(rén)。"] },
    { k: "古诗", n: "江雪", a: "唐·柳宗元", l: [
      "千(qiān)山(shān)鸟(niǎo)飞(fēi)绝(jué)，万(wàn)径(jìng)人(rén)踪(zōng)灭(miè)。",
      "孤(gū)舟(zhōu)蓑(suō)笠(lì)翁(wēng)，独(dú)钓(diào)寒(hán)江(jiāng)雪(xuě)。"] },
    { k: "课文", n: "树之歌（节选）", l: [
      "杨(yáng)树(shù)高(gāo)，榕(róng)树(shù)壮(zhuàng)，梧(wú)桐(tóng)树(shù)叶(yè)像(xiàng)手(shǒu)掌(zhǎng)。",
      "枫(fēng)树(shù)秋(qiū)天(tiān)叶(yè)儿(ér)红(hóng)，松(sōng)柏(bǎi)四(sì)季(jì)披(pī)绿(lǜ)装(zhuāng)。",
      "木(mù)棉(mián)喜(xǐ)暖(nuǎn)在(zài)南(nán)方(fāng)，桦(huà)树(shù)耐(nài)寒(hán)守(shǒu)边(biān)疆(jiāng)。",
      "银(yín)杏(xìng)水(shuǐ)杉(shān)活(huó)化(huà)石(shí)，金(jīn)桂(guì)开(kāi)花(huā)满(mǎn)院(yuàn)香(xiāng)。"] },
    { k: "课文", n: "植物妈妈有办法（节选）", l: [
      "孩(hái)子(zi)如(rú)果(guǒ)已(yǐ)经(jīng)长(zhǎng)大(dà)，就(jiù)得(děi)告(gào)别(bié)妈(mā)妈(mā)，四(sì)海(hǎi)为(wéi)家(jiā)。",
      "蒲(pú)公(gōng)英(yīng)妈(mā)妈(mā)准(zhǔn)备(bèi)了(le)降(jiàng)落(luò)伞(sǎn)，把(bǎ)它(tā)送(sòng)给(gěi)自(zì)己(jǐ)的(de)娃(wá)娃(wa)。",
      "只(zhǐ)要(yào)有(yǒu)风(fēng)轻(qīng)轻(qīng)吹(chuī)过(guò)，孩(hái)子(zi)们(men)就(jiù)乘(chéng)着(zhe)风(fēng)纷(fēn)纷(fēn)出(chū)发(fā)。"],
      g: "注意多音字：长(zhǎng)大、得(děi)、为(wéi)家、降(jiàng)落伞。" },
  ],
  down: [
    { k: "古诗", n: "村居", a: "清·高鼎", l: [
      "草(cǎo)长(zhǎng)莺(yīng)飞(fēi)二(èr)月(yuè)天(tiān)，拂(fú)堤(dī)杨(yáng)柳(liǔ)醉(zuì)春(chūn)烟(yān)。",
      "儿(ér)童(tóng)散(sàn)学(xué)归(guī)来(lái)早(zǎo)，忙(máng)趁(chèn)东(dōng)风(fēng)放(fàng)纸(zhǐ)鸢(yuān)。"],
      g: "“长”读 zhǎng，是生长的意思；纸鸢就是风筝。" },
    { k: "古诗", n: "咏柳", a: "唐·贺知章", l: [
      "碧(bì)玉(yù)妆(zhuāng)成(chéng)一(yí)树(shù)高(gāo)，万(wàn)条(tiáo)垂(chuí)下(xià)绿(lǜ)丝(sī)绦(tāo)。",
      "不(bù)知(zhī)细(xì)叶(yè)谁(shuí)裁(cái)出(chū)，二(èr)月(yuè)春(chūn)风(fēng)似(sì)剪(jiǎn)刀(dāo)。"] },
    { k: "古诗", n: "赋得古原草送别（节选）", a: "唐·白居易", l: [
      "离(lí)离(lí)原(yuán)上(shàng)草(cǎo)，一(yī)岁(suì)一(yī)枯(kū)荣(róng)。",
      "野(yě)火(huǒ)烧(shāo)不(bú)尽(jìn)，春(chūn)风(fēng)吹(chuī)又(yòu)生(shēng)。"] },
    { k: "古诗", n: "晓出净慈寺送林子方", a: "宋·杨万里", l: [
      "毕(bì)竟(jìng)西(xī)湖(hú)六(liù)月(yuè)中(zhōng)，风(fēng)光(guāng)不(bù)与(yǔ)四(sì)时(shí)同(tóng)。",
      "接(jiē)天(tiān)莲(lián)叶(yè)无(wú)穷(qióng)碧(bì)，映(yìng)日(rì)荷(hé)花(huā)别(bié)样(yàng)红(hóng)。"] },
    { k: "古诗", n: "绝句", a: "唐·杜甫", l: [
      "两(liǎng)个(gè)黄(huáng)鹂(lí)鸣(míng)翠(cuì)柳(liǔ)，一(yì)行(háng)白(bái)鹭(lù)上(shàng)青(qīng)天(tiān)。",
      "窗(chuāng)含(hán)西(xī)岭(lǐng)千(qiān)秋(qiū)雪(xuě)，门(mén)泊(bó)东(dōng)吴(wú)万(wàn)里(lǐ)船(chuán)。"],
      g: "“行”读 háng（量词）；“泊”是停船靠岸。" },
    { k: "古诗", n: "悯农（其一）", a: "唐·李绅", l: [
      "春(chūn)种(zhòng)一(yí)粒(lì)粟(sù)，秋(qiū)收(shōu)万(wàn)颗(kē)子(zǐ)。",
      "四(sì)海(hǎi)无(wú)闲(xián)田(tián)，农(nóng)夫(fū)犹(yóu)饿(è)死(sǐ)。"] },
    { k: "课文", n: "找春天（节选）", l: [
      "春(chūn)天(tiān)来(lái)了(le)！春(chūn)天(tiān)来(lái)了(le)！",
      "我(wǒ)们(men)几(jǐ)个(gè)孩(hái)子(zi)脱(tuō)掉(diào)棉(mián)袄(ǎo)，冲(chōng)出(chū)家(jiā)门(mén)，奔(bēn)向(xiàng)田(tián)野(yě)，去(qù)寻(xún)找(zhǎo)春(chūn)天(tiān)。",
      "春(chūn)天(tiān)像(xiàng)个(gè)害(hài)羞(xiǔ)的(de)小(xiǎo)姑(gū)娘(niáng)，遮(zhē)遮(zhē)掩(yǎn)掩(yǎn)，躲(duǒ)躲(duǒ)藏(cáng)藏(cáng)。"],
      g: "把春天当作小姑娘来写，朗读时要读出惊喜和高兴。" },
  ],
});

// ---------- 三年级 ----------
CN_BEIJI.push({
  up: [
    { k: "古诗", n: "山行", a: "唐·杜牧", l: [
      "远(yuǎn)上(shàng)寒(hán)山(shān)石(shí)径(jìng)斜(xié)，",
      "白(bái)云(yún)生(shēng)处(chù)有(yǒu)人(rén)家(jiā)。",
      "停(tíng)车(chē)坐(zuò)爱(ài)枫(fēng)林(lín)晚(wǎn)，",
      "霜(shuāng)叶(yè)红(hóng)于(yú)二(èr)月(yuè)花(huā)。"],
      g: "“斜”古音读 xié；“坐”是因为的意思——因为爱这枫林晚景而停下车来。" },
    { k: "古诗", n: "赠刘景文", a: "宋·苏轼", l: [
      "荷(hé)尽(jìn)已(yǐ)无(wú)擎(qíng)雨(yǔ)盖(gài)，菊(jú)残(cán)犹(yóu)有(yǒu)傲(ào)霜(shuāng)枝(zhī)。",
      "一(yì)年(nián)好(hǎo)景(jǐng)君(jūn)须(xū)记(jì)，最(zuì)是(shì)橙(chéng)黄(huáng)橘(jú)绿(lǜ)时(shí)。"] },
    { k: "古诗", n: "夜书所见", a: "宋·叶绍翁", l: [
      "萧(xiāo)萧(xiāo)梧(wú)叶(yè)送(sòng)寒(hán)声(shēng)，江(jiāng)上(shàng)秋(qiū)风(fēng)动(dòng)客(kè)情(qíng)。",
      "知(zhī)有(yǒu)儿(ér)童(tóng)挑(tiǎo)促(cù)织(zhī)，夜(yè)深(shēn)篱(lí)落(luò)一(yì)灯(dēng)明(míng)。"],
      g: "“挑”读 tiǎo，用细长东西拨动；促织就是蟋蟀。" },
    { k: "古诗", n: "所见", a: "清·袁枚", l: [
      "牧(mù)童(tóng)骑(qí)黄(huáng)牛(niú)，歌(gē)声(shēng)振(zhèn)林(lín)樾(yuè)。",
      "意(yì)欲(yù)捕(bǔ)鸣(míng)蝉(chán)，忽(hū)然(rán)闭(bì)口(kǒu)立(lì)。"] },
    { k: "古诗", n: "望天门山", a: "唐·李白", l: [
      "天(tiān)门(mén)中(zhōng)断(duàn)楚(chǔ)江(jiāng)开(kāi)，碧(bì)水(shuǐ)东(dōng)流(liú)至(zhì)此(cǐ)回(huí)。",
      "两(liǎng)岸(àn)青(qīng)山(shān)相(xiāng)对(duì)出(chū)，孤(gū)帆(fān)一(yí)片(piàn)日(rì)边(biān)来(lái)。"] },
    { k: "古诗", n: "饮湖上初晴后雨", a: "宋·苏轼", l: [
      "水(shuǐ)光(guāng)潋(liàn)滟(yàn)晴(qíng)方(fāng)好(hǎo)，山(shān)色(sè)空(kōng)蒙(méng)雨(yǔ)亦(yì)奇(qí)。",
      "欲(yù)把(bǎ)西(xī)湖(hú)比(bǐ)西(xī)子(zǐ)，淡(dàn)妆(zhuāng)浓(nóng)抹(mǒ)总(zǒng)相(xiāng)宜(yí)。"] },
    { k: "古诗", n: "早发白帝城", a: "唐·李白", l: [
      "朝(zhāo)辞(cí)白(bái)帝(dì)彩(cǎi)云(yún)间(jiān)，千(qiān)里(lǐ)江(jiāng)陵(líng)一(yí)日(rì)还(huán)。",
      "两(liǎng)岸(àn)猿(yuán)声(shēng)啼(tí)不(bù)住(zhù)，轻(qīng)舟(zhōu)已(yǐ)过(guò)万(wàn)重(chóng)山(shān)。"],
      g: "多音字：朝(zhāo 晨早)、还(huán 归返)、重(chóng 重重叠叠)。" },
    { k: "古诗", n: "采莲曲", a: "唐·王昌龄", l: [
      "荷(hé)叶(yè)罗(luó)裙(qún)一(yí)色(sè)裁(cái)，芙(fú)蓉(róng)向(xiàng)脸(liǎn)两(liǎng)边(biān)开(kāi)。",
      "乱(luàn)入(rù)池(chí)中(zhōng)看(kàn)不(bú)见(jiàn)，闻(wén)歌(gē)始(shǐ)觉(jué)有(yǒu)人(rén)来(lái)。"] },
  ],
  down: [
    { k: "古诗", n: "绝句", a: "唐·杜甫", l: [
      "迟(chí)日(rì)江(jiāng)山(shān)丽(lì)，春(chūn)风(fēng)花(huā)草(cǎo)香(xiāng)。",
      "泥(ní)融(róng)飞(fēi)燕(yàn)子(zi)，沙(shā)暖(nuǎn)睡(shuì)鸳(yuān)鸯(yāng)。"] },
    { k: "古诗", n: "惠崇春江晚景", a: "宋·苏轼", l: [
      "竹(zhú)外(wài)桃(táo)花(huā)三(sān)两(liǎng)枝(zhī)，春(chūn)江(jiāng)水(shuǐ)暖(nuǎn)鸭(yā)先(xiān)知(zhī)。",
      "蒌(lóu)蒿(hāo)满(mǎn)地(dì)芦(lú)芽(yá)短(duǎn)，正(zhèng)是(shì)河(hé)豚(tún)欲(yù)上(shàng)时(shí)。"] },
    { k: "古诗", n: "三衢道中", a: "宋·曾几", l: [
      "梅(méi)子(zǐ)黄(huáng)时(shí)日(rì)日(rì)晴(qíng)，小(xiǎo)溪(xī)泛(fàn)尽(jìn)却(què)山(shān)行(xíng)。",
      "绿(lǜ)阴(yīn)不(bù)减(jiǎn)来(lái)时(shí)路(lù)，添(tiān)得(dé)黄(huáng)鹂(lí)四(sì)五(wǔ)声(shēng)。"] },
    { k: "古诗", n: "元日", a: "宋·王安石", l: [
      "爆(bào)竹(zhú)声(shēng)中(zhōng)一(yì)岁(suì)除(chú)，春(chūn)风(fēng)送(sòng)暖(nuǎn)入(rù)屠(tú)苏(sū)。",
      "千(qiān)门(mén)万(wàn)户(hù)曈(tóng)曈(tóng)日(rì)，总(zǒng)把(bǎ)新(xīn)桃(táo)换(huàn)旧(jiù)符(fú)。"] },
    { k: "古诗", n: "清明", a: "唐·杜牧", l: [
      "清(qīng)明(míng)时(shí)节(jié)雨(yǔ)纷(fēn)纷(fēn)，路(lù)上(shàng)行(xíng)人(rén)欲(yù)断(duàn)魂(hún)。",
      "借(jiè)问(wèn)酒(jiǔ)家(jiā)何(hé)处(chù)有(yǒu)？牧(mù)童(tóng)遥(yáo)指(zhǐ)杏(xìng)花(huā)村(cūn)。"] },
    { k: "古诗", n: "九月九日忆山东兄弟", a: "唐·王维", l: [
      "独(dú)在(zài)异(yì)乡(xiāng)为(wéi)异(yì)客(kè)，每(měi)逢(féng)佳(jiā)节(jié)倍(bèi)思(sī)亲(qīn)。",
      "遥(yáo)知(zhī)兄(xiōng)弟(dì)登(dēng)高(gāo)处(chù)，遍(biàn)插(chā)茱(zhū)萸(yú)少(shǎo)一(yì)人(rén)。"] },
    { k: "词", n: "忆江南", a: "唐·白居易", l: [
      "江(jiāng)南(nán)好(hǎo)，风(fēng)景(jǐng)旧(jiù)曾(céng)谙(ān)。",
      "日(rì)出(chū)江(jiāng)花(huā)红(hóng)胜(shèng)火(huǒ)，春(chūn)来(lái)江(jiāng)水(shuǐ)绿(lǜ)如(rú)蓝(lán)。",
      "能(néng)不(bú)忆(yì)江(jiāng)南(nán)？"],
      g: "谙（ān）：熟悉。词是长短句，朗读时注意词牌的节奏。" },
    { k: "古诗", n: "滁州西涧", a: "唐·韦应物", l: [
      "独(dú)怜(lián)幽(yōu)草(cǎo)涧(jiàn)边(biān)生(shēng)，上(shàng)有(yǒu)黄(huáng)鹂(lí)深(shēn)树(shù)鸣(míng)。",
      "春(chūn)潮(cháo)带(dài)雨(yǔ)晚(wǎn)来(lái)急(jí)，野(yě)渡(dù)无(wú)人(rén)舟(zhōu)自(zì)横(héng)。"] },
  ],
});

// ---------- 四年级 ----------
CN_BEIJI.push({
  up: [
    { k: "古诗", n: "鹿柴", a: "唐·王维", l: [
      "空(kōng)山(shān)不(bú)见(jiàn)人(rén)，但(dàn)闻(wén)人(rén)语(yǔ)响(xiǎng)。",
      "返(fǎn)景(jǐng)入(rù)深(shēn)林(lín)，复(fù)照(zhào)青(qīng)苔(tái)上(shàng)。"],
      g: "诗题《鹿柴》的“柴”读 zhài，同“寨”，指栅栏、篱障。" },
    { k: "古诗", n: "暮江吟", a: "唐·白居易", l: [
      "一(yí)道(dào)残(cán)阳(yáng)铺(pū)水(shuǐ)中(zhōng)，半(bàn)江(jiāng)瑟(sè)瑟(sè)半(bàn)江(jiāng)红(hóng)。",
      "可(kě)怜(lián)九(jiǔ)月(yuè)初(chū)三(sān)夜(yè)，露(lù)似(sì)真(zhēn)珠(zhū)月(yuè)似(sì)弓(gōng)。"],
      g: "“可怜”是可爱的意思；瑟瑟形容未受到残阳照射的江水呈现的青绿色。" },
    { k: "古诗", n: "题西林壁", a: "宋·苏轼", l: [
      "横(héng)看(kàn)成(chéng)岭(lǐng)侧(cè)成(chéng)峰(fēng)，远(yuǎn)近(jìn)高(gāo)低(dī)各(gè)不(bù)同(tóng)。",
      "不(bú)识(shí)庐(lú)山(shān)真(zhēn)面(miàn)目(mù)，只(zhǐ)缘(yuán)身(shēn)在(zài)此(cǐ)山(shān)中(zhōng)。"] },
    { k: "古诗", n: "雪梅", a: "宋·卢钺", l: [
      "梅(méi)雪(xuě)争(zhēng)春(chūn)未(wèi)肯(kěn)降(xiáng)，骚(sāo)人(rén)阁(gé)笔(bǐ)费(fèi)评(píng)章(zhāng)。",
      "梅(méi)须(xū)逊(xùn)雪(xuě)三(sān)分(fēn)白(bái)，雪(xuě)却(què)输(shū)梅(méi)一(yí)段(duàn)香(xiāng)。"],
      g: "“降”读 xiáng，服输的意思；“阁”同“搁”，放下。" },
    { k: "古诗", n: "嫦娥", a: "唐·李商隐", l: [
      "云(yún)母(mǔ)屏(píng)风(fēng)烛(zhú)影(yǐng)深(shēn)，长(cháng)河(hé)渐(jiàn)落(luò)晓(xiǎo)星(xīng)沉(chén)。",
      "常(cháng)娥(é)应(yīng)悔(huǐ)偷(tōu)灵(líng)药(yào)，碧(bì)海(hǎi)青(qīng)天(tiān)夜(yè)夜(yè)心(xīn)。"],
      g: "常娥即嫦娥；“应”读 yīng，是料想的意思。" },
    { k: "古诗", n: "出塞", a: "唐·王昌龄", l: [
      "秦(qín)时(shí)明(míng)月(yuè)汉(hàn)时(shí)关(guān)，万(wàn)里(lǐ)长(cháng)征(zhēng)人(rén)未(wèi)还(huán)。",
      "但(dàn)使(shǐ)龙(lóng)城(chéng)飞(fēi)将(jiàng)在(zài)，不(bú)教(jiào)胡(hú)马(mǎ)度(dù)阴(yīn)山(shān)。"],
      g: "“教”读 jiào，让、使的意思。" },
    { k: "古诗", n: "凉州词", a: "唐·王之涣", l: [
      "黄(huáng)河(hé)远(yuǎn)上(shàng)白(bái)云(yún)间(jiān)，一(yí)片(piàn)孤(gū)城(chéng)万(wàn)仞(rèn)山(shān)。",
      "羌(qiāng)笛(dí)何(hé)须(xū)怨(yuàn)杨(yáng)柳(liǔ)，春(chūn)风(fēng)不(bú)度(dù)玉(yù)门(mén)关(guān)。"] },
    { k: "古诗", n: "夏日绝句", a: "宋·李清照", l: [
      "生(shēng)当(dāng)作(zuò)人(rén)杰(jié)，死(sǐ)亦(yì)为(wéi)鬼(guǐ)雄(xióng)。",
      "至(zhì)今(jīn)思(sī)项(xiàng)羽(yǔ)，不(bù)肯(kěn)过(guò)江(jiāng)东(dōng)。"],
      g: "“为”读 wéi，是成为的意思。" },
  ],
  down: [
    { k: "古诗", n: "四时田园杂兴（其二十五）", a: "宋·范成大", l: [
      "梅(méi)子(zǐ)金(jīn)黄(huáng)杏(xìng)子(zǐ)肥(féi)，麦(mài)花(huā)雪(xuě)白(bái)菜(cài)花(huā)稀(xī)。",
      "日(rì)长(cháng)篱(lí)落(luò)无(wú)人(rén)过(guò)，惟(wéi)有(yǒu)蜻(qīng)蜓(tíng)蛱(jiá)蝶(dié)飞(fēi)。"],
      g: "蛱蝶就是蝴蝶；篱落是篱笆。" },
    { k: "古诗", n: "宿新市徐公店", a: "宋·杨万里", l: [
      "篱(lí)落(luò)疏(shū)疏(shū)一(yí)径(jìng)深(shēn)，树(shù)头(tóu)新(xīn)绿(lǜ)未(wèi)成(chéng)阴(yīn)。",
      "儿(ér)童(tóng)急(jí)走(zǒu)追(zhuī)黄(huáng)蝶(dié)，飞(fēi)入(rù)菜(cài)花(huā)无(wú)处(chù)寻(xún)。"],
      g: "“急走”是奔跑的意思。“阴”同“荫”，树荫。" },
    { k: "词", n: "清平乐·村居", a: "宋·辛弃疾", l: [
      "茅(máo)檐(yán)低(dī)小(xiǎo)，溪(xī)上(shàng)青(qīng)青(qīng)草(cǎo)。",
      "醉(zuì)里(lǐ)吴(wú)音(yīn)相(xiāng)媚(mèi)好(hǎo)，白(bái)发(fà)谁(shuí)家(jiā)翁(wēng)媪(ǎo)？",
      "大(dà)儿(ér)锄(chú)豆(dòu)溪(xī)东(dōng)，中(zhōng)儿(ér)正(zhèng)织(zhī)鸡(jī)笼(lóng)。",
      "最(zuì)喜(xǐ)小(xiǎo)儿(ér)亡(wú)赖(lài)，溪(xī)头(tóu)卧(wò)剥(bō)莲(lián)蓬(péng)。"],
      g: "媚好（mèi hǎo）：亲热美好。亡赖同“无赖”（wú lài），这里指顽皮可爱。翁媪：老翁和老妇。" },
    { k: "古诗", n: "芙蓉楼送辛渐", a: "唐·王昌龄", l: [
      "寒(hán)雨(yǔ)连(lián)江(jiāng)夜(yè)入(rù)吴(wú)，平(píng)明(míng)送(sòng)客(kè)楚(chǔ)山(shān)孤(gū)。",
      "洛(luò)阳(yáng)亲(qīn)友(yǒu)如(rú)相(xiāng)问(wèn)，一(yí)片(piàn)冰(bīng)心(xīn)在(zài)玉(yù)壶(hú)。"] },
    { k: "古诗", n: "塞下曲", a: "唐·卢纶", l: [
      "月(yuè)黑(hēi)雁(yàn)飞(fēi)高(gāo)，单(chán)于(yú)夜(yè)遁(dùn)逃(táo)。",
      "欲(yù)将(jiāng)轻(qīng)骑(qí)逐(zhú)，大(dà)雪(xuě)满(mǎn)弓(gōng)刀(dāo)。"],
      g: "单于（chán yú）：匈奴首领。“骑”读 qí，指骑兵。" },
    { k: "古诗", n: "墨梅", a: "元·王冕", l: [
      "我(wǒ)家(jiā)洗(xǐ)砚(yàn)池(chí)头(tóu)树(shù)，朵(duǒ)朵(duǒ)花(huā)开(kāi)淡(dàn)墨(mò)痕(hén)。",
      "不(bú)要(yào)人(rén)夸(kuā)好(hǎo)颜(yán)色(sè)，只(zhǐ)留(liú)清(qīng)气(qì)满(mǎn)乾(qián)坤(kūn)。"],
      g: "借墨梅抒志：不求外表艳丽，只留一身清气。" },
    { k: "古诗", n: "独坐敬亭山", a: "唐·李白", l: [
      "众(zhòng)鸟(niǎo)高(gāo)飞(fēi)尽(jìn)，孤(gū)云(yún)独(dú)去(qù)闲(xián)。",
      "相(xiāng)看(kàn)两(liǎng)不(bú)厌(yàn)，只(zhǐ)有(yǒu)敬(jìng)亭(tíng)山(shān)。"] },
  ],
});

// ---------- 五年级（上册） ----------
CN_BEIJI.push({
  up: [
    { k: "古诗", n: "蝉", a: "唐·虞世南", l: [
      "垂(chuí)緌(ruí)饮(yǐn)清(qīng)露(lù)，流(liú)响(xiǎng)出(chū)疏(shū)桐(tóng)。",
      "居(jū)高(gāo)声(shēng)自(zì)远(yuǎn)，非(fēi)是(shì)借(jiè)秋(qiū)风(fēng)。"],
      g: "緌（ruí）：古人帽带结在下巴下垂的部分，这里指蝉头上的触须。" },
    { k: "古诗", n: "乞巧", a: "唐·林杰", l: [
      "七(qī)夕(xī)今(jīn)宵(xiāo)看(kàn)碧(bì)霄(xiāo)，牵(qiān)牛(niú)织(zhī)女(nǚ)渡(dù)河(hé)桥(qiáo)。",
      "家(jiā)家(jiā)乞(qǐ)巧(qiǎo)望(wàng)秋(qiū)月(yuè)，穿(chuān)尽(jìn)红(hóng)丝(sī)几(jǐ)万(wàn)条(tiáo)。"] },
    { k: "古诗", n: "示儿", a: "宋·陆游", l: [
      "死(sǐ)去(qù)元(yuán)知(zhī)万(wàn)事(shì)空(kōng)，但(dàn)悲(bēi)不(bú)见(jiàn)九(jiǔ)州(zhōu)同(tóng)。",
      "王(wáng)师(shī)北(běi)定(dìng)中(zhōng)原(yuán)日(rì)，家(jiā)祭(jì)无(wú)忘(wàng)告(gào)乃(nǎi)翁(wēng)。"],
      g: "“元”同“原”，本来；乃翁：你们的父亲，诗人自称。" },
    { k: "古诗", n: "题临安邸", a: "宋·林升", l: [
      "山(shān)外(wài)青(qīng)山(shān)楼(lóu)外(wài)楼(lóu)，西(xī)湖(hú)歌(gē)舞(wǔ)几(jǐ)时(shí)休(xiū)？",
      "暖(nuǎn)风(fēng)熏(xūn)得(de)游(yóu)人(rén)醉(zuì)，直(zhí)把(bǎ)杭(háng)州(zhōu)作(zuò)汴(biàn)州(zhōu)。"],
      g: "邸（dǐ）：高级官员的住所。" },
    { k: "古诗", n: "己亥杂诗", a: "清·龚自珍", l: [
      "九(jiǔ)州(zhōu)生(shēng)气(qì)恃(shì)风(fēng)雷(léi)，万(wàn)马(mǎ)齐(qí)喑(yīn)究(jiū)可(kě)哀(āi)。",
      "我(wǒ)劝(quàn)天(tiān)公(gōng)重(chóng)抖(dǒu)擞(sǒu)，不(bù)拘(jū)一(yí)格(gé)降(jiàng)人(rén)才(cái)。"],
      g: "恃：依靠。喑：沉默。抖擞：振作精神。" },
    { k: "古诗", n: "山居秋暝", a: "唐·王维", l: [
      "空(kōng)山(shān)新(xīn)雨(yǔ)后(hòu)，天(tiān)气(qì)晚(wǎn)来(lái)秋(qiū)。",
      "明(míng)月(yuè)松(sōng)间(jiān)照(zhào)，清(qīng)泉(quán)石(shí)上(shàng)流(liú)。",
      "竹(zhú)喧(xuān)归(guī)浣(huàn)女(nǚ)，莲(lián)动(dòng)下(xià)渔(yú)舟(zhōu)。",
      "随(suí)意(yì)春(chūn)芳(fāng)歇(xiē)，王(wáng)孙(sūn)自(zì)可(kě)留(liú)。"],
      g: "暝（míng）：日落时分。浣女：洗衣服的女子。" },
    { k: "古诗", n: "枫桥夜泊", a: "唐·张继", l: [
      "月(yuè)落(luò)乌(wū)啼(tí)霜(shuāng)满(mǎn)天(tiān)，江(jiāng)枫(fēng)渔(yú)火(huǒ)对(duì)愁(chóu)眠(mián)。",
      "姑(gū)苏(sū)城(chéng)外(wài)寒(hán)山(shān)寺(sì)，夜(yè)半(bàn)钟(zhōng)声(shēng)到(dào)客(kè)船(chuán)。"] },
    { k: "词", n: "长相思", a: "清·纳兰性德", l: [
      "山(shān)一(yì)程(chéng)，水(shuǐ)一(yì)程(chéng)，身(shēn)向(xiàng)榆(yú)关(guān)那(nà)畔(pàn)行(xíng)，夜(yè)深(shēn)千(qiān)帐(zhàng)灯(dēng)。",
      "风(fēng)一(yì)更(gēng)，雪(xuě)一(yì)更(gēng)，聒(guō)碎(suì)乡(xiāng)心(xīn)梦(mèng)不(bù)成(chéng)，故(gù)园(yuán)无(wú)此(cǐ)声(shēng)。"],
      g: "榆关即山海关；聒（guō）：声音嘈杂扰人。" },
    { k: "课文", n: "白鹭（第 1~5 段·郭沫若）", l: [
      "白(bái)鹭(lù)是(shì)一(yí)首(shǒu)精(jīng)巧(qiǎo)的(de)诗(shī)。",
      "色(sè)素(sù)的(de)配(pèi)合(hé)，身(shēn)段(duàn)的(de)大(dà)小(xiǎo)，一(yí)切(qiè)都(dōu)很(hěn)适(shì)宜(yí)。",
      "增(zēng)之(zhī)一(yì)分(fēn)则(zé)嫌(xián)长(cháng)，减(jiǎn)之(zhī)一(yì)分(fēn)则(zé)嫌(xián)短(duǎn)，素(sù)之(zhī)一(yì)忽(hū)则(zé)嫌(xián)白(bái)，黛(dài)之(zhī)一(yì)忽(hū)则(zé)嫌(xián)黑(hēi)。"],
      g: "全文要求背诵；先读准字音，再体会“诗中有画”的意境。" },
    { k: "课文", n: "少年中国说（节选）· 梁启超", l: [
      "故(gù)今(jīn)日(rì)之(zhī)责(zé)任(rèn)，不(bú)在(zài)他(tā)人(rén)，而(ér)全(quán)在(zài)我(wǒ)少(shào)年(nián)。",
      "少(shào)年(nián)智(zhì)则(zé)国(guó)智(zhì)，少(shào)年(nián)富(fù)则(zé)国(guó)富(fù)，少(shào)年(nián)强(qiáng)则(zé)国(guó)强(qiáng)。",
      "少(shào)年(nián)独(dú)立(lì)则(zé)国(guó)独(dú)立(lì)，少(shào)年(nián)自(zì)由(yóu)则(zé)国(guó)自(zì)由(yóu)。"],
      g: "排比句要读出一浪高过一浪的气势。" },
  ],
  down: [
    { k: "古诗", n: "四时田园杂兴（其三十一）", a: "宋·范成大", l: [
      "昼(zhòu)出(chū)耘(yún)田(tián)夜(yè)绩(jì)麻(má)，村(cūn)庄(zhuāng)儿(ér)女(nǚ)各(gè)当(dāng)家(jiā)。",
      "童(tóng)孙(sūn)未(wèi)解(jiě)供(gòng)耕(gēng)织(zhī)，也(yě)傍(bàng)桑(sāng)阴(yīn)学(xué)种(zhòng)瓜(guā)。"],
      g: "耘田：除草松土。供：从事。傍：靠近。" },
    { k: "古诗", n: "稚子弄冰", a: "宋·杨万里", l: [
      "稚(zhì)子(zǐ)金(jīn)盆(pén)脱(tuō)晓(xiǎo)冰(bīng)，彩(cǎi)丝(sī)穿(chuān)取(qǔ)当(dàng)银(yín)铮(zhēng)。",
      "敲(qiāo)成(chéng)玉(yù)磬(qìng)穿(chuān)林(lín)响(xiǎng)，忽(hū)作(zuò)玻(bō)璃(lí)碎(suì)地(dì)声(shēng)。"],
      g: "铮：一种金属打击乐器。磬：古代打击乐器。玻璃：古时指一种天然玉石。" },
    { k: "古诗", n: "村晚", a: "宋·雷震", l: [
      "草(cǎo)满(mǎn)池(chí)塘(táng)水(shuǐ)满(mǎn)陂(bēi)，山(shān)衔(xián)落(luò)日(rì)浸(jìn)寒(hán)漪(yī)。",
      "牧(mù)童(tóng)归(guī)去(qù)横(héng)牛(niú)背(bèi)，短(duǎn)笛(dí)无(wú)腔(qiāng)信(xìn)口(kǒu)吹(chuī)。"],
      g: "陂：池塘岸边。漪：水波。信口：随口。" },
    { k: "古诗", n: "从军行", a: "唐·王昌龄", l: [
      "青(qīng)海(hǎi)长(cháng)云(yún)暗(àn)雪(xuě)山(shān)，孤(gū)城(chéng)遥(yáo)望(wàng)玉(yù)门(mén)关(guān)。",
      "黄(huáng)沙(shā)百(bǎi)战(zhàn)穿(chuān)金(jīn)甲(jiǎ)，不(bú)破(pò)楼(lóu)兰(lán)终(zhōng)不(bù)还(huán)。"],
      g: "穿：磨破。楼兰：借指侵扰西北的敌人。" },
    { k: "古诗", n: "秋夜将晓出篱门迎凉有感", a: "宋·陆游", l: [
      "三(sān)万(wàn)里(lǐ)河(hé)东(dōng)入(rù)海(hǎi)，五(wǔ)千(qiān)仞(rèn)岳(yuè)上(shàng)摩(mó)天(tiān)。",
      "遗(yí)民(mín)泪(lèi)尽(jìn)胡(hú)尘(chén)里(lǐ)，南(nán)望(wàng)王(wáng)师(shī)又(yòu)一(yì)年(nián)。"],
      g: "仞：长度单位，形容极高。摩：接触。" },
    { k: "古诗", n: "闻官军收河南河北", a: "唐·杜甫", l: [
      "剑(jiàn)外(wài)忽(hū)传(chuán)收(shōu)蓟(jì)北(běi)，初(chū)闻(wén)涕(tì)泪(lèi)满(mǎn)衣(yī)裳(cháng)。",
      "却(què)看(kàn)妻(qī)子(zǐ)愁(chóu)何(hé)在(zài)，漫(màn)卷(juǎn)诗(shī)书(shū)喜(xǐ)欲(yù)狂(kuáng)。",
      "白(bái)日(rì)放(fàng)歌(gē)须(xū)纵(zòng)酒(jiǔ)，青(qīng)春(chūn)作(zuò)伴(bàn)好(hǎo)还(huán)乡(xiāng)。",
      "即(jí)从(cóng)巴(bā)峡(xiá)穿(chuān)巫(wū)峡(xiá)，便(biàn)下(xià)襄(xiāng)阳(yáng)向(xiàng)洛(luò)阳(yáng)。"],
      g: "被称为杜甫“生平第一快诗”，要读出喜欲狂的畅快。" },
    { k: "古诗", n: "游子吟", a: "唐·孟郊", l: [
      "慈(cí)母(mǔ)手(shǒu)中(zhōng)线(xiàn)，游(yóu)子(zǐ)身(shēn)上(shàng)衣(yī)。",
      "临(lín)行(xíng)密(mì)密(mì)缝(féng)，意(yì)恐(kǒng)迟(chí)迟(chí)归(guī)。",
      "谁(shuí)言(yán)寸(cùn)草(cǎo)心(xīn)，报(bào)得(de)三(sān)春(chūn)晖(huī)。"] },
    { k: "古诗", n: "鸟鸣涧", a: "唐·王维", l: [
      "人(rén)闲(xián)桂(guì)花(huā)落(luò)，夜(yè)静(jìng)春(chūn)山(shān)空(kōng)。",
      "月(yuè)出(chū)惊(jīng)山(shān)鸟(niǎo)，时(shí)鸣(míng)春(chūn)涧(jiàn)中(zhōng)。"] },
    { k: "古诗", n: "黄鹤楼送孟浩然之广陵", a: "唐·李白", l: [
      "故(gù)人(rén)西(xī)辞(cí)黄(huáng)鹤(hè)楼(lóu)，烟(yān)花(huā)三(sān)月(yuè)下(xià)扬(yáng)州(zhōu)。",
      "孤(gū)帆(fān)远(yuǎn)影(yǐng)碧(bì)空(kōng)尽(jìn)，唯(wéi)见(jiàn)长(cháng)江(jiāng)天(tiān)际(jì)流(liú)。"] },
    { k: "文言文", n: "自相矛盾（节选）·《韩非子》", l: [
      "楚(chǔ)人(rén)有(yǒu)鬻(yù)盾(dùn)与(yǔ)矛(máo)者(zhě)，誉(yù)之(zhī)曰(yuē)：吾(wú)盾(dùn)之(zhī)坚(jiān)，物(wù)莫(mò)能(néng)陷(xiàn)也(yě)。",
      "又(yòu)誉(yù)其(qí)矛(máo)曰(yuē)：吾(wú)矛(máo)之(zhī)利(lì)，于(yú)物(wù)无(wú)不(bú)陷(xiàn)也(yě)。",
      "夫(fú)不(bù)可(kě)同(tóng)世(shì)而(ér)立(lì)。"],
      g: "鬻：卖。誉：夸赞。陷：刺穿。比喻说话做事前后抵触。" },
  ],
});

// ---------- 六年级（上册） ----------
CN_BEIJI.push({
  up: [
    { k: "古诗", n: "宿建德江", a: "唐·孟浩然", l: [
      "移(yí)舟(zhōu)泊(bó)烟(yān)渚(zhǔ)，日(rì)暮(mù)客(kè)愁(chóu)新(xīn)。",
      "野(yě)旷(kuàng)天(tiān)低(dī)树(shù)，江(jiāng)清(qīng)月(yuè)近(jìn)人(rén)。"],
      g: "渚：水中的小块陆地。" },
    { k: "古诗", n: "六月二十七日望湖楼醉书", a: "宋·苏轼", l: [
      "黑(hēi)云(yún)翻(fān)墨(mò)未(wèi)遮(zhē)山(shān)，白(bái)雨(yǔ)跳(tiào)珠(zhū)乱(luàn)入(rù)船(chuán)。",
      "卷(juǎn)地(dì)风(fēng)来(lái)忽(hū)然(rán)散(sàn)，望(wàng)湖(hú)楼(lóu)下(xià)水(shuǐ)如(rú)天(tiān)。"] },
    { k: "词", n: "西江月·夜行黄沙道中", a: "宋·辛弃疾", l: [
      "明(míng)月(yuè)别(bié)枝(zhī)惊(jīng)鹊(què)，清(qīng)风(fēng)半(bàn)夜(yè)鸣(míng)蝉(chán)。",
      "稻(dào)花(huā)香(xiāng)里(lǐ)说(shuō)丰(fēng)年(nián)，听(tīng)取(qǔ)蛙(wā)声(shēng)一(yí)片(piàn)。",
      "七(qī)八(bā)个(gè)星(xīng)天(tiān)外(wài)，两(liǎng)三(sān)点(diǎn)雨(yǔ)山(shān)前(qián)。",
      "旧(jiù)时(shí)茅(máo)店(diàn)社(shè)林(lín)边(biān)，路(lù)转(zhuǎn)溪(xī)桥(qiáo)忽(hū)见(xiàn)。"],
      g: "“见”读 xiàn，同“现”，出现。" },
    { k: "古诗", n: "过故人庄", a: "唐·孟浩然", l: [
      "故(gù)人(rén)具(jù)鸡(jī)黍(shǔ)，邀(yāo)我(wǒ)至(zhì)田(tián)家(jiā)。",
      "绿(lǜ)树(shù)村(cūn)边(biān)合(hé)，青(qīng)山(shān)郭(guō)外(wài)斜(xié)。",
      "开(kāi)轩(xuān)面(miàn)场(cháng)圃(pǔ)，把(bǎ)酒(jiǔ)话(huà)桑(sāng)麻(má)。",
      "待(dài)到(dào)重(chóng)阳(yáng)日(rì)，还(hái)来(lái)就(jiù)菊(jú)花(huā)。"],
      g: "黍：黄米。轩：窗户。重阳：农历九月初九的传统节日。" },
    { k: "古诗", n: "春日", a: "宋·朱熹", l: [
      "胜(shèng)日(rì)寻(xún)芳(fāng)泗(sì)水(shuǐ)滨(bīn)，无(wú)边(biān)光(guāng)景(jǐng)一(yí)时(shí)新(xīn)。",
      "等(děng)闲(xián)识(shí)得(dé)东(dōng)风(fēng)面(miàn)，万(wàn)紫(zǐ)千(qiān)红(hóng)总(zǒng)是(shì)春(chūn)。"] },
    { k: "古诗", n: "回乡偶书", a: "唐·贺知章", l: [
      "少(shào)小(xiǎo)离(lí)家(jiā)老(lǎo)大(dà)回(huí)，乡(xiāng)音(yīn)无(wú)改(gǎi)鬓(bìn)毛(máo)衰(cuī)。",
      "儿(ér)童(tóng)相(xiāng)见(jiàn)不(bù)相(xiāng)识(shí)，笑(xiào)问(wèn)客(kè)从(cóng)何(hé)处(chù)来(lái)。"],
      g: "衰（cuī）：稀疏、脱落的样子。" },
    { k: "古诗", n: "浪淘沙（其一）", a: "唐·刘禹锡", l: [
      "九(jiǔ)曲(qū)黄(huáng)河(hé)万(wàn)里(lǐ)沙(shā)，浪(làng)淘(táo)风(fēng)簸(bǒ)自(zì)天(tiān)涯(yá)。",
      "如(rú)今(jīn)直(zhí)上(shàng)银(yín)河(hé)去(qù)，同(tóng)到(dào)牵(qiān)牛(niú)织(zhī)女(nǚ)家(jiā)。"],
      g: "曲：弯弯曲曲。簸：颠簸。" },
    { k: "古诗", n: "江南春", a: "唐·杜牧", l: [
      "千(qiān)里(lǐ)莺(yīng)啼(tí)绿(lǜ)映(yìng)红(hóng)，水(shuǐ)村(cūn)山(shān)郭(guō)酒(jiǔ)旗(qí)风(fēng)。",
      "南(nán)朝(cháo)四(sì)百(bǎi)八(bā)十(shí)寺(sì)，多(duō)少(shǎo)楼(lóu)台(tái)烟(yān)雨(yǔ)中(zhōng)。"] },
    { k: "古诗", n: "书湖阴先生壁", a: "宋·王安石", l: [
      "茅(máo)檐(yán)长(cháng)扫(sǎo)净(jìng)无(wú)苔(tái)，花(huā)木(mù)成(chéng)畦(qí)手(shǒu)自(zì)栽(zāi)。",
      "一(yì)水(shuǐ)护(hù)田(tián)将(jiāng)绿(lǜ)绕(rào)，两(liǎng)山(shān)排(pái)闼(tà)送(sòng)青(qīng)来(lái)。"],
      g: "畦：种有蔬菜或花木的田间小块土地。闼：小门。" },
    { k: "文言文", n: "伯牙鼓琴（节选）·《吕氏春秋》", l: [
      "伯(bó)牙(yá)鼓(gǔ)琴(qín)，锺(zhōng)子(zǐ)期(qī)听(tīng)之(zhī)。",
      "方(fāng)鼓(gǔ)琴(qín)而(ér)志(zhì)在(zài)太(tài)山(shān)，锺(zhōng)子(zǐ)期(qī)曰(yuē)：善(shàn)哉(zāi)乎(hū)鼓(gǔ)琴(qín)，巍(wēi)巍(wēi)乎(hū)若(ruò)太(tài)山(shān)！",
      "少(shǎo)选(xuǎn)之(zhī)间(jiān)而(ér)志(zhì)在(zài)流(liú)水(shuǐ)，锺(zhōng)子(zǐ)期(qī)又(yòu)曰(yuē)：善(shàn)哉(zāi)乎(hū)鼓(gǔ)琴(qín)，汤(shāng)汤(shāng)乎(hū)若(ruò)流(liú)水(shuǐ)！"],
      g: "善哉：好啊。少选：一会儿。汤汤（shāng shāng）：水流大而急。“知音”一词即源于此。" },
  ],
  down: [
    { k: "古诗", n: "寒食", a: "唐·韩翃", l: [
      "春(chūn)城(chéng)无(wú)处(chù)不(bú)飞(fēi)花(huā)，寒(hán)食(shí)东(dōng)风(fēng)御(yù)柳(liǔ)斜(xié)。",
      "日(rì)暮(mù)汉(hàn)宫(gōng)传(chuán)蜡(là)烛(zhú)，轻(qīng)烟(yān)散(sàn)入(rù)五(wǔ)侯(hóu)家(jiā)。"],
      g: "寒食：清明节前一二日，禁止生火做饭的节日。五侯：泛指权贵大臣。" },
    { k: "古诗", n: "迢迢牵牛星", a: "《古诗十九首》", l: [
      "迢(tiáo)迢(tiáo)牵(qiān)牛(niú)星(xīng)，皎(jiǎo)皎(jiǎo)河(hé)汉(hàn)女(nǚ)。",
      "纤(xiān)纤(xiān)擢(zhuó)素(sù)手(shǒu)，札(zhá)札(zhá)弄(nòng)机(jī)杼(zhù)。",
      "终(zhōng)日(rì)不(bù)成(chéng)章(zhāng)，泣(qì)涕(tì)零(líng)如(rú)雨(yǔ)。",
      "河(hé)汉(hàn)清(qīng)且(qiě)浅(qiǎn)，相(xiāng)去(qù)复(fù)几(jǐ)许(xǔ)？",
      "盈(yíng)盈(yíng)一(yì)水(shuǐ)间(jiàn)，脉(mò)脉(mò)不(bù)得(dé)语(yǔ)。"],
      g: "擢：伸出。机杼：织布机。脉脉：相视无言的样子。“间”读 jiàn，隔开。" },
    { k: "古诗", n: "十五夜望月", a: "唐·王建", l: [
      "中(zhōng)庭(tíng)地(dì)白(bái)树(shù)栖(qī)鸦(yā)，冷(lěng)露(lù)无(wú)声(shēng)湿(shī)桂(guì)花(huā)。",
      "今(jīn)夜(yè)月(yuè)明(míng)人(rén)尽(jìn)望(wàng)，不(bù)知(zhī)秋(qiū)思(sì)落(luò)谁(shuí)家(jiā)。"] },
    { k: "古诗", n: "马诗", a: "唐·李贺", l: [
      "大(dà)漠(mò)沙(shā)如(rú)雪(xuě)，燕(yān)山(shān)月(yuè)似(sì)钩(gōu)。",
      "何(hé)当(dāng)金(jīn)络(luò)脑(nǎo)，快(kuài)走(zǒu)踏(tà)清(qīng)秋(qiū)。"],
      g: "燕山：指燕然山。金络脑：用黄金装饰的马笼头，比喻重要的位置。" },
    { k: "古诗", n: "石灰吟", a: "明·于谦", l: [
      "千(qiān)锤(chuí)万(wàn)凿(záo)出(chū)深(shēn)山(shān)，烈(liè)火(huǒ)焚(fén)烧(shāo)若(ruò)等(děng)闲(xián)。",
      "粉(fěn)骨(gǔ)碎(suì)身(shēn)浑(hún)不(bú)怕(pà)，要(yào)留(liú)清(qīng)白(bái)在(zài)人(rén)间(jiān)。"],
      g: "托物言志名篇，注意“凿”“焚”“浑”等字的读音与写法。" },
    { k: "古诗", n: "竹石", a: "清·郑燮", l: [
      "咬(yǎo)定(dìng)青(qīng)山(shān)不(bú)放(fàng)松(sōng)，立(lì)根(gēn)原(yuán)在(zài)破(pò)岩(yán)中(zhōng)。",
      "千(qiān)磨(mó)万(wàn)击(jī)还(hái)坚(jiān)劲(jìng)，任(rèn)尔(ěr)东(dōng)西(xī)南(nán)北(běi)风(fēng)。"],
      g: "郑燮号板桥。“劲”读 jìng，坚强有力；任尔：随你。" },
    { k: "古诗", n: "长歌行", a: "汉乐府", l: [
      "青(qīng)青(qīng)园(yuán)中(zhōng)葵(kuí)，朝(zhāo)露(lù)待(dài)日(rì)晞(xī)。",
      "阳(yáng)春(chūn)布(bù)德(dé)泽(zé)，万(wàn)物(wù)生(shēng)光(guāng)辉(huī)。",
      "常(cháng)恐(kǒng)秋(qiū)节(jié)至(zhì)，焜(kūn)黄(huáng)华(huá)叶(yè)衰(shuāi)。",
      "百(bǎi)川(chuān)东(dōng)到(dào)海(hǎi)，何(hé)时(shí)复(fù)西(xī)归(guī)？",
      "少(shào)壮(zhuàng)不(bù)努(nǔ)力(lì)，老(lǎo)大(dà)徒(tú)伤(shāng)悲(bēi)。"],
      g: "晞：晒干。焜黄：草木枯黄。“华”同“花”。" },
    { k: "文言文", n: "学弈（节选）·《孟子》", l: [
      "弈(yì)秋(qiū)，通(tōng)国(guó)之(zhī)善(shàn)弈(yì)者(zhě)也(yě)。",
      "使(shǐ)弈(yì)秋(qiū)诲(huì)二(èr)人(rén)弈(yì)，其(qí)一(yī)人(rén)专(zhuān)心(xīn)致(zhì)志(zhì)，惟(wéi)弈(yì)秋(qiū)之(zhī)为(wéi)听(tīng)；",
      "一(yì)人(rén)虽(suī)听(tīng)之(zhī)，一(yì)心(xīn)以(yǐ)为(wéi)有(yǒu)鸿(hóng)鹄(hú)将(jiāng)至(zhì)，思(sī)援(yuán)弓(gōng)缴(zhuó)而(ér)射(shè)之(zhī)。",
      "虽(suī)与(yǔ)之(zhī)俱(jù)学(xué)，弗(fú)若(ruò)之(zhī)矣(yǐ)。"],
      g: "弈：下棋。诲：教导。鸿鹄：天鹅。缴：系在箭上的丝绳，这里指用箭射。" },
  ],
});
// ============ 英语分单元单词库（外语教学与研究出版社《英语》（新交际）教材词汇表整理） ============
// 新交际教材目前仅 1-2 年级，每册 Unit 1-6；同册内重复出现的单词只保留首次
const EN_UNITS = {
  1: [
    { name: '一年级上册', units: [
      { name: 'Unit 1', words: [['hello', '你好'], ['nice', '令人愉快的'], ['meet', '认识，结识'], ['you', '你'], ["let's", '让我们'], ['play', '玩，玩耍'], ['I', '我'], ['am', '是'], ['too', '也'], ['photo', '照片'], ['how', '怎样'], ['say', '说'], ['four', '四'], ['five', '五'], ['six', '六'], ['seven', '七'], ['balloon', '气球'], ['thank', '感谢'], ['please', '请'], ['number', '数字']] },
      { name: 'Unit 2', words: [['one', '一'], ['two', '二'], ['three', '三']] },
      { name: 'Unit 3', words: [['my', '我的'], ['family', '家庭'], ['mum', '妈妈'], ['dad', '爸爸'], ['grandpa', '祖父；外祖父'], ['grandma', '祖母；外祖母'], ['sister', '姐姐；妹妹'], ['and', '和，与'], ['brother', '哥哥；弟弟'], ['this', '这，这个'], ['is', '是'], ['love', '爱'], ['me', '我']] },
      { name: 'Unit 4', words: [['what', '什么'], ['open', '打开'], ['door', '门'], ['classroom', '教室'], ['blackboard', '黑板'], ['window', '窗户'], ['desk', '书桌'], ['chair', '椅子'], ['it', '它'], ['big', '大的'], ['that', '那，那个'], ['teacher', '老师'], ['a/an', '一（个）'], ['very', '非常'], ['old', '年代久远的'], ['school', '学校'], ['look', '看']] },
      { name: 'Unit 5', words: [['schoolbag', '书包'], ['pencil case', '笔袋'], ['pencil', '铅笔'], ['book', '书'], ['bye', '再见'], ['here you are', '给你'], ['read', '阅读'], ['together', '一起']] },
      { name: 'Unit 6', words: [['red', '红色'], ['green', '绿色'], ['blue', '蓝色'], ['black', '黑色'], ['white', '白色'], ['yellow', '黄色'], ['colour', '颜色'], ['so', '这么'], ['many', '许多'], ['happy', '快乐的'], ['Chinese New Year', '春节'], ['stop', '停止'], ['go', '走'], ['slow', '慢下来']] },
    ]},
    { name: '一年级下册', units: [
      { name: 'Unit 1', words: [['pet', '宠物'], ['bird', '鸟'], ['dog', '狗'], ['cat', '猫'], ['fish', '鱼'], ['rabbit', '兔'], ['friend', '朋友']] },
      { name: 'Unit 2', words: [['animal', '动物'], ['they', '它们'], ['welcome', '欢迎'], ['zoo', '动物园'], ['tiger', '老虎'], ['lion', '狮子'], ['bear', '熊'], ['monkey', '猴'], ['panda', '大熊猫'], ['cute', '漂亮的；惹人喜爱的'], ['picture', '图画'], ['which', '哪些']] },
      { name: 'Unit 3', words: [['face', '脸'], ['eye', '眼睛'], ['ear', '耳朵'], ['nose', '鼻子'], ['mouth', '嘴'], ['we', '我们'], ['twin', '双胞胎'], ['have', '有，拥有'], ['small', '小的'], ['same', '同样'], ['know', '明白'], ['now', '现在'], ['long', '长的'], ['hair', '头发'], ['short', '短的'], ['different', '不同的'], ['touch', '触摸'], ['your', '你的']] },
      { name: 'Unit 4', words: [['body', '身体'], ['come on', '来吧'], ['boy', '男孩'], ['girl', '女孩'], ['rock', '摇动'], ['move', '移动'], ['head', '头'], ['hand', '手'], ['arm', '手臂'], ['leg', '腿'], ['foot', '脚'], ['robot', '机器人'], ['cool', '酷的'], ['monster', '怪兽'], ['aunt', '姑母，姨母'], ['her', '她的'], ['part', '部位'], ['toy', '玩具'], ['his', '他的'], ['name', '名字'], ['he', '他'], ['swim', '游泳'], ['fast', '快地'], ['she', '她'], ['run', '跑'], ['strong', '健壮的'], ['basketball', '篮球'], ['well', '很好']] },
      { name: 'Unit 5', words: [['home', '家'], ['bed', '床'], ['table', '桌子'], ['sofa', '沙发'], ['room', '房间'], ['sit down', '坐下'], ['next', '紧接着的'], ['day', '一天'], ['clean', '干净的'], ['tidy', '整洁的'], ['OK', '行，可以'], ['amazing', '令人惊叹的'], ['snow', '雪'], ['house', '房屋'], ['tall', '高的'], ['live', '住']] },
      { name: 'Unit 6', words: [['time', '时间'], ['tell', '告诉'], ['Mr', '先生'], ['wolf', '狼'], ['eight', '八'], ['nine', '九'], ['ten', '十'], ['eleven', '十一'], ['twelve', '十二'], ['birthday', '生日'], ['lunch', '午餐'], ['not', '不'], ['yet', '尚，还'], ['busy', '忙的'], ['clock', '时钟']] },
    ]},
  ],
  2: [
    { name: '二年级上册', units: [
      { name: 'Unit 1', words: [['sad', '伤心的'], ['angry', '生气的'], ['tired', '疲倦的'], ['hungry', '饥饿的'], ['fun', '有趣的'], ['show', '演出'], ['turn', '轮到的机会'], ['apple', '苹果'], ["o'clock", '点钟'], ['want', '想要'], ['for', '为了'], ['dinner', '正餐']] },
      { name: 'Unit 2', words: [['eat', '吃'], ['banana', '香蕉'], ['yummy', '美味的'], ['rice', '米饭'], ['noodle', '面条'], ['milk', '牛奶'], ['bread', '面包'], ['like', '喜欢'], ['but', '但是'], ['food', '食物'], ['us', '我们'], ['cake', '蛋糕'], ['sweet', '糖果'], ['ice cream', '冰激凌']] },
      { name: 'Unit 3', words: [['weather', '天气'], ['windy', '多风的'], ['snowy', '多雪的'], ['rainy', '多雨的'], ['sunny', '晴朗的'], ['worry', '担心'], ['wait', '等候'], ['later', '之后'], ['egg', '蛋'], ['other', '另外的'], ['in', '在……里']] },
      { name: 'Unit 4', words: [['spring', '春天'], ['summer', '夏天'], ['autumn', '秋天'], ['winter', '冬天'], ['season', '季节'], ['year', '年'], ['lot', '大量'], ['make', '制作'], ['some', '一些'], ['hat', '帽子']] },
      { name: 'Unit 5', words: [['shirt', '衬衫'], ['skirt', '半身裙'], ['coat', '外套'], ['shoe', '鞋'], ['put', '放'], ['them', '它们'], ['sun', '阳光'], ['jump', '跳']] },
      { name: 'Unit 6', words: [['paper-cut', '剪纸'], ['up', '向上地'], ['lucky', '幸运的'], ['kite', '风筝'], ['card', '贺卡']] },
    ]},
    { name: '二年级下册', units: [
      { name: 'Unit 1', words: [['by', '通过，使用'], ['bus', '公交车'], ['car', '汽车'], ['train', '火车'], ['plane', '飞机'], ['farm', '农场'], ['Chinese', '中国的'], ['new', '新的'], ['see', '看望']] },
      { name: 'Unit 2', words: [['job', '工作'], ['driver', '司机'], ['farmer', '农民'], ['worker', '工人'], ['doctor', '医生'], ['nurse', '护士'], ['our', '我们的'], ['pen', '钢笔'], ['queen', '女王']] },
      { name: 'Unit 3', words: [['cow', '奶牛'], ['chicken', '鸡'], ['sheep', '绵羊'], ['flower', '花'], ['grass', '草'], ['child', '儿童'], ['feed', '喂养'], ['help', '帮助'], ['look at', '看'], ['painting', '绘画作品'], ['yes', '是']] },
      { name: 'Unit 4', words: [['class', '一节课'], ['in class', '上课时'], ['English', '英语'], ['maths', '数学'], ['all', '全部'], ['music', '音乐'], ['PE', '体育课'], ['art', '美术'], ['great', '非常好的'], ['can', '能，会'], ['umbrella', '雨伞'], ['van', '小型货车'], ['student', '学生'], ['box', '盒，箱'], ['paper', '纸']] },
      { name: 'Unit 5', words: [['sing', '唱歌'], ['dance', '跳舞'], ['draw', '画'], ['football', '足球'], ['play football', '踢足球'], ['kick', '踢']] },
      { name: 'Unit 6', words: [['week', '星期'], ['Monday', '星期一'], ['Tuesday', '星期二'], ['Wednesday', '星期三'], ['Thursday', '星期四'], ['Friday', '星期五'], ['every day', '每天'], ['Saturday', '星期六'], ['Sunday', '星期日'], ['sorry', '对不起']] },
    ]},
  ],
};

function unitWordsExtra(grade) {
  const books = EN_UNITS[grade] || [];
  return books.map((book) =>
    '<h5 class="extra-h">📗 ' + book.name + '</h5>' +
    book.units.map((u) =>
      '<div class="unit-block"><b>' + u.name + '</b><div class="word-chips">' +
      u.words.map(([w, c]) => '<span class="word-chip"><b>' + w + '</b>' + c + '</span>').join('') +
      '</div></div>'
    ).join('')
  ).join('') + '<p class="extra-src">单词整理自外语教学与研究出版社《英语》（新交际）教材词汇表</p>';
}

// ============ 语文分册练习题库（人教版/部编版 1-3 年级，每册 10 题：古诗词 + 字词） ============
const CHINESE_BOOK_QUIZZES = {
  g1a: { name: "一年级上册", questions: [
    { q: "《咏鹅》的作者是谁？", options: ["李白", "骆宾王", "孟浩然", "王维"], answer: 1 },
    { q: "“江南可采莲”的下一句是？", options: ["莲叶何田田", "鱼戏莲叶间", "春去花还在", "人来鸟不惊"], answer: 0 },
    { q: "《画》中“远看山有色”的下一句是？", options: ["人来鸟不惊", "近听水无声", "春去花还在", "疑是地上霜"], answer: 1 },
    { q: "“谁知盘中餐”的下一句是？", options: ["汗滴禾下土", "粒粒皆辛苦", "春种一粒粟", "秋收万颗子"], answer: 1 },
    { q: "“小时不识月”的下一句是？", options: ["低头思故乡", "呼作白玉盘", "举头望明月", "床前明月光"], answer: 1 },
    { q: "“解落三秋叶，能开二月花”写的是？", options: ["风", "雨", "雪", "云"], answer: 0 },
    { q: "“山”的正确读音是？", options: ["sān", "shān", "sāng", "shàn"], answer: 1 },
    { q: "“火”字共有几画？", options: ["3 画", "5 画", "4 画", "6 画"], answer: 2 },
    { q: "“大”的反义词是？", options: ["多", "小", "少", "高"], answer: 1 },
    { q: "下列哪个拼音是正确的？", options: ["月 yuè", "月 yüè", "月 yè", "月 yuē"], answer: 0 },
  ]},
  g1b: { name: "一年级下册", questions: [
    { q: "《春晓》的作者是谁？", options: ["李白", "杜甫", "孟浩然", "白居易"], answer: 2 },
    { q: "“春眠不觉晓”的下一句是？", options: ["处处闻啼鸟", "夜来风雨声", "花落知多少", "低头思故乡"], answer: 0 },
    { q: "《静夜思》的作者是谁？", options: ["王维", "李白", "杜牧", "李峤"], answer: 1 },
    { q: "“举头望明月”的下一句是？", options: ["疑是地上霜", "低头思故乡", "床前明月光", "小时不识月"], answer: 1 },
    { q: "“小荷才露尖尖角”的下一句是？", options: ["早有蜻蜓立上头", "映日荷花别样红", "小娃撑小艇", "偷采白莲回"], answer: 0 },
    { q: "“牧童骑黄牛，歌声振林樾”出自哪首诗？", options: ["《村居》", "《所见》", "《池上》", "《画鸡》"], answer: 1 },
    { q: "“清”字的偏旁是？", options: ["青字旁", "三点水", "单人旁", "木字旁"], answer: 1 },
    { q: "“来”的反义词是？", options: ["走", "回", "去", "进"], answer: 2 },
    { q: "“思”的正确读音是？", options: ["sī", "shī", "sì", "shí"], answer: 0 },
    { q: "“草”字共有几画？", options: ["8 画", "10 画", "7 画", "9 画"], answer: 3 },
  ]},
  g2a: { name: "二年级上册", questions: [
    { q: "“欲穷千里目”的下一句是？", options: ["更上一层楼", "黄河入海流", "白日依山尽", "一览众山小"], answer: 0 },
    { q: "《望庐山瀑布》的作者是谁？", options: ["杜甫", "李白", "柳宗元", "王之涣"], answer: 1 },
    { q: "“飞流直下三千尺”的下一句是？", options: ["疑是银河落九天", "日照香炉生紫烟", "遥看瀑布挂前川", "白云生处有人家"], answer: 0 },
    { q: "《江雪》中“千山鸟飞绝”的下一句是？", options: ["独钓寒江雪", "万径人踪灭", "孤舟蓑笠翁", "凌寒独自开"], answer: 1 },
    { q: "“天苍苍，野茫茫”的下一句是？", options: ["风吹草低见牛羊", "草色遥看近却无", "野火烧不尽", "离离原上草"], answer: 0 },
    { q: "“墙角数枝梅”的下一句是？", options: ["凌寒独自开", "遥知不是雪", "为有暗香来", "梅花香自苦寒来"], answer: 0 },
    { q: "“楼”字的偏旁是？", options: ["女字旁", "木字旁", "米字旁", "提手旁"], answer: 1 },
    { q: "“远”的反义词是？", options: ["高", "长", "近", "深"], answer: 2 },
    { q: "“瀑”的正确读音是？", options: ["pù", "bào", "pǔ", "bù"], answer: 0 },
    { q: "下列哪个是 ABB 式词语？", options: ["高高兴兴", "静悄悄", "干干净净", "快快乐乐"], answer: 1 },
  ]},
  g2b: { name: "二年级下册", questions: [
    { q: "“草长莺飞二月天”的下一句是？", options: ["忙趁东风放纸鸢", "拂堤杨柳醉春烟", "儿童散学归来早", "万条垂下绿丝绦"], answer: 1 },
    { q: "《咏柳》的作者是谁？", options: ["杨万里", "杜甫", "贺知章", "白居易"], answer: 2 },
    { q: "“不知细叶谁裁出”的下一句是？", options: ["二月春风似剪刀", "万条垂下绿丝绦", "碧玉妆成一树高", "春色满园关不住"], answer: 0 },
    { q: "“野火烧不尽”的下一句是？", options: ["离离原上草", "春风吹又生", "一岁一枯荣", "远芳侵古道"], answer: 1 },
    { q: "“接天莲叶无穷碧”的下一句是？", options: ["小荷才露尖尖角", "映日荷花别样红", "早有蜻蜓立上头", "水面清圆风荷举"], answer: 1 },
    { q: "“春种一粒粟”的下一句是？", options: ["秋收万颗子", "汗滴禾下土", "四海无闲田", "农夫犹饿死"], answer: 0 },
    { q: "“柳”字的偏旁是？", options: ["木字旁", "提手旁", "卯字旁", "单人旁"], answer: 0 },
    { q: "“忙”的反义词是？", options: ["快", "慢", "闲", "累"], answer: 2 },
    { q: "“咏”的正确读音是？", options: ["yǒng", "yǒn", "yòng", "yóng"], answer: 0 },
    { q: "下列哪个是 AABC 式词语？", options: ["红彤彤", "静悄悄", "津津有味", "绿油油"], answer: 2 },
  ]},
  g3a: { name: "三年级上册", questions: [
    { q: "“远上寒山石径斜”的下一句是？", options: ["白云生处有人家", "停车坐爱枫林晚", "霜叶红于二月花", "孤帆一片日边来"], answer: 0 },
    { q: "《山行》的作者是谁？", options: ["李白", "杜牧", "苏轼", "王维"], answer: 1 },
    { q: "“停车坐爱枫林晚”的下一句是？", options: ["霜叶红于二月花", "白云生处有人家", "远上寒山石径斜", "最是橙黄橘绿时"], answer: 0 },
    { q: "“天门中断楚江开”的下一句是？", options: ["碧水东流至此回", "孤帆一片日边来", "两岸青山相对出", "疑是银河落九天"], answer: 0 },
    { q: "“欲把西湖比西子”的下一句是？", options: ["白银盘里一青螺", "淡妆浓抹总相宜", "水光潋滟晴方好", "山色空蒙雨亦奇"], answer: 1 },
    { q: "“遥望洞庭山水翠”的下一句是？", options: ["白银盘里一青螺", "潭面无风镜未磨", "湖光秋月两相和", "遥望洞庭山水色"], answer: 0 },
    { q: "“径”字的偏旁是？", options: ["双人旁", "土字旁", "走之底", "三点水"], answer: 0 },
    { q: "“浓”的反义词是？", options: ["重", "淡", "轻", "浅"], answer: 1 },
    { q: "“霜”的正确读音是？", options: ["shuāng", "suāng", "shāng", "shuǎng"], answer: 0 },
    { q: "下列哪句诗描写的是秋天的景色？", options: ["霜叶红于二月花", "小荷才露尖尖角", "千山鸟飞绝", "草长莺飞二月天"], answer: 0 },
  ]},
  g3b: { name: "三年级下册", questions: [
    { q: "“迟日江山丽”的下一句是？", options: ["春风花草香", "泥融飞燕子", "沙暖睡鸳鸯", "春江水暖鸭先知"], answer: 0 },
    { q: "“竹外桃花三两枝”的下一句是？", options: ["春江水暖鸭先知", "正是河豚欲上时", "蒌蒿满地芦芽短", "迟日江山丽"], answer: 0 },
    { q: "《元日》的作者是谁？", options: ["杜牧", "王维", "王安石", "苏轼"], answer: 2 },
    { q: "“清明时节雨纷纷”的下一句是？", options: ["路上行人欲断魂", "借问酒家何处有", "牧童遥指杏花村", "春风送暖入屠苏"], answer: 0 },
    { q: "“独在异乡为异客”的下一句是？", options: ["遥知兄弟登高处", "每逢佳节倍思亲", "遍插茱萸少一人", "低头思故乡"], answer: 1 },
    { q: "“遥知兄弟登高处”的下一句是？", options: ["遍插茱萸少一人", "每逢佳节倍思亲", "独在异乡为异客", "西出阳关无故人"], answer: 0 },
    { q: "“酒”字的偏旁是？", options: ["酉字旁", "三点水", "木字旁", "口字旁"], answer: 0 },
    { q: "“新”的反义词是？", options: ["老", "旧", "破", "坏"], answer: 1 },
    { q: "“屠”的正确读音是？", options: ["tú", "tǔ", "dú", "tū"], answer: 0 },
    { q: "《元日》描写的是哪个节日？", options: ["中秋节", "清明节", "春节", "重阳节"], answer: 2 },
  ]},
};

// ============ 分年级知识清单（含详细讲解） ============
const SUBJECT_CONTENT = {
  chinese: {
    primary: [
      [
        ["拼音王国：声母 · 韵母 · 整体认读音节", "掌握 23 个声母、24 个韵母和 16 个整体认读音节的读音与四线三格书写；声调标在韵母主要元音上，口诀“一声平、二声扬、三声拐弯、四声降”。", PINYIN_EXTRA],
        ["笔画笔顺", "先横后竖、先撇后捺、从上到下、从左到右、先外后内再封口；写好基本笔画是写好汉字的第一步。"],
        ["看图说话", "按“什么时间、谁、在哪里、做什么、心情怎样”五要素说完整的话，再连成一段话。"],
        ["简单古诗背诵", "先理解意思再背诵更牢固，如《咏鹅》《静夜思》《悯农》，注意读准字音、背出节奏。"],
        ["必背古诗文·上下册（带拼音）", "整理自人教版（部编版）语文教材，按教材出现顺序编排；古诗、课文节选全部逐字注音。", cnBeiJiExtra(0)],
      ],
      [
        ["查字典方法", "音序查字法：找拼音首字母大写→查音节→找页码；部首查字法：数清部首笔画，适合不会读的字。"],
        ["近义词反义词", "近义词意思相近但用法有别，如“美丽”和“漂亮”；反义词一正一反，如“高大—矮小”，多在句子中对比记忆。"],
        ["写日记入门", "日记格式：第一行写日期、星期、天气；正文写当天最有意思的一件事，说清起因、经过、结果。"],
        ["古诗《咏鹅》《静夜思》", "《咏鹅》抓住“曲项、白毛、红掌”的色彩美；《静夜思》借月光表达思乡之情，背诵时想象画面。"],
        ["必背古诗文·上下册（带拼音）", "整理自人教版（部编版）语文教材，按教材出现顺序编排；古诗、课文节选全部逐字注音。", cnBeiJiExtra(1)],
      ],
      [
        ["修辞初步：比喻拟人", "比喻要有本体和喻体，常用“像、好像、仿佛”；拟人把物当人写，如“花儿在跳舞”。"],
        ["阅读短文抓主旨", "先看题目和开头结尾，找出中心句；概括主旨用“本文写了……告诉我们……”的句式。"],
        ["看图作文", "仔细观察图中的时间、地点、人物、事件，合理想象人物的语言和心理，按顺序写成一段话。"],
        ["古诗《望庐山瀑布》", "“飞流直下三千尺，疑是银河落九天”运用夸张和比喻，写出瀑布的雄伟气势。"],
        ["必背古诗文·上下册（带拼音）", "整理自人教版（部编版）语文教材，按教材出现顺序编排；古诗、词、文言语段全部逐字注音。", cnBeiJiExtra(2)],
      ],
      [
        ["四字词语积累", "分类型积累：AABB 式（高高兴兴）、含动物（守株待兔）、含数字（五颜六色），每天记 3-5 个并造句。"],
        ["段落划分与概括", "按时间、地点或事情发展顺序分段；概括段意抓“谁+干什么+结果怎么样”。"],
        ["记事作文入门", "六要素齐全：时间、地点、人物、起因、经过、结果；重点部分写详细，加入动作和语言描写。"],
        ["古诗《题西林壁》", "“不识庐山真面目，只缘身在此山中”告诉我们：看待事物要全面，当局者迷。"],
        ["必背古诗文·上下册（带拼音）", "整理自人教版（部编版）语文教材，按教材出现顺序编排；古诗、词、文言语段全部逐字注音。", cnBeiJiExtra(3)],
      ],
      [
        ["说明方法辨析", "常见的有列数字、举例子、打比方、作比较；作用答题模板：“运用了××方法，准确/生动地说明了……”。"],
        ["概括文章主要内容", "方法有：题目扩展法、段意合并法、“六要素”串联法；语言要简洁完整。"],
        ["写人作文技巧", "通过外貌、动作、语言、神态表现人物特点；选一两件典型事例，细节描写要具体。"],
        ["古诗词《游子吟》", "“谁言寸草心，报得三春晖”以小草比喻子女、春晖比喻母爱，歌颂伟大的母爱。"],
        ["必背古诗文·上下册（带拼音）", "整理自人教版（部编版）语文教材，按教材出现顺序编排；古诗、词、文言文与课文节选全部逐字注音。", cnBeiJiExtra(4)],
      ],
      [
        ["句子成分基础", "主语是“谁/什么”，谓语是“干什么”，宾语是动作对象；会缩句扩句，判断句子是否完整。"],
        ["体会作者情感", "从关键词句、标点符号和写作背景入手，思考作者“为什么这样写”，情感常藏在景物描写中。"],
        ["想象类作文", "大胆想象但要合理，围绕一个中心展开情节；可用“假如我是……”“二十年后的……”等思路。"],
        ["小升初古诗文汇总", "重点复习课标推荐 75 首中的名句，注意易错字的书写，如“霜叶红于二月花”的“霜”。"],
        ["必背古诗词《石灰吟》（带拼音）", "明代于谦托物言志的七言绝句，小学必背篇目；逐字注音，先读准字音，再结合注释理解诗意并背诵。", SHICI_EXTRA],
        ["必背古诗文·上下册（带拼音）", "整理自人教版（部编版）语文教材，按教材出现顺序编排；古诗、词、文言文与课文节选全部逐字注音。", cnBeiJiExtra(5)],
      ],
    ],
  },

  math: {
    primary: [
      [
        ["10以内加减法", "用摆小棒、画圆圈帮助理解凑十、破十；熟记“凑十歌”：一九一九好朋友，二八二八手拉手。"],
        ["认识图形", "长方形对边相等，正方形四条边一样长；三角形有三条边三个角；圆没有角。"],
        ["比长短比大小", "比长短要把一端对齐；用一一对应的方法比较多少，理解“>、<、=”的含义。"],
        ["认识钟表", "分针指向12是整时，时针指着几就是几时；每天练习拨钟表建立时间观念。"],
      ],
      [
        ["乘法口诀表", "九九乘法表必须滚瓜烂熟；规律：几的口诀相邻两句相差几，如“三七二十一，四七二十八”。"],
        ["百以内加减法", "笔算加减法相同数位对齐，从个位算起；进位“满十向前一位进一”，退位“退一当十”。"],
        ["认识人民币", "1元=10角，1角=10分；购物问题学会“付的钱−花掉的钱=找回的钱”。"],
        ["角的认识", "角有一个顶点两条边；角的大小与边的长短无关，与两边张开的程度有关；会辨认直角、锐角、钝角。"],
      ],
      [
        ["多位数乘除法", "估算先行确定大致范围；商中间或末尾有 0 的除法容易错，除到哪一位不够商 1 就商 0。"],
        ["分数初步认识", "把一个物体平均分成几份，每份就是它的几分之一；分子相同比分母，分母小的分数大。"],
        ["周长计算", "周长是封闭图形一周的长度；长方形周长=（长+宽）×2，正方形周长=边长×4。"],
        ["年月日与时分秒", "一年 12 个月，大月 31 天，二月平年 28 天闰年 29 天；公历年份是 4 的倍数一般是闰年。"],
      ],
      [
        ["小数的意义", "分母是 10、100、1000 的分数可以用小数表示；0.3 米 = 3/10 米 = 3 分米。"],
        ["平行与垂直", "同一平面内不相交的两条直线互相平行；相交成直角互相垂直；会画垂线和平行线。"],
        ["运算定律", "加法交换律 a+b=b+a，乘法分配律 (a+b)×c=a×c+b×c；简便计算先观察数的特征。"],
        ["平均数问题", "平均数=总数量÷总份数；它反映整体水平，介于最大值与最小值之间。"],
      ],
      [
        ["简易方程", "字母表示数，等式两边同时加减乘除同一个数，等式仍成立；解方程写清“解：”。"],
        ["因数与倍数", "一个数最小的因数是 1，最大的因数是它本身；2、3、5 倍数的特征要牢记。"],
        ["多边形面积", "平行四边形=底×高，三角形=底×高÷2，梯形=(上底+下底)×高÷2；都推导自长方形。"],
        ["长方体正方体", "长方体体积=长×宽×高=底面积×高；表面积是六个面的总面积，注意实际问题的面数。"],
      ],
      [
        ["分数四则运算", "除以一个数等于乘它的倒数；结果化成最简分数；混合运算先乘除后加减。"],
        ["圆的周长与面积", "C=πd=2πr，S=πr²；半圆周长要加上直径，别漏算。"],
        ["百分数应用", "求一个数的百分之几用乘法；已知比一个数多（少）百分之几求数，先找准单位“1”。"],
        ["比例与圆柱圆锥", "圆柱体积=底面积×高；圆锥体积是同底等高圆柱的三分之一；正反比例先判比值或积一定。"],
      ],
    ],
  },

  english: {
    primary: [
      [
        ["26字母表：读音 + 四线三格书写", "认读 26 个字母的大小写与名称音，掌握四线三格书写规范；重点区分易混字母：b/d、p/q、i/l；元音字母 A E I O U 单独记牢。", LETTER_EXTRA],
        ["常见颜色数字", "red/blue/yellow/green；one 到 ten 边指边数；结合身边物品天天说，如 “a red apple”。"],
        ["打招呼用语", "Hello! How are you? — I'm fine, thank you. Nice to meet you! 注意早上用 Good morning。"],
        ["简单单词拼读", "自然拼读法：辅音+元音+辅音结构直接拼，如 c-a-t→cat；先听音再模仿发音。"],
        ["按单元分类单词（外研社·新交际）", "单词整理自外语教学与研究出版社《英语》（新交际）一年级上/下册教材词汇表，每册 Unit 1-6，可对照课本逐单元过关。", unitWordsExtra(1)],
      ],
      [
        ["家庭成员词汇", "father/mother/brother/sister/grandparents；介绍家人句型：This is my father. He is a doctor."],
        ["be动词用法", "我用 am，你用 are，is 跟着他她它；单数 is 复数 are；缩写形式 I'm、you're 要认得。"],
        ["身体部位单词", "head/shoulders/knees/toes 配合儿歌动作记忆；句型：Touch your nose. Clap your hands."],
        ["英文儿歌童谣", "《Ten Little Indians》《Head, Shoulders, Knees and Toes》，在节奏中自然习得词汇和语感。"],
        ["按单元分类单词（外研社·新交际）", "单词整理自外语教学与研究出版社《英语》（新交际）二年级上/下册教材词汇表，每册 Unit 1-6，可对照课本逐单元过关。", unitWordsExtra(2)],
      ],
      [
        ["一般现在时", "表示经常性动作，常与 always/usually/often 连用；第三人称单数动词加 s/es：She likes music."],
        ["可数不可数名词", "可数名词有复数变化；不可数名词 water/rice/milk 不加 a，也没有复数；some 都能修饰。"],
        ["学校生活词汇", "classroom/library/playground + 科目 Chinese/Maths/PE；问答：What's your favourite subject?"],
        ["简单自我介绍", "框架：名字→年龄→班级→爱好→结束语；My name is... I'm ... years old. I like..."],
      ],
      [
        ["现在进行时", "结构 be+v-ing 表示正在发生；v-ing 规则：run 双写 n、make 去 e 加 ing；Look! Listen! 是标志词。"],
        ["方位介词", "in 里面、on 上面、under 下面、behind 后面、between 在两者之间；看图说话练位置关系。"],
        ["食物类词汇", "hamburger/noodles/juice/vegetables；点餐用语：What would you like? — I'd like some noodles."],
        ["there be 句型", "There is + 单数/不可数，There are + 复数；就近原则：There is a book and two pens."],
      ],
      [
        ["一般过去时", "动词过去式：规则加 ed（watched），不规则要背（go→went, eat→ate）；yesterday/last week 是标志。"],
        ["情态动词 can/must", "can 后接动词原形表示能力或许可；must 表必须，否定 mustn't 表禁止。"],
        ["日常活动短语", "get up/have breakfast/go to school/do homework；描述一天作息用一般现在时按时间顺序说。"],
        ["问路指路对话", "Where is the...? Go straight. Turn left/right at... It's next to... 结合地图角色扮演练习。"],
      ],
      [
        ["一般将来时", "be going to + 动词原形表计划打算；will 表将要发生；tomorrow/next year 是标志词。"],
        ["比较级初步", "短词加 er：taller/older；双写：big→bigger；去 y 变 ier：happy→happier；than 引出比较对象。"],
        ["兴趣爱好表达", "I like doing... / My hobby is...；like 后接动名词，如 I like swimming and reading."],
        ["小升初高频词汇", "整理四大类：学习生活、家庭朋友、饮食健康、天气季节；每天 10 词滚动复习加默写。"],
      ],
    ],
  },
};
