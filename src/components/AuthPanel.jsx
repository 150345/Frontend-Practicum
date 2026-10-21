import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const EMPTY_FORM = { name: '', email: '', password: '' }

/**
 * Sign in / create account form plus the signed-in state.
 * Rendered inside the header so the visitor always sees their session.
 */
function AuthPanel() {
  const { user, isAuthenticated, login, signup, logout } = useAuth()
  const [mode, setMode] = useState('login')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)

    try {
      if (isSignup) {
        await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password })
      } else {
        await login({ email: form.email.trim(), password: form.password })
      }
      setForm(EMPTY_FORM)
      setOpen(false)
    } catch (caught) {
      setError(caught.message ?? 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-muted sm:inline">
          Hello, <span className="font-semibold text-ink">{user.name}</span>
        </span>
        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex min-h-10 items-center justify-center border border-forest px-3.5 py-2 text-[11px] font-semibold text-forest transition hover:bg-forest hover:text-white"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="inline-flex min-h-10 items-center justify-center border border-forest px-3.5 py-2 text-[11px] font-semibold text-forest transition hover:bg-forest hover:text-white"
      >
        Sign in
      </button>

      {open ? (
        <form
          onSubmit={handleSubmit}
          className="absolute right-0 top-[calc(100%+10px)] z-30 w-[290px] border border-line bg-white p-5 shadow-[0_18px_40px_rgba(36,59,48,0.16)]"
        >
          <div className="mb-4 flex border border-line">
            <button
              type="button"
              onClick={() => setMode('login')}
              aria-pressed={!isSignup}
              className={`flex-1 px-3 py-1.5 text-[11px] font-semibold transition ${
                !isSignup ? 'bg-forest text-white' : 'bg-white text-ink'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              aria-pressed={isSignup}
              className={`flex-1 px-3 py-1.5 text-[11px] font-semibold transition ${
                isSignup ? 'bg-forest text-white' : 'bg-white text-ink'
              }`}
            >
              Create account
            </button>
          </div>

          <h2 className="mb-1 font-display text-[22px]">
            {isSignup ? 'Join Juniper' : 'Welcome back'}
          </h2>
          <p className="mb-4 text-[11px] text-muted">
            {isSignup
              ? 'Save your table and come back to it later.'
              : 'Sign in to see the table you saved.'}
          </p>

          {isSignup ? (
            <label className="mb-3 block">
              <span className="mb-1 block text-[11px] font-semibold">Name</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={updateField}
                autoComplete="name"
                required
                className="w-full border border-line px-3 py-2 text-sm focus:border-forest focus:outline-none"
              />
            </label>
          ) : null}

          <label className="mb-3 block">
            <span className="mb-1 block text-[11px] font-semibold">Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              autoComplete="email"
              required
              className="w-full border border-line px-3 py-2 text-sm focus:border-forest focus:outline-none"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block text-[11px] font-semibold">Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={isSignup ? 8 : undefined}
              required
              className="w-full border border-line px-3 py-2 text-sm focus:border-forest focus:outline-none"
            />
          </label>

          {error ? (
            <p role="alert" className="mb-3 text-[11px] text-accent">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full border border-forest bg-forest px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-sage hover:text-ink disabled:opacity-60"
          >
            {busy ? 'Just a moment…' : isSignup ? 'Create account' : 'Sign in'}
          </button>

          <p className="mt-3 text-center text-[11px] text-muted">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setError(null)
                  }}
                  className="underline underline-offset-2 hover:text-ink"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to Juniper?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                  }}
                  className="underline underline-offset-2 hover:text-ink"
                >
                  Create an account
                </button>
              </>
            )}
          </p>
        </form>
      ) : null}
    </div>
  )
}

export default AuthPanel
