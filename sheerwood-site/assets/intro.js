(() => {
  const dialog = document.querySelector('#intro-cinema');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const film = dialog.querySelector('video');
  const skip = dialog.querySelector('.cinema-skip');
  const pause = dialog.querySelector('.cinema-pause');
  const start = dialog.querySelector('.cinema-start');
  const replay = document.querySelector('.intro-replay');
  const brand = dialog.querySelector('.cinema-brand');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const seenKey = 'sheerwood-intro-v2';
  let seen = false;
  let ending = false;
  let closingTimer, holdTimer, loadTimer;
  let returnFocus;
  let run = 0;
  try { seen = sessionStorage.getItem(seenKey) === 'seen'; } catch {}

  function title(show) {
    dialog.classList.toggle('has-title', show);
    brand.setAttribute('aria-hidden', String(!show));
  }
  function update() {
    const total = Number.isFinite(film.duration) && film.duration > 0 ? film.duration : 10;
    const progress = Math.min(1, film.currentTime / total);
    dialog.style.setProperty('--film-progress', progress);
    const phase = progress < .29 ? 0 : progress < .7 ? 1 : 2;
    dialog.querySelector('.cinema-chapter-number').textContent = ['01','02','03'][phase];
    dialog.querySelector('.cinema-chapter-name').textContent = ['Замысел','Архитектура','Ваш дом'][phase];
    if (!ending) title(progress >= .72 || !start.hidden);
  }
  function pauseLabel(paused) {
    pause.setAttribute('aria-label', paused ? 'Продолжить вступительное видео' : 'Приостановить вступительное видео');
    pause.querySelector('span').textContent = paused ? '▷' : 'Ⅱ';
    pause.querySelector('.cinema-pause-text').textContent = paused ? 'Продолжить' : 'Пауза';
  }
  function remember() {
    seen = true;
    try { sessionStorage.setItem(seenKey, 'seen'); } catch {}
  }
  function close(skipped = false) {
    if (!dialog.open || ending) return;
    ending = true;
    ++run;
    clearTimeout(loadTimer);
    clearTimeout(holdTimer);
    remember();
    if (skipped) dialog.classList.add('is-skipping');
    dialog.classList.add('is-leaving');
    film.pause();
    closingTimer = setTimeout(() => {
      dialog.close();
      document.documentElement.classList.remove('cinema-active');
      if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
      else document.querySelector('.site-head .wordmark')?.focus({preventScroll:true});
    }, reduced.matches ? 0 : skipped ? 320 : 900);
  }
  function blocked() {
    if (!dialog.open || ending) return;
    clearTimeout(loadTimer);
    film.pause();
    start.hidden = false;
    pause.hidden = true;
    title(true);
    dialog.querySelector('.cinema-chapter-name').textContent = 'Вступительный фильм';
  }
  async function play() {
    if (!dialog.open || ending) return;
    const currentRun = run;
    start.hidden = true;
    pause.hidden = false;
    update();
    clearTimeout(loadTimer);
    loadTimer = setTimeout(blocked, 7000);
    try { await film.play(); }
    catch { if (currentRun === run) blocked(); }
  }
  function open(manual = false) {
    if (dialog.open) return;
    clearTimeout(closingTimer);
    clearTimeout(holdTimer);
    ++run;
    ending = false;
    returnFocus = manual ? replay : null;
    dialog.classList.remove('is-leaving','is-skipping');
    title(false);
    film.currentTime = 0;
    update();
    dialog.style.setProperty('--film-progress', 0);
    document.documentElement.classList.add('cinema-active');
    dialog.showModal();
    skip.focus({preventScroll:true});
    if (reduced.matches) blocked(); else play();
  }
  skip.addEventListener('click', () => close(true));
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(true); });
  replay?.addEventListener('click', () => open(true));
  start.addEventListener('click', play);
  pause.addEventListener('click', () => {
    clearTimeout(holdTimer);
    if (film.paused) {
      if (film.ended) film.currentTime = 0;
      play();
    } else film.pause();
  });
  film.addEventListener('timeupdate', update);
  film.addEventListener('playing', () => {
    if (!dialog.open || ending) { film.pause(); return; }
    clearTimeout(loadTimer);
    start.hidden = true;
    pause.hidden = false;
    pauseLabel(false);
  });
  film.addEventListener('pause', () => pauseLabel(true));
  film.addEventListener('waiting', () => {
    clearTimeout(loadTimer);
    if (dialog.open && !ending) loadTimer = setTimeout(blocked, 7000);
  });
  film.addEventListener('ended', () => {
    clearTimeout(loadTimer);
    if (!dialog.open || ending) return;
    title(true);
    pause.hidden = true;
    holdTimer = setTimeout(() => close(), 1300);
  });
  film.addEventListener('error', () => close(true));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open && !ending) {
      clearTimeout(holdTimer);
      clearTimeout(loadTimer);
      if (film.ended) close(); else film.pause();
    }
  });
  reduced.addEventListener('change', () => { if (reduced.matches) close(true); });
  if (!seen && !location.hash && !reduced.matches) open();
})();
