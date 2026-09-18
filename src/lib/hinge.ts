export function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

export function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/** Door hinge: resistance at rest, accelerating swing, soft-close bounce. */
export function hingeAngle(u: number) {
  const t = clamp01(u);
  const swing = 1 - Math.pow(1 - t, 2.65);
  const bounce = t > 0.8 ? Math.sin((t - 0.8) * Math.PI * 5) * 4.2 * (1 - t) : 0;
  return swing * 92 + bounce;
}

export function hingeShadow(deg: number) {
  const a = Math.abs(deg);
  return `${10 + a * 0.2}px 4px ${16 + a * 0.4}px rgb(0 0 0 / ${0.3 + a * 0.004})`;
}

export function hingeBright(deg: number) {
  return 1 - Math.min(0.38, Math.abs(deg) * 0.0036);
}

export function doorPose(frac: number) {
  let open = 0;
  let opacity = 0;
  let z = -640;
  let scale = 0.7;
  if (frac < 0.18) {
    const u = smoothstep(frac / 0.18);
    opacity = u;
    z = -640 + u * 140;
    scale = 0.68 + u * 0.06;
  } else if (frac < 0.36) {
    const u = smoothstep((frac - 0.18) / 0.18);
    opacity = 1;
    z = -500 + u * 220;
    scale = 0.74 + u * 0.2;
  } else if (frac < 0.7) {
    const u = (frac - 0.36) / 0.34;
    opacity = 1;
    open = hingeAngle(u);
    z = -280 + smoothstep(u) * 200;
    scale = 0.94 + smoothstep(u) * 0.1;
  } else {
    const u = clamp01((frac - 0.7) / 0.3);
    const s = smoothstep(u);
    opacity = Math.max(0, 1 - u * 1.25);
    open = hingeAngle(1) + s * 10;
    z = -80 + s * 420;
    scale = 1.04 + s * 0.4;
  }
  return { open, opacity, z, scale };
}
