(function () {
  "use strict";

  function initSlideshow() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".slide-dot"));
    var current = slides.findIndex(function (slide) {
      return slide.classList.contains("active");
    });
    var timer = null;

    if (!slides.length) return;
    if (current < 0) current = 0;

    function setSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
      });
    }

    function startAuto() {
      if (slides.length > 1) {
        timer = window.setInterval(function () {
          setSlide(current + 1);
        }, 5000);
      }
    }

    window.goSlide = function (index) {
      if (timer) window.clearInterval(timer);
      setSlide(index);
      startAuto();
    };

    setSlide(current);
    startAuto();
  }

  function initJumpNavs() {
    var navs = Array.prototype.slice.call(document.querySelectorAll("[data-jump-nav]"));
    if (!navs.length) return;

    function updateNavHeight() {
      var nav = document.querySelector("nav");
      if (nav) document.documentElement.style.setProperty("--nav-h", nav.offsetHeight + "px");
    }

    function navHeight() {
      var raw = getComputedStyle(document.documentElement).getPropertyValue("--nav-h");
      var parsed = parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : 42;
    }

    function jumpOffset() {
      var row = document.querySelector(".jump-row");
      var rowPosition = row ? window.getComputedStyle(row).position : "";
      var rowOffset = row && (rowPosition === "sticky" || rowPosition === "fixed") ? row.offsetHeight : 0;
      return navHeight() + rowOffset + 12;
    }

    function setActive(nav, id) {
      if (!nav) return;
      nav.querySelectorAll(".jump-option[data-jump-target]").forEach(function (option) {
        option.classList.toggle("active", option.dataset.jumpTarget === id);
      });
    }

    function resetMenuStyles(menu) {
      if (!menu) return;
      menu.style.position = "";
      menu.style.left = "";
      menu.style.right = "";
      menu.style.top = "";
      menu.style.bottom = "";
      menu.style.width = "";
      menu.style.maxHeight = "";
    }

    function closeNav(nav) {
      if (!nav) return;
      nav.classList.remove("is-open", "jump-up");
      resetMenuStyles(nav.querySelector(".jump-menu"));
    }

    function closeOtherNavs(current) {
      document.querySelectorAll("[data-jump-nav].is-open").forEach(function (nav) {
        if (nav !== current) closeNav(nav);
      });
    }

    function positionMenu(nav) {
      if (!nav || !nav.classList.contains("is-open")) return;
      var toggle = nav.querySelector(".jump-toggle");
      var menu = nav.querySelector(".jump-menu");
      if (!toggle || !menu) return;

      resetMenuStyles(menu);
      nav.classList.remove("jump-up");

      var toggleRect = toggle.getBoundingClientRect();
      var viewportW = window.innerWidth || document.documentElement.clientWidth;
      var viewportH = window.innerHeight || document.documentElement.clientHeight;

      if (viewportW <= 820) {
        var pad = 12;
        var availableBelow = viewportH - toggleRect.bottom - pad;
        var preferredHeight = availableBelow > 150 ? availableBelow : viewportH * 0.42;
        menu.style.maxHeight = Math.max(130, Math.min(220, preferredHeight)) + "px";
        return;
      }

      var menuHeight = Math.min(menu.scrollHeight || 0, viewportH * 0.62, 430);
      if (viewportH - toggleRect.bottom < menuHeight + 16 && toggleRect.top > menuHeight + 16) {
        nav.classList.add("jump-up");
      }
    }

    function positionOpenMenus() {
      document.querySelectorAll("[data-jump-nav].is-open").forEach(positionMenu);
    }

    window.labJumpTo = function (id, trigger) {
      var target = id ? document.getElementById(id) : null;
      if (!target) return;

      if (target.classList.contains("rx-domain")) {
        target.classList.add("open");
      }

      var top = target.getBoundingClientRect().top + window.pageYOffset - jumpOffset();
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      history.replaceState(null, "", "#" + id);

      var nav = trigger ? trigger.closest("[data-jump-nav]") : null;
      if (nav) {
        setActive(nav, id);
        closeNav(nav);
      }
    };

    updateNavHeight();
    window.addEventListener("resize", function () {
      updateNavHeight();
      positionOpenMenus();
    });
    if (window.visualViewport) window.visualViewport.addEventListener("resize", positionOpenMenus);
    window.setTimeout(updateNavHeight, 250);

    navs.forEach(function (nav) {
      if (nav.dataset.jumpReady) return;
      nav.dataset.jumpReady = "true";

      var toggle = nav.querySelector(".jump-toggle");
      var options = nav.querySelectorAll(".jump-option[data-jump-target]");

      if (toggle) {
        toggle.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          var willOpen = !nav.classList.contains("is-open");
          closeOtherNavs(nav);
          nav.classList.toggle("is-open", willOpen);
          if (willOpen) window.requestAnimationFrame(function () { positionMenu(nav); });
          else closeNav(nav);
        });
      }

      options.forEach(function (option) {
        option.addEventListener("click", function () {
          window.labJumpTo(option.dataset.jumpTarget, option);
        });
      });
    });

    document.addEventListener("click", function (event) {
      document.querySelectorAll("[data-jump-nav].is-open").forEach(function (nav) {
        if (!nav.contains(event.target)) closeNav(nav);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      document.querySelectorAll("[data-jump-nav].is-open").forEach(closeNav);
    });

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        document.querySelectorAll("[data-jump-nav]").forEach(function (nav) {
          var options = Array.prototype.slice.call(nav.querySelectorAll(".jump-option[data-jump-target]"));
          var current = options[0] ? options[0].dataset.jumpTarget : "";
          options.forEach(function (option) {
            var target = document.getElementById(option.dataset.jumpTarget);
            if (target && target.getBoundingClientRect().top <= jumpOffset() + 32) {
              current = option.dataset.jumpTarget;
            }
          });
          setActive(nav, current);
        });
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (location.hash) {
      var id = location.hash.slice(1);
      if (document.getElementById(id)) {
        window.setTimeout(function () { window.labJumpTo(id); }, 180);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initSlideshow();
      initJumpNavs();
    });
  } else {
    initSlideshow();
    initJumpNavs();
  }
}());
