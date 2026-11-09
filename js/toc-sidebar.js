/* 右侧栏一开始即吸顶；目录随滚动高亮当前章节 */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var floatBox = document.getElementById('rsidebar-float');
    var tocPanel = document.getElementById('rsidebar-toc');
    var asidePanel = document.getElementById('rsidebar-aside');
    var tabsWrap = floatBox && floatBox.querySelector('.rsidebar-tabs');
    if (!floatBox || !tocPanel || !asidePanel || !tabsWrap) return;

    var toc = document.getElementById('markdown-toc');
    var homeParent = toc ? toc.parentNode : null;
    var homeNext = toc ? toc.nextSibling : null;
    var tocHeading = null;
    if (toc) {
      var prev = toc.previousElementSibling;
      if (prev && /^H[1-6]$/.test(prev.tagName) && /目录/.test((prev.textContent || '').trim())) {
        tocHeading = prev;
      }
    }

    var topGap = 12;
    var bottomGap = 16;
    var placeholder = null;
    var hasToc = !!toc;
    var tocLinks = [];
    var spyOffset = 80;
    var activeLink = null;

    function isDesktop() {
      return window.matchMedia('(min-width: 992px)').matches;
    }

    function getPinTop() {
      var nav = document.querySelector('.topnav') || document.querySelector('.navbar');
      var navH = nav ? Math.round(nav.getBoundingClientRect().height) : 50;
      return navH + topGap;
    }

    function switchTab(name) {
      var tabs = tabsWrap.querySelectorAll('.rsidebar-tab');
      var panels = floatBox.querySelectorAll('.rsidebar-panel');
      for (var i = 0; i < tabs.length; i++) {
        var on = tabs[i].getAttribute('data-panel') === name;
        tabs[i].classList.toggle('is-active', on);
        tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
      }
      for (var j = 0; j < panels.length; j++) {
        panels[j].classList.toggle('is-active', panels[j].getAttribute('data-panel') === name);
      }
    }

    tabsWrap.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.rsidebar-tab') : null;
      if (!btn) return;
      switchTab(btn.getAttribute('data-panel'));
    });

    function syncMaxHeight(pinTop) {
      var h = Math.floor(window.innerHeight - pinTop - bottomGap);
      if (h < 120) h = 120;
      floatBox.style.maxHeight = h + 'px';
    }

    function clearFixed() {
      floatBox.classList.remove('is-fixed');
      floatBox.style.position = '';
      floatBox.style.top = '';
      floatBox.style.left = '';
      floatBox.style.width = '';
      floatBox.style.maxHeight = '';
      floatBox.style.zIndex = '';
      floatBox.style.marginTop = '';
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
      placeholder = null;
    }

    function pinFixed() {
      var sidebar = floatBox.closest('.rsidebar');
      if (!sidebar) return;

      var pinTop = getPinTop();
      var rect = sidebar.getBoundingClientRect();

      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.id = 'rsidebar-float-placeholder';
        placeholder.style.width = '100%';
        placeholder.style.height = '1px';
        floatBox.parentNode.insertBefore(placeholder, floatBox);
      }

      floatBox.classList.add('is-fixed');
      floatBox.style.position = 'fixed';
      floatBox.style.top = pinTop + 'px';
      floatBox.style.left = Math.round(rect.left) + 'px';
      floatBox.style.width = Math.round(rect.width) + 'px';
      floatBox.style.zIndex = '100';
      floatBox.style.marginTop = '';
      syncMaxHeight(pinTop);
    }

    function collectTocLinks() {
      tocLinks = [];
      if (!toc) return;
      var links = toc.querySelectorAll('a[href^="#"]');
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href');
        if (!href || href === '#') continue;
        var id = decodeURIComponent(href.slice(1));
        var target = document.getElementById(id);
        if (!target) continue;
        tocLinks.push({ link: links[i], target: target });
      }
    }

    function setActiveLink(link) {
      if (activeLink === link) return;
      if (activeLink) activeLink.classList.remove('is-active');
      activeLink = link;
      if (activeLink) {
        activeLink.classList.add('is-active');
        var panels = floatBox.querySelector('.rsidebar-panels');
        if (panels && tocPanel.classList.contains('is-active')) {
          var linkTop = activeLink.offsetTop;
          var linkBottom = linkTop + activeLink.offsetHeight;
          var viewTop = panels.scrollTop;
          var viewBottom = viewTop + panels.clientHeight;
          if (linkTop < viewTop + 8) {
            panels.scrollTop = Math.max(0, linkTop - 8);
          } else if (linkBottom > viewBottom - 8) {
            panels.scrollTop = linkBottom - panels.clientHeight + 8;
          }
        }
      }
    }

    function updateActiveToc() {
      if (!tocLinks.length) return;
      var marker = getPinTop() + spyOffset;
      var current = tocLinks[0].link;
      for (var i = 0; i < tocLinks.length; i++) {
        var top = tocLinks[i].target.getBoundingClientRect().top;
        if (top <= marker) current = tocLinks[i].link;
        else break;
      }
      setActiveLink(current);
    }

    function setupDesktop() {
      floatBox.classList.add('is-desktop');
      if (hasToc) {
        if (toc.parentNode !== tocPanel) tocPanel.appendChild(toc);
        if (tocHeading) tocHeading.style.display = 'none';
        tabsWrap.style.display = '';
        floatBox.classList.remove('no-toc');
        switchTab('aside');
        collectTocLinks();
      } else {
        tabsWrap.style.display = 'none';
        floatBox.classList.add('no-toc');
        switchTab('aside');
        tocLinks = [];
      }
      window.requestAnimationFrame(function () {
        pinFixed();
        updateActiveToc();
      });
    }

    function setupMobile() {
      clearFixed();
      floatBox.classList.remove('is-desktop', 'no-toc');
      tabsWrap.style.display = 'none';
      switchTab('aside');
      if (hasToc && homeParent) {
        if (toc.parentNode !== homeParent) {
          if (homeNext && homeNext.parentNode === homeParent) {
            homeParent.insertBefore(toc, homeNext);
          } else {
            homeParent.appendChild(toc);
          }
        }
        if (tocHeading) tocHeading.style.display = '';
      }
      if (activeLink) {
        activeLink.classList.remove('is-active');
        activeLink = null;
      }
    }

    function place() {
      if (isDesktop()) setupDesktop();
      else setupMobile();
    }

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', function () {
      if (isDesktop() && hasToc) updateActiveToc();
    }, { passive: true });
  });
})();
