# Denzel Obeng’s portfolio

A portfolio built with Next.js and React.

## SEO and metadata

The portfolio’s canonical production origin is `https://thezeldesign.vercel.app`.
It is used by default, including during local development and preview deployments.
To change domains, set `NEXT_PUBLIC_SITE_URL` to the new origin, including
`https://`, in your hosting environment before running `npm run build`. For local
configuration, copy `.env.example` to `.env.local` and set the value there.

The URL is shared by canonical links, Open Graph and Twitter cards, structured
data, `/robots.txt`, and `/sitemap.xml`.

Shared identity, social image details, and the page metadata helper live in
`src/lib/seo.ts`. All social cards use `public/og.png`. The sitemap includes `/`,
`/about`, and `/projects`; the unfinished `/experience` route is marked `noindex`
and excluded from the sitemap.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Routes live in `src/app/(routes)`. The page auto-updates as you edit files.

## Checks

```bash
npm run lint
npm run build
```
