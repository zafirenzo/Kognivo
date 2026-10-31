import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/bricolage-grotesque/standard.css'
import '@fontsource/dm-mono/latin-500.css'
import '@fontsource/reenie-beanie/latin-400.css'
import './globals.css'
import { Nav, Footer } from '@/components/Chrome'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Kognivo · Things we make', template: '%s · Kognivo' },
  description: 'Software to buy once or by the month, free and open-source tools, hardware and projects, made by Kognivo in Raipur.',
  openGraph: { siteName: 'Kognivo', images: ['/prints/armillary.webp'] },
}

export const viewport: Viewport = { themeColor: '#F7F3EA' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <a href="#main" className="skip">Skip to content</a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
