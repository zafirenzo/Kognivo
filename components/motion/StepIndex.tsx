'use client'
import { useEffect, useRef, useState } from 'react'

type Step = { title: string; desc: string }

/**
 * A plate's key, pinned in the margin: the numbered list on the left follows the step in
 * view on the right, the way an engraving's legend follows the reader's eye. Phones get the steps.
 */
export function StepIndex({ steps }: { steps: readonly Step[] }) {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i))
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    refs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="steps">
      <nav aria-label="Steps" className="steps-key">
        <ol>
          {steps.map((s, i) => (
            <li key={s.title}>
              <a href={`#step-${i + 1}`} aria-current={active === i ? 'step' : undefined}>
                <span className="steps-n">{String.fromCharCode(97 + i)}.</span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <ol className="steps-list">
        {steps.map((s, i) => (
          <li
            key={s.title}
            id={`step-${i + 1}`}
            data-i={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            className={active === i ? 'is-active' : ''}
          >
            <span className="steps-n" aria-hidden>
              {String.fromCharCode(97 + i)}.
            </span>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
