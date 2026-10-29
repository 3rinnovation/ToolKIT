/* 접근성 보조: 키보드 이동, 선택 상태 표시, 움직임 줄이기, 영상 일시정지, 한 번에 소리 하나 */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function ko() { return (root.lang || "ko").indexOf("ko") === 0; }
  function t(k, e) { return ko() ? k : e; }

  function calm() { return !!(reduce && reduce.matches); }
  function syncCalm() { root.classList.toggle("a11y-calm", calm()); }
  syncCalm();
  if (reduce && reduce.addEventListener) reduce.addEventListener("change", syncCalm);

  var css = [
    ".a11y-sr { position: absolute !important; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }",
    ".a11y-skip { position: fixed; left: 16px; top: -80px; z-index: 1000; padding: 12px 20px; border-radius: 12px; background: #131C29; color: #FFFFFF !important; font: 600 16px/1.4 Pretendard, sans-serif; text-decoration: none; }",
    ".a11y-skip:focus { top: 16px; }",
    ":focus-visible { outline: 3px solid #1A7F48 !important; outline-offset: 3px !important; }",
    "[data-a11y-sel='row'][data-sel='true']::before { content: '✓'; flex: 0 0 auto; margin-right: 2px; font-weight: 800; }",
    "[data-a11y-sel='box'][data-sel='true'] { position: relative; }",
    "[data-a11y-sel='box'][data-sel='true']::after { content: '✓'; position: absolute; top: 8px; right: 8px; z-index: 2; width: 22px; height: 22px; border-radius: 999px; background: #148455; color: #FFFFFF; font: 800 13px/22px Pretendard, sans-serif; text-align: center; }",
    "[data-a11y-sel='dot'][data-sel='true'] { width: 22px !important; border-radius: 999px !important; }",
    "[data-sel='true'] { font-weight: 700; }",
    ".a11y-hero-btn { position: absolute; right: 20px; bottom: 20px; z-index: 5; display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border: 0; border-radius: 999px; background: rgba(7,9,8,0.72); color: #FFFFFF; font: 600 14px/18px Pretendard, sans-serif; cursor: pointer; }",
    ".a11y-full { position: absolute; z-index: 6; right: 14px; top: 14px; width: 42px; height: 42px; padding: 0; border: 0; border-radius: 10px; background: rgba(7,9,8,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer; }",
    ".a11y-full:hover { background: rgba(7,9,8,0.82); }",
    ".a11y-hero-btn:hover { background: rgba(7,9,8,0.88); }",
    ".a11y-calm *, .a11y-calm *::before, .a11y-calm *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }",
    ".a11y-calm iframe[style*='pointer-events: none'] { display: none !important; }"
  ].join("\n");
  var st = document.createElement("style");
  st.textContent = css;
  (document.head || root).appendChild(st);

  function isNative(el) { return /^(A|BUTTON|INPUT|SELECT|TEXTAREA|LABEL|SUMMARY|VIDEO|AUDIO|IFRAME)$/.test(el.tagName); }

  function selKind(el) {
    var r = el.getBoundingClientRect();
    if (r.width && r.width < 20 && r.height < 20) return "dot";
    var cs = getComputedStyle(el);
    var row = /flex/.test(cs.display) && cs.flexDirection.indexOf("row") === 0;
    return row && r.height < 80 ? "row" : "box";
  }

  function scan() {
    var i, el, list;

    // 마우스 전용 클릭 요소를 키보드로도 쓸 수 있게
    list = document.querySelectorAll("div[style*='cursor: pointer'], span[style*='cursor: pointer'], li[style*='cursor: pointer']");
    for (i = 0; i < list.length; i++) {
      el = list[i];
      if (el.hasAttribute("data-a11y-btn") || el.closest("a, button, [aria-hidden='true']") || el.querySelector("a, button")) continue;
      el.setAttribute("data-a11y-btn", "1");
      if (!el.hasAttribute("role")) el.setAttribute("role", "button");
      if (!el.hasAttribute("tabindex")) el.tabIndex = 0;
      if (!el.getAttribute("aria-label") && !el.textContent.trim()) {
        var img = el.querySelector("img[alt]");
        if (img && img.alt) el.setAttribute("aria-label", img.alt);
      }
    }

    // 색으로만 보이던 선택 상태를 표시·스크린리더에도 전달
    list = document.querySelectorAll("[data-sel]");
    for (i = 0; i < list.length; i++) {
      el = list[i];
      var on = el.getAttribute("data-sel") === "true";
      if (!el.hasAttribute("data-a11y-sel")) el.setAttribute("data-a11y-sel", selKind(el));
      if (el.tagName === "A") {
        if (on) el.setAttribute("aria-current", "true"); else el.removeAttribute("aria-current");
      } else if (el.getAttribute("aria-pressed") !== String(on)) {
        el.setAttribute("aria-pressed", String(on));
      }
      if (el.getAttribute("data-a11y-sel") === "dot" && !el.getAttribute("aria-label")) {
        el.setAttribute("aria-label", t("페이지 ", "Page ") + (Array.prototype.indexOf.call(el.parentNode.children, el) + 1));
      }
    }

    // 영상 프레임 이름, 미리보기용 프레임은 보조기기에서 숨김
    list = document.querySelectorAll("iframe");
    for (i = 0; i < list.length; i++) {
      el = list[i];
      if ((el.getAttribute("style") || "").indexOf("pointer-events: none") !== -1) {
        el.setAttribute("aria-hidden", "true");
        el.tabIndex = -1;
      } else if (!el.getAttribute("title")) {
        el.setAttribute("title", t("영상 플레이어", "Video player"));
      }
    }

    // 장식용 배경 영상
    list = document.querySelectorAll("video[muted], video[loop]");
    for (i = 0; i < list.length; i++) {
      if (list[i].loop || list[i].muted) list[i].setAttribute("aria-hidden", "true");
    }

    // 랜드마크: 머리말을 품은 화면 상자를 본문으로
    list = document.querySelectorAll("header");
    for (i = 0; i < list.length; i++) {
      var box = list[i].parentElement;
      if (!box || box === document.body || box.hasAttribute("role")) continue;
      box.setAttribute("role", "main");
      list[i].setAttribute("role", "none");
      var ft = box.querySelector(":scope > footer");
      if (ft) ft.setAttribute("role", "none");
    }

    fullButtons();

    heroControls();
  }

  // 모든 영상에 같은 모양의 전체 화면 버튼 (선생님 상황 영상에 있던 버튼과 동일)
  var FULL_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"></path></svg>';
  function fullButtons() {
    var list = document.querySelectorAll("iframe");
    for (var i = 0; i < list.length; i++) {
      var f = list[i], box = f.parentElement;
      if (!box || (f.getAttribute("style") || "").indexOf("pointer-events: none") !== -1) continue;
      if (!f.getAttribute("src") || f.getAttribute("src") === "about:blank") continue;
      if (box.querySelector(":scope > [title='전체 화면'], :scope > .a11y-full")) continue;
      if (getComputedStyle(box).position === "static") continue;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "a11y-full";
      b.title = t("전체 화면", "Full screen");
      b.setAttribute("aria-label", b.title);
      b.innerHTML = FULL_SVG;
      b.addEventListener("click", function (e) {
        var bx = e.currentTarget.parentElement;
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
          return;
        }
        var fn = bx.requestFullscreen || bx.webkitRequestFullscreen;
        if (fn) fn.call(bx);
        else {
          var fr = bx.querySelector("iframe");
          var vfn = fr && (fr.requestFullscreen || fr.webkitRequestFullscreen);
          if (vfn) vfn.call(fr);
        }
      });
      box.appendChild(b);
    }
  }

  // 계속 반복되는 배경 영상에 일시정지 버튼 (5초 넘게 움직이는 콘텐츠)
  function heroControls() {
    var vids = document.querySelectorAll("#shero-video, #thero-video");
    for (var i = 0; i < vids.length; i++) {
      var v = vids[i], box = v.parentElement;
      if (!box) continue;
      if (calm() && !v.__a11yCalmed) { v.__a11yCalmed = 1; v.__a11yPaused = 1; try { v.pause(); } catch (e) {} }
      if (v.__a11yPaused && !v.paused) { try { v.pause(); } catch (e) {} }
      var b = box.querySelector(":scope > .a11y-hero-btn");
      if (!b) {
        b = document.createElement("button");
        b.type = "button";
        b.className = "a11y-hero-btn";
        b.addEventListener("click", (function (vid) {
          return function () {
            vid.__a11yPaused = !vid.__a11yPaused;
            if (vid.__a11yPaused) vid.pause(); else { var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
            heroControls();
          };
        })(v));
        box.appendChild(b);
      }
      var label = v.__a11yPaused ? t("▶ 배경 영상 재생", "▶ Play background") : t("❚❚ 배경 영상 멈춤", "❚❚ Pause background");
      if (b.textContent !== label) { b.textContent = label; b.setAttribute("aria-pressed", String(!!v.__a11yPaused)); }
    }
  }

  // Enter·Space로 버튼 역할 요소 누르기
  document.addEventListener("keydown", function (e) {
    var el = e.target;
    if (!el || !el.hasAttribute || !el.hasAttribute("data-a11y-btn")) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); }
  });

  // 소리는 한 번에 하나만: 노래·영상이 겹쳐 대사가 묻히지 않도록
  document.addEventListener("play", function (e) {
    var cur = e.target;
    if (!cur || cur.muted) return;
    var all = document.querySelectorAll("audio, video");
    for (var i = 0; i < all.length; i++) {
      if (all[i] !== cur && !all[i].paused && !all[i].muted && !all[i].hasAttribute("data-a11y-bgm")) { try { all[i].pause(); } catch (err) {} }
    }
  }, true);

  function skipLink() {
    if (document.querySelector(".a11y-skip") || !document.body) return;
    var a = document.createElement("a");
    a.className = "a11y-skip";
    a.href = "#";
    a.textContent = t("본문 바로가기", "Skip to content");
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var m = Array.prototype.filter.call(document.querySelectorAll("[role='main'], main, section[data-screen-label]"), function (x) { return x.offsetParent; })[0];
      if (!m) return;
      if (!m.hasAttribute("tabindex")) m.tabIndex = -1;
      m.focus();
    });
    document.body.insertBefore(a, document.body.firstChild);
  }

  function start() {
    skipLink();
    scan();
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; scan(); });
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-sel"] });
  }
  if (document.readyState !== "loading") start(); else document.addEventListener("DOMContentLoaded", start);
})();
