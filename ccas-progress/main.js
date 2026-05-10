/* ============================================================
 * CCAS · 工程进度 — 时间轴交互
 * ============================================================
 * 职责：
 *   1. Hero 开场后自动离场 / 用户主动滚动则提前离场
 *   2. 扫描 DOM 中所有 .week 元素，自动生成左侧时间轴
 *   3. 滚动联动：高亮当前周节点
 *   4. 点击时间轴节点：平滑滚动到对应周
 *   5. 顶栏当前日期 & 顶部进度条同步
 *   6. 周卡片首次进入视口时淡入
 *
 *   未来添加新一周只需要复制粘贴一个 <section class="week">
 *   到 #weeks 容器最顶部，无需修改本文件。
 * ============================================================ */

(function () {
  'use strict';

  const HERO_AUTO_LEAVE_MS = 3200;
  const SCROLL_LEAVE_THRESHOLD = 12;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    const hero = document.getElementById('hero');
    const topbar = document.getElementById('topbar');
    const layout = document.querySelector('.layout');
    const timelineEl = document.getElementById('timeline');
    const weeksRoot = document.getElementById('weeks');
    const progressBar = document.getElementById('topbar-progress');
    const currentDateEl = document.getElementById('topbar-current-date');

    if (!hero || !weeksRoot || !timelineEl) return;

    /* ===== 0. 主题切换 ===== */
    initThemeSwitcher();

    /* ===== 1. Hero 离场逻辑 ===== */
    let heroLeft = false;

    function leaveHero() {
      if (heroLeft) return;
      heroLeft = true;

      hero.classList.add('is-leaving');
      topbar.classList.add('is-visible');
      layout.classList.add('is-visible');

      window.setTimeout(function () {
        hero.style.display = 'none';
        const offset = window.scrollY;
        if (offset > 0) window.scrollTo({ top: 0, behavior: 'instant' });
      }, 900);
    }

    const heroTimer = window.setTimeout(leaveHero, HERO_AUTO_LEAVE_MS);

    function onEarlyScroll() {
      if (window.scrollY > SCROLL_LEAVE_THRESHOLD) {
        window.clearTimeout(heroTimer);
        leaveHero();
        window.removeEventListener('scroll', onEarlyScroll, { passive: true });
      }
    }
    window.addEventListener('scroll', onEarlyScroll, { passive: true });

    function onEarlyKey(e) {
      if (['ArrowDown', 'PageDown', 'Space', ' ', 'Enter'].includes(e.key)) {
        window.clearTimeout(heroTimer);
        leaveHero();
        window.removeEventListener('keydown', onEarlyKey);
      }
    }
    window.addEventListener('keydown', onEarlyKey);

    function onEarlyClick(e) {
      if (e.target.closest('.hero')) {
        window.clearTimeout(heroTimer);
        leaveHero();
        window.removeEventListener('click', onEarlyClick);
      }
    }
    window.addEventListener('click', onEarlyClick);

    /* ===== 2. 自动从 DOM 扫描生成时间轴 ===== */
    const weeks = Array.from(weeksRoot.querySelectorAll('.week'));
    if (!weeks.length) return;

    const tlList = document.createElement('ul');
    tlList.className = 'tl-list';

    const nodeMap = new Map();

    weeks.forEach(function (week) {
      const date = week.dataset.date || '';
      const headline = week.dataset.headline || '';
      const id = week.id;

      const li = document.createElement('li');
      li.className = 'tl-node';
      li.dataset.targetId = id;
      li.innerHTML =
        '<span class="tl-node-date">' + date + '</span>' +
        '<span class="tl-node-headline">' + headline + '</span>';

      li.addEventListener('click', function () {
        const target = document.getElementById(id);
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });

      tlList.appendChild(li);
      nodeMap.set(id, li);
    });

    timelineEl.appendChild(tlList);

    /* ===== 3. 滚动联动：高亮当前周节点 ===== */
    let activeId = weeks[0].id;
    let firstActiveDateSet = false;

    function setActive(id) {
      if (activeId === id && firstActiveDateSet) return;
      activeId = id;
      firstActiveDateSet = true;

      const activeIndex = weeks.findIndex(function (w) { return w.id === id; });
      weeks.forEach(function (w, i) {
        const node = nodeMap.get(w.id);
        if (!node) return;
        node.classList.toggle('is-active', i === activeIndex);
        node.classList.toggle('is-passed', i < activeIndex);
      });

      const activeWeek = weeks[activeIndex];
      if (activeWeek && currentDateEl) {
        currentDateEl.textContent = activeWeek.dataset.date || '—';
      }

      // 让激活的节点滚到时间轴可视区
      const node = nodeMap.get(id);
      if (node) {
        const rect = node.getBoundingClientRect();
        const tlRect = timelineEl.getBoundingClientRect();
        if (rect.top < tlRect.top + 40 || rect.bottom > tlRect.bottom - 40) {
          node.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
    }

    /* IntersectionObserver: 当 week 进入页面中部窄带时认为是激活的；
       使用单一阈值 + 窄 rootMargin 避免触发过于频繁导致卡顿 */
    const activeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setActive(e.target.id);
      });
    }, {
      rootMargin: '-35% 0px -55% 0px',
      threshold: 0
    });

    weeks.forEach(function (w) { activeObs.observe(w); });

    /* ===== 4. 周卡片首次进入视口时淡入 reveal ===== */
    const revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.05
    });

    weeks.forEach(function (w) { revealObs.observe(w); });

    /* ===== 5. 顶栏进度条 ===== */
    function updateProgress() {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      if (docH <= 0) return;
      const ratio = Math.min(1, Math.max(0, window.scrollY / docH));
      if (progressBar) progressBar.style.width = (ratio * 100).toFixed(2) + '%';
    }

    let progressRaf = null;
    window.addEventListener('scroll', function () {
      if (progressRaf) return;
      progressRaf = window.requestAnimationFrame(function () {
        updateProgress();
        progressRaf = null;
      });
    }, { passive: true });

    updateProgress();

    /* ===== 6. 初始化首个周作为当前 ===== */
    setActive(weeks[0].id);

    /* ===== 7. 键盘上下箭头 / J K 在周间跳转 ===== */
    window.addEventListener('keydown', function (e) {
      if (!heroLeft) return;
      if (e.target && e.target.tagName === 'INPUT') return;

      const idx = weeks.findIndex(function (w) { return w.id === activeId; });
      if (idx < 0) return;

      let nextIdx = idx;
      if (e.key === 'j' || e.key === 'ArrowDown') nextIdx = Math.min(weeks.length - 1, idx + 1);
      else if (e.key === 'k' || e.key === 'ArrowUp') nextIdx = Math.max(0, idx - 1);
      else return;

      if (nextIdx !== idx) {
        e.preventDefault();
        const target = weeks[nextIdx];
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* ============================================================
   * 主题切换器
   * ============================================================ */
  const STORAGE_KEY = 'ccas-theme';

  function readTheme() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        mode:   s.mode   || document.documentElement.dataset.mode   || 'dark',
        accent: s.accent || document.documentElement.dataset.accent || 'amber'
      };
    } catch (e) {
      return { mode: 'dark', accent: 'amber' };
    }
  }

  function writeTheme(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function applyTheme(state) {
    document.documentElement.dataset.mode = state.mode;
    document.documentElement.dataset.accent = state.accent;
  }

  function initThemeSwitcher() {
    const trigger = document.getElementById('theme-trigger');
    const panel = document.getElementById('theme-panel');
    if (!trigger || !panel) return;

    const state = readTheme();
    applyTheme(state);
    syncSwitcherUI(panel, state);

    /* 打开 / 关闭面板 */
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      const open = panel.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    /* 点击外部关闭 */
    document.addEventListener('click', function (e) {
      if (!panel.classList.contains('is-open')) return;
      if (panel.contains(e.target) || trigger.contains(e.target)) return;
      panel.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    });

    /* ESC 关闭 */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        panel.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    /* 模式切换 */
    panel.querySelectorAll('.theme-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const mode = btn.dataset.mode;
        const cur = readTheme();
        const next = { mode: mode, accent: cur.accent };
        applyTheme(next);
        writeTheme(next);
        syncSwitcherUI(panel, next);
      });
    });

    /* 主色切换 */
    panel.querySelectorAll('.theme-accent-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const accent = btn.dataset.accent;
        const cur = readTheme();
        const next = { mode: cur.mode, accent: accent };
        applyTheme(next);
        writeTheme(next);
        syncSwitcherUI(panel, next);
      });
    });
  }

  function syncSwitcherUI(panel, state) {
    panel.querySelectorAll('.theme-mode-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.mode === state.mode ? 'true' : 'false');
    });
    panel.querySelectorAll('.theme-accent-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.accent === state.accent ? 'true' : 'false');
    });
  }
})();
