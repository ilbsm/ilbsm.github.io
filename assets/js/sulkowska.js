// ── original SPA show() kept disabled — see Jekyll shim at end of file ──
  function _spaShow_unused(name) {
    /* original SPA logic; not used in Jekyll split-page build */
  }

  // ── Home page stat counters ──
  function animateHomeStats() {
    document.querySelectorAll('.hss-num').forEach(el => {
      const target = +el.dataset.target;
      const duration = 1800;
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      const timer = setInterval(() => {
        current = Math.min(current + increment, target);
        el.textContent = Math.floor(current).toLocaleString();
        if (current >= target) clearInterval(timer);
      }, duration / steps);
    });
  }
  const statsStrip = document.querySelector('.home-stats-strip');
  if (statsStrip) {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { animateHomeStats(); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(statsStrip);
  }



  function swFilter(cat, btn) {
    document.querySelectorAll('.sw-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.sw-card').forEach(card => {
      const c = card.getAttribute('data-cat') || '';
      card.classList.toggle('sw-hidden', cat !== 'all' && !c.includes(cat));
    });
    document.querySelectorAll('.sw-section-label').forEach(label => {
      if (cat === 'all') { label.style.display = ''; return; }
      // Show label if any sibling grid cards are visible
      const grid = label.nextElementSibling;
      if (!grid) return;
      const visibleCards = [...grid.querySelectorAll('.sw-card')].filter(c => !c.classList.contains('sw-hidden'));
      label.style.display = visibleCards.length ? '' : 'none';
    });
  }



  // ── Group member photo loader ──
  const GM_PATHS = [
    '/wp-content/uploads/2025/01/',
    '/wp-content/uploads/2025/02/',
    '/wp-content/uploads/2025/03/',
    '/wp-content/uploads/2025/04/',
    '/wp-content/uploads/2025/05/',
    '/wp-content/uploads/2025/06/',
    '/wp-content/uploads/2025/07/',
    '/wp-content/uploads/2025/08/',
    '/wp-content/uploads/2025/09/',
    '/wp-content/uploads/2025/10/',
    '/wp-content/uploads/2025/11/',
    '/wp-content/uploads/2025/12/',
    '/wp-content/uploads/2024/01/',
    '/wp-content/uploads/2024/02/',
    '/wp-content/uploads/2024/03/',
    '/wp-content/uploads/2024/04/',
    '/wp-content/uploads/2024/05/',
    '/wp-content/uploads/2024/06/',
    '/wp-content/uploads/2024/07/',
    '/wp-content/uploads/2024/08/',
    '/wp-content/uploads/2024/09/',
    '/wp-content/uploads/2024/10/',
    '/wp-content/uploads/2024/11/',
    '/wp-content/uploads/2024/12/',
    '/wp-content/uploads/2023/01/',
    '/wp-content/uploads/2023/02/',
    '/wp-content/uploads/2023/03/',
    '/wp-content/uploads/2023/04/',
    '/wp-content/uploads/2023/05/',
    '/wp-content/uploads/2023/06/',
    '/wp-content/uploads/2023/07/',
    '/wp-content/uploads/2023/08/',
    '/wp-content/uploads/2023/09/',
    '/wp-content/uploads/2023/10/',
    '/wp-content/uploads/2023/11/',
    '/wp-content/uploads/2023/12/',
    '/wp-content/uploads/2022/01/',
    '/wp-content/uploads/2022/02/',
    '/wp-content/uploads/2022/03/',
    '/wp-content/uploads/2022/04/',
    '/wp-content/uploads/2022/05/',
    '/wp-content/uploads/2022/06/',
    '/wp-content/uploads/2022/07/',
    '/wp-content/uploads/2022/08/',
    '/wp-content/uploads/2022/09/',
    '/wp-content/uploads/2022/10/',
    '/wp-content/uploads/2022/11/',
    '/wp-content/uploads/2022/12/',
    '/wp-content/uploads/2021/01/',
    '/wp-content/uploads/2021/02/',
    '/wp-content/uploads/2021/03/',
    '/wp-content/uploads/2021/04/',
    '/wp-content/uploads/2021/05/',
    '/wp-content/uploads/2021/06/',
    '/wp-content/uploads/2021/07/',
    '/wp-content/uploads/2021/08/',
    '/wp-content/uploads/2021/09/',
    '/wp-content/uploads/2021/10/',
    '/wp-content/uploads/2021/11/',
    '/wp-content/uploads/2021/12/',
    '/wp-content/uploads/2020/01/',
    '/wp-content/uploads/2020/02/',
    '/wp-content/uploads/2020/03/',
    '/wp-content/uploads/2020/04/',
    '/wp-content/uploads/2020/05/',
    '/wp-content/uploads/2020/06/',
    '/wp-content/uploads/2020/07/',
    '/wp-content/uploads/2020/08/',
    '/wp-content/uploads/2020/09/',
    '/wp-content/uploads/2020/10/',
    '/wp-content/uploads/2020/11/',
    '/wp-content/uploads/2020/12/',
    '/wp-content/uploads/2019/01/',
    '/wp-content/uploads/2019/02/',
    '/wp-content/uploads/2019/03/',
    '/wp-content/uploads/2019/04/',
    '/wp-content/uploads/2019/05/',
    '/wp-content/uploads/2019/06/',
    '/wp-content/uploads/2019/07/',
    '/wp-content/uploads/2019/08/',
    '/wp-content/uploads/2019/09/',
    '/wp-content/uploads/2019/10/',
    '/wp-content/uploads/2019/11/',
    '/wp-content/uploads/2019/12/',
    '/wp-content/uploads/2018/01/',
    '/wp-content/uploads/2018/02/',
    '/wp-content/uploads/2018/03/',
    '/wp-content/uploads/2018/04/',
    '/wp-content/uploads/2018/05/',
    '/wp-content/uploads/2018/06/',
    '/wp-content/uploads/2018/07/',
    '/wp-content/uploads/2018/08/',
    '/wp-content/uploads/2018/09/',
    '/wp-content/uploads/2018/10/',
    '/wp-content/uploads/2018/11/',
    '/wp-content/uploads/2018/12/',
    '/wp-content/uploads/2017/01/',
    '/wp-content/uploads/2017/02/',
    '/wp-content/uploads/2017/03/',
    '/wp-content/uploads/2017/04/',
    '/wp-content/uploads/2017/05/',
    '/wp-content/uploads/2017/06/',
    '/wp-content/uploads/2017/07/',
    '/wp-content/uploads/2017/08/',
    '/wp-content/uploads/2017/09/',
    '/wp-content/uploads/2017/10/',
    '/wp-content/uploads/2017/11/',
    '/wp-content/uploads/2017/12/',
    '/wp-content/uploads/2016/01/',
    '/wp-content/uploads/2016/02/',
    '/wp-content/uploads/2016/03/',
    '/wp-content/uploads/2016/04/',
    '/wp-content/uploads/2016/05/',
    '/wp-content/uploads/2016/06/',
    '/wp-content/uploads/2016/07/',
    '/wp-content/uploads/2016/08/',
    '/wp-content/uploads/2016/09/',
    '/wp-content/uploads/2016/10/',
    '/wp-content/uploads/2016/11/',
    '/wp-content/uploads/2016/12/',
    '/wp-content/uploads/2015/01/',
    '/wp-content/uploads/2015/02/',
    '/wp-content/uploads/2015/03/',
    '/wp-content/uploads/2015/04/',
    '/wp-content/uploads/2015/05/',
    '/wp-content/uploads/2015/06/',
    '/wp-content/uploads/2015/07/',
    '/wp-content/uploads/2015/08/',
    '/wp-content/uploads/2015/09/',
    '/wp-content/uploads/2015/10/',
    '/wp-content/uploads/2015/11/',
    '/wp-content/uploads/2015/12/',
    '/wp-content/uploads/2014/01/',
    '/wp-content/uploads/2014/02/',
    '/wp-content/uploads/2014/03/',
    '/wp-content/uploads/2014/04/',
    '/wp-content/uploads/2014/05/',
    '/wp-content/uploads/2014/06/',
    '/wp-content/uploads/2014/07/',
    '/wp-content/uploads/2014/08/',
    '/wp-content/uploads/2014/09/',
    '/wp-content/uploads/2014/10/',
    '/wp-content/uploads/2014/11/',
    '/wp-content/uploads/2014/12/',
    '/wp-content/uploads/2013/01/',
    '/wp-content/uploads/2013/02/',
    '/wp-content/uploads/2013/03/',
    '/wp-content/uploads/2013/04/',
    '/wp-content/uploads/2013/05/',
    '/wp-content/uploads/2013/06/',
    '/wp-content/uploads/2013/07/',
    '/wp-content/uploads/2013/08/',
    '/wp-content/uploads/2013/09/',
    '/wp-content/uploads/2013/10/',
    '/wp-content/uploads/2013/11/',
    '/wp-content/uploads/2013/12/',
  ];
    const BASE = 'https://jsulkowska.cent.uw.edu.pl';
  const GM_PRIMARY = {
    'joannas': '/wp-content/uploads/2016/05/Joanna-Sulkowska_2.jpg',
    'szymonn': '/wp-content/uploads/2016/05/szymonn.jpg',
    'bostjang': '/wp-content/uploads/2023/04/bostjang.jpg',
    'agatap': '/wp-content/uploads/2016/05/agatap.jpg',
    'fernandob': '/wp-content/uploads/2021/06/fernandob.jpg',
    'mariuszm': '/wp-content/uploads/2024/06/mariuszm.jpg',
    'julias': '/wp-content/uploads/2024/10/julias.jpg',
    'bartekg': '/wp-content/uploads/2018/10/bartekg.jpg',
    'mateuszf': '/wp-content/uploads/2020/10/mateuszf.jpg',
    'circle': '/wp-content/uploads/2019/10/circle.jpg',
    'martak': '/wp-content/uploads/2021/10/martak.jpg',
    'slupek': '/wp-content/uploads/2025/01/slupek.jpg',
    'smiglowska': '/wp-content/uploads/2025/01/smiglowska.jpg',
    'rudnicka': '/wp-content/uploads/2025/01/rudnicka.jpg',
    'jagnar1': '/wp-content/uploads/2024/10/jagnar1.jpg',
    'janowiak': '/wp-content/uploads/2024/10/janowiak.jpg',
    'bulinski': '/wp-content/uploads/2024/10/bulinski.jpg',
    'jacekp': '/wp-content/uploads/2024/10/jacekp.jpg',
    'pawelr': '/wp-content/uploads/2018/10/pawelr.jpg',
    'kamill': '/wp-content/uploads/2023/10/kamill.jpg',
    'michals': '/wp-content/uploads/2021/10/michals.jpg',
    'wojtekg': '/wp-content/uploads/2019/10/wojtekg.jpg',
    'dominikak': '/wp-content/uploads/2024/10/dominikak.jpg',
    'annk': '/wp-content/uploads/2024/06/annk.jpg',
    'juliaso': '/wp-content/uploads/2024/06/juliaso.jpg',
    'magdalenao': '/wp-content/uploads/2024/06/magdalenao.jpg',
    'wandan': '/wp-content/uploads/2016/05/wandan.jpg',
    'iwonal': '/wp-content/uploads/2019/10/iwonal.jpg',
    'smitap': '/wp-content/uploads/2021/06/smitap.jpg',
    'evak': '/wp-content/uploads/2024/06/evak.jpg',
    'mateuszj': '/wp-content/uploads/2019/10/mateuszj.jpg',
    'mailann': '/wp-content/uploads/2020/10/mailann.jpg',
    'dawidu': '/wp-content/uploads/2022/10/dawidu.jpg',
    'martas': '/wp-content/uploads/2020/10/martas.jpg',
    'basiab': '/wp-content/uploads/2020/10/basiab.jpg',
    'paulinas': '/wp-content/uploads/2020/10/paulinas.jpg',
    'zana': '/wp-content/uploads/2021/10/zana.jpg',
    'nataliak': '/wp-content/uploads/2021/10/nataliak.jpg',
    'paulinao': '/wp-content/uploads/2021/10/paulinao.jpg',
    'adams': '/wp-content/uploads/2018/10/adams.jpg',
    'roksanam': '/wp-content/uploads/2021/10/roksanam.jpg',
    'emilias': '/wp-content/uploads/2019/10/emilias.jpg',
    'pawelk': '/wp-content/uploads/2020/10/pawelk.jpg',
    'lina': '/wp-content/uploads/2017/10/lina.jpg',
    'olag': '/wp-content/uploads/2020/10/olag.jpg',
    'borys': '/wp-content/uploads/2018/10/borys.jpg',
    'kasia': '/wp-content/uploads/2019/10/kasia.jpg',
    'maciek_p': '/wp-content/uploads/2018/10/maciek_p.jpg',
    'martyna': '/wp-content/uploads/2019/10/martyna.jpg',
    'jakubratajczak': '/wp-content/uploads/2017/10/jakubratajczak.jpg',
  };

  // Fallback paths if primary fails
  const GM_FALLBACK_PATHS = [
    '/wp-content/uploads/2016/05/', '/wp-content/uploads/2016/06/', '/wp-content/uploads/2016/09/',
    '/wp-content/uploads/2017/10/', '/wp-content/uploads/2018/10/', '/wp-content/uploads/2019/10/',
    '/wp-content/uploads/2020/10/', '/wp-content/uploads/2021/06/', '/wp-content/uploads/2021/10/',
    '/wp-content/uploads/2022/04/', '/wp-content/uploads/2022/10/', '/wp-content/uploads/2023/04/',
    '/wp-content/uploads/2023/10/', '/wp-content/uploads/2024/06/', '/wp-content/uploads/2024/10/',
    '/wp-content/uploads/2025/01/'
  ];
  const GM_EXTS = ['.jpg', '.jpeg', '.png'];

  let gmAttempts = {};

  // On page load: set primary path for all member photos
  function gmInitPhotos() {
    document.querySelectorAll('.gm-photo').forEach(img => {
      const slug = img.dataset.slug;
      if (!slug) return;
      if (GM_PRIMARY[slug]) {
        img.src = BASE + GM_PRIMARY[slug];
      } else {
        // No primary — start with first fallback
        gmAttempts[slug] = 0;
        img.src = BASE + GM_FALLBACK_PATHS[0] + slug + GM_EXTS[0];
      }
    });
  }

  function gmPhotoFail(img) {
    const slug = img.dataset.slug;
    if (!slug) { gmShowInitials(img); return; }
    const idx = (gmAttempts[slug] || 0);
    gmAttempts[slug] = idx + 1;
    const total = GM_FALLBACK_PATHS.length * GM_EXTS.length;
    if (idx < total) {
      const pathIdx = Math.floor(idx / GM_EXTS.length);
      const ext = GM_EXTS[idx % GM_EXTS.length];
      img.src = BASE + GM_FALLBACK_PATHS[pathIdx] + slug + ext;
    } else {
      gmShowInitials(img);
    }
  }

  function gmShowInitials(img) {
    img.style.display = 'none';
    const fallback = img.nextElementSibling;
    if (fallback && fallback.classList.contains('gm-initials')) {
      fallback.style.display = 'flex';
    }
  }

  // Initialize when group page is shown
  document.addEventListener('DOMContentLoaded', gmInitPhotos);
  // Also init when navigating to group page
  if (typeof window !== 'undefined') {
    const _origShow = window.show;
    if (_origShow) {
      window.show = function(name) {
        _origShow(name);
        if (name === 'group') setTimeout(gmInitPhotos, 100);
      };
    }
  }

  // Kick off photo loading for all member cards
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.gm-photo[data-slug]').forEach(img => {
      const slug = img.dataset.slug;
      if (slug) img.src = BASE + GM_PATHS[0] + slug + '.jpg';
    });
  });



  // ── Research domain toggle ──
  function rpdToggle(id) {
    const block = document.getElementById(id);
    if (!block) return;
    block.classList.toggle('open');
  }
  // Open first domain by default when research page loads
  document.addEventListener('DOMContentLoaded', function() {
    const first = document.getElementById('domain-physics');
    if (first) first.classList.add('open');
  });



  
  // open first domain by default on research page
  document.addEventListener('DOMContentLoaded', function() {
    const f = document.getElementById('rpd-01');
    if (f) f.classList.add('open');
  });



  // ── Media gallery ──
  var mgCurrent = 0, mgVisible = [];
  
  
  
  

  // ── Media gallery v2 ──
  var mgCurrent = 0, mgVisible = [];

  
  

  // ── Media page v3 ──
  var mgCurrent=0, mgVisible=[];

  function mgCat(cat, btn) {
    document.querySelectorAll('.med-fpill').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    const grid = document.getElementById('mg-grid');
    if(!grid) return;
    grid.classList.remove('show-all');
    const mbtn = document.getElementById('med-more-btn');
    if(mbtn) mbtn.innerHTML = 'Show all 75 photos <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
    document.querySelectorAll('.mg-item').forEach(item => {
      item.classList.toggle('mg-hidden', cat!=='all' && item.dataset.cat!==cat);
    });
  }

  function medShowMore() {
    const grid = document.getElementById('mg-grid');
    const btn  = document.getElementById('med-more-btn');
    if(!grid) return;
    if(grid.classList.contains('show-all')) {
      grid.classList.remove('show-all');
      btn.innerHTML = 'Show all 75 photos <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
    } else {
      grid.classList.add('show-all');
      btn.innerHTML = 'Show fewer <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>';
    }
  }

  function mgOpen(url, cap) {
    mgVisible = [...document.querySelectorAll('#mg-grid .mg-item:not(.mg-hidden)')].filter(el => {
      return window.getComputedStyle(el).display !== 'none';
    });
    mgCurrent = mgVisible.findIndex(el => { const i=el.querySelector('img'); return i && i.src===url; });
    document.getElementById('mg-lb-img').src = url;
    document.getElementById('mg-lb-cap').textContent = cap;
    document.getElementById('mg-lightbox').classList.add('open');
  }

  function mgClose() { document.getElementById('mg-lightbox').classList.remove('open'); }

  function mgLbNav(dir) {
    mgCurrent = (mgCurrent+dir+mgVisible.length) % mgVisible.length;
    const el = mgVisible[mgCurrent];
    const img = el.querySelector('img');
    document.getElementById('mg-lb-img').src = img ? img.src : '';
    const cap = el.querySelector('.mg-caption');
    document.getElementById('mg-lb-cap').textContent = cap ? cap.textContent : '';
  }

  function medScroll(id, btn) {
    document.querySelectorAll('.med-pill').forEach(p => p.classList.remove('active'));
    if(btn) btn.classList.add('active');
    const el = document.getElementById(id);
    if(el) { const top = el.getBoundingClientRect().top + window.scrollY - 105; window.scrollTo({top, behavior:'smooth'}); }
  }

  document.addEventListener('keydown', e => {
    const lb = document.getElementById('mg-lightbox');
    if(lb && lb.classList.contains('open')) {
      if(e.key==='Escape') mgClose();
      if(e.key==='ArrowLeft') mgLbNav(-1);
      if(e.key==='ArrowRight') mgLbNav(1);
    }
  });

  // Scroll spy for media nav
  window.addEventListener('scroll', () => {
    if(!document.getElementById('page-media') || !document.getElementById('page-media').classList.contains('active')) return;
    const ids = ['ms-gallery','ms-videos','ms-tv','ms-radio','ms-interviews','ms-press','ms-talks'];
    let current = 'ms-gallery';
    ids.forEach(id => { const el=document.getElementById(id); if(el && window.scrollY >= el.offsetTop-120) current=id; });
    document.querySelectorAll('.med-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.target===current);
    });
  });

  // ── Featured-in marquee: clone track so animation loops seamlessly ──
  document.addEventListener('DOMContentLoaded', function() {
    var track = document.getElementById('med-feat-track');
    if (!track) return;
    var clone = track.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('a').forEach(function(a) {
      a.setAttribute('aria-hidden', 'true');
      a.setAttribute('tabindex', '-1');
    });
    track.parentNode.appendChild(clone);
  });

  // ── Media page centralised event listeners ──
  document.addEventListener('DOMContentLoaded', function() {
    // Pill nav (data-target already present on each button)
    document.querySelectorAll('.med-pill[data-target]').forEach(function(btn) {
      btn.addEventListener('click', function() { medScroll(btn.dataset.target, btn); });
    });

    // Gallery category filter pills (data-cat added by build script)
    document.querySelectorAll('.med-fpill[data-cat]').forEach(function(btn) {
      btn.addEventListener('click', function() { mgCat(btn.dataset.cat, btn); });
    });

    // Gallery grid — event delegation, reads img src + caption text
    var grid = document.getElementById('mg-grid');
    if (grid) {
      grid.addEventListener('click', function(e) {
        var item = e.target.closest('.mg-item');
        if (!item) return;
        var img = item.querySelector('img');
        var cap = item.querySelector('.mg-caption');
        mgOpen(img ? img.src : '', cap ? cap.textContent : '');
      });
    }

    // Lightbox backdrop closes on click; inner wrap stops propagation
    var lb = document.getElementById('mg-lightbox');
    if (lb) lb.addEventListener('click', mgClose);
    var lbWrap = document.querySelector('.mg-lb-wrap');
    if (lbWrap) lbWrap.addEventListener('click', function(e) { e.stopPropagation(); });
    var lbClose = document.querySelector('.mg-lb-close');
    if (lbClose) lbClose.addEventListener('click', mgClose);
    var lbPrev = document.querySelector('.mg-lb-prev');
    if (lbPrev) lbPrev.addEventListener('click', function() { mgLbNav(-1); });
    var lbNext = document.querySelector('.mg-lb-next');
    if (lbNext) lbNext.addEventListener('click', function() { mgLbNav(1); });

    // Show more / show fewer
    var moreBtn = document.getElementById('med-more-btn');
    if (moreBtn) moreBtn.addEventListener('click', medShowMore);
  });



  // ── Section nav scroll/spy (home + group) ──
  function psecScroll(targetId, btn) {
    const navWrap = btn.closest('.psec-nav');
    if (navWrap) navWrap.querySelectorAll('.psec-pill').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const el = document.getElementById(targetId);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
  // Scroll spy for psec-nav
  window.addEventListener('scroll', function() {
    document.querySelectorAll('.page.active .psec-nav').forEach(nav => {
      const pills = nav.querySelectorAll('.psec-pill');
      let current = null;
      pills.forEach(p => {
        const id = p.dataset.target;
        const el = document.getElementById(id);
        if (el && window.scrollY + 130 >= el.offsetTop) current = id;
      });
      if (current) {
        pills.forEach(p => p.classList.toggle('active', p.dataset.target === current));
      }
    });
  });



  // ── Publications fetch & render ──
  let pubData = [];

  async function loadPubs() {
    try {
      const url = 'https://api.openalex.org/works?filter=author.id:A5006566445&per-page=200&sort=cited_by_count:desc';
      const r = await fetch(url);
      if (!r.ok) throw new Error('OpenAlex API error');
      const json = await r.json();
      pubData = json.results || [];
      const totalCites = pubData.reduce((s, w) => s + (w.cited_by_count || 0), 0);
      document.getElementById('ps-count').textContent = pubData.length.toLocaleString();
      document.getElementById('ps-cites').textContent = totalCites.toLocaleString();
      // h-index calculation
      const sorted = [...pubData].sort((a,b) => (b.cited_by_count||0) - (a.cited_by_count||0));
      let h = 0;
      for (let i = 0; i < sorted.length; i++) if ((sorted[i].cited_by_count||0) >= i+1) h = i+1;
      document.getElementById('ps-h').textContent = h;
      pubFilter();
    } catch(e) {
      document.getElementById('pub-loading').style.display = 'none';
      const err = document.getElementById('pub-error');
      err.style.display = 'block';
      err.textContent = 'Could not load publications from OpenAlex. Please visit Google Scholar or try again later.';
    }
  }

  function pubFilter() {
    const q = (document.getElementById('pub-search-input')?.value || '').toLowerCase();
    const sort = document.getElementById('pub-sort-select')?.value || 'cites';
    let list = pubData.filter(w => {
      if (!q) return true;
      const t = (w.title || '').toLowerCase();
      const auth = (w.authorships || []).map(a => a.author?.display_name || '').join(' ').toLowerCase();
      const j = ((w.primary_location?.source?.display_name) || '').toLowerCase();
      return t.includes(q) || auth.includes(q) || j.includes(q);
    });
    list.sort((a,b) => {
      if (sort === 'year-desc') return (b.publication_year||0) - (a.publication_year||0);
      if (sort === 'year-asc')  return (a.publication_year||0) - (b.publication_year||0);
      return (b.cited_by_count||0) - (a.cited_by_count||0);
    });
    const html = list.map((w,i) => {
      const auths = (w.authorships||[]).slice(0,5).map(a => a.author?.display_name || '').join(', ');
      const more = (w.authorships||[]).length > 5 ? ' et al.' : '';
      const journal = (w.primary_location?.source?.display_name) || '';
      const year = w.publication_year || '';
      const url = w.doi ? ('https://doi.org/' + w.doi.replace('https://doi.org/','')) : (w.id || '#');
      const cites = w.cited_by_count || 0;
      return `<a class="pub-item" href="${url}" target="_blank">
        <div class="pub-num">${i+1}</div>
        <div class="pub-body">
          <div class="pub-title">${(w.title||'Untitled').replace(/</g,'&lt;')}</div>
          <div class="pub-meta">${auths}${more} · <em>${journal||'—'}</em> · ${year}</div>
        </div>
        <div class="pub-cites">${cites.toLocaleString()} cit.</div>
      </a>`;
    }).join('');
    document.getElementById('pub-loading').style.display = 'none';
    const lst = document.getElementById('pub-list');
    lst.style.display = 'block';
    lst.innerHTML = html || '<div style="padding:2rem;text-align:center;color:#888">No publications found.</div>';
  }

  // Lazy load on first show
  let pubsLoaded = false;
  document.addEventListener('click', function(e) {
    const link = e.target.closest('[onclick*="publications"]');
    if (link && !pubsLoaded) { pubsLoaded = true; setTimeout(loadPubs, 200); }
  });
  // Also load if user lands directly on publications via show
  if (typeof window !== 'undefined') {
    const origShow = window.show;
    if (origShow) {
      window.show = function(name) {
        origShow(name);
        if (name === 'publications' && !pubsLoaded) {
          pubsLoaded = true;
          setTimeout(loadPubs, 200);
        }
      };
    }
  }


  function rpfdToggle(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
  }
  document.addEventListener('DOMContentLoaded', function() {
    const f = document.getElementById('rpfd-01');
    if (f) f.classList.add('open');
  });


  
  
  
  document.addEventListener('keydown', e => { if(e.key==='Escape') mgClose(); });

  function rtShow(id, btn) {
    document.querySelectorAll('.rt-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.rt-panel').forEach(p => p.classList.remove('active'));
    if(btn) btn.classList.add('active');
    const el = document.getElementById('rt-' + id);
    if(el) el.classList.add('active');
  }

  //document.querySelectorAll('nav a').forEach(a => a.addEventListener('click', e => e.preventDefault()));

  function galTab(name, btn) {
    document.querySelectorAll('.gal-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.gal-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('gal-' + name).classList.add('active');
  }

  function msnClick(el) {
    document.querySelectorAll('.msn').forEach(a => a.classList.remove('active'));
    el.classList.add('active');
  }
  // highlight subnav on scroll
  window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.media-section');
    const links = document.querySelectorAll('.msn');
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 130) current = s.id;
    });
    links.forEach(l => {
      l.classList.remove('active');
      if (l.getAttribute('href') === '#' + current) l.classList.add('active');
    });
  });

  // Slideshow
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.slide-dot');
  let currentSlide = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
  if (currentSlide < 0) currentSlide = 0;
  let autoTimer = null;

  function goSlide(n) {
    if (!slides.length) return;
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    if (dots[currentSlide]) dots[currentSlide].classList.add('active');
  }
  function moveSlide(dir) {
    clearInterval(autoTimer);
    goSlide(currentSlide + dir);
    startAuto();
  }
  function startAuto() {
    if (slides.length > 1) autoTimer = setInterval(() => goSlide(currentSlide + 1), 5000);
  }
  goSlide(currentSlide);
  startAuto();

