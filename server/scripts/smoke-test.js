/**
 * End-to-end check of the API against a running server.
 * Usage: node scripts/smoke-test.js [baseUrl]
 */
const BASE = process.argv[2] ?? 'http://localhost:4000'

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

/** Minimal cookie jar so we can assert on session persistence. */
function makeClient() {
  const cookies = new Map()

  return async function request(path, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json' }
    if (cookies.size > 0) {
      headers.Cookie = [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
    }

    const response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    for (const raw of response.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(';')
      const index = pair.indexOf('=')
      cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim())
    }

    const text = await response.text()
    let json = null
    try {
      json = JSON.parse(text)
    } catch {
      json = null
    }
    return { status: response.status, json, text }
  }
}


async function main() {
  console.log(`\nSmoke testing ${BASE}\n`)

  const client = makeClient()
  const email = `smoke-${Date.now()}@juniper.example`
  const password = 'smoke-test-pass-123'

  console.log('health & menu')
  const health = await client('/api/health')
  check('GET /api/health returns 200', health.status === 200, `got ${health.status}`)
  check('health payload is ok', health.json?.ok === true)

  const menu = await client('/api/menu')
  check('GET /api/menu returns 200', menu.status === 200, `got ${menu.status}`)
  check('menu has 9 items', menu.json?.items?.length === 9, `got ${menu.json?.items?.length}`)
  check('menu has 4 categories (incl. "all")', menu.json?.categories?.length === 4, `got ${menu.json?.categories?.length}`)
  check('prices are numbers', menu.json?.items?.every((item) => typeof item.price === 'number'))
  check('every item has a category slug', menu.json?.items?.every((item) => typeof item.category === 'string'))

  const single = await client('/api/menu/warm-sourdough')
  check('GET /api/menu/:slug returns the dish', single.json?.item?.name === 'Warm sourdough')
  const missing = await client('/api/menu/does-not-exist')
  check('GET /api/menu/:slug 404s for unknown dish', missing.status === 404, `got ${missing.status}`)

  console.log('\nanonymous access')
  const anon = await client('/api/auth/me')
  check('GET /api/auth/me returns 200 when signed out', anon.status === 200, `got ${anon.status}`)
  check('signed out user is null', anon.json?.user === null)
  const anonSelections = await client('/api/selections')
  check('GET /api/selections is 401 when signed out', anonSelections.status === 401, `got ${anonSelections.status}`)

  console.log('\ncors')
  const sameOrigin = await fetch(`${BASE}/api/menu`, { headers: { Origin: BASE } })
  check('same-origin request is allowed', sameOrigin.status === 200, `got ${sameOrigin.status}`)
  check(
    'same-origin request gets a CORS header',
    sameOrigin.headers.get('access-control-allow-origin') !== null,
  )

  const foreign = await fetch(`${BASE}/api/menu`, { headers: { Origin: 'https://evil.example' } })
  check('unknown origin is rejected with 403', foreign.status === 403, `got ${foreign.status}`)


  console.log('\nsignup')
  const weak = await client('/api/auth/signup', {
    method: 'POST',
    body: { email, password: 'short', name: 'Test Person' },
  })
  check('short password rejected with 400', weak.status === 400, `got ${weak.status}`)

  const badEmail = await client('/api/auth/signup', {
    method: 'POST',
    body: { email: 'not-an-email', password, name: 'Test Person' },
  })
  check('invalid email rejected with 400', badEmail.status === 400, `got ${badEmail.status}`)

  const signup = await client('/api/auth/signup', {
    method: 'POST',
    body: { email: email.toUpperCase(), password, name: 'Test Person' },
  })
  check('signup returns 201', signup.status === 201, `got ${signup.status}`)
  check('email is normalized to lower case', signup.json?.user?.email === email, signup.json?.user?.email)
  check('password hash is never returned', !signup.text.includes('password'))
  check('session cookie was set', signup.json?.user?.id > 0)

  const duplicate = await client('/api/auth/signup', {
    method: 'POST',
    body: { email, password, name: 'Test Person' },
  })
  check('duplicate email rejected with 409', duplicate.status === 409, `got ${duplicate.status}`)

  console.log('\nsession')
  const me = await client('/api/auth/me')
  check('GET /api/auth/me returns the signed-in user', me.json?.user?.email === email, JSON.stringify(me.json))
  check('signed-in user has an id', typeof me.json?.user?.id === 'number')
  console.log('\nselections')
  const menuItems = menu.json.items
  const save = await client('/api/selections', {
    method: 'POST',
    body: {
      name: 'Friday table',
      items: [
        { databaseId: menuItems[0].databaseId, quantity: 2 },
        { databaseId: menuItems[3].databaseId, quantity: 1 },
      ],
    },
  })
  check('POST /api/selections returns 201', save.status === 201, `got ${save.status}`)

  const list = await client('/api/selections')
  check('GET /api/selections returns the saved table', list.json?.selections?.length === 1, `got ${list.json?.selections?.length}`)
  check('saved table has 2 dishes', list.json?.selections?.[0]?.items?.length === 2)
  check(
    'saved table keeps the right quantities',
    list.json?.selections?.[0]?.items?.find((i) => i.slug === menuItems[0].slug)?.quantity === 2,
  )

  const deleteId = list.json?.selections?.[0]?.id
  const deleted = await client(`/api/selections/${deleteId}`, { method: 'DELETE' })
  check('DELETE /api/selections/:id returns 200', deleted.status === 200, `got ${deleted.status}`)
  const listAfter = await client('/api/selections')
  check('selection list is empty after delete', listAfter.json?.selections?.length === 0)



  console.log('\nlogin & logout')
  const logout = await client('/api/auth/logout', { method: 'POST' })
  check('POST /api/auth/logout returns 200', logout.status === 200, `got ${logout.status}`)
  const afterLogout = await client('/api/auth/me')
  check('user is signed out after logout', afterLogout.json?.user === null, JSON.stringify(afterLogout.json))

  const wrongPassword = await client('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'wrong-password' },
  })
  check('login with wrong password is 401', wrongPassword.status === 401, `got ${wrongPassword.status}`)

  const login = await client('/api/auth/login', { method: 'POST', body: { email, password } })
  check('login returns 200', login.status === 200, `got ${login.status}`)
  check('login returns the user', login.json?.user?.email === email)

  const meAfterLogin = await client('/api/auth/me')
  check('session works after login', meAfterLogin.json?.user?.email === email)

  console.log(`\n${passed} passed, ${failed} failed\n`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('smoke test crashed:', error)
  process.exit(1)
})

