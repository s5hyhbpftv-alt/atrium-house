import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function IntroVeil() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDone(true);
      return;
    }
    const t = window.setTimeout(() => setDone(true), 9800);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <button
      type="button"
      className={cn("intro-veil", done && "is-done")}
      aria-hidden={done}
      tabIndex={done ? -1 : 0}
      onClick={() => setDone(true)}
    >
      <video
        className="intro-film"
        poster="/images/intro-poster.webp"
        muted
        playsInline
        autoPlay
        preload="auto"
      >
        <source src="/videos/intro.mp4" type="video/mp4" />
      </video>
      <span className="intro-grain" />
      <div className="intro-brand">
        <p className="eyebrow intro-kicker">Более 20 лет с Вами…</p>
        <h1 className="intro-name">SHERWOOD</h1>
        <span className="intro-rule" />
        <p className="intro-slogan">
          От котлована до выдачи ключей.
          <em>Десять лет гарантии — на конструктив, не на слова.</em>
        </p>
      </div>
    </button>
  );
}
