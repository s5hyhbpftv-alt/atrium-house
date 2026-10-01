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
  let dialogImage = dialog.querySelector('img');
  const media = window.SheerwoodGallery;
  const viewport = dialog.querySelector('.portfolio-dialog-viewport');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let projectIndex = 0, frameIndex = 0, wantedPlay = !reduced.matches;
  let visible = false, timer = null, generation = 0, busy = false, initialReady = false;
  let modalItems = [], modalIndex = 0, modalGeneration = 0, savedOverflow = '';
  let prepared = null, pending = null, cleanup = null;
  const modalCache = new Map();
  const currentProject = () => projects[projectIndex];
  const canPlay = () => initialReady && wantedPlay && visible && !document.hidden && !dialog.open && !busy;

  function syncPlay() {
    clearTimeout(timer);
    root.classList.toggle('is-playing', canPlay());
    play.setAttribute('aria-pressed', String(wantedPlay));
    play.innerHTML = wantedPlay ? '<span aria-hidden="true">Ⅱ</span> Пауза' : '<span aria-hidden="true">▷</span> Смотреть';
    if (canPlay()) timer = setTimeout(() => advance(1, false), 6200);
  }
  function stop() { wantedPlay = false; syncPlay(); }
  function imageFor(frame, primary = false) {
    const img = media.image(frame, primary ? '(max-width: 600px) 90vw, 68vw' : '(max-width: 600px) 44vw, 23vw');
    if (!primary) img.alt = '';
    return img;
  }
  function positionAfter(direction, from = {project:projectIndex, frame:frameIndex}) {
    let project = from.project, frame = from.frame + direction;
    if (frame >= projects[project].frames.length) { project = (project + 1) % projects.length; frame = 0; }
    if (frame < 0) { project = (project - 1 + projects.length) % projects.length; frame = projects[project].frames.length - 1; }
    return {project, frame};
  }
  function prepare(project, frame) {
    const scene = makeScene(projects[project], frame);
    const result = {key:`${project}:${frame}`,scene,failed:false};
    result.ready = Promise.all([...scene.querySelectorAll('img')].map(img => media.ready(img)))
      .then(() => true, () => { result.failed = true; return false; });
    return result;
  }
  function prepareNext() {
    if (!initialReady || !visible || document.hidden || busy || dialog.open || navigator.connection?.saveData) return;
    const next = positionAfter(1), key = `${next.project}:${next.frame}`;
    if (!prepared || prepared.key !== key || prepared.failed) prepared = prepare(next.project, next.frame);
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
    const key = `${nextProject}:${nextFrame}`;
    const loading = prepared?.key === key && !prepared.failed ? prepared : prepare(nextProject, nextFrame);
    prepared = null;
    const scene = loading.scene;
    pending = {project:nextProject,frame:nextFrame};
    busy = true; root.classList.add('is-busy'); stage.setAttribute('aria-busy','true'); status.textContent = ''; syncPlay();
    const loadingNotice = setTimeout(() => { if (token === generation) status.textContent = 'Загружаем следующий кадр…'; }, 450);
    const loaded = await loading.ready;
    clearTimeout(loadingNotice);
    if (token !== generation) return;
    pending = null;
    busy = false; root.classList.remove('is-busy'); stage.setAttribute('aria-busy','false'); status.textContent = '';
    if (!loaded) {
      stop();
      status.textContent = 'Фото не загрузилось. Попробуйте ещё раз или выберите другой дом.';
      return;
    }
    if (cleanup) cleanup();
    initialReady = true;
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
    let cleanupTimer;
    cleanup = () => { clearTimeout(cleanupTimer); outgoing.forEach(node => node.remove()); scene.removeAttribute('data-entering'); cleanup = null; };
    cleanupTimer = setTimeout(cleanup, reduced.matches ? 0 : 520);
    syncPlay(); prepareNext();
  }
  function advance(direction, userAction = true) {
    const next = positionAfter(direction, pending || undefined);
    return show(next.project, next.frame, userAction);
  }
  function modalPicture(frame) {
    if (!modalCache.has(frame.src)) {
      const picture = media.image(frame);
      const entry = {picture,ready:media.ready(picture).then(() => true, () => { modalCache.delete(frame.src); return false; })};
      modalCache.set(frame.src,entry);
      if (modalCache.size > 3) modalCache.delete(modalCache.keys().next().value);
    }
    return modalCache.get(frame.src);
  }
  async function renderModal() {
    const token = ++modalGeneration;
    const frame = modalItems[modalIndex];
    viewport.classList.remove('is-zoomed');
    viewport.scrollTo(0, 0);
    dialog.setAttribute('aria-busy','true');
    dialog.querySelector('.portfolio-dialog-caption').textContent = frame.caption;
    dialog.querySelector('[data-modal-count]').textContent = `${modalIndex + 1} из ${modalItems.length}`;
    dialog.querySelector('[data-modal-download]').href = frame.original || frame.src;
    dialog.querySelector('[data-modal-zoom]').textContent = 'Увеличить';
    dialog.querySelector('[data-modal-zoom]').setAttribute('aria-pressed', 'false');
    dialog.querySelectorAll('[data-modal-prev],[data-modal-next]').forEach(button => { button.disabled = modalItems.length < 2; });
    const entry = modalPicture(frame);
    const loaded = await entry.ready;
    if (token !== modalGeneration || !dialog.open) return;
    dialog.setAttribute('aria-busy','false');
    if (!loaded) {
      dialog.querySelector('.portfolio-dialog-caption').textContent = 'Фото не загрузилось. Перелистните дальше или откройте оригинал.';
      return;
    }
    const nextImage = entry.picture;
    dialogImage.replaceWith(nextImage); dialogImage = nextImage;
    if (!navigator.connection?.saveData && modalItems.length > 1) modalPicture(modalItems[(modalIndex + 1) % modalItems.length]);
  }
  function openModal(kind) {
    stop();
    modalItems = currentProject()[kind];
    if (!modalItems.length) return;
    modalIndex = kind === 'frames' ? frameIndex : 0;
    dialog.querySelector('.portfolio-dialog-title').textContent = currentProject().title;
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    renderModal();
  }
  function moveModal(delta) { modalIndex = (modalIndex + delta + modalItems.length) % modalItems.length; renderModal(); }
  function zoom() {
    if (dialog.getAttribute('aria-busy') === 'true') return;
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
  play.addEventListener('click', () => {
    wantedPlay = !wantedPlay;
    if (wantedPlay && initialReady && !busy) advance(1, false);
    else syncPlay();
  });
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
  viewport.addEventListener('click', event => { if (event.target.tagName === 'IMG') zoom(); });
  dialog.addEventListener('close', () => { ++modalGeneration; dialog.setAttribute('aria-busy','false'); document.body.style.overflow = savedOverflow; syncPlay(); prepareNext(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveModal(event.key === 'ArrowRight' ? 1 : -1); }
  });
  stage.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); advance(event.key === 'ArrowRight' ? 1 : -1); }
  });
  media.swipe(stage, direction => advance(direction));
  media.swipe(viewport, moveModal, () => dialog.open && !viewport.classList.contains('is-zoomed'));
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncPlay(); prepareNext(); }, {threshold:.2}).observe(stage);
  document.addEventListener('visibilitychange', () => { syncPlay(); prepareNext(); });
  root.addEventListener('focusin', event => {
    if (event.target !== play) stop();
    else syncPlay();
  });
  reduced.addEventListener('change', () => { if (reduced.matches) stop(); });
  interiorButton.hidden = !currentProject().frames.some(frame => frame.kind === 'interior');
  root.classList.add('is-ready'); syncPlay();
  // The static first scene needs the same decode guarantee as later scenes.
  // Do not spend its viewing time while it is still loading or decoding.
  Promise.all([...stage.querySelectorAll('img')].map(img => media.ready(img))).then(() => {
    if (generation) return;
    initialReady = true;
    requestAnimationFrame(() => { syncPlay(); prepareNext(); });
  }, () => {
    if (generation) return;
    stop();
    status.textContent = 'Фото не загрузилось. Попробуйте ещё раз или выберите другой дом.';
  });
})();
