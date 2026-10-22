(() => {
  'use strict';

  const POSTS = Array.isArray(window.PORTFOLIO_POSTS) ? window.PORTFOLIO_POSTS : [];
  const CONFIG = window.PORTFOLIO_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const page = document.body.dataset.page || 'home';
  const state = {
    q: '', language: '', type: '', theme: '', format: '', sort: 'newest',
    collection: '', visible: POSTS.slice(), active: null, slide: 0
  };
  const FEATURED_IDS = Array.isArray(CONFIG.featuredPostIds) ? CONFIG.featuredPostIds.map(String) : [];
  const collectionDefs = Array.isArray(CONFIG.collections) ? CONFIG.collections : [];

  const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const decodeCaption = (value = '') => String(value).replace(/\n{3,}/g, '\n\n').trim();
  const tagsOf = post => post.tags || { language: 'Needs review', writing_type: 'Writing', themes: [], collections: [] };
  const themes = post => tagsOf(post).themes || [];
  const form = post => tagsOf(post).writing_type || 'Writing';
  const lang = post => tagsOf(post).language || 'Needs review';
  const dateObj = post => { const date = new Date(post.date || ''); return Number.isNaN(date.getTime()) ? null : date; };
  const dateLabel = post => { const date = dateObj(post); return date ? date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date unavailable'; };
  const shortDate = post => { const date = dateObj(post); return date ? date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''; };
  const meaningfulCaption = post => {
    const caption = decodeCaption(post.summary || '');
    return caption.length > 2 && !/^\.\.\.$/.test(caption) ? caption : '';
  };
  const cardTitle = post => {
    const caption = meaningfulCaption(post);
    if (caption) return caption.length > 72 ? caption.slice(0, 69).trimEnd() + '…' : caption;
    if (form(post) === 'Shayari') return 'A little shayari';
    if (themes(post).includes('Love & longing')) return 'Fragments of feeling';
    if (themes(post).includes('Life & reflection')) return 'A thought to keep';
    return 'A piece of writing';
  };
  const postCollections = post => tagsOf(post).collections || [];
  const configInstagram = CONFIG.instagram || { label: 'Instagram', url: 'https://www.instagram.com/electricfieldon/' };

  function applySiteConfig() {
    document.title = page === 'archive' ? `All writing — ${CONFIG.siteName || 'electricfieldon'}` : `${CONFIG.siteName || 'electricfieldon'} — a writing archive`;
    $$('[data-site-name]').forEach(el => { el.textContent = CONFIG.siteName || 'electricfieldon'; });
    $$('[data-site-subtitle]').forEach(el => { el.textContent = CONFIG.siteSubtitle || 'A WRITING ARCHIVE'; });
    $$('[data-footer-tagline]').forEach(el => { el.textContent = CONFIG.footerTagline || 'A small library for words that stay.'; });
    $$('[data-site-home]').forEach(el => { el.href = 'index.html'; });
    $$('[data-instagram-link]').forEach(el => {
      el.href = configInstagram.url || 'https://www.instagram.com/electricfieldon/';
      const isHeaderLink = el.classList.contains('instagram-link');
      const isViewerButton = el.classList.contains('button');
      const label = configInstagram.label || 'Instagram';
      const displayLabel = isViewerButton ? `Visit ${label}` : label;
      el.innerHTML = `${esc(displayLabel)} <span aria-hidden="true">↗</span>`;
      el.target = '_blank';
      el.rel = 'noreferrer';
    });
    const nav = $('#main-nav');
    if (nav) {
      const links = Array.isArray(CONFIG.navigation) ? CONFIG.navigation : [];
      const activeKey = page === 'archive' ? 'archive' : (window.location.hash === '#collections' ? 'mood' : 'featured');
      nav.innerHTML = links.map(item => {
        const href = page === 'archive' ? (item.archiveHref || item.homeHref || item.href || '#') : (item.homeHref || item.href || '#');
        const active = item.currentOn === activeKey;
        return `<a class="nav-link${active ? ' active' : ''}" href="${esc(href)}"${active ? ' aria-current="page"' : ''}>${esc(item.label || 'Link')}</a>`;
      }).join('');
    }
  }

  function initMobileNavigation() {
    const button = $('.menu-toggle');
    const nav = $('#main-nav');
    button?.addEventListener('click', () => {
      const open = nav?.classList.toggle('is-open') || false;
      button.setAttribute('aria-expanded', String(open));
    });
    nav?.querySelectorAll('a').forEach(anchor => anchor.addEventListener('click', () => {
      nav.classList.remove('is-open');
      button?.setAttribute('aria-expanded', 'false');
    }));
  }

  function postCardMarkup(post, featured = false) {
    const first = post.media && post.media[0];
    if (!first) return '';
    const tags = [...new Set([...(themes(post) || []), ...(lang(post) !== 'Needs review' ? [lang(post)] : []), form(post)])]
      .slice(0, 3).map(tag => `<span class="post-tag">${esc(tag)}</span>`).join('');
    return `<article class="post-card${featured ? ' featured-card' : ''}" tabindex="0" role="button" aria-label="Open ${esc(cardTitle(post))}" data-post-id="${esc(post.id)}">
      <div class="post-image-wrap"><img class="post-image" src="${esc(first.src)}" alt="Original writing artwork, post ${esc(post.post_number)}" loading="lazy" decoding="async">${featured ? '<span class="featured-stamp">FEATURED</span>' : ''}<span class="post-format-badge">${post.format === 'carousel' ? '▧ ' + post.media_count + ' SLIDES' : '✳ SINGLE'}</span></div>
      <div class="post-card-meta"><span class="post-card-num">PIECE ${String(post.post_number).padStart(3, '0')}</span><span class="post-card-date">${esc(shortDate(post))}</span></div>
      <h3 class="post-card-title">${esc(cardTitle(post))}</h3><div class="post-card-tags">${tags}</div>
    </article>`;
  }

  function wirePostCards(rootSelector) {
    const root = $(rootSelector);
    if (!root) return;
    $$('.post-card', root).forEach(card => {
      const open = () => openViewer(card.dataset.postId);
      card.addEventListener('click', open);
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
      });
    });
  }

  function renderFeatured() {
    const grid = $('#featured-grid');
    if (!grid) return;
    const featured = FEATURED_IDS.map(id => POSTS.find(post => String(post.id) === id)).filter(post => post && post.media && post.media.length);
    grid.innerHTML = featured.map(post => postCardMarkup(post, true)).join('');
    if (!featured.length) grid.innerHTML = '<p class="config-empty">Choose post IDs in <code>site-config.js</code> to show writing here.</p>';
    wirePostCards('#featured-grid');
  }

  function renderCollections() {
    const grid = $('#collection-grid');
    if (!grid) return;
    grid.innerHTML = collectionDefs.map(collection => {
      const count = POSTS.filter(post => postCollections(post).includes(collection.name)).length;
      return `<button class="collection-card" type="button" data-collection="${esc(collection.name)}" aria-label="Browse ${esc(collection.name)} collection">
        <span class="collection-top"><span>MOOD ${esc(collection.kicker || '')}</span><span class="collection-symbol">${esc(collection.symbol || '✳')}</span></span>
        <span class="collection-title">${esc(collection.name)}</span>
        <span class="collection-bottom"><span>${esc(collection.sub || '')} · ${count} pieces</span><span class="arrow" aria-hidden="true">↗</span></span>
      </button>`;
    }).join('');
    $$('[data-collection]', grid).forEach(button => button.addEventListener('click', () => {
      const collection = button.dataset.collection;
      window.location.href = `archive.html?collection=${encodeURIComponent(collection)}`;
    }));
  }

  function setOptions(selector, values, firstLabel) {
    const element = $(selector);
    if (!element) return;
    const current = element.value;
    element.innerHTML = `<option value="">${esc(firstLabel)}</option>` + values.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
    if (values.includes(current)) element.value = current;
  }

  function initFilters() {
    if (!$('#post-grid')) return;
    const params = new URLSearchParams(window.location.search);
    state.collection = params.get('collection') || '';
    setOptions('#filter-language', [...new Set(POSTS.map(lang))].sort((a, b) => a.localeCompare(b)), 'All languages');
    setOptions('#filter-type', [...new Set(POSTS.map(form))].sort((a, b) => a.localeCompare(b)), 'All forms');
    setOptions('#filter-theme', [...new Set(POSTS.flatMap(themes))].sort((a, b) => a.localeCompare(b)), 'All themes');

    ['#filter-language', '#filter-type', '#filter-theme', '#filter-format', '#sort'].forEach(selector => {
      $(selector)?.addEventListener('change', () => {
        state.language = $('#filter-language').value;
        state.type = $('#filter-type').value;
        state.theme = $('#filter-theme').value;
        state.format = $('#filter-format').value;
        state.sort = $('#sort').value;
        renderArchive();
      });
    });
    $('#search')?.addEventListener('input', event => { state.q = event.target.value.toLowerCase().trim(); renderArchive(); });
    const toggle = $('#filters-toggle');
    toggle?.addEventListener('click', () => {
      const panel = $('.filter-panel');
      const opened = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(opened));
      toggle.innerHTML = opened ? 'Filters <span aria-hidden="true">−</span>' : 'Filters <span aria-hidden="true">＋</span>';
    });
    $('#clear-filters')?.addEventListener('click', clearFilters);
    $('#empty-clear')?.addEventListener('click', clearFilters);
    $('#clear-collection')?.addEventListener('click', () => {
      state.collection = '';
      const url = new URL(window.location.href); url.searchParams.delete('collection');
      try { history.replaceState({}, '', url); } catch (_) {}
      renderArchive();
    });
  }

  function clearFilters() {
    state.q = ''; state.language = ''; state.type = ''; state.theme = ''; state.format = ''; state.collection = ''; state.sort = 'newest';
    if ($('#search')) $('#search').value = '';
    if ($('#filter-language')) $('#filter-language').value = '';
    if ($('#filter-type')) $('#filter-type').value = '';
    if ($('#filter-theme')) $('#filter-theme').value = '';
    if ($('#filter-format')) $('#filter-format').value = '';
    if ($('#sort')) $('#sort').value = 'newest';
    const url = new URL(window.location.href); url.searchParams.delete('collection');
    try { history.replaceState({}, '', url); } catch (_) {}
    renderArchive();
  }

  function matchPost(post) {
    if (state.language && lang(post) !== state.language) return false;
    if (state.type && form(post) !== state.type) return false;
    if (state.theme && !themes(post).includes(state.theme)) return false;
    if (state.format && post.format !== state.format) return false;
    if (state.collection && !postCollections(post).includes(state.collection)) return false;
    if (state.q) {
      const haystack = [post.caption, post.summary, post.id, lang(post), form(post), ...themes(post), ...postCollections(post)].join(' ').toLowerCase();
      if (!haystack.includes(state.q)) return false;
    }
    return true;
  }

  function renderArchiveContext() {
    const context = $('#archive-context');
    if (!context) return;
    const label = $('#archive-context-label');
    if (state.collection) {
      label.textContent = `Browsing mood: ${state.collection}`;
      context.hidden = false;
    } else {
      context.hidden = true;
    }
  }

  function renderArchive() {
    const grid = $('#post-grid');
    if (!grid) return;
    let rows = POSTS.filter(matchPost);
    rows.sort((a, b) => {
      const da = dateObj(a)?.getTime() || 0, db = dateObj(b)?.getTime() || 0;
      return state.sort === 'oldest' ? da - db : db - da;
    });
    state.visible = rows;
    const selectedLabel = state.collection ? ` in ${state.collection}` : ' in the archive';
    $('#results-count').textContent = `${rows.length} ${rows.length === 1 ? 'piece' : 'pieces'}${rows.length === POSTS.length && !state.collection ? ' in the archive' : selectedLabel}`;
    grid.innerHTML = rows.map(post => postCardMarkup(post, false)).join('');
    $('#empty-state').hidden = rows.length > 0;
    grid.style.display = rows.length ? 'block' : 'none';
    renderArchiveContext();
    wirePostCards('#post-grid');
  }

  function openViewer(id) {
    const post = POSTS.find(item => String(item.id) === String(id));
    if (!post) return;
    state.active = post; state.slide = 0; updateViewer();
    const viewer = $('#viewer');
    viewer.hidden = false;
    document.body.classList.add('body-no-scroll');
    $('.viewer-close')?.focus();
  }

  function updateViewer() {
    const post = state.active;
    if (!post) return;
    const media = post.media || [];
    const item = media[state.slide] || media[0];
    $('#viewer-number').textContent = `PIECE ${String(post.post_number).padStart(3, '0')}`;
    $('#viewer-image').src = item?.src || '';
    $('#viewer-image').alt = `Original artwork, piece ${post.post_number}, slide ${state.slide + 1} of ${media.length}`;
    $('#slide-counter').textContent = media.length > 1 ? `${String(state.slide + 1).padStart(2, '0')} / ${String(media.length).padStart(2, '0')}` : '';
    $('#slide-prev').disabled = state.slide <= 0;
    $('#slide-next').disabled = state.slide >= media.length - 1;
    $('#slide-prev').style.visibility = media.length > 1 ? 'visible' : 'hidden';
    $('#slide-next').style.visibility = media.length > 1 ? 'visible' : 'hidden';
    $('#viewer-format').textContent = post.format === 'carousel' ? `CAROUSEL · ${media.length} SLIDES` : 'SINGLE POST';
    $('#viewer-title').textContent = cardTitle(post);
    $('#viewer-date').textContent = dateLabel(post);
    const tags = [...new Set([...(themes(post) || []), ...(lang(post) !== 'Needs review' ? [lang(post)] : []), form(post)])].slice(0, 3);
    $('#viewer-tags').innerHTML = tags.map(tag => `<span class="post-tag">${esc(tag)}</span>`).join('');
    const caption = decodeCaption(post.caption || '').replace(/(?:#[\w]+\s*)+/g, '').trim();
    $('#viewer-caption').textContent = /^([.\s]|✍️)*$/.test(caption) ? '' : caption;
    $('#viewer-caption').style.display = $('#viewer-caption').textContent ? 'block' : 'none';
    $('#copy-title').textContent = 'Copy caption';
  }

  function closeViewer() {
    const viewer = $('#viewer');
    if (viewer) viewer.hidden = true;
    document.body.classList.remove('body-no-scroll');
    state.active = null;
  }
  function nextSlide(direction) {
    if (!state.active) return;
    const max = (state.active.media || []).length - 1;
    state.slide = Math.max(0, Math.min(max, state.slide + direction));
    updateViewer();
  }

  function initViewer() {
    $('#slide-prev')?.addEventListener('click', () => nextSlide(-1));
    $('#slide-next')?.addEventListener('click', () => nextSlide(1));
    $$('[data-close-viewer]').forEach(button => button.addEventListener('click', closeViewer));
    document.addEventListener('keydown', event => {
      if (!$('#viewer') || $('#viewer').hidden) return;
      if (event.key === 'Escape') closeViewer();
      if (event.key === 'ArrowLeft') nextSlide(-1);
      if (event.key === 'ArrowRight') nextSlide(1);
    });
    $('#copy-title')?.addEventListener('click', async () => {
      const value = state.active?.caption || '';
      try {
        await navigator.clipboard.writeText(value);
        $('#copy-title').textContent = 'Copied';
      } catch (error) {
        const area = document.createElement('textarea'); area.value = value; document.body.appendChild(area); area.select();
        try { document.execCommand('copy'); $('#copy-title').textContent = 'Copied'; } catch (_) {}
        area.remove();
      }
      window.setTimeout(() => { if ($('#viewer') && !$('#viewer').hidden) $('#copy-title').textContent = 'Copy caption'; }, 1500);
    });
    let touchX = null;
    $('#viewer-image')?.addEventListener('touchstart', event => { touchX = event.changedTouches[0]?.screenX ?? null; }, { passive: true });
    $('#viewer-image')?.addEventListener('touchend', event => {
      if (touchX === null) return;
      const dx = (event.changedTouches[0]?.screenX ?? touchX) - touchX;
      if (Math.abs(dx) > 45) nextSlide(dx < 0 ? 1 : -1);
      touchX = null;
    }, { passive: true });
  }

  applySiteConfig();
  initMobileNavigation();
  initViewer();
  if (page === 'home') {
    renderFeatured();
    renderCollections();
  }
  if (page === 'archive') {
    initFilters();
    renderArchive();
  }
})();
