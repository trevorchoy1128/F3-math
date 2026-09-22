// 共用：語言、主題切換、最近瀏覽紀錄、頂部列
(function () {
  function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  // 中英切換：
  // - 固定文字：在 HTML 中並排寫 <span data-l="zh">中文</span><span data-l="en">English</span>，CSS 只顯示目前語言
  // - 由 JS 產生的文字：用 L("中文", "English")
  // - 屬性：data-en-placeholder / data-en-aria-label 會在英文模式取代原屬性
  window.LANG = safeGet("lang") === "en" ? "en" : "zh";
  document.documentElement.setAttribute("data-lang", LANG);
  document.documentElement.lang = LANG === "en" ? "en" : "zh-Hant-HK";
  window.L = function (zh, en) { return LANG === "en" ? en : zh; };
  window.setLang = function (lang) {
    safeSet("lang", lang);
    location.reload(); // 重新載入，讓所有由 JS 產生的內容以新語言重畫；網址的 #部分 會保留
  };
  document.addEventListener("DOMContentLoaded", function () {
    if (LANG !== "en") return;
    ["placeholder", "aria-label"].forEach(function (attr) {
      document.querySelectorAll("[data-en-" + attr + "]").forEach(function (el) {
        el.setAttribute(attr, el.getAttribute("data-en-" + attr));
      });
    });
  });

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

  // 課題及範疇名稱（按目前語言）
  window.topicName = function (t) { return L(t.zh, t.en); };
  window.strandName = function (s) { return L(s.name, s.en); };

  // 頂部列；root 為回到網站根目錄的相對路徑
  window.renderTopbar = function (root) {
    var el = document.getElementById("topbar");
    if (!el) return;
    el.className = "topbar";
    el.innerHTML =
      '<div class="wrap">' +
      '<a class="brand" href="' + root + 'index.html"><span class="brand-mark">S3</span>' + L(SITE.title, SITE.titleEn) + "</a>" +
      '<span class="spacer"></span>' +
      '<button class="icon-btn lang-btn" type="button" onclick="setLang(\'' + L("en", "zh") + '\')" lang="' + L("en", "zh-Hant") + '"' +
      ' aria-label="' + L("Switch to English", "切換至中文") + '">' + L("EN", "中文") + "</button>" +
      '<button class="icon-btn" type="button" onclick="toggleTheme()" aria-label="' + L("切換深色／淺色模式", "Toggle dark / light mode") + '">◐</button>' +
      "</div>";
  };

  window.topicUrl = function (root, id) { return root + "topics/" + id + ".html"; };
})();
