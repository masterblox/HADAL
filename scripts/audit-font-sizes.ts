import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Bypass login
  await page.goto('http://localhost:5173/?bypass');
  await page.waitForTimeout(3000);

  // Verify terminal loaded
  const terminalExists = await page.locator('.terminal').count();
  console.log(`\n  Terminal loaded: ${terminalExists > 0 ? 'YES' : 'NO'}\n`);

  if (terminalExists === 0) {
    await page.screenshot({ path: '/tmp/hadal-audit-debug.png' });
    console.log('  Debug screenshot: /tmp/hadal-audit-debug.png');
    await browser.close();
    return;
  }

  // Scroll through all content
  for (let y = 0; y < 8000; y += 500) {
    await page.evaluate(`window.scrollTo(0, ${y})`);
    await page.waitForTimeout(150);
  }
  await page.evaluate('window.scrollTo(0, 0)');
  await page.waitForTimeout(500);

  // ── FONT SIZE AUDIT ──
  const fontResults = await page.evaluate(`
    (function() {
      var sizeMap = {};
      var els = document.querySelectorAll('*');
      for (var k = 0; k < els.length; k++) {
        var el = els[k];
        var style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        var hasText = false;
        for (var c = 0; c < el.childNodes.length; c++) {
          if (el.childNodes[c].nodeType === 3 && (el.childNodes[c].textContent || '').trim()) {
            hasText = true; break;
          }
        }
        if (!hasText) continue;
        var size = style.fontSize;
        var tag = el.tagName.toLowerCase();
        var cls = (typeof el.className === 'string') ? el.className.split(' ').filter(Boolean).slice(0, 2).join('.') : '';
        var sample = (el.textContent || '').trim().slice(0, 50).replace(/\\n/g, ' ');
        if (!sizeMap[size]) sizeMap[size] = { count: 0, examples: [] };
        sizeMap[size].count++;
        if (sizeMap[size].examples.length < 4) {
          sizeMap[size].examples.push('<' + tag + (cls ? '.' + cls : '') + '> "' + sample + '"');
        }
      }
      return sizeMap;
    })()
  `);

  // ── OVERLAP AUDIT ──
  const overlapResults = await page.evaluate(`
    (function() {
      var overlaps = [];
      var sections = document.querySelectorAll('.terminal > *');
      var rects = [];
      for (var i = 0; i < sections.length; i++) {
        var el = sections[i];
        var rect = el.getBoundingClientRect();
        var cls = (typeof el.className === 'string') ? el.className.split(' ')[0] : el.tagName;
        rects.push({ name: cls || el.tagName, top: rect.top, bottom: rect.bottom, h: rect.height });
      }
      for (var i = 0; i < rects.length; i++) {
        for (var j = i + 1; j < rects.length; j++) {
          var ov = Math.max(0, Math.min(rects[i].bottom, rects[j].bottom) - Math.max(rects[i].top, rects[j].top));
          if (ov > 2) {
            overlaps.push(rects[i].name + ' (' + Math.round(rects[i].h) + 'px) overlaps ' + rects[j].name + ' (' + Math.round(rects[j].h) + 'px) by ' + Math.round(ov) + 'px');
          }
        }
      }
      return overlaps;
    })()
  `);

  // ── Print ──
  var sorted = Object.entries(fontResults as Record<string, { count: number; examples: string[] }>)
    .map(function(entry) { return { size: entry[0], px: parseFloat(entry[0]), count: entry[1].count, examples: entry[1].examples }; })
    .sort(function(a, b) { return a.px - b.px; });

  console.log('══════════════════════════════════════');
  console.log('  FONT SIZE AUDIT');
  console.log('══════════════════════════════════════\n');

  sorted.forEach(function(item) {
    console.log('  ' + item.size.padEnd(10) + String(item.count).padStart(4) + ' elements');
    item.examples.forEach(function(ex: string) { console.log('    → ' + ex); });
    console.log('');
  });
  console.log('  TOTAL UNIQUE SIZES: ' + sorted.length + '\n');

  if ((overlapResults as string[]).length > 0) {
    console.log('══════════════════════════════════════');
    console.log('  OVERLAP ISSUES');
    console.log('══════════════════════════════════════\n');
    (overlapResults as string[]).forEach(function(o: string) { console.log('  ⚠ ' + o); });
  } else {
    console.log('  ✓ No overlapping sections detected');
  }

  console.log('\n══════════════════════════════════════\n');
  await browser.close();
})();
