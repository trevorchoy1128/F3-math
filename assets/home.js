// 主頁：課題列表、搜尋、範疇篩選、最近瀏覽
(function () {
  renderTopbar("");
  document.title = L(SITE.title, SITE.titleEn);

  var state = { strand: "all", q: "" };
  var chipsEl = document.getElementById("chips");
  var topicsEl = document.getElementById("topics");
  var emptyEl = document.getElementById("empty");
  var qEl = document.getElementById("q");

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // 範疇篩選按鈕
  var chips = [{ id: "all", name: "全部", en: "All" }].concat(STRANDS);
  chipsEl.innerHTML = chips.map(function (s) {
    var dot = s.id === "all" ? "" : '<span class="dot"></span>';
    return '<button type="button" class="chip" data-strand="' + s.id + '" aria-pressed="' + (s.id === "all") + '">' + dot + esc(strandName(s)) + "</button>";
  }).join("");
  chipsEl.addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    state.strand = b.getAttribute("data-strand");
    chipsEl.querySelectorAll(".chip").forEach(function (c) {
      c.setAttribute("aria-pressed", c === b);
    });
    render();
  });

  qEl.addEventListener("input", function () { state.q = qEl.value.trim().toLowerCase(); render(); });

  // 搜尋同時比對中英文
  function matches(t) {
    if (state.strand !== "all" && t.strand !== state.strand) return false;
    if (!state.q) return true;
    var hay = [t.zh, t.en, t.desc, t.descEn].concat(t.keywords || []).join(" ").toLowerCase();
    return state.q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function card(t, n) {
    return '<a class="card" data-strand="' + t.strand + '" href="' + topicUrl("", t.id) + '">' +
      '<span class="num">' + L("課題 ", "Topic ") + n + "</span>" +
      "<h3>" + esc(topicName(t)) + "</h3>" +
      '<span class="en">' + esc(L(t.en, t.zh)) + "</span>" +
      '<span class="desc">' + esc(L(t.desc, t.descEn)) + "</span>" +
      '<span class="foot"><span class="badge ' + t.status + '">' + L(STATUS_LABEL[t.status], STATUS_LABEL_EN[t.status]) + "</span>" +
      '<span class="go">' + L("進入 →", "Open →") + "</span></span>" +
      "</a>";
  }

  function render() {
    var total = 0;
    topicsEl.innerHTML = STRANDS.map(function (s) {
      var items = [];
      TOPICS.forEach(function (t, i) { if (t.strand === s.id && matches(t)) items.push(card(t, i + 1)); });
      total += items.length;
      if (!items.length) return "";
      return '<section class="strand-block" data-strand="' + s.id + '">' +
        '<div class="strand-head"><h2>' + esc(strandName(s)) + "</h2><span>" + esc(L(s.en, s.name)) + " · " +
        items.length + L(" 個課題", items.length > 1 ? " topics" : " topic") + "</span></div>" +
        '<div class="grid">' + items.join("") + "</div></section>";
    }).join("");
    emptyEl.classList.toggle("show", total === 0);
  }

  // 最近瀏覽
  var recent = getRecent().map(function (id) {
    return TOPICS.filter(function (t) { return t.id === id; })[0];
  }).filter(Boolean);
  if (recent.length) {
    var r = document.getElementById("recent");
    r.innerHTML = "<span>" + L("最近瀏覽：", "Recently viewed:") + "</span>" + recent.map(function (t) {
      return '<a href="' + topicUrl("", t.id) + '">' + esc(topicName(t)) + "</a>";
    }).join("");
    r.classList.add("show");
  }

  render();
})();
