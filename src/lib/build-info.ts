export interface BuildInfo {
  commitSha: string
  buildTime: string
  deployTarget: 'local' | 'vercel' | string
  vercelUrl: string | null
}

declare const __BUILD_INFO__: BuildInfo

export const BUILD_INFO: BuildInfo = __BUILD_INFO__

export function shortBuildTime(iso: string) {
  if (!iso) return 'unknown'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toISOString().slice(0, 16).replace('T', ' ') + 'Z'
}
