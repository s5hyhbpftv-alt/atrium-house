import { createFileRoute, notFound } from "@tanstack/react-router";
import { CraftStory } from "@/components/craft-page";
import { craftBySlug, craftPages } from "@/lib/craft";

export const Route = createFileRoute("/craft/$slug")({
  head: ({ params }) => {
    const page = craftBySlug(params.slug);
    return {
      meta: [
        { title: page ? `SHERWOOD · ${page.title}` : "SHERWOOD" },
        { name: "description", content: page?.lede ?? "" },
      ],
    };
  },
  loader: ({ params }) => {
    const page = craftBySlug(params.slug);
    if (!page) throw notFound();
    return page;
  },
  component: CraftSlugPage,
});

function CraftSlugPage() {
  const page = Route.useLoaderData();
  if (!page) return null;
  return <CraftStory page={page} />;
}

export const craftSlugs = craftPages.map((page) => page.slug);
