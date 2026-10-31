export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const normEmail = (s: string) => {
  const t = s.trim().toLowerCase()
  return EMAIL.test(t) ? t : null
}

// Indian mobile: 10 digits starting 6-9, with or without +91 / 0.
export function normPhone(s: string) {
  const d = s.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')
  return /^[6-9]\d{9}$/.test(d) ? d : null
}
