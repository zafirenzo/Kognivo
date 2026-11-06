import { Opening } from '@/components/home/Opening'
import { Creation } from '@/components/home/Creation'
import { PRODUCTS, getProduct, priceLabel } from '@/lib/catalogue'

export default function Home() {
  const ticker = [...PRODUCTS.filter((x) => x.status === 'available'), getProduct('omnireach')!].map((x) => `${x.name} ${priceLabel(x).replace(' a month', '/mo')}`)
  return (
    <>
      <Opening />
      <Creation />
      <div className="ticker" aria-label="On sale now">
        <div className="ticker-track">
          {[0, 1].map((k) => (
            <p key={k} aria-hidden={k === 1}>
              {ticker.map((t) => (
                <span key={t}>{t}<svg viewBox="0 0 20 20" aria-hidden><path d="M10 1v18M1 10h18M3.6 3.6l12.8 12.8M16.4 3.6 3.6 16.4" /></svg></span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </>
  )
}
