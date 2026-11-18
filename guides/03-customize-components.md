[← Back to Chapter 2 — Style the widget](02-style-the-widget.md)

# 3. Customize components

Custom React, Vue, Angular, or plain JS components can replace the built-in MiniPDP, ProductCard, and ProductCarousel slots. Function overrides let you intercept actions like add-to-cart.

Both apply to the default widget, also when it runs as the [desktop side panel](./05-side-panel.md). Mobile AI Mode ([`widgetTemplate: 'ai_mode'`](../reference/weblayer-config.md#widgettemplate)) supports only [`fn.getProductImageUrl`](#fngetproductimageurl), [`fn.getProductPrices`](#fngetproductprices) and [`fn.getLinkOptions`](#fngetlinkoptions).

These are set via `window.CLARITY_CONFIG.ui` — see [`widget-config.md → ui.component / ui.fn`](../reference/widget-config.md#ui--appearance--behavior) for where they live in the full config.

---

## Component Overrides

Three component slots can be overridden via `window.CLARITY_CONFIG.ui.component`:

- **`MiniPDP`** — the side panel / overlay shown when a product card is clicked
- **`ProductCard`** — each individual card in the product carousel
- **`ProductCarousel`** — the entire product carousel (the whole row of cards). When set, it replaces the built-in carousel and takes priority over `ProductCard`.

Each accepts a mount function: `(el, props) => { update?, cleanup?, config? } | void` (see [`MountFnResult`](#mountfnresult))

| Argument | Description |
|----------|-------------|
| `el` | The container element to mount into (already in the DOM) |
| `props` | The component props (see below) |
| `update` | Optional; called when props change without unmounting |
| `cleanup` | Optional; called when the component is removed |
| `config.updateForComponentAction` | Optional; `true` by default — `update` is called for every change. With `false`, a change caused by any callback the component itself fired (`onVariantSelect`, `onProductClick`, `onFollowUp`, …) does not call `update`, for every prop that change touched, including the ones the widget derives from it, such as `disabled` once the selection limit is reached. Only opt out when your component does not render those props from `update`. |

The callbacks in `props` always act on the widget's current state, so the ones received at mount stay valid for the component's whole life — there is no need to re-bind them from `update`.

### Props

#### MiniPDP

| Prop | Description |
|------|-------------|
| `product` | The [product](#product) (title, image, price, variants, url…) |
| `selectedVariant` | Currently selected variant (the product itself if none chosen) |
| `onClose` | Call this to close the panel |
| `onVariantSelect(variantId)` | Call this when the user picks a variant |
| `onAddToCart(config?)` | Call this when the user clicks add-to-cart. Routes through `fn.addToCart` exactly like the built-in mini-PDP button. Pass `{ skipAddToCartFn: true }` ([`AddToCartCallbackConfig`](#addtocartcallbackconfig)) to only log the `addToCart` event without invoking `fn.addToCart`. |
| `onFollowUp` | Call this to select this product and focus the chat input so the shopper can type a follow-up question (same as the built-in "Ask follow up" action) |
| `onShowSimilar` | Call this to select this product and ask the assistant for similar products (same as the built-in "Find similar" action). Closes the mini-PDP. |

`update` is triggered by changes to `product` or `selectedVariant` (see [`config.updateForComponentAction`](#component-overrides)).

#### ProductCard

| Prop | Description |
|------|-------------|
| `product` | The [product](#product) |
| `visited` | `false` while lazy-mounted and not yet scrolled into view — render a placeholder and defer your fetch; flips to `true` (via `update`) once in view. Always `true` when lazy mounting is off. See [Lazy mounting](#lazy-mounting). |
| `isSelected` | `true` when this product (or one of its variants) is in the current selection: compare mode, "Ask follow up" or "Find similar" |
| `isDisabled` | `true` when the selection limit is reached and this card is not selected. Render it as not clickable: an `onProductClick` from a disabled card is ignored by the widget. |
| `selectedVariant` | Currently selected variant for this card (`undefined` if none chosen) |
| `onVariantSelect(variantId)` | Call this when the user picks a variant on the card |
| `onProductClick` | Call this when the user clicks the card |
| `onOpenMiniPDP` | Call this to open the mini-PDP for this product (always opens, regardless of select mode) |
| `onAddToCart(config?)` | Call this when the user clicks add-to-cart. Routes through `fn.addToCart` like the built-in button. Pass `{ skipAddToCartFn: true }` to only log the `addToCart` event without invoking `fn.addToCart`. |
| `onFollowUp` | Call this to select this product and focus the chat input so the shopper can type a follow-up question (same as the built-in "Ask follow up" action) |
| `onShowSimilar` | Call this to select this product and ask the assistant for similar products (same as the built-in "Find similar" action) |
| `onEllipsisClick(anchorEl, productId, position?)` | Call this to open the built-in product action menu (Ask follow up / Find similar / Go to product page) anchored to `anchorEl` (e.g. an ellipsis button). `position` controls where the menu appears relative to the anchor and defaults to `'top-right'` when `ui.useAddToCart` is on, `'top-left'` otherwise, see [`Position`](#position). `productId` is accepted for signature parity with the carousel slot. |

`update` is triggered by changes to `isSelected` or `isDisabled` (see [`config.updateForComponentAction`](#component-overrides)).

#### ProductCarousel

Receives the full list of products in one mount instead of one card at a time. When set, this slot replaces the built-in carousel entirely and **takes priority over `ProductCard`** (if both are set, `ProductCard` is ignored).

| Prop | Description |
|------|-------------|
| `products` | The full array of [products](#product) in this carousel |
| `visited` | `false` while lazy-mounted and not yet scrolled into view — render a placeholder and defer your fetch; flips to `true` (via `update`) once in view. Always `true` when lazy mounting is off. See [Lazy mounting](#lazy-mounting). |
| `selected` | `Set<number>` of **indices into `products`** (not product ids) that are in the current selection (compare mode, "Ask follow up" or "Find similar") |
| `disabled` | `Set<number>` of **indices into `products`** (not product ids) that are disabled (selection limit reached and not selected). Render them as not clickable: an `onProductClick` for a disabled product is ignored by the widget. |
| `selectedVariant` | The currently selected variant across the carousel (`undefined` if none). Only one variant is selected at a time, regardless of which product it belongs to. |
| `onVariantSelect(variantId)` | Call this when the user picks a variant. |
| `onProductClick(productId)` | Call with a product **or variant** id when the user clicks a card. Resolves to the owning product (opens the mini-PDP, or toggles selection in compare mode). |
| `onOpenMiniPDP(productId)` | Call with a product **or variant** id to always open the mini-PDP for the owning product, regardless of select mode. |
| `onAddToCart(productId, config?)` | Call with a product **or variant** id when the user clicks add-to-cart. A variant id adds that variant, a product id adds the product's own entry (the first entry of its `variants`); to add the variant the shopper picked, pass its id. Routes through `fn.addToCart` exactly like the built-in button. Pass `{ skipAddToCartFn: true }` to only log the `addToCart` event without invoking `fn.addToCart` (e.g. when your component already handles the add itself). |
| `onFollowUp(productId)` | Call with a product **or variant** id to select the owning product and focus the chat input for a typed follow-up (same as the built-in "Ask follow up" action). |
| `onShowSimilar(productId)` | Call with a product **or variant** id to select the owning product and ask the assistant for similar products (same as the built-in "Find similar" action). |
| `onEllipsisClick(anchorEl, productId, position?)` | Call to open the built-in product action menu (Ask follow up / Find similar / Go to product page) for the given product, anchored to `anchorEl` (e.g. an ellipsis button). Pass a product **or variant** id; the widget resolves the owning product. `position` controls where the menu appears relative to the anchor and defaults to `'top-right'` when `ui.useAddToCart` is on, `'top-left'` otherwise, see [`Position`](#position). |

`onProductClick`, `onOpenMiniPDP`, `onAddToCart`, `onFollowUp`, `onShowSimilar`, and `onEllipsisClick` accept either a product id or any of that product's variant ids — the widget looks up the matching product/variant for you.

`update` is triggered by changes to `products`, `selected`, or `disabled` (see [`config.updateForComponentAction`](#component-overrides)).

### Lazy mounting

When you override `ProductCard` / `ProductCarousel`, every card in the chat log mounts on load, and each mount typically triggers a fetch for the element to render. With a long chat history that fires a burst of requests at once. Lazy mounting defers the **fetch** (not the mount) until the item scrolls into view.

It is **off by default** and enabled per component under `ui.component.config`:

```js
window.CLARITY_CONFIG.ui.component = {
  ProductCard,
  config: {
    ProductCard: {
      lazy: true,          // omit or false = eager (default)
      rootMargin: '300px', // start loading this far before the item is visible. Default '100px'
      settleMs: 200,       // how long the item must stay in view before it loads. Default 500
    },
    // ProductCarousel: { lazy: true },  // independent per-component config
  },
}
```

How it works: the override still mounts immediately, but its props carry an `visited` flag. While `visited` is `false`, render your placeholder and do **not** fetch. Once the item settles into view, the widget calls your `update` with `visited: true` — that's your cue to fetch and render the real content. The `settleMs` debounce prevents items that merely scroll past (e.g. during the on-open scroll-to-bottom) from loading.

> ⚠️ A lazy override **must return an `update` function** — that is how it's told `visited` flipped to `true`. Without it, the element stays on its placeholder forever. Your placeholder should also reserve a sensible height so the layout doesn't jump when the real content loads.

```js
const ProductCard = (el, props) => {
  let fetched = false
  const render = (p) => {
    if (!p.visited) {
      el.innerHTML = '<div class="my-skeleton" style="height:320px"></div>' // your placeholder
      return
    }
    if (!fetched) {
      fetched = true
      fetchAndRender(el, p) // only fetch once in view
    }
  }
  render(props)
  return { update: render, cleanup: () => {} } // update is required for lazy
}
```

### Examples

The pattern is the same for all slots — swap the slot name and your component.

#### Vanilla JS

```js
window.CLARITY_CONFIG.ui = {
  component: {
    MiniPDP: (el, props) => {
      const render = (p) => { el.innerHTML = '...'; /* wire up p.onClose etc. */ }
      render(props)
      return { update: render }
    },
  }
}
```

#### React

```jsx
import { createRoot } from 'react-dom/client'

window.CLARITY_CONFIG.ui = {
  component: {
    MiniPDP: (el, props) => {
      const root = createRoot(el)
      root.render(<MyComponent {...props} />)
      return {
        update: (p) => root.render(<MyComponent {...p} />),
        cleanup: () => root.unmount(),
      }
    },
  }
}
```

#### Vue

```js
import { createApp, reactive, h } from 'vue'
import MyComponent from './MyComponent.vue'

window.CLARITY_CONFIG.ui = {
  component: {
    MiniPDP: (el, props) => {
      const state = reactive(props)
      const app = createApp({ setup: () => () => h(MyComponent, state) })
      app.mount(el)
      return {
        update: (p) => Object.assign(state, p),
        cleanup: () => app.unmount(),
      }
    },
  }
}
```

#### Angular

Set `CLARITY_CONFIG` inside an Angular service to access the DI system. The `mount()` helper is generic and works for any slot.

```ts
import { Injectable, ApplicationRef, EnvironmentInjector, createComponent, Type } from '@angular/core'
import MyComponent from './my-component'

@Injectable({ providedIn: 'root' })
export class ClarityConfigService {
  constructor(private appRef: ApplicationRef, private injector: EnvironmentInjector) {
    // keep whatever the install snippet or the weblayer already put there; a standalone
    // install snippet assigns window.CLARITY_CONFIG, so it has to run before this service
    window.CLARITY_CONFIG ??= {}
    window.CLARITY_CONFIG.ui = {
      ...window.CLARITY_CONFIG.ui,
      component: {
        ...window.CLARITY_CONFIG.ui?.component,
        MiniPDP: (el, props) => this.mount(MyComponent, el, props),
      },
    }
  }

  private mount<T>(Component: Type<T>, el: HTMLElement, props: Record<string, unknown>) {
    const ref = createComponent(Component, { environmentInjector: this.injector, hostElement: el })
    for (const [k, v] of Object.entries(props)) ref.setInput(k, v)
    this.appRef.attachView(ref.hostView)
    ref.changeDetectorRef.detectChanges()
    return {
      update: (p: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(p)) ref.setInput(k, v)
        ref.changeDetectorRef.detectChanges()
      },
      cleanup: () => { this.appRef.detachView(ref.hostView); ref.destroy() },
    }
  }
}
```

---

## Function Overrides

Function overrides are set via `window.CLARITY_CONFIG.ui.fn`.

### `fn.addToCart`

Called when the user clicks the add-to-cart button on a product card or in the mini-PDP, or when a custom `MiniPDP`, `ProductCard` or `ProductCarousel` component invokes its `onAddToCart` callback.

```js
window.CLARITY_CONFIG.ui = {
  useAddToCart: true,
  fn: {
    async addToCart(product, config) {
      // when triggered from a product card/carousel, open the mini-PDP so the
      // shopper can pick a variant instead of adding directly
      if (config.source === 'product_item') {
        config.openMiniPDP()
        return
      }
      try {
        await myCart.add(product.id)
        return { status: 'success' }
      } catch (err) {
        return { status: 'failed', message: err.message }
      }
    }
  }
}
```

The second argument, `config`, carries:
- **`source`** — where the click came from: `'product_item'` (a product card or carousel card) or `'mini_pdp'` (the mini-PDP's own add-to-cart button). Use it to behave differently per call site — e.g. `openMiniPDP()` only makes sense from `'product_item'`, since the mini-PDP is already open when `source` is `'mini_pdp'`.
- **`openMiniPDP()`** — opens the mini-PDP for the same product (equivalent to the shopper clicking the card).
- **`parentProduct`** — the parent product the added item belongs to. When `product` is a selected variant, `parentProduct` is the top-level product that owns it; otherwise it equals `product`. Use it to reference the product family regardless of which variant was chosen. `product` only carries the base product fields, the mini-PDP / stock attributes and variant-level attributes; other merchant attributes (card tags, the attribute logged as category, `productAttributesToLog` fields, …) live on `parentProduct`.

`addToCart` may return:
- `void` (sync or async) — no add happened; the button resets as if it was never pressed. Use this when you opened the mini-PDP (via `config.openMiniPDP()`) or otherwise deferred the add instead of completing it.
- `{ status: 'success' | 'failed'; message?: string }` — synchronous result.
- `Promise<void | { status; message? }>` — async result.

Returning a result lets the widget reflect outcome state on the UI. The built-in carousel "Add to cart" button transitions through `Adding` → `Added` / `Failed` and resets after 3s — the `Failed` label appears when `addToCart` returns `{ status: 'failed' }`, `Added` when it returns `{ status: 'success' }`; a throw or rejection also shows `Failed`. When `addToCart` returns nothing (`void`), the button silently returns to its idle state — nothing appears to happen.

The built-in `MiniPDP` also renders its own "Add to cart" button (below the variant options / variant questions) whenever `fn.addToCart` is defined. It shares the same `Adding` → `Added` / `Failed` outcome handling as the carousel button and routes clicks through the same handler.

When [`ui.enableCheckOut`](../reference/widget-config.md#feature-flags) is `true`, the mini-PDP replaces its "Add to cart" button with a PayPal-branded checkout button (fixed PayPal wordmark + localized "Buy Now" label) that opens the built-in PayPal checkout flow for the selected variant instead of calling `fn.addToCart`. [`fn.showCheckoutButton`](#fnshowcheckoutbutton) can hide that button again, in which case the mini-PDP falls back to the "Add to cart" button.

The built-in product-card cart button only renders when [`ui.useAddToCart`](../reference/widget-config.md#feature-flags) is `true` **and** `fn.addToCart` is defined — a configured button is never shown when it would do nothing. (The built-in mini-PDP button renders whenever `fn.addToCart` is defined and does not depend on `useAddToCart`, unless `enableCheckOut` replaces it with the Buy now button above.)

Add-to-cart clicks **never navigate to the product page**. Every add-to-cart click that reaches the handler (i.e. the button was not disabled) fires the `addToCart` hook (action `add_to_cart`) with `product_id`, `product_category`, and `location` (one of `'product card'`, `'miniPDP'`, `'customized product card'`, `'customized product carousel'`, `'customized miniPDP'`) — regardless of `useAddToCart`. After logging, `addToCart(product)` is invoked when `fn.addToCart` is defined; it is skipped when `fn.addToCart` is absent, or when a custom `onAddToCart` callback was called with `{ skipAddToCartFn: true }` (log-only).

### `fn.showATCButton`

Optional per-product gate for the built-in carousel and mini-PDP "Add to cart" buttons. On the carousel, only evaluated when [`ui.useAddToCart`](../reference/widget-config.md#feature-flags) is `true`. On the mini-PDP, evaluated when `fn.addToCart` is defined (alongside the existing `enableCheckOut` / Buy now path). When unset, the button is shown (same as returning `true`).

```js
window.CLARITY_CONFIG.ui = {
  useAddToCart: true,
  fn: {
    showATCButton(product) {
      // e.g. hide ATC when everything it could add is known to be out of stock
      return (product.variants ?? [product]).some(v => v.in_stock !== false)
    }
  }
}
```

`product` is a [product](#product) after variant enrichment: on the mini-PDP, and on a product card with the in-card variant selector ([`enableProductCardVariantSelection`](../reference/widget-config.md#display-toggles)), it is the selected variant (a default variant until one is picked, the product itself when it has none), so it has no `variants`; otherwise it is the product with its `variants`. Stock-related variant fields are available when Bloomreach has registered your catalog's stock attributes (e.g. `in_stock`) on your agent; those attributes are excluded from the variant dimension selectors but remain on each variant object for use in this callback.

### `fn.showCheckoutButton`

Optional per-variant gate for the mini-PDP PayPal "Buy now" button. Only evaluated when [`ui.enableCheckOut`](../reference/widget-config.md#feature-flags) is `true`; it is called on every mini-PDP render, so it re-runs whenever the shopper selects a different variant. When it returns `false` the Buy now button is not rendered and the mini-PDP shows its regular "Add to cart" button instead (subject to `fn.addToCart` / `fn.showATCButton` as usual). When unset, the Buy now button is shown (same as returning `true`).

```js
window.CLARITY_CONFIG.ui = {
  enableCheckOut: true,
  fn: {
    showCheckoutButton(variant, config) {
      // e.g. only offer PayPal checkout for variants that are in stock
      return variant.in_stock === true
    }
  }
}
```

- **`variant`** — the variant currently selected in the mini-PDP (the product itself when it has no variants). It carries the same fields as `addToCart`'s `product`.
- **`config.source`** — where the button is rendered. Same values as [`addToCart`](#fnaddtocart)'s `source`; currently always `'mini_pdp'`, since the Buy now button only exists in the mini-PDP.
- **`config.parentProduct`** — the top-level product owning `variant`; equals `variant` when there is no separate variant. Merchant attributes that are not on the variant live here.

Unlike `addToCart`, which gets copies once per click, this callback runs on every render and receives the widget's own `variant` and `parentProduct` objects (as `showATCButton` does). Treat them as read-only — mutating them changes what the mini-PDP and carousel render.

### `fn.goToProductPage`

Called instead of navigating to the product URL when a shopper clicks into a product — a product card's "View details" link, the product-card menu's "Go to product page" item, the mini-PDP's own go-to-PDP button, or a product card itself when [`ui.enableMiniPDP`](../reference/widget-config.md#feature-flags) is off. It is not called for an item without a `url`. The widget still performs its own logging (the `urlClick` hook, a chat event rendered as a "Now viewing product {product_title}" banner, and the click-out event) — this override only replaces the navigation itself.

```js
window.CLARITY_CONFIG.ui = {
  fn: {
    goToProductPage(variant, config) {
      // e.g. route client-side instead of a full page navigation
      router.push(config.parentProduct.url)
    }
  }
}
```

- **`variant`** — the clicked item (a product, or a selected variant when clicked from a variant context).
- **`config.source`** — the link type the click came from (same values as `urlClick`'s `link_type`, e.g. `'product_card'`, `'mini_pdp_product'`).
- **`config.parentProduct`** — the top-level product owning the clicked variant; equals `variant` when there is no separate variant page.

The banner text is customizable via [`ui.stateText.userActionProductClick`](../reference/widget-config.md#uistatetext) (defaults to `'Now viewing product {product_title}'`).

To get the same product questions when a shopper lands on a PDP without clicking in the widget, enable [`ui.showPDPEnterQuestions`](../reference/widget-config.md#feature-flags).

### `fn.getLinkOptions`

Called right before a link in a response opens, to decide per link whether it opens in a new tab. Covers text links in assistant messages, a product card's "View details" link, the product-card menu's "Go to product page" item, the mini-PDP's go-to-PDP button, and AI Mode's quick-view button. It has higher priority than [`ui.openPdpInNewTab`](../reference/widget-config.md#feature-flags): a returned `newTab` wins, while returning nothing (or an object without `newTab`) keeps the configured behavior.

```js
window.CLARITY_CONFIG.ui = {
  fn: {
    getLinkOptions(url, config) {
      // e.g. keep the shopper on the site for own pages, open anything else in a new tab
      return { newTab: new URL(url, location.href).origin !== location.origin }
    }
  }
}
```

- **`url`** — the link as it appears in the response, before `productLinkQueryParams` is appended.
- **`config.source`** — the link type (same values as `urlClick`'s `link_type`: `'text_url'`, `'product_card'`, `'product_card_menu'`, `'mini_pdp_product'`).
- **`config.product`** / **`config.parentProduct`** — for product links, the clicked item and the top-level product owning it (as in `goToProductPage`); unset for text links. Copies, so they can be modified freely.

It must return synchronously, since a tab opened after waiting may be blocked as a popup: a returned Promise (e.g. from an `async` function) is ignored with a console warning and `openPdpInNewTab` applies. If it throws, the error is logged to the console and `openPdpInNewTab` applies too. It is not called when `fn.goToProductPage` is set in the default widget (that callback owns product navigation; AI Mode does not use `goToProductPage`), for `.pdf` text links in the default widget (opened in the in-chat PDF viewer; AI Mode has no PDF viewer, so there they do go through it), for the header's links, or for the buttons and carousel links in an external agent's attachments, which always open in a new tab. Text links in an external agent's message go through it like any other text link.

### `fn.seeAllResults`

When set, the widget renders a centered **"See all results"** button below **every** product carousel in the chat. Clicking a carousel's button invokes `seeAllResults(data)` with that carousel's own context. The button is hidden while the user is in the compare / multi-select flow, hidden when the carousel has fewer items than [`ui.hideViewMoreIfLessThan`](../reference/widget-config.md#feature-flags) (when set), and is not rendered at all when `fn.seeAllResults` is unset.

```js
window.CLARITY_CONFIG.ui = {
  fn: {
    seeAllResults(data) {
      const q = data.categoryName || data.rephrasedQuery || data.userMessage || ''
      window.location.href = '/search?q=' + encodeURIComponent(q)
    }
  }
}
```

`data` is an object with the following fields (all optional):

| Field | Description |
|-------|-------------|
| `userMessage` | The most recent user message (typed text or button label) that came **before** this carousel in the chat. Useful when you want to send the host site exactly what the shopper asked. |
| `categoryName` | The category label associated with the clicked carousel, when the assistant grouped products under one. |
| `rephrasedQuery` | The rephrased / canonical search query that the assistant used to produce this carousel's products. |
| `queries` | The list of search queries the assistant ran (across its internal search tools) to produce this carousel. Use this when you want to forward the full set of queries instead of a single string. |

The button's label is localized via the `seeAllResults` translation key returned by the `general-settings` API; the host site can override it through `ui.translation.seeAllResults` in `window.CLARITY_CONFIG`.

### `fn.getProductPrices`

Called wherever the widget is about to render a price, to let the host site supply prices it computes itself (member pricing, locale/tax rules, a promo engine). It receives the product being rendered and returns an object whose fields are **all optional** — each field it returns wins over the value in the Clarity response, and each field it leaves out (or returns as `null`/`undefined`) falls back to that response value.

```js
window.CLARITY_CONFIG.ui = {
  fn: {
    getProductPrices(product) {
      const custom = myPricingEngine.lookup(product.id)
      if (!custom) return {}                    // keep every price from the response
      return { price: custom.memberPrice }      // override the price, keep originalPrice + currency
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `price` | The current price. |
| `originalPrice` | The pre-discount price, struck through when it is higher than `price` and used for the [`showDiscountPercentage`](../reference/widget-config.md#feature-flags) badge. |
| `currency` | ISO 4217 code or symbol; falls back to the response's currency, then [`defaultCurrency`](../reference/widget-config.md). |
| any [`priceAttributesToUse`](../reference/widget-config.md#getcontext-contextfields) `attributeName`, e.g. `price_member` | A context-aware price; same fallback rules. Ignored for an attribute the page does not currently list. See [Context-Aware Pricing](./06-context-aware-pricing.md#uifngetproductprices). |

Notes:

- **A field you omit, or return as `null`/`undefined`, keeps the backend value** — so `return { price: lookup?.memberPrice }` is safe when the lookup misses, and `{}` leaves every price untouched. To deliberately show no price, return `''` for it.
- **Called for variants too**, not just top-level products — on a product card's selected variant, on every variant when [`ui.supportPriceRange`](../reference/widget-config.md#feature-flags) is on (unless the card shows a variant selector, which prices only the selected variant), and on the mini-PDP's active variant. Check `product.id` to price a variant differently.
- **May be synchronous or `async`.** A returned object is applied immediately; a returned Promise shows no price for that product until it settles (a `supportPriceRange` range waits for every variant). A settled result is cached per product for the page's life, so an `async` callback (and any request it makes) runs once per product. A sync result is not cached — the callback runs on every render, so keep it cheap and pure.
- If the callback throws, rejects, or returns something that isn't an object, the widget shows the response's prices and logs a single `console.warn`. Returning `null`/`undefined` keeps the response's prices without a warning, like `{}`.
- **Display only.** Analytics events, the add-to-cart payload and the context sent to the assistant all still carry the price from the Clarity response, so the assistant's own text may quote that price.
- Values are formatted by the widget as usual (currency symbol, [`ui.priceDecimalPlaces`](../reference/widget-config.md#feature-flags), price ranges). A string like `'$12.00'` is accepted, same as in the response.
- Not applied inside a custom `ProductCard` / `MiniPDP` [component override](#component-overrides) — those render their own prices and receive the raw product.

### `fn.getProductImageUrl`

Lets the host site supply product and variant image URLs, e.g. from its own image service. Called for a product card's main image, the mini-PDP's main image and variant swatches, and AI Mode's product grid and quick view. The color swatches of a product card's variant selector keep the response's `swatch_image` / `image`.

```js
window.CLARITY_CONFIG.ui = {
  fn: {
    getProductImageUrl(variantId, mainProductId) {
      return `https://images.example.com/${mainProductId}/${variantId}.jpg`
    }
  }
}
```

- **`variantId`** — the id of the item whose image is shown: the selected variant on a product card with the variant selector ([`enableProductCardVariantSelection`](../reference/widget-config.md#display-toggles)) and in the mini-PDP, each variant in the mini-PDP's swatches, otherwise the product itself. AI Mode always passes the product's id.
- **`mainProductId`** — the id of the top-level product; equals `variantId` when the image is the product's own.

The returned URL is tried first; if it fails to load, the image from the Clarity response is shown instead. Return `undefined` or `null` to keep the response's image. It must return synchronously and runs on every render, so keep it cheap. Not applied inside a custom [component override](#component-overrides), which receives the raw product.

### `fn.hideSearchResultCarousels`

Decides whether plain search results (`result_source: 'SEARCH'`) go to your page instead of the chat. While it returns `true`, the widget does not render their carousel or its Compare button, does not count them towards the unread badge on the collapsed widget, and hands them to your page through [`searchedProducts`](../reference/hooks.md#searchedproducts), both live and when replaying chat history. While it returns `false`, they render in the chat like any other carousel and are not sent to the page. Unset, it behaves as `true` under [`desktopTemplate: 'ai_mode'`](../reference/widget-config.md#desktop-ai-mode-side-panel) and as `false` otherwise.

A product detail page usually has no results grid, so a storefront with its own grid typically keeps search results in the chat on its product detail pages:

```js
window.CLARITY_CONFIG.ui = {
  fn: {
    hideSearchResultCarousels() {
      return document.body.dataset.pageType !== 'pdp'
    }
  }
}
```

- Throwing, or returning anything but a boolean, counts as unset; a throw is logged to the console. It must be synchronous: a returned Promise counts as unset too.
- Similar-products batches (`SIMILAR_PRODUCTS`, `SEARCH_AND_SIMILAR_PRODUCTS`) stay in the chat whatever it returns, and it is not called for them.
- **Called once per search result batch**, when the batch first shows up, and the answer sticks for that batch until the page reloads: navigating a single-page app or switching to another trigger's configuration (`source`) afterwards does not move it between the chat and the page.

See [Side panel](./05-side-panel.md#14-hand-search-results-to-the-page) for the full hand-over.

---

## Types

The types the component props and function overrides refer to. They are plain objects; no import is needed.

### Product

Every product the widget hands to your code — `product` and `selectedVariant` in the component props, `products` in the carousel slot, the argument of `fn.addToCart`, `fn.getProductPrices` and `fn.goToProductPage` — has this shape:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Product id (a variant id on a variant) |
| `url` | `string \| null` | Product page URL |
| `title` | `string \| null` | |
| `image` | `string \| null` | Main image URL |
| `price` | `number \| string \| null` | Current price; a formatted string is possible |
| `originalPrice` | `number \| string \| null` | Pre-discount price |
| `contextAwarePrices` | `Record<string, number \| string \| null> \| null` | One price per attribute the page listed in `priceAttributesToUse`; empty unless [context-aware pricing](./06-context-aware-pricing.md) is on |
| `currency` | `string \| null` | ISO 4217 code or symbol |
| `description` | `string \| null` | |
| `variantAttributeList` | `string[] \| null` | Names of the attributes that distinguish the variants (size, color, …) |
| `variants` | `Product[] \| null` | The product's variants. In the default widget, the first entry is the product's own entry, with the product's `id`; each is a product without `variants` and `extraVariantFields`, with its own attribute values flattened onto the root |
| `extraVariantFields` | `Record<string, unknown> \| null` | Additional variant-level fields |
| `questions` | `{ question: string; answer: string \| null; identifier: string \| null }[] \| null` | Product questions the assistant can answer |
| `review` | `{ count: number \| null; averageRating: number \| null } \| null` | Review summary |

The object is open: product attributes that Bloomreach has configured on your agent (the attributes shown as tags on the built-in card, the stock attributes, the attribute logged as category) are present as additional root fields under their catalog names on the product. Variants carry the mini-PDP and stock attributes; read the card tags and the attribute logged as category from the top-level product.

### MountFnResult

What a component mount function may return:

```ts
type MountFnResult<Props> = {
  update?: (props: Props) => void   // called when props change without unmounting
  cleanup?: () => void              // called when the component is removed
  config?: {
    // true (default): update is called for every change. false: not for a change caused by any
    // callback this component itself fired, for every prop that change touched
    updateForComponentAction?: boolean
  }
} | void
```

A lazily mounted override must return `update`, see [Lazy mounting](#lazy-mounting).

### AddToCartCallbackConfig

The optional argument of the `onAddToCart` prop:

```ts
type AddToCartCallbackConfig = {
  // true: only log the addToCart event, do not invoke fn.addToCart
  skipAddToCartFn?: boolean
}
```

### Position

Where the built-in product action menu opened by `onEllipsisClick` appears, relative to the anchor element. `top-*` places the menu above the anchor, `bottom-*` below it, with an 8 px gap; the menu slides in from that side.

| Value | Horizontal placement |
|---|---|
| `'top-left'` (default without `ui.useAddToCart`), `'bottom-left'` | The menu's right edge is aligned with the anchor's right edge, so the menu extends to the left |
| `'top-right'` (default with `ui.useAddToCart`), `'bottom-right'` | The menu's left edge is aligned with the anchor's left edge, so the menu extends to the right |
| `'top-center'`, `'bottom-center'` | Centered on the anchor |
| `'top-left-quarter'`, `'bottom-left-quarter'` | Centered, then shifted left by a quarter of the menu width |
| `'top-right-quarter'`, `'bottom-right-quarter'` | Centered, then shifted right by a quarter of the menu width |

### LazyMountConfig

Set per component under `ui.component.config`, see [Lazy mounting](#lazy-mounting):

```ts
type LazyMountConfig = {
  lazy?: boolean       // default false
  rootMargin?: string  // how far outside the viewport the item flips to visited; default '100px'
  settleMs?: number    // how long it must stay in view before it flips; default 500
}
```

---

[← Chapter 2 — Style the widget](02-style-the-widget.md) · [Chapter 4 — Track events →](04-track-events.md)
