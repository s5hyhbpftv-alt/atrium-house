import { createFileRoute } from "@tanstack/react-router";
import { ConsultForm } from "@/components/consult-form";
import { Hero } from "@/components/hero";
import { IntroVeil } from "@/components/intro-veil";
import { Journey } from "@/components/journey";
import { Process } from "@/components/process";
import { Services } from "@/components/services";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      { rel: "preload", href: "/images/house.webp", as: "image" },
      { rel: "prefetch", href: "/images/yard.webp", as: "image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main>
      <IntroVeil />
      <SiteNav />
      <Hero />
      <Journey />
      <Services />
      <Process />
      <ConsultForm />
      <SiteFooter />
    </main>
  );
}
