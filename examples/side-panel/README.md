# Side Panel

The chat docked as a desktop side panel; see [Side Panel (Desktop AI Mode)](../../guides/05-side-panel.md).

A demonstration of the calls, to adapt to your site rather than copy as it is; see [Examples](../README.md).

Bloomreach turns the panel on in the weblayer. This example covers two things your page does:

1. **Product clicks.** `ui.fn.goToProductPage` hands the click to your router, so the shopper stays in the
   single-page app with the panel open.
2. **Search results.** `ui.fn.hideSearchResultCarousels` decides where they go; when it is the page, the widget
   dispatches `Clarity:searchedProducts` and your page renders the products on its own grid.

Where search results go when `hideSearchResultCarousels` is not set depends on how the widget is mounted:

| Mounted as | Unset, search results go | So the configuration sets it |
|---|---|---|
| The built-in side panel (`desktopTemplate: 'ai_mode'`) | to your page | only to keep them in the chat on some pages: `side-panel.js` returns `false` on product pages |
| Your own container (`PARAM_clarityParentElement`), like the floating widget | into the chat | to send them to your page at all: `own-container.js` returns `true` everywhere but on product pages |

| Folder | Whose | What is in it |
|---|---|---|
| [`plain-js/`](./plain-js) | You, without a framework | `search-results.js`: the same search results on a storefront where every navigation is a page load ([4.3](../../guides/05-side-panel.md#43-search-results-across-a-page-load)). `own-container.html`: the mount element and the opening and closing of a panel in your own container ([Part 5](../../guides/05-side-panel.md#part-5--alternative-mount-into-your-own-container)) |
| [`react/`](./react) | You, on a single-page app | Written for Next.js (app router); a React app without Next.js uses its own router in the same places. `ClarityBridge.jsx`: provides `window.__clarityRouter` and listens for `Clarity:searchedProducts`. `SearchResults.jsx`: renders those products on your results route |
| [`configuration/`](./configuration) | Bloomreach, for reference only | `side-panel.js`: the side panel with `goToProductPage` and `hideSearchResultCarousels`, for `react/`; on a storefront without a client-side router it is the same without `goToProductPage`. `own-container.js`: mounts the widget into an element of your page in place of the built-in panel, for `plain-js/own-container.html`, and sets `hideSearchResultCarousels`, which that mode needs |

> **`configuration/` is not for you to implement.** Bloomreach sets it up in your Engagement project, in a tag or in the weblayer. It is here only to show which settings your code works with; you can skip it.

The rest of your page's part is in the guide: the [layout checklist](../../guides/05-side-panel.md#21-page-layout-checklist-required) and, on a
single-page app, the [live page context](../../guides/05-side-panel.md#24-expose-live-page-context).
