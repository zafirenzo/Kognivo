import Link from 'next/link'
import { List, X } from '@phosphor-icons/react/dist/ssr'
import { RisingWordmark } from './motion/RisingWordmark'
import { SELLER } from '@/lib/site'
import { STATE_LABEL, type State } from '@/lib/catalogue'

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
  { href: '/#cabinet', label: 'Instruments' },
  { href: '/#lab', label: 'The lab' },
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
        <Link href="/#beta" className="btn small nav-cta">Join the beta</Link>
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
            <Link href="/#beta">Join the beta</Link>
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
          <p className="footer-line">Software that shows its work. Made in {SELLER.city.split(',')[0]}.</p>
        </div>
        <nav aria-label="Footer" className="footer-links">
          <Link href="/instruments/omnireach">OmniReach</Link>
          <Link href="/#lab">The lab</Link>
          <Link href="/commission">Commission</Link>
          <Link href="/terms">Terms and refunds</Link>
          <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a>
        </nav>
      </div>
      <RisingWordmark text="KOGNIVO" />
    </footer>
  )
}

export function Stamp({ state }: { state: State }) {
  return <span className={`stamp stamp-${state}`}>{STATE_LABEL[state]}</span>
}
