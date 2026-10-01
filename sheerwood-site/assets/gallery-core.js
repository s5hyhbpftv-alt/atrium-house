/* Shared image loading and touch navigation for SHEERWOOD galleries. */
(() => {
  'use strict';
  function image(frame, sizes = '100vw') {
    const picture = new Image();
    picture.alt = frame.alt || '';
    picture.width = frame.width || 1600;
    picture.height = frame.height || 900;
    picture.decoding = 'async';
    picture.draggable = false;
    if (frame.small) {
      picture.sizes = sizes;
      picture.srcset = `${frame.small} ${frame.smallWidth}w, ${frame.src} ${frame.width}w`;
    }
    picture.src = frame.src;
    return picture;
  }
  function ready(picture, timeout = 12000) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = error => {
        if (settled) return;
        settled = true;
        clearTimeout(limit);
        picture.removeEventListener('load', loaded);
        picture.removeEventListener('error', failed);
        error ? reject(error) : resolve(picture);
      };
      const loaded = () => finish(picture.naturalWidth ? null : new Error('Empty image'));
      const failed = () => finish(new Error('Image unavailable'));
      const limit = setTimeout(() => finish(new Error('Image loading timed out')), timeout);
      picture.addEventListener('error', failed, {once:true});
      if (picture.decode) picture.decode().then(loaded, () => {
        if (picture.complete) loaded();
        else picture.addEventListener('load', loaded, {once:true});
      });
      else if (picture.complete) loaded();
      else picture.addEventListener('load', loaded, {once:true});
    });
  }
  function swipe(surface, onSwipe, enabled = () => true) {
    let gesture = null, suppressClickUntil = 0;
    const reset = () => { gesture = null; };
    surface.addEventListener('touchstart', event => {
      if (event.touches.length !== 1 || !enabled() || event.target.closest?.('[data-swipe-ignore]')) { reset(); return; }
      const point = event.touches[0];
      gesture = {id:point.identifier,x:point.clientX,y:point.clientY,axis:null,moved:false};
    }, {passive:true});
    surface.addEventListener('touchmove', event => {
      if (!gesture) return;
      if (event.touches.length !== 1 || !enabled() || event.target.closest?.('[data-swipe-ignore]')) { reset(); return; }
      const point = event.touches[0];
      if (point.identifier !== gesture.id) { reset(); return; }
      const dx = Math.abs(point.clientX - gesture.x), dy = Math.abs(point.clientY - gesture.y);
      if (Math.max(dx, dy) > 10) {
        gesture.moved = true;
        if (!gesture.axis) gesture.axis = dx > dy * 1.25 ? 'x' : 'y';
      }
      if (gesture.axis === 'x' && event.cancelable) event.preventDefault();
    }, {passive:false});
    surface.addEventListener('touchend', event => {
      if (!gesture) return;
      const point = [...event.changedTouches].find(touch => touch.identifier === gesture.id);
      if (!point) return;
      const {x,y,axis,moved} = gesture;
      reset();
      const dx = point.clientX - x, dy = point.clientY - y;
      const threshold = Math.max(44, Math.min(80, surface.clientWidth * .12));
      if (moved || Math.max(Math.abs(dx),Math.abs(dy)) > 10) suppressClickUntil = Date.now() + 500;
      if (enabled() && axis !== 'y' && Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.35) onSwipe(dx < 0 ? 1 : -1);
    }, {passive:true});
    surface.addEventListener('touchcancel', reset, {passive:true});
    // A swipe must never trigger the image's tap-to-open or tap-to-zoom action.
    surface.addEventListener('click', event => {
      if (!event.target.closest?.('[data-swipe-ignore]') && Date.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
  }
  window.SheerwoodGallery = {image, ready, swipe};
})();
