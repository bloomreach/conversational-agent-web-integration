[← Back to Chapter 2 — Customize components](02-customize-components.md)

# 3. Side Panel (Desktop AI Mode)

Desktop AI Mode turns the Clarity chat widget into a resizable side panel on desktop. Instead of floating over the page, the widget becomes a column on the left or right edge of the viewport and the page's own content is pushed to the other side. Shoppers keep browsing while the conversation stays open next to them.

This guide is for the developer and the Engagement admin who integrate the widget on a storefront. It is split by who does what:

- **Part 1 — Weblayer settings** are set in the Engagement weblayer (`window.CLARITY_WEBLAYER_CONFIG`). No storefront deployment is needed for them.
- **Part 2 — Your web page code** lists what the storefront codebase itself has to provide.
- **Part 3 — Complete example** puts both sides together for a React (Next.js) storefront.
- **Part 4 — Alternative** covers mounting into a container of your own instead, for layouts the built-in side panel cannot produce.

This feature is for desktop. The widget injects everything it needs into the page: no host markup, container element or CSS is required for the panel itself.

> **Not the same as the "AI Mode" widget template.** `widget.ui.desktopTemplate: 'ai_mode'` (this guide) is a layout for the default widget. `widgetTemplate: 'ai_mode'` selects a different widget bundle (the full-screen conversational search). Leave `widgetTemplate` unset when following this guide.

**Prerequisites**

- The default Clarity widget is already delivered to the page through an Engagement weblayer.
- One widget template per page. All triggers on a page share the same widget, so keep `widgetTemplate` unset on every trigger of the page.

## Who does what

