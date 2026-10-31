import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="section">
      <div className="wrap narrow">
        <h1 className="page-title">Nothing printed here.</h1>
        <p className="lede">This page was never printed, or it sold out.</p>
        <Link href="/" className="link">Back to the shop</Link>
      </div>
    </section>
  )
}
