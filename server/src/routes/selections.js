import { Router } from 'express'
import { query, withTransaction } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

/** GET /api/selections — the signed-in user's saved table selections. */
router.get('/', async (req, res, next) => {
  try {
    const { rows: selectionRows } = await query(
      `SELECT id, name, created_at, updated_at
         FROM table_selections
        WHERE user_id = $1
        ORDER BY updated_at DESC, id DESC`,
      [req.user.id],
    )

    if (selectionRows.length === 0) {
      return res.json({ selections: [] })
    }

    const { rows: itemRows } = await query(
      `SELECT tsi.selection_id, tsi.quantity, mi.slug, mi.name, mi.price, mi.diet
         FROM table_selection_items tsi
         JOIN menu_items mi ON mi.id = tsi.menu_item_id
        WHERE tsi.selection_id = ANY($1::int[])
        ORDER BY mi.sort_order, mi.id`,
      [selectionRows.map((selection) => selection.id)],
    )

    const itemsBySelection = new Map()
    for (const row of itemRows) {
      const list = itemsBySelection.get(row.selection_id) ?? []
      list.push({
        id: row.slug,
        name: row.name,
        price: Number(row.price),
        diet: row.diet,
        quantity: row.quantity,
      })
      itemsBySelection.set(row.selection_id, list)
    }

    res.json({
      selections: selectionRows.map((selection) => ({
        id: selection.id,
        name: selection.name,
        createdAt: selection.created_at,
        updatedAt: selection.updated_at,
        items: itemsBySelection.get(selection.id) ?? [],
      })),
    })
  } catch (error) {
    next(error)
  }
})

/** POST /api/selections — save (or replace) a table selection. */
router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? 'My table').trim() || 'My table'
    const requested = Array.isArray(req.body?.items) ? req.body.items : []

    const menuItemIds = requested
      .map((entry) => ({
        databaseId: Number(entry.databaseId ?? entry.id),
        quantity: Math.max(0, Math.min(99, Number(entry.quantity) || 0)),
      }))
      .filter((entry) => Number.isInteger(entry.databaseId) && entry.quantity > 0)

    if (menuItemIds.length === 0) {
      return res.status(400).json({ error: 'Add at least one dish to your table.' })
    }

    const { rows: validItems } = await query(
      'SELECT id FROM menu_items WHERE id = ANY($1::int[])',
      [menuItemIds.map((entry) => entry.databaseId)],
    )
    const validIds = new Set(validItems.map((row) => row.id))
    const entries = menuItemIds.filter((entry) => validIds.has(entry.databaseId))

    if (entries.length === 0) {
      return res.status(400).json({ error: 'None of those dishes are on the menu.' })
    }

    const selectionId = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO table_selections (user_id, name)
         VALUES ($1, $2)
         RETURNING id`,
        [req.user.id, name],
      )
      const id = rows[0].id

      for (const entry of entries) {
        await client.query(
          `INSERT INTO table_selection_items (selection_id, menu_item_id, quantity)
           VALUES ($1, $2, $3)`,
          [id, entry.databaseId, entry.quantity],
        )
      }

      return id
    })

    res.status(201).json({ selection: { id: selectionId, name } })
  } catch (error) {
    next(error)
  }
})

/** DELETE /api/selections/:id — remove one of the user's selections. */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'That selection does not exist.' })
    }

    const { rowCount } = await query('DELETE FROM table_selections WHERE id = $1 AND user_id = $2', [
      id,
      req.user.id,
    ])

    if (rowCount === 0) {
      return res.status(404).json({ error: 'That selection does not exist.' })
    }

    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

export default router
