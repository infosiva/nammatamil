// qa/smoke.spec.ts — NammaTamil smoke tests
import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

// 1. Homepage returns 200
test('GET / returns 200', async ({ request }) => {
  const res = await request.get(`${BASE}/`)
  expect(res.status()).toBe(200)
})

// 2. H1 present in server-rendered HTML
test('H1 present in raw server-rendered HTML', async ({ request }) => {
  const res  = await request.get(`${BASE}/`)
  const html = await res.text()
  expect(html).toMatch(/<h1[^>]*>/i)
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  expect(match?.[1]?.replace(/<[^>]+>/g, '').trim().length).toBeGreaterThan(3)
})

// 3. No horizontal overflow on mobile (375px)
test('no horizontal overflow on mobile (375px)', async ({ browser }) => {
  const ctx  = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/`)
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  )
  expect(overflow).toBe(false)
  await ctx.close()
})

// 4. FAQPage JSON-LD schema present
test('FAQPage JSON-LD schema is present', async ({ page }) => {
  await page.goto(`${BASE}/`)
  const schemas = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    return scripts.map(s => { try { return JSON.parse(s.textContent ?? '') } catch { return null } })
  })
  const flat = (schemas as Array<unknown>).flat().filter(Boolean)
  const hasFaq = flat.some((s) => {
    if (typeof s !== 'object' || s === null) return false
    const obj = s as Record<string, unknown>
    // SchemaOrg renders an array of schemas
    if (Array.isArray(obj)) {
      return (obj as Array<Record<string, unknown>>).some(x => x['@type'] === 'FAQPage')
    }
    return obj['@type'] === 'FAQPage'
  })
  expect(hasFaq).toBe(true)
})

// 5. NewsMediaOrganization JSON-LD schema present
test('NewsMediaOrganization JSON-LD schema is present', async ({ page }) => {
  await page.goto(`${BASE}/`)
  const schemas = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    return scripts.map(s => { try { return JSON.parse(s.textContent ?? '') } catch { return null } })
  })
  const flat = (schemas as Array<unknown>).flat().filter(Boolean)
  const hasOrg = flat.some((s) => {
    if (typeof s !== 'object' || s === null) return false
    const obj = s as Record<string, unknown>
    if (Array.isArray(obj)) {
      return (obj as Array<Record<string, unknown>>).some(x => x['@type'] === 'NewsMediaOrganization')
    }
    return obj['@type'] === 'NewsMediaOrganization'
  })
  expect(hasOrg).toBe(true)
})

// 6. /robots.txt allows GPTBot
test('/robots.txt allows GPTBot', async ({ request }) => {
  const res  = await request.get(`${BASE}/robots.txt`)
  expect(res.status()).toBe(200)
  const text = await res.text()
  expect(text).toContain('GPTBot')
  expect(text).not.toMatch(/User-agent:\s*GPTBot[\s\S]*?Disallow:\s*\//m)
})

// 7. /llms.txt returns 200 with content
test('/llms.txt is accessible', async ({ request }) => {
  const res = await request.get(`${BASE}/llms.txt`)
  expect(res.status()).toBe(200)
  const text = await res.text()
  expect(text.length).toBeGreaterThan(50)
})

// 8. No JS console errors on homepage
test('no JS console errors on homepage', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (!text.includes('adsbygoogle') && !text.includes('31.97.56.148')) {
        errors.push(text)
      }
    }
  })
  await page.goto(`${BASE}/`)
  await page.waitForLoadState('networkidle')
  expect(errors).toHaveLength(0)
})
