/* A bounded, image-based tour: only current/adjacent photos are decoded. */
(() => {
  'use strict';
  const root = document.querySelector('[data-tour]');
  if (!root || !window.SheerwoodGallery) return;
  const scenes = JSON.parse(document.getElementById('tour-data').textContent);
  const $ = selector => root.querySelector(selector), media = window.SheerwoodGallery;
  const stage = $('.tour-stage'), visual = $('.tour-visual'), play = $('[data-tour-play]');
  const cards = [...root.querySelectorAll('[data-stop]')], filters = [...root.querySelectorAll('[data-tour-filter]')];
  const status = $('.tour-status'), progress = $('#tour-position'), count = $('[data-tour-count]');
  const details = $('.tour-description'), video = $('.tour-video'), skip = $('[data-tour-skip]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, targetIndex = 0, token = 0, playing = false, busy = false, timer;
  let filter = 'all', film = null, filmToken = 0, filmTimeout, introSeen = false, cleanup;
  const cache = new Map();
  const route = () => scenes.map((scene,i) => ({scene,i})).filter(({scene}) => filter === 'all' || scene.group === filter).map(({i}) => i);
  function prepared(i) {
    if (!cache.has(i)) {
      const picture = media.image(scenes[i]);
      const entry = {picture,ready:media.ready(picture).then(() => true, () => { cache.delete(i); return false; })};
      cache.set(i,entry);
      if (cache.size > 4) cache.delete(cache.keys().next().value);
    }
    return cache.get(i);
  }
  function warm() {
    if (document.hidden || navigator.connection?.saveData) return;
    const path = route(), at = path.indexOf(index);
    if (at >= 0 && at + 1 < path.length) prepared(path[at+1]);
  }
  function sync() {
    clearTimeout(timer);
    play.textContent = playing ? 'Пауза' : 'Смотреть тур';
    play.setAttribute('aria-pressed',String(playing));
    if (film) {
      if (playing && !document.hidden && !details.open) {
        const request=filmToken;video.play().catch(() => {if(request!==filmToken || !film) return;playing = false; play.textContent = 'Продолжить'; play.setAttribute('aria-pressed','false');});
      }
      else video.pause();
    } else if (playing && !busy && !document.hidden && !details.open) timer = setTimeout(() => move(1,false),6500);
  }
  function stop() { playing = false; sync(); }
  function stopFilm() {
    ++filmToken;clearTimeout(filmTimeout);film = null;video.pause();video.hidden = true;skip.hidden = true;stage.classList.remove('is-film');
  }
  async function show(next, user = true) {
    if (user) stop();
    if (film) stopFilm();
    const request = ++token;
    targetIndex = next;busy = true;stage.setAttribute('aria-busy','true');sync();
    status.textContent = '';
    const notice = setTimeout(() => { if(request === token) status.textContent = 'Готовим следующий ракурс…'; },400);
    const entry = prepared(next), loaded = await entry.ready;
    clearTimeout(notice);
    if(request !== token) return;
    busy = false;stage.setAttribute('aria-busy','false');status.textContent = '';
    if (!loaded) { stop();status.textContent = 'Фото не загрузилось. Выберите другой ракурс или попробуйте ещё раз.';return; }
    if(cleanup) cleanup();
    const outgoing = [...visual.children], shot = document.createElement('div');shot.className = 'tour-shot is-entering';
    // Cached pictures may still be in the outgoing layer: clone before replacement.
    const picture = entry.picture.cloneNode();picture.alt = scenes[next].alt;shot.append(picture);visual.append(shot);
    outgoing.forEach(node => {node.classList.add('is-leaving');node.setAttribute('aria-hidden','true');});
    let removal;cleanup = () => {clearTimeout(removal);outgoing.forEach(node => node.remove());shot.classList.remove('is-entering');cleanup = null;};removal = setTimeout(cleanup,reduced.matches?0:520);
    index = next;
    const scene = scenes[index];
    $('.tour-eyebrow').textContent = scene.label;$('.tour-copy h1').textContent = scene.title;$('.tour-lead').textContent = scene.lead;
    cards.forEach((card,i) => card.setAttribute('aria-current',String(i === index)));
    const rail = $('.tour-stops'), card = cards[index];
    rail.scrollTo({left:card.offsetLeft-rail.offsetLeft-rail.clientWidth/2+card.clientWidth/2,behavior:reduced.matches?'auto':'smooth'});
    progress.value = index;progress.setAttribute('aria-valuetext',scene.label);count.textContent = `${index+1} / ${scenes.length}`;
    sync();warm();
  }
  function move(delta,user = true) {
    if(film) {const after = film.after;stopFilm();return show(after,user);}
    const path = route(), at = path.indexOf(targetIndex), next = at + delta;
    if (!user && next >= path.length) {stop();return;}
    const destination=path[(next+path.length)%path.length];
    if(!user && filter==='all' && scenes[targetIndex].group==='outside' && scenes[destination].group==='inside') return startFilm('/atrium-house/videos/window.mp4',destination);
    return show(destination,user);
  }
  function selectFilter(value) {
    filter = value;filters.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.tourFilter === value)));
    cards.forEach((card,i) => {card.hidden = value !== 'all' && scenes[i].group !== value;});
    show(route()[0]);
  }
  function startFilm(src,after,nextFilm = null) {
    ++token;busy = false;stage.setAttribute('aria-busy','false');stopFilm();
    const request = filmToken;
    film = {after,nextFilm};introSeen = true;playing = true;status.textContent = '';
    stage.classList.add('is-film');video.hidden = false;skip.hidden = false;video.poster = src.includes('tour-approach') ? '/atrium-house/images/tour/approach-poster.jpg' : '/atrium-house/images/orbit-6.webp';video.src = src;video.load();
    filmTimeout = setTimeout(() => {if(film && request === filmToken && video.readyState < 2) finishFilm();},12000);
    sync();
  }
  function finishFilm() {if(!film) return;const {after,nextFilm} = film;const continuing = playing;stopFilm();if(nextFilm && continuing) startFilm(nextFilm,after);else show(after,false);}
  function intro() {filter = 'all';filters.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.tourFilter === 'all')));cards.forEach(card => {card.hidden=false;});startFilm(matchMedia('(max-width: 768px)').matches ? '/atrium-house/videos/tour-approach-mobile.mp4' : '/atrium-house/videos/tour-approach.mp4',0);}
  play.addEventListener('click',() => {
    if(playing) return stop();
    playing = true;
    if(film) sync();
    else if(!introSeen && index === 0 && !reduced.matches) intro();
    else if(targetIndex===route().at(-1)) {if(filter==='all') intro();else show(route()[0],false);}
    else move(1,false);
  });
  $('[data-tour-prev]').addEventListener('click',() => move(-1));
  $('[data-tour-next]').addEventListener('click',() => move(1));
  cards.forEach((card,i) => card.addEventListener('click',() => show(i)));
  filters.forEach(button => button.addEventListener('click',() => selectFilter(button.dataset.tourFilter)));
  progress.addEventListener('input',() => {
    if(filter !== 'all') {filter='all';cards.forEach(card => {card.hidden=false;});filters.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.tourFilter==='all')));}
    show(Number(progress.value));
  });
  $('[data-tour-intro]').addEventListener('click',intro);
  $('[data-tour-enter]').addEventListener('click',() => {
    filter='all';cards.forEach(card=>{card.hidden=false;});filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tourFilter==='all')));
    startFilm('/atrium-house/videos/window.mp4',scenes.findIndex(scene => scene.id==='living'));
  });
  skip.addEventListener('click',() => {if(!film) return;const after=film.after;stopFilm();show(after,false);});video.addEventListener('ended',finishFilm);video.addEventListener('error',finishFilm);
  video.addEventListener('playing',() => clearTimeout(filmTimeout));
  $('[data-tour-details]').addEventListener('click',() => {
    stop();const scene=scenes[index];$('[data-detail-label]').textContent=scene.label;$('#tour-description-title').textContent=scene.title;
    $('[data-detail-copy]').replaceChildren(...scene.paragraphs.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));
    $('[data-detail-features]').replaceChildren(...scene.features.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
    details.showModal();
  });
  $('[data-detail-close]').addEventListener('click',()=>details.close());$('[data-detail-return]').addEventListener('click',()=>details.close());
  root.addEventListener('keydown',event=>{
    if(details.open || event.target.matches('input,button,a')) return;
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}
    if(event.code==='Space'){event.preventDefault();play.click();}
    if(event.key==='Home'){event.preventDefault();show(route()[0]);}
    if(event.key==='End'){event.preventDefault();show(route().at(-1));}
  });
  media.swipe(stage,direction=>move(direction),()=>!details.open&&!film);
  document.addEventListener('visibilitychange',()=>{sync();warm();});
  reduced.addEventListener('change',()=>{if(reduced.matches) stop();});
  warm();sync();
})();
