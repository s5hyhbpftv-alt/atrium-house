export type PbrMat = {
  name: string;
  roughness: number;
  metallic: number;
  f0: number;
};

/** Facade materials. Tweak roughness / metallic / f0 — that's the whole PBR setup. */
export const wallMats: PbrMat[] = [
  { name: "stone-timber", roughness: 0.58, metallic: 0.02, f0: 0.04 },
  { name: "timber", roughness: 0.64, metallic: 0, f0: 0.04 },
  { name: "timber-end", roughness: 0.52, metallic: 0, f0: 0.04 },
  { name: "glass", roughness: 0.08, metallic: 0.05, f0: 0.08 },
];

/**
 * Blender World + lights for an exterior golden-hour archviz.
 * HDRI is fill. Sun is the only hard key. Windows are area lights.
 * Keep sun azimuth in world space — camera yaw orbits around it.
 */
export const blenderWorld = {
  hdri: 1.55,
  sunAzimuth: 48,
  sunAltitude: 17,
  sunKelvin: 4200,
  sunAngle: 2.4,
  fillKelvin: 7400,
  fill: 0.2,
  windowKelvin: 2650,
  window: 0.58,
};

function sat(n: number) {
  return Math.min(1, Math.max(0, n));
}

function kelvinRgb(k: number) {
  const t = k / 100;
  const r = t <= 66 ? 255 : Math.min(255, 329.7 * (t - 60) ** -0.133);
  const g = t <= 66 ? Math.min(255, 99.47 * Math.log(t) - 161.12) : Math.min(255, 288.12 * (t - 60) ** -0.0755);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : Math.min(255, 138.52 * Math.log(t - 10) - 305.04);
  return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
}

/**
 * Cook-Torrance (GGX + Schlick + Smith) on a photo plane.
 * nDotV — camera vs wall, nDotL — sun vs wall, nDotH — half vector.
 */
export function evalPbr(nDotV: number, nDotL: number, nDotH: number, mat: PbrMat) {
  const nv = Math.max(0.02, Math.abs(nDotV));
  const nl = Math.max(0.02, nDotL);
  const nh = Math.max(0.02, nDotH);
  const a = Math.max(0.02, mat.roughness * mat.roughness);
  const a2 = a * a;
  const d = nh * nh * (a2 - 1) + 1;
  const D = a2 / (Math.PI * d * d);
  const k = ((mat.roughness + 1) * (mat.roughness + 1)) / 8;
  const G = (nv / (nv * (1 - k) + k)) * (nl / (nl * (1 - k) + k));
  const F = mat.f0 + (1 - mat.f0) * (1 - nv) ** 5;
  const spec = Math.min(2.2, (D * G * F) / (4 * nv * nl));
  const kd = (1 - F) * (1 - mat.metallic);
  return {
    diffuse: 0.38 + kd * nl * 0.72,
    spec,
    fresnel: F,
    env: F * (1 - mat.roughness) * (0.35 + 0.65 * (1 - nv)),
    blur: 6 + mat.roughness * 48,
    size: 14 + mat.roughness * 48,
  };
}

export function wallLight(rel: number, mat: PbrMat, sunOffset = 0.38) {
  const nDotV = Math.cos(rel);
  const nDotL = Math.cos(rel - sunOffset);
  const nDotH = Math.cos(rel - sunOffset * 0.5);
  return { ...evalPbr(nDotV, nDotL, nDotH, mat), nDotV, nDotL, facing: sat(nDotV) };
}

/** World-space sun vs camera yaw. Same idea as rotating the HDRI in Blender. */
export function sceneLights(yaw: number) {
  const sun = blenderWorld.sunAzimuth - yaw;
  const rad = (sun * Math.PI) / 180;
  const alt = (blenderWorld.sunAltitude * Math.PI) / 180;
  const facing = sat(Math.cos(rad));
  const back = sat(-Math.cos(rad));
  return {
    sunX: `${50 + Math.sin(rad) * 34}%`,
    sunY: `${42 - Math.sin(alt) * 22}%`,
    rimX: `${50 - Math.sin(rad) * 38}%`,
    rimY: `${28 + Math.sin(alt) * 8}%`,
    key: 0.28 + facing * 0.42,
    rim: 0.08 + back * 0.26,
    fill: blenderWorld.fill,
    windows: blenderWorld.window * (0.7 + facing * 0.3),
    hdri: blenderWorld.hdri,
    sunRgb: kelvinRgb(blenderWorld.sunKelvin),
    fillRgb: kelvinRgb(blenderWorld.fillKelvin),
    windowRgb: kelvinRgb(blenderWorld.windowKelvin),
    sunOffset: rad,
  };
}
