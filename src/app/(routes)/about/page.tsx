import Image from "next/image";
import { IconBrandOpenai, IconRosetteDiscountCheckFilled } from "@tabler/icons-react";
import { PageEntrance } from "@/components/page-entrance";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "About",
  description:
    "Meet Denzel Obeng (Zel), a self-taught product designer and builder. Explore his experience designing products across AI, fintech, and developer tools.",
  path: "/about",
});

const experience = [
  {
    period: "2026 - NOW",
    roles: [{
      title: "Product Designer at Stack Network (China)",
      details: [
        "Redesigning and improving multiple consumer and SaaS products",
        "Redesigned Mom Clock website, iOS App Store assets, and Chrome extension visuals",
        "Redesigned HelloVPN website with a focus on clarity and modern UX",
        "Currently working on the Mom Clock iOS app",
        "Focus: simplifying complex products into clean, usable experiences",
      ],
    }],
  },
  {
    period: "2025 - 2026",
    roles: [
      {
        title: "Design Lead at Fylir LLC (USA)",
        details: [
          "Led product and UI design for full-time product development",
          "Worked on end-to-end product design systems and interfaces",
          "Focused on shipping fast while maintaining design consistency",
        ],
      },
      {
        title: "Co-Founder (Lead Designer) Astrae (Next.js Developer Tool)",
        details: [
          "Built Astrae from scratch for Next.js developers",
          "Reached ~100 paid users at launch",
          "Iterated based on user feedback and usage patterns",
          "Expanded product with templates, components, and reusable blocks",
          "Focus: developer experience and speed of building UI",
        ],
      },
    ],
  },
  {
    period: "2024 - 2025",
    roles: [{
      title: "Design Lead at NativeXAI",
      details: [
        "Redesigned company website to improve conversion and clarity",
        "Rebuilt Options Lab from scratch to make it more intuitive and user-friendly",
        "Designed CodeForYou product from the ground up",
        "Worked closely with product direction and early user feedback",
      ],
    }],
  },
  {
    period: "2023 - 2024",
    roles: [{
      title: "Founder / Design Agency Owner (Studio IX)",
      details: [
        "Started and ran a small design agency",
        "Worked directly with startup clients on websites and product design",
        "Generated ~$8K revenue in 4 months",
        "Sold the agency for $20K the following year",
        "Focus: landing pages, MVP design, and startup branding",
      ],
    }],
  },
  {
    period: "2021 - 2022",
    roles: [{
      title: "Freelance Web Designer (Fiverr)",
      details: [
        "Designed and delivered landing pages and simple websites for global clients",
        "Learned fundamentals of UI, client communication, and fast execution",
        "Built foundation in product thinking through real client constraints",
      ],
    }],
  },
];

function TechStack() {
  return (
    <section data-enter className="mt-16" aria-labelledby="tech-stack-heading">
      <h2 id="tech-stack-heading" className="font-camera text-[11px] font-normal text-muted-foreground uppercase">Tech stack</h2>
      <ul className="mt-7 grid list-none grid-cols-3 items-center gap-x-10 gap-y-8 p-0 sm:grid-cols-6" aria-label="Tools I use">
        <li title="Figma">
          <svg viewBox="0 0 38 57" role="img" aria-label="Figma" className="h-10 w-auto">
            <path className="fill-brand-figma-green" d="M9.5 57A9.5 9.5 0 0 1 9.5 38H19v9.5A9.5 9.5 0 0 1 9.5 57Z" />
            <path className="fill-brand-figma-purple" d="M0 28.5A9.5 9.5 0 0 1 9.5 19H19v19H9.5A9.5 9.5 0 0 1 0 28.5Z" />
            <path className="fill-brand-figma-red" d="M0 9.5A9.5 9.5 0 0 1 9.5 0H19v19H9.5A9.5 9.5 0 0 1 0 9.5Z" />
            <path className="fill-brand-figma-orange" d="M19 0h9.5a9.5 9.5 0 0 1 0 19H19Z" />
            <circle className="fill-brand-figma-blue" cx="28.5" cy="28.5" r="9.5" />
          </svg>
        </li>
        <li title="Paper"><span role="img" aria-label="Paper" className="block size-10 bg-brand-paper [mask-image:url('/assets/stack/paper.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]" /></li>
        <li title="Cursor"><span role="img" aria-label="Cursor" className="block size-10 bg-foreground [mask-image:url('/assets/stack/cursor.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]" /></li>
        <li title="ChatGPT"><IconBrandOpenai className="size-10 shrink-0 text-foreground" stroke={1.5} role="img" aria-label="ChatGPT" /></li>
        <li title="Claude"><span role="img" aria-label="Claude" className="block size-10 bg-brand-claude [mask-image:url('/assets/stack/claude.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]" /></li>
        <li title="Perplexity"><span role="img" aria-label="Perplexity" className="block size-10 bg-brand-perplexity [mask-image:url('/assets/stack/perplexity.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]" /></li>
      </ul>
    </section>
  );
}

export default function AboutPage() {
  return (
    <PageEntrance className="mx-auto w-full max-w-160 bg-background px-6 pt-16 pb-16 font-camera text-[13px] text-foreground sm:px-8 sm:pt-0 sm:pb-20">
      <header data-enter>
        <Image src="/assets/zel.png" alt="Denzel Obeng taking a mirror portrait" width={72} height={72} sizes="72px" preload className="size-18 rounded-[16px] border-4 border-border object-cover object-center" />
        <h1 className="mt-6 flex items-center gap-2 text-lg leading-snug font-medium">
          Denzel Obeng
          <IconRosetteDiscountCheckFilled className="size-5 shrink-0 text-verified" aria-label="Verified" role="img" />
        </h1>
      </header>
      <section className="mt-7" aria-labelledby="work-experience-heading">
        <h2 data-enter id="work-experience-heading" className="font-camera text-[11px] font-normal text-muted-foreground uppercase">Work experience</h2>
        <p data-enter className="mt-2 text-[13px] text-foreground">
          I’m a self-taught product designer and builder. I started with freelance
          web work and gradually moved into startups, leading design for products
          across AI, fintech, and developer tools. I care most about turning
          complex ideas into simple, usable products.
        </p>
        <ol className="mt-12 list-none space-y-8 p-0">
          {experience.map(({ period, roles }) => (
            <li data-enter key={period} className="grid gap-y-4 sm:grid-cols-[80px_minmax(0,1fr)] sm:gap-x-6">
              <p className="pt-0.5 font-camera text-xs leading-5 text-muted-foreground">{period}</p>
              <div className="min-w-0 space-y-8"> 
                {roles.map(({ title, details }) => (
                  <article key={title}>
                    <h3 className="text-sm font-normal text-foreground">{title}</h3>
                    <ul className="mt-2 list-disc pl-6 text-[13px] text-muted-foreground">
                      {details.map((detail) => <li key={detail}>{detail}</li>)}
                    </ul>
                  </article>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>
      <TechStack />
    </PageEntrance>
  );
}
