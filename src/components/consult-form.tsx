import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { serviceOptions } from "@/lib/content";
import { saveLead } from "@/lib/leads";

export function ConsultForm({ preset }: { preset?: string }) {
  const [sent, setSent] = useState(false);
  const options = preset ? [preset, ...serviceOptions.filter((item) => item !== preset)] : [...serviceOptions];

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const service = String(data.get("service") ?? options[0]);
    if (!name || !phone) return;
    saveLead({ name, phone, service });
    setSent(true);
  }

  return (
    <section id="consult" className="px-gutter py-28">
      <p className="eyebrow">Консультация</p>
      <h2 className="mt-2.5 mb-8 font-display text-4xl font-normal text-fg md:text-6xl">
        Расскажите, что нужно дому
      </h2>
      {sent ? (
        <p className="max-w-md text-base leading-relaxed text-muted">
          Заявка принята. Архитектор SHERWOOD свяжется с вами и согласует выезд.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="grid max-w-md gap-3">
          <Label htmlFor="name">Имя</Label>
          <Input id="name" name="name" placeholder="Как к вам обращаться" required autoComplete="name" />
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+7"
            required
            autoComplete="tel"
            inputMode="tel"
          />
          <Label htmlFor="service">Задача</Label>
          <select
            id="service"
            name="service"
            className="min-h-11 w-full border border-line bg-bg px-4 py-3 text-sm text-fg outline-none focus:border-accent"
            defaultValue={options[0]}
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <Button type="submit" variant="solid" className="mt-2">
            Отправить
          </Button>
        </form>
      )}
    </section>
  );
}
