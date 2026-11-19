import { useState } from 'react'

// Note: price and currency are shown as they come; format them the way your shop does
const priceText = (item) => [item.price, item.currency].filter((value) => value != null).join(' ')

// the keys of extraVariantFields name the attributes that tell the variants apart (size, color, …)
const variantLabel = (product, variant) =>
  Object.keys(product.extraVariantFields ?? {}).map((name) => variant[name]).join(' / ')

const addLabels = { adding: 'Adding…', success: 'Added', failed: 'Failed' }

export const MiniPDP = (props) => {
  const item = props.selectedVariant ?? props.product
  // variants holds the product's own entry too: a product without variants has exactly one
  const variants = props.product.variants?.length > 1 ? props.product.variants : []
  // kept with the item it belongs to, so another variant or product starts from "Add to cart"
  const [added, setAdded] = useState({})
  const addState = added.id === item.id ? added.state : undefined

  const addToCart = async () => {
    setAdded({ id: item.id, state: 'adding' })
    const result = await props.onAddToCart().catch(() => ({ status: 'failed' }))
    setAdded({ id: item.id, state: result?.status })
  }

  return (
    <div className='my-pdp'>
      <button className='my-pdp-close' type='button' aria-label='Close' onClick={() => props.onClose()}>
        ×
      </button>
      <img className='my-pdp-image' src={item.image ?? props.product.image} alt='' />
      <h3 className='my-pdp-title'>{props.product.title}</h3>
      <div className='my-pdp-price'>{priceText(item)}</div>
      <div className='my-pdp-variants'>
        {variants.map((variant) => (
          <button
            key={variant.id}
            type='button'
            className={variant.id === item.id ? 'is-selected' : undefined}
            onClick={() => props.onVariantSelect(variant.id)}
          >
            {variantLabel(props.product, variant)}
          </button>
        ))}
      </div>
      <button type='button' disabled={addState === 'adding'} onClick={addToCart}>
        {addLabels[addState] ?? 'Add to cart'}
      </button>
    </div>
  )
}
