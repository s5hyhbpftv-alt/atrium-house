import { createFileRoute } from "@tanstack/react-router";
import { HouseTour } from "@/components/house-tour";

export const Route = createFileRoute("/tour")({
  head: () => ({
    meta: [{ title: "SHERWOOD · 3D-тур" }],
    links: [
      { rel: "preload", href: "/images/orbit-0.webp", as: "image" },
      { rel: "preload", href: "/videos/window.mp4", as: "video" },
    ],
  }),
  component: TourPage,
});

function TourPage() {
  return <HouseTour />;
}
