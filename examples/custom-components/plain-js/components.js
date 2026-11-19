// Note: price and currency are shown as they come; format them the way your shop does
const priceText = (item) => [item.price, item.currency].filter((value) => value != null).join(' ')

const mountProductCard = (el, props) => {
  el.innerHTML = `
    <div class="my-card">
      <img class="my-card-image" alt="">
      <div class="my-card-title"></div>
      <div class="my-card-price"></div>
      <button class="my-card-add" type="button">Add to cart</button>
    </div>`

  const card = el.querySelector('.my-card')
  el.querySelector('.my-card-image').src = props.product.image ?? ''
  el.querySelector('.my-card-title').textContent = props.product.title ?? ''
  el.querySelector('.my-card-price').textContent = priceText(props.product)

  card.addEventListener('click', () => props.onProductClick())
  el.querySelector('.my-card-add').addEventListener('click', (event) => {
    event.stopPropagation()
    props.onAddToCart()
  })

  const update = (next) => {
    card.classList.toggle('is-selected', next.isSelected)
    card.classList.toggle('is-disabled', next.isDisabled)
  }
  update(props)
  return { update }
}

// the keys of extraVariantFields name the attributes that tell the variants apart (size, color, …)
const variantLabel = (product, variant) =>
  Object.keys(product.extraVariantFields ?? {}).map((name) => variant[name]).join(' / ')

const mountMiniPDP = (el, props) => {
  el.innerHTML = `
    <div class="my-pdp">
      <button class="my-pdp-close" type="button" aria-label="Close">×</button>
      <img class="my-pdp-image" alt="">
      <h3 class="my-pdp-title"></h3>
      <div class="my-pdp-price"></div>
      <div class="my-pdp-variants"></div>
      <button class="my-pdp-add" type="button">Add to cart</button>
    </div>`

  const addButton = el.querySelector('.my-pdp-add')
  el.querySelector('.my-pdp-close').addEventListener('click', () => props.onClose())
  // Note: the result is written to the button whatever is shown by then; if the shopper can switch variant
  // while an add is in flight, keep the state per item, as the framework versions do
  addButton.addEventListener('click', async () => {
    addButton.disabled = true
    addButton.textContent = 'Adding…'
    const result = await props.onAddToCart().catch(() => ({ status: 'failed' }))
    addButton.textContent = { success: 'Added', failed: 'Failed' }[result?.status] ?? 'Add to cart'
    addButton.disabled = false
  })

  const render = (next) => {
    const item = next.selectedVariant ?? next.product
    addButton.textContent = 'Add to cart'
    el.querySelector('.my-pdp-image').src = item.image ?? next.product.image ?? ''
    el.querySelector('.my-pdp-title').textContent = next.product.title ?? ''
    el.querySelector('.my-pdp-price').textContent = priceText(item)
    // variants holds the product's own entry too: a product without variants has exactly one
    const variants = next.product.variants?.length > 1 ? next.product.variants : []
    el.querySelector('.my-pdp-variants').replaceChildren(
      ...variants.map((variant) => {
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = variantLabel(next.product, variant)
        button.classList.toggle('is-selected', variant.id === item.id)
        button.addEventListener('click', () => next.onVariantSelect(variant.id))
        return button
      })
    )
  }
  render(props)
  return { update: render }
}

// Until this has run, the widget shows its built-in components.
window.CLARITY_CONFIG = {
  ...(window.CLARITY_CONFIG ?? {}),
  ui: {
    ...window.CLARITY_CONFIG?.ui,
    component: {
      ...window.CLARITY_CONFIG?.ui?.component,
      ProductCard: mountProductCard,
      MiniPDP: mountMiniPDP,
    },
  },
}
