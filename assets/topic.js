// 課題頁及教師筆記頁：根據 <body data-topic="..."> 自動加入頂部列、麵包屑、標題、目錄及上／下一課
// 教師筆記頁（notes/ 資料夾）在 <body> 加上 data-notes
(function () {
  var ROOT = "../";
  renderTopbar(ROOT);

  var id = document.body.getAttribute("data-topic");
  var isNotes = document.body.hasAttribute("data-notes");
  var idx = TOPICS.findIndex(function (t) { return t.id === id; });
  var t = TOPICS[idx];
  if (!t) return;
  var strand = STRANDS.filter(function (s) { return s.id === t.strand; })[0];

  document.body.setAttribute("data-strand", t.strand);
  var name = topicName(t), notesLabel = L("教師筆記", "Teacher notes");
  document.title = name + (isNotes ? L("（教師筆記）", " (Teacher notes)") : "") + L("｜", " | ") + L(SITE.title, SITE.titleEn);
  if (!isNotes) addRecent(t.id);

  // 標題區
  var classUrl = topicUrl(ROOT, t.id);
  var head = document.getElementById("topic-head");
  head.innerHTML =
    '<nav class="crumbs"><a href="' + ROOT + 'index.html">' + L("主頁", "Home") + "</a> › " + strandName(strand) + " › " +
    (isNotes ? '<a href="' + classUrl + '">' + name + "</a> › " + notesLabel : name) + "</nav>" +
    '<div class="topic-hero"><span class="tag">' + (isNotes ? notesLabel : strandName(strand)) + "</span>" +
    "<h1>" + name + "</h1><p class=\"en\">" + L(t.en, t.zh) + "</p>" +
    (isNotes ? '<p><a href="' + classUrl + '">' + L("← 返回課堂頁面", "← Back to class page") + "</a></p>" : "") + "</div>";

  // 目錄（由頁內每個 .section 自動產生）
  var sections = Array.prototype.slice.call(document.querySelectorAll(".section[id]"));
  var toc = document.getElementById("toc");
  toc.innerHTML = sections.map(function (s) {
    return '<a href="#' + s.id + '">' + s.querySelector("h2").innerHTML + "</a>"; // innerHTML 保留中英兩個 span
  }).join("");
  var links = Array.prototype.slice.call(toc.querySelectorAll("a"));

  function highlight(current) {
    links.forEach(function (a) {
      var on = a.getAttribute("href") === "#" + current.id;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      if (on && toc.scrollWidth > toc.clientWidth) a.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  if (document.body.hasAttribute("data-tabs")) {
    // 分頁模式：每次只顯示一個部分，方便上堂逐個講解
    var stepNav = document.createElement("div");
    stepNav.className = "stepnav";
    sections[sections.length - 1].after(stepNav);

    var showSection = function (id, fromUser) {
      var i = Math.max(0, sections.findIndex(function (s) { return s.id === id; }));
      var cur = sections[i];
      sections.forEach(function (s) { s.hidden = s !== cur; });
      highlight(cur);
      var p = sections[i - 1], n = sections[i + 1];
      stepNav.innerHTML =
        (p ? '<a class="btn" href="#' + p.id + '">' + L("← 上一部分", "← Previous") + "</a>" : "<span></span>") +
        '<span class="step-count">' + (i + 1) + " / " + sections.length + "</span>" +
        (n ? '<a class="btn primary" href="#' + n.id + '">' + L("下一部分 →", "Next →") + "</a>" : "<span></span>");
      if (fromUser) {
        history.replaceState(null, "", "#" + cur.id);
        document.getElementById("topic-head").scrollIntoView({ block: "start" });
      }
      document.dispatchEvent(new CustomEvent("sectionchange", { detail: cur.id }));
    };

    document.addEventListener("click", function (e) {
      var a = e.target.closest('#toc a, .stepnav a');
      if (!a) return;
      e.preventDefault();
      showSection(a.getAttribute("href").slice(1), true);
    });
    // 鍵盤左右鍵或簡報遙控器轉頁（輸入框內除外）
    document.addEventListener("keydown", function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      var dir = { ArrowRight: 1, PageDown: 1, ArrowLeft: -1, PageUp: -1 }[e.key];
      if (!dir) return;
      var i = sections.findIndex(function (s) { return !s.hidden; }) + dir;
      if (i < 0 || i >= sections.length) return;
      e.preventDefault();
      showSection(sections[i].id, true);
    });
    window.addEventListener("hashchange", function () { showSection(location.hash.slice(1)); });
    showSection(location.hash.slice(1));
    // 瀏覽器會自動捲到 #部分，分頁模式下改為停在頁頂，保留標題
    if (location.hash) {
      window.addEventListener("load", function () { setTimeout(function () { window.scrollTo(0, 0); }, 0); });
    }
  } else {
    var setActive = function () {
      var current = sections[0];
      sections.forEach(function (s) { if (s.getBoundingClientRect().top < 140) current = s; });
      highlight(current);
    };
    window.addEventListener("scroll", setActive, { passive: true });
    setActive();
  }

  // 上一課／下一課
  var prev = TOPICS[idx - 1], next = TOPICS[idx + 1];
  var pager = document.getElementById("pager");
  if (!pager) return;
  pager.innerHTML =
    (prev ? '<a class="prev" href="' + prev.id + '.html"><small>' + L("← 上一課", "← Previous topic") + "</small>" + topicName(prev) + "</a>" : "") +
    (next ? '<a class="next" href="' + next.id + '.html"><small>' + L("下一課 →", "Next topic →") + "</small>" + topicName(next) + "</a>" : "");
})();
