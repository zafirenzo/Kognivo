import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="section">
      <div className="wrap narrow">
        <h1 className="inst-title">This drawer is empty.</h1>
        <p className="lede">The page you were looking for is not in the cabinet.</p>
        <Link href="/" className="link">Back to the cabinet</Link>
      </div>
    </section>
  )
}
