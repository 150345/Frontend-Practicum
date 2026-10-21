import AuthPanel from './AuthPanel.jsx'

function Header() {
  return (
    <header className="flex min-h-[116px] flex-wrap items-center justify-between gap-4 bg-paper px-5 py-[18px] sm:min-h-[94px] sm:gap-7 sm:px-8 lg:px-12">
      <a
        className="font-display text-[36px] leading-none sm:text-[43px]"
        href="#home"
        aria-label="Juniper home"
      >
        juniper<span className="text-accent" aria-hidden="true">.</span>
      </a>

      <nav
        className="order-3 flex w-full items-center justify-center gap-8 sm:order-none sm:w-auto sm:gap-[34px]"
        aria-label="Main navigation"
      >
        <a className="border-b border-transparent py-1 text-xs font-medium hover:border-current sm:text-[13px]" href="#menu">
          The menu
        </a>
        <a className="border-b border-transparent py-1 text-xs font-medium hover:border-current sm:text-[13px]" href="#about">
          Our story
        </a>
        <a className="border-b border-transparent py-1 text-xs font-medium hover:border-current sm:text-[13px]" href="#visit">
          Find us
        </a>
      </nav>

      <div className="flex items-center gap-3">
        <AuthPanel />
        <a
          className="inline-flex min-h-[42px] items-center justify-center gap-[18px] border border-forest bg-forest px-3.5 py-2.5 text-[11px] font-semibold text-white transition hover:bg-sage hover:text-ink sm:min-h-12 sm:gap-8 sm:px-[23px] sm:py-3.5 sm:text-[13px]"
          href="#reserve"
        >
          Book a table <span aria-hidden="true">↗</span>
        </a>
      </div>
    </header>
  )
}

export default Header
