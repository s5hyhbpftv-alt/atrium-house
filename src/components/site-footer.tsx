import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-gutter py-8 text-sm text-muted">
      <span className="font-display tracking-brand text-fg">SHERWOOD</span>
      <div className="flex gap-5">
        <Link to="/craft" preload="intent" className="inline-flex min-h-11 items-center text-accent">
          Что мы умеем
        </Link>
        <Link to="/tour" preload="intent" className="inline-flex min-h-11 items-center text-accent">
          3D-тур
        </Link>
      </div>
    </footer>
  );
}
