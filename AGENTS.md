# Instructions for AI coding agents

This repository documents how to integrate the Bloomreach Conversational Agent chat widget (also called Clarity)
on a merchant's website. Use it when you are asked to configure, customize, style or react to the widget in the
merchant's codebase. It is documentation only: there is no code to install from here.

## What this repo is, and is not

- **Is:** the contract between the merchant's page and the widget: `window.CLARITY_CONFIG` and
  `window.CLARITY_WEBLAYER_CONFIG` fields, the `window.CLARITY` runtime API, hooks and browser events, analytics
  events, CSS classes and variables, the `@bloomreach/clarity-utils` query classifier.
- **Is not:** the headless API for building your own chat UI; that is
  [conversational-agent-api](https://github.com/bloomreach/conversational-agent-api). If the task is "build a chat
  UI from scratch" or "call the chat API from a server", go there.

The widget is normally delivered to the page by a Bloomreach Engagement weblayer configured by Bloomreach; the
merchant's code supplies page context, containers, styling and callbacks. A standalone integration without a
weblayer is possible and described in [Getting Started](guides/README.md#standalone-integration-without-a-weblayer).

## Which page to read for which task

| Task | Read first | Then |
|---|---|---|
| Understand how the widget gets onto the page | [guides/README.md](guides/README.md) | [guides/01-triggers.md](guides/01-triggers.md) |
| Set or change widget configuration | [reference/widget-config.md](reference/widget-config.md) | [reference/weblayer-config.md](reference/weblayer-config.md) if the weblayer sets it |
| Open the chat, send a message, switch configuration from page code | [reference/runtime-api.md](reference/runtime-api.md) | |
| Replace the product card, carousel or mini-PDP; intercept add-to-cart or navigation | [guides/03-customize-components.md](guides/03-customize-components.md) | the **Types** section of the same page |
| React to events (chat opened, message sent, add-to-cart) or feed analytics | [guides/04-track-events.md](guides/04-track-events.md) | [reference/hooks.md](reference/hooks.md), [reference/analytics-events.md](reference/analytics-events.md) |
| Restyle the widget or a trigger | [guides/02-style-the-widget.md](guides/02-style-the-widget.md) | [reference/styles.md](reference/styles.md) |
| Dock the widget as a desktop side panel | [guides/05-side-panel.md](guides/05-side-panel.md) | |
| Per-shopper prices | [guides/06-context-aware-pricing.md](guides/06-context-aware-pricing.md) | |
| Route search-bar queries to the agent | [guides/07-search-orchestration.md](guides/07-search-orchestration.md) | [reference/clarity-utils.md](reference/clarity-utils.md) |
| Zendesk hand-over | [guides/08-customer-service-zendesk.md](guides/08-customer-service-zendesk.md) | |

## Rules that keep an integration working

- **Use only what is documented.** Configuration fields, hooks, events, CSS classes and CSS variables listed in
  `reference/` are supported and stay backward compatible; anything else (undocumented fields, DOM structure
  beyond the documented classes, internal globals) can change in any release.
- **Hooks use one format.** `hooks.version` is `'WBL_BUNDLE'`; every callback receives one params object
  (`processingMessage` only its boolean), and the params object is `event.detail` of the `Clarity:<hook>`
  browser event. A standalone page must set
  `hooks: { version: 'WBL_BUNDLE' }` even without callbacks, or the browser events do not come in the
  documented shape.
- **Prefer browser events over callbacks** when the widget is weblayer-delivered: `window.addEventListener('Clarity:<hook>', …)`
  needs no configuration and does not interfere with the weblayer's analytics.
- **Component overrides receive the widget's callbacks.** Call `props.onAddToCart`, `props.onProductClick`, …
  instead of re-implementing the behaviour, so analytics and the chat state stay correct. The callbacks
  received at mount stay valid for the component's life.
- **Do not hard-code product field names** beyond the documented Product type; merchant-specific attributes
  arrive as extra root fields.
- **Context functions must be cheap and side-effect free**; `getContext()` is called on every render that needs it.
- **Style overrides need a selector in front of the class.** The widget and the triggers add their styles after the
  page's stylesheets, so a rule that only names a documented class loses; see
  [guides/02-style-the-widget.md](guides/02-style-the-widget.md#23-write-overrides-that-win) for the selector to use.
- **Locale codes for `@bloomreach/clarity-utils` are the supported full codes** listed in [reference/clarity-utils.md](reference/clarity-utils.md#clarityutilsconfig) (`en-us`, `de-de`, …); any other value, bare (`de`) or regional (`de-at`), falls back to English.

## How to verify an integration

1. Load a page with the widget and open the chat with the badge; `Clarity:chatOpen` fires (an open by a trigger comes as `Clarity:widgetShown` with `chat_widget_state: 'open'`).
2. Send a message; `Clarity:userRespond` then `Clarity:clarityRespond` fire with the params documented in `reference/hooks.md`.
3. For a component override: open a carousel, click the card, add to cart; confirm `Clarity:urlClick` / `Clarity:addToCart` fire and the mini-PDP opens through `props.onOpenMiniPDP`.
4. For styling: confirm the override targets a class listed in `reference/styles.md` and that its rule wins in the browser's developer tools. Inside the widget the selector starts with `#cocoaas_chat_wrapper`; the menus, the PDF viewer, the triggers (including their `clarity-trigger-*` classes) and the side panel are outside it (see `guides/02-style-the-widget.md`).
5. Check the browser console for warnings prefixed `Clarity:`.
