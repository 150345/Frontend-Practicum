import { useEffect, useState } from 'react'
import { useMenu } from '../context/MenuContext.jsx'
import MenuItem from './MenuItem.jsx'
import TablePanel from './TablePanel.jsx'

function MainContent() {
  const { categories, items: menuItems, status, error, reload } = useMenu()
  const [activeFilter, setActiveFilter] = useState('all')
  const [quantities, setQuantities] = useState({})

  useEffect(() => {
    setQuantities((current) => {
      const next = {}
      for (const item of menuItems) {
        next[item.id] = current[item.id] ?? 0
      }
      return next
    })
  }, [menuItems])

  const filteredItems =
    activeFilter === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category === activeFilter)

  const visibleCategories =
    activeFilter === 'all'
      ? categories.filter((category) => category.id !== 'all')
      : categories.filter((category) => category.id === activeFilter)

  function updateQuantity(id, nextValue) {
    setQuantities((current) => ({
      ...current,
      [id]: typeof nextValue === 'function' ? nextValue(current[id]) : nextValue,
    }))
  }

  const selectedCount = Object.values(quantities).reduce((sum, value) => sum + value, 0)

  return (
    <>
      <div className="flex items-center justify-center gap-5 bg-sage px-5 py-[22px] sm:gap-[60px] sm:px-8">
        <p className="max-w-[330px] text-center font-display text-lg sm:max-w-none sm:text-[21px]">
          Fresh from the market. <span className="italic">A little unexpected.</span> Always worth sharing.
        </p>
        <span className="text-[28px] leading-none sm:text-[35px]" aria-hidden="true">
          ✳
        </span>
      </div>

      <section className="py-14 md:py-[84px]" id="menu" aria-labelledby="menu-title">
        <div className="container-site">
          <div className="mb-8 block items-end justify-between gap-9 md:mb-[45px] md:flex">
            <div>
              <p className="mb-4 text-[11px] font-bold uppercase">From our kitchen</p>
              <h2 id="menu-title" className="text-[35px] md:text-[36px] lg:text-[44px]">
                A taste of the season.
              </h2>
            </div>
            <p className="mt-[19px] text-[13px] text-muted md:mt-0 md:pb-0.5">
              Honest ingredients, a curious kitchen.
              <br />
              Our menu follows whatever&apos;s at its best.
            </p>
        </div>
      </section>

      <section className="bg-forest py-14 text-white md:py-[84px]" id="reserve" aria-labelledby="reserve-title">
        <div className="container-site flex flex-col items-start justify-between gap-7 md:flex-row md:items-center md:gap-10">
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase text-coral">There&apos;s a place for you</p>
            <h2 id="reserve-title" className="mb-[17px] text-[35px] md:text-[34px] lg:text-4xl">
              Let&apos;s make an evening of it.
            </h2>
            <p className="text-[13px] text-[#d2ded4]">
              A table for two, a catch-up with friends, or just because.
            </p>
          </div>
          <div className="shrink text-left md:shrink-0 md:text-center">
            <a
              className="inline-flex min-h-12 items-center justify-center gap-8 border border-coral bg-coral px-[23px] py-3.5 text-[13px] font-semibold text-ink transition hover:border-white hover:bg-white"
              href="tel:+442079460958"
            >
              Call to book a table <span aria-hidden="true">↗</span>
            </a>
            <p className="mt-[15px] text-[11px] text-[#d2ded4]">
              For groups of 6 or more,{' '}
              <a
                className="underline underline-offset-[3px]"
                href="mailto:hello@juniper.example?subject=Group%20reservation"
              >
                get in touch
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

export default MainContent
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <MenuItem key={item.id} item={item} quantity={quantities[item.id] ?? 0} onQuantityChange={updateQuantity} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 bg-sage md:grid-cols-2" id="about" aria-labelledby="about-title">
        <div className="aspect-[4/3] min-h-0 md:aspect-auto md:min-h-[480px]">
          <img
            className="h-full"
            src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1100&q=85"
            alt="An inviting restaurant dining room with wooden tables and warm lighting"
            loading="lazy"
            width="1100"
            height="733"
          />
        </div>
        <div className="self-center px-5 py-11 sm:px-8 md:py-16 md:pl-16 md:pr-12 lg:pr-[max(48px,calc((100vw-1200px)/2))]">
          <p className="mb-4 text-[11px] font-bold uppercase">A little about us</p>
          <h2 id="about-title" className="mb-6 text-[35px] md:text-[36px] lg:text-[44px]">
            Your neighborhood.
            <br />
            Our kitchen.
          </h2>
          <p className="mb-[18px] max-w-[460px] text-sm text-[#435249]">
            Juniper began with a simple idea: the best meals aren&apos;t just about what&apos;s on the
            plate. They&apos;re about who you&apos;re sharing it with.
          </p>
          <p className="mb-[18px] max-w-[460px] text-sm text-[#435249]">
            We work with small growers, cook with the seasons, and keep a few seats for the unexpected.
            Come for a quick bite. Stay for the evening.
          </p>
          <div className="mt-7 flex items-center gap-[17px] text-xs">
            <span className="text-[35px] text-forest" aria-hidden="true">
              ✳
            </span>
            <span>A small kitchen. A big welcome.</span>
          </div>
        </div>
      </section>
          </div>

          {status === 'loading' ? (
            <p className="mb-8 border border-line bg-white px-4 py-3 text-xs text-muted">
              Loading today&apos;s menu…
            </p>
          ) : null}

          {status === 'error' ? (
            <div className="mb-8 border border-accent/40 bg-white px-4 py-3 text-xs text-ink">
              <p className="mb-2">{error}</p>
              <button
                type="button"
                onClick={reload}
                className="border border-forest px-3 py-1.5 font-semibold text-forest transition hover:bg-forest hover:text-white"
              >
                Try again
              </button>
            </div>
          ) : null}

          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter menu by course">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveFilter(category.id)}
                aria-pressed={activeFilter === category.id}
                className={`border border-line px-3 py-1 text-xs font-medium transition ${activeFilter === category.id ? 'bg-forest text-white border-forest' : 'text-ink'}`}
              >
                {category.number ? `${category.number} ` : ''}{category.label}
              </button>
            ))}
          </div>