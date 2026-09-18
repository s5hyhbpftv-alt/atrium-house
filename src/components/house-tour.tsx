import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { cameraAnim, orbitWeights, roomVis, sampleTour, shortest, smoothDampAngle, wrap360 } from "@/lib/cam";
import { facades, homeFacades, rooms } from "@/lib/content";
import { wallLight, wallMats, sceneLights } from "@/lib/pbr";
import { tourSetup, roomPlayhead, matterport } from "@/lib/tour-setup";
import { buildTourTimeline, Draggable, gsap, labelForPlayhead } from "@/lib/anim-script";
import { tlNudge, tlPlay, tlProgress, tlRate, tlRestart, tlReverse, tlToggle, tlTweenTo } from "@/lib/tl-controls";
import { clamp01, interact, wheelDelta } from "@/lib/interact";
import { cn } from "@/lib/utils";

const interiors = rooms.filter((room) => room.id !== "house");

function LiveWords({ text, live }: { text: string; live: boolean }) {
  return (
    <p className={cn("journey-line", live && "is-live")}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} style={{ "--i": i } as CSSProperties}>
          {word}{" "}
        </span>
      ))}
    </p>
  );
}

export function HouseTour({ embed = false }: { embed?: boolean }) {
  const shots = embed ? homeFacades : facades;
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const diveRef = useRef<HTMLVideoElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const orbitRefs = useRef<(HTMLElement | null)[]>([]);
  const planeRefs = useRef<(HTMLElement | null)[]>([]);
  const copyRefs = useRef<(HTMLElement | null)[]>([]);
  const orbitCopyRef = useRef<HTMLDivElement>(null);
  const orbitEyeRef = useRef<HTMLSpanElement>(null);
  const orbitTitleRef = useRef<HTMLHeadingElement>(null);
  const windowBtnRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ x: number; y: number; t: number; yaw: number; axis: "none" | "yaw" | "scrub" } | null>(null);
  const yawOff = useRef(0);
  const flick = useRef({ t: 0, yaw: 0 });
  const vel = useRef({ t: { v: 0 }, yaw: { v: 0 } });
  const cam = useRef({ t: 0, yaw: 0, playing: false });
  const ride = useRef({
    auto: true,
    resumeAt: 0,
    visible: true,
  });
  const tlRef = useRef<ReturnType<typeof buildTourTimeline> | null>(null);
  const proxyRef = useRef({ t: 0, pan: 0 });
  const loaded = useRef(new Set<number>([0, 1]));
  const phaseRef = useRef<"orbit" | "dive" | "inside">("orbit");
  const [phase, setPhase] = useState<"orbit" | "dive" | "inside">("orbit");
  const [active, setActive] = useState(0);
  const [grabbing, setGrabbing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const pausedRef = useRef(false);

  const goTo = (t: number) => {
    pausedRef.current = true;
    ride.current.auto = false;
    setPaused(true);
    const tl = tlRef.current;
    if (tl) tlTweenTo(tl, labelForPlayhead(t, interiors.length));
    else cam.current.t = clamp01(t);
  };

  const run = (fn: (tl: NonNullable<typeof tlRef.current>) => void) => {
    const tl = tlRef.current;
    if (!tl) return;
    fn(tl);
  };

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const proxy = proxyRef.current;
    const tl = buildTourTimeline(proxy, interiors.length, () => {
      pausedRef.current = true;
      ride.current.auto = false;
      setPaused(true);
    });
    tlRef.current = tl;
    const bump = () => {
      if (pausedRef.current) return;
      ride.current.auto = false;
      tl.pause();
      ride.current.resumeAt = performance.now() + interact.resumeMs;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        ride.current.visible = entry.isIntersecting && entry.intersectionRatio > 0.35;
      },
      { threshold: [0, 0.35, 0.7] },
    );
    if (trackRef.current) io.observe(trackRef.current);

    let raf = 0;
    let last = performance.now();

    const draw = (t: number, yaw: number) => {
      const shot = sampleTour(t, interiors.length);
      const weights = orbitWeights(yaw, shots.length);

      if (scrubRef.current) scrubRef.current.style.transform = `scaleX(${tlRef.current?.progress() ?? t})`;
      if (hintRef.current) hintRef.current.style.opacity = t < interact.hintUntil && !drag.current ? "1" : "0";
      if (stageRef.current) {
        stageRef.current.style.opacity = String(shot.orbit);
        stageRef.current.style.transform = reduce ? "none" : `scale(${shot.scale})`;
      }

      const rig = sceneLights(yaw);
      if (rigRef.current) {
        const r = rigRef.current;
        r.style.opacity = String(shot.dive > 0.2 ? 0 : 1);
        r.style.setProperty("--sun-x", rig.sunX);
        r.style.setProperty("--sun-y", rig.sunY);
        r.style.setProperty("--rim-x", rig.rimX);
        r.style.setProperty("--rim-y", rig.rimY);
        r.style.setProperty("--key", String(rig.key));
        r.style.setProperty("--rim", String(rig.rim));
        r.style.setProperty("--fill", String(rig.fill));
        r.style.setProperty("--win", String(rig.windows));
        r.style.setProperty("--sun-rgb", rig.sunRgb);
        r.style.setProperty("--fill-rgb", rig.fillRgb);
        r.style.setProperty("--win-rgb", rig.windowRgb);
      }

      orbitRefs.current.forEach((el, i) => {
        if (!el) return;
        const w = weights[i] ?? 0;
        el.style.opacity = String(w < 0.12 ? 0 : w);
        el.style.visibility = w < 0.12 ? "hidden" : "visible";
        el.style.transform = "none";
        if (w >= 0.12) {
          const step = 360 / shots.length;
          const rel = (shortest(yaw - i * step) * Math.PI) / 180;
          const light = wallLight(rel, i % 2 ? wallMats[1] : wallMats[0], rig.sunOffset);
          const spec = el.querySelector(".orbit-spec") as HTMLElement | null;
          const img = el.querySelector("img") as HTMLImageElement | null;
          if (img) {
            img.style.filter = `contrast(${1.08 + (1 - light.blur / 54) * 0.05}) saturate(1.1) brightness(${0.9 + light.diffuse * 0.14})`;
          }
          if (spec) {
            spec.style.setProperty("--spec", String(Math.min(0.38, light.spec * 0.2 + light.env * 0.24)));
            spec.style.setProperty("--lx", rig.sunX);
            spec.style.setProperty("--ly", rig.sunY);
          }
        }
      });

      const film = diveRef.current;
      if (film) {
        film.style.opacity = String(shot.dive);
        film.style.transform = reduce ? "none" : `scale(${1.02 + shot.dolly * 0.06})`;
        if (shot.dive > 0.08 && film.paused) {
          cam.current.playing = true;
          try {
            if (film.readyState < 2) film.load();
            film.currentTime = 0.01;
          } catch {
            /* ignore */
          }
          void film.play().catch(() => {
            /* autoplay block — poster stays */
          });
        }
        if (shot.dive < 0.04 && cam.current.playing) {
          cam.current.playing = false;
          film.pause();
          try {
            film.currentTime = 0;
          } catch {
            /* ignore */
          }
        }
      }

      interiors.forEach((room, i) => {
        const plane = planeRefs.current[i];
        const copy = copyRefs.current[i];
        if (!plane) return;
        const vis = roomVis(shot.layer, i);
        if (vis > 0.04) {
          for (const j of [i, i + 1, i + 2]) {
            if (j < interiors.length && !loaded.current.has(j)) {
              loaded.current.add(j);
              const img = planeRefs.current[j]?.querySelector("img[data-hi]") as HTMLImageElement | null;
              if (img) img.src = interiors[j].image;
            }
          }
        }
        plane.style.opacity = String(vis);
        const dir = i % 2 === 0 ? 1 : -1;
        const breathe =
          vis > 0.65 && shot.roomMix < 0.12 ? 1 + cameraAnim.roomBreathe * (1 - shot.roomMix) : 1;
        plane.style.transform = reduce
          ? "none"
          : `scale(${(1.03 + vis * 0.05) * breathe}) translate3d(${dir * (1 - vis) * 2.4}%, 0, 0)`;
        if (copy) copy.style.opacity = String(vis > 0.55 ? 1 : 0);
      });

      if (orbitCopyRef.current) {
        orbitCopyRef.current.style.opacity = String(
          Math.max(shot.orbit, shot.dive * 0.9) * (shot.layer < 1.5 ? 1 : 0),
        );
      }
      if (windowBtnRef.current) {
        const show = shot.orbit > 0.55 && shot.dive < 0.12 && t > 0.06;
        windowBtnRef.current.style.opacity = show ? "1" : "0";
        windowBtnRef.current.style.pointerEvents = show ? "auto" : "none";
      }
      if (orbitEyeRef.current) orbitEyeRef.current.textContent = shot.label === "dive" ? "Залёт" : "Облёт дома";
      if (orbitTitleRef.current) orbitTitleRef.current.textContent = shot.label === "dive" ? "Внутрь" : "Весь дом";

      if (shot.label !== phaseRef.current) {
        phaseRef.current = shot.label;
        setPhase(shot.label);
      }
      const nextActive = shot.roomMix > 0.5 ? Math.min(interiors.length - 1, shot.room + 1) : shot.room;
      setActive((prev) => (prev === nextActive ? prev : nextActive));
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const c = cam.current;
      const v = vel.current;
      const r = ride.current;

      if (!drag.current) {
        const decay = Math.exp(-dt * interact.inertia);
        if (Math.abs(flick.current.t) > 0.0002) {
          c.t = clamp01(c.t + flick.current.t * dt);
          flick.current.t *= decay;
        } else flick.current.t = 0;
        if (Math.abs(flick.current.yaw) > 0.05) {
          yawOff.current += flick.current.yaw * dt;
          flick.current.yaw *= decay;
        } else flick.current.yaw = 0;

        if (!pausedRef.current && !r.auto && now > r.resumeAt) {
          r.auto = true;
          proxy.t = c.t;
          tl.seek(labelForPlayhead(c.t, interiors.length));
          tl.play();
        }
        if (r.auto && r.visible && !reduce && !pausedRef.current) {
          if (tl.paused()) tl.play();
        } else if (!tl.isActive() && r.auto === false) {
          tl.pause();
        }
      }
      if (drag.current?.axis !== "yaw") c.t = proxy.t;
      if (!drag.current && (r.auto || tl.isActive())) yawOff.current = proxy.pan;

      const shot = sampleTour(c.t, interiors.length);
      if (!drag.current && tl.paused()) yawOff.current *= 0.88;
      const look = shot.layer < 0.4 || shot.label === "inside" ? yawOff.current : 0;
      const spin = wrap360(shot.yaw + look);
      const yawTime = drag.current
        ? cameraAnim.yawDrag
        : shot.label === "dive"
          ? cameraAnim.yawDive
          : shot.label === "inside"
            ? cameraAnim.yawInside
            : cameraAnim.yawOrbit;
      c.yaw = reduce ? spin : smoothDampAngle(c.yaw, spin, v.yaw, yawTime, dt, cameraAnim.maxYawDeg);
      draw(c.t, c.yaw);
      raf = window.requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      const delta = wheelDelta(e);
      if ((tl.progress() <= 0 && delta < 0) || (tl.progress() >= 1 && delta > 0)) return;
      e.preventDefault();
      bump();
      tlProgress(tl, tl.progress() + delta * 1.8);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        tlToggle(tl);
        pausedRef.current = tl.paused();
        ride.current.auto = !tl.paused();
        setPaused(tl.paused());
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        tlReverse(tl);
        pausedRef.current = false;
        ride.current.auto = true;
        setPaused(false);
      }
      if (e.code === "ArrowRight") {
        e.preventDefault();
        tlPlay(tl);
        pausedRef.current = false;
        ride.current.auto = true;
        setPaused(false);
      }
      if (e.code === "ArrowDown") {
        bump();
        tlNudge(tl, 2);
      }
      if (e.code === "ArrowUp") {
        bump();
        tlNudge(tl, -2);
      }
      if (e.code === "Home") {
        tlRestart(tl);
        pausedRef.current = false;
        setPaused(false);
      }
      if (e.code === "End") tlTweenTo(tl, tl.duration());
      if (e.key === "1") {
        tlRate(tl, 0.5);
        setRate(0.5);
      }
      if (e.key === "2") {
        tlRate(tl, 1);
        setRate(1);
      }
      if (e.key === "3") {
        tlRate(tl, 1.5);
        setRate(1.5);
      }
    };

    const stage = trackRef.current?.querySelector(".fly-stage") as HTMLElement | null;
    stage?.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);

    const dragProxy = document.createElement("div");
    const start = { yaw: 0, p: 0 };
    const stageDrag = stage
      ? Draggable.create(dragProxy, {
          trigger: stage,
          type: "x,y",
          lockAxis: true,
          dragClickables: false,
          cursor: "grab",
          activeCursor: "grabbing",
          onPressInit() {
            const t = this.pointerEvent?.target as HTMLElement | undefined;
            if (t?.closest("button, a, .tour-tl, .tour-hlr, .tour-scrub")) {
              this.endDrag();
              return;
            }
            start.yaw = yawOff.current;
            start.p = tl.progress();
            ride.current.auto = false;
            tl.pause();
            drag.current = { x: 0, y: 0, t: cam.current.t, yaw: start.yaw, axis: "none" };
            setGrabbing(true);
          },
          onDrag() {
            const axis = this.lockedAxis === "y" ? "scrub" : "yaw";
            if (drag.current) drag.current.axis = axis;
            if (axis === "yaw") yawOff.current = start.yaw + this.x * interact.dragYaw;
            else tlProgress(tl, start.p - this.y * interact.dragScrub);
          },
          onRelease() {
            if (this.lockedAxis === "x") flick.current.yaw = this.x * interact.flickYaw * 0.08;
            if (this.lockedAxis === "y") flick.current.t = -this.y * interact.flickScrub * 0.4;
            gsap.set(dragProxy, { x: 0, y: 0 });
            drag.current = null;
            if (!pausedRef.current) ride.current.resumeAt = performance.now() + interact.resumeMs;
            setGrabbing(false);
          },
        })[0]
      : null;

    const bar = scrubRef.current?.parentElement;
    const scrubDrag = bar
      ? Draggable.create(document.createElement("div"), {
          trigger: bar,
          type: "x",
          cursor: "ew-resize",
          onPressInit() {
            ride.current.auto = false;
            pausedRef.current = true;
            setPaused(true);
            const rect = bar.getBoundingClientRect();
            tlProgress(tl, (this.pointerX - rect.left) / rect.width);
          },
          onDrag() {
            const rect = bar.getBoundingClientRect();
            tlProgress(tl, (this.pointerX - rect.left) / rect.width);
          },
        })[0]
      : null;

    raf = window.requestAnimationFrame(tick);
    return () => {
      io.disconnect();
      stage?.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(raf);
      stageDrag?.kill();
      scrubDrag?.kill();
      tl.kill();
      tlRef.current = null;
    };
  }, []);

  const view =
    phase === "inside"
      ? interiors[active]
      : phase === "dive"
        ? { title: "Внутрь", copy: "Скролл ведёт камеру в стекло — и вы уже в доме." }
        : { title: "Весь дом", copy: "Камера ведёт сама. Тяните в сторону — крутить, вверх-вниз — листать пролёт." };

  return (
    <section ref={trackRef} id={embed ? "walk" : "tour"} className={cn("tour-track", embed && "is-embed")}>
      <div className={cn("fly-stage sticky top-0 h-dvh overflow-hidden", grabbing ? "is-grabbing" : "is-grab")}>
        <div ref={stageRef} className="orbit-stage">
          {shots.map((item, i) => (
            <div
              key={item.id}
              ref={(el) => {
                orbitRefs.current[i] = el;
              }}
              className="orbit-still"
            >
              <img src={item.image} alt="" width={1600} height={900} />
              <span className="orbit-spec" />
              <span className="orbit-mat" />
            </div>
          ))}
          <div ref={rigRef} className="light-rig" aria-hidden>
            <span className="light-hdri" />
            <span className="light-sun" />
            <span className="light-rim" />
            <span className="light-windows" />
            <span className="light-ao" />
          </div>
        </div>

        <video
          ref={diveRef}
          className="dive-film"
          muted
          playsInline
          preload="auto"
          poster={embed ? "/images/land-6.webp" : "/images/orbit-6.webp"}
        >
          <source src={embed ? "/videos/home-window.mp4" : "/videos/window.mp4"} type="video/mp4" />
        </video>

        {interiors.map((room, i) => (
          <article
            key={room.id}
            ref={(el) => {
              planeRefs.current[i] = el;
            }}
            className="fly-plane"
            aria-hidden={phase !== "inside" || i !== active}
          >
            <img src={i === 0 ? room.image : room.lq} alt="" width={1600} height={900} />
            {i !== 0 ? <img data-hi alt="" width={1600} height={900} /> : null}
            <div className="absolute inset-0 bg-linear-to-t from-bg/80 via-transparent to-transparent" />
            <div
              ref={(el) => {
                copyRefs.current[i] = el;
              }}
              className="journey-copy"
            >
              <span className={cn("eyebrow mb-2.5 block", phase === "inside" && i === active && "is-live")}>
                {room.index} — {room.place}
              </span>
              <h3
                className={cn(
                  "journey-title font-display text-4xl font-normal text-fg md:text-6xl",
                  phase === "inside" && i === active && "is-live",
                )}
              >
                {room.title}
              </h3>
              <LiveWords text={room.copy} live={phase === "inside" && i === active} />
            </div>
          </article>
        ))}

        <div ref={orbitCopyRef} className="journey-copy orbit-copy">
          <span ref={orbitEyeRef} className="eyebrow mb-2.5 block is-live">
            Облёт дома
          </span>
          <h3
            ref={orbitTitleRef}
            className="journey-title is-live font-display text-4xl font-normal text-fg md:text-6xl"
          >
            {view.title}
          </h3>
          <LiveWords text={view.copy} live={phase !== "inside"} />
          <button ref={windowBtnRef} type="button" className="window-hit" onClick={() => goTo(tourSetup.windowAt)}>
            Залететь в окно
          </button>
        </div>

        <p ref={hintRef} className="tour-hint">
          Идёт само · тяните, чтобы вести
        </p>
        <div className="tour-tl">
          <button type="button" onClick={() => run(tlReverse)}>
            Назад
          </button>
          <button
            type="button"
            className="is-on"
            aria-pressed={!paused}
            onClick={() =>
              run((line) => {
                tlToggle(line);
                pausedRef.current = line.paused();
                ride.current.auto = !line.paused();
                setPaused(line.paused());
              })
            }
          >
            {paused ? "Смотреть" : "Пауза"}
          </button>
          <button type="button" onClick={() => run(tlRestart)}>
            Сначала
          </button>
          {[0.5, 1, 1.5].map((n) => (
            <button
              key={n}
              type="button"
              className={rate === n ? "is-on" : ""}
              onClick={() =>
                run((line) => {
                  tlRate(line, n);
                  setRate(n);
                })
              }
            >
              {n}×
            </button>
          ))}
        </div>

        <div className="tour-scrub" aria-hidden>
          <i ref={scrubRef} />
        </div>

        {!embed ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-gutter py-5">
            <span className="font-display tracking-brand text-xs uppercase text-fg">SHERWOOD · 3D-тур</span>
            <div className="pointer-events-auto flex gap-4">
              <button
                type="button"
                className="inline-flex min-h-11 items-center text-xs uppercase tracking-widest text-accent"
                onClick={() => goTo(tourSetup.start)}
              >
                Вокруг дома
              </button>
              <Link to="/" className="inline-flex min-h-11 items-center text-xs uppercase tracking-widest text-accent">
                На сайт
              </Link>
            </div>
          </div>
        ) : null}

        {!embed && matterport.showcase.highlightReel ? (
          <nav className="tour-hlr" aria-label="Highlight reel">
            <button type="button" className={phase !== "inside" ? "is-on" : ""} onClick={() => goTo(tourSetup.start)}>
              <img src={shots[0].image} alt="" />
              <span>Дом</span>
            </button>
            {interiors.map((room, i) => (
              <button
                key={room.id}
                type="button"
                className={phase === "inside" && active === i ? "is-on" : ""}
                onClick={() => goTo(roomPlayhead(i, interiors.length))}
              >
                <img src={room.lq || room.image} alt="" />
                <span>{room.place}</span>
              </button>
            ))}
          </nav>
        ) : null}
      </div>
    </section>
  );
}
