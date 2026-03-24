import { test } from '@playwright/test'

test('console-visual-audit', async ({ page }) => {
  await page.goto('/?bypass#console')

  // Wait for canvas to render
  await page.waitForSelector('canvas', { timeout: 10000 })
  await page.waitForTimeout(2000)

  // Full screenshot
  await page.screenshot({ path: 'tests/screenshots/console-locked.png', fullPage: true })
  console.log('[AUDIT] screenshot saved → tests/screenshots/console-locked.png')

  // Evaluate overlap matrix
  const report = await page.evaluate(() => {
    function rectsOverlap(a: DOMRect, b: DOMRect) {
      return !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top)
    }
    function overlapArea(a: DOMRect, b: DOMRect) {
      const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
      const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
      return xOverlap * yOverlap
    }

    const coreShell = document.querySelector('.console-core-shell')
    const coreLabel = document.querySelector('.console-core-label')
    const sectors = Array.from(document.querySelectorAll('.console-sector'))
    const kickers = Array.from(document.querySelectorAll('.console-sector-kicker'))
    const bodies = Array.from(document.querySelectorAll('.console-sector-body'))

    const coreShellRect = coreShell?.getBoundingClientRect()
    const coreLabelRect = coreLabel?.getBoundingClientRect()

    const rows: string[] = []

    rows.push('--- CORE SHELL ---')
    rows.push(JSON.stringify(coreShellRect))
    rows.push('--- CORE LABEL ---')
    rows.push(JSON.stringify(coreLabelRect))

    rows.push('\n--- SECTOR OVERLAPS WITH CORE LABEL ---')
    sectors.forEach((s, i) => {
      const sr = s.getBoundingClientRect()
      if (coreLabelRect && rectsOverlap(sr, coreLabelRect)) {
        const area = overlapArea(sr, coreLabelRect)
        rows.push(`  sector[${i}] OVERLAPS core-label  overlap-area=${area.toFixed(0)}px²`)
      }
    })

    rows.push('\n--- KICKER OCCLUSION BY CORE SHELL ---')
    kickers.forEach((k, i) => {
      const kr = k.getBoundingClientRect()
      if (!coreShellRect) return
      if (rectsOverlap(kr, coreShellRect)) {
        const overlap = overlapArea(kr, coreShellRect)
        const kArea = kr.width * kr.height
        const visiblePct = kArea > 0 ? ((kArea - overlap) / kArea * 100) : 100
        rows.push(`  kicker[${i}] "${k.textContent?.trim()}" visible=${visiblePct.toFixed(0)}%  ${visiblePct < 60 ? '⚠ < 60% VISIBLE' : 'OK'}`)
      } else {
        rows.push(`  kicker[${i}] "${k.textContent?.trim()}" fully visible`)
      }
    })

    rows.push('\n--- SECTOR BODY CANVAS WIDTH CHECK ---')
    bodies.forEach((b, i) => {
      const canvases = b.querySelectorAll('canvas')
      canvases.forEach((c, ci) => {
        const w = (c as HTMLCanvasElement).offsetWidth
        rows.push(`  body[${i}] canvas[${ci}] offsetWidth=${w}  ${w > 0 ? 'OK' : '⚠ COLLAPSED'}`)
      })
    })

    rows.push('\n--- AUX GRID SLOTS ---')
    const auxSlots = Array.from(document.querySelectorAll('[class*="aux"], [class*="grid-slot"]'))
    auxSlots.forEach((el, i) => {
      const r = el.getBoundingClientRect()
      rows.push(`  aux[${i}] ${el.className}  w=${r.width.toFixed(0)} h=${r.height.toFixed(0)}`)
    })

    return rows.join('\n')
  })

  console.log('\n[AUDIT] OVERLAP REPORT:\n' + report)
})
