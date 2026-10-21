import { pool, withTransaction } from '../src/db.js'

/**
 * Seeds the menu with the dishes that previously lived in `src/data/menu.js`.
 * The script is idempotent: categories and items are upserted by slug, so it
 * can safely run on every deploy.
 */
const categories = [
  { slug: 'starters', label: 'Starters', number: '01', title: 'To start', sortOrder: 1 },
  { slug: 'mains', label: 'Mains', number: '02', title: 'Stay a while', sortOrder: 2 },
  { slug: 'desserts', label: 'Desserts', number: '03', title: 'Something sweet', sortOrder: 3 },
]

const items = [
  {
    slug: 'warm-sourdough',
    category: 'starters',
    name: 'Warm sourdough',
    price: 6,
    description: 'Whipped cultured butter, flaky sea salt',
    diet: 'V',
  },
  {
    slug: 'burrata-tomatoes',
    category: 'starters',
    name: 'Burrata & late tomatoes',
    price: 12,
    description: 'Basil oil, grilled sourdough',
    diet: 'V',
  },
  {
    slug: 'roasted-beetroot',
    category: 'starters',
    name: 'Roasted beetroot',
    price: 10,
    description: 'Cashew cream, dill, toasted seeds',
    diet: 'VG',
  },
  {
    slug: 'sea-bass',
    category: 'mains',
    name: 'Pan-roasted sea bass',
    price: 24,
    description: 'White beans, fennel, lemon butter',
    diet: null,
  },
  {
    slug: 'mushroom-pappardelle',
    category: 'mains',
    name: 'Wild mushroom pappardelle',
    price: 19,
    description: 'Parmesan, thyme, a little truffle',
    diet: 'V',
  },
  {
    slug: 'chargrilled-cauliflower',
    category: 'mains',
    name: 'Chargrilled cauliflower',
    price: 18,
    description: 'Butter beans, tahini, green herbs',
    diet: 'VG',
  },
  {
    slug: 'olive-oil-cake',
    category: 'desserts',
    name: 'Olive oil cake',
    price: 8,
    description: 'Poached pear, vanilla cream',
    diet: 'V',
  },
  {
    slug: 'chocolate-mousse',
    category: 'desserts',
    name: 'Dark chocolate mousse',
    price: 8,
    description: 'Extra virgin olive oil, sea salt',
    diet: 'V',
  },
  {
    slug: 'season-scoop',
    category: 'desserts',
    name: 'A scoop of the season',
    price: 5,
    description: "Ask us about today's homemade sorbet",
    diet: 'VG',
  },
]

async function seed() {
  await withTransaction(async (client) => {
    for (const category of categories) {
      await client.query(
        `INSERT INTO menu_categories (slug, label, number, title, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE
           SET label = EXCLUDED.label,
               number = EXCLUDED.number,
               title = EXCLUDED.title,
               sort_order = EXCLUDED.sort_order`,
        [category.slug, category.label, category.number, category.title, category.sortOrder],
      )
    }

    const { rows } = await client.query('SELECT id, slug FROM menu_categories')
    const categoryIds = new Map(rows.map((row) => [row.slug, row.id]))

    for (const [index, item] of items.entries()) {
      await client.query(
        `INSERT INTO menu_items (slug, category_id, name, price, description, diet, sort_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (slug) DO UPDATE
           SET category_id = EXCLUDED.category_id,
               name = EXCLUDED.name,
               price = EXCLUDED.price,
               description = EXCLUDED.description,
               diet = EXCLUDED.diet,
               sort_order = EXCLUDED.sort_order,
               updated_at = NOW()`,
        [
          item.slug,
          categoryIds.get(item.category),
          item.name,
          item.price,
          item.description,
          item.diet,
          index + 1,
        ],
      )
    }
  })

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM menu_items')
  console.log(`[seed] menu is up to date (${rows[0].count} items)`)
}

seed()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error('[seed] error', error)
    await pool.end()
    process.exit(1)
  })
