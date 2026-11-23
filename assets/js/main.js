(function () {
  'use strict';

  function decodeHash() {
    var raw = location.hash.slice(1);
    if (!raw) return '';
    try { return decodeURIComponent(raw); } catch (e) { return raw; }
  }

  function setHash(key, clear) {
    if (!history.replaceState) return;
    history.replaceState(null, '', clear ? location.pathname + location.search : '#' + encodeURIComponent(key));
  }

  function filterEntries(entries, key) {
    entries.forEach(function (el) {
      var tags = (el.getAttribute('data-tags') || '').split('|').filter(Boolean);
      var show = key === 'all' || tags.indexOf(key) > -1;
      el.hidden = !show;
      el.classList.toggle('is-tag-hidden', !show);
    });
  }

  function syncYearMarks(list, entries) {
    if (!list) return;
    Array.prototype.forEach.call(list.querySelectorAll('.entry-year'), function (mark) {
      var year = mark.getAttribute('data-year');
      var any = entries.some(function (li) {
        return !li.hidden && li.getAttribute('data-year') === year;
      });
      mark.hidden = !any;
    });
  }

  // —— 侧栏导航 ——
  // rail-link：分区切换 → replace + 标记跳过「返回」（不留下可返回地址）
  // catalog-list：同栏换篇 → 仅 replace（不追加历史，保留底层列表，不清空可返回栈）
  var NAV_SKIP_BACK = 'nav-skip-back';

  function bindSideNav(root, selector, opts) {
    if (!root) return;
    opts = opts || {};
    root.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest(selector);
      if (!a || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      if (typeof opts.isCurrent === 'function' && opts.isCurrent(a)) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      if (opts.skipBack) {
        try { sessionStorage.setItem(NAV_SKIP_BACK, '1'); } catch (err) {}
      }
      location.replace(href);
    });
  }

  (function initSideNavReplace() {
    bindSideNav(document.querySelector('.rail-nav'), 'a.rail-link', {
      skipBack: true,
      isCurrent: function (a) { return a.getAttribute('aria-current') === 'page'; }
    });
    bindSideNav(document.querySelector('.catalog-list'), 'a', {
      skipBack: false,
      isCurrent: function (a) {
        var item = a.closest('.catalog-item');
        return !!(item && item.classList.contains('is-current'));
      }
    });
  })();

  // —— main 左上角：返回上一页（首页 / 无可返回站内地址时不显示）——
  (function initMainBack() {
    var btn = document.getElementById('main-back');
    if (!btn) return;

    var path = location.pathname.replace(/\/index\.html$/, '/');
    if (path === '/' || path === '') {
      btn.hidden = true;
      return;
    }

    var skipBack = false;
    try {
      skipBack = sessionStorage.getItem(NAV_SKIP_BACK) === '1';
      if (skipBack) sessionStorage.removeItem(NAV_SKIP_BACK);
    } catch (e) {}

    var ref = document.referrer || '';
    var canBack = false;
    try {
      canBack = !skipBack && !!(ref && new URL(ref).origin === location.origin && ref !== location.href);
    } catch (e) {}

    if (!canBack) {
      btn.hidden = true;
      return;
    }

    btn.hidden = false;
    btn.addEventListener('click', function () {
      history.back();
    });
  })();

  // —— 文章 / 笔记 / 作品：标签筛选（主栏 tag-toolbar 与/或中栏 sidebar-tags）——
  (function initCollectionTagFilter() {
    var list = document.getElementById('content-list');
    if (!list) return;

    var entries = Array.prototype.slice.call(
      list.querySelectorAll('.entry, .work-tile[data-tags]')
    );
    if (!entries.length) return;

    var row = document.getElementById('tag-row');
    var expandBtn = document.getElementById('tag-expand');
    var sideList = document.getElementById('sidebar-tags-list');

    function sortByCount(nodes) {
      nodes.sort(function (a, b) {
        var dc = (+b.getAttribute('data-count') || 0) - (+a.getAttribute('data-count') || 0);
        if (dc !== 0) return dc;
        return (a.getAttribute('data-tag') || '').localeCompare(b.getAttribute('data-tag') || '', 'zh');
      });
    }

    var chips = [];

    if (sideList) {
      var sideAll = sideList.querySelector('[data-tag="all"]');
      var sideTopics = Array.prototype.slice.call(sideList.querySelectorAll('[data-tag]:not([data-tag="all"])'));
      sortByCount(sideTopics);
      sideTopics.forEach(function (btn) {
        var li = btn.closest('li') || btn;
        sideList.appendChild(li);
      });
      if (sideAll) {
        var allLi = sideAll.closest('li') || sideAll;
        sideList.insertBefore(allLi, sideList.firstChild);
      }
      chips = chips.concat(Array.prototype.slice.call(sideList.querySelectorAll('[data-tag]')));
    }

    if (row) {
      var allBtn = row.querySelector('[data-tag="all"]');
      var topicBtns = Array.prototype.slice.call(row.querySelectorAll('[data-tag]:not([data-tag="all"])'));
      if (allBtn) {
        sortByCount(topicBtns);
        topicBtns.forEach(function (btn) { row.appendChild(btn); });
        row.insertBefore(allBtn, row.firstChild);
        chips = chips.concat([allBtn].concat(topicBtns));
      }
    }

    if (!chips.length) return;

    function syncExpandVisibility() {
      if (!expandBtn || !row) return;
      var collapsed = row.classList.contains('is-collapsed');
      if (!collapsed) {
        expandBtn.hidden = false;
        return;
      }
      expandBtn.hidden = true;
      var overflows = row.scrollHeight > row.clientHeight + 1;
      expandBtn.hidden = !overflows;
    }

    function setExpanded(open) {
      if (!row) return;
      row.classList.toggle('is-collapsed', !open);
      if (!expandBtn) return;
      expandBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      expandBtn.setAttribute('aria-label', open ? '收起标签' : '展开标签');
      syncExpandVisibility();
    }

    if (expandBtn && row) {
      expandBtn.addEventListener('click', function () {
        setExpanded(row.classList.contains('is-collapsed'));
      });
    }

    function apply(key, updateHash) {
      if (!chips.some(function (t) { return t.getAttribute('data-tag') === key; })) key = 'all';
      filterEntries(entries, key);
      syncYearMarks(list, entries);
      chips.forEach(function (t) {
        var on = t.getAttribute('data-tag') === key;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (updateHash) setHash(key, key === 'all');
    }

    chips.forEach(function (t) {
      t.addEventListener('click', function () {
        var key = t.getAttribute('data-tag');
        if (t.classList.contains('is-active') && key !== 'all') key = 'all';
        apply(key, true);
      });
    });

    var fromHash = decodeHash();
    apply(fromHash && chips.some(function (t) { return t.getAttribute('data-tag') === fromHash; }) ? fromHash : 'all', false);
    window.addEventListener('hashchange', function () {
      var key = decodeHash();
      apply(key && chips.some(function (t) { return t.getAttribute('data-tag') === key; }) ? key : 'all', false);
    });

    if (row && expandBtn) {
      syncExpandVisibility();
      window.addEventListener('resize', syncExpandVisibility);
    }
  })();

  // —— 中栏 catalog：当前页 tag tab 筛选目录 ——
  (function initCatalogTagTabs() {
    var tabsRoot = document.getElementById('catalog-tag-tabs');
    var list = document.getElementById('catalog-list');
    if (!tabsRoot || !list) return;

    var tabs = Array.prototype.slice.call(tabsRoot.querySelectorAll('.catalog-tag-tab'));
    var items = Array.prototype.slice.call(list.querySelectorAll('.catalog-item'));
    if (!tabs.length || !items.length) return;

    var allTab = tabsRoot.querySelector('[data-tag="all"]');
    var topicTabs = tabs.filter(function (t) { return t.getAttribute('data-tag') !== 'all'; });
    topicTabs.sort(function (a, b) {
      return (+b.getAttribute('data-count') || 0) - (+a.getAttribute('data-count') || 0);
    });
    topicTabs.forEach(function (t) { tabsRoot.appendChild(t); });
    if (allTab) tabsRoot.appendChild(allTab);
    tabs = topicTabs.concat(allTab ? [allTab] : []);

    function apply(key) {
      if (!tabs.some(function (t) { return t.getAttribute('data-tag') === key; })) {
        key = tabs[0].getAttribute('data-tag');
      }
      items.forEach(function (li) {
        if (key === 'all') {
          li.hidden = false;
          return;
        }
        var tags = (li.getAttribute('data-tags') || '').split('|');
        li.hidden = tags.indexOf(key) === -1;
      });
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tag') === key;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        apply(t.getAttribute('data-tag'));
      });
    });

    apply(tabs[0].getAttribute('data-tag'));
  })();

  // —— 中栏独立滚动：滚轮不传到 main（内容高度自然撑开，滚动在 mid-panel）——
  (function initCatalogScrollLock() {
    var panel = document.querySelector('.mid-panel--catalog');
    if (!panel) return;

    // 每个列表(about/posts/works/notes)用各自的 key，避免串位
    var head = document.querySelector('.mid-panel--catalog .catalog-head');
    var key = 'catalog-scroll:' + (head ? (head.getAttribute('href') || head.id || 'tags') : 'default');

    function clamp(v) {
      var max = panel.scrollHeight - panel.clientHeight;
      return Math.max(0, Math.min(v, Math.max(0, max)));
    }

    function restore() {
      var saved;
      try { saved = localStorage.getItem(key); } catch (e) { return; }
      if (saved == null || saved === '') return;
      var v = parseInt(saved, 10);
      if (isNaN(v)) return;
      panel.scrollTop = clamp(v);
    }

    restore();
    window.addEventListener('load', restore);

    var timer = null;
    panel.addEventListener('scroll', function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        try { localStorage.setItem(key, String(panel.scrollTop)); } catch (e) {}
      }, 80);
    }, { passive: true });

    panel.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      try { localStorage.setItem(key, String(panel.scrollTop)); } catch (err) {}
    }, true);

    panel.addEventListener('wheel', function (e) {
      var max = panel.scrollHeight - panel.clientHeight;
      if (max <= 0) return;
      var top = panel.scrollTop;
      var goingUp = e.deltaY < 0;
      var goingDown = e.deltaY > 0;
      if ((goingUp && top <= 0) || (goingDown && top >= max - 1)) {
        e.preventDefault();
      }
    }, { passive: false });
  })();

  // —— 目录栏拖拽调宽 ——
  (function initCatalogResize() {
    var handle = document.getElementById('catalog-resizer');
    if (!handle) return;

    var MIN = 220, MAX = 480;
    var root = document.documentElement;

    function currentWidth() {
      var v = parseInt(getComputedStyle(root).getPropertyValue('--catalog-w'), 10);
      return isNaN(v) ? 300 : v;
    }

    function setWidth(px) {
      px = Math.max(MIN, Math.min(MAX, Math.round(px)));
      root.style.setProperty('--catalog-w', px + 'px');
      try { localStorage.setItem('catalog-width', String(px)); } catch (e) {}
    }

    handle.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var startX = e.clientX;
      var startW = currentWidth();
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      handle.classList.add('is-dragging');
      document.body.classList.add('is-resizing');

      function move(ev) { setWidth(startW + ev.clientX - startX); }
      function end() {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', end);
        handle.removeEventListener('pointercancel', end);
        handle.classList.remove('is-dragging');
        document.body.classList.remove('is-resizing');
      }
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
    });

    handle.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setWidth(currentWidth() + (e.key === 'ArrowRight' ? 16 : -16));
      }
    });
  })();

  // —— 首页：获取联系方式弹窗 ——
  (function initContactDialog() {
    var trigger = document.getElementById('contact-trigger');
    var dialog = document.getElementById('contact-dialog');
    if (!trigger || !dialog || typeof dialog.showModal !== 'function') return;

    var wrap = trigger.closest('.contact-trigger-wrap');

    function dismissTip() {
      if (wrap) wrap.classList.add('is-tip-dismissed');
    }

    trigger.addEventListener('click', function () {
      dismissTip();
      dialog.showModal();
      trigger.blur();
    });

    // 关闭弹窗后若鼠标仍停在气泡上，提示应保持隐藏，直到移出后再悬停
    dialog.addEventListener('close', dismissTip);

    if (wrap) {
      wrap.addEventListener('pointerleave', function () {
        if (dialog.open) return;
        wrap.classList.remove('is-tip-dismissed');
      });
    }

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });
  })();

  // —— 文章页内目录（右侧导航，来自 kramdown {:toc}）——
  (function initArticleToc() {
    var source = document.getElementById('markdown-toc');
    if (!source) return;

    // 主区域内：隐藏 markdown-toc 前方最近的那个 h2（通常是「目录」）
    var prevH2 = source.previousElementSibling;
    while (prevH2 && prevH2.tagName !== 'H2') {
      prevH2 = prevH2.previousElementSibling;
    }
    var hiddenHeadingId = prevH2 && prevH2.id ? prevH2.id : null;
    if (prevH2) prevH2.style.display = 'none';

    var shell = document.getElementById('article-toc');
    var nav = document.getElementById('article-toc-nav');
    if (!shell || !nav) return;

    var clone = source.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(function (el) {
      el.removeAttribute('id');
    });
    // 去掉指向已隐藏标题的条目
    if (hiddenHeadingId) {
      var selfHref = '#' + hiddenHeadingId;
      clone.querySelectorAll('a[href="' + selfHref + '"]').forEach(function (a) {
        var li = a.closest('li');
        if (li && li.parentElement === clone) li.remove();
      });
    }
    nav.appendChild(clone);

    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var headings = links
      .map(function (a) {
        var id = decodeURIComponent((a.getAttribute('href') || '').slice(1));
        return id ? document.getElementById(id) : null;
      })
      .filter(Boolean);

    if (!headings.length) return;

    function setActive(id) {
      links.forEach(function (a) {
        var match = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', match);
      });
    }

    // css scroll-behavior:smooth 时，scrollTo(y) / behavior:'auto' 仍会缓动；
    // 必须用 'instant'，或临时关掉 css 后再滚。
    function jumpInstant(y) {
      var root = document.documentElement;
      var prev = root.style.getPropertyValue('scroll-behavior');
      root.style.setProperty('scroll-behavior', 'auto');
      if (typeof window.scrollTo === 'function') {
        try {
          window.scrollTo({ top: y, left: 0, behavior: 'instant' });
        } catch (err) {
          window.scrollTo(0, y);
        }
      } else {
        window.scrollTo(0, y);
      }
      if (prev) root.style.setProperty('scroll-behavior', prev);
      else root.style.removeProperty('scroll-behavior');
    }

    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = decodeURIComponent((a.getAttribute('href') || '').slice(1));
        var target = id ? document.getElementById(id) : null;
        if (!target) return;
        e.preventDefault();
        e.stopPropagation();
        var top = target.getBoundingClientRect().top + window.pageYOffset - 24;
        jumpInstant(top);
        if (history.replaceState) {
          history.replaceState(null, '', '#' + id);
        }
        setActive(id);
      });
    });

    var observer = new IntersectionObserver(
      function (entries) {
        var visible = entries
          .filter(function (e) { return e.isIntersecting; })
          .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
        if (visible.length) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '-96px 0px -55% 0px', threshold: [0, 1] }
    );
    headings.forEach(function (h) { observer.observe(h); });

    // 初始：选中视口内第一个标题
    var top = window.scrollY + 100;
    var current = headings[0];
    headings.forEach(function (h) {
      if (h.offsetTop <= top) current = h;
    });
    if (current) setActive(current.id);
  })();
})();
