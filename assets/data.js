// 全站課題資料：新增或修改課題只需改這裏，主頁及課題頁會自動更新。
// status: "planned" = 籌備中, "draft" = 製作中, "ready" = 已完成
window.SITE = {
  title: "中三數學學習站",
  subtitle: "Form 3 Mathematics",
};

window.STRANDS = [
  { id: "na",  name: "數與代數",           en: "Number & Algebra" },
  { id: "mss", name: "度量、圖形與空間",   en: "Measures, Shape & Space" },
  { id: "dh",  name: "數據處理",           en: "Data Handling" },
];

window.TOPICS = [
  {
    id: "number-systems", strand: "na", status: "draft",
    zh: "數字系統", en: "Number Systems",
    desc: "位值、十進制與二進制、把二進制數轉換為十進制數",
    keywords: ["二進制", "十進制", "位值", "進位", "展開式", "binary", "decimal", "place value", "base"],
  },
  {
    id: "indices", strand: "na", status: "planned",
    zh: "指數定律", en: "Laws of Integral Indices",
    desc: "零指數、負整數指數、指數定律",
    keywords: ["指數", "冪", "index", "power"],
  },
  {
    id: "scientific-notation", strand: "na", status: "draft",
    zh: "科學記數法", en: "Scientific Notation",
    desc: "以 a × 10ⁿ 表示很大或很小的數",
    keywords: ["科學記數法", "標準式", "10 的乘冪", "小數點", "scientific notation", "standard form", "power of 10"],
  },
  {
    id: "factorization", strand: "na", status: "planned",
    zh: "多項式的因式分解", en: "Factorization of Polynomials",
    desc: "抽公因式、利用恆等式、十字相乘法",
    keywords: ["因式分解", "多項式", "恆等式", "十字相乘", "factorize", "polynomial", "identity"],
  },
  {
    id: "inequalities", strand: "na", status: "planned",
    zh: "一元一次不等式", en: "Linear Inequalities in One Unknown",
    desc: "不等式的性質、解不等式、在數線上表示解",
    keywords: ["不等式", "數線", "inequality", "number line"],
  },
  {
    id: "percentages", strand: "na", status: "planned",
    zh: "百分法的進一步應用", en: "More about Percentages",
    desc: "複利息、增長與折舊、連續百分變化",
    keywords: ["百分", "複利息", "增長", "折舊", "percentage", "compound interest", "growth", "depreciation"],
  },
  {
    id: "mensuration", strand: "mss", status: "planned",
    zh: "立體的面積與體積", en: "Areas and Volumes of Solids",
    desc: "角錐、圓錐、球體的表面面積及體積",
    keywords: ["體積", "面積", "角錐", "圓錐", "球體", "volume", "surface area", "pyramid", "cone", "sphere"],
  },
  {
    id: "similarity", strand: "mss", status: "planned",
    zh: "相似三角形", en: "Similar Triangles",
    desc: "相似的條件、對應邊的比",
    keywords: ["相似", "比例", "similar", "ratio"],
  },
  {
    id: "trigonometry", strand: "mss", status: "planned",
    zh: "三角比", en: "Trigonometric Ratios",
    desc: "正弦、餘弦、正切；仰角與俯角",
    keywords: ["三角", "sin", "cos", "tan", "仰角", "俯角", "trigonometry"],
  },
  {
    id: "quadrilaterals", strand: "mss", status: "planned",
    zh: "四邊形的性質", en: "Properties of Quadrilaterals",
    desc: "平行四邊形、中點定理、截線定理",
    keywords: ["四邊形", "平行四邊形", "中點定理", "截線定理", "quadrilateral", "parallelogram", "mid-point theorem"],
  },
  {
    id: "centres", strand: "mss", status: "planned",
    zh: "三角形的心", en: "Centres of Triangles",
    desc: "內心、外心、形心、垂心",
    keywords: ["內心", "外心", "形心", "垂心", "incentre", "circumcentre", "centroid", "orthocentre"],
  },
  {
    id: "coordinate", strand: "mss", status: "planned",
    zh: "直線的坐標幾何", en: "Coordinate Geometry of Straight Lines",
    desc: "距離公式、斜率、中點及內分點",
    keywords: ["坐標", "斜率", "距離", "中點", "內分點", "coordinate", "slope", "distance", "mid-point"],
  },
  {
    id: "probability", strand: "dh", status: "planned",
    zh: "概率初步", en: "Introduction to Probability",
    desc: "理論概率、實驗概率、列出所有可能結果",
    keywords: ["概率", "機會", "實驗", "probability", "chance"],
  },
  {
    id: "central-tendency", strand: "dh", status: "planned",
    zh: "集中趨勢的量度", en: "Measures of Central Tendency",
    desc: "平均數、中位數、眾數、加權平均數",
    keywords: ["平均數", "中位數", "眾數", "加權", "mean", "median", "mode", "average"],
  },
];

window.STATUS_LABEL = { planned: "籌備中", draft: "製作中", ready: "已完成" };
