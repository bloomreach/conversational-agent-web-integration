# Custom components

A product card and a mini-PDP of your own replacing the built-in ones; see
[Customize components](../../guides/03-customize-components.md#component-overrides) for the slots and their props.

A demonstration of the calls, to adapt to your site rather than copy as it is; see [Examples](../README.md).

| Folder | Whose | What is in it |
|---|---|---|
| [`plain-js/`](./plain-js) | You | `components.js`: both components, written as mount functions |
| [`react/`](./react) | You | `ProductCard.jsx`, `MiniPDP.jsx`, and `mount.jsx` wrapping them in mount functions (React 18 or later) |
| [`vue/`](./vue) | You | `ProductCard.vue`, `MiniPDP.vue`, and `mount.js` wrapping them in mount functions (Vue 3.3 or later) |
| [`angular/`](./angular) | You | `product-card.component.ts`, `mini-pdp.component.ts`, and `clarity-components.service.ts` wrapping them in mount functions (Angular 16 or later) |
| [`configuration/`](./configuration) | Bloomreach, for reference only | `custom-components.js`: `ui.enableMiniPDP`. It does not set `ui.component`, so the widget uses the components your page registers |

> **`configuration/` is not for you to implement.** Bloomreach sets it up in your Engagement project, in a tag or in the weblayer. It is here only to show which settings your code works with; you can skip it.

Take one framework folder. Each of them adds its
[mount functions](../../guides/03-customize-components.md#component-overrides) to
`window.CLARITY_CONFIG.ui.component`, which the widget reads whenever it shows a card or the mini-PDP, also on a
weblayer page. Until your file has run, the widget shows its built-in components.

When your components show:

- **`ProductCard`** replaces every card of the product carousels.
- **`MiniPDP`** shows only when the mini-PDP is turned on, with [`ui.enableMiniPDP`](../../reference/widget-config.md#feature-flags). Without it a click on a card goes to the product page and your component is never mounted.
- Their "Add to cart" buttons do something only when [`fn.addToCart`](../add-to-cart/README.md) is set: `onAddToCart` goes through it.

What the components do with the props:

- **Card:** a click calls `onProductClick`, which opens the mini-PDP, or toggles the selection while the shopper
  compares products. "Add to cart" calls `onAddToCart`. The card renders `isSelected` / `isDisabled` in `update`.
  It has no variant picker, since its `update` is not called when the selected variant changes.
- **Mini-PDP:** shows the selected variant, picks another one through `onVariantSelect`, and shows what
  `onAddToCart` returned: "Added" or "Failed". Its `update` is called when the product or the selected variant
  changes.

The class names (`my-card`, `my-pdp`, …) and their styles are yours.
