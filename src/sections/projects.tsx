import Image from "next/image";
import { IconArrowUpRight } from "@tabler/icons-react";
import { PageEntrance } from "@/components/page-entrance";

type Project = {
  name: string;
  image: string;
  alt: string;
  href?: string;
};

const projects: Project[] = [
  {
    name: "VantaUI",
    image: "vantaui",
    alt: "VantaUI’s interface library and website templates on a sculpted gray background",
    href: "https://www.vantaui.com/",
  },
  {
    name: "Culio",
    image: "culio",
    alt: "Culio’s restaurant dashboard with revenue charts, orders, and reservations",
    href: "https://www.culio.co/",
  },
  {
    name: "Reframe",
    image: "reframe",
    alt: "The Reframe website displayed on a laptop on a blue sofa",
    href: "https://www.reframelabs.co/",
  },
  {
    name: "Flash App",
    image: "flash-app",
    alt: "Three dark mobile screens for creating events and sharing photos in Flash",
  },
  {
    name: "Passwords App",
    image: "passwords-app",
    alt: "Light and dark upgrade screens for Passwords Pro",
  },
  {
    name: "MC Badge",
    image: "mc-badge",
    alt: "Five colorful achievement badges for focus, tasks, and daily progress",
  },
  {
    name: "Mom Clock",
    image: "moms-clock",
    alt: "Mom Clock’s mobile insights with focus time, app usage, and progress charts",
  },
  {
    name: "Trekz App Flow",
    image: "trekz-app-flow",
    alt: "Trekz mobile screens for planning a route, saving routes, and notifications",
  },
  {
    name: "Culio Branding",
    image: "culio-branding",
    alt: "Culio’s brand identity with typography, orange color palette, food photography, and restaurant imagery",
  },
];

function ProjectCard({ project, first }: { project: Project; first: boolean }) {
  const card = (
    <figure className="m-0" data-project-card>
      <div className="rounded-[24px] bg-muted p-4 sm:p-5 lg:p-6">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[16px]">
          <Image
            src={`/projects/${project.image}.png`}
            alt={project.alt}
            fill
            sizes="(min-width: 1800px) 544px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            preload={first}
            className="object-cover"
          />
        </div>
      </div>
      <figcaption className="mt-3 flex items-center justify-between gap-3 px-1 text-base leading-normal text-foreground sm:text-lg">
        <h2 className="text-xl font-normal group-hover:underline group-hover:underline-offset-4">{project.name}</h2>
        {project.href && <IconArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
      </figcaption>
    </figure>
  );

  return project.href ? (
    <a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${project.name} (opens in a new tab)`}
      className="group block rounded-[24px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      {card}
    </a>
  ) : card;
}

export default function Projects() {
  return (
    <PageEntrance className="mx-auto w-full px-4 pt-16 pb-16 font-camera text-foreground md:pt-0 md:pb-20 md:-mt-32" aria-labelledby="projects-title">
      <h1 id="projects-title" className="sr-only">Selected projects by Denzel Obeng</h1>
      <ul className="m-0 grid list-none grid-cols-1 gap-x-4 gap-y-8 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10">
        {projects.map((project, index) => (
          <li data-enter key={project.image} className={index === 2 ? "min-w-0 lg:col-start-1" : "min-w-0"}>
            <ProjectCard project={project} first={index === 0} />
          </li>
        ))}
      </ul>
    </PageEntrance>
  );
}
