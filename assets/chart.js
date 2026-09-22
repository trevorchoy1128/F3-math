// 簡單柱形圖（SVG）：多個系列、懸停提示、點選、參考線；隨視窗及分頁切換自動重畫
// barChart(el, {
//   labels: ["0", "1", ...],
//   series: [{ name: "單利息", color: "var(--s1)", values: [...] }],
//   fmt: function (v) { return "$" + v; },       // 提示框及參考線的數值格式
//   tickFmt: function (v) { return v; },         // y 軸刻度格式
//   refs: [{ value: 100, label: "原值" }],        // 水平參考線（可選）
//   selected: 3, onSelect: function (i) {},       // 點選某一組（可選）
//   height: 240, padL: 56
// })
(function () {
  var charts = [];

  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  // 頂部 4px 圓角、底部方角
  function barPath(x, y, w, h) {
    if (h <= 0) return "";
    var r = Math.min(4, w / 2, h);
    return "M" + x + "," + (y + h) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y +
      "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) + "V" + (y + h) + "Z";
  }

  function draw(el, o) {
    var W = el.clientWidth;
    if (!W) return; // 分頁隱藏時寬度為 0，待顯示時再畫
    var H = o.height || 240, padL = o.padL || 56, padR = 12, padT = 14, padB = 28;
    var fmt = o.fmt || String, tickFmt = o.tickFmt || fmt;
    var max = 0;
    o.series.forEach(function (s) { s.values.forEach(function (v) { max = Math.max(max, v); }); });
    (o.refs || []).forEach(function (r) { max = Math.max(max, r.value); });
    var step = niceStep(max / 4 || 1), top = Math.ceil(max / step) * step || 1;
    var pw = W - padL - padR, ph = H - padT - padB;
    function y(v) { return padT + ph - v / top * ph; }

    var n = o.labels.length, band = pw / n, k = o.series.length, gap = 2;
    var bw = Math.max(2, Math.min(24, (band * 0.7 - gap * (k - 1)) / k));
    var svg = '<svg width="' + W + '" height="' + H + '" role="img" aria-label="' + (o.ariaLabel || "柱形圖") + '">';

    for (var t = 0; t <= top + 1e-9; t += step) {
      svg += '<line class="grid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(t) + '" y2="' + y(t) + '"/>' +
        '<text class="axis" x="' + (padL - 6) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + tickFmt(t) + "</text>";
    }
    if (o.selected != null) {
      svg += '<rect class="sel" x="' + (padL + band * o.selected) + '" y="' + padT + '" width="' + band + '" height="' + ph + '" rx="4"/>';
    }
    var every = Math.ceil(n / Math.max(1, Math.floor(pw / 30)));
    for (var i = 0; i < n; i++) {
      var cx = padL + band * (i + 0.5), x0 = cx - (k * bw + (k - 1) * gap) / 2;
      o.series.forEach(function (s, j) {
        var v = s.values[i];
        svg += '<path fill="' + s.color + '" d="' + barPath(x0 + j * (bw + gap), y(v), bw, y(0) - y(v)) + '"/>';
      });
      if (i % every === 0 || i === n - 1) {
        svg += '<text class="axis" x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + o.labels[i] + "</text>";
      }
    }
    (o.refs || []).forEach(function (r) {
      svg += '<line class="ref" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(r.value) + '" y2="' + y(r.value) + '"/>' +
        '<text class="axis ref-label" x="' + (W - padR) + '" y="' + (y(r.value) - 5) + '" text-anchor="end">' + r.label + "</text>";
    });
    svg += '<line class="baseline" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>';
    for (i = 0; i < n; i++) {
      svg += '<rect class="hit" data-i="' + i + '" x="' + (padL + band * i) + '" y="' + padT + '" width="' + band + '" height="' + ph + '"/>';
    }
    svg += "</svg>";
    el.innerHTML = '<div class="chart-wrap">' + svg + '<div class="chart-tip" hidden></div></div>';
    if (o.onSelect) el.querySelector("svg").classList.add("clickable");

    var tip = el.querySelector(".chart-tip"), wrap = el.querySelector(".chart-wrap");
    el.querySelectorAll(".hit").forEach(function (h) {
      var idx = Number(h.getAttribute("data-i"));
      h.addEventListener("pointermove", function (e) {
        tip.innerHTML = "<b>" + (o.tipTitle ? o.tipTitle(idx) : o.labels[idx]) + "</b>" + o.series.map(function (s) {
          return '<div><i style="background:' + s.color + '"></i>' + (k > 1 ? s.name + "：" : "") + fmt(s.values[idx]) + "</div>";
        }).join("");
        tip.hidden = false;
        var r = wrap.getBoundingClientRect(), tx = e.clientX - r.left + 12;
        if (tx + tip.offsetWidth > r.width) tx = e.clientX - r.left - tip.offsetWidth - 12;
        tip.style.left = Math.max(0, tx) + "px";
        tip.style.top = Math.max(0, e.clientY - r.top - tip.offsetHeight - 8) + "px";
      });
      h.addEventListener("pointerleave", function () { tip.hidden = true; });
      if (o.onSelect) h.addEventListener("click", function () { o.onSelect(idx); });
    });
  }

  window.barChart = function (el, o) {
    var found = charts.filter(function (c) { return c.el === el; })[0];
    if (found) found.o = o; else charts.push({ el: el, o: o });
    draw(el, o);
  };
  function redrawAll() { charts.forEach(function (c) { draw(c.el, c.o); }); }
  window.addEventListener("resize", redrawAll);
  document.addEventListener("sectionchange", function () { setTimeout(redrawAll, 0); });
})();
