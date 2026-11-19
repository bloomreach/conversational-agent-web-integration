// Note: price and currency are shown as they come; format them the way your shop does
const priceText = (item) => [item.price, item.currency].filter((value) => value != null).join(' ')

export const ProductCard = (props) => {
  const className = ['my-card', props.isSelected && 'is-selected', props.isDisabled && 'is-disabled']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} onClick={() => props.onProductClick()}>
      <img className='my-card-image' src={props.product.image} alt='' />
      <div className='my-card-title'>{props.product.title}</div>
      <div className='my-card-price'>{priceText(props.product)}</div>
      <button
        type='button'
        onClick={(event) => {
          event.stopPropagation()
          props.onAddToCart()
        }}
      >
        Add to cart
      </button>
    </div>
  )
}
