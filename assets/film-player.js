/* Progressive enhancement: native controls remain available when scripting fails. */
(() => {
  const players = [];
  const clock = value => {
    const time = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;
  };
  document.querySelectorAll('video[controls]').forEach(video => {
    if (video.closest('#intro-cinema') || video.closest('.film-player')) return;
    const title = video.getAttribute('aria-label') || 'Фильм Sheerwood';
    const wrapper = document.createElement('div');
    wrapper.className = 'film-player';
    wrapper.setAttribute('role', 'group');
    wrapper.setAttribute('aria-label', title);
    video.before(wrapper);
    wrapper.append(video);
    const overlay = document.createElement('button');
    overlay.type = 'button'; overlay.className = 'film-launch';
    overlay.setAttribute('aria-label', `Смотреть: ${title}`);
    overlay.innerHTML = '<span class="film-launch-ring"><span class="film-triangle" aria-hidden="true"></span></span><span class="film-launch-label">Смотреть фильм</span>';
    const signature = document.createElement('span');
    signature.className = 'film-signature'; signature.textContent = 'SHEERWOOD';
    signature.setAttribute('aria-hidden', 'true');
    const controls = document.createElement('div');
    controls.className = 'film-controls';
    controls.innerHTML = '<button class="film-toggle" type="button" aria-label="Воспроизвести"><span class="film-control-icon" aria-hidden="true">▶</span></button><span class="film-time" aria-hidden="true">0:00</span><input class="film-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Позиция видео" aria-valuetext="0:00" disabled><button class="film-fullscreen" type="button" aria-label="На весь экран"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/atrium-house/></svg></button>';
    const status = document.createElement('span');
    status.className = 'film-status'; status.setAttribute('role', 'status');
    wrapper.append(signature, overlay, controls, status);
    const toggle = controls.querySelector('.film-toggle');
    const icon = controls.querySelector('.film-control-icon');
    const timeline = controls.querySelector('.film-seek');
    const time = controls.querySelector('.film-time');
    const fullscreen = controls.querySelector('.film-fullscreen');
    const update = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const progress = duration ? Math.min(1000, video.currentTime / duration * 1000) : 0;
      timeline.disabled = !duration; timeline.value = String(progress);
      timeline.style.setProperty('--progress', `${progress / 10}%`);
      timeline.setAttribute('aria-valuetext', `${clock(video.currentTime)}${duration ? ` из ${clock(duration)}` : ''}`);
      time.textContent = duration ? `${clock(video.currentTime)} / ${clock(duration)}` : clock(video.currentTime);
    };
    const sync = () => {
      const active = !video.paused && !video.ended;
      wrapper.classList.toggle('is-playing', active);
      toggle.setAttribute('aria-label', active ? 'Пауза' : 'Воспроизвести');
      icon.textContent = active ? 'Ⅱ' : '▶';
      overlay.hidden = active;
      overlay.querySelector('.film-launch-label').textContent = video.ended ? 'Смотреть ещё раз' : 'Смотреть фильм';
    };
    const play = async () => {
      status.textContent = '';
      if (video.ended) video.currentTime = 0;
      try { await video.play(); }
      catch { status.textContent = 'Не удалось запустить фильм. Попробуйте ещё раз.'; sync(); }
    };
    overlay.addEventListener('click', play);
    toggle.addEventListener('click', () => video.paused ? play() : video.pause());
    video.addEventListener('click', () => video.paused ? play() : video.pause());
    video.addEventListener('play', () => {
      players.forEach(other => { if (other !== video && !other.paused) other.pause(); });
      sync();
    });
    ['pause','ended'].forEach(event => video.addEventListener(event, sync));
    ['loadedmetadata','durationchange','timeupdate','seeked'].forEach(event => video.addEventListener(event, update));
    video.addEventListener('waiting', () => wrapper.classList.add('is-loading'));
    ['playing','pause','error'].forEach(event => video.addEventListener(event, () => wrapper.classList.remove('is-loading')));
    video.addEventListener('error', () => {
      status.textContent = 'Фильм пока недоступен. Попробуйте обновить страницу.';
      video.controls = true; wrapper.classList.add('film-native-fallback');
    });
    timeline.addEventListener('input', () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Number(timeline.value) / 1000 * video.duration;
        update();
      }
    });
    fullscreen.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement === wrapper) await document.exitFullscreen();
        else if (wrapper.requestFullscreen) await wrapper.requestFullscreen();
        else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
        else status.textContent = 'Полноэкранный режим недоступен в этом браузере.';
      } catch { status.textContent = 'Полноэкранный режим недоступен в этом браузере.'; }
    });
    document.addEventListener('fullscreenchange', () => fullscreen.setAttribute('aria-label', document.fullscreenElement === wrapper ? 'Выйти из полного экрана' : 'На весь экран'));
    video.controls = false; video.tabIndex = -1;
    players.push(video); update(); sync();
  });
})();
