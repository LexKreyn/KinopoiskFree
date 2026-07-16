// ==UserScript==
// @name           KinopoiskFree
// @name:ru        Бесплатный Кинопоиск
// @namespace      http://tampermonkey.net/
// @version        1.14
// @description    Add modal with links for free watch
// @description:ru Добавляет окно с ссылками для бесплатного просмотра
// @author         Lex
// @copyright      2024, Lex
// @icon           https://www.kinopoisk.ru/favicon.ico
// @icon64         https://www.kinopoisk.ru/favicon.ico
// @homepage       https://www.kinopoisk.ru/
// @match          https://*.kinopoisk.ru/*
// @grant          none
// @run-at         document-idle
// @license        MIT
// @updateURL      https://raw.githubusercontent.com/LexKreyn/KinopoiskFree/main/kinopoiskfree.meta.js
// @downloadURL    https://raw.githubusercontent.com/LexKreyn/KinopoiskFree/main/kinopoiskfree.user.js
// @homepageURL    https://github.com/LexKreyn/KinopoiskFree#readme
// @supportURL     https://github.com/LexKreyn/KinopoiskFree/issues
// ==/UserScript==

(function () {
  'use strict';

  const freeHosts = {
    'Channel': 'tg://resolve?domain=poiskkino_free',
    'Amogus': 'https://e.amogus.work/{filmId}',
    'FlicksBar': 'https://flcksbr.top/film/{filmId}/',
    'FBdomen': 'https://fbdomen.top/film/{filmId}/',
    'FBfind': 'https://fbfind.life/film/{filmId}/',
    'WTF': 'https://kinopoisk.wtf/film/{filmId}/',
    'GoKino': 'https://matrix.gokino.by/{filmId}',
    'iFrame': 'https://iframe.cloud/iframe/{filmId}',
    'MIM': 'https://kinopoisk.mom/film/{filmId}/',
    'FFML': 'https://8f58edac.ffml.site/film/{filmId}/',
    'KinoPK': 'https://kinopk.web.app/movie/{filmId}',
    'Habster': 'https://habster.sbs/film/{filmId}/',
    'KPRU': 'https://i.kpru.top/film/{filmId}/',
  };

  function format(str, params) {
    return str.replace(/{(\w+)}/g, (m, k) => (params[k] ?? m));
  }

  const playIconSvg = `
    <svg class="kp-free__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 5v14l11-7z"></path>
    </svg>
  `;

  const STYLE_ID = 'kp-free-style';
  const MODAL_ID = 'kp-free-modal';

  function generateSoftColors(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }

    const hue = Math.abs(hash % 360);
    const sat = 30 + (Math.abs(hash >> 5) % 25);
    const light = 75 + (Math.abs(hash >> 10) % 15);

    const textSat = sat + 15;
    const textLight = Math.max(15, light - 40);

    const bgColor = `hsl(${hue}, ${sat}%, ${light}%)`;
    const textColor = `hsl(${hue}, ${textSat}%, ${textLight}%)`;

    return { bg: bgColor, text: textColor };
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes kpFreeBounceIn {
        0% { opacity: 0; transform: scale(0.5) rotate(-10deg); }
        60% { opacity: 1; transform: scale(1.05) rotate(2deg); }
        80% { transform: scale(0.95) rotate(-1deg); }
        100% { opacity: 1; transform: scale(1) rotate(0deg); }
      }

      @keyframes kpFreePulse {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.3); opacity: 0; }
      }

      @keyframes kpFreeShine {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }

      @keyframes kpFreeGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.2), 0 0 60px rgba(255, 215, 0, 0.05); }
        50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.3), 0 0 80px rgba(255, 215, 0, 0.08); }
      }

      #kp-free-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
        color: #ffd700;
        border: 2px solid #ffd700;
        border-radius: 50px;
        padding: 12px 24px;
        width: 230px;
        font-family: var(--font-family,"Graphik Kinopoisk LC Web",Tahoma,Arial,Verdana,sans-serif);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(255, 215, 0, 0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        user-select: none;
        animation: kpFreeBounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, kpFreeGlow 3s ease-in-out infinite;
        overflow: hidden;
        opacity: 0;
        animation-fill-mode: forwards;
        white-space: nowrap;
        box-sizing: border-box;
        flex-shrink: 0;
      }
      #kp-free-toggle::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.08), transparent);
        background-size: 200% 100%;
        animation: kpFreeShine 3s linear infinite;
        pointer-events: none;
      }
      #kp-free-toggle::after {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 50px;
        background: linear-gradient(135deg, #ffd700, #ff6b00);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: -1;
        filter: blur(8px);
      }
      #kp-free-toggle:hover::after {
        opacity: 0.3;
      }
      #kp-free-toggle:hover {
        transform: scale(1.05) translateY(-2px);
        box-shadow: 0 6px 30px rgba(255, 215, 0, 0.3);
        background: linear-gradient(135deg, #2a2a2a, #3a3a3a);
        animation-play-state: paused;
      }
      #kp-free-toggle:active {
        transform: scale(0.95);
      }
      #kp-free-toggle .kp-free__icon {
        width: 20px;
        height: 20px;
        fill: currentColor;
        filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.3));
        flex-shrink: 0;
      }
      #kp-free-toggle .pulse-ring {
        position: absolute;
        inset: -4px;
        border-radius: 50px;
        border: 2px solid rgba(255, 215, 0, 0.3);
        animation: kpFreePulse 2s ease-out infinite;
        pointer-events: none;
      }
      #kp-free-toggle .btn-text {
        display: inline-block;
        width: 150px;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      #kp-free-modal {
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 999998;
        font-family: var(--font-family,"Graphik Kinopoisk LC Web",Tahoma,Arial,Verdana,sans-serif);
        font-size: 14px;
        font-weight: var(--font-weight-medium,500);
        font-style: normal;
        line-height: 17px;
        background: #141414;
        border-radius: 16px;
        padding: 8px;
        width: 220px;
        max-height: 310px;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
        overflow: hidden;
        transform-origin: bottom right;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
        transform: translateY(20px) scale(0.95);
      }
      #kp-free-modal.open {
        pointer-events: auto;
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      #kp-free-modal.closing {
        pointer-events: none;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      #kp-free-modal ul {
        list-style: none;
        padding: 4px 0 4px 0;
        margin: 0;
        max-height: 290px;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-width: thin;
        scrollbar-color: #4a4a4a transparent;
      }
      #kp-free-modal ul::-webkit-scrollbar {
        width: 6px;
      }
      #kp-free-modal ul::-webkit-scrollbar-track {
        background: transparent;
        margin: 4px 0;
        border-radius: 10px;
      }
      #kp-free-modal ul::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #5a5a5a, #3a3a3a);
        border-radius: 10px;
        border: 1px solid #2a2a2a;
        transition: background 0.3s ease;
      }
      #kp-free-modal ul::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #7a7a7a, #5a5a5a);
      }
      #kp-free-modal ul::-webkit-scrollbar-button {
        display: none;
      }
      #kp-free-modal li {
        margin: 4px 0;
        padding-right: 4px;
      }
      #kp-free-modal a {
        color: #a1a1a1;
        text-decoration: none;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 10px;
        background: transparent;
        position: relative;
        overflow: hidden;
        max-width: 100%;
      }
      #kp-free-modal a::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
        transform: translateX(-100%);
        transition: transform 0.4s ease;
      }
      #kp-free-modal a:hover::after {
        transform: translateX(100%);
      }
      #kp-free-modal a:hover {
        transform: translateX(3px);
        filter: brightness(0.95) saturate(1.1);
      }
      #kp-free-modal a:active {
        transform: scale(0.97);
      }
      #kp-free-modal a.featured {
        background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
        border: 1px solid #ffd700;
        color: #ffd700;
        font-weight: 600;
        padding: 8px 10px;
        margin-bottom: 6px;
        box-shadow: 0 2px 12px rgba(255, 215, 0, 0.1);
        position: relative;
      }
      #kp-free-modal a.featured::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 10px;
        background: linear-gradient(135deg, rgba(255,215,0,0.05), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      #kp-free-modal a.featured:hover::before {
        opacity: 1;
      }
      #kp-free-modal a.featured:hover {
        background: linear-gradient(135deg, #3a3a3a, #2a2a2a);
        border-color: #ffd700;
        box-shadow: 0 2px 20px rgba(255, 215, 0, 0.2);
        transform: translateX(3px);
      }
      #kp-free-modal a.featured .kp-free__icon {
        display: none;
      }
      #kp-free-modal a.colored {
        padding: 6px 10px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 100%;
      }
      #kp-free-modal a.colored:hover {
        border-color: rgba(0, 0, 0, 0.15);
        transform: translateX(3px);
        filter: brightness(0.92) saturate(1.1);
      }
      .kp-free__icon {
        width: 18px;
        height: 18px;
        fill: currentColor;
        flex: 0 0 auto;
      }
    `;
    document.head.appendChild(style);
  }

  function parseIdFromUrl(urlString) {
    try {
      const u = new URL(urlString, location.origin);
      const m = u.pathname.match(/\/(film|series)\/(\d+)/);
      return m ? m[2] : null;
    } catch {
      return null;
    }
  }

  function getFilmId() {
    const fromPath = parseIdFromUrl(location.href);
    if (fromPath) return fromPath;

    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    const fromCanonical = canonical ? parseIdFromUrl(canonical) : null;
    if (fromCanonical) return fromCanonical;

    const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content');
    const fromOg = ogUrl ? parseIdFromUrl(ogUrl) : null;
    if (fromOg) return fromOg;

    return null;
  }

  function shouldShowOnThisPage(filmId) {
    if (!filmId) return false;
    return true;
  }

  function createToggleButton() {
    const button = document.createElement('button');
    button.id = 'kp-free-toggle';

    const pulseRing = document.createElement('div');
    pulseRing.className = 'pulse-ring';
    button.appendChild(pulseRing);

    const iconWrapper = document.createElement('span');
    iconWrapper.innerHTML = playIconSvg;

    const textSpan = document.createElement('span');
    textSpan.className = 'btn-text';
    textSpan.textContent = 'Смотреть бесплатно';

    button.appendChild(iconWrapper);
    button.appendChild(textSpan);
    return button;
  }

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = MODAL_ID;

    const ul = document.createElement('ul');

    const entries = Object.entries(freeHosts);
    entries.forEach(([name, urlTpl], index) => {
      const li = document.createElement('li');
      const a = document.createElement('a');

      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.dataset.kpFreeHost = name;
      a.dataset.kpFreeTpl = urlTpl;

      if (index === 0) {
        a.classList.add('featured');
        a.innerHTML = '⭐ <span>' + name + '</span>';
      } else {
        const colors = generateSoftColors(name);
        a.classList.add('colored');
        a.style.backgroundColor = colors.bg;
        a.style.color = colors.text;
        a.innerHTML = playIconSvg + `<span>${name}</span>`;
      }

      li.appendChild(a);
      ul.appendChild(li);
    });

    modal.appendChild(ul);

    const toggleBtn = createToggleButton();
    document.body.appendChild(toggleBtn);
    document.body.appendChild(modal);

    modal.style.display = 'block';
    modal.classList.remove('open', 'closing');

    let isAnimating = false;
    let timeoutId = null;

    const toggleModal = (show) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (isAnimating) return;

      if (show) {
        modal.classList.remove('closing');
        modal.classList.add('open');
        const textSpan = toggleBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = 'Закрыть';
      } else {
        if (!modal.classList.contains('open')) return;

        modal.classList.remove('open');
        modal.classList.add('closing');
        isAnimating = true;
        const textSpan = toggleBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = 'Смотреть бесплатно';

        timeoutId = setTimeout(() => {
          modal.classList.remove('closing');
          isAnimating = false;
          timeoutId = null;
        }, 250);
      }
    };

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();

      const isOpen = modal.classList.contains('open');
      toggleModal(!isOpen);
    });

    document.addEventListener('click', (e) => {
      if (modal.classList.contains('open') &&
          !modal.contains(e.target) &&
          !toggleBtn.contains(e.target)) {
        toggleModal(false);
      }
    });

    modal.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    return modal;
  }

  function updateLinks(filmId) {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    modal.setAttribute('data-film-id', filmId);

    const anchors = modal.querySelectorAll('a[data-kp-free-tpl]');
    anchors.forEach(a => {
      const tpl = a.dataset.kpFreeTpl;
      a.href = format(tpl, { filmId });
    });
  }

  function setModalVisible(isVisible) {
    const modal = document.getElementById(MODAL_ID);
    const toggle = document.getElementById('kp-free-toggle');

    if (modal && !isVisible) {
      modal.classList.remove('open', 'closing');
      modal.style.display = 'block';
    }

    if (toggle) {
      toggle.style.display = isVisible ? 'flex' : 'none';
      if (!isVisible) {
        const textSpan = toggle.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = 'Смотреть бесплатно';
      }
    }
  }

  function cleanupKinopoiskModals() {
    try {
      const portalElements = document.querySelectorAll('.ReactModalPortal');
      portalElements.forEach(el => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });

      const modalContainer = document.getElementById('modal-container');
      if (modalContainer && modalContainer.parentNode) {
        modalContainer.parentNode.removeChild(modalContainer);
      }

      if (document.body) {
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      }

      if (document.documentElement) {
        document.documentElement.style.overflow = 'auto';
      }

      const overlays = document.querySelectorAll('[class*="overlay"], [class*="Overlay"], [class*="modal-backdrop"]');
      overlays.forEach(el => {
        if (!el.closest('#kp-free-modal') && !el.closest('#kp-free-toggle')) {
          const style = getComputedStyle(el);
          if (style.position === 'fixed' || style.position === 'absolute') {
            if (el.offsetWidth > 0 && el.offsetHeight > 0) {
              const rect = el.getBoundingClientRect();
              if (rect.width > window.innerWidth * 0.5 || rect.height > window.innerHeight * 0.5) {
                el.style.display = 'none';
              }
            }
          }
        }
      });

    } catch (e) {
      console.warn('[KP-Free]', e);
    }
  }

  let lastFilmId = null;
  let scheduled = false;
  let cleanupInterval = null;

  function refresh() {
    scheduled = false;

    cleanupKinopoiskModals();

    const filmId = getFilmId();
    if (!shouldShowOnThisPage(filmId)) {
      setModalVisible(false);
      lastFilmId = null;
      return;
    }

    ensureStyle();
    ensureModal();
    setModalVisible(true);

    if (filmId && filmId !== lastFilmId) {
      lastFilmId = filmId;
      updateLinks(filmId);
    }
  }

  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(refresh, 50);
  }

  function startPeriodicCleanup() {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }

    cleanupInterval = setInterval(() => {
      if (!document.hidden) {
        cleanupKinopoiskModals();
      }
    }, 1000);
  }

  function stopPeriodicCleanup() {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  }

  function hookHistory() {
    const _pushState = history.pushState;
    const _replaceState = history.replaceState;

    history.pushState = function (...args) {
      const ret = _pushState.apply(this, args);
      window.dispatchEvent(new Event('kp-free:navigation'));
      return ret;
    };

    history.replaceState = function (...args) {
      const ret = _replaceState.apply(this, args);
      window.dispatchEvent(new Event('kp-free:navigation'));
      return ret;
    };

    window.addEventListener('popstate', () => window.dispatchEvent(new Event('kp-free:navigation')));
    window.addEventListener('kp-free:navigation', scheduleRefresh, { passive: true });
  }

  function hookHeadObserver() {
    const head = document.head;
    if (!head) return;

    const mo = new MutationObserver(() => scheduleRefresh());
    mo.observe(head, { subtree: true, childList: true, attributes: true, characterData: false });
  }

  function hookBodyObserver() {
    const body = document.body;
    if (!body) return;

    const mo = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('ReactModalPortal') ||
                (node.id && node.id === 'modal-container')) {
              cleanupKinopoiskModals();
              setTimeout(cleanupKinopoiskModals, 100);
            }
          }
        });
      });
    });

    mo.observe(body, {
      subtree: true,
      childList: true,
      attributes: false
    });

    return mo;
  }

  function init() {
    hookHistory();
    hookHeadObserver();
    hookBodyObserver();

    cleanupKinopoiskModals();
    startPeriodicCleanup();

    refresh();

    window.addEventListener('beforeunload', () => {
      stopPeriodicCleanup();
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        cleanupKinopoiskModals();
      }
    });
  }

  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init, { once: true });
  }
})();
