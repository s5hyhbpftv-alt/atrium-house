import { Link } from "@tanstack/react-router";

export function SiteNav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-5 md:px-9">
      <Link
        to="/"
        className="pointer-events-auto font-display text-sm tracking-brand text-fg"
      >
        SHERWOOD
      </Link>
      <nav className="pointer-events-auto flex items-center gap-5 text-xs uppercase tracking-widest text-accent">
        <a href="/#walk" className="hidden min-h-11 items-center sm:inline-flex">
          Пролёт
        </a>
        <Link to="/craft" preload="intent" className="hidden min-h-11 items-center sm:inline-flex">
          Что мы умеем
        </Link>
        <Link to="/tour" preload="intent" className="inline-flex min-h-11 items-center">
          3D-тур
        </Link>
      </nav>
    </header>
  );
}