// ────────────────────────────────────────────────────────────
// Jekyll split-page navigation shim (overrides any earlier show())
// In the SPA version, show('group') toggled <div id="page-group">.
// In Jekyll each page is its own URL, so show() now navigates.
// ────────────────────────────────────────────────────────────
window.show = function(name) {
  var map = {
    home:         '/',
    group:        '/group/',
    research:     '/research/',
    publications: '/publications/',
    topics:       '/topics/',
    collab:       '/collaboration/',
    media:        '/media/',
    contact:      '/contact/'
  };
  console.log('show ' + name);
  if (!(name in map)) return false;
  var base = window.SITE_BASEURL || '';
  window.location.href = base + map[name];
  return false;
};

// Shared "Jump to section" dropdown used by multi-section pages.
(function () {
  if (window.__sulkowskaJumpNavReady) return;
  window.__sulkowskaJumpNavReady = true;

  function navHeight() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--nav-h');
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 42;
  }

  function jumpOffset() {
    const row = document.querySelector('.jump-row');
    const pageHead = document.querySelector('.pub-pghead');
    return navHeight() + (pageHead ? pageHead.offsetHeight : 0) + (row ? row.offsetHeight : 0) + 12;
  }

  function setActive(nav, id) {
    if (!nav) return;
    nav.querySelectorAll('.jump-option[data-jump-target]').forEach(option => {
      option.classList.toggle('active', option.dataset.jumpTarget === id);
    });
  }

  function closeNav(nav) {
    if (!nav) return;
    nav.classList.remove('is-open');
    const toggle = nav.querySelector('.jump-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  window.labJumpTo = function (id, trigger) {
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;

    if (target.classList.contains('rx-domain')) {
      target.classList.add('open');
      const head = target.querySelector('.rx-domain-head');
      if (head) head.setAttribute('aria-expanded', 'true');
    }

    const top = target.getBoundingClientRect().top + window.pageYOffset - jumpOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    history.replaceState(null, '', '#' + id);

    const nav = trigger ? trigger.closest('[data-jump-nav]') : null;
    if (nav) {
      setActive(nav, id);
      closeNav(nav);
    }
  };

  function initJumpNavs() {
    document.querySelectorAll('[data-jump-nav]').forEach(nav => {
      if (nav.dataset.jumpReady) return;
      nav.dataset.jumpReady = 'true';

      const toggle = nav.querySelector('.jump-toggle');
      const options = nav.querySelectorAll('.jump-option[data-jump-target]');

      if (toggle) {
        toggle.addEventListener('click', event => {
          event.stopPropagation();
          const isOpen = nav.classList.toggle('is-open');
          toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
      }

      options.forEach(option => {
        option.addEventListener('click', () => {
          window.labJumpTo(option.dataset.jumpTarget, option);
        });
      });
    });

    document.addEventListener('click', event => {
      document.querySelectorAll('[data-jump-nav].is-open').forEach(nav => {
        if (!nav.contains(event.target)) closeNav(nav);
      });
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      document.querySelectorAll('[data-jump-nav].is-open').forEach(closeNav);
    });

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        document.querySelectorAll('[data-jump-nav]').forEach(nav => {
          const options = Array.from(nav.querySelectorAll('.jump-option[data-jump-target]'));
          let current = options[0] ? options[0].dataset.jumpTarget : '';
          options.forEach(option => {
            const target = document.getElementById(option.dataset.jumpTarget);
            if (target && target.getBoundingClientRect().top <= jumpOffset() + 32) {
              current = option.dataset.jumpTarget;
            }
          });
          setActive(nav, current);
        });
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (location.hash) {
      const id = location.hash.slice(1);
      const target = document.getElementById(id);
      if (target) setTimeout(() => window.labJumpTo(id), 180);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJumpNavs);
  } else {
    initJumpNavs();
  }
})();
