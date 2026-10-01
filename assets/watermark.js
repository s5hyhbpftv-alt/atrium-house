/* Brand overlays preserve original photographs and existing image layouts. */
(() => {
  'use strict';
  const marks = new Map();
  let queued = false;
  const excluded = media => /(?:logo|favicon|door-leaf|\/plan-\d+\.)/i.test(media.currentSrc || media.src || '') || media.closest('.wordmark,.identity-mark');
  const place = media => {
    const mark = marks.get(media);
    if (!mark || !media.isConnected) return;
    const rect = media.getBoundingClientRect();
    mark.hidden = excluded(media) || rect.width < 100 || rect.height < 60;
    if (mark.hidden) return;
    const parent = media.parentElement;
    if (mark.parentElement !== parent) parent.append(mark);
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
    const bounds = parent.getBoundingClientRect();
    const inset = Math.max(7, Math.min(20, rect.width * .025));
    const width = Math.min(180, rect.width * .29);
    let left = rect.left - bounds.left + parent.scrollLeft;
    let top = rect.top - bounds.top + parent.scrollTop;
    let photoWidth = rect.width;
    // Keep the mark inside a contained photo, including the full-screen gallery.
    if (getComputedStyle(media).objectFit === 'contain') {
      const w = media.naturalWidth || media.videoWidth;
      const h = media.naturalHeight || media.videoHeight;
      if (w && h) {
        const scale = Math.min(rect.width / w, rect.height / h);
        photoWidth = w * scale;
        left += (rect.width - photoWidth) / 2;
        top += (rect.height - h * scale) / 2;
      }
    }
    mark.style.cssText = `left:${left + photoWidth - width - inset}px;top:${top + inset}px;width:${width}px;height:${width / 3}px`;
  };
  const resize = new ResizeObserver(entries => entries.forEach(entry => place(entry.target)));
  const scan = () => {
    queued = false;
    for (const [media,mark] of marks) {
      if (!media.isConnected) { mark.remove(); resize.unobserve(media); marks.delete(media); }
    }
    document.querySelectorAll('[data-portfolio] img,[data-portfolio] video').forEach(media => {
      if (!marks.has(media) && !excluded(media)) {
        const mark = document.createElement('span');
        mark.className = 'sw-watermark';
        mark.setAttribute('aria-hidden','true');
        marks.set(media,mark);media.parentElement.append(mark);
        resize.observe(media);
        media.addEventListener('load', () => place(media));
        media.addEventListener('loadedmetadata', () => place(media));
      }
      place(media);
    });
  };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(scan); } };
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',schedule,{passive:true});
  document.fonts?.ready.then(schedule);
  scan();
})();
