/**
 * Matterport Guided Tour parameters.
 * Tour Settings → Transitions / Panning. Loop off. Dollhouse off.
 */
export const guidedTour = {
  autoStart: true,
  delay: 0.35,
  /** Walkthrough (move through space) vs Slideshow (fade). */
  transition: "walkthrough" as const,
  /** Seconds to walk between rooms. Medium. */
  walkSeconds: 1.85,
  /** First orbit, slower — Dollhouse rotation speed. */
  orbitSeconds: 8.6,
  /** Seconds to wait at each highlight. */
  stopTime: 3.5,
  loop: false,
  pan: {
    enabled: true,
    direction: "auto" as "left" | "right" | "auto",
    angle: 32,
    seconds: 2.8,
  },
  resumeMs: 5000,
};

export const matterport = {
  launch: { start: 0, quickStart: true, helpOnce: true },
  guidedTour,
  showcase: {
    dollhouse: false,
    floorPlan: false,
    labels: true,
    highlightReel: true,
    zoom: false,
  },
  windowAt: 0.26,
  insideStart: 0.42,
} as const;

export const tourSetup = {
  start: 0,
  autoLaps: 1,
  duration: 52,
  loop: guidedTour.loop,
  resumeMs: guidedTour.resumeMs,
  endHoldMs: guidedTour.stopTime * 1000,
  windowAt: matterport.windowAt,
  insideStart: matterport.insideStart,
  roomHold: 0.78,
} as const;

export function roomPlayhead(i: number, count: number) {
  if (count <= 1) return tourSetup.insideStart;
  return tourSetup.insideStart + (i / Math.max(1, count - 1)) * (1 - tourSetup.insideStart) * 0.92;
}

export type Highlight = { id: string; t: number; stop: number; pan: number };

export function buildHighlights(rooms: { id: string }[]): Highlight[] {
  return [
    { id: "start", t: 0, stop: 0.4, pan: 0 },
    { id: "orbit", t: 0.18, stop: 1.4, pan: 22 },
    { id: "window", t: 0.22, stop: 1.1, pan: 0 },
    { id: "dive", t: 0.32, stop: 1.5, pan: 0 },
    ...rooms.map((room, i) => ({
      id: room.id,
      t: roomPlayhead(i, rooms.length),
      stop: guidedTour.stopTime,
      pan: guidedTour.pan.angle,
    })),
  ];
}

export function travelSeconds(from: number, to: number) {
  if (from < 0.19 && to <= 0.22) return guidedTour.orbitSeconds;
  return guidedTour.walkSeconds;
}

export function smoother01(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}
