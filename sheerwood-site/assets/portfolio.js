/* No tracking or external player. Pictures are requested only as they are needed. */
(() => {
  'use strict';
  const root = document.querySelector('[data-portfolio]');
  const source = document.getElementById('portfolio-data');
  if (!root || !source) return;
  let projects;
  try { projects = JSON.parse(source.textContent); } catch { return; }
  if (!Array.isArray(projects) || !projects.length) return;
  const $ = selector => root.querySelector(selector);
  const stage = $('.portfolio-stage');
  const title = $('.portfolio-title');
  const facts = $('.portfolio-facts');
  const description = $('.portfolio-description');
  const storyHeading = $('.portfolio-story-heading');
  const storyLead = $('.portfolio-story-lead');
  const storyBody = $('.portfolio-story-body');
  const storyDetails = $('.portfolio-story details');
  const status = $('.portfolio-status');
  const live = $('.portfolio-live');
  const play = $('[data-action="play"]');
  const plansButton = $('[data-action="plans"]');
  const interiorButton = $('[data-view="interior"]');
  const exteriorButton = $('[data-view="exterior"]');
  const cards = [...root.querySelectorAll('[data-project]')];
  const dialog = $('.portfolio-dialog');
  const dialogImage = dialog.querySelector('img');
  const viewport = dialog.querySelector('.portfolio-dialog-viewport');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let projectIndex = 0, frameIndex = 0, wantedPlay = !reduced.matches;
  let visible = false, timer = null, generation = 0, busy = false;
  let modalItems = [], modalIndex = 0, savedOverflow = '';
  const currentProject = () => projects[projectIndex];
  const canPlay = () => wantedPlay && visible && !document.hidden && !dialog.open && !busy && (!root.matches(':focus-within') || document.activeElement === play);

  function syncPlay() {
    clearTimeout(timer);
    root.classList.toggle('is-playing', canPlay());
    play.setAttribute('aria-pressed', String(wantedPlay));
    play.innerHTML = wantedPlay ? '<span aria-hidden="true">Ⅱ</span> Пауза' : '<span aria-hidden="true">▷</span> Смотреть';
    if (canPlay()) timer = setTimeout(() => advance(1, false), 6200);
  }
  function stop() { wantedPlay = false; syncPlay(); }
  function imageFor(frame, primary = false) {
    const img = new Image();
    img.alt = primary ? frame.alt : '';
    img.width = frame.width;
    img.height = frame.height;
    img.decoding = 'async';
    if (frame.small) {
      img.srcset = `${frame.small} ${frame.smallWidth}w, ${frame.src} ${frame.width}w`;
      img.sizes = primary ? '(max-width: 600px) 90vw, 68vw' : '(max-width: 600px) 44vw, 23vw';
    }
    img.src = frame.src;
    return img;
  }
  function makeScene(project, index) {
    const scene = document.createElement('div');
    scene.className = 'portfolio-scene';
    const main = document.createElement('button');
    main.type = 'button';
    main.className = 'portfolio-scene-main';
    main.setAttribute('aria-label', `Открыть фото: ${project.frames[index].caption}`);
    main.append(imageFor(project.frames[index], true));
    const caption = document.createElement('span');
    caption.className = 'portfolio-frame-caption';
    const text = document.createElement('span');
    text.textContent = project.frames[index].caption;
    const expand = document.createElement('span');
    expand.className = 'portfolio-enlarge';
    expand.setAttribute('aria-hidden', 'true');
    expand.textContent = '+';
    caption.append(text, expand); main.append(caption);
    main.addEventListener('click', () => openModal('frames'));
    const details = document.createElement('div');
    details.className = 'portfolio-scene-details';
    details.setAttribute('aria-hidden', 'true');
    for (let offset = 1; offset <= 2; offset++) {
      const figure = document.createElement('div');
      figure.className = 'portfolio-scene-detail';
      figure.append(imageFor(project.frames[(index + offset) % project.frames.length]));
      details.append(figure);
    }
    scene.append(main, details);
    return scene;
  }
  async function show(nextProject, nextFrame, userAction = true) {
    if (userAction) stop();
    const token = ++generation;
    const project = projects[nextProject];
    const scene = makeScene(project, nextFrame);
    busy = true; root.classList.add('is-busy'); status.textContent = ''; syncPlay();
    const primary = scene.querySelector('img');
    try {
      if (primary.decode) await primary.decode();
      else await new Promise((resolve, reject) => { primary.onload = resolve; primary.onerror = reject; });
    } catch {
      if (token !== generation) return;
      busy = false; root.classList.remove('is-busy'); stop();
      status.textContent = 'Не удалось загрузить фото. Попробуйте выбрать кадр ещё раз.';
      return;
    }
    if (token !== generation) return;
    projectIndex = nextProject; frameIndex = nextFrame;
    const outgoing = [...stage.children];
    outgoing.forEach(node => { node.setAttribute('data-leaving', ''); node.inert = true; node.setAttribute('aria-hidden', 'true'); });
    scene.setAttribute('data-entering', '');
    stage.append(scene);
    title.textContent = project.title;
    facts.textContent = project.facts;
    description.textContent = project.description;
    storyHeading.textContent = project.story.heading;
    storyLead.textContent = project.story.paragraphs[0];
    storyBody.replaceChildren(...project.story.paragraphs.slice(1).map(text => {
      const paragraph = document.createElement('p'); paragraph.textContent = text; return paragraph;
    }));
    storyDetails.open = false;
    plansButton.hidden = !project.plans.length;
    interiorButton.hidden = !project.frames.some(frame => frame.kind === 'interior');
    const isInterior = project.frames[frameIndex].kind === 'interior';
    interiorButton.setAttribute('aria-pressed', String(isInterior));
    exteriorButton.setAttribute('aria-pressed', String(!isInterior));
    cards.forEach((card, i) => card.setAttribute('aria-current', String(i === projectIndex)));
    if (userAction) live.textContent = `${project.title}. ${project.frames[frameIndex].caption}`;
    setTimeout(() => { outgoing.forEach(node => node.remove()); scene.removeAttribute('data-entering'); }, reduced.matches ? 0 : 1050);
    busy = false; root.classList.remove('is-busy'); syncPlay();
  }
  function advance(direction, userAction = true) {
    if (busy) return;
    const last = currentProject().frames.length - 1;
    let nextProject = projectIndex, nextFrame = frameIndex + direction;
    if (nextFrame > last) { nextProject = (projectIndex + 1) % projects.length; nextFrame = 0; }
    if (nextFrame < 0) { nextProject = (projectIndex - 1 + projects.length) % projects.length; nextFrame = projects[nextProject].frames.length - 1; }
    show(nextProject, nextFrame, userAction);
  }
  function renderModal() {
    const frame = modalItems[modalIndex];
    viewport.classList.remove('is-zoomed');
    viewport.scrollTo(0, 0);
    dialogImage.src = frame.src;
    dialogImage.alt = frame.alt;
    dialogImage.width = frame.width; dialogImage.height = frame.height;
    dialog.querySelector('.portfolio-dialog-caption').textContent = frame.caption;
    dialog.querySelector('[data-modal-count]').textContent = `${modalIndex + 1} из ${modalItems.length}`;
    dialog.querySelector('[data-modal-download]').href = frame.original || frame.src;
    dialog.querySelector('[data-modal-zoom]').textContent = 'Увеличить';
    dialog.querySelector('[data-modal-zoom]').setAttribute('aria-pressed', 'false');
    dialog.querySelectorAll('[data-modal-prev],[data-modal-next]').forEach(button => { button.disabled = modalItems.length < 2; });
  }
  function openModal(kind) {
    stop();
    modalItems = currentProject()[kind];
    if (!modalItems.length) return;
    modalIndex = kind === 'frames' ? frameIndex : 0;
    dialog.querySelector('.portfolio-dialog-title').textContent = currentProject().title;
    renderModal();
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  }
  function moveModal(delta) { modalIndex = (modalIndex + delta + modalItems.length) % modalItems.length; renderModal(); }
  function zoom() {
    const enlarged = viewport.classList.toggle('is-zoomed');
    dialog.querySelector('[data-modal-zoom]').textContent = enlarged ? 'Вписать' : 'Увеличить';
    dialog.querySelector('[data-modal-zoom]').setAttribute('aria-pressed', String(enlarged));
  }
  cards.forEach((card, i) => card.addEventListener('click', event => {
    event.preventDefault();
    show(i, 0).then(() => {
      if (projectIndex !== i) return;
      stage.focus({preventScroll:true});
      stage.scrollIntoView({block:'start',behavior:reduced.matches ? 'auto' : 'smooth'});
    });
  }));
  $('[data-action="previous"]').addEventListener('click', () => advance(-1));
  $('[data-action="next"]').addEventListener('click', () => advance(1));
  play.addEventListener('click', () => { wantedPlay = !wantedPlay; syncPlay(); });
  plansButton.addEventListener('click', () => openModal('plans'));
  $('[data-action="open"]').addEventListener('click', () => openModal('frames'));
  exteriorButton.addEventListener('click', () => show(projectIndex, 0));
  interiorButton.addEventListener('click', () => {
    const index = currentProject().frames.findIndex(frame => frame.kind === 'interior');
    if (index >= 0) show(projectIndex, index);
  });
  stage.querySelector('.portfolio-scene-main').addEventListener('click', () => openModal('frames'));
  dialog.querySelector('[data-modal-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-modal-prev]').addEventListener('click', () => moveModal(-1));
  dialog.querySelector('[data-modal-next]').addEventListener('click', () => moveModal(1));
  dialog.querySelector('[data-modal-zoom]').addEventListener('click', zoom);
  dialogImage.addEventListener('click', zoom);
  dialogImage.addEventListener('error', () => { dialog.querySelector('.portfolio-dialog-caption').textContent = 'Не удалось загрузить изображение. Попробуйте открыть оригинал.'; });
  dialog.addEventListener('close', () => { document.body.style.overflow = savedOverflow; syncPlay(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveModal(event.key === 'ArrowRight' ? 1 : -1); }
  });
  stage.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); advance(event.key === 'ArrowRight' ? 1 : -1); }
  });
  let startTouch = null;
  stage.addEventListener('touchstart', event => { startTouch = event.touches.length === 1 ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null; }, {passive:true});
  stage.addEventListener('touchend', event => {
    if (!startTouch || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - startTouch.x;
    const dy = event.changedTouches[0].clientY - startTouch.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) advance(dx < 0 ? 1 : -1);
    startTouch = null;
  }, {passive:true});
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncPlay(); }, {threshold:.2}).observe(stage);
  document.addEventListener('visibilitychange', syncPlay);
  root.addEventListener('focusin', syncPlay);
  root.addEventListener('focusout', () => setTimeout(syncPlay, 0));
  reduced.addEventListener('change', () => { if (reduced.matches) stop(); });
  interiorButton.hidden = !currentProject().frames.some(frame => frame.kind === 'interior');
  root.classList.add('is-ready'); syncPlay();
})();
