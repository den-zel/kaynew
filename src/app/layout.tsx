import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SitePreloader } from "@/components/site-preloader";
import { RouteTransition } from "@/components/route-transition";
import Navigation from "@/sections/navigation";
import { createPageMetadata, site, siteStructuredData } from "@/lib/seo";

export const metadata: Metadata = {
  ...createPageMetadata({ path: "/" }),
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s — ${site.name}`,
  },
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full font-camera antialiased"
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteStructuredData).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="zel-system-theme"
        >
          <SitePreloader>
            <RouteTransition />
            <Navigation bookingUrl="https://cal.com/zeldesigns/30min" />
            {children}
          </SitePreloader>
        </ThemeProvider>
      </body>
    </html>
  );
}
