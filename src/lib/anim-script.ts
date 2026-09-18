import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { cameraAnim } from "@/lib/cam";
import { guidedTour, roomPlayhead } from "@/lib/tour-setup";

gsap.registerPlugin(Draggable);

export { gsap, Draggable };

export type TourProxy = { t: number; pan: number };

/** GSAP timeline for the guided tour. Labels + defaults + nested pan tweens. */
export function buildTourTimeline(proxy: TourProxy, roomCount: number, onComplete?: () => void) {
  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: "power2.inOut", overwrite: "auto" },
    onComplete,
    onReverseComplete: onComplete,
  });

  tl.addLabel("start")
    .to(proxy, { t: 0, duration: 0.35, ease: "none" })
    .to({}, { duration: 0.4 })
    .addLabel("orbit")
    .to(proxy, { t: 0.18, duration: guidedTour.orbitSeconds, ease: "none" })
    .to(proxy, { pan: 22, duration: 1.1 })
    .to(proxy, { pan: 0, duration: cameraAnim.panOut })
    .addLabel("window")
    .to(proxy, { t: 0.22, duration: 1.2 })
    .to({}, { duration: 1.1 })
    .addLabel("dive")
    .to(proxy, { t: 0.32, duration: 1.9 })
    .to({}, { duration: 1.5 });

  for (let i = 0; i < roomCount; i++) {
    const dir = i % 2 ? -1 : 1;
    tl.addLabel(`room-${i}`)
      .to(proxy, { t: roomPlayhead(i, roomCount), duration: guidedTour.walkSeconds })
      .to(proxy, { pan: dir * guidedTour.pan.angle, duration: guidedTour.pan.seconds })
      .to(proxy, { pan: 0, duration: cameraAnim.panOut }, "-=0.12")
      .to({}, { duration: 0.25 });
  }

  return tl;
}

export function labelForPlayhead(t: number, roomCount: number) {
  if (t < 0.09) return "start";
  if (t < 0.2) return "orbit";
  if (t < 0.26) return "window";
  if (t < 0.4) return "dive";
  const i = Math.min(roomCount - 1, Math.max(0, Math.round(((t - 0.42) / 0.58) * (roomCount - 1))));
  return `room-${i}`;
}

export { roomPlayhead };
