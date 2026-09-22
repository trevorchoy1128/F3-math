// 數字系統：位值表、進位計數器、二進制開關、例題、練習
(function () {
  var DEC_NAMES = ["個位", "十位", "百位", "千位", "萬位", "十萬位", "百萬位"];

  function $(id) { return document.getElementById(id); }
  function pow(base, k) { return base + "<sup>" + k + "</sup>"; }
  function sub(str, base) { return str + "<sub>" + base + "</sub>"; }
  function pad(str, len) { while (str.length < len) str = "0" + str; return str; }
  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

  // 把一個數拆成每個數字及其位值（由左至右）
  function columns(str, base) {
    var n = str.length;
    return str.split("").map(function (d, i) {
      var k = n - 1 - i, v = Math.pow(base, k);
      return { d: d, k: k, v: v, prod: Number(d) * v };
    });
  }

  // 位值表（表格）
  function pvTable(str, base) {
    var cols = columns(str, base);
    function row(label, fn) {
      return "<tr><th>" + label + "</th>" + cols.map(fn).join("") + "</tr>";
    }
    var html = '<div class="table-wrap"><table class="t pv">';
    if (base === 10) html += row("位", function (c) { return '<td class="pv-name">' + (DEC_NAMES[c.k] || "") + "</td>"; });
    html += row("位值", function (c) { return "<td>" + pow(base, c.k) + '<br><span class="pv-v">= ' + c.v + "</span></td>"; });
    html += row("數字", function (c) { return '<td class="pv-d' + (c.d === "0" ? " zero" : "") + '">' + c.d + "</td>"; });
    html += row("數字 × 位值", function (c) { return '<td class="' + (c.d === "0" ? "zero" : "") + '">' + c.prod + "</td>"; });
    return html + "</table></div>";
  }

  // 展開式（多行）
  function expanded(str, base) {
    var cols = columns(str, base);
    return '<div class="expand">' +
      "<div>" + sub(str, base) + "</div>" +
      "<div>= " + cols.map(function (c) { return c.d + " × " + pow(base, c.k); }).join(" + ") + "</div>" +
      "<div>= " + cols.map(function (c) { return c.prod; }).join(" + ") + "</div>" +
      "<div>= <strong>" + parseInt(str, base) + "</strong></div></div>";
  }

  /* ---------- ① 位值表 ---------- */
  var pvBase = 2;
  var pvInput = $("pv-input"), pvOut = $("pv-out"), pvErr = $("pv-error");
  var PV_RULE = {
    2:  { re: /^[01]+$/, max: 10, msg: "二進制只可以使用數字 0 和 1，因為滿 2 便要進位。" },
    10: { re: /^[0-9]+$/, max: 4, msg: "十進制只可以使用數字 0 至 9。" },
  };

  function renderPV() {
    var s = pvInput.value.trim();
    var rule = PV_RULE[pvBase];
    if (!s) { pvErr.hidden = true; pvOut.innerHTML = ""; return; }
    if (!rule.re.test(s)) {
      pvErr.textContent = rule.msg; pvErr.hidden = false; pvOut.innerHTML = ""; return;
    }
    pvErr.hidden = true;
    s = s.replace(/^0+(?=\d)/, "");
    pvOut.innerHTML = pvTable(s, pvBase) + expanded(s, pvBase);
  }

  $("pv-base").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var newBase = Number(b.getAttribute("data-base"));
    if (newBase === pvBase) return;
    var s = pvInput.value.trim();
    if (PV_RULE[pvBase].re.test(s)) pvInput.value = parseInt(s, pvBase).toString(newBase);
    pvBase = newBase;
    pvInput.maxLength = PV_RULE[newBase].max;
    this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
    renderPV();
  });
  pvInput.addEventListener("input", renderPV);
  $("pv-random").addEventListener("click", function () {
    var n = pvBase === 2 ? randInt(4, 255) : randInt(10, 9999);
    pvInput.value = n.toString(pvBase);
    renderPV();
  });
  renderPV();

  /* ---------- ② 進位計數器 ---------- */
  var cnt = 0, MAX = 255, timer = null;
  var DEC_LABELS = ["百", "十", "個"], BIN_LABELS = ["128", "64", "32", "16", "8", "4", "2", "1"];

  function cells(str, oldStr, labels) {
    var firstNonZero = str.search(/[1-9]/);
    if (firstNonZero === -1) firstNonZero = str.length - 1;
    return str.split("").map(function (d, i) {
      var cls = "cell";
      if (i < firstNonZero) cls += " lead";
      if (oldStr && oldStr[i] !== d) cls += " changed";
      return '<div class="' + cls + '"><b>' + d + "</b><small>" + labels[i] + "</small></div>";
    }).join("");
  }

  function trailing(str, ch) { var k = 0; for (var i = str.length - 1; i >= 0 && str[i] === ch; i--) k++; return k; }

  function renderCounter(prev) {
    var d = pad(cnt.toString(10), 3), b = pad(cnt.toString(2), 8);
    var pd = prev == null ? null : pad(prev.toString(10), 3);
    var pb = prev == null ? null : pad(prev.toString(2), 8);
    $("odo-dec").innerHTML = cells(d, pd, DEC_LABELS);
    $("odo-bin").innerHTML = cells(b, pb, BIN_LABELS);

    var msg = "";
    if (prev != null && cnt === prev + 1) {
      var dc = trailing(pd, "9"), bc = trailing(pb, "1");
      msg = "<strong>" + prev + " + 1 = " + cnt + "</strong><br>" +
        "十進制：" + (dc ? "逢十進一，進位 " + dc + " 次" : "沒有進位") + "　｜　" +
        "二進制：" + (bc ? "逢二進一，進位 " + bc + " 次" : "沒有進位");
    } else if (prev != null && cnt === prev - 1) {
      msg = "<strong>" + prev + " − 1 = " + cnt + "</strong>";
    } else {
      msg = "由 0 開始，按「+1」試試看。";
    }
    $("counter-msg").innerHTML = msg;
    $("cnt-plus").disabled = cnt >= MAX;
    $("cnt-minus").disabled = cnt <= 0;
  }

  function step(delta) {
    var prev = cnt;
    cnt = Math.max(0, Math.min(MAX, cnt + delta));
    if (cnt !== prev) renderCounter(prev);
    if (cnt >= MAX) stopPlay();
  }
  function stopPlay() { clearInterval(timer); timer = null; $("cnt-play").textContent = "▶ 自動"; }

  $("cnt-plus").addEventListener("click", function () { step(1); });
  $("cnt-minus").addEventListener("click", function () { step(-1); });
  $("cnt-reset").addEventListener("click", function () { stopPlay(); cnt = 0; renderCounter(null); });
  $("cnt-play").addEventListener("click", function () {
    if (timer) { stopPlay(); return; }
    if (cnt >= MAX) { cnt = 0; renderCounter(null); }
    this.textContent = "⏸ 暫停";
    timer = setInterval(function () { step(1); }, 800);
  });
  renderCounter(null);

  /* ---------- ③ 二進制開關 ---------- */
  var bits = [0, 0, 0, 0, 1, 0, 1, 1], target = null;
  var swEl = $("switches");
  swEl.innerHTML = BIN_LABELS.map(function (v, i) {
    return '<button type="button" class="sw" data-i="' + i + '" aria-label="位值 ' + v + '">' +
      '<span class="bulb"></span><span class="sw-bit"></span><span class="sw-val">' + v + "</span></button>";
  }).join("");

  function renderSwitches() {
    swEl.querySelectorAll(".sw").forEach(function (b, i) {
      b.setAttribute("aria-pressed", bits[i] === 1);
      b.querySelector(".sw-bit").textContent = bits[i];
    });
    var on = [], total = 0;
    bits.forEach(function (x, i) { if (x) { on.push(BIN_LABELS[i]); total += Number(BIN_LABELS[i]); } });
    var binStr = bits.join("").replace(/^0+(?=\d)/, "");
    $("sw-out").innerHTML =
      "二進制：<strong>" + sub(binStr, 2) + "</strong><br>" +
      "十進制：" + (on.length > 1 ? on.join(" + ") + " = " : "") + "<strong>" + total + "</strong>";

    var fb = $("sw-feedback");
    if (target == null) { fb.innerHTML = ""; return; }
    if (total === target) {
      fb.innerHTML = '<div class="feedback ok"><strong>做到了！</strong>' + target + " = " + sub(binStr, 2) + "</div>";
    } else {
      fb.innerHTML = '<div class="feedback bad"><strong>目標：' + target + "</strong>現在是 " + total +
        (total < target ? "，還差 " + (target - total) + "。" : "，多了 " + (total - target) + "。") +
        "提示：先開最大而又不超過目標的燈。</div>";
    }
  }

  swEl.addEventListener("click", function (e) {
    var b = e.target.closest(".sw");
    if (!b) return;
    var i = Number(b.getAttribute("data-i"));
    bits[i] = 1 - bits[i];
    renderSwitches();
  });
  $("sw-clear").addEventListener("click", function () { bits = [0, 0, 0, 0, 0, 0, 0, 0]; renderSwitches(); });
  $("sw-challenge").addEventListener("click", function () {
    target = randInt(5, 255);
    bits = [0, 0, 0, 0, 0, 0, 0, 0];
    renderSwitches();
  });
  renderSwitches();

  /* ---------- 例題（逐步顯示） ---------- */
  var EXAMPLES = ["1101", "101010", "1100100"];

  function exampleHTML(str, n) {
    var cols = columns(str, 2);
    var ones = cols.filter(function (c) { return c.d === "1"; }).map(function (c) { return c.v; });
    var total = parseInt(str, 2);
    var steps = [
      "由右至左，寫出每個數字的位值：" + pvTable(str, 2),
      "寫成展開式：<br>" + sub(str, 2) + " = " +
        cols.map(function (c) { return c.d + " × " + pow(2, c.k); }).join(" + "),
      "計算並相加：<br>= " + cols.map(function (c) { return c.prod; }).join(" + ") + " = <strong>" + total + "</strong>" +
        '<div class="callout"><strong>小技巧</strong>只把「1」所在位置的位值相加：' + ones.join(" + ") + " = " + total + "</div>",
    ];
    return '<div class="example" data-step="0">' +
      '<div class="ex-q"><span class="ex-tag">例 ' + n + "</span>把 " + sub(str, 2) + " 轉換為十進制數。</div>" +
      '<ol class="ex-steps">' + steps.map(function (s) { return "<li hidden>" + s + "</li>"; }).join("") + "</ol>" +
      '<p class="ex-ans" hidden>答：' + sub(str, 2) + " = " + total + "</p>" +
      '<div class="row"><button type="button" class="btn primary ex-next">顯示第一步</button>' +
      '<button type="button" class="btn ex-all">顯示全部</button>' +
      '<button type="button" class="btn ex-reset" hidden>重新開始</button></div></div>';
  }

  var exBody = $("examples-body");
  exBody.innerHTML = EXAMPLES.map(function (s, i) { return exampleHTML(s, i + 1); }).join("");

  function showSteps(ex, k) {
    var items = ex.querySelectorAll(".ex-steps li");
    items.forEach(function (li, i) { li.hidden = i >= k; });
    var done = k >= items.length;
    ex.setAttribute("data-step", k);
    ex.querySelector(".ex-ans").hidden = !done;
    ex.querySelector(".ex-next").hidden = done;
    ex.querySelector(".ex-all").hidden = done;
    ex.querySelector(".ex-reset").hidden = k === 0;
    ex.querySelector(".ex-next").textContent = k === 0 ? "顯示第一步" : "下一步";
  }
  exBody.addEventListener("click", function (e) {
    var ex = e.target.closest(".example");
    if (!ex) return;
    var k = Number(ex.getAttribute("data-step"));
    if (e.target.closest(".ex-next")) showSteps(ex, k + 1);
    else if (e.target.closest(".ex-all")) showSteps(ex, 99);
    else if (e.target.closest(".ex-reset")) showSteps(ex, 0);
  });

  /* ---------- 練習 ---------- */
  var qBits = 4, qNum = null, tries = 0, answered = false, right = 0, done = 0;
  var qInput = $("quiz-input"), qFb = $("quiz-feedback");

  function feedback(ok, title, body) {
    qFb.innerHTML = '<div class="feedback ' + (ok ? "ok" : "bad") + '"><strong>' + title + "</strong>" + (body || "") + "</div>";
  }
  function updateScore() { $("quiz-score").textContent = done ? "答對 " + right + " / " + done + " 題" : ""; }

  function newQuestion() {
    var lo = Math.pow(2, qBits - 1), hi = Math.pow(2, qBits) - 1, n;
    do { n = randInt(lo, hi); } while (n === qNum);
    qNum = n; tries = 0; answered = false;
    $("quiz-q").innerHTML = "把 <strong>" + sub(n.toString(2), 2) + "</strong> 轉換為十進制數。";
    qInput.value = ""; qFb.innerHTML = "";
    $("quiz-check").disabled = false; $("quiz-show").disabled = false;
  }

  function finish(correct) {
    answered = true; done++;
    if (correct) right++;
    $("quiz-check").disabled = true; $("quiz-show").disabled = true;
    updateScore();
  }

  function check() {
    if (answered) { newQuestion(); qInput.focus(); return; }
    var v = qInput.value.trim();
    if (!/^\d+$/.test(v)) { feedback(false, "請輸入一個整數。"); return; }
    tries++;
    var sol = expanded(qNum.toString(2), 2);
    if (Number(v) === qNum) {
      feedback(true, tries === 1 ? "正確！" : "正確！第二次就做到了。", sol);
      finish(true);
    } else if (tries === 1) {
      feedback(false, "未正確，再試一次。", "提示：由右至左寫出位值 1、2、4、8……，再把「1」所在位置的位值相加。");
    } else {
      feedback(false, "答案是 " + qNum + "。", sol);
      finish(false);
    }
  }

  $("quiz-check").addEventListener("click", check);
  qInput.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
  $("quiz-show").addEventListener("click", function () {
    feedback(false, "答案是 " + qNum + "。", expanded(qNum.toString(2), 2));
    finish(false);
  });
  $("quiz-next").addEventListener("click", newQuestion);
  $("quiz-level").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    qBits = Number(b.getAttribute("data-bits"));
    this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
    newQuestion();
  });
  newQuestion();
})();
