import type { MetadataRoute } from 'next'
import { INSTRUMENTS } from '@/lib/catalogue'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/commission', '/terms', ...INSTRUMENTS.map((x) => `/instruments/${x.slug}`)].map((p) => ({ url: SITE_URL + p }))
}
