import type { Metadata } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://thezeldesign.vercel.app";

export const site = {
  name: "Denzel Obeng",
  alternateName: "Zel",
  title: "Denzel Obeng — Product Designer & Developer",
  description:
    "Denzel Obeng (Zel) is a product designer and builder creating apps, websites, and interactive experiences across AI, fintech, and developer tools.",
  url: new URL(siteUrl).origin,
  image: {
    url: "/og.png",
    width: 3316,
    height: 1908,
    alt: "Selected product and interaction design work from Denzel Obeng’s portfolio",
    type: "image/png",
  },
};

export function createPageMetadata({
  title,
  description = site.description,
  path,
}: {
  title?: string;
  description?: string;
  path: string;
}): Metadata {
  const fullTitle = title ? `${title} — ${site.name}` : site.title;

  return {
    title: title ?? site.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: site.name,
      title: fullTitle,
      description,
      url: path,
      images: [site.image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [site.image],
    },
  };
}

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      alternateName: site.alternateName,
      url: site.url,
      image: new URL("/assets/zel.png", site.url).href,
      jobTitle: "Product Designer & Developer",
      description: site.description,
      knowsAbout: [
        "Product design",
        "App design",
        "Web development",
        "Interaction design",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      name: site.name,
      alternateName: site.alternateName,
      url: site.url,
      description: site.description,
      inLanguage: "en",
      creator: { "@id": `${site.url}/#person` },
      publisher: { "@id": `${site.url}/#person` },
    },
  ],
};
