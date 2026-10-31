'use client'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { EASE } from './motion/hooks'

// A sample draft. Tantu Looms is invented, and its sources sit on .example addresses on purpose.
const SOURCES = [
  { url: 'tantulooms.example/wholesale', quote: 'Now supplying table linen to cafés in Pune and Bengaluru.' },
  { url: 'tantulooms.example/about', quote: 'Every runner is woven on a pit loom in Maheshwar.' },
  { url: 'tantulooms.example/gifting', quote: 'We are taking plastic out of all our gift packaging this year.' },
]

function Cite({ n, active, set, children }: { n: number; active: number; set: (n: number) => void; children: React.ReactNode }) {
  const on = active === n
  return (
    <>
      <mark className={on ? 'is-on' : ''}>{children}</mark>
      <button type="button" className="cite" aria-pressed={on} aria-label={`Source ${n + 1}`} onClick={() => set(n)}>
        {n + 1}
      </button>
    </>
  )
}

/** The signature: every claim in the draft carries a footnote, and its source slip slides out beside it. */
export function CitedLetter() {
  const [active, setActive] = useState(0)
  const s = SOURCES[active]
  return (
    <div className="letter-wrap">
      <article className="letter" aria-label="Sample draft written by OmniReach">
        <p className="letter-meta">
          <span>To</span> Meera, Tantu Looms
          <br />
          <span>Re</span> Gift boxes without plastic
        </p>
        <p>Hi Meera,</p>
        <p>
          I saw that Tantu Looms{' '}
          <Cite n={0} active={active} set={setActive}>
            now supplies table linen to cafés in Pune and Bengaluru
          </Cite>
          . That, and the note that{' '}
          <Cite n={1} active={active} set={setActive}>
            every runner is woven on a pit loom in Maheshwar
          </Cite>
          , is the kind of detail most suppliers leave out.
        </p>
        <p>
          We make printed, plastic-free boxes for small textile brands, and your gifting page says{' '}
          <Cite n={2} active={active} set={setActive}>
            you are taking plastic out of your gift packaging this year
          </Cite>
          . Would ten minutes next week be useful?
        </p>
        <p>Ravi</p>
      </article>
      <div className="slips" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.figure
            key={active}
            className="slip"
            initial={{ x: -28, opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
            animate={{ x: 0, opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
            exit={{ x: 12, opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <span className="slip-n">Source {active + 1}</span>
            <blockquote>“{s.quote}”</blockquote>
            <figcaption>{s.url}</figcaption>
          </motion.figure>
        </AnimatePresence>
        <p className="slip-note">Sample draft. Tantu Looms is invented; tap a number to see the line it was written from.</p>
      </div>
    </div>
  )
}
