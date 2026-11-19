[← Back to Chapter 4 — Track events](04-track-events.md)

# 5. Side panel

The side panel is a desktop layout for the Conversational agent that turns the conversation into a column on the left or right side of the screen, while the page's own content is pushed to the other side. Shoppers keep browsing while the conversation stays open next to them.

This guide is for developers who integrate the widget on a storefront. It's organized by who does what:

- **Part 1: Configure the weblayer.** Your Product Engagement Manager ([who changes the weblayer](./README.md#how-the-widget-reaches-your-page)) sets these options in the Marketing weblayer (`window.CLARITY_WEBLAYER_CONFIG`). These settings don't require a storefront deployment.
- **Part 2: Update your webpage code.** Lists what your storefront codebase must provide.
- **Part 3: Review the Next.js example.** Shows the page-side code for product clicks and search results on a React (Next.js) storefront.
- **Part 4: Support multi-page storefronts.** Covers sites where every navigation is a full page load.
- **Part 5: Mount into your own container.** Covers an alternative setup for layouts that the built-in side panel can't produce.

The side panel is for desktop only. The widget doesn't check the viewport size, so target the weblayer at desktop devices. The widget injects everything it needs into the page, so you don't need any host markup or container element. The only CSS your page needs is `body { margin: 0 }` ([2.1](#21-page-layout-checklist-required)).

> **IMPORTANT**
> `widget.ui.desktopTemplate: 'ai_mode'` (described in this guide) is different from the AI mode widget template. `desktopTemplate` sets a layout for the default widget. `widgetTemplate: 'ai_mode'` loads a different widget bundle: the full-screen conversational search. Leave `widgetTemplate` unset when you follow this guide.

## Before you start

- Deliver the default overlay widget to the page through a Marketing weblayer.
- Use one widget template per page. All triggers on a page share the same widget, so leave `widgetTemplate` unset on every trigger on the page.

## Who does what

| Feature | Weblayer setting | Page code |
|---|---|---|
| Side panel layout | [`widget.ui.desktopTemplate`](#11-turn-on-the-side-panel), [`widget.ui.desktopTemplateOptions`](#12-set-panel-options) | [Layout checklist](#21-check-your-page-layout-required) |
| Product clicks routed through your single-page app (SPA) router | [`widget.ui.fn.goToProductPage`](#13-route-product-clicks-through-your-router) | [Router bridge](#25-expose-your-single-page-app-router) |
| Search results shown on your own product grid | [`widget.ui.fn.hideSearchResultCarousels`](#14-hand-search-results-to-the-page) | [Results listener](#23-render-widget-search-results-on-your-own-grid) |
| Page context (current product, category) | [`productIds`, `pageType`, or `getContext`](#15-pass-page-context) | [Live page data](#24-expose-live-page-context) for SPAs |
| Product detail page (PDP) awareness (product questions, context banner) | [`showPDPEnterQuestions`, `showContextStateChange`](#16-react-to-product-page-changes) | Same as page context |
| Panel kept open across full page loads (multi-page sites) | [Show the widget on every page](#41-what-happens-on-a-page-load) | [Results across a page load](#43-keep-search-results-across-a-page-load) |

---

## Part 1: Configure the weblayer

Add every setting in this part to `window.CLARITY_WEBLAYER_CONFIG`. The weblayer passes keys under `widget.ui` to the widget as its `ui` config. For the full list of fields, see [`weblayer-config.md`](../reference/weblayer-config.md#widget--clarity-widget-settings) for `widget` fields and [`widget-config.md`](../reference/widget-config.md) for `ui` fields.

### 1.1 Turn on the side panel

```javascript
widget: {
  ui: {
    desktopTemplate: 'ai_mode',
  },
}
```

With this setting, the widget mounts as a column next to the page content. Everything already in `<body>`, including your site header and footer, moves into the other column. To keep the header or footer outside the split, [mount the widget into your own container](#part-5-mount-into-your-own-container-alternative) instead.

The panel starts collapsed (width 0) and slides open when the chat opens. It collapses again when the chat is closed, minimized, or hidden. While the panel is open, shoppers can drag a thin handle on its inner edge to resize it. The side panel hides the header's close button unless you set [`ui.showCloseWhenInElement`](../reference/widget-config.md#display-toggles).

### 1.2 Set panel options

All options are optional. The values below are the defaults, so include only the keys you want to change.

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
| `chatContainerPosition` | `'right'` | The edge the panel occupies: `'left'` or `'right'`. The page content moves to the other side. |
| `maxWidth` | `'80vw'` | Maximum width, including when the shopper drags the handle. Use `px` or `vw`, not `%`. A percentage resolves against the panel's own box. |
| `minWidth` | `'360px'` | Minimum width, including when the shopper drags the handle. |
| `width` | `'470px'` | Panel width while open. Accepts any CSS width value. |

The panel keeps a width the shopper sets by dragging only while it stays open. The next time the chat opens, the panel returns to `width`.

### 1.3 Route product clicks through your router

When a shopper clicks a product in the chat, the widget opens the product URL. On desktop, it opens a new tab by default (see [`ui.openPdpInNewTab`](../reference/widget-config.md#feature-flags)). Otherwise, it opens the URL in the same tab, which reloads the page. On an SPA, you can keep the shopper in the same tab with the panel open by handling the navigation yourself:

```javascript
widget: {
  ui: {
    fn: {
      goToProductPage: (variant, config) => {
        const url = new URL(config.parentProduct.url, window.location.href)
        window.__clarityRouter?.push(url.pathname + url.search + url.hash)
      },
    },
  },
}
```

The function receives these arguments:

- `variant`: The clicked item.
- `config.parentProduct`: The product that owns the clicked item. If there's no separate variant, it's the same product.
- `config.source`: Where the click came from, such as `'product_card'` or `'mini_pdp_product'`

The widget still produces analytics events and the "Now viewing product …" banner. Only the navigation is yours. Your page provides `window.__clarityRouter`. For details, see [Expose your single-page app router](#25-expose-your-single-page-app-router).

Links inside assistant text messages don't go through `goToProductPage` and open as normal links. To control how these links are handled, see [`ui.pdpLinkRegex`](../reference/widget-config.md#feature-flags), [`ui.openPdpInNewTab`](../reference/widget-config.md#feature-flags), and [`ui.fn.getLinkOptions`](./03-customize-components.md#fngetlinkoptions).

### 1.4 Hand search results to the page

On a storefront with its own product grid, the page renders the search results instead of the chat. This is the default when you set `desktopTemplate: 'ai_mode'`. For every result batch from a plain search (`result_source: 'SEARCH'`), the widget:

- Doesn't render the carousel or its **Compare** button in the chat.
- Calls the `searchedProducts` hook and dispatches a `Clarity:searchedProducts` event on `window` that carries the products.

Your page must listen for that event and show the products. For details, see [2.3](#23-render-widget-search-results-on-your-own-grid). Other product batches stay in the chat, such as `SIMILAR_PRODUCTS`, `SEARCH_AND_SIMILAR_PRODUCTS`, and products in the the initial message.

A product detail page usually has no results grid. To keep search results in the chat on specific pages, decide per page:

```javascript
widget: {
  ui: {
    fn: {
      hideSearchResultCarousels: () => document.body.dataset.pageType !== 'pdp',
    },
  },
}
```

The return value controls where search results appear: 

- `false`: Search results render in the chat like any other carousel and aren't sent to the page.
- `true`: Search results go to the page as described above. The same happens if the function isn't set, throws an error, or returns a non-boolean value.

To keep every carousel inside the side panel, return `false` on every page. For details, see [`fn.hideSearchResultCarousels`](./03-customize-components.md#fnhidesearchresultcarousels).

If you prefer a callback to a DOM event, register the hook in the weblayer instead:

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

The widget calls this callback only while this weblayer's banner is the active source. To set the hook once for every weblayer on the page, see [Hooks on a weblayer page](../reference/hooks.md#hooks-on-a-weblayer-page). The widget dispatches the window event regardless of which weblayer is active.

### 1.5 Pass page context

The widget gets the page context, such as the current product, cart, and category, from two functions: `getContext()` and `getCategoryInfo()`. The weblayer builds these functions for you from flat fields:

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
| `productIds` + `productIdsType` | `getContext().currentItemId` / `currentItemIds` | With `pageType: 'pdp'`, or a single ID with `pageType` unset, the ID becomes `currentItemId`. The [product page flags](#16-react-to-product-page-changes) rely on this value. |
| `widget.pageType` | — | `'pdp'`, `'plp'`, or `'cart'`. Controls how the widget sends `productIds`: `'pdp'` makes the first ID `currentItemId`, and any other value sends them as `currentItemIds`. Also controls whether a PDP Embedded question is scoped to that product. |
| `widget.pdpUrl` | `getContext().pdpUrl` | Optional. The current product page URL. |
| `widget.plpCategoryName`, `plpCategoryDescription`, `urlQueryParams` | `getCategoryInfo()` | Optional. The listing page's category, used to answer category questions. |

The weblayer reads these flat fields once, when it runs. That's enough on a site where every navigation is a full page load, because the weblayer runs again on each new page. On an SPA, the panel stays open while the shopper navigates, so the values go stale. In that case, pass functions that read live page data instead:

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

`getContext` and `getCategoryInfo` are top-level `widget` fields, not `widget.ui.fn` entries. For the page-side setup, see [2.4](#24-expose-live-page-context).

### 1.6 React to product page changes

With the panel open, the shopper can move between product pages while the chat stays visible. Two flags make the widget react to these changes:

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

**`showPDPEnterQuestions`** shows questions about the current product while the chat is open. The widget checks the current product at these moments:

- When the widget initializes on a page.
- When the chat opens.
- On every SPA route change (`history.pushState`, `replaceState`, or `popstate`).

At each check, the widget compares `getContext().currentItemId` with the last product it sent to the backend. If the product changed, the widget sends the new context and a product view event. The backend responds with questions about that product as quick replies under a "Now viewing product …" banner.

This flag works only for shoppers who already have a conversation. Viewing a page never starts a new chat, so shoppers who haven't sent a message see nothing from this flag. The widget also skips the check when a trigger opens the chat and sends a message at the same time, such as a product listing page (PLP) banner. That message already carries the new context.

After a route change, the widget waits up to 3 seconds for `getContext().currentItemId` to change. This gives a `getContext` function that reads the product from the DOM time to see the new page. Only one check runs at a time, and the widget ignores any new trigger that arrives while a check is in progress.

**`showContextStateChange`** shows a "Page context updated" banner in the chat each time the context sent to the backend has a different product than before. The banner doesn't appear for the first context in a conversation. To change the banner text, override the `pageContextUpdated` translation key through [`widget.ui.translation`](../reference/widget-config.md#uitranslation).

**`stateText.userActionProductClick`** is optional. It sets the banner text for product views and product clicks in the widget. The widget replaces `{product_title}` with the product's title.

Both flags depend on `getContext()` returning the current product. On an SPA, this requires the live-data functions from [Pass page context](#15-pass-page-context) and the page-side setup in [Expose live page context](#24-expose-live-page-context).

---

## Part 2: Update your web page code

### 2.1 Check your page layout (required)

When the side panel is on, the widget restructures the page on load:

```
body
└── #cocoaas-desktop-ai-mode-host              flex row, height: 100dvh (children swapped when the panel is on the left)
    ├── #cocoaas-desktop-ai-mode-page-content     everything that was in <body>, moved here
    │                                             flex: 1; overflow-y: auto
    └── #cocoaas-desktop-ai-mode-widget-wrapper   the panel column (resize handle + widget)
          └── #cocoaas-desktop-ai-mode-widget-mount
```

The widget moves all existing children of `<body>` into `#cocoaas-desktop-ai-mode-page-content`, which scrolls independently. Set `body { margin: 0 }`. The host is exactly `100dvh` tall, so `<body>` and `window` no longer scroll. 

Before you turn on the panel, check the following on your page:

- **Scroll handling.** Code that reads or listens to `window` or `document` scrolling must target `#cocoaas-desktop-ai-mode-page-content` instead. This includes `window.scrollY`, `scroll` listeners on `window`, `window.scrollTo`, back-to-top buttons, and infinite-scroll triggers. Elements with `position: sticky` still work because they stick inside the scrolling container.
- **`position: fixed` elements.** These elements stay relative to the viewport, so a fixed header or cookie bar overlaps the panel column. Either constrain them to the page content box or accept the overlap.
- **Selectors and scripts that assume `<body>` children.** Review selectors such as `body > .app`, code such as `document.body.firstElementChild`, scripts that walk up to `<body>`, and code that assumes your framework's root element is a direct child of `<body>`. Elements that scripts append to `<body>` after load, such as modals, chat overlays, and cookie banners, end up outside the host. They display correctly if they use `position: fixed`. Otherwise, they end up below the full-height host, out of view.
- **Full-height layouts.** A root element styled `min-height: 100vh` now sits inside a scrolling box and works as expected. `height: 100vh` on the root also works, but content taller than the viewport scrolls inside the page content box, not the window.

To style elements around the panel column, use these classes:

| Selector | When it applies |
|---|---|
| `#cocoaas-desktop-ai-mode-widget-mount.cocoaas-desktop-ai-mode-dragging` | While the shopper drags the resize handle. |
| `#cocoaas-desktop-ai-mode-widget-mount.cocoaas-desktop-ai-mode-open` | While the chat is open. |
| `#cocoaas-desktop-ai-mode-widget-wrapper.cocoaas-desktop-ai-mode-side-left` / `-side-right` | While the chat is open. Indicates which edge of the panel faces the page content (border side). |

For the full DOM tree, see [`styles.md`](../reference/styles.md#desktop-ai-mode-side-panel-cocoaas-desktop-ai-mode-).

### 2.2 Open, close and observe the panel from page code (optional)

The panel follows the widget's state. It opens when the chat opens and collapses when the chat is closed, minimized, or hidden. Any button on your page can control the panel through the Conversational agent runtime API:

```javascript
await window.CLARITY?.call('open_chat')          // open the chat, panel slides open
await window.CLARITY?.call('close_chat')         // minimize, panel collapses
await window.CLARITY?.call('hide_badge', { log: true })  // hide entirely, panel collapses
```

If the widget is hidden, `open_chat` opens the chat out of sight and the panel stays collapsed. This happens, for example, on a page where only a trigger shows the widget. In that case, call `show_badge` first.

To react when the panel opens or closes, listen for the state event:

```javascript
window.addEventListener('ClarityState:widgetState', (event) => {
  const state = event.detail?.state  // 'hidden' | 'minimized' | 'opened' | 'maximized'
  const panelOpen = state === 'opened' || state === 'maximized'
})
```

For all available actions, see [`runtime-api.md`](../reference/runtime-api.md).

### 2.3 Render widget search results on your own grid

You need this step when the widget [hands search results to the page](#14-hand-search-results-to-the-page), which is the default with `desktopTemplate: 'ai_mode'`. Listen for the `Clarity:searchedProducts` event, store the products, and show them on your results page.

In the Next.js example:

- [`ClarityBridge.jsx`](../examples/side-panel/react/ClarityBridge.jsx) listens for the event and navigates to the results page.
- [`SearchResults.jsx`](../examples/side-panel/react/SearchResults.jsx) shows the products.

The example stores the products under a key that it also adds to the results URL. This gives every answer its own URL, so a new answer still updates the results page when the shopper is already on it.

Event payload (`event.detail`):

| Field | Description |
|---|---|
| `from_history` | `true` when the widget replays an existing conversation on page load. Skip these events so a reload doesn't navigate the shopper away. |
| `products_data` | Array of batches: `{ rephrased_query?, result_source?, data: [...] }`. Each batch is a `result_source: 'SEARCH'` batch that the widget didn't render. |
| `products_data[].data[]` | The products. Each product has `id`, `title`, `url`, `image`, `price`, `originalPrice`, `variants`, and the merchant attributes configured for the persona. |

When you map the product data, note the following:

- `price` is the current price. `originalPrice`, if present, is the pre-discount price to show crossed out.
- `url` is the product page URL from your catalog.
- The widget keeps the products in memory only, so reloading the results page loses them. To keep them across a page load, see [Keep search results across a page load](#43-keep-search-results-across-a-page-load).

### 2.4 Expose live page context

You need this step on an SPA for the [page context](#15-pass-page-context) functions and the [product page flags](#16-react-to-product-page-changes). The widget reads page context only through `getContext()` and `getCategoryInfo()`, never from the URL. Route changes only tell the widget when to call these functions again. Your page must keep the data these functions read up to date on every navigation.

A simple pattern is one global object that every page view writes to on mount:

```javascript
// product page
useEffect(() => {
  window.clarityPage = { ...window.clarityPage, currentProductId: product.id, currentCategoryName: undefined }
  return () => {
    window.clarityPage = { ...window.clarityPage, currentProductId: undefined }
  }
}, [product.id])

// category page
useEffect(() => {
  window.clarityPage = { ...window.clarityPage, currentProductId: undefined, currentCategoryName: category.name }
}, [category.name])
```

The weblayer's `getContext` and `getCategoryInfo` functions from [Pass page context](#15-pass-page-context) then read `window.clarityPage`. Clear `currentProductId` when the shopper leaves a product page. Otherwise, the widget keeps treating the last product as the current one.

The widget reads the context at these moments:

- When it initializes.
- When the chat opens.
- Before every message the shopper sends.
- After every SPA route change, when `showPDPEnterQuestions` is on.

The widget detects route changes by wrapping `history.pushState` and `replaceState` and listening for `popstate`. This covers any router that uses the History API, with no extra setup. After a route change, the widget waits up to 3 seconds for `getContext().currentItemId` to report the new product. That's enough for a store that updates the global object in a mount effect. If your `getContext` takes longer, for example because it waits on its own fetch, the widget skips the product questions for that navigation.

### 2.5 Expose your single-page app router

You need this step when you set [`goToProductPage`](#13-route-product-clicks-through-your-router). Publish a router object on `window` so the weblayer function can call it. For Next.js (App Router), [`ClarityBridge.jsx`](../examples/side-panel/react/ClarityBridge.jsx) does this from a component rendered once in the root layout. If your routes include a prefix, such as a locale or channel segment, wrap `push` to add the prefix:

```javascript
window.__clarityRouter = {
  push: (path) => router.push(withChannelPrefix(path)),
  replace: (path) => router.replace(withChannelPrefix(path)),
}
```

The name `__clarityRouter` is a convention between your weblayer function and your page. The widget itself doesn't read it.

---

## Part 3: Review the Next.js example

The [side panel example](../examples/side-panel/README.md) shows two page-side pieces together on a Next.js (App Router) storefront:

- Product clicks that go through your router. See [Route product clicks through your router](#13-route-product-clicks-through-your-router) and [Expose your single-page app router](#25-expose-your-single-page-app-router).
- Search results rendered on your own grid. See [Hand search results to the page](#14-hand-search-results-to-the-page) and [Render widget search results on your own grid](#23-render-widget-search-results-on-your-own-grid).

The weblayer configuration is in `configuration/side-panel.js`, and your page's code is in `react/`.

---

## Part 4: Support multi-page storefronts

On a storefront where every link triggers a full page load, such as server-rendered pages without a client-side router, the browser discards the page on each navigation. The widget then starts again on the next page. Parts 1 and 2 still apply. This part covers what's different.

### 4.1 What happens on a page load

- **The conversation is kept.** The widget restores it on the new page.
- **The open state is kept, but the widget starts hidden.** The browser remembers whether the chat was open, and the chat opens again as soon as something on the new page shows the widget. A trigger weblayer loads the widget hidden and shows it only when the shopper uses the trigger. With triggers alone, the panel stays collapsed after every navigation.
- **The panel is rebuilt.** The widget restructures `<body>` as described in [Check your page layout](#21-check-your-page-layout-required). The panel then slides open from width 0 and pushes the page content aside. Expect this reflow on every page load while the chat is open.
- **A dragged width isn't kept.** The panel opens at the `width` set in [Set panel options](#12-set-panel-options) on each page.

To keep the chat open across pages, show the widget on every page the shopper can reach from the chat. One way is a follow-up weblayer with `directShowWidget: true`. The `follow_up` template loads the widget without any trigger UI, and the flag shows the widget as soon as it initializes:

```javascript
window.CLARITY_WEBLAYER_CONFIG = {
  ...
  triggerTemplate: 'follow_up',
  directShowWidget: true,
  widget: {
    ...
    getContext: ...,        // this page's context, see 1.5 and 4.2
    getCategoryInfo: ...,
    ui: {
      desktopTemplate: 'ai_mode',
      // the same desktopTemplateOptions, flags and fn as in your other weblayers
    },
  },
}
```

You can get the same result by setting [`directShowWidget: true`](../reference/weblayer-config.md#lifecycle) on any other weblayer on the page, or by calling `show_badge` from page code.

If `window.CLARITY` already exists, don't wait for `Clarity:initialized`. The widget queues any call made before it initializes and runs it afterward (see [Runtime API](../reference/runtime-api.md)). The widget might also dispatch the event before your script runs. Listen for the event only if the weblayer hasn’t created `window.CLARITY` yet:

```javascript
const showClarity = () => window.CLARITY.call('show_badge')
if (window.CLARITY) {
  showClarity()
} else {
  window.addEventListener('Clarity:initialized', showClarity, { once: true })
}
```

Whichever method you use, note the following:

- **Initial open.** With the default [`initialState`](../reference/widget-config.md#initial-state), the panel opens automatically when the widget appears for a visitor who hasn't chatted yet, in each new browser tab. This doesn't happen when `suppressInitialMessage` is set or the home screen shows. After that, the panel reopens only if the shopper left the previous page with the chat open. Otherwise, it stays collapsed.
- **Badge.** While the panel is collapsed, the widget's badge stays on screen (`position: fixed` at [`ui.position`](../reference/widget-config.md#layout--positioning)) and reopens the chat. To let shoppers reopen the chat only from a trigger or your own button (see [Open, close, and observe the panel from page code](#22-open-close-and-observe-the-panel-from-page-code-optional)), hide the badge (`clarity-minimized`) with CSS.
- **Consistent settings.** Use the same `desktopTemplate` and `desktopTemplateOptions` in every weblayer that can run on the same page. All these weblayers share one widget and one side panel.
- **Initial state.** Leave [`PARAM_initialState`](../reference/widget-config.md#initial-state) at its default. The value `3` (force-minimized) closes the chat on every page load, so the panel collapses each time the shopper navigates.
- **Audience.** Every weblayer with the side panel restructures the page as described in [Check your page layout](#21-check-your-page-layout-required). This happens as soon as the widget loads, whether or not the chat is open, for every visitor the weblayer runs for. A follow-up weblayer on every page restructures every page on the site. To exclude visitors who never used the chat, limit the weblayer's audience, for example to visitors with a [`clarity` event](../reference/analytics-events.md).

### 4.2 What changes in Parts 1 and 2

| Section | On a multi-page site |
|---|---|
| [Route product clicks](#13-route-product-clicks-through-your-router), [Expose your router](#25-expose-your-single-page-app-router) | You don't need a router bridge. If `goToProductPage` isn't set, a product click on desktop opens the product page in a new tab (see [`ui.openPdpInNewTab`](../reference/widget-config.md#feature-flags)), and the panel stays open on the current page. To open the product page in the same tab, set `openPdpInNewTab: false` or set `goToProductPage` to a plain redirect, such as `window.location.assign(config.parentProduct.url)`. The panel then reappears on the product page as described in [What happens on a page load](#41-what-happens-on-a-page-load). |
| [Pass page context](#15-pass-page-context), [Expose live page context](#24-expose-live-page-context) | Still recommended. Set `getContext` and `getCategoryInfo` to read the page's own data, as in Pass page context. The flat fields (`productIds`, `widget.pageType`, and so on) are read again on each page load and also work. However, they miss changes made without a page load, such as selecting another variant. In both cases, set these fields in every weblayer that can run on the page, including the follow-up weblayer. The widget reads the context of the weblayer that last controlled it. On a page where the shopper doesn't click a trigger, that's the follow-up weblayer. |
| [React to product page changes](#16-react-to-product-page-changes) | Works without changes. The product check runs each time the widget initializes, which is on every page load while the chat is open. |

### 4.3 Keep search results across a page load

When the widget [hands search results to the page](#14-hand-search-results-to-the-page), the listener from [Render widget search results on your own grid](#23-render-widget-search-results-on-your-own-grid) can't keep the products in memory. Loading your results page discards them. Instead, store the products in `sessionStorage` and navigate with a normal page load, as shown in the first half of [`search-results.js`](../examples/side-panel/plain-js/search-results.js).

Current browsers allow about 5 MB of `sessionStorage` per origin, shared with everything else your site stores there. `setItem` throws an error when storage is full. Each product the widget sends includes every attribute configured for the persona. For large result sets, store only the fields your product card shows and limit the number of products.

Include this listener on every page, because the shopper can ask a question from any page. The event fires after the assistant's answer is complete, so the navigation doesn't cut off the reply.

Navigate even if storing the products fails. The chat doesn't show these results because they were handed to the page, so a shopper left on the current page sees an answer without products. The results aren't lost, though. Each time the widget loads on a page, it replays the conversation's handed-off search results as a `searchedProducts` event with `from_history: true`. Your results page can read them from there.

On the results page, read the stored products. If there are none, fall back to the replay, as shown in the second half of the same file.

When you implement the results page, consider the following:

- **Rendering.** `renderProducts` in the example stands for your own product card rendering.
- **Which batch to show.** The replay covers the whole conversation and doesn't indicate which answer each batch belongs to. The example shows the last batch, which contains the latest answer's results if that answer returned a single batch.
- **Listener timing.** The widget dispatches the replay once, while it initializes and before `Clarity:initialized`. You can't request it again. Register the listener synchronously when your script starts, not after your own data loads.
- **Script order.** Whether your script runs before the widget initializes depends on your page. If the Marketing snippet is inline and your bundle is deferred, your script runs first, because the replay follows several network round trips after the snippet. If your script might start later, you can't recover a missed replay.
- **Loading and fallback states.** The replay arrives only after the widget loads and fetches the conversation, so show a loading state until then. Stop waiting after a timeout of your own. If neither the stored results nor the replay arrive, give the shopper a way to ask again, for example an empty grid with a button that opens the chat.

The mapping notes in [Render widget search results on your own grid](#23-render-widget-search-results-on-your-own-grid) also apply here.

---

## Part 5: Mount into your own container (alternative)

### 5.1 When to use your own container

`desktopTemplate: 'ai_mode'` moves **everything** in `<body>` into one column of its own flex row. This is what makes the setup markup-free. It also means your site header, navigation, and footer end up inside that column and are only as wide as the column. Mount the widget into your own container instead if your design needs any of the following:

- A full-width header above the panel.
- A footer outside the split.
- A panel limited to one region of the page.

### 5.2 What changes

For the widget's own rendering, `desktopTemplate: 'ai_mode'` behaves like a parent element: the widget mounts into its own panel column. When you give it your own container, the widget renders the same way:

- Square corners and no drop shadow.
- Fills the container.
- Uses the desktop `ui` config at any viewport width.
- Renders the mini PDP inside the panel instead of beside it.
- Opens live chat video in a pop-up window, unless you set [`ui.liveChatContainer`](../reference/widget-config.md#feature-flags).
- Hides the close button, unless you set [`ui.showCloseWhenInElement`](../reference/widget-config.md#display-toggles).

Everything in Parts 1 to 4 still applies, except for the following:

| Section | With your own container |
|---|---|
| [Turn on the side panel](#11-turn-on-the-side-panel), [Set panel options](#12-set-panel-options) | Replaced by `widget.PARAM_clarityParentElement`. See [Update the weblayer configuration](#56-update-the-weblayer-configuration). Don't set `desktopTemplate` or `desktopTemplateOptions`. |
| [Hand search results to the page](#14-hand-search-results-to-the-page) | You must set `hideSearchResultCarousels`. Otherwise, search results stay in the chat. |
| [Check your page layout](#21-check-your-page-layout-required) | Doesn't apply. The widget doesn't move any elements, `window` keeps scrolling, and `position: fixed` elements behave normally. |

You're responsible for the page layout and for opening and closing the panel together with the chat. [`own-container.html`](../examples/side-panel/plain-js/own-container.html) shows the panel's part of both. The following sections explain its markup, styles, and script. The built-in panel's drag handle has no equivalent here, so you need to add resizing yourself.

### 5.3 Add the container markup

Add one element for the widget next to your page content. The widget fills the element completely with its own markup, so it covers anything you place inside it.

### 5.4 Style the container

The styles animate the panel's width between collapsed and open. You control the page layout around it.

While the chat is minimized, the widget shows its badge (`clarity-minimized`), as in the built-in side panel. The badge uses `position: fixed` at [`ui.position`](../reference/widget-config.md#layout--positioning), so the collapsed container doesn't clip it. If your page opens the chat only from its own buttons, hide the badge with CSS.

### 5.5 Sync the panel with the chat state

The script applies the widget's open state to the panel, based on the `ClarityState:widgetState` event.

You can skip the script and base the CSS on the widget's own markup instead, because the widget renders in the light DOM:

```css
#clarity-mount:has(.clarity-chat-open) { width: 470px }
```

`clarity-chat-open` is a documented modifier on `clarity-resizable-chat-wrapper`, which the widget renders only while the chat is open. For details, see [`styles.md`](../reference/styles.md#clarity-resizable-chat-wrapper). The event is more stable, so use it when you're writing JavaScript anyway.

### 5.6 Update the weblayer configuration

Point the widget at your container and remove the side panel keys. Keep everything else as described in [Part 1](#part-1-configure-the-weblayer). For the example's weblayer configuration, see [`configuration/own-container.js`](../examples/side-panel/configuration/own-container.js).

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

The container must be in the DOM when the widget mounts. The widget looks up `PARAM_clarityParentElement` with `document.querySelector` at mount time. If nothing matches, the widget falls back to its floating bubble on `document.body`. Render the container as part of your app shell, not inside a lazy-loaded route.

---

## Known limitations

- **Slow page context on navigation.** After an SPA route change, the widget waits up to 3 seconds for `getContext()` to report the new product. After that, it skips the product questions for that navigation. A `getContext` that depends on its own asynchronous fetch can take longer. Publish the product ID as early as possible. For details, see [Expose live page context](#24-expose-live-page-context).
- **Product questions need an existing conversation.** `showPDPEnterQuestions` works only for shoppers who have sent at least one message. Viewing pages never creates a conversation, so first-time visitors get product questions from the trigger they click, not from this flag.
- **Reflow on every page load of a multi-page site.** While the chat is open, the panel is rebuilt and slides open again after each navigation. For details, see [What happens on a page load](#41-what-happens-on-a-page-load).

## Reference

- [`weblayer-config.md`](../reference/weblayer-config.md) — every weblayer field, trigger templates and the `widget` block.
- [`widget-config.md`](../reference/widget-config.md) — every `ui` field, including the [side panel](../reference/widget-config.md#desktop-ai-mode-side-panel) and [feature flags](../reference/widget-config.md#feature-flags).
- [Customize components](./03-customize-components.md) — `ui.fn` overrides such as `goToProductPage`.
- [`hooks.md`](../reference/hooks.md) — hook payloads, including `searchedProducts`.
- [`runtime-api.md`](../reference/runtime-api.md) — `window.CLARITY.call` actions.
- [`styles.md`](../reference/styles.md) — DOM ids and classes for custom styling.

---

[← Chapter 4 — Track events](04-track-events.md) · [Chapter 6 — Context-aware pricing →](06-context-aware-pricing.md)
