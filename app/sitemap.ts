import type { MetadataRoute } from 'next'
import { PRODUCTS } from '@/lib/catalogue'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/store', '/commission', '/terms', ...PRODUCTS.map((x) => `/store/${x.slug}`)].map((p) => ({ url: SITE_URL + p }))
}
