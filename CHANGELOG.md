# Changelog

What changed in the documented contract (configuration, runtime API, hooks and events, styles) with each widget
release published here. The version headings are the widget release tags.

## v2.42.10 — 2026-11-10

- **Breaking:** `ui.hideSearchResultCarousels` is replaced by the function [`ui.fn.hideSearchResultCarousels`](guides/02-customize-components.md#fnhidesearchresultcarousels), asked once per search result batch, so a page can keep search results in the chat where it has no results grid, such as a product detail page. Unset, it keeps the old default: results go to the page under `desktopTemplate: 'ai_mode'` and stay in the chat otherwise. Replace `hideSearchResultCarousels: true` / `false` with `fn: { hideSearchResultCarousels: () => true }` / `() => false`.
- Zendesk hand-over: the first message of each new conversation is held back for 2 seconds by default, so the merchant's AI agent has taken the conversation over and answers it instead of replying with its welcome alone. The welcome reply now shows above the shopper's hand-off message. The wait is a new optional value to hand to Bloomreach, the [AI agent takeover wait](guides/06-customer-service-zendesk.md#4-what-to-hand-to-bloomreach).
- Sierra satisfaction survey: a rated survey stays in the chat with its stars; an unrated one is disabled after five minutes under an overlay showing the new [`ui.sierraRatingTimeoutLabel`](reference/widget-config.md#uisierraratingtimeoutlabel) (styles: `clarity-agent-csat-survey-expired`, `clarity-agent-csat-survey-overlay`, `clarity-agent-csat-survey-overlay-label`).
- New `checkout` and `purchase` hooks and analytics events for the PayPal checkout of the mini PDP's Buy now button, with `product_ids`, `checkout_location`, `checkout_provider`, `purchase_status`, `order_id` and `error`. The top notice (`clarity-feedback-thank`) moved from the chat pane to the chat container so it also shows over the inline mini PDP, and gained a `clarity-feedback-thank--error` variant used for a failed checkout; new `checkoutSuccessful` / `checkoutFailed` texts. A failed checkout closes the overlay and reports through that notice instead of an in-overlay error message, so `clarity-paypal-error` is gone. `clarity-paypal-widget` no longer paints a white background; it blurs the chat behind it (`backdrop-filter: blur(3px)`), and it now stays mounted while the chat is open, hidden with the new `clarity-paypal-widget-idle` modifier between checkouts.
- Mini PDP in the `mobileMiniPDPOverlay` panel: top padding reduced from 80px to 40px, since only the drag handle sits above it there (the inline mini PDP under the chat header keeps 80px).
- `userRespondProduct` hook and `user_respond_product` analytics event: the per-product rows no longer carry `product_names` (the parent `userRespond` never did); use `product_id`.
- First publication of the web integration documentation: configuration references for the widget and the
  weblayer, the runtime API, hooks and analytics events, styles, the `@bloomreach/clarity-utils` classifier, and
  guides for triggers, component customization, the side panel, context-aware pricing, search orchestration and
  the Zendesk hand-over.
