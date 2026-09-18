import { createFileRoute } from "@tanstack/react-router";
import { CraftIndex } from "@/components/craft-page";

export const Route = createFileRoute("/craft/")({
  head: () => ({
    meta: [
      { title: "SHERWOOD · Что мы умеем" },
      {
        name: "description",
        content:
          "Разные дома, ремонт домов и квартир, все коммуникации по типам и умный дом — от щита до сценария.",
      },
    ],
  }),
  component: CraftIndex,
});
