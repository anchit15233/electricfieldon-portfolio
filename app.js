(() => {
  'use strict';
  const POSTS = Array.isArray(window.PORTFOLIO_POSTS) ? window.PORTFOLIO_POSTS : [];
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const state = {q:'', language:'', type:'', theme:'', format:'', sort:'newest', collection:'', visible:POSTS.slice(), active:null, slide:0};
  // Curated starter highlights: carousel, English reflection, Hindi shayari, and healing-themed writing.
  const FEATURED_IDS = ['18131672362827668','18074391296563116','18125390806695445','18129392350728020'];
  const collectionDefs = [
    {name:'Fragments of Love', sub:'Love, longing & the unsaid', symbol:'♡', theme:'Love & longing', kicker:'01'},
    {name:'Quiet Thoughts', sub:'Life, self & the world', symbol:'✳', theme:'Life & reflection', kicker:'02'},
    {name:'Hindi & Shayari', sub:'Words in Hindi and Urdu', symbol:'अ', theme:'Hindi & Urdu', kicker:'03'},
    {name:'Finding Light', sub:'Healing, hope & beginning again', symbol:'✳', theme:'Healing & hope', kicker:'04'},
    {name:'After Hours', sub:'The darker, softer corners', symbol:'☾', theme:'Dark & introspective', kicker:'05'}
  ];
  const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const decodeCaption = (s='') => String(s).replace(/\n{3,}/g,'\n\n').trim();
  const tagsOf = p => p.tags || {language:'Needs review', writing_type:'Writing', themes:[], collections:[]};
  const dateObj = p => {const d = new Date(p.date || ''); return Number.isNaN(d.getTime()) ? null : d;};
  const dateLabel = p => {const d=dateObj(p); return d ? d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : 'Date unavailable';};
  const shortDate = p => {const d=dateObj(p); return d ? d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '';};
  const themes = p => tagsOf(p).themes || [];
  const form = p => tagsOf(p).writing_type || 'Writing';
  const lang = p => tagsOf(p).language || 'Needs review';
  const htmlTags = p => [...new Set([...(themes(p)||[]), ...(lang(p)!=='Needs review'?[lang(p)]:[]), form(p)])].slice(0,3);
  const meaningfulCaption = p => {
    const cap = decodeCaption(p.summary || '');
    // Don't repeat export placeholder captions like only ✍️ or hashtags.
    return cap.length > 2 && !/^\.\.\.$/.test(cap) ? cap : '';
  };
  const cardTitle = p => {
    const c = meaningfulCaption(p);
    if (c) return c.length > 72 ? c.slice(0,69).trimEnd() + '…' : c;
    if (form(p)==='Shayari') return 'A little shayari';
    if ((themes(p)||[]).includes('Love & longing')) return 'Fragments of feeling';
    if ((themes(p)||[]).includes('Life & reflection')) return 'A thought to keep';
    return 'A piece of writing';
  };
  const setOptions = (sel, values, firstLabel) => {
    const el=$(sel); const current=el.value;
    el.innerHTML = `<option value="">${esc(firstLabel)}</option>` + values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    if (values.includes(current)) el.value=current;
  };
  function initFilters(){
    setOptions('#filter-language',[...new Set(POSTS.map(lang))].sort((a,b)=>a.localeCompare(b)),'All languages');
    setOptions('#filter-type',[...new Set(POSTS.map(form))].sort((a,b)=>a.localeCompare(b)),'All forms');
    setOptions('#filter-theme',[...new Set(POSTS.flatMap(themes))].sort((a,b)=>a.localeCompare(b)),'All themes');
    ['#filter-language','#filter-type','#filter-theme','#filter-format','#sort'].forEach(sel=>$(sel).addEventListener('change',()=>{
      state.language=$('#filter-language').value; state.type=$('#filter-type').value; state.theme=$('#filter-theme').value; state.format=$('#filter-format').value; state.sort=$('#sort').value; state.collection=''; render();
    }));
    $('#search').addEventListener('input',e=>{state.q=e.target.value.toLowerCase().trim();render();});
    const toggle=$('#filters-toggle');
    toggle.addEventListener('click',()=>{
      const panel=$('.filter-panel');
      const opened=panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded',String(opened));
      toggle.innerHTML=opened?'Filters <span aria-hidden="true">−</span>':'Filters <span aria-hidden="true">＋</span>';
    });
    $('#clear-filters').addEventListener('click',clearFilters); $('#empty-clear').addEventListener('click',clearFilters);
  }
  function clearFilters(){state.q='';state.language='';state.type='';state.theme='';state.format='';state.collection='';state.sort='newest';$('#search').value='';$('#filter-language').value='';$('#filter-type').value='';$('#filter-theme').value='';$('#filter-format').value='';$('#sort').value='newest';render();}
  function renderCollections(){
    const grid=$('#collection-grid');
    grid.innerHTML=collectionDefs.map(c=>{
      const count=POSTS.filter(p=>themes(p).includes(c.theme) || (c.name==='Hindi & Shayari' && form(p)==='Shayari')).length;
      return `<button class="collection-card" type="button" data-collection-theme="${esc(c.theme)}" aria-label="Browse ${esc(c.name)} collection"><span class="collection-top"><span>COLLECTION ${c.kicker}</span><span class="collection-symbol">${c.symbol}</span></span><span class="collection-title">${esc(c.name)}</span><span class="collection-bottom"><span>${esc(c.sub)} · ${count} pieces</span><span class="arrow" aria-hidden="true">↗</span></span></button>`;
    }).join('');
    $$('#collection-grid [data-collection-theme]').forEach(b=>b.addEventListener('click',()=>{
      const theme=b.dataset.collectionTheme;
      state.q='';state.language='';state.type='';state.format='';state.sort='newest';state.collection='';
      $('#search').value='';$('#filter-language').value='';$('#filter-type').value='';$('#filter-format').value='';$('#sort').value='newest';
      state.theme=theme;$('#filter-theme').value=theme;
      render();document.querySelector('#archive').scrollIntoView({behavior:'smooth',block:'start'});
    }));
  }
  function matchPost(p){
    if(state.language && lang(p)!==state.language)return false;
    if(state.type && form(p)!==state.type)return false;
    if(state.theme && !themes(p).includes(state.theme))return false;
    if(state.format && p.format!==state.format)return false;
    if(state.collection && !(tagsOf(p).collections||[]).includes(state.collection))return false;
    if(state.q){const hay=[p.caption,p.summary,p.id,lang(p),form(p),...themes(p),...(tagsOf(p).collections||[])].join(' ').toLowerCase();if(!hay.includes(state.q))return false;}
    return true;
  }
  function postCardMarkup(p, featured=false){
    const first=p.media && p.media[0]; if(!first)return '';
    const tags=htmlTags(p).map(t=>`<span class="post-tag">${esc(t)}</span>`).join('');
    return `<article class="post-card${featured?' featured-card':''}" tabindex="0" role="button" aria-label="Open ${esc(cardTitle(p))}" data-post-id="${esc(p.id)}">
      <div class="post-image-wrap"><img class="post-image" src="${esc(first.src)}" alt="Original writing artwork, post ${esc(p.post_number)}" loading="lazy" decoding="async">${featured?'<span class="featured-stamp">FEATURED</span>':''}<span class="post-format-badge">${p.format==='carousel'?'▧ '+p.media_count+' SLIDES':'✳ SINGLE'}</span></div>
      <div class="post-card-meta"><span class="post-card-num">PIECE ${String(p.post_number).padStart(3,'0')}</span><span class="post-card-date">${esc(shortDate(p))}</span></div>
      <h3 class="post-card-title">${esc(cardTitle(p))}</h3>
      <div class="post-card-tags">${tags}</div>
    </article>`;
  }
  function wirePostCards(rootSelector){
    $$('.post-card', $(rootSelector)).forEach(card=>{
      const open=()=>openViewer(card.dataset.postId);
      card.addEventListener('click',open);
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
  }
  function renderFeatured(){
    const featured = FEATURED_IDS.map(id=>POSTS.find(p=>String(p.id)===id)).filter(p=>p && p.media && p.media.length);
    $('#featured-grid').innerHTML = featured.map(p=>postCardMarkup(p,true)).join('');
    wirePostCards('#featured-grid');
  }
  function render(){
    let rows=POSTS.filter(matchPost);
    rows.sort((a,b)=>{
      const da=dateObj(a)?.getTime()||0, db=dateObj(b)?.getTime()||0;
      return state.sort==='oldest'?da-db:db-da;
    });
    state.visible=rows;
    $('#results-count').textContent=`${rows.length} ${rows.length===1?'piece':'pieces'} ${rows.length===POSTS.length?'in the archive':'found'}`;
    $('#stat-posts').textContent=String(POSTS.length);
    $('#stat-carousels').textContent=String(POSTS.filter(p=>p.format==='carousel').length);
    $('#post-grid').innerHTML=rows.map(p=>postCardMarkup(p,false)).join('');
    $('#empty-state').hidden=rows.length>0;
    $('#post-grid').style.display=rows.length?'block':'none';
    wirePostCards('#post-grid');
  }
  function renderHero(){
    const valid=POSTS.filter(p=>p.media&&p.media.length);
    if(valid[0])$('#hero-image-front').src=valid[0].media[0].src;
    const back=valid.find(p=>p.media&&p.media[0]&&p.media[0].src!==valid[0]?.media[0].src) || valid[1];
    if(back)$('#hero-image-back').src=back.media[0].src;
  }
  function openViewer(id){
    const p=POSTS.find(x=>String(x.id)===String(id));if(!p)return;
    state.active=p;state.slide=0;updateViewer();$('#viewer').hidden=false;document.body.classList.add('body-no-scroll');$('.viewer-close')?.focus();
  }
  function updateViewer(){
    const p=state.active;if(!p)return;const m=p.media||[];const item=m[state.slide]||m[0];
    $('#viewer-number').textContent=`PIECE ${String(p.post_number).padStart(3,'0')}`;
    $('#viewer-image').src=item?.src||'';$('#viewer-image').alt=`Original artwork, piece ${p.post_number}, slide ${state.slide+1} of ${m.length}`;
    $('#slide-counter').textContent=m.length>1?`${String(state.slide+1).padStart(2,'0')} / ${String(m.length).padStart(2,'0')}`:'';
    $('#slide-prev').disabled=state.slide<=0;$('#slide-next').disabled=state.slide>=m.length-1;
    $('#slide-prev').style.visibility=m.length>1?'visible':'hidden';$('#slide-next').style.visibility=m.length>1?'visible':'hidden';
    $('#viewer-format').textContent=p.format==='carousel'?`CAROUSEL · ${m.length} SLIDES`:'SINGLE POST';
    $('#viewer-title').textContent=cardTitle(p);
    $('#viewer-date').textContent=dateLabel(p);
    $('#viewer-tags').innerHTML=htmlTags(p).map(t=>`<span class="post-tag">${esc(t)}</span>`).join('');
    const cap=decodeCaption(p.caption||'');
    const displayCaption=cap.replace(/(?:#[\w]+\s*)+/g,'').trim();
    $('#viewer-caption').textContent=/^([.\s]|✍️)*$/.test(displayCaption)?'':displayCaption;
    $('#viewer-caption').style.display=$('#viewer-caption').textContent?'block':'none';
    $('#copy-title').textContent='Copy caption';
  }
  function closeViewer(){ $('#viewer').hidden=true;document.body.classList.remove('body-no-scroll');state.active=null; }
  function nextSlide(d){if(!state.active)return;const max=(state.active.media||[]).length-1;state.slide=Math.max(0,Math.min(max,state.slide+d));updateViewer();}
  $('#slide-prev').addEventListener('click',()=>nextSlide(-1));$('#slide-next').addEventListener('click',()=>nextSlide(1));
  $$('[data-close-viewer]').forEach(b=>b.addEventListener('click',closeViewer));
  document.addEventListener('keydown',e=>{
    if($('#viewer').hidden)return;
    if(e.key==='Escape')closeViewer();if(e.key==='ArrowLeft')nextSlide(-1);if(e.key==='ArrowRight')nextSlide(1);
  });
  $('#copy-title').addEventListener('click',async()=>{
    const val=state.active?.caption||'';
    try{await navigator.clipboard.writeText(val);$('#copy-title').textContent='Copied';}catch(e){
      const area=document.createElement('textarea');area.value=val;document.body.appendChild(area);area.select();try{document.execCommand('copy');$('#copy-title').textContent='Copied';}catch(_){}area.remove();
    }
    setTimeout(()=>{if(!$('#viewer').hidden)$('#copy-title').textContent='Copy caption';},1500);
  });
  // Touch swipe for carousel slides on phones.
  let touchX=null;
  $('#viewer-image').addEventListener('touchstart',e=>{touchX=e.changedTouches[0]?.screenX??null;},{passive:true});
  $('#viewer-image').addEventListener('touchend',e=>{if(touchX===null)return;const dx=(e.changedTouches[0]?.screenX??touchX)-touchX;if(Math.abs(dx)>45)nextSlide(dx<0?1:-1);touchX=null;},{passive:true});

  initFilters();renderHero();renderFeatured();renderCollections();render();
})();
