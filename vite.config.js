import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { site } from './src/data/site.js'
import { profile, socials } from './src/data/profile.js'
import { skillLayers } from './src/data/skills.js'

// Placeholder values must never reach production metadata or structured data.
const real = (value) =>
  typeof value === 'string' && value.trim() && !value.startsWith('TODO:') ? value : undefined

/**
 * Injects SEO metadata into index.html from src/data/site.js, and emits
 * robots.txt + sitemap.xml at build time. Keeps a single source of truth —
 * index.html is static, so without this the site URL and name would have to be
 * duplicated there and would inevitably drift.
 */
function siteMeta() {
  const url = real(site.url) ?? ''
  const name = real(site.name)
  const title = name ? `${name} — ${site.jobTitle}` : `${site.jobTitle} — Portfolio`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: name ?? site.jobTitle,
    jobTitle: site.jobTitle,
    description: site.description,
    ...(url && { url }),
    ...(real(profile.email) && { email: `mailto:${profile.email}` }),
    ...(real(profile.location) && {
      address: { '@type': 'PostalAddress', addressLocality: profile.location },
    }),
    sameAs: socials.map((s) => real(s.href)).filter((href) => href?.startsWith('http')),
    knowsAbout: skillLayers
      .flatMap((layer) => layer.items)
      .filter((item) => item.primary && real(item.name))
      .map((item) => item.name),
  }

  if (!jsonLd.sameAs.length) delete jsonLd.sameAs

  const tokens = {
    '%SITE_TITLE%': title,
    '%SITE_DESCRIPTION%': site.description,
    '%SITE_URL%': url,
    '%SITE_OG_IMAGE%': url ? `${url}${site.ogImage}` : site.ogImage,
    '%SITE_LOCALE%': site.locale,
    '%SITE_NAME%': name ?? site.jobTitle,
    '%SITE_JSONLD%': JSON.stringify(jsonLd),
  }

  return {
    name: 'site-meta',

    // Surfaces unfilled placeholders at build time so they can't ship silently.
    buildStart() {
      const missing = []
      if (!url) missing.push('site.url (canonical, sitemap and OG image URLs are omitted)')
      if (!name) missing.push('site.name (used in <title>, OG and JSON-LD)')
      if (!real(profile.email)) missing.push('profile.email')
      if (!jsonLd.sameAs) missing.push('socials hrefs (JSON-LD sameAs omitted)')

      if (missing.length) {
        this.warn(
          `\nPlaceholder content still present:\n${missing
            .map((item) => `  - ${item}`)
            .join('\n')}\nRun: grep -rn "TODO:" src/data\n`
        )
      }
    },

    transformIndexHtml(html) {
      // Drop the absolute-URL-only block wholesale when there is no domain,
      // otherwise just remove the markers and let the tokens resolve.
      const gated = url
        ? html.replace(/<!--%URL_ONLY_(START|END)%-->\s*/g, '')
        : html.replace(
            /[ \t]*<!--%URL_ONLY_START%-->[\s\S]*?<!--%URL_ONLY_END%-->\n?/,
            ''
          )

      return Object.entries(tokens).reduce(
        (out, [token, value]) => out.replaceAll(token, value),
        gated
      )
    },

    generateBundle() {
      // Without a real domain, tell crawlers nothing rather than something wrong.
      const robots = url
        ? `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`
        : `User-agent: *\nAllow: /\n`

      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })

      if (url) {
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), tailwindcss(), siteMeta()],
  build: {
    rollupOptions: {
      output: {
        // Split the animation library out of the app chunk so app edits don't
        // invalidate a large vendor bundle on every deploy.
        //
        // Skipped for the SSR smoke-test build (scripts/ssr-entry.jsx), where
        // react and react-dom are externals and cannot be chunked.
        ...(isSsrBuild
          ? {}
          : {
              manualChunks: {
                react: ['react', 'react-dom'],
                motion: ['framer-motion'],
              },
            }),
      },
    },
  },
}))
