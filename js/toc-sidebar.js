/* 右侧栏：目录 + 关于整合浮动；高度按视口剩余空间算，内部可滚完整个目录 */
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

    var pinOffset = 12;
    var bottomGap = 16;
    var placeholder = null;
    var affixed = false;
    var hasToc = !!toc;
    var alignMargin = 0;

    function isDesktop() {
      return window.matchMedia('(min-width: 992px)').matches;
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

    function findContentColumn() {
      var sidebar = floatBox.closest('.rsidebar');
      if (!sidebar || !sidebar.parentElement) return null;
      var kids = sidebar.parentElement.children;
      for (var i = 0; i < kids.length; i++) {
        if (kids[i] !== sidebar && /col-/.test(kids[i].className || '')) {
          return kids[i];
        }
      }
      return null;
    }

    function findFirstBodyHeading(contentCol) {
      var headings = contentCol.querySelectorAll('h1, h2, h3, h4, h5, h6');
      for (var i = 0; i < headings.length; i++) {
        var h = headings[i];
        var style = window.getComputedStyle(h);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        if (/^目录$/.test((h.textContent || '').trim())) continue;
        return h;
      }
      return null;
    }

    // 高度 = 视口底部到面板顶边的剩余空间，保证内部滚动能看完目录
    function syncMaxHeight() {
      if (!isDesktop()) {
        floatBox.style.maxHeight = '';
        return;
      }
      var top;
      if (affixed) {
        top = pinOffset;
      } else {
        top = floatBox.getBoundingClientRect().top;
      }
      var h = Math.floor(window.innerHeight - top - bottomGap);
      if (h < 120) h = 120;
      floatBox.style.maxHeight = h + 'px';
    }

    function alignWithFirstHeading() {
      alignMargin = 0;
      floatBox.style.marginTop = '';
      if (!isDesktop() || affixed) return;

      var contentCol = findContentColumn();
      if (!contentCol) return;
      var heading = findFirstBodyHeading(contentCol);
      if (!heading) return;

      var delta = Math.round(heading.getBoundingClientRect().top - floatBox.getBoundingClientRect().top);
      if (delta > 0) {
        alignMargin = delta;
        floatBox.style.marginTop = delta + 'px';
      }
      syncMaxHeight();
    }

    function clearAffix() {
      affixed = false;
      floatBox.classList.remove('is-fixed');
      floatBox.style.position = '';
      floatBox.style.top = '';
      floatBox.style.left = '';
      floatBox.style.width = '';
      floatBox.style.zIndex = '';
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
      placeholder = null;
      alignWithFirstHeading();
    }

    function applyAffix(left, width) {
      if (affixed) return;
      affixed = true;
      var marginTop = alignMargin;
      floatBox.style.marginTop = '';
      alignMargin = 0;

      placeholder = document.createElement('div');
      placeholder.id = 'rsidebar-float-placeholder';
      placeholder.style.height = floatBox.offsetHeight + marginTop + 'px';
      placeholder.style.width = '100%';
      floatBox.parentNode.insertBefore(placeholder, floatBox);

      floatBox.classList.add('is-fixed');
      floatBox.style.position = 'fixed';
      floatBox.style.top = pinOffset + 'px';
      floatBox.style.left = Math.round(left) + 'px';
      floatBox.style.width = Math.round(width) + 'px';
      floatBox.style.zIndex = '100';
      syncMaxHeight();
    }

    function onScroll() {
      if (!isDesktop()) return;

      if (!affixed) {
        syncMaxHeight();
        var rect = floatBox.getBoundingClientRect();
        if (rect.top <= pinOffset) {
          applyAffix(rect.left, rect.width);
        }
      } else if (placeholder) {
        var phRect = placeholder.getBoundingClientRect();
        if (phRect.top > pinOffset) {
          clearAffix();
        } else {
          syncMaxHeight();
        }
      }
    }

    function setupDesktop() {
      floatBox.classList.add('is-desktop');
      if (hasToc) {
        if (toc.parentNode !== tocPanel) tocPanel.appendChild(toc);
        if (tocHeading) tocHeading.style.display = 'none';
        tabsWrap.style.display = '';
        floatBox.classList.remove('no-toc');
        switchTab('aside');
      } else {
        tabsWrap.style.display = 'none';
        floatBox.classList.add('no-toc');
        switchTab('aside');
      }
      clearAffix();
      window.requestAnimationFrame(function () {
        alignWithFirstHeading();
        syncMaxHeight();
        onScroll();
      });
    }

    function setupMobile() {
      clearAffix();
      floatBox.style.marginTop = '';
      floatBox.style.maxHeight = '';
      alignMargin = 0;
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
    }

    function place() {
      if (isDesktop()) setupDesktop();
      else setupMobile();
    }

    place();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      clearAffix();
      place();
    });
  });
})();
