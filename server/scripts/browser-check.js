/**
 * Renders the public site in a real browser and checks that the menu comes
 * from the API and that signing in works.
 *
 * Usage: node scripts/browser-check.js [url]
 */
import { chromium } from 'playwright-core'

const URL = process.argv[2] ?? 'http://localhost:4000'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

let passed = 0
let failed = 0

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${label}`)
  } else {
    failed += 1
    console.log(`  FAIL  ${label} ${detail}`)
  }
}

const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const page = await browser.newPage()

const consoleErrors = []
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('pageerror', (error) => consoleErrors.push(error.message))

await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 })

console.log(`\nBrowser check against ${URL}\n`)

check('page title is set', (await page.title()).includes('Juniper'))
check('header shows the brand', (await page.locator('header a').first().innerText()).includes('juniper'))

// The menu is rendered from the API response.
const dishNames = await page.locator('h4').allInnerTexts()
check('menu items rendered from the API', dishNames.includes('Warm sourdough'), JSON.stringify(dishNames))
check('all nine dishes are present', dishNames.length === 9, `got ${dishNames.length}`)
check('a price is shown', (await page.locator('main').innerText()).includes('£24'))

// The quantity stepper works.
const plus = page.getByRole('button', { name: /^Increase portions of Warm sourdough/ })
await plus.click()
await plus.click()
const count = await page.locator('[aria-live="polite"]').first().innerText()
check('quantity stepper counts up', count === '2', `got ${count}`)

// The mode links inside the form switch between sign in and sign up.
await page.getByRole('button', { name: 'Sign in', exact: true }).first().click()
await page.getByRole('button', { name: 'Create account', exact: true }).first().click()
check(
  'the sign-up form shows a name field',
  await page.locator('input[name="name"]').isVisible(),
)
await page.getByRole('button', { name: 'Sign in', exact: true }).last().click()
await page.waitForTimeout(300)
check(
  'clicking "Sign in" switches back to the sign-in form',
  (await page.locator('input[name="name"]').count()) === 0,
)
await page.getByRole('button', { name: 'Create an account', exact: true }).click()
await page.waitForTimeout(300)
check(
  'clicking "Create an account" switches to the sign-up form',
  await page.locator('input[name="name"]').isVisible(),
)

// Sign up through the header form.
await page.locator('input[name="name"]').fill('Browser Tester')
await page.locator('input[name="email"]').fill(`browser-${Date.now()}@juniper.example`)
await page.locator('input[name="password"]').fill('browser-test-pass-123')
await page.locator('button[type="submit"]').click()

await page.waitForTimeout(1500)
const headerText = await page.locator('header').innerText()
check('header greets the signed-in user', headerText.includes('Browser Tester'), JSON.stringify(headerText))
check('sign out button is shown', headerText.includes('Sign out'))

// The session must survive a page refresh — this is what the httpOnly cookie
// stored in Postgres is for.
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const afterReload = await page.locator('header').innerText()
check('the session survives a page refresh', afterReload.includes('Browser Tester'), JSON.stringify(afterReload))

// Saving the table requires the session, so this proves the cookie is sent.
await page.getByRole('button', { name: /^Increase portions of Warm sourdough/ }).click()
await page.getByRole('button', { name: 'Save this table' }).click()
await page.waitForTimeout(1500)
const panelText = await page.locator('text=Your table').first().evaluate((el) => el.closest('div').parentElement.innerText)
check('the table was saved through the API', panelText.includes('Saved'), JSON.stringify(panelText.slice(0, 200)))

check('no console errors', consoleErrors.length === 0, JSON.stringify(consoleErrors.slice(0, 3)))

await page.screenshot({ path: 'browser-check.png', fullPage: false })
console.log('\nScreenshot written to browser-check.png')

await browser.close()

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed === 0 ? 0 : 1)
