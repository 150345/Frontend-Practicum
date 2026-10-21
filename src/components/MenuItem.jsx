import QuantityStepper from './QuantityStepper.jsx'

function MenuItem({ item, quantity, onQuantityChange }) {
  return (
    <li className="pt-[22px] md:pt-[25px]">
      <div className="flex items-baseline justify-between gap-3.5">
        <h4 className="text-sm font-semibold leading-normal md:text-[13px]">{item.name}</h4>
        <span className="shrink-0 text-sm md:text-[13px]">£{item.price}</span>
      </div>
      <p className="mt-1 text-xs text-muted md:text-[11px]">
        {item.description}
        {item.diet ? (
          <span className="ml-1 whitespace-nowrap text-[9px] text-forest">{item.diet}</span>
        ) : null}
      </p>
      <QuantityStepper
        value={quantity}
        onChange={onQuantityChange}
        label={`portions of ${item.name}`}
      />
    </li>
  )
}

export default MenuItem
