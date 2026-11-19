# Add to cart

The widget's add-to-cart buttons adding to your cart; see
[`fn.addToCart`](../../guides/03-customize-components.md#fnaddtocart) for the arguments and return values.

A demonstration of the calls, to adapt to your site rather than copy as it is; see [Examples](../README.md).

| Folder | Whose | What is in it |
|---|---|---|
| [`plain-js/`](./plain-js) | You | `add-to-cart.js`: the `addToCart` function, and the lines that put it into `window.CLARITY_CONFIG.ui` together with `useAddToCart` |

There is no `configuration/` folder: a weblayer falls back to the page's `window.CLARITY_CONFIG.ui` for every
`ui` setting it does not set itself, so nothing is needed on Bloomreach's side.

Where the widget shows an add-to-cart button once `fn.addToCart` is set:

- **On the product cards**, only with [`ui.useAddToCart`](../../reference/widget-config.md#feature-flags) on, which the file sets.
- **In the mini-PDP**, unless [`ui.enableCheckOut`](../../reference/widget-config.md#feature-flags) puts the PayPal
  Buy now button in its place; the mini-PDP itself shows only with [`ui.enableMiniPDP`](../../reference/widget-config.md#feature-flags) on.

The function adds `product.id`, the variant the shopper picked or the product itself, through your cart. It
returns `{ status: 'success' }` or `{ status: 'failed' }`, and the built-in button shows "Added" or "Failed".

It serves the built-in buttons and the [custom components](../custom-components/README.md) alike: their
`onAddToCart` goes through it and returns a promise of its result.
