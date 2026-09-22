// 課題頁：根據 <body data-topic="..."> 自動加入頂部列、麵包屑、標題、目錄及上／下一課
(function () {
  var ROOT = "../";
  renderTopbar(ROOT);

  var id = document.body.getAttribute("data-topic");
  var idx = TOPICS.findIndex(function (t) { return t.id === id; });
  var t = TOPICS[idx];
  if (!t) return;
  var strand = STRANDS.filter(function (s) { return s.id === t.strand; })[0];

  document.body.setAttribute("data-strand", t.strand);
  document.title = t.zh + "｜" + SITE.title;
  addRecent(t.id);

  // 標題區
  var head = document.getElementById("topic-head");
  head.innerHTML =
    '<nav class="crumbs"><a href="' + ROOT + 'index.html">主頁</a> › ' + strand.name + " › " + t.zh + "</nav>" +
    '<div class="topic-hero"><span class="tag">' + strand.name + "</span>" +
    "<h1>" + t.zh + "</h1><p class=\"en\">" + t.en + "</p></div>";

  // 目錄（由頁內每個 .section 自動產生）
  var sections = Array.prototype.slice.call(document.querySelectorAll(".section[id]"));
  var toc = document.getElementById("toc");
  toc.innerHTML = sections.map(function (s) {
    return '<a href="#' + s.id + '">' + s.querySelector("h2").textContent + "</a>";
  }).join("");
  var links = Array.prototype.slice.call(toc.querySelectorAll("a"));

  function setActive() {
    var current = sections[0];
    sections.forEach(function (s) { if (s.getBoundingClientRect().top < 140) current = s; });
    links.forEach(function (a) {
      var on = a.getAttribute("href") === "#" + current.id;
      a.classList.toggle("active", on);
      if (on && toc.scrollWidth > toc.clientWidth) a.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }
  window.addEventListener("scroll", setActive, { passive: true });
  setActive();

  // 上一課／下一課
  var prev = TOPICS[idx - 1], next = TOPICS[idx + 1];
  var pager = document.getElementById("pager");
  pager.innerHTML =
    (prev ? '<a class="prev" href="' + prev.id + '.html"><small>← 上一課</small>' + prev.zh + "</a>" : "") +
    (next ? '<a class="next" href="' + next.id + '.html"><small>下一課 →</small>' + next.zh + "</a>" : "");
})();
