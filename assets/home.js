// 主頁：課題列表、搜尋、範疇篩選、最近瀏覽
(function () {
  renderTopbar("");

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
  var chips = [{ id: "all", name: "全部" }].concat(STRANDS);
  chipsEl.innerHTML = chips.map(function (s) {
    var dot = s.id === "all" ? "" : '<span class="dot"></span>';
    return '<button type="button" class="chip" data-strand="' + s.id + '" aria-pressed="' + (s.id === "all") + '">' + dot + esc(s.name) + "</button>";
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

  function matches(t) {
    if (state.strand !== "all" && t.strand !== state.strand) return false;
    if (!state.q) return true;
    var hay = [t.zh, t.en, t.desc].concat(t.keywords || []).join(" ").toLowerCase();
    return state.q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function card(t, n) {
    return '<a class="card" data-strand="' + t.strand + '" href="' + topicUrl("", t.id) + '">' +
      '<span class="num">課題 ' + n + "</span>" +
      "<h3>" + esc(t.zh) + "</h3>" +
      '<span class="en">' + esc(t.en) + "</span>" +
      '<span class="desc">' + esc(t.desc) + "</span>" +
      '<span class="foot"><span class="badge ' + t.status + '">' + STATUS_LABEL[t.status] + '</span><span class="go">進入 →</span></span>' +
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
        '<div class="strand-head"><h2>' + esc(s.name) + "</h2><span>" + esc(s.en) + " · " + items.length + " 個課題</span></div>" +
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
    r.innerHTML = "<span>最近瀏覽：</span>" + recent.map(function (t) {
      return '<a href="' + topicUrl("", t.id) + '">' + esc(t.zh) + "</a>";
    }).join("");
    r.classList.add("show");
  }

  render();
})();
