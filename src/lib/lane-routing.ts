export type Lane = 'overview' | 'operations' | 'analysis' | 'console'

export const VALID_LANES: Lane[] = ['overview', 'operations', 'analysis', 'console']

export function parseLane(): Lane {
  const h = window.location.hash.replace('#', '').toLowerCase()
  return VALID_LANES.includes(h as Lane) ? (h as Lane) : 'overview'
}

export function subscribeHash(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function navigateTo(lane: Lane) {
  window.location.hash = lane
}
