import type { MetadataRoute } from "next";
import { site } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/about", "/projects"].map((path) => ({
    url: new URL(path, site.url).href,
  }));
}
