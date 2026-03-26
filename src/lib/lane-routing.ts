export type Lane = 'overview' | 'operations' | 'console'

export const VALID_LANES: Lane[] = ['overview', 'operations', 'console']

export function parseLane(): Lane {
  const h = window.location.hash.replace('#', '').toLowerCase()
  // Legacy redirect: retired `analysis` route now resolves to the Console lane
  if (h === 'analysis') return 'console'
  return VALID_LANES.includes(h as Lane) ? (h as Lane) : 'overview'
}

export function subscribeHash(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function navigateTo(lane: Lane) {
  window.location.hash = lane
}
