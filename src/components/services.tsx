import { Link } from "@tanstack/react-router";
import { craftPages } from "@/lib/craft";
import { services } from "@/lib/content";

const netLinks = craftPages.filter((page) => page.group === "сети");

export function Services() {
  return (
    <section id="services" className="px-gutter py-28">
      <p className="eyebrow">Что мы умеем</p>
      <h2 className="mt-2.5 mb-4 font-display text-4xl font-normal text-fg md:text-6xl">
        Не один дом. Весь цикл жизни.
      </h2>
      <p className="mb-12 max-w-2xl text-base leading-relaxed text-muted">
        Строим разные дома. Делаем ремонт домов и квартир. Кладём и обслуживаем коммуникации по типам.
        Умный дом — не приставка после ключей, а нервы в стенах.
      </p>

      <div className="grid gap-7">
        {services.map((svc) => (
          <article
            key={svc.index}
            className={`grid gap-5 border-t border-line pt-7 md:grid-cols-2 ${svc.slug === "umnyi-dom" ? "craft-feature" : ""}`}
          >
            <div>
              <em className="text-xs not-italic tracking-widest text-accent">{svc.index}</em>
              <h3 className="mt-2 font-display text-3xl font-medium text-fg">{svc.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{svc.lead}</p>
              <Link
                to="/craft/$slug"
                params={{ slug: svc.slug }}
                className="mt-5 inline-flex min-h-11 items-center text-xs uppercase tracking-widest text-accent"
              >
                Смотреть подробно
              </Link>
            </div>
            <ul className="list-none">
              {svc.items.map((item) => (
                <li key={item} className="border-b border-line py-2 text-sm leading-relaxed text-muted last:border-b-0">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-16">
        <p className="eyebrow">Коммуникации по типам</p>
        <h3 className="mt-2 mb-6 font-display text-3xl font-normal text-fg">Прокладка и обслуживание</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {netLinks.map((page) => (
            <Link
              key={page.slug}
              to="/craft/$slug"
              params={{ slug: page.slug }}
              className="border border-line p-5 text-fg transition-colors hover:border-accent"
            >
              <span className="eyebrow">{page.index}</span>
              <strong className="mt-2 block font-display text-xl font-normal">{page.kicker}</strong>
              <span className="mt-2 block text-sm leading-relaxed text-muted">{page.title}</span>
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-12">
        <Link to="/craft" className="text-xs uppercase tracking-widest text-accent">
          Все умения →
        </Link>
      </p>
    </section>
  );
}
