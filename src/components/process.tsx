import { steps } from "@/lib/content";

export function Process() {
  return (
    <section className="px-gutter py-28">
      <p className="eyebrow">Как работаем</p>
      <h2 className="mt-2.5 mb-10 font-display text-4xl font-normal text-fg md:text-6xl">
        Шесть шагов до ключей
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <article key={step.index} className="min-h-56 border border-line p-6">
            <em className="text-xs not-italic tracking-widest text-accent">{step.index}</em>
            <h3 className="mt-2 mb-2.5 font-display text-2xl font-medium text-fg">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{step.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
