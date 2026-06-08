(function () {
  "use strict";

  function isExternalAssetUrl(raw) {
    var value = String(raw || "").trim();
    if (!value || value.charAt(0) === "#") return false;
    if (/^data:/i.test(value)) return true;
    if (!/^(?:https?:)?\/\//i.test(value)) return false;

    try {
      var url = new URL(value, window.location.href);
      if (url.origin === window.location.origin) return false;
      return !isAllowedExternalAssetUrl(url);
    } catch (error) {
      return true;
    }
  }

  function isAllowedExternalAssetUrl(url) {
    var host = url.hostname.toLowerCase();
    var path = url.pathname || "";

    if (host === "i.ytimg.com" || host.endsWith(".ytimg.com")) return true;
    if ((host === "www.youtube.com" || host === "www.youtube-nocookie.com") && path.indexOf("/embed/") === 0) return true;
    if (host === "www.google.com" && path.indexOf("/maps/embed") === 0) return true;
    if (host === "www.facebook.com" && path.indexOf("/plugins/page.php") === 0) return true;

    return false;
  }

  function scrubExternalAssets(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var nodes = Array.prototype.slice.call(scope.querySelectorAll("img[src], img[srcset], source[srcset], iframe[src]"));

    if (scope.matches && scope.matches("img[src], img[srcset], source[srcset], iframe[src]")) {
      nodes.push(scope);
    }

    nodes.forEach(function (node) {
      var src = node.getAttribute("src");
      var srcset = node.getAttribute("srcset");
      if (src && isExternalAssetUrl(src)) {
        node.setAttribute("data-blocked-external-src", src);
        node.removeAttribute("src");
        if (node.tagName === "IFRAME") node.remove();
      }
      if (srcset && isExternalAssetUrl(srcset)) {
        node.setAttribute("data-blocked-external-srcset", srcset);
        node.removeAttribute("srcset");
      }
    });
  }

  function initAssetGuard() {
    scrubExternalAssets(document);
    if (!("MutationObserver" in window)) return;

    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "attributes") {
          scrubExternalAssets(mutation.target);
        } else {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) scrubExternalAssets(node);
          });
        }
      });
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["src", "srcset"],
      childList: true,
      subtree: true
    });
  }

  function initImageFallbacks() {
    document.querySelectorAll("img[data-fallback-image]").forEach(function (img) {
      if (img.dataset.fallbackReady) return;
      img.dataset.fallbackReady = "true";

      img.addEventListener("error", function () {
        var fallback = img.nextElementSibling;
        img.style.display = "none";
        if (fallback) fallback.style.display = "flex";
      });
    });
  }

  function initSlideshow() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
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
    }

    function startAuto() {
      if (slides.length > 1) {
        timer = window.setInterval(function () {
          setSlide(current + 1);
        }, 12000);
      }
    }

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

    function labJumpTo(id, trigger) {
      var target = id ? document.getElementById(id) : null;
      if (!target) return;

      if (target.classList.contains("rx-domain")) {
        document.querySelectorAll(".rx-domain.open").forEach(function (domain) {
          if (domain !== target) domain.classList.remove("open");
        });
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
    }

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
          labJumpTo(option.dataset.jumpTarget, option);
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
        window.setTimeout(function () { labJumpTo(id); }, 180);
      }
    }
  }

  function initPublicationsPage() {
    var page = document.getElementById("page-publications");
    if (!page || page.dataset.publicationsReady) return;
    page.dataset.publicationsReady = "true";

    var allPubs = [];
    var loaded = false;
    var activeChip = "all";
    var resultScrollTimer = null;
    var cjkRe = /[\u3000-\u9fff\uf900-\ufaff]+/g;
    var cjkParenRe = new RegExp("\\s*\\([^)]*[\\u3000-\\u9fff\\uf900-\\ufaff][^)]*\\)", "g");
    var dataTemplate = document.getElementById("pub-publications-data");
    var figureTemplate = document.getElementById("pub-figures-data");
    var siteBaseurl = dataTemplate ? dataTemplate.dataset.siteBaseurl || "" : "";
    var openAlexAuthorOrcid = dataTemplate ? dataTemplate.dataset.openalexAuthorOrcid || "" : "";
    var openAlexMailto = dataTemplate ? dataTemplate.dataset.openalexMailto || "" : "";
    var localPublications = readJsonTemplate(dataTemplate, []);
    var figureEntries = readJsonTemplate(figureTemplate, []);
    var openAlexApiBase = "https://api.openalex.org";
    var openAlexPageLimit = 4;
    var citingCache = {};

    function byId(id) {
      return id ? document.getElementById(id) : null;
    }

    function setDataStatus(label) {
      var status = byId("pub-data-status-text");
      if (status) status.textContent = label;
    }

    function readJsonTemplate(template, fallback) {
      if (!template) return fallback;
      try {
        return JSON.parse(template.textContent || "[]");
      } catch (error) {
        return fallback;
      }
    }

    function escapeHtml(raw) {
      return String(raw == null ? "" : raw).replace(/[&<>"']/g, function (ch) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "\"": "&quot;",
          "'": "&#39;"
        }[ch];
      });
    }

    function escapeAttr(raw) {
      return escapeHtml(raw).replace(/`/g, "&#96;");
    }

    function normaliseDoi(raw) {
      return String(raw || "")
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
        .replace(/^doi:/, "")
        .replace(/\/$/, "");
    }

    function openAlexKey(work) {
      return String(work && work.id || "").replace("https://openalex.org/", "");
    }

    function workKey(work) {
      return openAlexKey(work) || normaliseDoi(work && work.doi) || String(work && work.title || "") + "|" + String(work && work.publication_year || "");
    }

    function normalizeWork(work) {
      if (!work) return null;
      return {
        id: work.id || "",
        doi: work.doi || "",
        title: work.title || work.display_name || "",
        publication_year: work.publication_year || "",
        cited_by_count: work.cited_by_count || 0,
        referenced_works_count: work.referenced_works_count || 0,
        open_access: work.open_access || {},
        primary_location: work.primary_location || {},
        authorships: work.authorships || [],
        concepts: work.concepts || [],
        topics: work.topics || [],
        keywords: work.keywords || []
      };
    }

    function mergeWorks(primary, fallback) {
      var seen = {};
      var merged = [];

      function add(work) {
        var normalized = normalizeWork(work);
        var key;
        if (!normalized) return;
        key = workKey(normalized);
        if (!key || seen[key]) return;
        seen[key] = true;
        merged.push(normalized);
      }

      (primary || []).forEach(add);
      (fallback || []).forEach(add);
      return merged;
    }

    function appendMailto(url) {
      if (openAlexMailto) url.searchParams.set("mailto", openAlexMailto);
      return url;
    }

    function fetchJson(url) {
      var controller = "AbortController" in window ? new AbortController() : null;
      var timer = controller ? window.setTimeout(function () {
        controller.abort();
      }, 10000) : null;
      var options = controller ? { signal: controller.signal } : {};

      return window.fetch(url.toString(), options).then(function (response) {
        if (timer) window.clearTimeout(timer);
        if (!response.ok) throw new Error("OpenAlex returned HTTP " + response.status);
        return response.json();
      }, function (error) {
        if (timer) window.clearTimeout(timer);
        throw error;
      });
    }

    function fetchOpenAlexAuthor() {
      var id = openAlexAuthorOrcid ? "orcid:" + openAlexAuthorOrcid : "";
      var url;
      if (!id) throw new Error("Missing OpenAlex author ORCID");
      url = new URL(openAlexApiBase + "/authors/" + encodeURIComponent(id));
      url.searchParams.set("select", "id,display_name,works_api_url,cited_by_count");
      return fetchJson(appendMailto(url));
    }

    function fetchOpenAlexWorks() {
      return fetchOpenAlexAuthor().then(function (author) {
        var authorId = String(author && author.id || "").replace("https://openalex.org/", "");
        var works = [];
        var seen = {};
        var cursor = "*";

        if (!authorId) throw new Error("OpenAlex author profile was missing an ID");

        function fetchPage(pageIndex) {
          var url;
          if (pageIndex >= openAlexPageLimit) return Promise.resolve(works);

          url = new URL(openAlexApiBase + "/works");
          url.searchParams.set("filter", "author.id:" + authorId);
          url.searchParams.set("sort", "cited_by_count:desc");
          url.searchParams.set("per-page", "100");
          url.searchParams.set("cursor", cursor);
          url.searchParams.set("select", "id,doi,title,display_name,publication_year,cited_by_count,referenced_works_count,open_access,primary_location,authorships,concepts,topics,keywords");

          return fetchJson(appendMailto(url)).then(function (data) {
            var results = data && data.results || [];
            results.forEach(function (work) {
              var key = workKey(work);
              if (!key || seen[key]) return;
              seen[key] = true;
              works.push(work);
            });

            cursor = data && data.meta && data.meta.next_cursor;
            if (!cursor || !results.length) return works;
            return fetchPage(pageIndex + 1);
          });
        }

        return fetchPage(0);
      });
    }

    function domId(raw, fallback) {
      var id = String(raw || fallback || "")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return id || String(fallback || "pub-item");
    }

    function sourceName(work) {
      var location = work && work.primary_location;
      var source = location && location.source;
      return source && source.display_name || "";
    }

    function authorsFor(work) {
      return (work && work.authorships || [])
        .slice(0, 5)
        .map(function (item) {
          return item && item.author && item.author.display_name || "";
        })
        .filter(Boolean)
        .join(", ");
    }

    function assetUrl(path) {
      var src = String(path || "").trim();
      if (!src || /^(?:https?:)?\/\//i.test(src) || /^data:/i.test(src)) return "";
      var cleanBase = siteBaseurl.replace(/\/$/, "");
      var cleanPath = src.charAt(0) === "/" ? src : "/" + src;
      if (cleanPath.indexOf("/assets/images/") !== 0) return "";
      return cleanBase + cleanPath;
    }

    function figuresForWork(work) {
      var doi = normaliseDoi(work && work.doi);
      var title = String(work && work.title || "").toLowerCase();
      var exact = figureEntries.filter(function (entry) {
        return entry.doi && normaliseDoi(entry.doi) === doi;
      });
      var fallback = exact.length ? [] : figureEntries.filter(function (entry) {
        var match = String(entry.match || "").toLowerCase().trim();
        return match && title.indexOf(match) !== -1;
      });
      var seen = {};

      return exact.concat(fallback).reduce(function (items, entry) {
        (entry.figures || []).forEach(function (fig) {
          var item = {
            img: assetUrl(fig.img),
            href: fig.href || "",
            alt: fig.alt || entry.label || "Publication figure",
            caption: fig.caption || entry.label || "Publication figure"
          };
          var key = item.img + "|" + item.caption;
          if (item.img && !seen[key]) {
            seen[key] = true;
            items.push(item);
          }
        });
        return items;
      }, []);
    }

    function formatCount(value) {
      return Number(value || 0).toLocaleString();
    }

    function workTopics(work) {
      var seen = {};
      var topics = (work && work.topics || []).map(function (topic) {
        return topic && topic.display_name || "";
      });
      var concepts = (work && work.concepts || []).filter(function (concept) {
        return concept && concept.display_name && (concept.score || 0) > 0.25 && (concept.level || 0) > 0;
      }).map(function (concept) {
        return concept.display_name;
      });
      var keywords = (work && work.keywords || []).filter(function (keyword) {
        return keyword && keyword.display_name && (keyword.score || 0) > 0.45;
      }).map(function (keyword) {
        return keyword.display_name;
      });

      return topics.concat(concepts, keywords).filter(function (label) {
        var key = String(label || "").toLowerCase();
        if (!key || seen[key]) return false;
        seen[key] = true;
        return true;
      }).slice(0, 4);
    }

    function metricPill(label, value, className) {
      if (value == null || value === "" || Number(value) < 0) return "";
      return '<span class="pub-metric ' + className + '" title="' + escapeAttr(label) + '"><span class="pub-metric-icon"></span><span class="visually-hidden">' + escapeHtml(label) + '</span>' + (value === true ? "" : '<span class="pub-metric-value">' + escapeHtml(value) + '</span>') + '</span>';
    }

    function renderFigurePreview(figures) {
      if (!figures.length) return "";
      return '<div class="pub-figure-preview">' + figures.slice(0, 3).map(function (fig, index) {
        return '<button class="pub-figure-preview-btn" type="button" data-pub-figure-thumb data-img="' + escapeAttr(fig.img) + '" data-href="' + escapeAttr(fig.href) + '" data-alt="' + escapeAttr(fig.alt) + '" data-caption="' + escapeAttr(fig.caption) + '"><img src="' + escapeAttr(fig.img) + '" alt="' + escapeAttr(fig.alt) + '" loading="lazy"><span>Fig. ' + (index + 1) + '</span></button>';
      }).join("") + (figures.length > 3 ? '<span class="pub-figure-preview-more">+' + (figures.length - 3) + '</span>' : "") + '</div>';
    }

    function renderCitingItems(data) {
      var results = data && data.results || [];
      if (!results.length) return '<div class="pub-panel-note">No citing papers found in OpenAlex yet.</div>';
      return '<div class="pub-citing-list">' + results.map(function (work) {
        var authors = escapeHtml(authorsFor(work));
        var more = (work.authorships || []).length > 5 ? " et al." : "";
        var journal = cleanJournal(sourceName(work));
        var year = work.publication_year || "";
        var cites = work.cited_by_count || 0;
        return '<a class="pub-citing-item" href="' + escapeAttr(workUrl(work)) + '" target="_blank" rel="noopener noreferrer">' +
          '<div class="pub-citing-title">' + cleanTitle(work.title) + '</div>' +
          '<div class="pub-citing-meta">' + (authors || "Unknown authors") + more + ' · ' + (journal || "—") + ' · ' + year + ' · ' + formatCount(cites) + ' cit.</div>' +
          '</a>';
      }).join("") + '</div>';
    }

    function fetchCitingWorks(workId) {
      var url;
      if (!workId) return Promise.resolve({ results: [], count: 0 });
      if (citingCache[workId]) return citingCache[workId];

      url = new URL(openAlexApiBase + "/works");
      url.searchParams.set("filter", "cites:" + workId);
      url.searchParams.set("sort", "publication_year:desc");
      url.searchParams.set("per-page", "8");
      url.searchParams.set("select", "id,doi,title,display_name,publication_year,cited_by_count,primary_location,authorships");

      citingCache[workId] = fetchJson(appendMailto(url)).then(function (data) {
        return {
          count: data && data.meta && data.meta.count || 0,
          results: data && data.results || []
        };
      });
      return citingCache[workId];
    }

    function toggleCitingPanel(panelId, button) {
      var panel = byId(panelId);
      var shouldOpen;
      if (!panel) return;
      shouldOpen = panel.hidden;
      panel.hidden = !shouldOpen;
      button.classList.toggle("is-open", shouldOpen);
      if (!shouldOpen || panel.dataset.loaded) return;

      panel.innerHTML = '<div class="pub-panel-title">Citing papers</div><div class="pub-panel-loading">Loading OpenAlex citing papers...</div>';
      fetchCitingWorks(button.dataset.workId).then(function (data) {
        panel.dataset.loaded = "true";
        panel.innerHTML = '<div class="pub-panel-title">Citing papers <span class="pub-panel-count">' + formatCount(data.count) + '</span></div>' + renderCitingItems(data);
      }).catch(function (error) {
        panel.innerHTML = '<div class="pub-panel-title">Citing papers</div><div class="pub-panel-note">Could not load citing papers from OpenAlex: ' + escapeHtml(error.message) + '</div>';
      });
    }

    function cleanTitle(raw) {
      if (!raw) return "Untitled";
      var tmp = document.createElement("div");
      tmp.innerHTML = raw;
      var text = (tmp.textContent || tmp.innerText || "")
        .replace(/\$([^$]+)\$/g, "$1")
        .replace(cjkParenRe, "")
        .replace(cjkRe, "")
        .replace(/\s+/g, " ")
        .trim();
      return escapeHtml(text || "Untitled");
    }

    function cleanJournal(raw) {
      if (!raw) return "";
      return escapeHtml(String(raw).replace(cjkRe, "").replace(/\s+/g, " ").trim());
    }

    function workUrl(work) {
      if (work && work.doi) return "https://doi.org/" + normaliseDoi(work.doi);
      return work && work.id || "#";
    }

    function focusResultsOnMobile() {
      if (!window.matchMedia("(max-width: 700px)").matches) return;
      clearTimeout(resultScrollTimer);
      resultScrollTimer = window.setTimeout(function () {
        var main = byId("pub-list-section");
        if (main) main.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 160);
    }

    function setHidden(id, hidden) {
      var node = byId(id);
      if (node) node.hidden = hidden;
      return node;
    }

    function renderYearChart(container, works) {
      var yearMap = {};
      var chartStartYear = 2005;
      var currentYear = new Date().getFullYear();
      var years;
      var minYear;
      var maxYear;
      var maxCount;
      var allYears;
      var tickYears;
      var chart;
      var axis;

      works.forEach(function (work) {
        var year = Number(work.publication_year);
        if (year && year >= chartStartYear && year <= currentYear) {
          yearMap[year] = (yearMap[year] || 0) + 1;
        }
      });

      years = Object.keys(yearMap).map(Number).sort(function (a, b) { return a - b; });
      container.className = "bar-chart-wrap";
      container.innerHTML = "";

      if (!years.length) {
        container.innerHTML = '<div class="pub-panel-note">No year data available</div>';
        return;
      }

      minYear = years[0];
      maxYear = years[years.length - 1];
      maxCount = Math.max.apply(Math, Object.keys(yearMap).map(function (year) { return yearMap[year]; }));
      allYears = Array.from({ length: maxYear - minYear + 1 }, function (_, i) { return minYear + i; });
      tickYears = [minYear];

      for (var year = Math.ceil(minYear / 5) * 5; year <= maxYear; year += 5) {
        if (year > minYear + 2 && year < maxYear - 2) tickYears.push(year);
      }
      if (maxYear !== minYear) tickYears.push(maxYear);

      chart = document.createElement("div");
      chart.className = "bar-chart";
      allYears.forEach(function (year) {
        var count = yearMap[year] || 0;
        var height = count ? Math.max(4, Math.round((count / maxCount) * 100)) : 0;
        var col = document.createElement("div");
        var fill = document.createElement("div");
        col.className = "bar-col";
        fill.className = "bar-fill" + (count ? "" : " is-empty");
        fill.dataset.tip = year + ": " + count;
        fill.style.height = height + "%";
        col.appendChild(fill);
        chart.appendChild(col);
      });

      axis = document.createElement("div");
      axis.className = "bar-axis";
      tickYears.filter(function (year, index, list) {
        return list.indexOf(year) === index;
      }).sort(function (a, b) { return a - b; }).forEach(function (year) {
        var pos = maxYear === minYear ? 50 : ((year - minYear) / (maxYear - minYear)) * 100;
        var label = document.createElement("span");
        label.className = "bar-axis-label" + (pos <= 1 ? " edge-start" : (pos >= 99 ? " edge-end" : ""));
        label.style.left = pos + "%";
        label.textContent = year;
        axis.appendChild(label);
      });

      container.appendChild(chart);
      container.appendChild(axis);
    }

    function renderJournalChart(container, works) {
      var journalMap = {};
      var topJournals;
      var maxCount;

      works.forEach(function (work) {
        var journal = sourceName(work);
        if (journal) journalMap[journal] = (journalMap[journal] || 0) + 1;
      });

      topJournals = Object.keys(journalMap).map(function (name) {
        return [name, journalMap[name]];
      }).sort(function (a, b) {
        return b[1] - a[1];
      }).slice(0, 6);

      maxCount = topJournals[0] && topJournals[0][1] || 1;
      container.className = "";
      container.innerHTML = "";

      topJournals.forEach(function (entry) {
        var row = document.createElement("div");
        var label = document.createElement("div");
        var track = document.createElement("div");
        var fill = document.createElement("div");
        var value = document.createElement("div");
        row.className = "hbar-row";
        label.className = "hbar-label";
        label.title = entry[0];
        label.textContent = entry[0];
        track.className = "hbar-track";
        fill.className = "hbar-fill";
        fill.style.width = Math.round((entry[1] / maxCount) * 100) + "%";
        value.className = "hbar-val";
        value.textContent = entry[1];
        track.appendChild(fill);
        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(value);
        container.appendChild(row);
      });
    }

    function renderCitationChart(container, works) {
      var tiers = [
        { label: "100+ cit.", color: "#24448e", min: 100 },
        { label: "50-99", color: "#335fa8", min: 50 },
        { label: "10-49", color: "#4d7fb0", min: 10 },
        { label: "1-9", color: "#c7d9f2", min: 1 },
        { label: "0 cit.", color: "#e0e4ec", min: 0 }
      ];
      var total = works.length || 1;
      var cumulative = 0;
      var donutSize = 92;
      var radius = 31;
      var center = 46;
      var strokeWidth = 14;
      var circumference = 2 * Math.PI * radius;
      var segments = tiers.map(function (tier, index) {
        var max = tiers[index - 1] ? tiers[index - 1].min : Infinity;
        var count = works.filter(function (work) {
          var cites = work.cited_by_count || 0;
          return cites >= tier.min && cites < max;
        }).length;
        var pct = count / total;
        var start = cumulative;
        cumulative += pct;
        return { pct: pct, start: start, color: tier.color, label: tier.label, count: count };
      });

      container.className = "donut-wrap";
      container.innerHTML = '<svg class="donut-svg" width="' + donutSize + '" height="' + donutSize + '" viewBox="0 0 ' + donutSize + ' ' + donutSize + '">' +
        '<title>Citation tiers donut chart</title>' +
        '<circle cx="' + center + '" cy="' + center + '" r="' + radius + '" fill="none" stroke="#e8edf4" stroke-width="' + strokeWidth + '"/>' +
        segments.filter(function (segment) { return segment.pct > 0; }).map(function (segment) {
          var dash = segment.pct * circumference;
          var offset = circumference - segment.start * circumference;
          return '<circle cx="' + center + '" cy="' + center + '" r="' + radius + '" fill="none" stroke="' + segment.color + '" stroke-width="' + strokeWidth + '" stroke-dasharray="' + dash + ' ' + Math.max(0, circumference - dash) + '" stroke-dashoffset="' + offset + '" stroke-linecap="butt" transform="rotate(-90 ' + center + ' ' + center + ')"/>';
        }).join("") +
        '<circle cx="' + center + '" cy="' + center + '" r="' + (radius - (strokeWidth / 2) - 1) + '" fill="#fff"/>' +
        '<text x="' + center + '" y="' + (center - 3) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#1f2d4f">' + total + '</text>' +
        '<text x="' + center + '" y="' + (center + 8) + '" text-anchor="middle" font-size="6.5" fill="#888">papers</text>' +
        '</svg><div class="donut-legend">' + segments.map(function (segment, index) {
          return '<div class="donut-leg-item"><div class="donut-dot donut-dot-tier-' + index + '"></div><span>' + segment.label + ' <strong>(' + segment.count + ')</strong></span></div>';
        }).join("") + '</div>';
    }

    function renderCharts(works) {
      var yearChart = byId("chart-year");
      var journalChart = byId("chart-journals");
      var citationChart = byId("chart-cites");
      if (yearChart) renderYearChart(yearChart, works);
      if (journalChart) renderJournalChart(journalChart, works);
      if (citationChart) renderCitationChart(citationChart, works);
    }

    function toggleFigurePanel(panelId, button) {
      var panel = byId(panelId);
      var shouldOpen;
      if (!panel) return;
      shouldOpen = panel.hidden;
      panel.hidden = !shouldOpen;
      button.classList.toggle("is-open", shouldOpen);
    }

    function openFigure(button) {
      var box = byId("pub-lightbox");
      var img = byId("pub-lightbox-img");
      var caption = byId("pub-lightbox-caption");
      var source = byId("pub-lightbox-source");
      var nextImg = button.dataset.img || "";
      if (!box || !img || !caption || !source) return;
      if (!nextImg || /^(?:https?:)?\/\//i.test(nextImg) || /^data:/i.test(nextImg)) return;

      img.src = nextImg;
      img.alt = button.dataset.alt || "";
      caption.textContent = button.dataset.caption || button.dataset.alt || "Publication figure";
      if (button.dataset.href) {
        source.href = button.dataset.href;
        source.hidden = false;
      } else {
        source.hidden = true;
        source.removeAttribute("href");
      }

      if (typeof box.showModal === "function") box.showModal();
      else box.setAttribute("open", "");
      document.body.style.overflow = "hidden";
    }

    function closeFigure(event) {
      var box = byId("pub-lightbox");
      var img = byId("pub-lightbox-img");
      var isBackdrop = event && event.target && event.target.id === "pub-lightbox";
      var isClose = event && event.target && event.target.closest && event.target.closest(".pub-lightbox-close");

      if (event && !isBackdrop && !isClose) return;
      if (event) event.stopPropagation();
      if (box && typeof box.close === "function" && box.open) box.close();
      else if (box) box.removeAttribute("open");
      if (img) img.src = "";
      document.body.style.overflow = "";
    }

    function toggleSidebarSection(header) {
      var body = header.nextElementSibling;
      header.classList.toggle("collapsed");
      if (body) body.classList.toggle("collapsed");
    }

    function selectChip(button) {
      page.querySelectorAll(".pchip").forEach(function (chip) {
        chip.classList.remove("active");
      });
      button.classList.add("active");
      activeChip = button.dataset.filter;
      renderPubs();
      focusResultsOnMobile();
    }

    function renderPubs() {
      var query;
      var sort;
      var list;
      var bar;
      var listNode;

      if (!allPubs.length) return;

      query = (byId("pub-search-input") && byId("pub-search-input").value || "").toLowerCase();
      sort = byId("pub-sort-select") && byId("pub-sort-select").value || "cites";

      list = allPubs.filter(function (work) {
        var year = work.publication_year || 0;
        var cites = work.cited_by_count || 0;
        var isOpenAccess = work.open_access && work.open_access.is_oa;
        var title;
        var auth;
        var journal;

        if (activeChip === "cited50" && cites < 50) return false;
        if (activeChip === "cited100" && cites < 100) return false;
        if (activeChip === "2020s" && year < 2020) return false;
        if (activeChip === "2010s" && (year < 2010 || year >= 2020)) return false;
        if (activeChip === "pre2010" && year >= 2010) return false;
        if (activeChip === "oa" && !isOpenAccess) return false;
        if (!query) return true;

        title = (work.title || "").toLowerCase();
        auth = (work.authorships || []).map(function (item) {
          return item && item.author && item.author.display_name || "";
        }).join(" ").toLowerCase();
        journal = sourceName(work).toLowerCase();
        return title.indexOf(query) !== -1 || auth.indexOf(query) !== -1 || journal.indexOf(query) !== -1;
      });

      list.sort(function (a, b) {
        if (sort === "year-desc") return (b.publication_year || 0) - (a.publication_year || 0);
        if (sort === "year-asc") return (a.publication_year || 0) - (b.publication_year || 0);
        if (sort === "alpha") return (a.title || "").localeCompare(b.title || "");
        return (b.cited_by_count || 0) - (a.cited_by_count || 0);
      });

      bar = byId("pub-result-bar");
      if (bar) bar.classList.add("is-visible");
      if (byId("pub-result-n")) byId("pub-result-n").textContent = list.length.toLocaleString();
      page.classList.toggle("pub-searching", query.trim().length > 0);

      listNode = byId("pub-list");
      if (!listNode) return;
      listNode.hidden = false;
      listNode.innerHTML = list.map(function (work, index) {
        var authors = escapeHtml(authorsFor(work));
        var more = (work.authorships || []).length > 5 ? " et al." : "";
        var journal = cleanJournal(sourceName(work));
        var year = work.publication_year || "";
        var url = workUrl(work);
        var cites = work.cited_by_count || 0;
        var workId = openAlexKey(work);
        var itemId = domId(workId || normaliseDoi(work.doi), "pub-" + index);
        var figurePanelId = itemId + "-figures";
        var citingPanelId = itemId + "-citing";
        var figures = figuresForWork(work);
        var topics = workTopics(work);
        var externalLabel = work.doi ? "DOI ↗" : "OpenAlex ↗";
        var openAccessBadge = work.open_access && work.open_access.is_oa ? ' <span class="pub-oa-badge">OA</span>' : "";
        var metrics = '<div class="pub-metrics">' +
          metricPill("OpenAlex citations", formatCount(cites), "pub-metric-cites") +
          metricPill("References", work.referenced_works_count ? formatCount(work.referenced_works_count) : "", "pub-metric-refs") +
          (work.open_access && work.open_access.is_oa ? metricPill("Open access", true, "pub-metric-oa") : "") +
          (figures.length ? metricPill("Figures", formatCount(figures.length), "pub-metric-figures") : "") +
          '</div>';
        var categories = topics.length
          ? '<div class="pub-categories"><span>Categories:</span> ' + topics.map(function (topic) { return '<em>' + escapeHtml(topic) + '</em>'; }).join(", ") + '</div>'
          : "";
        var figurePreview = renderFigurePreview(figures);
        var figureAction = figures.length
          ? '<button class="pub-action" type="button" data-pub-toggle-panel="' + escapeAttr(figurePanelId) + '">Figures <span class="pub-action-count">' + figures.length + '</span></button>'
          : "";
        var citingAction = workId && cites
          ? '<button class="pub-action" type="button" data-pub-toggle-citing="' + escapeAttr(citingPanelId) + '" data-work-id="' + escapeAttr(workId) + '">Citing papers <span class="pub-action-count">OpenAlex - ' + formatCount(cites) + '</span></button>'
          : "";
        var figurePanel = figures.length
          ? '<div class="pub-panel pub-figure-panel" id="' + figurePanelId + '" hidden><div class="pub-panel-title">Figures</div><div class="pub-figures">' +
            figures.map(function (fig) {
              return '<button class="pub-figure-thumb" type="button" data-pub-figure-thumb data-img="' + escapeAttr(fig.img) + '" data-href="' + escapeAttr(fig.href) + '" data-alt="' + escapeAttr(fig.alt) + '" data-caption="' + escapeAttr(fig.caption) + '"><img src="' + escapeAttr(fig.img) + '" alt="' + escapeAttr(fig.alt) + '" loading="lazy"><span class="pub-figure-caption">' + escapeHtml(fig.caption) + '</span></button>';
            }).join("") +
            '</div></div>'
          : "";
        var citingPanel = citingAction
          ? '<div class="pub-panel pub-citing-panel" id="' + citingPanelId + '" hidden><div class="pub-panel-title">Citing papers</div><div class="pub-panel-loading">Loading OpenAlex citing papers...</div></div>'
          : "";

        return '<article class="pub-item"><div class="pub-num">' + (index + 1) + '</div><div class="pub-body">' +
          '<div class="pub-title"><a class="pub-title-link" href="' + escapeAttr(url) + '" target="_blank" rel="noopener noreferrer">' + cleanTitle(work.title) + openAccessBadge + '</a></div>' +
          '<div class="pub-meta">' + (authors || "Unknown authors") + more + ' · <em>' + (journal || "—") + '</em> · ' + year + '</div>' +
          metrics + categories + figurePreview +
          '<div class="pub-actions">' + citingAction + figureAction + '<a class="pub-mini-link" href="' + escapeAttr(url) + '" target="_blank" rel="noopener noreferrer">' + externalLabel + '</a></div>' +
          citingPanel + figurePanel + '</div><div class="pub-cites">' + cites.toLocaleString() + ' cit.</div></article>';
      }).join("") || '<div class="pub-no-results">No publications match this filter.</div>';
    }

    function filterPubs(focusList) {
      renderPubs();
      if (focusList && allPubs.length) focusResultsOnMobile();
    }

    function renderLoadedPubs(works) {
      allPubs = works;
      setHidden("pub-loading", true);
      setHidden("pub-error", true);
      renderCharts(allPubs);
      renderPubs();
    }

    function load() {
      var error;
      var localWorks;
      if (loaded) return;
      loaded = true;

      localWorks = Array.isArray(localPublications) ? localPublications : [];
      setDataStatus("Loading OpenAlex...");
      if (localWorks.length) renderLoadedPubs(localWorks);

      fetchOpenAlexWorks().then(function (livePublications) {
        var liveWorks = Array.isArray(livePublications) ? livePublications : [];
        if (!liveWorks.length) throw new Error("OpenAlex returned no publications");
        setDataStatus("OpenAlex live data");
        renderLoadedPubs(mergeWorks(liveWorks, localPublications));
      }).catch(function (err) {
        if (localWorks.length) {
          setDataStatus("Local data fallback");
          return;
        }

        setDataStatus("OpenAlex unavailable");
        setHidden("pub-loading", true);
        error = setHidden("pub-error", false);
        if (error) {
          error.innerHTML = '<strong>Could not load OpenAlex or local publication data</strong> - ' + escapeHtml(err.message) + '. <a href="https://scholar.google.com/citations?user=BVBwiyAAAAAJ" target="_blank" rel="noopener noreferrer">View Google Scholar</a>';
        }
      });
    }

    if (byId("pub-search-input")) byId("pub-search-input").addEventListener("input", function () { filterPubs(true); });
    if (byId("pub-sort-select")) byId("pub-sort-select").addEventListener("change", function () { filterPubs(true); });

    page.querySelectorAll("[data-pub-sidebar-toggle]").forEach(function (header) {
      header.addEventListener("click", function () { toggleSidebarSection(header); });
    });

    page.querySelectorAll(".pchip[data-filter]").forEach(function (button) {
      button.addEventListener("click", function () { selectChip(button); });
    });

    document.addEventListener("click", function (event) {
      var panelButton = event.target.closest && event.target.closest("[data-pub-toggle-panel]");
      var citingButton = event.target.closest && event.target.closest("[data-pub-toggle-citing]");
      var figureButton;
      if (panelButton) {
        toggleFigurePanel(panelButton.dataset.pubTogglePanel, panelButton);
        return;
      }
      if (citingButton) {
        toggleCitingPanel(citingButton.dataset.pubToggleCiting, citingButton);
        return;
      }
      figureButton = event.target.closest && event.target.closest("[data-pub-figure-thumb]");
      if (figureButton) openFigure(figureButton);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeFigure();
    });

    if (byId("pub-lightbox")) {
      byId("pub-lightbox").addEventListener("click", closeFigure);
      byId("pub-lightbox").addEventListener("close", function () {
        document.body.style.overflow = "";
      });
    }
    if (document.querySelector("[data-pub-lightbox-close]")) {
      document.querySelector("[data-pub-lightbox-close]").addEventListener("click", closeFigure);
    }

    load();
  }

  function initMediaPage() {
    var page = document.getElementById("page-media");
    if (!page || page.dataset.mediaReady) return;
    page.dataset.mediaReady = "true";

    var grid = page.querySelector("#mg-grid");
    var items = grid ? Array.prototype.slice.call(grid.querySelectorAll(".mg-item")) : [];
    var moreButtons = Array.prototype.slice.call(page.querySelectorAll("[data-med-more]"));
    var initialCount = 20;
    var showAll = false;
    var activeCategory = "all";

    function itemMatchesCategory(item, category) {
      return category === "all" || item.dataset.cat === category;
    }

    function applyGalleryState(category) {
      activeCategory = category || activeCategory;
      var matched = 0;
      var visible = 0;

      items.forEach(function (item) {
        var matches = itemMatchesCategory(item, activeCategory);
        var shouldShow = false;
        if (matches) {
          matched += 1;
          visible += 1;
          shouldShow = showAll || visible <= initialCount;
        }
        item.classList.toggle("is-hidden", !shouldShow);
      });

      moreButtons.forEach(function (button) {
        button.classList.toggle("is-hidden", matched <= initialCount || showAll);
      });
    }

    function visibleGalleryItems() {
      return items.filter(function (item) {
        return !item.classList.contains("is-hidden");
      });
    }

    if (grid && items.length) {
      items.forEach(function (item) {
        item.setAttribute("role", "button");
        item.tabIndex = 0;
      });

      moreButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          showAll = true;
          applyGalleryState(activeCategory);
        });
      });

      applyGalleryState("all");
    }

    var lightbox = page.querySelector("#mg-lightbox");
    var lightboxImage = page.querySelector("#mg-lb-img");
    var lightboxCaption = page.querySelector("#mg-lb-cap");
    var visibleItems = [];
    var currentIndex = 0;

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
    }

    function openLightbox(index) {
      if (!lightbox || !lightboxImage) return;
      var item = visibleItems[index];
      if (!item) return;
      var image = item.querySelector("img");
      if (!image) return;

      currentIndex = index;
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt || "";
      if (lightboxCaption) lightboxCaption.textContent = "";
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
    }

    function openItem(item) {
      visibleItems = visibleGalleryItems();
      openLightbox(visibleItems.indexOf(item));
    }

    function moveLightbox(offset) {
      if (!visibleItems.length) return;
      openLightbox((currentIndex + offset + visibleItems.length) % visibleItems.length);
    }

    if (grid && lightbox) {
      grid.addEventListener("click", function (event) {
        var item = event.target.closest(".mg-item");
        if (item) openItem(item);
      });

      grid.addEventListener("keydown", function (event) {
        var item = event.target.closest(".mg-item");
        if (!item || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        openItem(item);
      });

      var closeButton = lightbox.querySelector(".mg-lb-close");
      var previousButton = lightbox.querySelector(".mg-lb-prev");
      var nextButton = lightbox.querySelector(".mg-lb-next");

      if (closeButton) closeButton.addEventListener("click", closeLightbox);
      if (previousButton) previousButton.addEventListener("click", function () { moveLightbox(-1); });
      if (nextButton) nextButton.addEventListener("click", function () { moveLightbox(1); });

      lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox) closeLightbox();
      });

      document.addEventListener("keydown", function (event) {
        if (!lightbox.classList.contains("open")) return;
        if (event.key === "Escape") closeLightbox();
        if (event.key === "ArrowLeft") moveLightbox(-1);
        if (event.key === "ArrowRight") moveLightbox(1);
      });
    }

    var archiveButton = page.querySelector("#vid-archive-btn");
    var archiveRow = page.querySelector("#vid-archive-row");
    if (archiveButton && archiveRow) {
      var archiveLabel = archiveButton.querySelector(".med-archive-label");
      var archiveCount = archiveButton.dataset.count || "5";
      if (archiveLabel) archiveLabel.textContent = "Show archive (" + archiveCount + " videos)";

      archiveButton.addEventListener("click", function () {
        var shouldOpen = archiveRow.classList.contains("med-archive-hidden");
        archiveRow.classList.toggle("med-archive-hidden", !shouldOpen);
        archiveButton.classList.toggle("is-closed", !shouldOpen);
        if (archiveLabel) {
          archiveLabel.textContent = shouldOpen ? "Hide archive" : "Show archive (" + archiveCount + " videos)";
        }
      });
    }

    var pressButton = page.querySelector("#press-more-btn");
    var pressExtra = page.querySelector("#press-extra");
    if (pressButton && pressExtra) {
      var pressCount = (pressButton.textContent.match(/\d+/) || [""])[0];
      pressButton.addEventListener("click", function () {
        var shouldOpen = !pressExtra.classList.contains("is-open");
        pressExtra.classList.toggle("is-open", shouldOpen);
        pressButton.textContent = shouldOpen ? "− Hide extra outlets" : "+ " + pressCount + " more outlets";
      });
    }
  }

  function initHomePage() {
    var page = document.getElementById("page-home");
    if (!page || page.dataset.homeReady) return;
    page.dataset.homeReady = "true";

    var archiveButton = page.querySelector("#news-archive-toggle");
    var archive = page.querySelector("#news-archive");
    if (archiveButton && archive) {
      archiveButton.addEventListener("click", function () {
        var isOpen = archive.classList.toggle("open");
        archiveButton.textContent = isOpen ? "Hide archive" : "Archive";
      });
    }

    var awardsButton = page.querySelector("#awards-toggle");
    var awardsList = page.querySelector("#awards-list");
    if (awardsButton && awardsList) {
      var awardsLabel = awardsButton.querySelector("[data-home-awards-label]");
      awardsButton.addEventListener("click", function () {
        var isOpen = awardsList.classList.toggle("open");
        var chevron = awardsButton.querySelector("svg");
        if (chevron) chevron.style.transform = isOpen ? "rotate(180deg)" : "";
        if (awardsLabel) {
          awardsLabel.textContent = isOpen ? "Hide Awards & Recognition" : "Awards & Recognition";
        }
      });
    }

    function animateCount(element) {
      var target = parseInt(element.dataset.count, 10);
      var duration = 1600;
      var start = window.performance.now();

      function step(now) {
        var progress = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(eased * target).toLocaleString();
        if (progress < 1) window.requestAnimationFrame(step);
      }

      window.requestAnimationFrame(step);
    }

    var counters = Array.prototype.slice.call(page.querySelectorAll(".hp-stat-n[data-count]"));
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      counters.forEach(function (counter) {
        observer.observe(counter);
      });
    } else {
      counters.forEach(animateCount);
    }

    var canvas = page.querySelector("#kp-knot");
    if (canvas && !canvas.dataset.heroKnotReady && typeof window.HeroKnot !== "undefined") {
      canvas.dataset.heroKnotReady = "true";
      new window.HeroKnot(canvas);
    }
  }

  function initGroupPage() {
    var page = document.getElementById("page-group");
    var memberModal = document.getElementById("grp-member-modal");
    if (!page || page.dataset.groupReady) return;
    page.dataset.groupReady = "true";

    var teamImageBase = page.dataset.teamImageBase || "/assets/images/team/";
    var teamPlaceholder = page.dataset.teamPlaceholder || teamImageBase + "knot-placeholder.png";
    var modalName = document.getElementById("grp-modal-name");
    var modalRole = document.getElementById("grp-modal-role");
    var modalDetail = document.getElementById("grp-modal-detail");
    var modalLinks = document.getElementById("grp-modal-links");
    var lastMemberCard = null;

    page.querySelectorAll("[data-color]").forEach(function (element) {
      element.style.background = element.dataset.color;
    });

    page.querySelectorAll("[data-i]").forEach(function (element) {
      element.style.setProperty("--i", element.dataset.i);
    });

    function showFallbackPhoto(initials) {
      var knot = new Image();
      knot.className = "grp-photo";
      knot.alt = initials.dataset.name || "";
      knot.src = teamPlaceholder;
      initials.parentNode.appendChild(knot);
      initials.style.opacity = "0";
    }

    page.querySelectorAll("[data-slug]").forEach(function (initials) {
      var slug = initials.dataset.slug;
      if (!slug) {
        showFallbackPhoto(initials);
        return;
      }

      var image = new Image();
      image.onload = function () {
        image.className = "grp-photo";
        image.alt = initials.dataset.name || "";
        initials.parentNode.appendChild(image);
        initials.style.opacity = "0";
      };
      image.onerror = function () {
        showFallbackPhoto(initials);
      };
      image.src = teamImageBase + slug + ".jpg";
    });

    function allowedProfileHref(href) {
      return /^(mailto:|https?:\/\/|\/(?!\/))/i.test(href || "");
    }

    function addModalLink(label, href) {
      if (!modalLinks || !href || !allowedProfileHref(href)) return;

      var link = document.createElement("a");
      link.className = "grp-modal-link";
      link.href = href;
      link.textContent = label;
      if (!/^mailto:/i.test(href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      modalLinks.appendChild(link);
    }

    function profileUrl(prefix, value) {
      if (!value) return "";
      if (/^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value)) return value;
      return prefix + value;
    }

    function openMemberModal(card) {
      if (!memberModal || !card || !modalName || !modalRole || !modalDetail || !modalLinks) return;
      lastMemberCard = card;

      modalName.textContent = card.dataset.name || "";
      modalRole.textContent = card.dataset.role || "";
      modalDetail.textContent = card.dataset.detail || "";
      modalDetail.style.display = card.dataset.detail ? "" : "none";
      modalLinks.innerHTML = "";

      if (card.dataset.email) {
        addModalLink("Email", /^mailto:/i.test(card.dataset.email) ? card.dataset.email : "mailto:" + card.dataset.email);
      }
      addModalLink("Publications", card.dataset.publicationsUrl);
      card.querySelectorAll(".grp-card-publications a").forEach(function (publication) {
        addModalLink(publication.textContent.trim() || "Publication", publication.getAttribute("href"));
      });
      addModalLink("Google Scholar", card.dataset.googleScholar);
      addModalLink("ResearchGate", card.dataset.researchGate);
      addModalLink("ORCID", profileUrl("https://orcid.org/", card.dataset.orcid));
      addModalLink("GitHub", profileUrl("https://github.com/", card.dataset.github));
      addModalLink("Website", card.dataset.url);

      if (typeof memberModal.showModal === "function") {
        if (!memberModal.open) memberModal.showModal();
      } else {
        memberModal.setAttribute("open", "");
      }
      document.body.classList.add("grp-modal-lock");
    }

    function closeMemberModal() {
      if (!memberModal) return;
      if (typeof memberModal.close === "function" && memberModal.open) memberModal.close();
      else memberModal.removeAttribute("open");
      document.body.classList.remove("grp-modal-lock");
    }

    page.querySelectorAll("[data-grp-member-card]").forEach(function (card) {
      card.addEventListener("click", function (event) {
        if (event.target.closest("a")) return;
        openMemberModal(card);
      });
      card.addEventListener("keydown", function (event) {
        if (event.target.closest("a")) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openMemberModal(card);
        }
      });
    });

    document.querySelectorAll("[data-grp-modal-close]").forEach(function (button) {
      button.addEventListener("click", closeMemberModal);
    });

    if (memberModal) {
      memberModal.addEventListener("click", function (event) {
        if (event.target === memberModal) closeMemberModal();
      });
      memberModal.addEventListener("close", function () {
        document.body.classList.remove("grp-modal-lock");
        if (lastMemberCard) lastMemberCard.focus();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && memberModal && memberModal.open) closeMemberModal();
    });
  }

  function initContactPage() {
    var page = document.getElementById("page-contact");
    if (!page || page.dataset.contactReady) return;
    page.dataset.contactReady = "true";

    var form = page.querySelector("#cp-inquiry-form");
    var success = page.querySelector("#cp-success");

    function field(id) {
      return page.querySelector("#" + id);
    }

    function markInvalid(element) {
      if (!element) return;
      element.focus();
      element.style.borderColor = "#b94a40";
      window.setTimeout(function () {
        element.style.borderColor = "";
      }, 1800);
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();

        var nameField = field("cp-name");
        var emailField = field("cp-email");
        var subjectField = field("cp-subject");
        var affiliationField = field("cp-affil");
        var messageField = field("cp-message");
        var recipient = form.dataset.recipientEmail || "j.sulkowska@cent.uw.edu.pl";
        var subjectPrefix = form.dataset.subjectPrefix || "[Lab Contact]";

        var name = nameField ? nameField.value.trim() : "";
        var email = emailField ? emailField.value.trim() : "";
        var subject = subjectField ? subjectField.value : "";
        var affiliation = affiliationField ? affiliationField.value.trim() : "";
        var message = messageField ? messageField.value.trim() : "";

        if (!name || !email || !subject || !message) {
          markInvalid(!name ? nameField : !email ? emailField : !subject ? subjectField : messageField);
          return;
        }

        var body = "Name: " + name + "\nEmail: " + email + (affiliation ? "\nAffiliation: " + affiliation : "") + "\n\n" + message;
        var mailto = "mailto:" + recipient
          + "?subject=" + encodeURIComponent(subjectPrefix + " " + subject + " - " + name)
          + "&body=" + encodeURIComponent(body);

        window.location.href = mailto;
        form.style.display = "none";
        if (success) success.classList.add("visible");
      });

      ["cp-name", "cp-email", "cp-subject", "cp-message"].forEach(function (id) {
        var element = field(id);
        if (!element) return;
        ["input", "change"].forEach(function (eventName) {
          element.addEventListener(eventName, function () {
            element.style.borderColor = "";
          });
        });
      });
    }

    var frame = page.querySelector(".cp-fb-frame");
    var wrap = page.querySelector(".cp-fb-frame-wrap");
    if (!frame || !wrap) return;

    var lastWidth = 0;
    var lastHeight = 0;
    var pageUrl = frame.getAttribute("data-page-url") || "https://www.facebook.com/SulkowskaLab/";

    function frameHeight() {
      return window.matchMedia("(max-width: 680px)").matches ? 540 : 620;
    }

    function renderFacebookFrame() {
      var width = Math.max(280, Math.min(500, Math.floor(wrap.clientWidth || 500)));
      var height = frameHeight();

      if (Math.abs(width - lastWidth) < 8 && height === lastHeight && frame.src) {
        wrap.style.height = height + "px";
        frame.height = String(height);
        return;
      }

      lastWidth = width;
      lastHeight = height;
      wrap.style.height = height + "px";
      frame.width = String(width);
      frame.height = String(height);
      frame.src = "https://www.facebook.com/plugins/page.php"
        + "?href=" + encodeURIComponent(pageUrl)
        + "&tabs=timeline"
        + "&width=" + width
        + "&height=" + height
        + "&small_header=true"
        + "&adapt_container_width=true"
        + "&hide_cover=false"
        + "&show_facepile=false";
    }

    renderFacebookFrame();
    window.addEventListener("resize", renderFacebookFrame);
    if ("ResizeObserver" in window) {
      new ResizeObserver(renderFacebookFrame).observe(wrap);
    }
  }

  function initResearchPage() {
    var page = document.getElementById("page-research");
    var modal = document.getElementById("rx-project-modal");
    if (!page || page.dataset.researchReady) return;
    page.dataset.researchReady = "true";

    function byId(id) {
      return id ? document.getElementById(id) : null;
    }

    function toggleDomain(button) {
      var section = byId(button.dataset.rxDomainToggle);
      if (!section) return;
      var shouldOpen = !section.classList.contains("open");
      page.querySelectorAll(".rx-domain.open").forEach(function (domain) {
        if (domain !== section) domain.classList.remove("open");
      });
      section.classList.toggle("open", shouldOpen);
    }

    function togglePapers(button) {
      var panel = byId(button.dataset.rxPaperToggle);
      if (!panel) return;
      var open = panel.hasAttribute("hidden");
      if (open) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
      button.classList.toggle("is-open", open);
    }

    function setText(id, value) {
      var node = byId(id);
      if (node) node.textContent = value || "";
      return node;
    }

    function openProject(button) {
      if (!modal || !button) return;

      var detail = byId("rx-project-detail-" + button.dataset.projectId);
      var detailTarget = byId("rx-modal-detail");
      var image = byId("rx-modal-image");
      var badge = byId("rx-modal-badge");
      var polish = button.dataset.polishTitle || "";

      setText("rx-modal-title", button.dataset.title);
      setText("rx-modal-meta", button.dataset.meta);
      setText("rx-modal-summary", button.dataset.summary);

      var polishTarget = setText("rx-modal-polish", polish);
      if (polishTarget) polishTarget.hidden = !polish;
      if (detailTarget) detailTarget.innerHTML = detail ? detail.innerHTML : "";

      if (badge) {
        badge.className = "rx-modal-badge " + (button.dataset.badgeClass || "");
        badge.textContent = button.dataset.badge || "";
      }

      if (image) {
        if (button.dataset.image && !/^(?:https?:)?\/\//i.test(button.dataset.image) && !/^data:/i.test(button.dataset.image)) {
          image.src = button.dataset.image;
          image.alt = button.dataset.alt || "";
        } else {
          image.removeAttribute("src");
          image.alt = "";
        }
      }

      if (typeof modal.showModal === "function") modal.showModal();
      else modal.setAttribute("open", "");
      document.body.classList.add("rx-modal-lock");
    }

    function closeProject() {
      if (!modal) return;
      if (typeof modal.close === "function" && modal.open) modal.close();
      else modal.removeAttribute("open");
      document.body.classList.remove("rx-modal-lock");
    }

    page.querySelectorAll("[data-rx-domain-toggle]").forEach(function (button) {
      button.addEventListener("click", function () { toggleDomain(button); });
    });

    page.querySelectorAll("[data-rx-paper-toggle]").forEach(function (button) {
      button.addEventListener("click", function () { togglePapers(button); });
    });

    page.querySelectorAll("[data-rx-project-card]").forEach(function (button) {
      button.addEventListener("click", function () { openProject(button); });
    });

    document.querySelectorAll("[data-rx-close-project]").forEach(function (button) {
      button.addEventListener("click", closeProject);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeProject();
    });

    if (modal) {
      modal.addEventListener("click", function (event) {
        if (event.target === modal) closeProject();
      });
      modal.addEventListener("close", function () {
        document.body.classList.remove("rx-modal-lock");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initAssetGuard();
      initImageFallbacks();
      initSlideshow();
      initJumpNavs();
      initPublicationsPage();
      initMediaPage();
      initHomePage();
      initGroupPage();
      initContactPage();
      initResearchPage();
    });
  } else {
    initAssetGuard();
    initImageFallbacks();
    initSlideshow();
    initJumpNavs();
    initPublicationsPage();
    initMediaPage();
    initHomePage();
    initGroupPage();
    initContactPage();
    initResearchPage();
  }
}());
