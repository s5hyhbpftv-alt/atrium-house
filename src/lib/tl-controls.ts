import gsap from "gsap";

type Timeline = gsap.core.Timeline;

/** GSAP timeline control methods — one place, used by the tour UI. */
export function tlPlay(tl: Timeline) {
  if (tl.progress() >= 0.999) {
    tl.restart();
    return;
  }
  if (tl.reversed()) tl.reversed(false);
  tl.play();
}

export function tlPause(tl: Timeline) {
  tl.pause();
}

export function tlToggle(tl: Timeline) {
  if (tl.paused() || !tl.isActive()) tlPlay(tl);
  else tl.pause();
}

export function tlReverse(tl: Timeline) {
  if (tl.progress() <= 0.001) return;
  tl.reverse();
}

export function tlRestart(tl: Timeline) {
  tl.timeScale(Math.abs(tl.timeScale()) || 1);
  tl.restart();
}

export function tlSeek(tl: Timeline, position: string | number) {
  tl.pause();
  tl.seek(position);
}

export function tlTweenTo(tl: Timeline, position: string | number, duration = 1.15) {
  tl.tweenTo(position, { duration, ease: "power2.inOut" });
}

export function tlProgress(tl: Timeline, p: number) {
  tl.pause();
  tl.progress(Math.min(1, Math.max(0, p)));
}

export function tlNudge(tl: Timeline, seconds: number) {
  tl.pause();
  tl.time(Math.min(tl.duration(), Math.max(0, tl.time() + seconds)));
}

export function tlRate(tl: Timeline, scale: number) {
  const sign = tl.reversed() ? -1 : 1;
  tl.timeScale(sign * Math.abs(scale));
}
