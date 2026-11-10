# `window.CLARITY_CONFIG` — Widget Configuration Reference

`window.CLARITY_CONFIG` configures the Clarity chat widget. It must be defined before the Clarity bundle script loads.

Both widget templates read it: the **default widget** and **AI Mode**, selected per trigger via [`widgetTemplate`](./weblayer-config.md#widgettemplate). Most fields below apply to the default widget only — see [which template honors which field](#which-template-honors-which-field).

**Two ways to set it:**
- **Standalone** — define it directly on the page before loading the Clarity bundle script.
- **Via weblayer** — when the Engagement weblayer is injected, most fields are populated automatically from [`window.CLARITY_WEBLAYER_CONFIG.widget`](./weblayer-config.md#widget--clarity-widget-settings). Direct writes in `widget.*` take priority over the individual `PARAM_*` shorthands.

**Related docs:**
- [`weblayer-config.md`](./weblayer-config.md) — trigger UI and how it populates this config
- [Customize components](../guides/02-customize-components.md) — `ui.component` and `ui.fn` override signatures

**Required fields:** `projectId`, `personaId`, `defaultCurrency`

---

## Top-Level Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | — | Base URL for the Clarity bundle and API. If omitted, derived from the `src` of the current script tag. |
| `staticFilesUrl` | `string` | — | URL root for static assets (images, etc.). If omitted, derived as `${url}/cocoaas/public/bundle`. Useful for testing. |
| `projectId` | `string` | **Yes** | Identifies the project. |
| `projectName` | `string` | — | Human-readable project name, used to label error reports. |
| `personaId` | `string` | **Yes** | Identifies the persona (agent). |
| `personaName` | `string` | — | Human-readable agent name, used to label error reports. |
| `defaultCurrency` | `string` | **Yes** | ISO 4217 currency code (e.g. `EUR`, `USD`) or currency symbol. Applied to all product price displays. |
| `fullMode` | `boolean` | — | If `true`, the widget takes the full page rather than floating as a bubble. |
| `source` | `string` | — | Banner info string in the format `${banner_id}::${banner_name}`. Set by the weblayer; selects which `bannerSettings` entry to use for context functions and per-source UI overrides. |
| `parentElement` | `string` | — | CSS selector for a custom parent container. When set, the widget is positioned inside this element instead of `document.body`, and `position: absolute` is removed. |
| `suppressInitialMessage` | `boolean` | — | If `true`, neither the welcome message nor the `initialMessage` is sent on load. |
| `initialState` | `0 \| 1 \| 2 \| 3` | — | Controls how the widget appears on load. See [Initial State](#initial-state) below. |

---

## Context Functions

These functions are called before each user message to provide context to the AI backend.

If `bannerSettings[source]` defines these functions, they take priority over the top-level ones. When using the weblayer, these are typically set via [`widget.getContext`](./weblayer-config.md#widget--clarity-widget-settings) or the individual `PARAM_itemIdsInCart` / `PARAM_itemIdsToShow` shorthands.

### `getContext(): ContextFields`

Returns product and cart context:

```typescript
getContext: () => ({
  cartItemIds?: string[]        // IDs of products in the cart
  currentItemIds?: string[]     // IDs of products on the current page
  currentItemId?: string        // Single product ID for a PDP page
  currentItemIdsType?: 'product_id' | 'item_id'
  userContextFilter?: Record<string, any>  // (reserved, not used currently)
  pdpUrl?: string               // When hidePdpLink is true, links matching this URL are suppressed
  miniPageProduct?: any
  remove?: any
  // Context-aware pricing: the price attributes that apply to this shopper. Only `attributeName`
  // and `primary` are sent to the backend. See the Context-Aware Pricing guide.
  priceAttributesToUse?: { attributeName: string; primary?: boolean; attachedTo?: string; displayName?: string }[]
  userPricingContext?: string | Record<string, any>  // description of the shopper for the agent
})
```

For `priceAttributesToUse` and `userPricingContext`, see [Context-Aware Pricing](../guides/04-context-aware-pricing.md).

### `getUserInfo(): { uid?: string }`

Returns customer identity. The `uid` is eventually used as `_br_uid_2` in the Discovery API.

### `getCategoryInfo()`

Returns category context for PLP pages:

```typescript
getCategoryInfo: () => ({
  plpCategoryName?: string        // Category name for the search context
  plpCategoryDescription?: string // Category description
  urlQueryParams?: string         // URL query params to refine search results
})
```

### `getCurrentCustomerId(): string`

Returns the current customer's ID. Used when creating a new user session in the backend.

### `bannerSettings`

Per-source overrides, keyed by the `source` value (`${banner_id}::${banner_name}`). The weblayer registers its own context functions and UI config here so multiple weblayers on the same page don't conflict. When a source is active, values in its `bannerSettings` entry take priority over the top-level config.

```typescript
bannerSettings: {
  '{{ banner_id }}::{{ banner_name }}': {
    // Context functions (take priority over top-level)
    getContext?: () => ...
    getUserInfo?: () => ...
    getCategoryInfo?: () => ...

    // Per-source UI, agent, feedback and message overrides (all optional), each with the same shape
    // as its top-level counterpart. ui also takes the mobile / desktop / messageTemplate sub-keys and
    // is where excludedVariantFields (see below) belongs
    ui?: { ...same fields as the top-level ui, mobile?, desktop?, messageTemplate? }
    agentConfig?: { ...same fields as the top-level agentConfig }
    feedback?: { ...same fields as the top-level feedback }
    initialMessage?: { ...same fields as the top-level initialMessage }
    suppressInitialMessage?: boolean
    initialState?: 0 | 1 | 2 | 3
    parentElement?: string
    fullMode?: boolean
  }
}
```

`ui.excludedVariantFields` lets the merchant list product attributes that should never be treated as variant dimensions in the mini PDP (e.g., a `sku` or internal flag that varies between variants but should not surface as a user-selectable option). The list is merged additively with the built-in defaults (`id`, `url`, `title`, `image`, `price`, etc.) and the attributes already promoted via `customized_ui_attributes`. It can also be set per-device (`ui.mobile.excludedVariantFields` / `ui.desktop.excludedVariantFields`). For backward compatibility, a root-level `excludedVariantFields` (directly on the top-level config or on a `bannerSettings` entry, not under `ui`) is still honored as a fallback if `ui.excludedVariantFields` isn't set — but new configs should use the `ui`-nested form above.

`ui.productAttributesToLog?: string[]` lets the merchant list product property names that should be added to the `clarity_respond_product` and `url_click` analytics events, spread as top-level fields named after the property itself (e.g. configuring `['brand', 'tags']` adds `brand` and `tags` directly onto the fired event, alongside `product_id`). The properties are always read off the main product, not off the clicked variant. For each configured property: a primitive value (string/number/boolean) is logged as-is, an array of primitives is logged as-is, a plain object or an array containing an object is logged as a JSON string, and a property missing on the product is simply omitted. Empty/unset by default (no extra fields logged). Can also be set per-device (`ui.mobile.productAttributesToLog` / `ui.desktop.productAttributesToLog`).

---

## Initial State

```typescript
initialState?: 0 | 1 | 2 | 3
```

| Value | Behavior |
|---|---|
| `0` (default) | Minimized on first load. Expands automatically if an `initialMessage` is present. On subsequent visits, restores previous state. |
| `1` | Always starts minimized. On subsequent visits, restores previous state. |
| `2` | Expanded on first load. On subsequent visits, restores previous state. |
| `3` | Always force-minimized on every load. |

Set via weblayer as [`widget.PARAM_initialState`](./weblayer-config.md#widget--clarity-widget-settings).

---

## `ui` — Appearance & Behavior

`ui` applies to all screen sizes. Override per-device with `ui.mobile` and `ui.desktop` (same fields, excluding nested `mobile`/`desktop`/`messageTemplate`).

Set via weblayer as [`widget.ui`](./weblayer-config.md#widget--clarity-widget-settings).

### Which template honors which field

Clarity ships two widget templates, selected per trigger by [`widgetTemplate`](./weblayer-config.md#widgettemplate): the **default widget** (the floating/embedded chat) and **AI Mode** (the full-screen conversational search overlay). Both read this same `ui` object — including the `mobile`/`desktop` overrides and the per-source `bannerSettings[source].ui` layer — but they honor different fields, and a field the active template doesn't read is silently ignored.

| Scope | Fields | Where documented |
|---|---|---|
| **Default widget only** | Everything below **except** the two shared fields | [Colors](#colors), [Layout & Positioning](#layout--positioning), [Display Toggles](#display-toggles), [Feature Flags](#feature-flags), [Template System](#template-system), [Desktop AI-Mode Side Panel](#desktop-ai-mode-side-panel), [Product List Display](#product-list-display), [Component Overrides](#component-overrides), [Function Overrides](#function-overrides), [`ui.translation`](#uitranslation) |
| **Shared (both templates)** | `aiProductQuestionsLimit`, `priceDecimalPlaces` (both in [Feature Flags](#feature-flags)), `inputEnterKeyHint` (in [Display Toggles](#display-toggles)) | — |
| **AI Mode only** | `welcomeHeading`, `welcomeSubtitle`, `initialSuggestions`, `welcomeInputPlaceholder`, `inputPlaceholder`, `expandBubbleHint`, `suggestionHistoryDepth`, `initialUserMessage`, `resetTextBubbleState`, `backDefaultURL` | [AI Mode](#ai-mode-fields) |

Setting an AI-Mode field has no effect on the default widget, and vice versa — so a config shared across triggers can safely carry both sets.

### Colors

All colors accept any valid CSS color value.

| Field | Default | Description |
|---|---|---|
| `background` | `'white'` | Main widget background color. |
| `bubbleFontColor` | `'white'` | Font color of the minimized bubble message. |
| `bubbleBackgroundColor` | `'#00b2db'` | Background of the minimized bubble message. |
| `badgeFontColor` | `'black'` | Font color of the minimized badge/icon. |
| `badgeBackgroundColor` | `'white'` | Background of the minimized badge/icon. |
| `userFontColor` | `'black'` | Font color of user messages. |
| `userBackgroundColor` | `'#e1e9fa'` | Background of user message bubbles. |
| `assistantFontColor` | `'#001f31'` | Font color of Clarity text messages. |
| `assistantBackgroundColor` | `'white'` | Background of Clarity text messages. |
| `errorFontColor` | `'#001f31'` | Font color of error messages. |
| `errorBackgroundColor` | `'#feecf0'` | Background of error messages. |

### Layout & Positioning

| Field | Default | Description |
|---|---|---|
| `position` | `{ right: '20px', bottom: '0px' }` | CSS position of the widget: `{ left?, right?, top?, bottom? }`. When `left` is set, `right` is ignored and vice versa. |
| `size` | `'small'` | Starting size when first opened: `'small'` or `'large'`. |
| `smallSizeWidth` | `'470px'` | Widget width in small size. Not applied on mobile. |
| `largeSizeWidth` | `'760px'` | Widget width in large size. Not applied on mobile. |
| `zIndex` | `999999` | CSS `z-index` for the widget container. |
| `font` | `'Inter, Arial, Helvetica, sans-serif'` | Font family for all widget text. |
| `messagesAtTop` | `false` | If `true`, new messages appear from the top rather than the bottom. |
| `verticalPrompts` | desktop `true`, mobile `false` | If `true`, prompt/suggestion buttons stack vertically. Defaults to `true` on desktop and `false` (horizontal) on mobile. |
| `legalNotice` | — | Adds a legal notice string to the widget footer. See also `ui.translation.legalNotice`. |
| `timeFormatHour12` | `false` | Use 12-hour format for message timestamps. |

### Display Toggles

| Field | Description |
|---|---|
| `hideBRPowered` | Hide the "Powered by Bloomreach" footer text. |
| `hidePdpLink` | Hide text links and product cards that point to the current PDP URL (as determined by `getContext().pdpUrl`). |
| `hideSelectedMessage` | Hide the thumbnail carousel shown after "show similar products" responses. |
| `hideSuggestions` | Hide the AI-generated question buttons of a single product (after a thumbnail response or "Ask follow up"; where they are shown is described under `showQRInChat`). Does not affect the Compare / Show more prompts — see `hideCompareButton` and `hideViewMoreIfLessThan`. |
| `hideAIProductQuestions` | Hide the AI-generated question buttons of a single product: the ones shown for a thumbnail response (one product returned) and the ones shown after the shopper picks "Ask follow up" on a product card. |
| `hideTopMenu` | Hide the hamburger menu icon in the widget header. |
| `hideExpansion` | Hide the expand/collapse size button in the header. |
| `customizedWidgetSize` | When `true`, forces the widget to `width: 100%` regardless of `smallSizeWidth`/`largeSizeWidth`, hides the resize handle, and hides the expand/collapse button. Use when the widget is embedded in a container that controls its own dimensions. |
| `hideInputButtons` | Hide the send and voice input buttons inside the chat input bar. |
| `hideSendIfNoText` | Hide the send button while the chat input is empty, keeping its layout space reserved. |
| `inputEnterKeyHint` | Sets the chat input's `enterkeyhint` attribute, controlling the label/icon shown on the mobile virtual keyboard's action key. One of `'enter' \| 'done' \| 'go' \| 'next' \| 'previous' \| 'search' \| 'send'`. Default: `'send'`. |
| `showProductCardCustomAttrName` | Show the attribute name label alongside each custom `productCardAttrs` value. Hidden by default. |
| `enableProductCardVariantSelection` | Enable inline `color`/`size` variant selection on product cards. When on and a product exposes a `color`/`size` dimension (see `onlyMultiValueDimensions` for single-value dimensions), the card shows color swatches (with a `+N` overflow that expands) and a full-width size selector; picking a variant swaps the card's image/price, and the selected variant is used for add-to-cart. `productCardAttrs` / `productCardTagAttrs` always show the main product's values (top-level first, then its `extraVariantFields`) and only become dimensions when `extraVariantFields` lists them. Hidden by default. |
| `onlyMultiValueDimensions` | Hide variant dimensions that have a single value across all variants (e.g. every variant is `color: red`). By default every dimension is shown, including single-value ones, so a product with no separate variants still shows its own `color`/`size` as one-option selectors. A dimension some variants lack is dropped. |
| `backHeader` | Use a back-chevron header layout: reverses the header content direction, shows a chevron icon instead of the close ✕ on mobile, left-aligns the header info, and makes the entire header clickable to close the widget. Buttons inside the header (menu, reset, expand/collapse, close) still fire their own actions and do not propagate the close. |
| `useCloseOnDesktop` | Show the close ✕ icon (instead of the minimize chevron) in the header close button on desktop, with a "Close" label. Only applies when `backHeader` is not set; `backHeader` always takes precedence and shows the back chevron. On mobile the close ✕ is already shown by default, so this flag has no additional effect there. |
| `showCloseWhenInElement` | Show the header close button even when `parentElement` is set (normally the close button is hidden when the widget is mounted inside a host-page parent element, unless `fullMode` is also on). |
| `skipMinimize` | Make the header close button (and backdrop click) fully close the widget — hiding the badge too — instead of minimizing it to the badge state. |
| `moveGoToPDPButton` | Move the "Go to product page" button in the mini PDP from the header to below the "Add to cart" button (with a `16px` top margin). When enabled the button uses a plain link icon instead of the PDP-link icon; when off (default) it stays in the mini PDP header. |
| `showResetOutside` | Move the "Clear chat" button outside of the dropdown to the header bar. |
| `showLinkInCard` | Show a "View details" button on product cards that links to the PDP (logs `urlClick` with `link_type: 'product_card'` and navigates to the product URL). When both this and `useAddToCart` are enabled and the "Add to cart" button is shown, "View details" renders as a separate full-width button below the "Add to cart" / ellipsis row instead of alongside it. The button does not render for a card whose item has no `url`. |
| `hideSimilarCarouselPrompts` | If `true`, a response whose carousel came from similar products (`result_source` of `SIMILAR_PRODUCTS` or `SEARCH_AND_SIMILAR_PRODUCTS`; plain `SEARCH` is not affected) shows **no prompt buttons at all**: its Quick Replies, the Compare and Show more prompts, and the AI product questions are all dropped, in the fixed bottom bar, inline in the chat (`showQRInChat` / `showCompareButtonInChat` / `showViewMoreInChat`) and in the collapsed bubble. No suggestion questions are shown in their place, and the [`clarityRespond`](./hooks.md) hook reports empty `qrs` / `prompts` / `suggested_buttons` for that response. The carousel itself still renders; independent of [`fn.hideSearchResultCarousels`](#function-overrides). Default `false`. |

### Feature Flags

| Field | Default | Description |
|---|---|---|
| `sessionExpiryHours` | `720` (30 days) | Hours of inactivity (no user message) before the session is cleared. |
| `hideBubbleResetInterval` | `24` | Minimum hours between showing the same initial message bubble. |
| `aiProductQuestionsLimit` | `3` | **Both templates.** Maximum number of AI-generated question buttons shown per response. In AI Mode, caps the question buttons in the mini PDP (`ProductQuickView`). |
| `enableAgentName` | — | Show the agent's name alongside the assistant label in messages. |
| `showQRInChat` | — | Show Quick Reply buttons inline in the chat flow (older behavior). Also moves the AI-generated questions of a thumbnail response (one product returned) into the chat flow, after the Show more / Compare prompts; as in the fixed bottom bar, they replace that response's Quick Replies. The questions shown after "Ask follow up" on a product card stay in the fixed bottom bar either way. |
| `showContextStateChange` | — | Show a "Page context updated" banner in the chat flow (same style as the live-agent connect banner) whenever the page context sent to the agent changes its `currentItemIds`/`currentItemId`. The very first context never triggers the banner — only a change relative to a prior one does. When off (default), no banner is shown. |
| `showPDPEnterQuestions` | — | When enabled, the widget announces the PDP it lands on: on init, on chat open and on an SPA route change (`history.pushState`/`replaceState`/`popstate`), if `getContext().currentItemId` differs from the last context sent to the backend, it sends the updated context and announces the product view, and the agent replies with that product's questions as quick replies (rendered with the same "Now viewing product {product_title}" banner as a click). After a route change the widget waits up to 3 s for `getContext().currentItemId` to change, so a `getContext` that reads the product off the DOM has time to see the new page. Only for a chat that already exists in the database, so a shopper who never engaged does not get a chat created; skipped when the chat is opened by a trigger that sends a message at the same time, and when the in-widget click that navigated there already announced the product. Only one announce runs at a time; a trigger that arrives while one is in flight (init and `open_chat` on the same page) is ignored. Covers the desktop open button and `CLARITY.call('open_chat')`; opening the mobile sheet by swipe or drag does not trigger it. |
| `showCompareButtonInChat` | — | When enabled, renders the "Compare" prompt inline in the chat flow instead of in the fixed bottom bar — appended to the trailing Quick Reply message when one is shown, or as a standalone prompt right after the last response otherwise. Independent of `showQRInChat`. Shown only when the last response contains a multi-item carousel; see `hideCompareButton` to suppress it everywhere. |
| `hideCompareButton` | — | When enabled, suppresses the "Compare" prompt button entirely, in both the chat flow and the fixed bottom bar. |
| `showViewMoreInChat` | — | When enabled, renders the "Show more" prompt inline in the chat flow (alongside the Compare button, using the same placement rule) instead of in the fixed bottom bar. Independent of `showQRInChat`. Shown under the same conditions as the fixed-bottom variant: the most recent assistant response includes a carousel and either the response carries a SHOW_MORE action or `alwaysShowViewMore` is set. |
| `enableMiniPDP` | — | Enable the mini product detail panel when a product card is clicked. |
| `openPdpInNewTab` | desktop `true`, mobile `false` | Open product links in a new browser tab. Defaults to `true` on desktop, `false` on mobile. For links in a response (text links, product cards, the mini PDP and AI Mode's quick view), [`fn.getLinkOptions`](#function-overrides) can override it per link. |
| `voiceInput` | — | Allow voice input on mobile via the browser's speech recognition API. |
| `voiceInputTimeout` | — | Milliseconds of silence before speech recognition stops recording. |
| `enableSuggestionQuestions` | — | Use `initialMessage.placeholderStrings` as rotating suggestion questions; shows 3 random ones after each non-product response. |
| `alwaysShowViewMore` | — | When the most recent assistant response is a carousel, always render the "Show more" prompt button — regardless of whether the carousel's action would normally qualify for it. |
| `hideViewMoreIfLessThan` | — | Minimum carousel item count required to render the "Show more" prompt button **and** the [`fn.seeAllResults`](../guides/02-customize-components.md#fnseeallresults) "See all results" button. When set, hides both buttons if the carousel has fewer items than this number. For "Show more": takes priority over `alwaysShowViewMore` and any SHOW_MORE action carried by the response. |
| `supportPriceRange` | — | Read prices from item variants and display a price range (e.g. "$10–$30") in carousel items. Ignored on a card that shows a variant selector (`enableProductCardVariantSelection`): it shows the selected variant's price, as with this flag off. |
| `showDiscountPercentage` | — | When an item's original price is higher than its (single) price, show a discount badge (e.g. "(-40%)") next to the price in product cards and the mini PDP. No badge is shown for price ranges. With context-aware pricing (`getContext().priceAttributesToUse`) the mini PDP shows no badge while it shows the configured prices, and a product card none while it shows two of them as a range. |
| `enableLiveChat` | — | Add a live chat option to the header dropdown menu (feature in testing). |
| `liveChatContainer` | — | CSS selector of the host-page element to render the live chat video into. The widget injects its own `<video>`/`<canvas>` into that element (and removes them when the session ends), so an empty container is enough. Use `'window'` to open the video in a popup window instead. When unset, the video renders next to (or inside) the chat panel. |
| `priceDecimalPlaces` | `2` | **Both templates.** Number of decimal places for price strings in product cards. |
| `productLinkQueryParams` | — | Query parameters to append to all product links — product cards, the mini PDP and AI Mode's quick view (no leading `&` or `?`; use `&` between params). For links inside assistant text messages, only those matching `pdpLinkRegex` get them. |
| `pdpLinkRegex` | — | Pattern identifying product-page links inside assistant **text** messages — a plain pattern with no delimiters or flags, matched case-insensitively (e.g. `/p/[^/]+$`). Only a matching link gets `productLinkQueryParams` appended; every other link opens without them. When unset (or when the pattern is not valid regex), no text link is treated as a product link, so none of them get the params. `openPdpInNewTab` applies to every text link either way. Does not affect product cards or the mini PDP (AI Mode's quick view included), which always get the params, nor — in the default widget — `.pdf` links, which open in the in-chat PDF viewer. |
| `useAddToCart` | — | Show an "Add to cart" button on product cards in horizontal carousels. Clicking it invokes [`ui.fn.addToCart`](../guides/02-customize-components.md#fnaddtocart) and logs the `addToCart` hook (action `add_to_cart`), not `urlClick`. The built-in button is a no-op unless `fn.addToCart` is also set. Plain product-card clicks and the "Go to product page" dropdown always log `urlClick` with `link_type: 'product_card'` / `'product_card_menu'`, regardless of this flag. |
| `enableCheckOut` | — | Show a PayPal-branded checkout button in the mini PDP (below the variant options/questions) instead of the "Add to cart" button. The button shows the fixed PayPal wordmark plus a localized "Buy Now" label, and clicking it opens the built-in PayPal checkout flow (`clarity-paypal-widget`) for the selected variant. The PayPal credentials are configured on your agent by Bloomreach: hand your Bloomreach contact the PayPal app's client id and secret, whether it is a sandbox or a live app, and the storefront domains that may start a checkout (the client token is bound to them). Takes precedence over the mini-PDP add-to-cart button when enabled, unless [`ui.fn.showCheckoutButton`](../guides/02-customize-components.md#fnshowcheckoutbutton) returns `false`. |
| `paypalProductIdPrefix` | — | Prefix every PayPal checkout `item_id` must carry. Any item id that does not already start with it gets it prepended before the mini-PDP Buy now button hands it to PayPal. |
| `mobileMiniPDPOverlay` | — | When the mini PDP opens in `INSIDE` mode on mobile, display it as a fixed overlay panel (slides up from 30% of the screen) instead of replacing the chat view. Includes a drag handle to dismiss. |
| `showBackdrop` | — | Show a semi-transparent backdrop behind the widget when it is open. Clicking the backdrop closes the widget. Always active when using the `mobile_pdp` template. |

### Template System

| Field | Default | Description |
|---|---|---|
| `template` | `'base'` | Widget layout template. Valid values: `'base'`, `'mobile_pdp'`, `'conversational_search'`. On mobile, `'conversational_search'` automatically maps to its mobile variant. |
| `templateOptions` | — | Additional options for the `mobile_pdp` template. See below. |
| `clearPageText` | — | Text shown on the large QR/share page. **Formerly nested under `templateOptions`** — a config still setting it there keeps working (falls back automatically), but new configs should set it at this top level. |
| `desktopTemplate` | — | Set to `'ai_mode'` to mount the widget as a fixed-width side panel that pushes the page's content over, instead of floating `position: fixed`. See [Desktop AI-Mode Side Panel](#desktop-ai-mode-side-panel) below. |
| `desktopTemplateOptions` | — | Options for `desktopTemplate: 'ai_mode'`. See [Desktop AI-Mode Side Panel](#desktop-ai-mode-side-panel) below. |

#### `templateOptions` (`mobile_pdp`)

| Field | Description |
|---|---|
| `withBanner` | (`mobile_pdp`) Show the header banner. |
| `bannerPreText` | (`mobile_pdp`) Text before the gradient section in the banner. |
| `bannerGradientText` | (`mobile_pdp`) Gradient-styled middle text in the banner. |
| `bannerPostText` | (`mobile_pdp`) Text after the gradient section in the banner. |
| `bannerImage` | (`mobile_pdp`) URL of an image placed in front of the banner text. |
| `hideSmallWidget` | (`mobile_pdp`) Skip the small/minimized state entirely. |
| `closeToHide` | If `true`, the "×" button hides the widget instead of minimizing it. |
| `largeSizeHeight` | (`mobile_pdp`) Height of the widget (in `%` of the screen, measured from the bottom) in its large/expanded state. Defaults to `85`. |
| `middleSizeHeight` | (`mobile_pdp`) Height of the widget (in `%` of the screen, measured from the bottom) in its middle state. Defaults to `50`. |

### Desktop AI-Mode Side Panel

> **Not to be confused with the [AI Mode](#which-template-honors-which-field) widget template
> (`widgetTemplate: 'ai_mode'`).** `desktopTemplate` is an unrelated,
> **default-widget-only** layout flag that happens to share the `'ai_mode'` value — it picks a desktop
> mount/layout for whichever bundle is running, not which bundle to load.

Set `desktopTemplate: 'ai_mode'` to mount the widget as a resizable side-panel column instead of a
floating bubble. The module wraps the page's existing `document.body` content in a flex sibling next
to the widget's own mount container, so the page is pushed over rather than covered. This is fully
self-injecting — no markup changes are required on the host page.

For the end-to-end integration (weblayer settings plus the host-page work), see the
[Desktop AI Mode setup guide](../guides/03-side-panel.md).

Once `desktopTemplate` is set, the widget is treated as if a `parentElement`/`fullMode` were
configured — it resolves desktop `ui` config (and mounts the side panel) regardless of the actual
viewport width, so it is not automatically skipped on narrow/mobile screens. It also flips the default
of [`fn.hideSearchResultCarousels`](#function-overrides) to `true`, since a side panel next to the
page's own grid is expected to hand search results to that grid.

The panel starts collapsed to `width: 0` and only opens (animating to its configured width) while the
chat is actually open (`opened`/`maximized` widget state); it collapses back when closed, minimized, or
hidden. A thin resize handle lets the user drag the panel wider/narrower while it's open, clamped
between `minWidth` and `maxWidth`.

```typescript
desktopTemplate?: 'ai_mode'
desktopTemplateOptions?: {
  chatContainerPosition?: 'left' | 'right'  // default: 'right'
  width?: string      // default: '470px'
  minWidth?: string   // default: '360px'
  maxWidth?: string   // default: '80vw'
}
```

| Field | Default | Description |
|---|---|---|
| `chatContainerPosition` | `'right'` | Which side of the viewport the widget occupies; the page's content is pushed to the other side. |
| `width` | `'470px'` | Panel width while open. Accepts any CSS width value. |
| `minWidth` | `'360px'` | Minimum width, also the lower clamp while drag-resizing. |
| `maxWidth` | `'80vw'` | Maximum width, also the upper clamp while drag-resizing. `vw`, not `%` — the panel's containing block shrink-wraps around the panel itself, so a `%` value would resolve against a circular basis. |

### Product List Display

These fields control carousel message rendering. They apply to all devices. Use `ui.messageTemplate` or `ui.mobile`/`ui.desktop` for per-device overrides.

| Field | Default | Description |
|---|---|---|
| `productList` | `'horizontal'` | Carousel layout: `'horizontal'` or `'vertical'`. |
| `maxProductListSize` | — | Maximum number of items shown in a carousel. |
| `productImageRatio` | `1` (vertical), `25/16` (horizontal) | Width-to-height ratio of product image containers. |
| `productImageContained` | — | If `true`, product images use `object-fit: contain`; otherwise `cover`. |

### `messageTemplate` — Per-Device Product List Overrides

```typescript
ui.messageTemplate: {
  mobile: { productList?, maxProductListSize?, productImageRatio?, productImageContained? }
  desktop: { productList?, maxProductListSize?, productImageRatio?, productImageContained? }
}
```

Takes priority over top-level `ui.productList` etc. for the matching device type.

### Component Overrides

Custom mount functions for replacing built-in components. See [Customize components](../guides/02-customize-components.md) for the full mount function signature, props, and framework examples (Vanilla JS, React, Vue, Angular).

```typescript
ui.component: {
  MiniPDP?: MiniPDPMountFn                 // Replace the mini product detail panel
  ProductCard?: ProductCardMountFn         // Replace individual product cards in carousels
  ProductCarousel?: ProductCarouselMountFn // Replace the entire product carousel
  config?: {                               // Per-component behavior (e.g. lazy mounting)
    ProductCard?: LazyMountConfig
    ProductCarousel?: LazyMountConfig
  }
}
```

### Function Overrides

See [Customize components](../guides/02-customize-components.md) for usage details.

```typescript
ui.fn: {
  addToCart?: (product: AssistantCarouselMessageDataItem) => void
  seeAllResults?: (data: { userMessage?: string; categoryName?: string; rephrasedQuery?: string }) => void
  getProductImageUrl?: (variantId: string, mainProductId: string) => string
  getProductPrices?: (product: AssistantCarouselMessageDataItem) => PriceOverrides | Promise<PriceOverrides>
  // PriceOverrides = { price?: number | string | null; originalPrice?: number | string | null; currency?: string | null;
  //   [priceAttributesToUse attributeName]?: number | string | null }
  goToProductPage?: (
    variant: AssistantCarouselMessageDataItem,
    config: { source: string; parentProduct: AssistantCarouselMessageDataItem }
  ) => void | Promise<void>
  getLinkOptions?: (
    url: string,
    config: { source: string; product?: AssistantCarouselMessageDataItem; parentProduct?: AssistantCarouselMessageDataItem }
  ) => { newTab?: boolean } | void
  hideSearchResultCarousels?: () => boolean
}
```

- `addToCart` — called when the user clicks "Add to cart". Override to integrate with the merchant's cart system.
- `seeAllResults` — when set, renders a "See all results" button under every carousel and invokes this callback with the carousel's user message, category, and rephrased query. Override to deep-link into the merchant's own search/category page.
- `getProductImageUrl` — when set, called with the variant id (falling back to the product id) and the main product id wherever a product/variant image is rendered generically — product cards and the mini PDP (main image and variant swatches) — not tenant `ui.component` overrides. Its return value is tried first; if that URL fails to load, the response's own `image` field is used instead.
- `getProductPrices` — when set, called with the product (or variant) wherever a price is about to be rendered — product cards, the mini PDP, and AI Mode's product grid and quick view, not tenant `ui.component` overrides. Every field of the returned object is optional: a returned field wins over the response's own value, and a field that is omitted or `null`/`undefined` falls back to the response (return `''` to show no price). Called per variant as well — on the selected variant, and on every variant when `supportPriceRange` is on (unless the card shows a variant selector). May return the object or a Promise of it: while pending no price is shown, and a settled result is cached per product for the page's life so an `async` callback runs once per product; a sync result is not cached and runs on every render, so keep it cheap. Display only — analytics, add-to-cart and the assistant's context still use the response's price. See [Customize components](../guides/02-customize-components.md#fngetproductprices).
- `goToProductPage` — when set, called instead of navigating to the product URL when a shopper clicks into a product (view details / go to product page / mini-PDP's go-to-PDP button). The widget still logs (analytics hook, a chat event rendered as a "Now viewing product {product_title}" banner, and the click-out event) — this only replaces navigation. `config.source` is the link type the click came from; `config.parentProduct` is the top-level product owning the clicked variant (equal to `variant` when there is no separate variant page). `variant` only carries the base product fields (`id`, `url`, `title`, `image`, `price`, …), the mini-PDP / stock attributes and variant-level attributes — other merchant attributes (card tags, the attribute logged as category, `productAttributesToLog` fields) live on `config.parentProduct`, so read them from there. See [`ui.stateText`](#uistatetext) to customize the banner text.
- `getLinkOptions` — when set, called synchronously right before a link in a response opens: a text link, a product card / product-card menu / mini-PDP go-to-PDP click, or AI Mode's quick-view button. A returned `newTab` (`true` / `false`) wins over `openPdpInNewTab`; returning nothing, an object without `newTab`, or throwing falls back to it. Not called when `goToProductPage` takes the navigation over, for `.pdf` text links in the default widget (in-chat PDF viewer; AI Mode has none, so its `.pdf` links do go through it), for header links, or for links sent by a live agent. See [Customize components](../guides/02-customize-components.md#fngetlinkoptions).
- `hideSearchResultCarousels` — return `true` to hand plain search result batches (`result_source: 'SEARCH'`) to the host instead of rendering them: the widget suppresses its own carousel and Compare button for them, does not count them towards the unread badge on the collapsed widget, and pushes them to [`hooks.searchedProducts`](./hooks.md#searchedproducts) (both live and when replaying chat history). Return `false` to render them in the chat. Unset, throwing, or returning anything but a boolean means `true` when [`desktopTemplate`](#desktop-ai-mode-side-panel) is `'ai_mode'` and `false` otherwise. `SIMILAR_PRODUCTS` and `SEARCH_AND_SIMILAR_PRODUCTS` batches are not affected and stay in the chat (see `hideSimilarCarouselPrompts` to drop their prompt buttons). It is called synchronously, once per search result batch when the batch first shows up, and that answer sticks for the batch until the page reloads, across single-page-app navigations and `source` switches. See [Customize components](../guides/02-customize-components.md#fnhidesearchresultcarousels).

### `ui.translation`

Provides localized strings for all static text in the widget.

### `ui.stateText`

Text for ephemeral, non-message chat "state" banners (rendered like the live-agent connect/disconnect marker — see `clarity-state-change` in [`styles.md`](./styles.md)).

```typescript
ui.stateText?: {
  userActionProductClick?: string // default: 'Now viewing product {product_title}'
}
```

`userActionProductClick` is shown when a shopper clicks into a product and [`fn.goToProductPage`](../guides/02-customize-components.md#function-overrides) is configured. `{product_title}` is replaced with the clicked product's title. Supports the same `mobile`/`desktop`/`bannerSettings[source].ui` override layers as the rest of `ui`.

### `ui.sierraRatingTimeoutLabel`

```typescript
ui.sierraRatingTimeoutLabel?: string // default: 'This survey has expired'
```

Text shown over the satisfaction survey a Sierra agent sends once it has resolved a request, when the shopper has not rated it within five minutes of its arrival. The survey is then disabled under a dark overlay carrying this text (see `clarity-agent-csat-survey` in [`styles.md`](./styles.md)). A survey already rated is not affected. Supports the same override layers as the rest of `ui`.

### AI Mode fields

Honored **only** by the AI Mode template (the full-screen conversational search overlay); the default widget ignores them. Like every other `ui` field they support the `mobile`/`desktop` and `bannerSettings[source].ui` override layers.

`aiProductQuestionsLimit` and `priceDecimalPlaces` also apply in AI Mode — see [Feature Flags](#feature-flags).

| Field | Type | Default | Description |
|---|---|---|---|
| `welcomeHeading` | `string` | `'Search or ask'` | Heading on the welcome screen (shown while the conversation is empty). |
| `welcomeSubtitle` | `string` | `'New AI mode - a smarter way to shop'` | Subtitle under the welcome heading. |
| `initialSuggestions` | `string[]` | `[]` | Suggestion chips listed on the welcome screen. Clicking one sends it as the user's first message. |
| `welcomeInputPlaceholder` | `string` | `"I'm looking for..."` | Placeholder of the input embedded in the welcome screen. |
| `inputPlaceholder` | `string` | `'Ask AI assistant...'` | Placeholder of the bottom input bar, used once the conversation has started. |
| `expandBubbleHint` | `string` | `'tap to expand full message'` | Hint shown under a collapsed response bubble, only when its text is long enough to be truncated. |
| `suggestionHistoryDepth` | `number` | `10` | How many recent conversation groups are scanned to suppress already-asked product questions in the mini PDP. Higher values hide repeats for longer. |
| `initialUserMessage` | `string` | — | Message sent automatically on load, as if the user had typed it. Leave unset for no auto-send. |
| `resetTextBubbleState` | `boolean` | `false` | When `true`, a new product-list reply brings a minimized response bubble back into view — the behaviour every deployment had before this flag existed. When `false`, the bubble keeps whatever state the shopper left it in. |
| `backDefaultURL` | `string` | `window.location.origin` | Where the top-right close button goes when there is no previous page on this site to go back to: AI Mode opened in a new tab, a shopper who arrived from search or an ad (so they stay on the site), or a browser without the Navigation API (Safari/iOS before 26.2, Firefox before 147). Otherwise the button acts like the browser's back button. Either way the close button **leaves the current page** — AI Mode is mounted in place without a history entry of its own, so it has no in-page close. An empty string falls back to the origin. |

---

## `agentConfig` — Agent-Level Overrides

Set via weblayer as [`widget.agentConfig`](./weblayer-config.md#widget--clarity-widget-settings).

```typescript
agentConfig?: {
  errorFontColor?: string      // Default: '#001f31'
  errorBackgroundColor?: string  // Default: '#ffd1dc'
  getAgentVariables?: () => Record<string, unknown>
}
```

| Field | Description |
|---|---|
| `errorFontColor` | Font color for error messages from an external customer-service agent. Falls back to `ui.errorFontColor`. |
| `errorBackgroundColor` | Background for agent-level error messages. |
| `getAgentVariables` | Function called before each AI request to inject custom variables into the agent state. Return value is merged with agent-specific defaults. |

---

## `feedback` — User Feedback Settings

Supports `mobile` and `desktop` sub-objects to override per-device. Set via weblayer as [`widget.feedback`](./weblayer-config.md#widget--clarity-widget-settings).

```typescript
feedback?: {
  enabled?: boolean
  menuItemEnabled?: boolean
  onMinimizeEnabled?: boolean
  surveyEnabled?: boolean
  userMessagesNumberRequired?: number  // default: 2
  intervalTime?: number                // default: 48
  surveyShowInterval?: number          // default: 168
  mobile?: { /* same fields */ }
  desktop?: { /* same fields */ }
}
```

| Field | Default | Description |
|---|---|---|
| `enabled` | — | Enable per-message thumbs up/down feedback buttons for the last Clarity response. |
| `menuItemEnabled` | — | Add a "Give feedback" item to the header dropdown menu. |
| `onMinimizeEnabled` | — | Also trigger the survey check when the user minimizes the widget, in addition to on close. |
| `surveyEnabled` | — | Automatically show a survey when the widget is closed or minimized (if `onMinimizeEnabled`). |
| `userMessagesNumberRequired` | `2` | Minimum number of user messages required in the session for the survey to appear. |
| `intervalTime` | `48` | Maximum hours between the user's last message and the widget closing for the survey to appear. |
| `surveyShowInterval` | `168` | Minimum hours between two automatic survey appearances (tracked in localStorage). |

### Survey show conditions

**`menuItemEnabled`** — Adds a "Give feedback" item to the header menu. Clicking it always shows the survey immediately, with no conditions.

**`surveyEnabled`** — Automatically shows the survey when the widget is closed (or minimized, if `onMinimizeEnabled` is set). All three of the following must be true:

1. The user has sent more than `userMessagesNumberRequired` messages in the current session (default: 2).
2. The time between the widget closing and the user's last message is less than `intervalTime` hours (default: 48). This prevents showing the survey for stale sessions.
3. At least `surveyShowInterval` hours have passed since the survey was last shown to this user (default: 168 h / 7 days). Note: this cooldown only applies to the auto-show path — the menu item always forces the survey regardless.

---

## `initialMessage`

Configures an automatic message sent when the widget loads (subject to `suppressInitialMessage`). Set via weblayer using `PARAM_initialMessage`, `PARAM_itemIdsToShow`, `PARAM_placeholderQuestions`, etc. — see [`widget.*` in weblayer-config.md](./weblayer-config.md#widget--clarity-widget-settings).

```typescript
initialMessage?: {
  text?: string
  engText?: string
  itemIdsToShow?: string[]
  quickReply?: {
    text?: string
    data: Array<{ label: string; payload?: Record<string, any>; target?: string }>
  }
  placeholderStrings?: string[]
  mobileSuggestions?: string[]
  showPlaceholderStringsHome?: boolean
  // DEPRECATED
  userMessage?: string
  context?: { currentItemIds?, currentItemId?, cartItemIds?, pdpUrl? }
}
```

| Field | Description |
|---|---|
| `text` | The message text sent from Clarity to open the conversation. |
| `engText` | English version of the text, used by the AI model to generate a better response regardless of the widget language. Defaults to `text` if omitted. |
| `itemIdsToShow` | Item IDs for a product carousel shown alongside the initial message. |
| `quickReply.text` | Hint text shown above the quick reply buttons. |
| `quickReply.data` | Array of quick reply buttons: `label` (display text), `target` (direct action), `payload` (extra data). |
| `placeholderStrings` | Strings that rotate in the input placeholder every 3 seconds. Also used by `enableSuggestionQuestions`. |
| `mobileSuggestions` | Buttons shown in the minimized state of the `mobile_pdp` template. |
| `showPlaceholderStringsHome` | Show the home screen (placeholder UI) when there are no messages. |
| `userMessage` | **DEPRECATED.** Sends a user message immediately when the widget loads. Use `getContext` instead. |
| `context` | **DEPRECATED.** Use `getContext()` instead. |

---

## `hooks` — Event Hooks

Callbacks the widget calls when something happens in the chat. `version` must be `'WBL_BUNDLE'`; every callback receives one params object. With the weblayer the hooks are set through [`widget.hooks`](./weblayer-config.md#widget--clarity-widget-settings). Every hook and its params are documented in [`hooks.md`](./hooks.md).

---

## `window.CLARITY` — Widget API

See **[`runtime-api.md`](./runtime-api.md)** for the full `window.CLARITY` reference — `call()`, `setSource()`, all actions, and code examples.

---

## Widget Browser Events (`Clarity:*`)

Every hook is also dispatched as a `CustomEvent` on `window` (`Clarity:chatOpen`, …), so page code can listen without configuring `hooks`. See [`hooks.md` → Browser events](./hooks.md#browser-events).

Every `Clarity:*` event includes `source: string` in `event.detail`, set to the current `CLARITY_CONFIG.source`. When no `bannerSettings` entry exists for the active source (or when `source` is not set), all config reads fall back to the top-level `CLARITY_CONFIG` fields — so existing standalone configurations are unaffected.

---

## Configuration Example (Standalone)

```javascript
window.CLARITY_CONFIG = {
  url: undefined, // auto-detected from script src
  projectId: '00000000-0000-0000-0000-000000000000', // your Engagement project id
  personaId: '00000000-0000-0000-0000-000000000000', // your agent id
  defaultCurrency: 'EUR',
  fullMode: false,
  initialState: 0,
  getCurrentCustomerId: () =>
    window.exponea?.configuration?.customer?.cookie ?? `USER_${Math.random()}`,
  getContext: () => ({
    cartItemIds: getCartItemIds(),
    currentItemId: getProductId(),
  }),
  ui: {
    background: '#FFFFFF',
    position: { left: '20px', bottom: '20px' },
    enableMiniPDP: true,
    openPdpInNewTab: false,
  },
  initialMessage: {
    text: 'Hi! How can I help you today?',
    placeholderStrings: ['Find me a red dress', "What's on sale?"],
    showPlaceholderStringsHome: true,
  },
  feedback: {
    enabled: true,
    surveyEnabled: true,
  },
}
```
