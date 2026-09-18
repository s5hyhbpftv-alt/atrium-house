import { tourSetup } from "@/lib/tour-setup";

/** Interactivity rig for the 3D tour. Tweak here, not in the draw loop. */
export const interact = {
  duration: tourSetup.duration,
  resumeMs: tourSetup.resumeMs,
  endHoldMs: tourSetup.endHoldMs,
  wheelGain: 0.00036,
  dragYaw: 0.4,
  dragScrub: 0.00095,
  deadzone: 8,
  axisLock: 14,
  flickScrub: 0.00055,
  flickYaw: 0.22,
  inertia: 4.2,
  hintUntil: 0.16,
} as const;

export function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function wheelDelta(e: WheelEvent) {
  const raw = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 800 : e.deltaY;
  return raw * interact.wheelGain;
}

export function axisOf(dx: number, dy: number) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax < interact.deadzone && ay < interact.deadzone) return "none";
  if (ax > ay + interact.axisLock) return "yaw";
  if (ay > ax + interact.axisLock) return "scrub";
  return ax > ay ? "yaw" : "scrub";
}
