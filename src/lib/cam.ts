/** Cinematic camera animation. Unity / Cinemachine-style lag. */
export const cameraAnim = {
  yawOrbit: 0.34,
  yawDrag: 0.045,
  yawDive: 0.12,
  yawInside: 0.22,
  maxYawDeg: 86,
  panOut: 0.55,
  roomBreathe: 0.03,
} as const;

export function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

export function smootherstep(t: number) {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Unity-style SmoothDamp — keeps velocity, no snap when the target moves. */
export function smoothDamp(
  current: number,
  target: number,
  velocity: { v: number },
  smoothTime: number,
  dt: number,
  maxSpeed = Infinity,
) {
  const st = Math.max(0.0001, smoothTime);
  const omega = 2 / st;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  let change = current - target;
  const maxChange = maxSpeed * st;
  if (Number.isFinite(maxChange)) change = Math.min(maxChange, Math.max(-maxChange, change));
  const temp = (velocity.v + omega * change) * dt;
  velocity.v = (velocity.v - omega * temp) * exp;
  return target + (change + temp) * exp;
}

export function shortest(a: number) {
  return ((((a + 180) % 360) + 360) % 360) - 180;
}

export function wrap360(a: number) {
  return ((a % 360) + 360) % 360;
}

export function smoothDampAngle(current: number, target: number, velocity: { v: number }, smoothTime: number, dt: number, maxSpeed = Infinity) {
  const delta = shortest(target - current);
  return wrap360(smoothDamp(current, current + delta, velocity, smoothTime, dt, maxSpeed));
}

/** Fade in, hold, fade out. Overlap two envelopes = dissolve. */
export function envelope(t: number, inStart: number, fullStart: number, fullEnd: number, outEnd: number) {
  if (t <= inStart) return 0;
  if (t < fullStart) return smootherstep((t - inStart) / (fullStart - inStart || 1));
  if (t <= fullEnd) return 1;
  if (t < outEnd) return 1 - smootherstep((t - fullEnd) / (outEnd - fullEnd || 1));
  return 0;
}

/**
 * Documentary shot pair: hold on still A, then dissolve to B.
 * progress 0..1 across the whole sequence of `count` shots.
 */
export function shotPair(progress: number, count: number, hold = 0.68) {
  if (count <= 1) return { a: 0, b: 0, mix: 0 };
  const x = clamp01(progress) * (count - 1);
  const i = Math.min(count - 2, Math.floor(x));
  const f = x - i;
  if (f <= hold) return { a: i, b: i + 1, mix: 0 };
  return { a: i, b: i + 1, mix: smootherstep((f - hold) / (1 - hold)) };
}

export type TourSample = {
  yaw: number;
  dolly: number;
  scale: number;
  orbit: number;
  dive: number;
  room: number;
  roomMix: number;
  layer: number;
  label: "orbit" | "dive" | "inside";
};

/**
 * One through-line. Scroll is the playhead.
 * layer 0 orbit → 1 dive → 2.. rooms. Camera never cuts.
 */
export function sampleTour(t: number, rooms: number): TourSample {
  const x = clamp01(t);
  let yaw: number;
  let dolly: number;
  let scale: number;
  let layer: number;

  if (x <= 0.18) {
    const u = smootherstep(x / 0.18);
    yaw = u * 360;
    dolly = u * 0.04;
    scale = 1 + u * 0.03;
    layer = 0;
  } else if (x <= 0.22) {
    const u = smootherstep((x - 0.18) / 0.04);
    yaw = 360 - u * 90;
    dolly = 0.04 + u * 0.1;
    scale = 1.03 + u * 0.04;
    layer = 0;
  } else if (x <= 0.32) {
    const u = smootherstep((x - 0.22) / 0.1);
    yaw = 270;
    dolly = 0.14 + u * 0.72;
    scale = 1.07 + u * 0.1;
    layer = u;
  } else if (x <= 0.4) {
    const u = smootherstep((x - 0.32) / 0.08);
    yaw = 270;
    dolly = 0.86 + u * 0.14;
    scale = 1.17 - u * 0.12;
    layer = 1 + u;
  } else {
    yaw = 270;
    dolly = 1;
    const pair = shotPair((x - 0.4) / 0.6, rooms, 0.78);
    layer = 2 + pair.a + pair.mix;
    scale = 1.04 + pair.mix * 0.04;
  }

  const living = clamp01(1 - Math.abs(layer - 2));
  const orbit = layer < 1.2 ? clamp01(1 - layer * 0.72) * (1 - living * 0.9) : 0;
  const dive = layer < 1 ? clamp01(layer * 1.15) : clamp01(2.05 - layer);
  const roomFloat = layer - 2;
  const room = Math.min(rooms - 1, Math.max(0, Math.floor(roomFloat + 1e-6)));
  const roomMix = clamp01(roomFloat - Math.floor(roomFloat));

  return {
    yaw,
    dolly,
    scale,
    orbit,
    dive,
    room,
    roomMix,
    layer,
    label: layer < 0.45 ? "orbit" : layer < 1.45 ? "dive" : "inside",
  };
}

export function roomVis(layer: number, i: number) {
  return clamp01(1 - Math.abs(layer - 2 - i));
}

export function orbitWeights(yaw: number, count = 8) {
  const step = 360 / count;
  const raw = Array.from({ length: count }, (_, i) => {
    const rel = (shortest(yaw - i * step) * Math.PI) / 180;
    return Math.max(0, Math.cos(rel)) ** 12;
  });
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  return raw.map((w) => w / sum);
}
