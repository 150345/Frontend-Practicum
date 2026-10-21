function QuantityStepper({ value, onChange, label }) {
  // We pass an updater function instead of a plain number so that several
  // clicks in the same render cycle all read the *latest* state rather than
  // a stale `value` prop.
  function decrease() {
    onChange((current) => Math.max(0, current - 1))
  }

  function increase() {
    onChange((current) => current + 1)
  }

  return (
    <div className="mt-3 inline-flex items-center gap-2" aria-label={label}>
      <button
        type="button"
        onClick={decrease}
        disabled={value === 0}
        className="flex h-7 w-7 items-center justify-center border border-line bg-white text-sm font-semibold text-ink transition hover:border-forest disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Decrease ${label}`}
      >
        −
      </button>
      <span className="min-w-[1.25rem] text-center text-xs font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={increase}
        className="flex h-7 w-7 items-center justify-center border border-line bg-white text-sm font-semibold text-ink transition hover:border-forest"
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  )
}

export default QuantityStepper
