// 百分法的進一步應用：連續百分變化、單利息 vs 複利息、分期複利、增長與折舊
(function () {
  function $(id) { return document.getElementById(id); }
  function sup(n) { return "<sup>" + n + "</sup>"; }

  // 數字格式：每三位加窄空格
  var GAP = " ";
  function group(str) {
    var parts = str.split(".");
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, GAP) + (parts[1] ? "." + parts[1] : "");
  }
  function num(v, dp) { // 最多 dp 位小數，去掉多餘的 0
    var s = (Math.round(v * Math.pow(10, dp)) / Math.pow(10, dp)).toFixed(dp);
    if (s.indexOf(".") !== -1) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return group(s === "-0" ? "0" : s);
  }
  function money(v) { return "$" + group(v.toFixed(2)); }
  function moneyTick(v) { return "$" + group(String(Math.round(v))); }
  function pct(r) { return num(r, 4) + "%"; }

  // 通用：滑桿旁顯示數值
  function bindRange(id, onChange) {
    var el = $(id), out = $(id + "-out");
    function sync() { out.textContent = el.value; onChange(); }
    el.addEventListener("input", sync);
    out.textContent = el.value;
    return el;
  }
  function bindSeg(id, attr, onPick) {
    $(id).addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      onPick(b.getAttribute(attr));
    });
  }
  function setSeg(id, attr, value) {
    $(id).querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute(attr) === String(value)); });
  }

  /* ---------- ① 連續百分變化 ---------- */
  var SUCC_PRESETS = [
    { label: "+20% → −20%", steps: [[1, 20], [-1, 20]] },
    { label: "−20% → +20%", steps: [[-1, 20], [1, 20]] },
    { label: "+10% → +10%", steps: [[1, 10], [1, 10]] },
    { label: "+50% → −50%", steps: [[1, 50], [-1, 50]] },
  ];
  var succ = SUCC_PRESETS[0].steps.map(function (s) { return { s: s[0], r: s[1] }; });

  $("succ-presets").innerHTML = SUCC_PRESETS.map(function (p, i) {
    return '<button type="button" class="chip" data-i="' + i + '">' + p.label + "</button>";
  }).join("");

  function renderSuccRows() {
    $("succ-steps").innerHTML = succ.map(function (st, i) {
      return '<div class="step-row" data-i="' + i + '"><span class="lbl">第 ' + (i + 1) + " 次</span>" +
        '<div class="seg"><button type="button" data-s="1" aria-pressed="' + (st.s === 1) + '">增加</button>' +
        '<button type="button" data-s="-1" aria-pressed="' + (st.s === -1) + '">減少</button></div>' +
        '<input class="field sm" type="number" min="0" max="100" value="' + st.r + '" aria-label="第 ' + (i + 1) + ' 次百分率"> %' +
        (succ.length > 1 ? '<button type="button" class="x" aria-label="刪除第 ' + (i + 1) + ' 次">×</button>' : "") + "</div>";
    }).join("");
    $("succ-add").disabled = succ.length >= 4;
    renderSucc();
  }

  function renderSucc() {
    var start = Math.max(1, Number($("succ-start").value) || 100);
    var vals = [start], lines = [], m = 1;
    succ.forEach(function (st, i) {
      var f = 1 + st.s * st.r / 100, next = vals[i] * f;
      lines.push("第 " + (i + 1) + " 次：" + num(vals[i], 4) + " × (1 " + (st.s > 0 ? "+" : "−") + " " + st.r + "%) = " + num(next, 4));
      vals.push(next); m *= f;
    });
    var end = vals[vals.length - 1], change = (m - 1) * 100;
    lines.push("整體：" + num(start, 4) + " × " + succ.map(function (st) { return num(1 + st.s * st.r / 100, 4); }).join(" × ") +
      " = " + num(start, 4) + " × " + num(m, 6) + " = <strong>" + num(end, 4) + "</strong>");
    $("succ-calc").innerHTML = lines.join("<br>");

    var same = Math.abs(change) < 1e-9;
    var msg = same ? "最後剛好回到原值。"
      : "最後是 " + num(end, 4) + "，比原值" + (change > 0 ? "多" : "少") + " <strong>" + num(Math.abs(change), 4) + "%</strong>。";
    // 同一百分率先加後減（或先減後加）：解釋為何不能抵消
    if (succ.length === 2 && succ[0].r === succ[1].r && succ[0].s !== succ[1].s && succ[0].r > 0) {
      msg += "<br>兩次都是 " + succ[0].r + "%，但第二次的 " + succ[0].r + "% 是按 " + num(vals[1], 4) +
        " 計算，不是按原值 " + num(start, 4) + " 計算，所以不能互相抵消。";
    }
    $("succ-result").innerHTML = msg;
    $("succ-result").className = "result" + (same ? "" : " bad");

    barChart($("succ-chart"), {
      labels: vals.map(function (v, i) { return i ? "第 " + i + " 次後" : "原值"; }),
      series: [{ name: "數值", color: "var(--s1)", values: vals }],
      fmt: function (v) { return num(v, 4); },
      refs: [{ value: start, label: "原值 " + num(start, 4) }],
      height: 220, padL: 44, ariaLabel: "每次變化後的數值",
    });
  }

  $("succ-presets").addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    succ = SUCC_PRESETS[Number(b.getAttribute("data-i"))].steps.map(function (s) { return { s: s[0], r: s[1] }; });
    renderSuccRows();
  });
  $("succ-steps").addEventListener("click", function (e) {
    var row = e.target.closest(".step-row");
    if (!row) return;
    var i = Number(row.getAttribute("data-i")), b = e.target.closest("button");
    if (!b) return;
    if (b.classList.contains("x")) succ.splice(i, 1);
    else if (b.hasAttribute("data-s")) succ[i].s = Number(b.getAttribute("data-s"));
    renderSuccRows();
  });
  $("succ-steps").addEventListener("input", function (e) {
    var row = e.target.closest(".step-row");
    succ[Number(row.getAttribute("data-i"))].r = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    renderSucc();
  });
  $("succ-start").addEventListener("input", renderSucc);
  $("succ-add").addEventListener("click", function () { succ.push({ s: 1, r: 10 }); renderSuccRows(); });
  $("succ-swap").addEventListener("click", function () { succ.reverse(); renderSuccRows(); });
  renderSuccRows();

  /* ---------- ② 單利息 vs 複利息 ---------- */
  var intYear = 1;
  function intData() {
    var P = Math.max(1, Number($("int-p").value) || 10000), r = Number($("int-r").value), n = Number($("int-n").value);
    var simple = [], comp = [];
    for (var t = 0; t <= n; t++) { simple.push(P * (1 + r * t / 100)); comp.push(P * Math.pow(1 + r / 100, t)); }
    return { P: P, r: r, n: n, simple: simple, comp: comp };
  }

  function renderInterest() {
    var d = intData();
    intYear = Math.min(intYear, d.n);
    barChart($("int-chart"), {
      labels: d.simple.map(function (v, t) { return String(t); }),
      series: [
        { name: "單利息", color: "var(--s1)", values: d.simple },
        { name: "複利息", color: "var(--s2)", values: d.comp },
      ],
      fmt: money, tickFmt: moneyTick, padL: 66, selected: intYear,
      tipTitle: function (t) { return t ? "第 " + t + " 年後" : "開始時"; },
      onSelect: function (t) { intYear = t; renderInterest(); },
      ariaLabel: "單利息與複利息每年的本利和",
    });

    var s = d.simple[d.n], c = d.comp[d.n];
    $("int-tiles").innerHTML =
      "<div class=\"tile\"><small>" + d.n + " 年後．單利息本利和</small><b>" + money(s) + "</b><span>利息 " + money(s - d.P) + "</span></div>" +
      "<div class=\"tile\"><small>" + d.n + " 年後．複利息本利和</small><b>" + money(c) + "</b><span>利息 " + money(c - d.P) + "</span></div>" +
      "<div class=\"tile\"><small>複利息多出</small><b>" + money(c - s) + "</b><span>" + d.n + " 年後</span></div>";

    var t = intYear, rs = d.r + "%";
    $("int-year").textContent = t ? "第 " + t + " 年" : "開始時";
    $("int-prev").disabled = t <= 0;
    $("int-next").disabled = t >= d.n;
    $("int-explain").innerHTML = t === 0
      ? "開始時，兩者都只有本金 " + money(d.P) + "。"
      : "<strong>單利息：</strong>利息 = 本金 " + money(d.P) + " × " + rs + " = " + money(d.P * d.r / 100) +
        "（每年都一樣）→ 本利和 " + money(d.simple[t]) + "<br>" +
        "<strong>複利息：</strong>利息 = 上一年本利和 " + money(d.comp[t - 1]) + " × " + rs + " = " + money(d.comp[t - 1] * d.r / 100) +
        "（每年都增加）→ 本利和 " + money(d.comp[t]) + "<br>" +
        '<span class="hint">單利息：I = P × r% × n　｜　複利息：A = P(1 + r%)' + sup("n") + "</span>";

    $("int-table").innerHTML = "<tr><th>年</th><th class=\"num\">單利息本利和</th><th class=\"num\">複利息本利和</th><th class=\"num\">相差</th></tr>" +
      d.simple.map(function (v, t) {
        return "<tr><td>" + t + "</td><td class=\"num\">" + money(v) + "</td><td class=\"num\">" + money(d.comp[t]) +
          "</td><td class=\"num\">" + money(d.comp[t] - v) + "</td></tr>";
      }).join("");
  }
  bindRange("int-r", renderInterest);
  bindRange("int-n", renderInterest);
  $("int-p").addEventListener("input", renderInterest);
  $("int-prev").addEventListener("click", function () { intYear--; renderInterest(); });
  $("int-next").addEventListener("click", function () { intYear++; renderInterest(); });
  renderInterest();

  /* ---------- ③ 分期複利 ---------- */
  var FREQ = [{ k: 1, name: "每年" }, { k: 2, name: "每半年" }, { k: 4, name: "每季" }, { k: 12, name: "每月" }];
  var perK = 1;

  function renderPeriods() {
    var P = Math.max(1, Number($("per-p").value) || 10000), r = Number($("per-r").value), n = Number($("per-n").value);
    var k = perK, rate = r / k, N = n * k;
    function amount(kk) { return P * Math.pow(1 + r / 100 / kk, n * kk); }

    // 一年內的計息時間線
    var tl = '<div class="line"></div>';
    for (var i = 1; i <= k; i++) tl += '<span class="tick" style="left:' + (i / k * 100) + '%"></span>';
    tl += '<span class="end" style="left:0">開始</span><span class="end" style="left:100%">1 年</span>';
    $("per-timeline").innerHTML = tl;

    var rateText = k === 1 ? r + "%" : r + "% ÷ " + k;
    var exact = Number.isInteger(rate * 10000);
    var rateShown = exact ? pct(rate) : rateText; // 除不盡時保留「8% ÷ 12」，避免四捨五入誤差
    var lines = ["每年計息 <strong>" + k + " 次</strong>，每期利率 = " + rateText + (k === 1 ? "" : (exact ? " = " : " ≈ ") + pct(rate)) +
      "，" + n + " 年共 <strong>" + N + " 期</strong>。"];
    var v = P;
    for (i = 1; i <= N; i++) {
      var next = v * (1 + rate / 100);
      if (i <= 3 || i === N) lines.push("第 " + i + " 期後：" + money(v) + " × (1 + " + rateShown + ") = " + money(next));
      else if (i === 4) lines.push("⋮");
      v = next;
    }
    lines.push("本利和 = " + money(P) + " × (1 + " + rateText + ")" + sup(N) + " = <strong>" + money(amount(k)) + "</strong>");
    $("per-calc").innerHTML = lines.join("<br>");

    $("per-table").innerHTML = "<tr><th>計息方式</th><th class=\"num\">每期利率</th><th class=\"num\">總期數</th><th class=\"num\">本利和</th><th class=\"num\">利息</th></tr>" +
      FREQ.map(function (f) {
        var a = amount(f.k);
        return '<tr class="' + (f.k === k ? "on" : "") + '"><td>' + f.name + '</td><td class="num">' + (Number.isInteger(r / f.k * 10000) ? "" : "≈ ") + pct(r / f.k) +
          '</td><td class="num">' + n * f.k + '</td><td class="num">' + money(a) + '</td><td class="num">' + money(a - P) + "</td></tr>";
      }).join("");
  }
  bindSeg("per-freq", "data-k", function (k) { perK = Number(k); renderPeriods(); });
  bindRange("per-r", renderPeriods);
  bindRange("per-n", renderPeriods);
  $("per-p").addEventListener("input", renderPeriods);
  renderPeriods();

  /* ---------- ④ 增長與折舊 ---------- */
  var GR_PRESETS = [
    { label: "汽車折舊", start: 300000, t: -1, r: 15, n: 10, unit: "年", money: true, what: "汽車的價值" },
    { label: "手機折舊", start: 8000, t: -1, r: 25, n: 6, unit: "年", money: true, what: "手機的價值" },
    { label: "城市人口增長", start: 500000, t: 1, r: 3, n: 20, unit: "年", suffix: " 人", what: "人口" },
    { label: "細菌繁殖", start: 1000, t: 1, r: 20, n: 12, unit: "小時", suffix: " 個", what: "細菌數目" },
  ];
  var gr = { t: -1, preset: GR_PRESETS[0] };

  $("gr-presets").innerHTML = GR_PRESETS.map(function (p, i) {
    return '<button type="button" class="chip" data-i="' + i + '">' + p.label + "</button>";
  }).join("");

  function grFmt(v) {
    var p = gr.preset;
    return p.money ? money(v) : num(Math.round(v), 0) + (p.suffix || "");
  }

  function renderGrowth() {
    var p = gr.preset, start = Math.max(1, Number($("gr-start").value) || 1);
    var r = Number($("gr-r").value), n = Number($("gr-n").value), f = 1 + gr.t * r / 100;
    $("gr-n-out").textContent = n + " " + p.unit;
    var vals = [];
    for (var t = 0; t <= n; t++) vals.push(start * Math.pow(f, t));

    // 何時首次跌至一半以下／升至兩倍以上
    var target = gr.t < 0 ? start / 2 : start * 2, hit = null;
    for (t = 1; t <= 500 && hit == null; t++) {
      var v = start * Math.pow(f, t);
      if (gr.t < 0 ? v < target : v > target) hit = t;
    }
    var refs = [{ value: start, label: "原值" }];
    if (hit != null && hit <= n) refs.push({ value: target, label: gr.t < 0 ? "原值的一半" : "原值的兩倍" });

    barChart($("gr-chart"), {
      labels: vals.map(function (v, t) { return String(t); }),
      series: [{ name: p.what, color: gr.t < 0 ? "var(--s2)" : "var(--s1)", values: vals }],
      fmt: grFmt, tickFmt: function (v) { return (p.money ? "$" : "") + group(String(Math.round(v))); },
      tipTitle: function (t) { return t ? "第 " + t + " " + p.unit + "後" : "開始時"; },
      refs: refs, padL: 72, ariaLabel: p.what + "的變化",
    });

    var sign = gr.t < 0 ? "−" : "+";
    $("gr-calc").innerHTML = "第 " + n + " " + p.unit + "後的" + p.what + " = " + grFmt(start) + " × (1 " + sign + " " + r + "%)" + sup(n) +
      " = " + grFmt(start) + " × " + num(f, 4) + sup(n) + " = <strong>" + grFmt(vals[n]) + "</strong>";
    $("gr-milestone").innerHTML = (hit == null ? "" :
      "第 " + hit + " " + p.unit + "後，" + p.what + "首次" + (gr.t < 0 ? "少於原值的一半" : "多於原值的兩倍") + "。") +
      (gr.t < 0 ? "<br>無論折舊多少" + p.unit + "，數值都只會越來越少，但不會變成 0。" : "");
  }

  function loadPreset(p) {
    gr.preset = p; gr.t = p.t;
    $("gr-start").value = p.start; $("gr-r").value = p.r; $("gr-n").value = p.n;
    $("gr-r-out").textContent = p.r;
    setSeg("gr-type", "data-t", p.t);
    renderGrowth();
  }
  $("gr-presets").addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (b) loadPreset(GR_PRESETS[Number(b.getAttribute("data-i"))]);
  });
  bindSeg("gr-type", "data-t", function (t) { gr.t = Number(t); renderGrowth(); });
  bindRange("gr-r", renderGrowth);
  $("gr-n").addEventListener("input", renderGrowth);
  $("gr-start").addEventListener("input", renderGrowth);
  loadPreset(GR_PRESETS[0]);
})();
