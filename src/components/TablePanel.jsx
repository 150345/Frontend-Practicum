import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'

/**
 * Lets a signed-in visitor save the table they are building, and lists the
 * tables they saved before. Requires an account — the API rejects anonymous
 * requests.
 */
function TablePanel({ quantities, items }) {
  const { isAuthenticated } = useAuth()
  const [selections, setSelections] = useState([])
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function loadSelections() {
    try {
      const data = await api.listSelections()
      setSelections(data.selections ?? [])
    } catch (caught) {
      setError(caught.message ?? 'We could not load your saved tables.')
    }
  }

  async function saveTable() {
    setStatus('saving')
    setError(null)
    setMessage(null)

    const payload = items
      .filter((item) => (quantities[item.id] ?? 0) > 0)
      .map((item) => ({ databaseId: item.databaseId, quantity: quantities[item.id] }))

    try {
      await api.saveSelection('My table', payload)
      setMessage('Saved. It will be here when you come back.')
      setStatus('saved')
      await loadSelections()
    } catch (caught) {
      setError(caught.message ?? 'We could not save your table.')
      setStatus('idle')
    }
  }

  async function removeSelection(id) {
    try {
      await api.deleteSelection(id)
      await loadSelections()
    } catch (caught) {
      setError(caught.message ?? 'We could not remove that table.')
    }
  }

  // Load the saved tables as soon as we know who the visitor is.
  useEffect(() => {
    if (isAuthenticated) {
      loadSelections()
    } else {
      setSelections([])
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <p className="mt-6 text-xs text-muted">
        Sign in to save your table and come back to it later.
      </p>
    )
  }

  return (
    <div className="mt-6 border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-[20px]">Your table</h3>
          <p className="text-[11px] text-muted">Save what you picked and find it again later.</p>
        </div>
        <button
          type="button"
          onClick={saveTable}
          disabled={status === 'saving'}
          className="border border-forest bg-forest px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-sage hover:text-ink disabled:opacity-60"
        >
          {status === 'saving' ? 'Saving…' : 'Save this table'}
        </button>
      </div>

      {message ? <p className="mt-3 text-[11px] text-forest">{message}</p> : null}
      {error ? (
        <p role="alert" className="mt-3 text-[11px] text-accent">
          {error}
        </p>
      ) : null}

      {selections.length > 0 ? (
        <ul className="m-0 mt-4 list-none space-y-2 border-t border-line p-0 pt-4">
          {selections.map((selection) => (
            <li key={selection.id} className="flex items-start justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold">{selection.name}</p>
                <p className="text-[11px] text-muted">
                  {selection.items.length > 0
                    ? selection.items
                        .map((item) => `${item.quantity}× ${item.name}`)
                        .join(', ')
                    : 'No dishes yet'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeSelection(selection.id)}
                className="text-[11px] text-muted underline underline-offset-2 hover:text-accent"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default TablePanel
