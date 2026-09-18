import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="hero-stage">
      <div className="hero-frame">
        <img
          className="hero-house"
          src="/images/house.webp"
          alt="Дом SHERWOOD целиком"
          width={1600}
          height={900}
        />
      </div>
      <div className="hero-shade" />
      <div className="hero-copy">
        <p className="eyebrow">Дом под ключ · ремонт · все коммуникации</p>
        <h2 className="mt-4 max-w-xl font-display text-5xl font-normal leading-none text-fg md:text-8xl">
          Дом, который
          <br />
          <em className="italic text-fg/80">не спорит с лесом</em>
        </h2>
        <p className="mt-6 mb-7 max-w-prose text-base leading-relaxed text-muted">
          Здесь утро пахнет деревом, а не ремонтом. Стены держат тишину, инженерия
          не торчит из углов, лес остаётся за стеклом. Так живут в доме, который
          собирали как для себя.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href="#walk">Пролёт по комнатам</a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/tour" preload="intent">Открыть 3D-тур</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
