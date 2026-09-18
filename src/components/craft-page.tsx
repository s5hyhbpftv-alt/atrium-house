import { Link } from "@tanstack/react-router";
import { ConsultForm } from "@/components/consult-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { craftBySlug, craftPages, type CraftPage } from "@/lib/craft";

export function CraftStory({ page }: { page: CraftPage }) {
  const related = page.related
    .map((slug) => craftBySlug(slug))
    .filter((item): item is CraftPage => Boolean(item));

  return (
    <main>
      <SiteNav />
      <section className="craft-hero">
        <img className="craft-hero-img" src={page.image} alt="" width={1600} height={900} />
        <div className="craft-hero-shade" />
        <div className="craft-hero-copy">
          <p className="eyebrow">
            Что мы умеем · {page.index} · {page.kicker}
          </p>
          <h1 className="font-display text-4xl font-normal leading-none text-fg md:text-7xl">{page.title}</h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-fg/80">{page.lede}</p>
        </div>
      </section>

      <section className="px-gutter grid gap-12 py-24 md:grid-cols-2">
        <div className="grid gap-5">
          {page.story.map((para) => (
            <p key={para.slice(0, 24)} className="text-base leading-relaxed text-muted">
              {para}
            </p>
          ))}
        </div>
        <div>
          <p className="eyebrow">Что входит</p>
          <ul className="mt-4 list-none">
            {page.includes.map((item) => (
              <li key={item} className="border-b border-line py-3 text-sm leading-relaxed text-fg last:border-b-0">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {page.scenes ? (
        <section className="px-gutter pb-24">
          <p className="eyebrow">{page.slug === "umnyi-dom" ? "Сценарии, не макросы" : "Характеры"}</p>
          <h2 className="mt-3 mb-10 font-display text-4xl font-normal text-fg md:text-6xl">
            {page.slug === "umnyi-dom" ? "Дом сам знает вечер." : "Не один тип на всех."}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {page.scenes.map((scene) => (
              <article key={scene.title} className="min-h-40 border border-line p-6">
                <h3 className="font-display text-2xl font-medium text-fg">{scene.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{scene.copy}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="px-gutter pb-8">
          <p className="eyebrow">Рядом по смыслу</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                to="/craft/$slug"
                params={{ slug: item.slug }}
                className="block border border-line p-5 text-fg transition-colors hover:border-accent"
              >
                <span className="eyebrow">{item.kicker}</span>
                <strong className="mt-2 block font-display text-2xl font-normal">{item.title}</strong>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <ConsultForm preset={page.title} />
      <SiteFooter />
    </main>
  );
}

export function CraftIndex() {
  return (
    <main>
      <SiteNav />
      <section className="px-gutter flex min-h-[70dvh] flex-col justify-end pb-16 pt-32">
        <p className="eyebrow">Что мы умеем</p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl font-normal leading-none text-fg md:text-8xl">
          Не один дом.
          <br />
          Разные жизни.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
          Строим разные дома. Чиним дома и квартиры. Кладём и обслуживаем все сети — по типам, не «инженерия
          пакетом». Особое внимание — умному дому, который рождается вместе со стенами.
        </p>
      </section>
      <section className="px-gutter grid gap-10 pb-28">
        {craftPages.map((page) => (
          <Link
            key={page.slug}
            to="/craft/$slug"
            params={{ slug: page.slug }}
            className={`craft-card ${page.slug === "umnyi-dom" ? "is-feature" : ""}`}
          >
            <img src={page.image} alt="" width={1600} height={900} />
            <div>
              <span className="eyebrow">
                {page.index} · {page.group}
              </span>
              <h2 className="mt-2 font-display text-3xl font-normal text-fg md:text-5xl">{page.title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{page.lede}</p>
            </div>
          </Link>
        ))}
      </section>
      <ConsultForm />
      <SiteFooter />
    </main>
  );
}
