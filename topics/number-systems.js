// 數字系統：點數咭、位值表、進位計數器、糖果包裝工廠
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

  /* ---------- ② 位值表 ---------- */
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

  /* ---------- ③ 進位計數器 ---------- */
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

  /* ---------- ① 點數咭 ---------- */
  var CARD_VALUES = [16, 8, 4, 2, 1];
  var DOT_COLS = { 16: 4, 8: 4, 4: 2, 2: 2, 1: 1 };
  var READ = { "0": "零", "1": "一" };
  var cardBits = [1, 0, 1, 0, 1], dotsTarget = null;
  var cardsEl = $("cards");

  cardsEl.innerHTML = CARD_VALUES.map(function (v, i) {
    var dots = new Array(v + 1).join("<i></i>");
    return '<button type="button" class="dcard" data-i="' + i + '" aria-label="' + v + ' 點咭">' +
      '<span class="face"><span class="dots" style="grid-template-columns:repeat(' + DOT_COLS[v] + ',auto)">' + dots + "</span></span>" +
      '<span class="bit"></span><span class="val">' + v + " 點</span></button>";
  }).join("");

  function renderCards() {
    cardsEl.querySelectorAll(".dcard").forEach(function (b, i) {
      b.setAttribute("aria-pressed", cardBits[i] === 1);
      b.querySelector(".bit").textContent = cardBits[i];
    });
    var on = [], total = 0;
    cardBits.forEach(function (x, i) { if (x) { on.push(CARD_VALUES[i]); total += CARD_VALUES[i]; } });
    var binStr = cardBits.join("").replace(/^0+(?=\d)/, "");
    var reading = "二進制數" + binStr.split("").map(function (d) { return READ[d]; }).join("");

    // 數量、寫法、讀法三者並列
    $("triad").innerHTML =
      "<div><small>數量</small><b>" + total + " 粒點</b><span>" + (on.length ? on.join(" + ") : "沒有點") + "</span></div>" +
      "<div><small>寫法</small><b>" + sub(binStr, 2) + "</b></div>" +
      "<div><small>讀法</small><b>" + reading + "</b></div>";

    var fb = $("dots-feedback");
    if (dotsTarget == null) { fb.innerHTML = ""; return; }
    if (total === dotsTarget) {
      fb.innerHTML = '<div class="feedback ok"><strong>做到了！</strong>' + dotsTarget + " 粒點 = " + sub(binStr, 2) + "</div>";
    } else {
      fb.innerHTML = '<div class="feedback bad"><strong>目標：' + dotsTarget + " 粒點</strong>現在是 " + total +
        (total < dotsTarget ? " 粒，還差 " + (dotsTarget - total) + " 粒。" : " 粒，多了 " + (total - dotsTarget) + " 粒。") +
        "提示：先翻開最大而又不超過目標的咭。</div>";
    }
  }

  cardsEl.addEventListener("click", function (e) {
    var b = e.target.closest(".dcard");
    if (!b) return;
    var i = Number(b.getAttribute("data-i")), v = CARD_VALUES[i];
    cardBits[i] = 1 - cardBits[i];
    $("last-flip").innerHTML = cardBits[i]
      ? "翻開 " + v + " 點咭：這個位的 <strong>1</strong> 代表 <strong>" + v + " 粒點</strong>。"
      : "蓋上 " + v + " 點咭：這個位變成 <strong>0</strong>，少了 " + v + " 粒點。";
    renderCards();
  });
  $("dots-clear").addEventListener("click", function () {
    cardBits = [0, 0, 0, 0, 0]; $("last-flip").innerHTML = ""; renderCards();
  });
  $("dots-challenge").addEventListener("click", function () {
    dotsTarget = randInt(3, 31);
    cardBits = [0, 0, 0, 0, 0]; $("last-flip").innerHTML = "";
    renderCards();
  });
  renderCards();

  /* ---------- ④ 糖果包裝工廠 ---------- */
  var LEVELS = [
    { name: "粒", v: 1, unit: "粒" }, { name: "袋", v: 2, unit: "袋" }, { name: "盒", v: 4, unit: "盒" },
    { name: "箱", v: 8, unit: "箱" }, { name: "大箱", v: 16, unit: "大箱" },
  ];
  var packCounts, packStage, packN;
  var packInput = $("pack-n");

  function renderFactory(active) {
    // 由左至右：大箱 → 粒，與位值表的次序一致
    var html = "";
    for (var k = LEVELS.length - 1; k >= 0; k--) {
      var L = LEVELS[k], toks = "";
      for (var j = 0; j < packCounts[k]; j++) toks += '<span class="tok t' + k + '">' + (k ? L.v : "") + "</span>";
      html += '<div class="bin' + (active && active.indexOf(k) !== -1 ? " active" : "") + '">' +
        '<div class="bin-head">' + L.name + "<small>每個 " + L.v + " 粒</small></div>" +
        '<div class="bin-body">' + toks + "</div>" +
        '<div class="bin-foot">' + packCounts[k] + "</div></div>";
    }
    $("factory-bins").innerHTML = html;
  }

  function resetFactory() {
    packN = Math.max(1, Math.min(31, Math.round(Number(packInput.value)) || 1));
    packInput.value = packN;
    packCounts = [packN, 0, 0, 0, 0];
    packStage = 0;
    $("pack-step").disabled = false;
    $("pack-msg").innerHTML = "現在有 " + packN + " 粒散裝糖果。按「包裝下一步」開始。";
    renderFactory();
  }

  $("pack-step").addEventListener("click", function () {
    var k = packStage, from = LEVELS[k], to = LEVELS[k + 1];
    var had = packCounts[k], made = Math.floor(had / 2);
    packCounts[k + 1] += made;
    packCounts[k] = had % 2;
    packStage++;
    var msg = "每 2 " + from.unit + "包成 1 " + to.unit + "：" + had + " " + from.unit + " → " + made + " " + to.unit +
      "，剩下 " + packCounts[k] + " " + from.unit + "。";
    if (made === 0) msg = "只有 " + had + " " + from.unit + "，不足 2 " + from.unit + "，不用包裝。";

    if (packStage === LEVELS.length - 1) {
      var digits = packCounts.slice().reverse().join("").replace(/^0+(?=\d)/, "");
      var parts = [];
      for (var i = LEVELS.length - 1; i >= 0; i--) if (packCounts[i]) parts.push(LEVELS[i].v);
      msg += "<br><strong>包裝完成！</strong>每種包裝最多只有 1 個。由左至右寫下數量，就是 <strong>" + sub(digits, 2) +
        "</strong>。驗算：" + parts.join(" + ") + " = " + packN + " 粒。";
      $("pack-step").disabled = true;
    }
    $("pack-msg").innerHTML = msg;
    renderFactory([k, k + 1]);
  });
  $("pack-reset").addEventListener("click", resetFactory);
  packInput.addEventListener("change", resetFactory);
  resetFactory();
})();