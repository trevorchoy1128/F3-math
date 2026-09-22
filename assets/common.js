// 共用：主題切換、最近瀏覽紀錄、頂部列
(function () {
  function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  // 深色 / 淺色模式
  var saved = safeGet("theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);

  window.toggleTheme = function () {
    var cur = document.documentElement.getAttribute("data-theme");
    if (!cur) cur = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    var next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    safeSet("theme", next);
  };

  // 最近瀏覽（只存在本機瀏覽器）
  window.getRecent = function () {
    try { return JSON.parse(safeGet("recent") || "[]"); } catch (e) { return []; }
  };
  window.addRecent = function (id) {
    var list = getRecent().filter(function (x) { return x !== id; });
    list.unshift(id);
    safeSet("recent", JSON.stringify(list.slice(0, 4)));
  };

  // 頂部列；root 為回到網站根目錄的相對路徑
  window.renderTopbar = function (root) {
    var el = document.getElementById("topbar");
    if (!el) return;
    el.className = "topbar";
    el.innerHTML =
      '<div class="wrap">' +
      '<a class="brand" href="' + root + 'index.html"><span class="brand-mark">S3</span>' + SITE.title + '</a>' +
      '<span class="spacer"></span>' +
      '<button class="icon-btn" type="button" onclick="toggleTheme()" aria-label="切換深色／淺色模式">◐</button>' +
      '</div>';
  };

  window.topicUrl = function (root, id) { return root + "topics/" + id + ".html"; };
})();
