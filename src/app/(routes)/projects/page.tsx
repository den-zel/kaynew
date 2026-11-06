import Projects from "@/sections/projects";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Projects",
  description:
    "Explore selected product, app, web, and brand design projects by Denzel Obeng, including VantaUI, Culio, Reframe, and Mom Clock.",
  path: "/projects",
});

export default function ProjectsPage() {
  return <Projects />;
}
