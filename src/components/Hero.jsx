function Hero() {
  return (
    <section
      className="relative isolate flex min-h-[560px] flex-col justify-center bg-forest text-white md:min-h-[610px] xl:min-h-[680px]"
      id="home"
      aria-labelledby="hero-title"
    >
      <img
        className="absolute inset-0 -z-20 h-full object-[58%_center] md:object-[center_55%]"
        src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2200&q=85"
        alt="Beautifully plated seasonal dishes ready to share at the table"
        fetchPriority="high"
        width="2200"
        height="1467"
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[rgba(15,25,19,0.76)] to-[rgba(15,25,19,0.35)] md:from-[rgba(15,25,19,0.77)] md:via-[rgba(15,25,19,0.36)] md:to-[rgba(15,25,19,0.12)]"
        aria-hidden="true"
      />

      <div className="container-site motion-safe-arrive py-11 pb-[110px] motion-safe:animate-arrive md:py-14 md:pb-[108px]">
        <p className="mb-4 text-[11px] font-bold uppercase text-cream">
          East London · Seasonal &amp; local
        </p>
        <h1 id="hero-title" className="mb-2.5 text-[76px] md:text-[106px]">
          Juniper
        </h1>
        <p className="font-display text-[26px] leading-snug sm:text-[29px] md:text-[34px]">
          Good food. Better company.
        </p>
        <p className="mb-7 mt-5 max-w-[340px] text-sm text-[#f0f0e9] md:max-w-none md:text-[15px]">
          A neighborhood kitchen for slow evenings,
          <br className="hidden sm:inline" /> full plates, and one more glass.
        </p>
        <a
          className="inline-flex min-h-12 items-center justify-center gap-8 border border-coral bg-coral px-[23px] py-3.5 text-[13px] font-semibold text-ink transition hover:border-white hover:bg-white"
          href="#reserve"
        >
          Come take a seat <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className="container-site absolute bottom-[27px] left-0 right-0 flex items-center justify-between gap-[18px] border-t border-white/50 pt-[21px] text-[10px] sm:gap-6 sm:text-[11px]">
        <span className="max-w-[160px] sm:max-w-none">Rooted in the season. Made with care.</span>
        <a className="flex items-center gap-2 sm:gap-4" href="#menu">
          A taste of Juniper <span className="text-xl" aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  )
}

export default Hero
