import Link from 'next/link'
import { List, X } from '@phosphor-icons/react/dist/ssr'
import { RisingWordmark } from './motion/RisingWordmark'
import { SELLER, SHIPPING } from '@/lib/site'
import { KIND_LABEL, rupees, type Product } from '@/lib/catalogue'
import { CartLink } from './Shop'

export function Mark({ size = 30 }: { size?: number }) {
  // Two drums out of register: a pink disc under a blue ring.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="mark">
      <circle cx="14" cy="17" r="11" fill="var(--pink)" style={{ mixBlendMode: 'multiply' }} />
      <circle cx="18" cy="14" r="9.5" fill="none" stroke="var(--blue)" strokeWidth="4" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  )
}

const LINKS = [
  { href: '/atlas', label: 'Atlas' },
  { href: '/store', label: 'Store' },
  { href: '/store?shelf=hardware', label: 'Hardware' },
  { href: '/store?shelf=open-source', label: 'Open source' },
  { href: '/commission', label: 'Commission' },
]

export function Nav() {
  return (
    <>
    <p className="notice">Fresh prints every week. Free shipping in India on hardware over {rupees(SHIPPING.indiaFreeOver)}.</p>
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
    </>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <p className="footer-brand"><Mark size={34} /> Kognivo</p>
          <p className="footer-line">Software, hardware and projects, made by hand in {SELLER.city.split(',')[0]}.</p>
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

/** Each shelf prints in its own ink. */
export const TINT: Record<string, string> = { software: 'yellow', subscription: 'pink', free: 'teal', 'open-source': 'blue', hardware: 'orange', project: 'purple', soon: 'blue' }
export const tintOf = (x: Product) => (x.status === 'soon' ? 'blue' : TINT[x.kind])

/** A small printed label: what it is, or where it stands. */
export function Stamp({ x }: { x: Product }) {
  const [label, tone] =
    x.status === 'soon' ? ['Coming soon', 'blue'] : x.status === 'beta' ? ['Private beta', 'pink'] : x.stock === 0 ? ['Sold out', 'ink'] : [KIND_LABEL[x.kind], tintOf(x)]
  return <span className={`stamp stamp-${tone}`}>{label}</span>
}
