(() => {
  'use strict';

  /* ---------- Data and helpers ---------- */
  const POSTS = Array.isArray(window.PORTFOLIO_POSTS) ? window.PORTFOLIO_POSTS : [];
  const CONFIG = window.PORTFOLIO_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const page = document.body.dataset.page || 'book';
  const html = document.documentElement;

  const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const decodeCaption = (value = '') => String(value).replace(/\n{3,}/g, '\n\n').trim();
  // Removes hashtags (including Hindi/Urdu ones) and captions that are only dots or the ✍️ sign.
  const cleanCaption = (value = '') => {
    const text = decodeCaption(value).replace(/#[\p{L}\p{M}\p{N}_]+/gu, '').replace(/[ \t]+\n/g, '\n').trim();
    return /^[.\s…✍️\uFE0F]*$/u.test(text) ? '' : text;
  };
  const HIDDEN_LANGUAGE = 'Needs review';
  const GENERIC_FORM = 'Writing';
  const tagsOf = post => post.tags || {};
  const themes = post => tagsOf(post).themes || [];
  const form = post => tagsOf(post).writing_type || GENERIC_FORM;
  const lang = post => tagsOf(post).language || HIDDEN_LANGUAGE;
  const postCollections = post => tagsOf(post).collections || [];
  const time = post => { const t = new Date(post.date || '').getTime(); return Number.isNaN(t) ? 0 : t; };
  const newestFirst = (a, b) => time(b) - time(a);
  const dateLabel = post => time(post) ? new Date(time(post)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const monthLabel = post => time(post) ? new Date(time(post)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Undated';
  const thumbSrc = src => String(src || '').replace(/^assets\/media\//, 'assets/thumbs/');
  const byId = id => POSTS.find(post => String(post.id) === String(id));

  // Page numbers count from the oldest post, so new posts never renumber old ones.
  const PAGE_NUMBERS = new Map(POSTS.slice().sort((a, b) => time(a) - time(b)).map((post, i) => [String(post.id), i + 1]));
  const pageNo = post => PAGE_NUMBERS.get(String(post.id)) || post.post_number;

  const meaningfulCaption = post => {
    const caption = decodeCaption(post.summary || '');
    return caption.length > 2 && !/^\.\.\.$/.test(caption) ? caption : '';
  };
  const titleOf = post => {
    if (post.title) return String(post.title);
    const caption = meaningfulCaption(post);
    if (caption) {
      const base = caption.replace(/(\.{2,}|…)+\s*$/u, '').trimEnd();
      if (base.length > 72) return base.slice(0, 69).replace(/\s+\S*$/, '').trimEnd() + '…';
      return base.length < caption.length ? base + '…' : base;
    }
    if (form(post) === 'Shayari') return 'A little shayari';
    if (themes(post).includes('Love & longing')) return 'Fragments of feeling';
    if (themes(post).includes('Life & reflection')) return 'A thought to keep';
    return 'A piece of writing';
  };

  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const slugify = s => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const chapters = (Array.isArray(CONFIG.collections) ? CONFIG.collections : []).map((c, i) => ({
    name: c.name, sub: c.sub || '', roman: ROMAN[i] || String(i + 1), slug: slugify(c.name),
    posts: POSTS.filter(post => postCollections(post).includes(c.name)).sort(newestFirst)
  }));
  const chapterBySlug = slug => chapters.find(c => c.slug === slug);
  const chapterOf = post => chapters.find(c => c.posts.includes(post));
  const featured = (Array.isArray(CONFIG.featuredPostIds) ? CONFIG.featuredPostIds : []).map(String)
    .map(byId).filter(post => post && post.media && post.media.length);
  const instagramUrl = (CONFIG.instagram && CONFIG.instagram.url) || 'https://www.instagram.com/electricfieldon/';
  const siteName = CONFIG.siteName || 'electricfieldon';

  const PIECE_HASH = /^#piece-(\d+)$/;
  const CHAPTER_HASH = /^#chapter-([a-z0-9-]+)$/;
  const CONTENTS_HASHES = ['#contents', '#featured', '#collections', '#begin'];
  const store = {
    get() { try { return sessionStorage.getItem('ef-book-open'); } catch (_) { return null; } },
    set(v) { try { v ? sessionStorage.setItem('ef-book-open', '1') : sessionStorage.removeItem('ef-book-open'); } catch (_) {} }
  };

  function applySiteConfig() {
    $$('[data-site-name]').forEach(el => { el.textContent = siteName; });
    $$('[data-total]').forEach(el => { el.textContent = POSTS.length; });
    $$('[data-chapter-count]').forEach(el => { el.textContent = WORDS[chapters.length] || chapters.length; });
    if (CONFIG.coverLine) $$('[data-cover-line]').forEach(el => { el.textContent = CONFIG.coverLine; });
    const firstYear = POSTS.reduce((min, post) => time(post) ? Math.min(min, new Date(time(post)).getFullYear()) : min, Infinity);
    if (Number.isFinite(firstYear)) $$('[data-volume]').forEach(el => { el.textContent = `Volume I, since ${firstYear}`; });
    $$('[data-instagram-link]').forEach(el => { el.href = instagramUrl; el.target = '_blank'; el.rel = 'noreferrer'; });
  }

  function wireThumbFallback(root) {
    $$('img[data-full-src]', root).forEach(img => img.addEventListener('error', () => {
      if (!img.src.includes(img.dataset.fullSrc)) img.src = img.dataset.fullSrc;
    }, { once: true }));
  }
  function wireOpeners(root, getSequence) {
    $$('[data-post-id]', root).forEach(el => el.addEventListener('click', () => {
      const post = byId(el.dataset.postId);
      if (post) openReader(post, getSequence(), el);
    }));
  }

  /* ---------- Reader ---------- */
  const reader = { open: false, active: null, sequence: [], context: '', slide: 0, baseHash: '', pushed: false, returnFocus: null };

  function contextFor(sequence) {
    if (sequence === featured) return 'Begin here';
    const chapter = chapters.find(c => c.posts === sequence);
    if (chapter) return `Chapter ${chapter.roman}, ${chapter.name}`;
    return 'From the index';
  }

  function openReader(post, sequence, trigger, { push = true } = {}) {
    if (!reader.open) {
      reader.returnFocus = trigger || document.activeElement;
      reader.baseHash = PIECE_HASH.test(location.hash) ? reader.baseHash : location.hash;
    }
    reader.sequence = Array.isArray(sequence) && sequence.includes(post) ? sequence : [post];
    reader.context = contextFor(reader.sequence);
    reader.active = post; reader.slide = 0; reader.open = true;
    renderReader();
    $('#reader').hidden = false;
    html.classList.add('reader-open');
    if (push && location.hash !== `#piece-${post.id}`) {
      try { history.pushState({ piece: post.id }, '', `#piece-${post.id}`); reader.pushed = true; } catch (_) {}
    }
    const close = window.matchMedia('(max-width: 700px)').matches ? $('#reader .reader-x') : $('#reader .reader-close');
    close?.focus({ preventScroll: true });
  }

  function renderReader(direction = 0) {
    const post = reader.active;
    if (!post) return;
    const media = post.media || [];
    const item = media[reader.slide] || media[0];
    const several = media.length > 1;
    const img = $('#reader-image');
    img.src = item ? item.src : '';
    img.alt = `Artwork for page ${pageNo(post)}${several ? `, image ${reader.slide + 1} of ${media.length}` : ''}`;
    $('#slide-prev').hidden = !several; $('#slide-next').hidden = !several;
    $('#slide-prev').disabled = reader.slide <= 0;
    $('#slide-next').disabled = reader.slide >= media.length - 1;
    $('#slide-count').textContent = several ? `${reader.slide + 1} of ${media.length}` : '';

    if (direction !== 0 || !$('#reader-title').dataset.id || $('#reader-title').dataset.id !== String(post.id)) {
      $('#reader-context').textContent = reader.context;
      $('#reader-folio').textContent = `p. ${pageNo(post)}`;
      $('#reader-title').textContent = titleOf(post);
      $('#reader-title').dataset.id = post.id;
      $('#reader-date').textContent = dateLabel(post);
      const caption = cleanCaption(post.caption || '');
      $('#reader-caption').textContent = caption;
      $('#reader-caption').hidden = !caption;
      $('#copy-caption').hidden = !caption;
      $('#copy-caption').textContent = 'Copy caption';
      $('#copy-link').textContent = 'Copy link';
      const filed = [...new Set([...themes(post), lang(post) !== HIDDEN_LANGUAGE ? lang(post) : '', form(post) !== GENERIC_FORM ? form(post) : ''].filter(Boolean))];
      $('#reader-tags').textContent = filed.length ? `Filed under ${filed.join(', ')}` : '';
      $('#reader-instagram').href = post.source_url || instagramUrl;
      $('#reader-instagram').textContent = post.source_url ? 'View this post on Instagram' : 'View on Instagram';

      const i = reader.sequence.indexOf(post);
      const many = reader.sequence.length > 1;
      $('#prev-piece').hidden = !many; $('#next-piece').hidden = !many;
      $('#prev-piece').disabled = i <= 0;
      $('#next-piece').disabled = i >= reader.sequence.length - 1;
      $('#reader-pos').textContent = many ? `${i + 1} of ${reader.sequence.length}` : '';
      $('.reader-text').scrollTop = 0;
      $('.reader-book').scrollTop = 0;
    }
    if (direction) {
      const book = $('.reader-book');
      book.classList.remove('turn-next', 'turn-prev');
      void book.offsetWidth;
      book.classList.add(direction > 0 ? 'turn-next' : 'turn-prev');
    }
  }

  function goToPiece(post, direction, slide = 0) {
    reader.active = post; reader.slide = slide;
    renderReader(direction);
    try { history.replaceState({ piece: post.id }, '', `#piece-${post.id}`); } catch (_) {}
  }
  function turnPage(direction, { toLastSlide = false } = {}) {
    const i = reader.sequence.indexOf(reader.active);
    const next = reader.sequence[i + direction];
    if (!next) return;
    goToPiece(next, direction, direction < 0 && toLastSlide ? (next.media || []).length - 1 : 0);
  }
  function step(direction) {
    const count = (reader.active.media || []).length;
    const slide = reader.slide + direction;
    if (slide >= 0 && slide < count) { reader.slide = slide; renderReader(); return; }
    turnPage(direction, { toLastSlide: true });
  }

  function hideReader() {
    $('#reader').hidden = true;
    html.classList.remove('reader-open');
    reader.open = false; reader.active = null;
    const target = reader.returnFocus; reader.returnFocus = null;
    if (target && document.contains(target)) target.focus({ preventScroll: true });
  }
  function closeReader() {
    if (!reader.open) return;
    if (PIECE_HASH.test(location.hash)) {
      if (reader.pushed) { reader.pushed = false; history.back(); return; } // popstate hides it
      try { history.replaceState(null, '', location.pathname + location.search + (reader.baseHash || '')); } catch (_) {}
    }
    hideReader();
  }

  async function copyText(value, button, label) {
    try { await navigator.clipboard.writeText(value); button.textContent = 'Copied'; }
    catch (_) {
      const area = document.createElement('textarea'); area.value = value; document.body.appendChild(area); area.select();
      try { document.execCommand('copy'); button.textContent = 'Copied'; } catch (__) {}
      area.remove();
    }
    window.setTimeout(() => { if (reader.open) button.textContent = label; }, 1600);
  }

  function initReader() {
    const el = $('#reader');
    if (!el) return;
    $$('[data-close-reader]', el).forEach(b => b.addEventListener('click', closeReader));
    $('#slide-prev').addEventListener('click', () => { if (reader.slide > 0) { reader.slide--; renderReader(); } });
    $('#slide-next').addEventListener('click', () => { if (reader.slide < reader.active.media.length - 1) { reader.slide++; renderReader(); } });
    $('#prev-piece').addEventListener('click', () => turnPage(-1));
    $('#next-piece').addEventListener('click', () => turnPage(1));
    $('#copy-caption').addEventListener('click', e => copyText(cleanCaption(reader.active?.caption || ''), e.currentTarget, 'Copy caption'));
    $('#copy-link').addEventListener('click', e => copyText(`${location.origin}${location.pathname}#piece-${reader.active.id}`, e.currentTarget, 'Copy link'));

    document.addEventListener('keydown', event => {
      if (!reader.open) return;
      if (event.key === 'Escape') { event.preventDefault(); closeReader(); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
      else if (event.key === 'Tab') {
        const focusable = $$('button:not([disabled]), a[href]', $('.reader-book', el))
          .filter(node => !node.hidden && node.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        const inside = el.contains(document.activeElement);
        if (event.shiftKey && (document.activeElement === first || !inside)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !inside)) { event.preventDefault(); first.focus(); }
      }
    });

    let startX = null, startY = null;
    const art = $('.reader-art', el);
    art.addEventListener('touchstart', e => { startX = e.changedTouches[0].clientX; startY = e.changedTouches[0].clientY; }, { passive: true });
    art.addEventListener('touchend', e => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
      startX = startY = null;
    }, { passive: true });
  }

  /* ---------- The book (index.html) ---------- */
  let currentChapter = null;
  let lastHash = null;

  function plateMarkup(post) {
    const first = post.media[0];
    const pages = post.media.length > 1 ? `<span class="plate-pages">${post.media.length} pages</span>` : '';
    return `<button class="plate" type="button" data-post-id="${esc(post.id)}">
      <span class="plate-frame"><img src="${esc(thumbSrc(first.src))}" data-full-src="${esc(first.src)}" alt="" loading="lazy" decoding="async"></span>
      <span class="plate-cap"><span class="plate-page">p. ${pageNo(post)}</span><span class="plate-title">${esc(titleOf(post))}</span></span>${pages}
    </button>`;
  }

  function renderContents() {
    $('#toc').innerHTML = chapters.map(c => `<li><a class="toc-entry" href="#chapter-${c.slug}">
      <span class="toc-num">${c.roman}</span>
      <span class="toc-line"><span class="toc-title">${esc(c.name)}</span><span class="leader" aria-hidden="true"></span><span class="toc-count">${c.posts.length}<span class="vh"> pieces</span></span></span>
      <span class="toc-sub">${esc(c.sub)}</span></a></li>`).join('');
  }

  function renderChapter(chapter) {
    const i = chapters.indexOf(chapter);
    const prev = chapters[i - 1], next = chapters[i + 1];
    $('#chapter-nav').innerHTML = `<a href="#contents">‹ Contents</a><span>${prev ? `<a href="#chapter-${prev.slug}" aria-label="Previous chapter, ${esc(prev.name)}">‹ Chapter ${prev.roman}</a>` : ''}${next ? `<a href="#chapter-${next.slug}" aria-label="Next chapter, ${esc(next.name)}">Chapter ${next.roman} ›</a>` : ''}</span>`;
    $('#chapter-opener').innerHTML = `<p class="chapter-num">Chapter ${chapter.roman}</p>
      <h2 id="chapter-title">${esc(chapter.name)}</h2>
      <p class="chapter-epigraph">${esc(chapter.sub)}</p>
      <p class="chapter-meta">${chapter.posts.length} ${chapter.posts.length === 1 ? 'piece' : 'pieces'}, newest first</p>`;
    $('#plates').innerHTML = chapter.posts.map(plateMarkup).join('');
    $('#chapter-foot').innerHTML = next
      ? `<a class="next-chapter" href="#chapter-${next.slug}"><span>Next, chapter ${next.roman}</span><strong>${esc(next.name)}</strong></a>`
      : `<a class="next-chapter" href="archive.html"><span>The last chapter ends here</span><strong>Index of all pieces</strong></a>`;
    wireThumbFallback($('#plates'));
    wireOpeners($('#plates'), () => chapter.posts);
  }

  function showView(name) {
    $('#view-contents').hidden = name !== 'contents';
    $('#view-chapter').hidden = name !== 'chapter';
    $$('.bookbar-nav a[data-nav="contents"]').forEach(a => {
      if (name === 'contents') a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = name === 'chapter' && currentChapter ? `${currentChapter.name} — ${siteName}` : `${siteName} — a book of writing`;
  }

  function openBook({ animate = true } = {}) {
    if (html.classList.contains('book-open')) return;
    store.set(true);
    const cover = $('#cover');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish = () => { html.classList.add('book-open'); cover.classList.remove('is-opening'); };
    if (!animate || reduce) { finish(); return; }
    cover.classList.add('is-opening');
    window.setTimeout(() => { finish(); $('#contents-title')?.focus({ preventScroll: true }); }, 1150);
  }
  function closeBook() {
    store.set(false);
    try { history.replaceState(null, '', location.pathname); } catch (_) {}
    lastHash = '';
    showView('contents');
    window.scrollTo(0, 0);
    html.classList.remove('book-open');
    $('#cover-board')?.focus();
  }

  function showChapterView(chapter, scroll) {
    if (currentChapter !== chapter) { currentChapter = chapter; renderChapter(chapter); }
    showView('chapter');
    if (scroll) window.scrollTo(0, 0);
  }

  function routeBook() {
    const hash = location.hash;
    const cameFromPiece = lastHash !== null && PIECE_HASH.test(lastHash);
    const changed = hash !== lastHash;
    lastHash = hash;

    const piece = hash.match(PIECE_HASH);
    if (piece) {
      const post = byId(piece[1]);
      if (post) {
        openBook({ animate: false });
        if (!reader.open) {
          // Arrived by a shared link (or forward button): show the piece inside its chapter.
          const inChapter = !$('#view-chapter').hidden && currentChapter && currentChapter.posts.includes(post) ? currentChapter : chapterOf(post);
          if (inChapter) {
            showChapterView(inChapter, true);
            reader.baseHash = `#chapter-${inChapter.slug}`;
            openReader(post, inChapter.posts, null, { push: false });
          } else {
            showView('contents');
            reader.baseHash = '#contents';
            openReader(post, featured.includes(post) ? featured : POSTS.slice().sort(newestFirst), null, { push: false });
          }
        } else if (reader.active !== post) {
          goToPiece(post, 0);
        }
        return;
      }
    }
    if (reader.open) { reader.pushed = false; hideReader(); }

    const ch = hash.match(CHAPTER_HASH);
    const chapter = ch && chapterBySlug(ch[1]);
    if (chapter) { openBook({ animate: false }); showChapterView(chapter, changed && !cameFromPiece); return; }
    if (CONTENTS_HASHES.includes(hash)) {
      openBook({ animate: false });
      showView('contents');
      if (changed && !cameFromPiece) window.scrollTo(0, 0);
      return;
    }
    showView('contents');
  }

  function initBook() {
    renderContents();
    $('#cover-board').addEventListener('click', () => {
      openBook();
      if (!location.hash) { try { history.replaceState(null, '', '#contents'); lastHash = '#contents'; } catch (_) {} }
    });
    $$('[data-close-book]').forEach(b => b.addEventListener('click', closeBook));
    window.addEventListener('popstate', routeBook);
    window.addEventListener('hashchange', routeBook);
    routeBook();
  }

  /* ---------- The index (archive.html) ---------- */
  const filters = { q: '', chapter: '', language: '', type: '', format: '', sort: 'newest' };
  let visible = [];

  function entryMarkup(post) {
    const ch = chapterOf(post);
    const sub = [ch ? ch.name : '', form(post) !== GENERIC_FORM ? form(post) : ''].filter(Boolean).join(', ');
    return `<li><button class="entry" type="button" data-post-id="${esc(post.id)}">
      <span class="entry-thumb"><img src="${esc(thumbSrc(post.media[0].src))}" data-full-src="${esc(post.media[0].src)}" alt="" loading="lazy" decoding="async"></span>
      <span class="entry-body"><span class="entry-line"><span class="entry-title">${esc(titleOf(post))}</span><span class="leader" aria-hidden="true"></span><span class="entry-page">p. ${pageNo(post)}</span></span>
      <span class="entry-sub">${esc(sub)}${post.media.length > 1 ? `${sub ? ', ' : ''}${post.media.length} pages` : ''}</span></span>
    </button></li>`;
  }

  function setOptions(selector, values) {
    const el = $(selector);
    el.innerHTML = '<option value="">Any</option>' + values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  }

  function renderChips() {
    const chips = [{ slug: '', name: 'All chapters' }, ...chapters];
    $('#chapter-chips').innerHTML = chips.map(c => `<button class="chip" type="button" data-chapter="${esc(c.slug)}" aria-pressed="${filters.chapter === c.slug}">${esc(c.name)}</button>`).join('');
    $$('[data-chapter]', $('#chapter-chips')).forEach(b => b.addEventListener('click', () => {
      filters.chapter = b.dataset.chapter;
      const url = new URL(location.href);
      if (filters.chapter) url.searchParams.set('chapter', filters.chapter); else url.searchParams.delete('chapter');
      url.searchParams.delete('collection');
      try { history.replaceState(null, '', url); } catch (_) {}
      renderChips(); renderIndex();
    }));
  }

  function matches(post) {
    if (filters.chapter && !(chapterBySlug(filters.chapter)?.posts.includes(post))) return false;
    if (filters.language && lang(post) !== filters.language) return false;
    if (filters.type && form(post) !== filters.type) return false;
    if (filters.format && post.format !== filters.format) return false;
    if (filters.q) {
      const hay = [titleOf(post), post.caption, post.summary, `p. ${pageNo(post)}`, `p${pageNo(post)}`, pageNo(post), lang(post), form(post), ...themes(post), ...postCollections(post)].join(' ').toLowerCase();
      if (!hay.includes(filters.q)) return false;
    }
    return true;
  }

  function renderIndex() {
    visible = POSTS.filter(matches).sort((a, b) => filters.sort === 'oldest' ? time(a) - time(b) : time(b) - time(a));
    const groups = [];
    visible.forEach(post => {
      const label = monthLabel(post);
      if (!groups.length || groups[groups.length - 1].label !== label) groups.push({ label, posts: [] });
      groups[groups.length - 1].posts.push(post);
    });
    const list = $('#index-list');
    list.innerHTML = groups.map(g => `<section class="index-group"><h2>${esc(g.label)}</h2><ul class="entries">${g.posts.map(entryMarkup).join('')}</ul></section>`).join('');
    const chapter = filters.chapter && chapterBySlug(filters.chapter);
    $('#results-count').textContent = `${visible.length} ${visible.length === 1 ? 'piece' : 'pieces'}${chapter ? ` in ${chapter.name}` : visible.length === POSTS.length ? ' in the book' : ''}`;
    $('#empty-state').hidden = visible.length > 0;
    wireThumbFallback(list);
    wireOpeners(list, () => visible);
  }

  function clearFilters() {
    Object.assign(filters, { q: '', chapter: '', language: '', type: '', format: '', sort: 'newest' });
    $('#search').value = '';
    ['#filter-language', '#filter-type', '#filter-format'].forEach(s => { $(s).value = ''; });
    $('#sort').value = 'newest';
    const url = new URL(location.href); url.searchParams.delete('chapter'); url.searchParams.delete('collection');
    try { history.replaceState(null, '', url); } catch (_) {}
    renderChips(); renderIndex();
  }

  function routeIndex() {
    const piece = location.hash.match(PIECE_HASH);
    const post = piece && byId(piece[1]);
    if (post) {
      if (!reader.open) { reader.baseHash = ''; openReader(post, visible.includes(post) ? visible : POSTS.slice().sort(newestFirst), null, { push: false }); }
      else if (reader.active !== post) goToPiece(post, 0);
    } else if (reader.open) { reader.pushed = false; hideReader(); }
  }

  function initIndex() {
    const params = new URLSearchParams(location.search);
    const wanted = params.get('chapter') || params.get('collection') || '';
    const match = chapters.find(c => c.slug === wanted || c.name === wanted);
    filters.chapter = match ? match.slug : '';
    setOptions('#filter-language', [...new Set(POSTS.map(lang))].filter(v => v !== HIDDEN_LANGUAGE).sort((a, b) => a.localeCompare(b)));
    setOptions('#filter-type', [...new Set(POSTS.map(form))].filter(v => v !== GENERIC_FORM).sort((a, b) => a.localeCompare(b)));
    [['#filter-language', 'language'], ['#filter-type', 'type'], ['#filter-format', 'format'], ['#sort', 'sort']].forEach(([sel, key]) => {
      $(sel).addEventListener('change', e => { filters[key] = e.target.value; renderIndex(); });
    });
    $('#search').addEventListener('input', e => { filters.q = e.target.value.toLowerCase().trim(); renderIndex(); });
    $('#clear-filters').addEventListener('click', clearFilters);
    $('#empty-clear').addEventListener('click', clearFilters);
    renderChips();
    renderIndex();
    window.addEventListener('popstate', routeIndex);
    window.addEventListener('hashchange', routeIndex);
    routeIndex();
  }

  /* ---------- Start ---------- */
  applySiteConfig();
  initReader();
  if (page === 'book') initBook();
  if (page === 'index') initIndex();
})();