| Feature | Weblayer setting | Page code |
|---|---|---|
| Side panel layout | [`widget.ui.desktopTemplate`](#11-turn-on-the-side-panel), [`widget.ui.desktopTemplateOptions`](#12-panel-options) | [Layout checklist](#21-page-layout-checklist-required) |
| Open / close button on a listing page (optional) | [`plp_banner` trigger + `PARAM_isToggleButton`](#13-plp-banner-as-the-openclose-button-optional) | Optional: [control from page code](#22-open-close-and-observe-the-panel-from-page-code-optional) |
| Product clicks routed through your SPA router | [`widget.ui.fn.goToProductPage`](#14-route-product-clicks-through-your-router) | [Router bridge](#25-expose-your-spa-router) |
| Search results shown on your own product grid | [`widget.ui.fn.hideSearchResultCarousels`](#15-hand-search-results-to-the-page) | [Results listener](#23-render-widget-search-results-on-your-own-grid) |
| Page context (current product, category) | [`productIds`, `pageType` or `getContext`](#16-page-context) | [Live page data](#24-expose-live-page-context) for single-page apps |
| PDP awareness (product questions, context banner) | [`showPDPEnterQuestions`, `showContextStateChange`](#17-pdp-awareness-flags) | Same as page context |

---

## Part 1 — Weblayer settings

Everything in this part goes into `window.CLARITY_WEBLAYER_CONFIG`. Keys under `widget.ui` are passed to the widget as its `ui` config; see [`weblayer-config.md`](../reference/weblayer-config.md#widget--clarity-widget-settings) for the full list of `widget` fields and [`widget-config.md`](../reference/widget-config.md) for every `ui` field.

### 1.1 Turn on the side panel

```javascript
widget: {
  ui: {
    desktopTemplate: 'ai_mode',
  },
}
```

Set `desktopTemplate` directly under `widget.ui`. It is not read from `widget.ui.desktop`.

With this set, the widget mounts as a column next to the page content. Everything already in `<body>` — including your site header and footer — moves into the other column. If they need to stay outside the split, mount into a container of your own instead: see [Part 4](#part-4--alternative-mount-into-your-own-container).

The panel starts collapsed (width 0) and slides open when the chat opens; it collapses again when the chat is closed, minimized or hidden. While open, a thin handle on the panel's inner edge lets the shopper drag it wider or narrower.

### 1.2 Panel options

All options are optional. The values below are the defaults, so this block only needs the keys you change.

```javascript
widget: {
  ui: {
    desktopTemplate: 'ai_mode',
    desktopTemplateOptions: {
      chatContainerPosition: 'right', // default
      width: '470px',                 // default
      minWidth: '360px',              // default
      maxWidth: '80vw',               // default
    },
  },
}
```

| Option | Default | Description |
|---|---|---|
| `chatContainerPosition` | `'right'` | `'left'` or `'right'`: the edge the panel occupies. The page content is pushed to the other side. |
| `width` | `'470px'` | Panel width while open. Any CSS width value. |
| `minWidth` | `'360px'` | Lower limit, also the lower clamp while the shopper drags the handle. |
| `maxWidth` | `'80vw'` | Upper limit, also the upper clamp while dragging. Use `px` or `vw`, not `%`: a percentage would resolve against the panel's own box. |

A width the shopper set by dragging is kept only while the panel is open. When the chat closes, the panel returns to `width` on its next open.

### 1.3 PLP banner as the open/close button (optional)

On a product listing page, the `plp_banner` trigger can act as a toggle for the panel: one click opens the chat, the next click closes it.

```javascript
triggerTemplate: 'plp_banner',
trigger: {
  PARAM_isToggleButton: true,
},
```

With `PARAM_isToggleButton: true`, a click while the widget is visible hides it (the panel collapses) and logs a `badge_hidden` event; a click while it is hidden shows and opens it, sending the banner's text as the opening message. Without the flag, every click opens the chat.

Configure the banner's placement, texts and image as for any PLP banner; see [`trigger` — PLP Banner](../reference/weblayer-config.md#plp-banner-only). If you want your own button instead of the banner, drive the panel from page code as described in [2.2](#22-open-close-and-observe-the-panel-from-page-code-optional).

### 1.4 Route product clicks through your router

When a shopper clicks a product in the chat, the widget navigates to the product URL, which reloads the page. On a single-page app you can keep the panel open by taking over the navigation:

```javascript
widget: {
  ui: {
    fn: {
      goToProductPage: (variant, config) => {
        const path = new URL(config.parentProduct.url).pathname
        window.__clarityRouter?.push(path)
      },
    },
  },
}
```

`variant` is the clicked item, `config.parentProduct` is the product that owns it (the same object when there is no separate variant), and `config.source` is where the click came from (`'product_card'`, `'mini_pdp_product'`, …). Analytics events and the "Now viewing product …" banner are still produced by the widget; only the navigation is yours. `window.__clarityRouter` is provided by the page, see [2.5](#25-expose-your-spa-router).

Links inside assistant text messages do not go through `goToProductPage`; they open as normal links. See [`ui.pdpLinkRegex`](../reference/widget-config.md#feature-flags), [`ui.openPdpInNewTab`](../reference/widget-config.md#feature-flags) and [`ui.fn.getLinkOptions`](./02-customize-components.md#fngetlinkoptions) for how those links are handled.

### 1.5 Hand search results to the page

On a storefront with its own product grid, the page renders the search results instead of the chat. This is the default once `desktopTemplate: 'ai_mode'` is set. For every result batch that came from a plain search (`result_source: 'SEARCH'`) the widget then:

- does not render the carousel or its "Compare" button in the chat,
- fires the `searchedProducts` hook and dispatches a `Clarity:searchedProducts` event on `window` carrying the products.

Your page has to listen for that event and show the products; see [2.3](#23-render-widget-search-results-on-your-own-grid). Other product batches (`SIMILAR_PRODUCTS`, `SEARCH_AND_SIMILAR_PRODUCTS`, the initial message's products) are unaffected and stay in the chat.

A product detail page usually has no results grid. To keep search results in the chat there, decide per page:

```javascript
widget: {
  ui: {
    fn: {
      hideSearchResultCarousels: () => document.body.dataset.pageType !== 'pdp',
    },
  },
}
```

While it returns `false`, search results render in the chat like any other carousel and are not sent to the page. While it returns `true`, or when it is not set, throws or returns anything but a boolean, they are handed to the page as described above. To keep every carousel inside the side panel, return `false` everywhere. See [`fn.hideSearchResultCarousels`](./02-customize-components.md#fnhidesearchresultcarousels).

If you prefer a callback over a DOM event, register the hook in the weblayer instead:

```javascript
widget: {
  hooks: {
    version: 'WBL_BUNDLE',
    searchedProducts: (a) => {
      // a.products_data, a.from_history — same payload as the window event's detail
    },
  },
}
```

### 1.6 Page context

The widget asks the page for its context (current product, cart, category) through two functions, `getContext()` and `getCategoryInfo()`. The weblayer builds them for you from flat fields:

```javascript
productIds: ['SKU-1305'],
productIdsType: 'item_id',
widget: {
  pageType: 'pdp',
  // optional
  pdpUrl: window.location.href,
  plpCategoryName: 'Running shoes',
  plpCategoryDescription: 'Lightweight shoes for road running',
  urlQueryParams: window.location.search,
},
```

| Field | Feeds | Notes |
|---|---|---|
| `productIds` + `productIdsType` | `getContext().currentItemId` / `currentItemIds` | With `pageType: 'pdp'` (or a single id), the id becomes `currentItemId`, which the PDP flags in 1.7 rely on. |
| `widget.pageType` | `getContext()` | `'pdp'`, `'plp'` or `'cart'`. |
| `widget.pdpUrl` | `getContext().pdpUrl` | Optional. The current product page URL. |
| `widget.plpCategoryName`, `plpCategoryDescription`, `urlQueryParams` | `getCategoryInfo()` | Optional. The listing page's category, used to answer category questions. |

These flat fields are read once, when the weblayer runs. On a site where every navigation is a full page load, that is enough: the weblayer runs again on the new page. On a single-page app the panel stays open while the shopper navigates, so the values would go stale. In that case pass functions that read live page data instead:

```javascript
widget: {
  getContext: () => ({
    currentItemId: window.clarityPage?.currentProductId,
    currentItemIdsType: 'item_id',
    pdpUrl: window.location.href,
  }),
  // optional
  getCategoryInfo: () => ({
    plpCategoryName: window.clarityPage?.currentCategoryName,
  }),
},
```

`getContext` and `getCategoryInfo` are top-level `widget` fields, not `widget.ui.fn` entries. The page side of this is described in [2.4](#24-expose-live-page-context).

### 1.7 PDP awareness flags

With the panel open next to the page, the shopper moves between product pages while the chat stays visible. Two flags make the widget react to that.

```javascript
widget: {
  ui: {
    showPDPEnterQuestions: true,
    showContextStateChange: true,
    // optional
    stateText: {
      userActionProductClick: 'Now viewing product {product_title}', // default
    },
  },
}
```

**`showPDPEnterQuestions`** — when the widget initializes on a page, whenever the chat is opened, and on every SPA route change (`history.pushState` / `replaceState` / `popstate`), it compares `getContext().currentItemId` with the last product it told the backend about. If the product changed, it sends the new context followed by a product-view event, and the backend answers with that product's questions as quick replies under a "Now viewing product …" banner. This works for shoppers who already have a conversation: viewing a page never starts a new chat, so a shopper who has not sent a message yet sees nothing from this flag. The check is skipped when the chat is opened by a trigger that sends a message at the same time (such as the PLP banner in 1.3), because that message already carries the new context. After a route change the widget waits up to 3 seconds for `getContext().currentItemId` to change, so a `getContext` that reads the product off the DOM has time to see the new page. Only one announce runs at a time; a second trigger arriving while one is in flight is ignored.

**`showContextStateChange`** — shows a "Page context updated" banner in the chat each time the context sent to the backend has a different product than the previous one. The first context of a conversation never shows the banner. The text is the translation key `pageContextUpdated`; override it through [`widget.ui.translation`](../reference/widget-config.md#uitranslation).

**`stateText.userActionProductClick`** — optional. The banner text for product views and in-widget product clicks. `{product_title}` is replaced with the product's title.

Both flags depend on `getContext()` returning the current product. On a single-page app that means the live-data function from 1.6 and the page work in [2.4](#24-expose-live-page-context).

---

## Part 2 — Your web page code

### 2.1 Page layout checklist (required)

When the side panel is on, the widget restructures the page on load:

```
body
└── #cocoaas-desktop-ai-mode-host              flex row, height: 100dvh
    ├── #cocoaas-desktop-ai-mode-widget-wrapper   the panel column (resize handle + widget)
    │     └── #cocoaas-desktop-ai-mode-widget-mount
    └── #cocoaas-desktop-ai-mode-page-content     everything that was in <body>, moved here
                                                  flex: 1; overflow-y: auto
```

All of `<body>`'s existing children are moved into `#cocoaas-desktop-ai-mode-page-content`, which scrolls on its own. `<body>` and `window` no longer scroll. Check the following in your page before enabling the panel:

- **Scroll handling.** Code that reads or listens to `window` / `document` scroll (`window.scrollY`, `scroll` listeners on `window`, `window.scrollTo`, "back to top" buttons, infinite-scroll triggers) has to target `#cocoaas-desktop-ai-mode-page-content` instead. Elements with `position: sticky` still work because they stick inside the scrolling container.
- **`position: fixed` elements.** They stay relative to the viewport, so a fixed header or cookie bar will overlap the panel column. Either constrain them to the page-content box or accept the overlap.
- **Selectors and scripts that assume `<body>` children.** `body > .app`, `document.body.firstElementChild`, scripts that walk up to `<body>`, or code that assumes the framework's root element is a direct child of `<body>` need review. Elements that scripts append to `<body>` after load (modals, chat overlays, cookie banners) land outside the host; they are fine when they use `position: fixed`, and otherwise end up below the full-height host, out of view.
- **Full-height layouts.** A root element styled `min-height: 100vh` now lives inside a scrolling box and behaves as expected. `height: 100vh` on the root is also fine, but content taller than the viewport scrolls inside the page-content box, not the window.

The panel column carries these classes, in case you want to style around it:

| Selector | When |
|---|---|
| `#cocoaas-desktop-ai-mode-widget-mount.cocoaas-desktop-ai-mode-open` | While the chat is open. |
| `#cocoaas-desktop-ai-mode-widget-mount.cocoaas-desktop-ai-mode-dragging` | While the shopper drags the resize handle. |
| `#cocoaas-desktop-ai-mode-widget-wrapper.cocoaas-desktop-ai-mode-side-left` / `-side-right` | Which edge of the panel faces the page content (border side). |

The full tree is in [`styles.md`](../reference/styles.md#desktop-ai-mode-side-panel-cocoaas-desktop-ai-mode-).

### 2.2 Open, close and observe the panel from page code (optional)

The panel follows the widget's state: it opens when the chat is opened and collapses when the chat is closed, minimized or hidden. Any button on your page can drive it through the Clarity API, as an alternative to the PLP banner in [1.3](#13-plp-banner-as-the-openclose-button-optional):

```javascript
await window.CLARITY?.call('open_chat')          // open the chat, panel slides open
await window.CLARITY?.call('close_chat')         // minimize, panel collapses
await window.CLARITY?.call('hide_badge', { log: true })  // hide entirely, panel collapses
```

To react to the panel opening or closing, listen for the state event:

```javascript
window.addEventListener('ClarityState:widgetState', (event) => {
  const state = event.detail?.state  // 'hidden' | 'minimized' | 'opened' | 'maximized'
  const panelOpen = state === 'opened' || state === 'maximized'
})
```

See [`runtime-api.md`](../reference/runtime-api.md) for all actions.

### 2.3 Render widget search results on your own grid

Needed when search results are [handed to the page](#15-hand-search-results-to-the-page) (the default under `desktopTemplate: 'ai_mode'`). Listen for the `Clarity:searchedProducts` event, keep the products, and show them on your results page.

```javascript
window.addEventListener('Clarity:searchedProducts', (event) => {
  const detail = event.detail
  if (!detail || detail.from_history) return

  const products = (detail.products_data ?? [])
    .filter((batch) => batch.result_source === 'SEARCH')
    .flatMap((batch) => batch.data ?? [])
  if (!products.length) return

  window.clarityPage.clarityResults = products
  window.__clarityRouter?.push('/search?fromClarity=1')
})
```

Event payload (`event.detail`):

| Field | Description |
|---|---|
| `products_data` | Array of batches: `{ rephrased_query?, result_source?, data: [...] }`. Only batches with a `result_source` were suppressed in the chat. |
| `products_data[].data[]` | The products. Each has `id`, `title`, `url`, `image`, `price`, `originalPrice`, `variants` and the merchant attributes configured for the persona. |
| `from_history` | `true` when the widget is replaying an existing conversation on page load. Skip those so a reload does not navigate the shopper away. |

Notes for the product mapping:

- `price` is the current price. `originalPrice`, when present, is the pre-discount price to show crossed out.
- `url` is the product's public URL. Its id segment can be a group and variant joined by `___` (for example `/products/1305___1305`); take the part before `___` if your routes use the group id.
- Clear your stored results when the shopper starts a new search on your own search box and when the results page unmounts. Otherwise a back navigation to the results route shows the previous answer's products, and a hard refresh lands on an empty store.

### 2.4 Expose live page context

Needed for the [page context](#16-page-context) functions and the [PDP awareness flags](#17-pdp-awareness-flags) on a single-page app. The widget only ever calls `getContext()` and `getCategoryInfo()`; it does not watch the URL or the router. Your page has to keep the data those functions read up to date on every navigation.

A simple pattern is one global object that every page view writes to on mount:

```javascript
// product page
useEffect(() => {
  window.clarityPage = { ...window.clarityPage, currentProductId: product.id, currentCategoryName: undefined }
}, [product.id])

// category page
useEffect(() => {
  window.clarityPage = { ...window.clarityPage, currentProductId: undefined, currentCategoryName: category.name }
}, [category.name])
```

The weblayer's `getContext` / `getCategoryInfo` functions from 1.6 then read `window.clarityPage`. Clear `currentProductId` when leaving a product page, otherwise the widget keeps treating the last product as the current one.

The widget reads the context when it initializes, when the chat is opened, before every message the shopper sends, and — with `showPDPEnterQuestions` on — after every SPA route change. It detects route changes by wrapping `history.pushState` / `replaceState` and listening for `popstate`, so any router that goes through the History API is covered without you wiring anything up. It then waits up to 3 seconds for `getContext().currentItemId` to report the new product, which is enough for a store that updates the global in a mount effect. A `getContext` that needs longer than that (for example one waiting on its own fetch) will miss the announce for that navigation.

### 2.5 Expose your SPA router

Needed when [`goToProductPage`](#14-route-product-clicks-through-your-router) is set. Publish a router object on `window` so the weblayer function can call it. For Next.js (app router):

```jsx
'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const ClarityRouterBridge = () => {
  const router = useRouter()
  useEffect(() => {
    window.__clarityRouter = router
    return () => {
      if (window.__clarityRouter === router) delete window.__clarityRouter
    }
  }, [router])
  return null
}
```

Render it once in the root layout. If your routes carry a prefix (a locale or channel segment), wrap `push` so it adds the prefix:

```javascript
window.__clarityRouter = {
  push: (path) => router.push(withChannelPrefix(path)),
  replace: (path) => router.replace(withChannelPrefix(path)),
}
```

The name `__clarityRouter` is a convention between your weblayer function and your page; the widget itself does not read it.

---

## Part 3 — Complete example

A Next.js (app router) storefront with product, category and search pages, wired to the widget with every setting from Part 1. Only the Clarity-related code is shown; the rest of each page is left out. The two halves talk to each other through three `window` globals:

| Global | Written by | Read by |
|---|---|---|
| `window.clarityPage` | the storefront pages (current product, category, listing ids, Clarity results) | the weblayer's `getContext` / `getCategoryInfo` |
| `window.__clarityRouter` | the storefront's `ClarityBridge` | the weblayer's `goToProductPage` |
| `Clarity:searchedProducts` (event) | the widget | the storefront's `ClarityBridge` |

### 3.1 Weblayer side

```javascript
window.CLARITY_WEBLAYER_CONFIG = {
  ...

  triggerTemplate: 'plp_banner',
  trigger: {
    ...
    PARAM_isToggleButton: true,
  },

  widget: {
    ...

    getContext: () => ({
      currentItemId: window.clarityPage?.currentProductId,
      currentItemIdsType: 'item_id',
      pdpUrl: window.location.href,
    }),
    getCategoryInfo: () => ({
      plpCategoryName: window.clarityPage?.currentCategoryName,
    }),

    ui: {
      desktopTemplate: 'ai_mode',
      desktopTemplateOptions: {
        chatContainerPosition: 'right',
        width: '470px',
      },
      showPDPEnterQuestions: true,
      showContextStateChange: true,
      fn: {
        goToProductPage: (variant, config) => {
          const path = new URL(config.parentProduct.url).pathname
          window.__clarityRouter?.push(path)
        },
        hideSearchResultCarousels: () => !window.clarityPage?.currentProductId,
      },
    },
  },
}
```

### 3.2 Storefront side

```
src/
├── lib/clarityPage.js              window.clarityPage helpers
├── app/layout.jsx                  renders ClarityBridge once
├── app/ClarityBridge.jsx           router bridge + search results listener
├── app/products/[id]/page.jsx      publishes the current product
├── app/categories/[id]/page.jsx    publishes the current category and listing ids
└── app/search/page.jsx             shows Clarity results when ?fromClarity=1
```

**`src/lib/clarityPage.js`** — one place that owns the global:

```javascript
const store = () => (window.clarityPage ??= {})

export const setPageContext = (patch) => {
  Object.assign(store(), patch)
}

export const setClarityResults = (products) => {
  store().clarityResults = products
}

export const getClarityResults = () => store().clarityResults ?? null

export const clearClarityResults = () => {
  store().clarityResults = null
}

// Widget product → this app's product card shape. `price` is the current price and
// `originalPrice` the pre-discount one; the url's id segment can be `group___variant`.
export const toStoreProduct = (item) => {
  const match = item.url?.match(/\/products\/([^/?#]+)/)
  const pid = match ? match[1].split('___')[0] : item.id
  return {
    pid,
    href: `/products/${pid}`,
    title: item.title,
    image: item.image,
    price: item.originalPrice ?? item.price,
    salePrice: item.originalPrice ? item.price : undefined,
  }
}
```

**`src/app/ClarityBridge.jsx`** — mounted once, exposes the router and receives search results:

```jsx
'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { setClarityResults } from '@/lib/clarityPage'

export const ClarityBridge = () => {
  const router = useRouter()

  useEffect(() => {
    window.__clarityRouter = router

    const onSearchedProducts = (event) => {
      const detail = event.detail
      if (!detail || detail.from_history) return
      const products = (detail.products_data ?? [])
        .filter((batch) => batch.result_source === 'SEARCH')
        .flatMap((batch) => batch.data ?? [])
      if (!products.length) return
      setClarityResults(products)
      router.push('/search?fromClarity=1')
    }
    window.addEventListener('Clarity:searchedProducts', onSearchedProducts)

    return () => {
      window.removeEventListener('Clarity:searchedProducts', onSearchedProducts)
      if (window.__clarityRouter === router) delete window.__clarityRouter
    }
  }, [router])

  return null
}
```

**`src/app/layout.jsx`**:

```jsx
import { ClarityBridge } from './ClarityBridge'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClarityBridge />
        {children}
      </body>
    </html>
  )
}
```

**`src/app/products/[id]/page.jsx`** — publishes the product the shopper is looking at:

```jsx
'use client'
import { useEffect } from 'react'
import { setPageContext } from '@/lib/clarityPage'

export default function ProductPage({ params }) {
  useEffect(() => {
    setPageContext({ currentProductId: params.id, currentCategoryName: undefined })
    return () => setPageContext({ currentProductId: undefined })
  }, [params.id])

  return <>{/* product detail */}</>
}
```

**`src/app/categories/[id]/page.jsx`** — publishes the category and the ids on the grid:

```jsx
'use client'
import { useEffect } from 'react'
import { setPageContext } from '@/lib/clarityPage'

export default function CategoryPage({ category, products }) {
  useEffect(() => {
    setPageContext({
      currentProductId: undefined,
      currentCategoryName: category.name,
      listingProductIds: products.map((p) => p.pid),
    })
  }, [category, products])

  return (
    <>
      <div id="listing-toolbar" />
      {/* product grid */}
    </>
  )
}
```

`#listing-toolbar` is the element the PLP banner's `PARAM_parentElement` points to.

**`src/app/search/page.jsx`** — the results route the bridge navigates to:

```jsx
'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { clearClarityResults, getClarityResults, toStoreProduct } from '@/lib/clarityPage'

export default function SearchPage() {
  const fromClarity = useSearchParams().get('fromClarity') === '1'
  const [products, setProducts] = useState([])

  useEffect(() => {
    if (!fromClarity) return
    setProducts((getClarityResults() ?? []).map(toStoreProduct))
    return () => clearClarityResults()
  }, [fromClarity])

  if (!fromClarity) return <>{/* regular search */}</>
  return <>{/* product grid rendering `products` */}</>
}
```

Clearing the results when the page unmounts keeps a later back navigation to `/search?fromClarity=1` from showing a stale answer.

---

## Part 4 — Alternative: mount into your own container

### 4.1 When to use it

`desktopTemplate: 'ai_mode'` moves **everything** in `<body>` into the left column of its own flex row. That is what makes it zero-markup, but it also means your site header, nav and footer end up inside that column and are as wide as it is. If the design calls for a full-width header sitting above the panel, a footer outside the split, or a panel confined to one region of the page, mount the widget into a container of your own instead.

### 4.2 What changes and what does not

Internally `desktopTemplate: 'ai_mode'` only makes the widget resolve `document.body` as its parent element, so handing it a container of your own produces the **same widget rendering**: square corners and no drop shadow, filling the container, desktop `ui` config at any viewport width, mini PDP and live chat rendered inside the panel rather than beside it, and the close button hidden unless [`ui.showCloseWhenInElement`](../reference/widget-config.md#feature-flags) is set.

Everything in Parts 1 to 3 still applies, except:

| Section | With your own container |
|---|---|
| [1.1](#11-turn-on-the-side-panel), [1.2](#12-panel-options) | Replaced by `widget.PARAM_clarityParentElement` (see [4.6](#46-weblayer-config)). `desktopTemplate` and `desktopTemplateOptions` are not set. |
| [2.1](#21-page-layout-checklist-required) | Does not apply. Nothing is reparented, `window` keeps scrolling, and `position: fixed` elements behave normally. |

What you take on: the flex layout, the open and close animation, and the drag handle. The rest of this part is a working implementation of all three.

### 4.3 Markup

Two nested elements. The outer one holds the resize handle, the inner one is what you hand to the widget — the widget fills it completely with its own markup, so anything you place inside it is painted over.

```html
<header id="site-header">…</header>

<div id="app-body">
  <main id="page-content">…</main>

  <aside id="clarity-panel">
    <div id="clarity-handle"></div>
    <div id="clarity-mount"></div>
  </aside>
</div>
```

### 4.4 CSS

```css
body       { display: flex; flex-direction: column; height: 100dvh; margin: 0 }
#site-header { flex-shrink: 0 }
#app-body  { display: flex; flex: 1; min-height: 0 }
#page-content { flex: 1; min-width: 0; overflow-y: auto }

#clarity-panel { position: relative; display: flex; flex-shrink: 0 }

#clarity-mount {
  width: 0;
  min-width: 0;
  overflow: hidden;
  /* seals the widget's own stacking context so its modals and dropdowns,
     which carry high z-indexes, cannot paint over the handle outside it */
  isolation: isolate;
  transition: width 0.5s ease;
}

#clarity-panel.clarity-panel-open #clarity-mount {
  width: var(--clarity-panel-width, 470px);
  min-width: 360px;
  max-width: 80vw;
  border-left: 1px solid rgba(0, 0, 0, 0.15);
}

/* while dragging, drop the transition so the panel tracks the pointer 1:1 */
#clarity-panel.clarity-panel-dragging #clarity-mount { transition: none }

#clarity-handle {
  position: absolute;
  left: -3px;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: ew-resize;
  touch-action: none;
  z-index: 2;
}
#clarity-panel:not(.clarity-panel-open) #clarity-handle { display: none }
```

`min-width` and `max-width` always win over an inline `width`, so they clamp the drag for free and the JavaScript below does no arithmetic of its own.

While the chat is minimized the widget still renders its own round badge into the container; a mount collapsed to `width: 0` with `overflow: hidden` clips it, which is also what the built-in side panel does. If you want that badge visible, collapse the panel to the badge's width instead of to zero.

### 4.5 JavaScript

Two jobs: mirror the widget's open state onto the panel, and implement the drag.

```javascript
const panel  = document.querySelector('#clarity-panel')
const mount  = document.querySelector('#clarity-mount')
const handle = document.querySelector('#clarity-handle')

window.addEventListener('ClarityState:widgetState', (event) => {
  const state = event.detail?.state
  const open = state === 'opened' || state === 'maximized'
  panel.classList.toggle('clarity-panel-open', open)
  // a drag leaves an inline width that outranks the class rule and is never cleared on its own;
  // without this, closing after a drag leaves the panel pinned at its last dragged size
  if (!open) mount.style.width = ''
})

let dragStart = null

const onPointerMove = (event) => {
  if (!dragStart) return
  // the handle is on the panel's left edge and the right edge is anchored,
  // so dragging left (decreasing clientX) makes the panel wider
  mount.style.width = `${dragStart.width - (event.clientX - dragStart.x)}px`
}

const onPointerUp = (event) => {
  handle.releasePointerCapture(event.pointerId)
  handle.removeEventListener('pointermove', onPointerMove)
  handle.removeEventListener('pointerup', onPointerUp)
  panel.classList.remove('clarity-panel-dragging')
  dragStart = null
}

handle.addEventListener('pointerdown', (event) => {
  event.preventDefault()
  // capture on the handle: every later event for this pointer is retargeted here regardless of
  // what is visually underneath, so dragging across the widget's own chat content keeps working
  handle.setPointerCapture(event.pointerId)
  dragStart = { x: event.clientX, width: mount.getBoundingClientRect().width }
  panel.classList.add('clarity-panel-dragging')
  handle.addEventListener('pointermove', onPointerMove)
  handle.addEventListener('pointerup', onPointerUp)
})
```

If you only want the open and close animation and no drag handle, you can skip the JavaScript entirely and key the CSS off the widget's own markup instead, since the widget is rendered in the light DOM:

```css
#clarity-mount:has(.clarity-chat-open) { width: var(--clarity-panel-width, 470px) }
```

`clarity-chat-open` is a documented modifier on `clarity-resizable-chat-wrapper`, which the widget renders only while the chat is open. See [`styles.md`](../reference/styles.md#clarity-resizable-chat-wrapper). The `ClarityState:widgetState` event above is the more stable of the two, so prefer it when you are writing JavaScript anyway.

### 4.6 Weblayer config

Point the widget at the inner container and drop the side-panel keys. Everything else from [3.1](#31-weblayer-side) stays as it is.

```javascript
widget: {
  ...
  PARAM_clarityParentElement: '#clarity-mount',

  ui: {
    // no desktopTemplate / desktopTemplateOptions
    showPDPEnterQuestions: true,
    showContextStateChange: true,
    fn: {
      goToProductPage: ...,
      // must be set here: unset, search results only go to the page under desktopTemplate: 'ai_mode'
      hideSearchResultCarousels: ...,
    },
  },
}
```

The container must already be in the DOM when the widget mounts: `PARAM_clarityParentElement` is resolved with `document.querySelector` at mount time, and if it matches nothing the widget falls back to its floating bubble on `document.body`. Render the container as part of your app shell rather than inside a lazily-mounted route.

---

## Known issues and caveats

- **Slow page context on navigation.** After an SPA route change the widget waits up to 3 seconds for `getContext()` to report the new product before giving up on the announce. A `getContext` backed by its own asynchronous fetch can exceed that; publish the id as early as you can (see [2.4](#24-expose-live-page-context)).
- **PDP questions need an existing conversation.** `showPDPEnterQuestions` only acts for shoppers who have sent at least one message. Viewing pages never creates a conversation, so first-time visitors get product questions from the trigger they click, not from this flag.
- **Stored search results are yours to clear.** The widget does not tell the page when a result set is stale; see the notes in [2.3](#23-render-widget-search-results-on-your-own-grid).

## Reference

- [`weblayer-config.md`](../reference/weblayer-config.md) — every weblayer field, trigger templates and the `widget` block.
- [`widget-config.md`](../reference/widget-config.md) — every `ui` field, including the [side panel](../reference/widget-config.md#desktop-ai-mode-side-panel) and [feature flags](../reference/widget-config.md#feature-flags).
- [Customize components](./02-customize-components.md) — `ui.fn` overrides such as `goToProductPage`.
- [`hooks.md`](../reference/hooks.md) — hook payloads, including `searchedProducts`.
- [`runtime-api.md`](../reference/runtime-api.md) — `window.CLARITY.call` actions.
- [`styles.md`](../reference/styles.md) — DOM ids and classes for custom styling.

---

[← Chapter 2 — Customize components](02-customize-components.md) · [Chapter 4 — Context-aware pricing →](04-context-aware-pricing.md)
