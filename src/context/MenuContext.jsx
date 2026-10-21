import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'

const MenuContext = createContext(null)

/**
 * Loads the menu from the API (which reads it from PostgreSQL).
 *
 * The shape returned here is identical to the array that used to live in
 * `src/data/menu.js`, so the components only had to change where they get
 * their data from.
 */
export function MenuProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const data = await api.getMenu()
      setCategories(data.categories ?? [])
      setItems(data.items ?? [])
      setStatus('ready')
    } catch (caught) {
      setError(caught.message ?? 'We could not load the menu just now.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const value = useMemo(
    () => ({ categories, items, status, error, reload: load }),
    [categories, items, status, error, load],
  )

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export function useMenu() {
  const context = useContext(MenuContext)
  if (!context) {
    throw new Error('useMenu must be used inside a MenuProvider')
  }
  return context
}
