import type { Metadata, Viewport } from 'next'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/cormorant-garamond/latin-500-italic.css'
import '@fontsource-variable/instrument-sans/wght.css'
import './globals.css'
import { Nav, Footer } from '@/components/Chrome'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Kognivo · Instruments for honest work', template: '%s · Kognivo' },
  description: 'Kognivo is a small software house. OmniReach writes cold outreach from facts it can cite, and eight more instruments are on the bench.',
  openGraph: { siteName: 'Kognivo', images: ['/plates/armillary.webp'] },
}

export const viewport: Viewport = { themeColor: '#EDE7DA' }

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
