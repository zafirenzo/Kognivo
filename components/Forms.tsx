'use client'
import { useActionState } from 'react'
import { joinWaitlist, sendCommission, type FormState } from '@/app/actions'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'

export function WaitlistForm({ instrument = 'omnireach', label = 'Join the beta', id }: { instrument?: string; label?: string; id?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(joinWaitlist, {})
  if (state.ok) return <p className="form-ok" role="status">{state.message}</p>
  return (
    <form action={action} className="wl" id={id} noValidate>
      <input type="hidden" name="instrument" value={instrument} />
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hp" aria-hidden />
      <label htmlFor={`${id ?? 'wl'}-email`} className="wl-label">Work email</label>
      <div className="wl-row">
        <input id={`${id ?? 'wl'}-email`} name="email" type="email" autoComplete="email" placeholder="you@company.com" required className="input" defaultValue={state.values?.email} aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? `${id ?? 'wl'}-err` : undefined} />
        <button className="btn" disabled={pending}>
          {pending ? 'Adding you' : label} <ArrowRight size={18} weight="regular" aria-hidden />
        </button>
      </div>
      {state.error && <p id={`${id ?? 'wl'}-err`} className="err">{state.error}</p>}
    </form>
  )
}

function Field({ name, label, err, hint, textarea, ...rest }: { name: string; label: string; err?: string; hint?: string; textarea?: boolean } & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const desc = [hint && `${name}-hint`, err && `${name}-err`].filter(Boolean).join(' ') || undefined
  const props = { id: name, name, className: 'input', 'aria-invalid': err ? true : undefined, 'aria-describedby': desc, ...rest }
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {textarea ? <textarea rows={6} {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} /> : <input {...(props as React.InputHTMLAttributes<HTMLInputElement>)} />}
      {hint && <small id={`${name}-hint`}>{hint}</small>}
      {err && <span id={`${name}-err`} className="err">{err}</span>}
    </div>
  )
}

export function CommissionForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendCommission, {})
  if (state.ok) return <p className="form-ok big" role="status">{state.message}</p>
  const f = state.fields ?? {}
  const v = state.values ?? {}
  return (
    <form action={action} className="stack-form" noValidate>
      {state.error && <p className="alert" role="alert">{state.error}</p>}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden />
      <div className="two">
        <Field name="name" label="Your name" autoComplete="name" err={f.name} defaultValue={v.name} required />
        <Field name="email" label="Email" type="email" autoComplete="email" err={f.email} defaultValue={v.email} required />
      </div>
      <Field name="org" label="Company or school (optional)" autoComplete="organization" defaultValue={v.org} />
      <Field name="brief" label="What should it do?" textarea err={f.brief} defaultValue={v.brief} hint="Who uses it, what it replaces, and what done looks like. Plain words are best." required />
      <div className="two">
        <div className="field">
          <label htmlFor="budget">Budget</label>
          <select id="budget" name="budget" className="input" defaultValue={v.budget ?? ''} key={`b${v.budget}`}>
            <option value="">Not sure yet</option>
            <option>Under ₹50,000</option>
            <option>₹50,000 to ₹2 lakh</option>
            <option>₹2 lakh to ₹5 lakh</option>
            <option>Above ₹5 lakh</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="timeline">When do you need it?</label>
          <select id="timeline" name="timeline" className="input" defaultValue={v.timeline ?? ''} key={`t${v.timeline}`}>
            <option value="">Flexible</option>
            <option>Within a month</option>
            <option>In one to three months</option>
            <option>Later this year</option>
          </select>
        </div>
      </div>
      <button className="btn" disabled={pending}>
        {pending ? 'Sending' : 'Send the brief'} <ArrowRight size={18} aria-hidden />
      </button>
    </form>
  )
}
