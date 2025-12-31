// ==UserScript==
// @name           KinopoiskFree
// @name:ru        Бесплатный Кинопоиск
// @namespace      http://tampermonkey.net/
// @version        1.13
// @description    Add modal with links for free watch (SPA-safe)
// @description:ru Добавляет окно с ссылками для бесплатного просмотра (SPA-safe)
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
    'db.lol': 'https://ddbb.lol/?id={filmId}&n=0',
    'C_X': 'https://ww2.kpfr.online/film/{filmId}/',
    'FlicksBar': 'https://flcksbr.top/film/{filmId}/',
    'ReYohoho': 'https://reyohoho.github.io/reyohoho/movie/{filmId}',
  };

  function format(str, params) {
    return str.replace(/{(\w+)}/g, (m, k) => (params[k] ?? m));
  }

  // Inline SVG — без внешней загрузки, поэтому не будет "битой картинки"
  const playIconSvg = `
    <svg class="kp-free__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 5v14l11-7z"></path>
    </svg>
  `;

  const STYLE_ID = 'kp-free-style';
  const MODAL_ID = 'kp-free-modal';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .kp-free-modal {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        font-family: var(--font-family,"Graphik Kinopoisk LC Web",Tahoma,Arial,Verdana,sans-serif);
        font-size: 15px;
        font-weight: var(--font-weight-medium,500);
        font-style: normal;
        line-height: 18px;
        background: #141414;
        border-radius: 16px;
        padding: 6px;
        width: 210px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        animation: kpFreeFadeIn 0.2s ease-out;
      }
      .kp-free-modal ul { list-style: none; padding: 0; margin: 0; }
      .kp-free-modal li { margin: 8px 0; }
      .kp-free-modal a {
        color: #a1a1a1;
        text-decoration: none;
        transition: color 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 8px;
      }
      .kp-free-modal a:hover { color: #ffffff; }
      .kp-free__icon { width: 18px; height: 18px; fill: currentColor; flex: 0 0 auto; }

      @keyframes kpFreeFadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
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
    // 1) Самый быстрый и частый вариант — текущий URL
    const fromPath = parseIdFromUrl(location.href);
    if (fromPath) return fromPath;

    // 2) canonical (часто обновляется в SPA)
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    const fromCanonical = canonical ? parseIdFromUrl(canonical) : null;
    if (fromCanonical) return fromCanonical;

    // 3) og:url
    const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content');
    const fromOg = ogUrl ? parseIdFromUrl(ogUrl) : null;
    if (fromOg) return fromOg;

    return null;
  }

  function shouldShowOnThisPage(filmId) {
    if (!filmId) return false;
    // показываем только на /film/<id> или /series/<id> (или если canonical/og:url дал id)
    return true;
  }

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'kp-free-modal';
    modal.id = MODAL_ID;

    const ul = document.createElement('ul');

    for (const [name, urlTpl] of Object.entries(freeHosts)) {
      const li = document.createElement('li');
      const a = document.createElement('a');

      // классы из вашего исходника — оставил, если KP на них завязан
      a.classList.add('styles_root__7mPJN', 'styles_darkThemeItem__E_aGY');

      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.dataset.kpFreeHost = name;
      a.dataset.kpFreeTpl = urlTpl;
      a.innerHTML = playIconSvg + `<span>${name}</span>`;

      li.appendChild(a);
      ul.appendChild(li);
    }

    modal.appendChild(ul);
    document.body.appendChild(modal);
    return modal;
  }

  function updateLinks(filmId) {
    const modal = ensureModal();
    modal.setAttribute('data-film-id', filmId);

    const anchors = modal.querySelectorAll('a[data-kp-free-tpl]');
    anchors.forEach(a => {
      const tpl = a.dataset.kpFreeTpl;
      a.href = format(tpl, { filmId });
    });
  }

  function setModalVisible(isVisible) {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    modal.style.display = isVisible ? '' : 'none';
  }

  let lastFilmId = null;
  let scheduled = false;

  function refresh() {
    scheduled = false;

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
    // Дать SPA дорендерить head/canonical и т.п.
    setTimeout(refresh, 50);
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

  function init() {
    hookHistory();
    hookHeadObserver();
    refresh();
  }

  // 2) Грузим после полной загрузки страницы (чтобы не было артефактов)
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init, { once: true });
  }
})();
