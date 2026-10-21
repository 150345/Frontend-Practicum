function Footer() {
  return (
    <footer className="pt-11 md:pt-[58px]" id="visit">
      <div className="container-site grid grid-cols-1 gap-9 sm:grid-cols-2 sm:gap-x-[60px] sm:gap-y-9 lg:grid-cols-4 lg:gap-10">
        <div className="min-w-0">
          <a className="font-display text-[36px] leading-none sm:text-[43px]" href="#home">
            juniper<span className="text-accent" aria-hidden="true">.</span>
          </a>
          <p className="mt-[19px] text-[11px] text-muted">
            A neighborhood kitchen.
            <br />
            Everyone&apos;s welcome.
          </p>
        </div>

        <div className="min-w-0">
          <h2 className="mb-5 font-body text-xs font-semibold">Find our table</h2>
          <address className="text-[11px] not-italic text-muted">
            24 Willow Lane
            <br />
            Hackney, London E8 1AA
          </address>
          <a
            className="mt-3.5 inline-block text-[11px] text-muted underline underline-offset-4"
            href="https://www.google.com/maps/search/?api=1&query=Hackney+London+E8+1AA"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore the neighborhood <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>

        <div className="min-w-0">
          <h2 className="mb-5 font-body text-xs font-semibold">Opening hours</h2>
          <dl className="m-0 max-w-[250px] text-[11px] text-muted sm:max-w-none">
            <div className="mb-1 flex justify-between gap-3">
              <dt>Monday</dt>
              <dd className="m-0 whitespace-nowrap">Closed</dd>
            </div>
            <div className="mb-1 flex justify-between gap-3">
              <dt>Tue – Thu</dt>
              <dd className="m-0 whitespace-nowrap">17:00 – 22:00</dd>
            </div>
            <div className="mb-1 flex justify-between gap-3">
              <dt>Fri – Sat</dt>
              <dd className="m-0 whitespace-nowrap">12:00 – 23:00</dd>
            </div>
            <div className="mb-1 flex justify-between gap-3">
              <dt>Sunday</dt>
              <dd className="m-0 whitespace-nowrap">12:00 – 20:00</dd>
            </div>
          </dl>
        </div>

        <div className="min-w-0">
          <h2 className="mb-5 font-body text-xs font-semibold">Say hello</h2>
          <a className="break-words text-[11px] text-muted" href="mailto:hello@juniper.example">
            hello@juniper.example
          </a>
          <a className="mb-4 mt-1 block text-[11px] text-muted" href="tel:+442079460958">
            020 7946 0958
          </a>
          <p className="text-[11px] text-muted">
            Walk-ins always welcome.
            <br />
            Reservations recommended.
          </p>
        </div>
      </div>

      <div className="container-site mt-9 flex flex-col gap-1 border-t border-line py-[21px] text-[10px] text-muted md:mt-[46px] md:flex-row md:justify-between md:gap-4">
        <p>© 2026 Juniper. An independent spirit.</p>
        <p>Made for good company.</p>
      </div>
    </footer>
  )
}

export default Footer
