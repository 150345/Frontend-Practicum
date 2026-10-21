import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

/**
 * GET /api/menu — the full menu, grouped by category.
 *
 * The response mirrors the shape the frontend used to import from
 * `src/data/menu.js`, so the UI only had to swap its data source.
 */
router.get('/', async (_req, res, next) => {
  try {
    const { rows: categoryRows } = await query(
      `SELECT id, slug, label, number, title
         FROM menu_categories
        ORDER BY sort_order, id`,
    )

    const { rows: itemRows } = await query(
      `SELECT id,
              slug,
              category_id,
              name,
              price,
              description,
              diet
         FROM menu_items
        WHERE is_available = TRUE
        ORDER BY sort_order, id`,
    )

    const categoryById = new Map(categoryRows.map((category) => [category.id, category]))

    const items = itemRows.map((item) => ({
      id: item.slug,
      databaseId: item.id,
      category: categoryById.get(item.category_id)?.slug ?? null,
      name: item.name,
      price: Number(item.price),
      description: item.description,
      diet: item.diet,
    }))

    const categories = categoryRows.map((category) => ({
      id: category.slug,
      label: category.label,
      number: category.number,
      title: category.title,
    }))

    res.json({
      categories: [{ id: 'all', label: 'All', number: null, title: null }, ...categories],
      items,
    })
  } catch (error) {
    next(error)
  }
})

/** GET /api/menu/:slug — a single dish. */
router.get('/:slug', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT mi.id,
              mi.slug,
              mc.slug AS category,
              mi.name,
              mi.price,
              mi.description,
              mi.diet
         FROM menu_items mi
         JOIN menu_categories mc ON mc.id = mi.category_id
        WHERE mi.slug = $1 AND mi.is_available = TRUE`,
      [req.params.slug],
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'That dish is not on the menu.' })
    }

    const row = rows[0]
    res.json({
      item: {
        id: row.slug,
        databaseId: row.id,
        category: row.category,
        name: row.name,
        price: Number(row.price),
        description: row.description,
        diet: row.diet,
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
