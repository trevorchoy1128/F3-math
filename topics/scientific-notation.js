// 科學記數法：10 的乘冪、移動小數點、是不是科學記數法、大與小的世界
// 所有數都以字串處理，避免浮點數誤差（例如 0.1 + 0.2）
(function () {
  function $(id) { return document.getElementById(id); }
  function exp(n) { return "<sup>" + (n < 0 ? "−" + (-n) : n) + "</sup>"; }
  function sci(a, n) { return a + " × 10" + exp(n); }
  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function repeat(ch, k) { return new Array(k + 1).join(ch); }

  // 每三位加一個窄空格：45000000 → 45 000 000；0.0000075 → 0.000 007 5
  var GAP = " ";
  function group(str) {
    var parts = str.split(".");
    var i = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, GAP);
    return parts[1] ? i + "." + parts[1].replace(/(\d{3})(?=\d)/g, "$1" + GAP) : i;
  }

  // 把一般寫法的數拆成數字串 digits 及小數點位置 p（小數點前有 p 個數字）
  function parse(str) {
    var m = /^(\d+)(?:\.(\d+))?$/.exec(str);
    if (!m) return null;
    var ip = m[1].replace(/^0+(?=\d)/, ""), fp = m[2] || "";
    if (!/[1-9]/.test(ip + fp)) return null;
    return { digits: ip + fp, p: ip.length };
  }

  // 小數點放在第 p 位時，得出的數（去掉多餘的 0）
  function numberAt(digits, p) {
    var ip = digits.slice(0, p).replace(/^0+/, "") || "0";
    var fp = digits.slice(p).replace(/0+$/, "");
    return fp ? ip + "." + fp : ip;
  }

  // 一般寫法 → 科學記數法 { a, n }
  function toSci(str) {
    var d = parse(str), f = d.digits.search(/[1-9]/);
    return { a: numberAt(d.digits, f + 1), n: d.p - (f + 1) };
  }

  /* ---------- ① 10 的乘冪 ---------- */
  var NAMES = {
    "-8": "億分之一", "-7": "千萬分之一", "-6": "百萬分之一", "-5": "十萬分之一", "-4": "萬分之一",
    "-3": "千分之一", "-2": "百分之一", "-1": "十分之一", "0": "一", "1": "十", "2": "百", "3": "千",
    "4": "萬", "5": "十萬", "6": "百萬", "7": "千萬", "8": "億", "9": "十億", "10": "百億",
  };
  var NAMES_EN = {
    "-8": "one hundred-millionth", "-7": "one ten-millionth", "-6": "one millionth", "-5": "one hundred-thousandth",
    "-4": "one ten-thousandth", "-3": "one thousandth", "-2": "one hundredth", "-1": "one tenth", "0": "one",
    "1": "ten", "2": "one hundred", "3": "one thousand", "4": "ten thousand", "5": "one hundred thousand",
    "6": "one million", "7": "ten million", "8": "one hundred million", "9": "one billion", "10": "ten billion",
  };
  function ordinal(k) { return k + (k === 1 ? "st" : k === 2 ? "nd" : k === 3 ? "rd" : "th"); }
  var pwRange = $("pw-range");

  function renderPower() {
    var n = Number(pwRange.value), plain, rule;
    if (n > 0) {
      plain = "1" + repeat("0", n);
      rule = repeat("10 × ", n - 1) + "10" + L("（" + n + " 個 10 相乘）<br>1 後面有 <strong>" + n + " 個 0</strong>。",
        " (" + n + (n === 1 ? " ten" : " tens multiplied together") + ")<br>There " + (n === 1 ? "is <strong>1 zero</strong>" : "are <strong>" + n + " zeros</strong>") + " after the 1.");
    } else if (n === 0) {
      plain = "1";
      rule = L("任何非零數的 0 次方都等於 1。", "Any non-zero number to the power 0 equals 1.");
    } else {
      plain = "0." + repeat("0", -n - 1) + "1";
      rule = "1" + repeat(" ÷ 10", -n) + L("（除以 " + (-n) + " 次 10）<br>1 在小數點後<strong>第 " + (-n) + " 位</strong>。",
        " (divided by 10 " + (-n === 1 ? "once" : (-n) + " times") + ")<br>The 1 is in the <strong>" + ordinal(-n) + " decimal place</strong>.");
    }
    // 突出顯示數中的 1
    var grouped = group(plain), k = grouped.indexOf("1");
    var num = grouped.slice(0, k) + '<span class="one">1</span>' + grouped.slice(k + 1);

    $("pw-eq").innerHTML = "10" + exp(n) + " = " + num;
    $("pw-name").textContent = L("即「" + NAMES[n] + "」", "i.e. " + NAMES_EN[n]);
    $("pw-rule").innerHTML = rule;
    $("pw-minus").disabled = n <= Number(pwRange.min);
    $("pw-plus").disabled = n >= Number(pwRange.max);
  }
  pwRange.addEventListener("input", renderPower);
  $("pw-minus").addEventListener("click", function () { pwRange.value = Number(pwRange.value) - 1; renderPower(); });
  $("pw-plus").addEventListener("click", function () { pwRange.value = Number(pwRange.value) + 1; renderPower(); });
  renderPower();

  /* ---------- ② 移動小數點 ---------- */
  var PRESETS = ["45000000", "380000", "7500000000", "0.00032", "0.0000075", "0.052"];
  var mv = null; // { src, digits, p0, p }

  $("presets").innerHTML = PRESETS.map(function (s) {
    return '<button type="button" class="chip" data-v="' + s + '">' + group(s) + "</button>";
  }).join("");

  function load(str) {
    var d = parse(str);
    if (!d || d.digits.length > 15) return false;
    var digits = d.digits, p0 = d.p;
    // 前面補一個 0，讓小數點可以移到最左（例如 0.45 × 10⁸）
    if (digits[0] !== "0") { digits = "0" + digits; p0++; }
    mv = { src: numberAt(digits, p0), digits: digits, p0: p0, p: p0 };
    renderMover();
    return true;
  }

  function renderMover() {
    var digits = mv.digits, p = mv.p, n = mv.p0 - p;
    var f = digits.search(/[1-9]/), l = digits.length - 1 - digits.split("").reverse().join("").search(/[1-9]/);
    var html = "";
    for (var i = 0; i < digits.length; i++) {
      if (i === p) html += '<span class="pt" aria-hidden="true"></span>';
      // 寫出 a 時會被省去的 0 變淡
      var dim = (i < p && i < f && !(i === p - 1 && p <= f)) || (i >= p && i > l);
      html += '<span class="dg' + (dim ? " dim" : "") + '">' + digits[i] + "</span>";
    }
    if (p === digits.length) html += '<span class="pt" aria-hidden="true"></span>';
    html += '<span class="times">× 10' + exp(n) + "</span>";
    $("mv-digits").innerHTML = html;

    var a = numberAt(digits, p);
    var ip = a.split(".")[0];
    var ok = ip.length === 1 && ip !== "0";
    function places(k) { return k + (k === 1 ? " place" : " places"); }
    $("mv-moves").textContent = n > 0 ? L("小數點向左移了 " + n + " 位 → 指數是 " + n, "Decimal point moved " + places(n) + " to the left → index is " + n)
      : n < 0 ? L("小數點向右移了 " + (-n) + " 位 → 指數是 −" + (-n), "Decimal point moved " + places(-n) + " to the right → index is −" + (-n))
      : L("小數點還未移動", "The decimal point has not moved yet");
    $("mv-status").innerHTML = ok
      ? '<span class="ok">✓ a = ' + a + L("，1 ≤ a &lt; 10，這就是科學記數法！", " and 1 ≤ a &lt; 10 — this is scientific notation!") + "</span>"
      : Number(ip) >= 10
        ? '<span class="no">a = ' + group(a) + L(" 大於或等於 10 → 小數點要向左移", " is 10 or more → move the decimal point to the left") + "</span>"
        : '<span class="no">a = ' + group(a) + L(" 小於 1 → 小數點要向右移", " is less than 1 → move the decimal point to the right") + "</span>";
    $("mv-eq").innerHTML = group(mv.src) + " = " + (ok ? "<strong>" + sci(a, n) + "</strong>" : sci(group(a), n));
    $("mv-left").disabled = p <= 0;
    $("mv-right").disabled = p >= digits.length;
  }

  function useInput() {
    var s = $("mv-input").value.replace(/[\s, ]/g, "");
    var ok = load(s);
    $("mv-error").hidden = ok;
    if (!ok) $("mv-error").textContent = L("請輸入一個正數，例如 2500000 或 0.0036（最多 15 個數字）。", "Please enter a positive number, e.g. 2500000 or 0.0036 (at most 15 digits).");
  }

  function randomNumber() {
    var ds = String(randInt(1, 9)) + (Math.random() < 0.6 ? String(randInt(1, 9)) : "");
    var n = randInt(0, 1) ? randInt(3, 9) : -randInt(2, 7);
    if (n >= ds.length - 1) return ds + repeat("0", n - ds.length + 1);
    if (n >= 0) return ds.slice(0, n + 1) + "." + ds.slice(n + 1);
    return "0." + repeat("0", -n - 1) + ds;
  }

  $("presets").addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    $("mv-error").hidden = true;
    load(b.getAttribute("data-v"));
  });
  $("mv-use").addEventListener("click", useInput);
  $("mv-input").addEventListener("keydown", function (e) { if (e.key === "Enter") useInput(); });
  $("mv-random").addEventListener("click", function () { $("mv-error").hidden = true; load(randomNumber()); });
  $("mv-left").addEventListener("click", function () { mv.p--; renderMover(); });
  $("mv-right").addEventListener("click", function () { mv.p++; renderMover(); });
  $("mv-reset").addEventListener("click", function () { mv.p = mv.p0; renderMover(); });
  load(PRESETS[0]);

  /* ---------- ③ 是不是科學記數法？ ---------- */
  var JUDGE = [
    { a: "4.5", n: 7, ok: true, why: L("a = 4.5，1 ≤ a &lt; 10，n 是整數。", "a = 4.5, 1 ≤ a &lt; 10, and n is an integer.") },
    { a: "45", n: 6, ok: false, why: L("a = 45 大於 10。正確寫法：", "a = 45 is greater than 10. Correct form: ") + sci("4.5", 7) },
    { a: "3.2", n: -4, ok: true, why: L("a = 3.2 在 1 與 10 之間；指數可以是負整數。", "a = 3.2 is between 1 and 10; the index can be a negative integer.") },
    { a: "10", n: 4, ok: false, why: L("a 必須小於 10，不可以等於 10。正確寫法：", "a must be less than 10; it cannot equal 10. Correct form: ") + sci("1", 5) },
    { a: "1", n: 5, ok: true, why: L("a = 1 也可以，因為要求是 1 ≤ a。", "a = 1 is allowed, because the condition is 1 ≤ a.") },
    { a: "0.45", n: 8, ok: false, why: L("a = 0.45 小於 1。正確寫法：", "a = 0.45 is less than 1. Correct form: ") + sci("4.5", 7) },
    { a: "7.5", n: 6, base: 5, ok: false, why: L("底數必須是 10，不可以是 5。", "The base must be 10, not 5.") },
    { a: "32", n: -5, ok: false, why: L("a = 32 大於 10。正確寫法：", "a = 32 is greater than 10. Correct form: ") + sci("3.2", -4) },
    { a: "9.99", n: -2, ok: true, why: L("a = 9.99 小於 10，符合要求。", "a = 9.99 is less than 10, so it meets the condition.") },
  ];
  var judgeRight = 0, judgeDone = 0;

  function renderJudge() {
    judgeRight = 0; judgeDone = 0;
    $("judge-grid").innerHTML = JUDGE.map(function (q, i) {
      return '<div class="jcard" data-i="' + i + '">' +
        '<div class="expr">' + q.a + " × " + (q.base || 10) + exp(q.n) + "</div>" +
        '<div class="row"><button type="button" class="btn" data-ans="1">✓ ' + L("是", "Yes") + "</button>" +
        '<button type="button" class="btn" data-ans="0">✗ ' + L("不是", "No") + "</button></div>" +
        '<div class="why"></div></div>';
    }).join("");
    updateJudgeScore();
  }
  function updateJudgeScore() {
    $("judge-score").textContent = judgeDone ? L("答對 " + judgeRight + " / " + judgeDone + "（共 " + JUDGE.length + " 張）", judgeRight + " / " + judgeDone + " correct (" + JUDGE.length + " cards)") : L("共 " + JUDGE.length + " 張", JUDGE.length + " cards");
  }
  $("judge-grid").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-ans]");
    if (!b) return;
    var card = b.closest(".jcard"), q = JUDGE[Number(card.getAttribute("data-i"))];
    var right = (b.getAttribute("data-ans") === "1") === q.ok;
    judgeDone++; if (right) judgeRight++;
    card.classList.add("done", right ? "right" : "wrong");
    card.querySelector(".why").innerHTML = "<strong>" + (right ? L("答對了！", "Correct! ") : L("再想想：", "Think again: ")) + "</strong>" +
      (q.ok ? L("這是科學記數法。", "This is scientific notation. ") : L("這不是科學記數法。", "This is not scientific notation. ")) + q.why;
    updateJudgeScore();
  });
  $("judge-reset").addEventListener("click", renderJudge);
  renderJudge();

  /* ---------- ④ 大與小的世界 ---------- */
  var FACTS_BIG = [
    [L("全球人口", "World population"), "8000000000", L("人", "people")],
    [L("光每秒行走的距離", "Distance light travels in one second"), "300000000", "m"],
    [L("地球與太陽的平均距離", "Average distance between the Earth and the Sun"), "150000000", "km"],
    [L("香港人口", "Population of Hong Kong"), "7500000", L("人", "people")],
    [L("地球的半徑", "Radius of the Earth"), "6400000", "m"],
  ];
  var FACTS_SMALL = [
    [L("一張紙的厚度", "Thickness of a sheet of paper"), "0.0001", "m"],
    [L("頭髮的直徑", "Diameter of a hair"), "0.00008", "m"],
    [L("紅血球的直徑", "Diameter of a red blood cell"), "0.0000075", "m"],
    [L("細菌的長度", "Length of a bacterium"), "0.000002", "m"],
    [L("病毒的直徑", "Diameter of a virus"), "0.0000001", "m"],
  ];

  function factCards(list) {
    return list.map(function (f) {
      return '<button type="button" class="fact" aria-pressed="false" data-v="' + f[1] + '" data-u="' + f[2] + '">' +
        '<div class="what">' + f[0] + L("（約）", " (approx.)") + "</div><div class=\"num\"></div><div class=\"tag2\"></div></button>";
    }).join("");
  }
  $("facts-big").innerHTML = factCards(FACTS_BIG);
  $("facts-small").innerHTML = factCards(FACTS_SMALL);

  function renderFact(card) {
    var v = card.getAttribute("data-v"), u = card.getAttribute("data-u");
    var on = card.getAttribute("aria-pressed") === "true", s = toSci(v);
    card.querySelector(".num").innerHTML = (on ? sci(s.a, s.n) : group(v)) + " " + u;
    card.querySelector(".tag2").textContent = on ? L("按一下看一般寫法", "Click to show the ordinary form") : L("按一下轉為科學記數法", "Click to show in scientific notation");
  }
  function allFacts() { return Array.prototype.slice.call(document.querySelectorAll(".fact")); }
  allFacts().forEach(renderFact);

  document.querySelector(".world").addEventListener("click", function (e) {
    var card = e.target.closest(".fact");
    if (!card) return;
    card.setAttribute("aria-pressed", card.getAttribute("aria-pressed") !== "true");
    renderFact(card);
  });
  $("world-all").addEventListener("click", function () {
    var toSciAll = allFacts().some(function (c) { return c.getAttribute("aria-pressed") !== "true"; });
    allFacts().forEach(function (c) { c.setAttribute("aria-pressed", toSciAll); renderFact(c); });
    this.textContent = toSciAll ? L("全部轉回一般寫法", "Show all in ordinary form") : L("全部轉為科學記數法", "Show all in scientific notation");
  });
})();
