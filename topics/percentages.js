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
  function years(n) { return L(n + " 年", n + (n === 1 ? " year" : " years")); }

  // 通用：滑桿旁顯示數值（fmt 可加單位）
  function bindRange(id, onChange, fmt) {
    var el = $(id), out = $(id + "-out");
    function show() { out.textContent = fmt ? fmt(Number(el.value)) : el.value; }
    el.addEventListener("input", function () { show(); onChange(); });
    show();
    return { el: el, show: show };
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

  // 先預測，後揭曉：勾選後隱藏結果，學生輸入估計再揭曉（製造認知衝突）
  function setupPredict(o) {
    var revealed = false, toggle = $(o.toggle), box = $(o.box), out = $(o.out), input = $(o.input);
    var note = document.createElement("p");
    note.className = "guess-note";
    out.insertBefore(note, out.firstChild);
    function apply() {
      var on = toggle.checked;
      box.hidden = !on || revealed;
      out.hidden = on && !revealed;
    }
    function reset() { revealed = false; input.value = ""; note.innerHTML = ""; apply(); }
    toggle.addEventListener("change", reset);
    function reveal() {
      revealed = true;
      var g = Number(input.value), a = o.actual();
      if (input.value.trim() === "" || !isFinite(g)) note.innerHTML = "";
      else {
        var off = num(Math.abs(g - a) / a * 100, 1) + "%";
        note.innerHTML = L("你的估計：", "Your estimate: ") + o.fmt(g) + L("；實際：", "; actual: ") + "<strong>" + o.fmt(a) + "</strong>" + L("。", ". ") +
          (Math.abs(g - a) / a < 0.01 ? L("非常接近！", "Very close!")
            : g < a ? L("低估了 " + off + "。", "You underestimated by " + off + ". ") + (o.lowNote || "")
            : L("高估了 " + off + "。", "You overestimated by " + off + "."));
      }
      apply();
      o.onReveal();
    }
    $(o.button).addEventListener("click", reveal);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") reveal(); });
    return { reset: reset };
  }

  /* ---------- ① 連續百分變化 ---------- */
  var SUCC_PRESETS = [
    { label: "+20% → −20%", steps: [[1, 20], [-1, 20]] },
    { label: "−20% → +20%", steps: [[-1, 20], [1, 20]] },
    { label: "+10% → +10%", steps: [[1, 10], [1, 10]] },
    { label: "+50% → −50%", steps: [[1, 50], [-1, 50]] },
  ];
  var succ = SUCC_PRESETS[0].steps.map(function (s) { return { s: s[0], r: s[1] }; });
  var succEnd = 0;
  function changeName(i) { return L("第 " + i + " 次", "Change " + i); }

  $("succ-presets").innerHTML = SUCC_PRESETS.map(function (p, i) {
    return '<button type="button" class="chip" data-i="' + i + '">' + p.label + "</button>";
  }).join("");

  function renderSuccRows() {
    $("succ-steps").innerHTML = succ.map(function (st, i) {
      return '<div class="step-row" data-i="' + i + '"><span class="lbl">' + changeName(i + 1) + "</span>" +
        '<div class="seg"><button type="button" data-s="1" aria-pressed="' + (st.s === 1) + '">' + L("增加", "Increase") + "</button>" +
        '<button type="button" data-s="-1" aria-pressed="' + (st.s === -1) + '">' + L("減少", "Decrease") + "</button></div>" +
        '<input class="field sm" type="number" min="0" max="100" value="' + st.r + '" aria-label="' + L("第 " + (i + 1) + " 次百分率", "Percentage for change " + (i + 1)) + '"> %' +
        (succ.length > 1 ? '<button type="button" class="x" aria-label="' + L("刪除第 " + (i + 1) + " 次", "Remove change " + (i + 1)) + '">×</button>' : "") + "</div>";
    }).join("");
    $("succ-add").disabled = succ.length >= 4;
    renderSucc();
  }

  function renderSucc() {
    var start = Math.max(1, Number($("succ-start").value) || 100);
    var vals = [start], lines = [], m = 1;
    succ.forEach(function (st, i) {
      var f = 1 + st.s * st.r / 100, next = vals[i] * f;
      lines.push(L(changeName(i + 1) + "：" + (st.s > 0 ? "增加 " : "減少 ") + st.r + "%，即 × " + num(f, 4) + "：",
          changeName(i + 1) + ": " + (st.s > 0 ? "increase" : "decrease") + " by " + st.r + "%, i.e. × " + num(f, 4) + ": ") +
        num(vals[i], 4) + " × " + num(f, 4) + " = " + num(next, 4));
      vals.push(next); m *= f;
    });
    renderPercentBars(vals);
    var end = vals[vals.length - 1], change = (m - 1) * 100;
    succEnd = end;
    lines.push(L("整體：", "Overall: ") + num(start, 4) + " × " + succ.map(function (st) { return num(1 + st.s * st.r / 100, 4); }).join(" × ") +
      " = " + num(start, 4) + " × " + num(m, 6) + " = <strong>" + num(end, 4) + "</strong>");
    $("succ-calc").innerHTML = lines.join("<br>");

    var same = Math.abs(change) < 1e-9, diff = "<strong>" + num(Math.abs(change), 4) + "%</strong>";
    var msg = same ? L("最後剛好回到原值。", "The final value is exactly the original value.")
      : L("最後是 " + num(end, 4) + "，比原值" + (change > 0 ? "多" : "少") + " " + diff + "。",
          "The final value is " + num(end, 4) + ", which is " + diff + (change > 0 ? " more" : " less") + " than the original value.");
    // 同一百分率先加後減（或先減後加）：解釋為何不能抵消
    if (succ.length === 2 && succ[0].r === succ[1].r && succ[0].s !== succ[1].s && succ[0].r > 0) {
      var r = succ[0].r;
      msg += "<br>" + L("兩次都是 " + r + "%，但第二次的 " + r + "% 是按 " + num(vals[1], 4) + " 計算，不是按原值 " + num(start, 4) + " 計算，所以不能互相抵消。",
        "Both changes are " + r + "%, but the second " + r + "% is calculated on " + num(vals[1], 4) + ", not on the original value " + num(start, 4) + ", so they do not cancel out.");
    }
    $("succ-result").innerHTML = msg;
    $("succ-result").className = "result" + (same ? "" : " bad");
  }

  // 百分比條（參考 Van den Heuvel-Panhuizen 的 bar model）：每一步都以上一次的數值作 100%，
  // 所有條用同一比例尺，學生可看到第二次的 20% 比第一次的 20% 長
  function renderPercentBars(vals) {
    var max = Math.max.apply(null, vals);
    function w(v) { return (v / max * 100) + "%"; }
    $("succ-bars").innerHTML = succ.map(function (st, i) {
      var prev = vals[i], next = vals[i + 1], delta = Math.abs(next - prev);
      var bar = st.s > 0
        ? '<span class="base" style="width:' + w(prev) + '"></span><span class="add" style="width:' + w(delta) + '"></span>'
        : '<span class="base" style="width:' + w(next) + '"></span><span class="removed" style="width:' + w(delta) + '"></span>';
      var endPct = 100 + st.s * st.r;
      function tick(v, text) { // 貼近右邊的刻度改為靠右對齊，避免超出範圍
        return '<span style="left:' + w(v) + (v / max > 0.85 ? ";transform:translateX(-100%)" : "") + '">' + text + "</span>";
      }
      var lp = L("（", " ("), rp = L("）", ")");
      var scale = '<span style="left:0">0</span>' + tick(prev, "100%" + lp + num(prev, 4) + rp) +
        tick(next, endPct + "%" + lp + num(next, 4) + rp);
      var label = L("以 " + num(prev, 4) + " 作 100%，" + (st.s > 0 ? "增加" : "減少") + " " + st.r + "% = ",
        "taking " + num(prev, 4) + " as 100%, " + (st.s > 0 ? "increase" : "decrease") + " by " + st.r + "% = ");
      return '<div><div class="pbar-label"><strong>' + changeName(i + 1) + "</strong>" + L("：", ": ") + label +
        num(prev, 4) + " × " + st.r + "% = <strong>" + num(delta, 4) + "</strong></div>" +
        '<div class="pbar">' + bar + '<span class="mark" style="left:' + w(prev) + '"></span></div>' +
        '<div class="pbar-scale">' + scale + "</div></div>";
    }).join("");

    // 刻度文字重疊時，隱藏結果刻度（保留 0 及 100%）
    $("succ-bars").querySelectorAll(".pbar-scale").forEach(function (sc) {
      var s = sc.querySelectorAll("span"), a = s[1].getBoundingClientRect(), b = s[2].getBoundingClientRect();
      if (a.width && b.left < a.right + 2 && b.right > a.left - 2) s[2].hidden = true;
    });
  }

  var succPredict = setupPredict({
    toggle: "succ-predict", box: "succ-guess", out: "succ-out", input: "succ-guess-in", button: "succ-reveal",
    actual: function () { return succEnd; },
    fmt: function (v) { return num(v, 4); }, onReveal: renderSucc,
  });

  $("succ-presets").addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    succ = SUCC_PRESETS[Number(b.getAttribute("data-i"))].steps.map(function (s) { return { s: s[0], r: s[1] }; });
    succPredict.reset();
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
  // 百分比條的刻度要按實際寬度決定，分頁切換到此時重畫
  document.addEventListener("sectionchange", function (e) { if (e.detail === "successive") renderSucc(); });
  renderSuccRows();

  /* ---------- ② 單利息 vs 複利息 ---------- */
  var intYear = 1;
  function intData() {
    var P = Math.max(1, Number($("int-p").value) || 10000), r = Number($("int-r").value), n = Number($("int-n").value);
    var simple = [], comp = [];
    for (var t = 0; t <= n; t++) { simple.push(P * (1 + r * t / 100)); comp.push(P * Math.pow(1 + r / 100, t)); }
    return { P: P, r: r, n: n, simple: simple, comp: comp };
  }
  function yearTitle(t) { return t ? L("第 " + t + " 年後", "After year " + t) : L("開始時", "At the start"); }

  function renderInterest() {
    var d = intData();
    intYear = Math.min(intYear, d.n);
    barChart($("int-chart"), {
      labels: d.simple.map(function (v, t) { return String(t); }),
      series: [
        { name: L("單利息", "Simple"), color: "var(--s1)", values: d.simple },
        { name: L("複利息", "Compound"), color: "var(--s2)", values: d.comp },
      ],
      fmt: money, tickFmt: moneyTick, padL: 66, selected: intYear,
      tipTitle: yearTitle,
      onSelect: function (t) { intYear = t; renderInterest(); },
      ariaLabel: L("單利息與複利息每年的本利和", "Amount each year under simple and compound interest"),
    });

    var s = d.simple[d.n], c = d.comp[d.n], after = L(d.n + " 年後", "after " + years(d.n));
    $("int-tiles").innerHTML =
      "<div class=\"tile\"><small>" + L(after + "．單利息本利和", "Amount " + after + " (simple)") + "</small><b>" + money(s) + "</b><span>" + L("利息 ", "Interest ") + money(s - d.P) + "</span></div>" +
      "<div class=\"tile\"><small>" + L(after + "．複利息本利和", "Amount " + after + " (compound)") + "</small><b>" + money(c) + "</b><span>" + L("利息 ", "Interest ") + money(c - d.P) + "</span></div>" +
      "<div class=\"tile\"><small>" + L("複利息多出", "Extra from compound interest") + "</small><b>" + money(c - s) + "</b><span>" + after + "</span></div>";

    var t = intYear, rs = d.r + "%", si = money(d.P * d.r / 100);
    $("int-year").textContent = t ? L("第 " + t + " 年", "Year " + t) : L("開始時", "Start");
    $("int-prev").disabled = t <= 0;
    $("int-next").disabled = t >= d.n;
    $("int-explain").innerHTML = t === 0
      ? L("開始時，兩者都只有本金 " + money(d.P) + "。", "At the start, both have only the principal " + money(d.P) + ".")
      : L("<strong>單利息：</strong>利息 = 本金 " + money(d.P) + " × " + rs + " = " + si + "（每年都一樣）→ 本利和 " + money(d.simple[t]),
          "<strong>Simple interest:</strong> interest = principal " + money(d.P) + " × " + rs + " = " + si + " (the same every year) → amount " + money(d.simple[t])) + "<br>" +
        L("<strong>複利息：</strong>利息 = 上一年本利和 " + money(d.comp[t - 1]) + " × " + rs + " = " + money(d.comp[t - 1] * d.r / 100) + "（每年都增加）→ 本利和 " + money(d.comp[t]),
          "<strong>Compound interest:</strong> interest = amount at the end of the previous year " + money(d.comp[t - 1]) + " × " + rs + " = " + money(d.comp[t - 1] * d.r / 100) + " (increases every year) → amount " + money(d.comp[t])) + "<br>" +
        // 共變：時間每加 1 年，單利息「加」同一個數，複利息「乘」同一個數（Confrey & Smith；Ellis 等）
        L("<strong>規律：</strong>每過一年，單利息的本利和都 <strong>+ " + si + "</strong>；複利息的本利和都 <strong>× " + num(1 + d.r / 100, 4) + "</strong>。",
          "<strong>Pattern:</strong> every year, the amount under simple interest <strong>+ " + si + "</strong>; under compound interest <strong>× " + num(1 + d.r / 100, 4) + "</strong>.") + "<br>" +
        '<span class="hint">' + L("單利息", "Simple interest") + "：I = P × r% × n　｜　" + L("複利息", "Compound interest") + "：A = P(1 + r%)" + sup("n") + "</span>";

    $("int-table").innerHTML = "<tr><th rowspan=\"2\">" + L("年", "Year") + "</th><th colspan=\"2\">" + L("單利息", "Simple interest") + "</th><th colspan=\"3\">" + L("複利息", "Compound interest") + "</th></tr>" +
      "<tr><th class=\"num\">" + L("本利和", "Amount") + "</th><th class=\"num\">" + L("比上一年多", "Increase from previous year") + "</th><th class=\"num\">" + L("本利和", "Amount") +
      "</th><th class=\"num\">" + L("比上一年多", "Increase from previous year") + "</th><th class=\"num\">" + L("是上一年的", "Compared with previous year") + "</th></tr>" +
      d.simple.map(function (v, t) {
        return "<tr><td>" + t + "</td><td class=\"num\">" + money(v) + "</td><td class=\"num\">" + (t ? "+ " + money(v - d.simple[t - 1]) : "—") +
          "</td><td class=\"num\">" + money(d.comp[t]) + "</td><td class=\"num\">" + (t ? "+ " + money(d.comp[t] - d.comp[t - 1]) : "—") +
          "</td><td class=\"num\">" + (t ? "× " + num(d.comp[t] / d.comp[t - 1], 4) : "—") + "</td></tr>";
      }).join("");
    $("int-guess-label").textContent = L("估計 " + d.n + " 年後複利息的本利和（$）：", "Estimate the amount under compound interest after " + years(d.n) + " ($):");
  }
  // 研究發現一般人會把複利「直線化」而低估增長（Stango & Zinman, 2009）
  var intPredict = setupPredict({
    toggle: "int-predict", box: "int-guess", out: "int-out", input: "int-guess-in", button: "int-reveal",
    actual: function () { var d = intData(); return d.comp[d.n]; },
    fmt: money, onReveal: renderInterest,
    lowNote: L("研究發現，大部分人都會低估複利息的增長。", "Research shows that most people underestimate how fast compound interest grows."),
  });
  function onIntSettings() { intPredict.reset(); renderInterest(); }
  bindRange("int-r", onIntSettings);
  bindRange("int-n", onIntSettings, years);
  $("int-p").addEventListener("input", onIntSettings);
  $("int-prev").addEventListener("click", function () { intYear--; renderInterest(); });
  $("int-next").addEventListener("click", function () { intYear++; renderInterest(); });
  renderInterest();

  /* ---------- ③ 分期複利 ----------
     參考 Hubbard, Matthews & Samek (2016)：逐期列出利息的表格及以面積表示利息的圖，比折線圖更能幫助理解複利。
     總利息拆成「按本金計的利息」（四種方式都一樣）及「利息的利息」，突出計息次數只影響後者。 */
  var FREQ = [
    { k: 1, zh: "每年", en: "Yearly" }, { k: 2, zh: "每半年", en: "Half-yearly" },
    { k: 4, zh: "每季", en: "Quarterly" }, { k: 12, zh: "每月", en: "Monthly" },
  ];
  var perK = 4;

  function renderPeriods() {
    var P = Math.max(1, Number($("per-p").value) || 10000), r = Number($("per-r").value), n = Number($("per-n").value);
    var onPrincipal = P * r / 100 * n;
    var data = FREQ.map(function (f) {
      var A = P * Math.pow(1 + r / 100 / f.k, n * f.k);
      return { f: f, A: A, I: A - P, ioi: A - P - onPrincipal };
    });
    var maxI = Math.max.apply(null, data.map(function (d) { return d.I; }));

    $("per-bars").innerHTML = data.map(function (d) {
      return '<button type="button" class="fbar" data-k="' + d.f.k + '" aria-pressed="' + (d.f.k === perK) + '">' +
        '<span class="name">' + L(d.f.zh, d.f.en) + "</span>" +
        '<span class="track"><span class="seg1" style="width:' + (onPrincipal / maxI * 100) + '%"></span>' +
        '<span class="seg2" style="width:' + (d.ioi / maxI * 100) + '%"></span></span>' +
        '<span class="amt">' + money(d.I) + "<br><small>" + L("利息的利息 ", "on interest ") + money(d.ioi) + "</small></span></button>";
    }).join("");

    // 逐期計算（選取的計息方式）
    var cur = data.filter(function (d) { return d.f.k === perK; })[0], k = perK, rate = r / k, N = n * k;
    var exact = Number.isInteger(rate * 10000);
    var rateText = k === 1 ? r + "%" : r + "% ÷ " + k;
    var rateShown = k === 1 ? r + "%" : rateText + (exact ? " = " : " ≈ ") + pct(rate);
    $("per-sub").textContent = L("逐期計算：" + cur.f.zh + "計息（每年 " + k + " 次）", "Period by period: compounded " + cur.f.en.toLowerCase() + " (" + k + (k === 1 ? " time" : " times") + " a year)");
    $("per-calc").innerHTML =
      L("每期利率 = " + rateShown + "，" + n + " 年共 <strong>" + N + " 期</strong>。",
        "Interest rate per period = " + rateShown + "; <strong>" + N + " periods</strong> in " + years(n) + ".") + "<br>" +
      L("本利和", "Amount") + " = " + money(P) + " × (1 + " + rateText + ")" + sup(N) + " = <strong>" + money(cur.A) + "</strong>";

    var basePart = P * rate / 100, v = P, rows = "";
    for (var i = 1; i <= N; i++) {
      var interest = v * rate / 100, ioi = interest - basePart;
      rows += '<tr class="' + (i % k === 0 && i < N ? "year-end" : "") + '"><td>' + i + '</td><td class="num">' + money(v) +
        '</td><td class="num">' + money(interest) + ' = ' + money(basePart) + ' + <span class="ioi">' + money(ioi) + "</span>" +
        '</td><td class="num">' + money(v + interest) + "</td></tr>";
      v += interest;
    }
    $("per-table").innerHTML = "<tr><th>" + L("期", "Period") + "</th><th class=\"num\">" + L("期初本利和", "Amount at start") +
      "</th><th class=\"num\">" + L("本期利息 = 按本金計 + ", "Interest = on principal + ") + '<span class="ioi">' + L("利息的利息", "on interest") + "</span>" +
      "</th><th class=\"num\">" + L("期末本利和", "Amount at end") + "</th></tr>" + rows;
  }
  $("per-bars").addEventListener("click", function (e) {
    var b = e.target.closest(".fbar");
    if (!b) return;
    perK = Number(b.getAttribute("data-k"));
    renderPeriods();
  });
  bindRange("per-r", renderPeriods);
  bindRange("per-n", renderPeriods, years);
  $("per-p").addEventListener("input", renderPeriods);
  renderPeriods();

  /* ---------- ④ 增長與折舊 ---------- */
  var GR_PRESETS = [
    { zh: "汽車折舊", en: "Car depreciation", start: 300000, t: -1, r: 15, n: 10, unit: "year", money: true, whatZh: "汽車的價值", whatEn: "the value of the car" },
    { zh: "手機折舊", en: "Phone depreciation", start: 8000, t: -1, r: 25, n: 6, unit: "year", money: true, whatZh: "手機的價值", whatEn: "the value of the phone" },
    { zh: "城市人口增長", en: "City population growth", start: 500000, t: 1, r: 3, n: 20, unit: "year", sufZh: " 人", sufEn: " people", whatZh: "人口", whatEn: "the population" },
    { zh: "細菌繁殖", en: "Bacteria growth", start: 1000, t: 1, r: 20, n: 12, unit: "hour", sufZh: " 個", sufEn: " bacteria", whatZh: "細菌數目", whatEn: "the number of bacteria" },
  ];
  var gr = { t: -1, preset: GR_PRESETS[0] };

  $("gr-presets").innerHTML = GR_PRESETS.map(function (p, i) {
    return '<button type="button" class="chip" data-i="' + i + '">' + L(p.zh, p.en) + "</button>";
  }).join("");

  function unitZh(p) { return p.unit === "hour" ? "小時" : "年"; }
  function periods(p, n) { return L(n + " " + unitZh(p), n + " " + p.unit + (n === 1 ? "" : "s")); }
  function what(p) { return L(p.whatZh, p.whatEn); }
  function grFmt(v) {
    var p = gr.preset;
    return p.money ? money(v) : num(Math.round(v), 0) + L(p.sufZh, p.sufEn);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function renderGrowth() {
    var p = gr.preset, start = Math.max(1, Number($("gr-start").value) || 1);
    var r = Number($("gr-r").value), n = Number($("gr-n").value), f = 1 + gr.t * r / 100;
    $("gr-n-out").textContent = periods(p, n);
    var vals = [];
    for (var t = 0; t <= n; t++) vals.push(start * Math.pow(f, t));

    // 何時首次跌至一半以下／升至兩倍以上
    var target = gr.t < 0 ? start / 2 : start * 2, hit = null;
    for (t = 1; t <= 500 && hit == null; t++) {
      var v = start * Math.pow(f, t);
      if (gr.t < 0 ? v < target : v > target) hit = t;
    }
    var refs = [{ value: start, label: L("原值", "Original") }];
    if (hit != null && hit <= n) refs.push({ value: target, label: gr.t < 0 ? L("原值的一半", "Half of original") : L("原值的兩倍", "Twice the original") });

    // 比較錯誤做法：每期都按原值加減（直線），針對「直線化錯覺」（De Bock, Van Dooren & Verschaffel）
    var compare = $("gr-compare").checked, linear = [];
    for (t = 0; t <= n; t++) linear.push(Math.max(0, start * (1 + gr.t * r * t / 100)));
    var series = [{ name: L("實際（按上一期計算）", "Actual (on the previous period's value)"), color: "var(--s1)", values: vals }];
    if (compare) series.push({ name: L("錯誤做法（每期按原值計算）", "Wrong method (on the original value every period)"), color: "var(--s2)", values: linear });
    $("gr-legend").hidden = !compare;
    $("gr-legend").innerHTML = series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + s.name + "</span>"; }).join("");

    barChart($("gr-chart"), {
      labels: vals.map(function (v, t) { return String(t); }),
      series: series,
      fmt: grFmt, tickFmt: function (v) { return (p.money ? "$" : "") + group(String(Math.round(v))); },
      tipTitle: function (t) { return t ? L("第 " + t + " " + unitZh(p) + "後", "After " + periods(p, t)) : L("開始時", "At the start"); },
      refs: refs, padL: 72, ariaLabel: L(p.whatZh + "的變化", "Change in " + p.whatEn),
    });

    // 每一期都乘以同一個數
    var chain = vals.slice(0, Math.min(4, n + 1)).map(grFmt).join(" → ") + (n > 3 ? " → …" : "");
    $("gr-chain").innerHTML = L("每一" + unitZh(p) + "都 <strong>× " + num(f, 4) + "</strong>：", "Every " + p.unit + ": <strong>× " + num(f, 4) + "</strong>: ") + chain;

    var sign = gr.t < 0 ? "−" : "+";
    $("gr-calc").innerHTML = L("第 " + n + " " + unitZh(p) + "後的" + p.whatZh, cap(p.whatEn) + " after " + periods(p, n)) + " = " +
      grFmt(start) + " × (1 " + sign + " " + r + "%)" + sup(n) + " = " + grFmt(start) + " × " + num(f, 4) + sup(n) + " = <strong>" + grFmt(vals[n]) + "</strong>";

    var msg = [];
    if (hit != null) {
      msg.push(L("第 " + hit + " " + unitZh(p) + "後，" + p.whatZh + "首次" + (gr.t < 0 ? "少於原值的一半" : "多於原值的兩倍") + "。",
        "After " + periods(p, hit) + ", " + p.whatEn + (gr.t < 0 ? " first falls below half of the original value." : " first exceeds twice the original value.")));
    }
    if (gr.t < 0) msg.push(L("無論折舊多少" + unitZh(p) + "，數值都只會越來越少，但不會變成 0。", "However long it depreciates, the value keeps getting smaller but never reaches 0."));
    if (compare) {
      msg.push(L("錯誤做法每" + unitZh(p) + "都" + (gr.t < 0 ? "減去" : "加上") + "原值的 " + r + "%（" + grFmt(start * r / 100) + "），第 " + n + " " + unitZh(p) + "後得 " + grFmt(linear[n]) + "，與實際相差 " + grFmt(Math.abs(linear[n] - vals[n])) + "。",
        "The wrong method " + (gr.t < 0 ? "subtracts" : "adds") + " " + r + "% of the original value (" + grFmt(start * r / 100) + ") every " + p.unit + ", giving " + grFmt(linear[n]) + " after " + periods(p, n) + " — " + grFmt(Math.abs(linear[n] - vals[n])) + " away from the actual value."));
      var zero = Math.ceil(100 / r);
      if (gr.t < 0 && zero <= n) msg.push(L("按錯誤做法，第 " + zero + " " + unitZh(p) + "後價值已跌至 0 或以下，這並不合理。",
        "Under the wrong method, the value would fall to 0 or below after " + periods(p, zero) + ", which makes no sense."));
    }
    $("gr-milestone").innerHTML = msg.join("<br>");
  }

  function loadPreset(p) {
    gr.preset = p; gr.t = p.t;
    $("gr-start").value = p.start; $("gr-r").value = p.r; $("gr-n").value = p.n;
    grR.show();
    setSeg("gr-type", "data-t", p.t);
    renderGrowth();
  }
  $("gr-presets").addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (b) loadPreset(GR_PRESETS[Number(b.getAttribute("data-i"))]);
  });
  bindSeg("gr-type", "data-t", function (t) { gr.t = Number(t); renderGrowth(); });
  var grR = bindRange("gr-r", renderGrowth);
  $("gr-n").addEventListener("input", renderGrowth);
  $("gr-start").addEventListener("input", renderGrowth);
  $("gr-compare").addEventListener("change", renderGrowth);
  loadPreset(GR_PRESETS[0]);
})();
