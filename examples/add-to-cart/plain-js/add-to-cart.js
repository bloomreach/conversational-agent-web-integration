// Yours: your cart. Resolve once the item is in the cart, throw when it could not be added.
const addToMyCart = async (productId) => {
  // call your cart API, update your cart UI
}

// product: the variant the shopper picked, or the product itself
// Note: if your cart expects the parent product's id, use the second argument's parentProduct.id;
// a quantity, options or a check that the item is in stock are yours to add
const addToCart = async (product) => {
  try {
    await addToMyCart(product.id)
    return { status: 'success' }
  } catch (error) {
    return { status: 'failed', message: error?.message }
  }
}

window.CLARITY_CONFIG = {
  ...(window.CLARITY_CONFIG ?? {}),
  ui: {
    ...window.CLARITY_CONFIG?.ui,
    useAddToCart: true, // shows the cart button on the product cards
    fn: { ...window.CLARITY_CONFIG?.ui?.fn, addToCart },
  },
}
