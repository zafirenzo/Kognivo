import Link from 'next/link'
import { List, X } from '@phosphor-icons/react/dist/ssr'
import { RisingWordmark } from './motion/RisingWordmark'
import { SELLER } from '@/lib/site'
import { KIND_LABEL, type Product } from '@/lib/catalogue'
import { CartLink } from './Shop'

export function Mark({ size = 26 }: { size?: number }) {
  // An armillary, reduced to three strokes.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="16" cy="16" r="12.5" />
      <ellipse cx="16" cy="16" rx="12.5" ry="4.6" transform="rotate(-23 16 16)" />
      <path d="M16 2.5v27" />
      <circle cx="16" cy="16" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

const LINKS = [
  { href: '/store', label: 'Store' },
  { href: '/store?shelf=hardware', label: 'Hardware' },
  { href: '/store?shelf=open-source', label: 'Open source' },
  { href: '/commission', label: 'Commission' },
]

export function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand" aria-label="Kognivo, home">
          <Mark />
          <span>Kognivo</span>
        </Link>
        <nav aria-label="Main" className="nav-links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </nav>
        <CartLink />
        <button className="nav-menu" popoverTarget="menu" aria-label="Open menu">
          <List size={24} aria-hidden />
        </button>
        <div id="menu" popover="auto" className="menu">
          <button className="nav-menu menu-close" popoverTarget="menu" popoverTargetAction="hide" aria-label="Close menu">
            <X size={24} aria-hidden />
          </button>
          <nav aria-label="Mobile">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
            <Link href="/cart">Cart</Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <p className="footer-brand"><Mark size={22} /> Kognivo</p>
          <p className="footer-line">Software, hardware and projects, made in {SELLER.city.split(',')[0]}.</p>
        </div>
        <nav aria-label="Footer" className="footer-links">
          <Link href="/store">Store</Link>
          <Link href="/store/omnireach">OmniReach</Link>
          <Link href="/store?shelf=soon">Coming soon</Link>
          <Link href="/commission">Commission</Link>
          <Link href="/terms">Terms and refunds</Link>
          <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a>
        </nav>
      </div>
      <RisingWordmark text="KOGNIVO" />
    </footer>
  )
}

/** A rubber stamp in oxblood: what it is, or where it stands. */
export function Stamp({ x }: { x: Product }) {
  const [label, tone] =
    x.status === 'soon' ? ['Coming soon', 'quiet'] : x.status === 'beta' ? ['Private beta', 'loud'] : x.stock === 0 ? ['Sold out', 'quiet'] : [KIND_LABEL[x.kind], 'loud']
  return <span className={`stamp stamp-${tone}`}>{label}</span>
}
