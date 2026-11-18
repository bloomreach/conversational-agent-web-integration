# Styles Reference

CSS class hierarchies and CSS variables for the Clarity chat widget and its trigger templates.

> **Give every override more weight than the built-in rule.** The widget and the triggers add their styles to the
> page after your stylesheets, so a rule that only names a class from this page loses. Put a selector in front of
> the class, for example `#cocoaas_chat_wrapper` for the widget's classes; the menus, the PDF viewer, the triggers
> and the side panel need others, see
> [Style the widget](../guides/02-style-the-widget.md#23-write-overrides-that-win).

**Related docs:**
- [`widget-config.md`](./widget-config.md) — `window.CLARITY_CONFIG` fields that the `--clarity-widget-*` CSS variables map to
- [`weblayer-config.md`](./weblayer-config.md) — trigger template configuration; `--cui-param-*` / `--cui-sg-*` variables are set from these params
- [Customize components](../guides/03-customize-components.md) — component slot overrides (MiniPDP, ProductCard, ProductCarousel)
- [Style the widget](../guides/02-style-the-widget.md) — annotated screenshots of the main classes, and how to write overrides that win over the widget's styles

---

## Widget Class Hierarchy

Widget classes use the `clarity-` prefix. The widget renders into the page's regular DOM (no shadow root), so page selectors can match widget elements; inherited properties are reset on `root_inside_shadow` (`all: initial`), so nothing flows into the widget from the page unless a selector targets it; the trigger templates and the side-panel tree have no such reset. Only the classes listed on this page are part of the contract: elements can carry further classes, among them older `clarity_` (underscore) ones, and those can change or disappear in any release.

```
#cocoaas_chat_wrapper
  └── root_inside_shadow
        └── clarity-remount-app-wrapper
              └── clarity-content
                    ├── clarity-minimized
                    ├── clarity-mobile-pdp-backdrop (conditional, see clarity-resizable-chat-wrapper)
                    ├── clarity-resizable-chat-wrapper
                    │     └── clarity-paypal-widget (+ clarity-paypal-widget-idle while no checkout is open)
                    └── clarity-survey-feedback

document.body
  ├── clarity-menu-dropdown  (the header menu and the product card's menu, see the Portal note under clarity-header)
  └── clarity-pdf-backdrop   (the PDF viewer, portalled outside #cocoaas_chat_wrapper, see clarity-pdf-backdrop)
```

### clarity-paypal-widget

Rendered inside `clarity-resizable-chat-wrapper` for as long as the chat is open, hidden with the `clarity-paypal-widget-idle` modifier until the mini PDP's Buy now opens a checkout. Full-size checkout overlay above the chat (`z-index: calc(var(--clarity-widget-z-index) + 2)`).

* clarity-paypal-container — mount point for the PayPal SDK payment widget (`#clarity-paypal-container`)

When PayPal approves the payment the checkout overlay closes and the chat adds an order confirmation as an assistant message of its own, without feedback buttons; if that message cannot be added, its text shows in `clarity-feedback-thank` with the `clarity-feedback-thank--persistent` modifier until the shopper closes it. When the SDK or the token fetch fails the checkout overlay closes and the chat shows the `checkoutFailed` text in `clarity-feedback-thank` with the `clarity-feedback-thank--error` modifier.

### clarity-survey-feedback

* clarity-survey-feedback-top-close-button
  * clarity-light-close-icon
* clarity-survey-feedback-header
  * clarity-survey-feedback-header-text
  * clarity-survey-feedback-header-progress-bar
    * clarity-survey-feedback-header-progress-bar-fill
* Stage 0 (score selection):
  * clarity-survey-feedback-score-text
  * clarity-survey-feedback-score-container
    * clarity-survey-feedback-score
      * clarity-survey-feedback-score-button (+ clarity-survey-feedback-score-button-chosen modifier)
    * clarity-survey-feedback-score-labels
      * clarity-survey-feedback-score-label
* Stage 1 (text feedback):
  * clarity-survey-feedback-text-container
    * clarity-survey-feedback-text
    * clarity-survey-feedback-textarea
  * clarity-survey-feedback-buttons
    * clarity-survey-feedback-button clarity-survey-feedback-button-back
    * clarity-survey-feedback-button clarity-survey-feedback-button-submit
* Stage 2 (thank you):
  * clarity-survey-feedback-emoji
  * clarity-survey-feedback-text-container
    * clarity-survey-feedback-thank-you-text
    * clarity-survey-feedback-thank-you-subtext
  * clarity-survey-feedback-close-button

### clarity-minimized

* clarity-initial-message-container
  * clarity-initial-message
    * clarity-initial-message-bg
    * clarity-initial-message-bubble
      * clarity-initial-message-text
      * clarity-initial-message-close-icon
        * clarity-close-icon
  * clarity-initial-message-quick-replies
    * clarity-initial-message-quick-reply
* clarity-badge (button)
  * clarity-badge-logo-container
    * clarity-badge-logo
      * clarity-logo or clarity-assistant-icon
    * clarity-badge-unread-text-count
  * clarity-badge-text-container
    * clarity-badge-text
    * clarity-badge-unread-text-container
      * clarity-badge-unread-text

### clarity-resizable-chat-wrapper

Modifiers: clarity-mobile, clarity-mobile-pdp, clarity-full-mode, clarity-parent-mode, clarity-default-mode, clarity-expanded, clarity-height-adjusted, clarity-chat-open

* clarity-resizable-chat-wrapper-overlay
* clarity-resizable-chat-wrapper-container
  * clarity-chat-wrapper

Before it, with the `mobile_pdp` template or with `showBackdrop`: clarity-mobile-pdp-backdrop (+ clarity-mobile-pdp-backdrop-show while the chat is open), the dimmed page behind the open chat.

### clarity-chat-wrapper

* clarity-mini-pdp--outside-container
  * clarity-mini-pdp, or clarity-mini-pdp-wrapper clarity-mount-wrapper when `MiniPDP` is overridden (see [Customize components](../guides/03-customize-components.md))
* clarity-live-chat-container (after the mini PDP container; only while the live audio/video panel is open and the mini PDP location is outside)
* clarity-chat-container
  * clarity-resize-handle
    * clarity-resize-handle-indicator
  * clarity-chat-pdp-questions
    * clarity-chat-pdp-questions-banner
      * clarity-chat-pdp-questions-banner-image-container
      * clarity-chat-pdp-questions-banner-text
    * clarity-chat-pdp-questions-buttons
      * clarity-chat-pdp-questions-button-text
  * clarity-header
  * clarity-top-notice-host (the short notice under the header: feedback thanks, failed checkout, an order confirmation the chat could not add)
    * clarity-feedback-thank (+ clarity-feedback-thank--error and clarity-feedback-thank--persistent modifiers)
      * clarity-check-filled-icon or clarity-error-icon
      * clarity-feedback-thank-text
      * clarity-feedback-thank-close (persistent notice only)
  * clarity-mobile-pdp-backdrop (+ clarity-mobile-pdp-backdrop-show; only with `mobileMiniPDPOverlay`, behind the overlay below)
  * clarity-mini-pdp--inside-container (+ clarity-mini-pdp--inside-container-overlay modifier)
    * clarity-resize-handle (with `mobileMiniPDPOverlay`)
    * clarity-mini-pdp, or clarity-mini-pdp-wrapper clarity-mount-wrapper when `MiniPDP` is overridden
    * clarity-mini-pdp--inside-input-container
      * clarity-input
  * clarity-live-chat-container (instead of clarity-chat while the live audio/video panel is open and the mini PDP location is inside)
  * clarity-chat

### clarity-mini-pdp

> **Global styles** — Default styles for `clarity-mini-pdp` are injected as a global style block rooted at `.root_inside_shadow .clarity-mini-pdp`, so these rules are scoped to the widget but are **not** component-scoped, and none uses `!important` (e.g. `.clarity-mini-pdp-dimensions-option` has `padding: 4px 8px`). The widget adds the block after your stylesheets, so a rule of equal specificity loses; prefix yours with `#cocoaas_chat_wrapper`, see [Style the widget](../guides/02-style-the-widget.md#23-write-overrides-that-win).

Modifier: clarity-mini-pdp--inside

* clarity-mini-pdp-header
  * clarity-mini-pdp-header-button clarity-back-button (back button)
    * clarity-back-icon (conditional, only when inside mode)
  * clarity-mini-pdp-pdp-link-button clarity-mini-pdp-header-button (pdp link button; shown here only when `moveGoToPDPButton` is off)
    * clarity-pdp-link-icon
* clarity-mini-pdp-content-container
  * clarity-mini-pdp-image-container
  * clarity-tags-container clarity-mini-pdp-tags-container
    * clarity-tag clarity-tag-${attr}
  * clarity-mini-pdp-title
  * clarity-mini-pdp-price-container
    * clarity-mini-pdp-price-group
      * clarity-mini-pdp-price
      * clarity-mini-pdp-discount-percentage (shown only when `showDiscountPercentage` is set and a single-price discount exists)
    * clarity-mini-pdp-original-price
  * clarity-mini-pdp-context-prices (shown instead of `clarity-mini-pdp-price-container` when one of the `getContext().priceAttributesToUse` prices without `attachedTo` has a value for the product)
    * clarity-mini-pdp-context-price (one per price without `attachedTo`, at most two, equal widths)
      * clarity-mini-pdp-context-price-label
      * clarity-mini-pdp-context-price-values (the price with its strike-through prices stacked under it)
        * clarity-mini-pdp-context-price-value
        * clarity-mini-pdp-context-price-attached (one per strike-through price attached to this one)
  * clarity-mini-pdp-review
    * clarity-star-filled-icon
  * clarity-mini-pdp-dimensions
    * clarity-mini-pdp-dimensions-name
    * clarity-mini-pdp-dimensions-option (+ active modifier; one button per value when the dimension has at most 3 values)
    * clarity-mini-pdp-dimensions-select (replaces the option buttons when the dimension has more than 3 values, color included)
  * clarity-mini-pdp-variant-selector (image-based variant selector; shown instead of `clarity-mini-pdp-dimensions` when a product with several variants has no variant dimensions)
    * clarity-mini-pdp-variant-selector-selected (label + value row for the hovered/selected variant)
      * clarity-mini-pdp-variant-selector-label (the "Variant:" label)
      * clarity-mini-pdp-variant-selector-value (title of the hovered/selected variant)
    * clarity-mini-pdp-variant-selector-options
      * clarity-mini-pdp-variant-selector-option (+ active modifier; circular variant image)
  * clarity-mini-pdp-buy-now (+ clarity-mini-pdp-buy-now-${state} modifier: idle / processing / done / failed) — when `enableCheckOut` is on; replaces the add-to-cart button below — PayPal-branded blue pill
    * clarity-paypal-logo / clarity-spinner-icon / clarity-check-icon / clarity-error-icon (by state) + "Buy Now" label span
  * clarity-button clarity-button--primary clarity-mini-pdp-atc (+ clarity-mini-pdp-atc-${state} modifier: idle / adding / added / failed) — when `enableCheckOut` is off
    * clarity-cart-icon / clarity-spinner-icon / clarity-check-icon / clarity-error-icon (by state)
  * clarity-mini-pdp-pdp-link-button clarity-mini-pdp-header-button clarity-mini-pdp-go-to-pdp (go to product page button; shown here only when `moveGoToPDPButton` is on)
    * clarity-link-icon
  * clarity-mini-pdp-attributes-container
    * clarity-attribute-container clarity-attribute-container-${attr}
      * clarity-attribute-name
      * clarity-attribute-value
    * clarity-attribute-container clarity-mini-pdp-description-container
      * clarity-attribute-name clarity-mini-pdp-description-title
      * clarity-attribute-value clarity-mini-pdp-description-text (+ clarity-mini-pdp-description-text-clamped modifier)
      * clarity-mini-pdp-description-more

### clarity-input

* clarity-input-file-size-error
  * clarity-error-icon
* clarity-input-shadow (+ clarity-focused modifier)
  * clarity-input-wrapper
    * clarity-input-container (+ disabled modifier)
      * clarity-input-products-container
        * clarity-selected-products-container
        * clarity-uploaded-files-container
        * clarity-input-textarea
      * clarity-input-buttons-container
        * clarity-input-attachment-button
          * clarity-attachment-icon
        * clarity-input-voice-container
          * clarity-input-voice-button
            * clarity-raw-voice-icon
            * clarity-input-voice-button-text
        * clarity-input-not-listening-button
          * clarity-voice-icon
        * clarity-input-send-message-button
          * clarity-send-message-icon

### clarity-header

* clarity-header-content (+ clarity-header-content-reverse modifier, + clarity-clickable when `backHeader` is enabled)
  * clarity-header-content-left
    * clarity-header-info
      * clarity-header-avatar-wrapper
        * clarity-logo or clarity-assistant-icon
      * clarity-header-merchant-info-container
        * clarity-header-name
        * clarity-header-description
    * clarity-header-actions
      * clarity-header-avatar-wrapper clarity-header-action (reset button)
        * clarity-refresh-icon
      * clarity-header-menu-action-container
        * clarity-header-avatar-wrapper clarity-header-action (menu toggle button)
          * clarity-ellipsis-horizontal-icon
        * clarity-menu-dropdown
          * clarity-menu-item (clear chat)
            * clarity-refresh-icon
          * clarity-menu-item (get help)
            * clarity-help-icon
          * clarity-menu-item (give feedback)
            * clarity-feedback-icon
          * clarity-menu-item (debug mode)
            * clarity-bug-icon
            * clarity-menu-status-item
              * clarity-check-icon (conditional, when active)
          * clarity-menu-item (live chat)
            * clarity-live-chat-icon
            * clarity-menu-status-item
              * clarity-check-icon (conditional, when active)
          * clarity-menu-item (about clarity)
            * clarity-info-icon
      * clarity-header-avatar-wrapper clarity-header-action (expand/collapse button)
        * clarity-expand-icon or clarity-collapse-icon
  * clarity-header-content-right
    * clarity-header-avatar-wrapper clarity-header-action (close button)
      * clarity-chevron-down-icon or clarity-light-close-icon (on mobile)

> **Portal** — `clarity-menu-dropdown` (and the assistant carousel item's menu) is rendered into `document.body`, not as a DOM descendant of `clarity-header-menu-action-container`. It is shown nested here to indicate which trigger opens it, but selectors relying on ancestry from `#cocoaas_chat_wrapper` / `.root_inside_shadow` (or any other widget ancestor) will not match it — use `body .clarity-menu-dropdown.clarity-menu-dropdown { ... }` instead, see [Style the widget](../guides/02-style-the-widget.md#23-write-overrides-that-win). It stacks at `--clarity-widget-z-index + 2`, with a click-away backdrop at `--clarity-widget-z-index + 1`.

### clarity-chat

* clarity-chat-outer-container
  * clarity-chat-content
    * clarity-chat-inner-container (also clarity-only-scroll-bar)
      * clarity-cold-start-wrapper
      * clarity-message-wrapper
  * clarity-chat-scroll-to-bottom-button
    * clarity-arrow-button
      * clarity-arrow-down-icon
* clarity-chat-pdp-input-fixed-space
* clarity-chat-footer
  * clarity-assistant-quick-reply-message
  * clarity-chat-powered-by-br-container
  * clarity-chat-input-container
    * clarity-input
  * clarity-chat-legal-notice-container
    * clarity-chat-legal-notice-text-container
      * clarity-chat-legal-notice-icon-container
        * clarity-small-info-icon
      * clarity-chat-legal-notice-text
    * clarity-chat-debug-version-text

### clarity-cold-start-wrapper

* clarity-cold-start-container
  * clarity-cold-start-avatar
    * clarity-logo or clarity-assistant-icon
  * clarity-cold-start-title
  * clarity-cold-start-quick-replies
    * clarity-cold-start-quick-reply

### clarity-selected-products-container

* clarity-selected-products-item
  * clarity-selected-products-item-content
    * clarity-selected-products-item-title
  * clarity-selected-products-item-remove-button
    * clarity-light-close-icon

### clarity-uploaded-files-container

* clarity-uploaded-files-item (+ clarity-uploaded-files-item-error modifier)
  * clarity-uploaded-files-item-title
  * clarity-uploaded-files-item-remove-button
    * clarity-light-close-icon

### clarity-message-wrapper

* clarity-message-timestamp
* clarity-state-change (live-agent connect/disconnect marker and the product-click marker)
* clarity-message-container (modifiers: clarity-with-thumbs, clarity-always-show-thumbs)
  * clarity-message-carousel-divider-container
    * clarity-message-carousel-divider
  * clarity-message-content-container (one per message)
    * clarity-message-content (modifiers: clarity-full-width, clarity-assistant-carousel-message)
      * clarity-assistant-text-message
      * clarity-assistant-carousel-message--horizontal
      * clarity-assistant-carousel-message--vertical
      * clarity-user-text-message
      * clarity-debug-message
      * clarity-error-message
      * clarity-assistant-quick-reply-message
      * clarity-reference-products-message
        * clarity-reference-products-message-container
          * clarity-reference-products-message-measure
          * clarity-reference-products-message-content
            * clarity-reference-products-message-more-text-number
    * clarity-message-content-wrapper (instead of clarity-message-content for an external agent reply)
      * clarity-message-content
  * clarity-select-mode-message
    * clarity-select-mode-message-content
      * clarity-select-mode-message-content-text
      * clarity-select-mode-message-content-counter
    * clarity-select-mode-message-buttons
      * clarity-select-mode-message-button clarity-compare-button (compare button)
        * clarity-squared-check-icon (conditional, desktop only)
      * clarity-select-mode-message-button (clear button)
        * clarity-light-close-icon
  * clarity-feedback-thumbs (modifiers: mobile-thumbs, desktop-thumbs)
    * clarity-feedback-thumbs-button (thumb up)
      * clarity-thumb-up-icon
    * clarity-feedback-thumbs-button (thumb down)
      * clarity-thumb-down-icon
  * clarity-feedback-message-container
    * clarity-feedback-message-header-container
      * clarity-feedback-message-header
        * clarity-feedback-message-header-text
        * clarity-feedback-message-header-optional
      * clarity-feedback-message-header-button
    * clarity-feedback-message-content
      * clarity-feedback-message-textarea
      * clarity-feedback-message-send-button
* clarity-typing-indicator-container
  * clarity-typing-indicator-content
    * clarity-assistant-text-message
      * clarity-typing-indicator-dots
        * clarity-typing-indicator-dot

### clarity-assistant-text-message

* clarity-assistant-text-message-link
* clarity-custom-table-wrapper
  * clarity-custom-table
    * clarity-custom-table-header-cell

### clarity-assistant-carousel-message--horizontal

* clarity-assistant-carousel-category-name
* clarity-assistant-carousel-container
  * clarity-assistant-carousel-arrow-button-container
    * clarity-assistant-carousel-custom-arrow-button (+ clarity-assistant-carousel-left-arrow-button or clarity-assistant-carousel-right-arrow-button)
  * clarity-scroll-gradient-left / clarity-scroll-gradient-right (fade overlay over the scroll edges, opacity driven by scroll position)
  * clarity-assistant-carousel-item-container
    * clarity-assistant-carousel-item-wrapper (+ clarity-assistant-carousel-item-wrapper--selected modifier)
* clarity-see-all-results-container (shown only when `ui.fn.seeAllResults` is set and the user is not in compare flow)
  * clarity-see-all-results-button

### clarity-assistant-carousel-message--vertical

* clarity-assistant-carousel-category-name
* clarity-assistant-carousel-container
  * clarity-assistant-carousel-item-container
    * clarity-assistant-carousel-item-wrapper (+ clarity-assistant-carousel-item-wrapper--selected modifier)
* clarity-see-all-results-container (shown only when `ui.fn.seeAllResults` is set and the user is not in compare flow)
  * clarity-see-all-results-button

### clarity-assistant-carousel-item-wrapper

> **Global styles** — Default styles for `clarity-assistant-carousel-item-wrapper` (the product card shell) are injected as a global style block rooted at `.root_inside_shadow .clarity-assistant-carousel-item-wrapper`, so these rules are scoped to the widget but are **not** component-scoped, and none uses `!important`. The widget adds the block after your stylesheets, so a rule of equal specificity loses; prefix yours with `#cocoaas_chat_wrapper`, see [Style the widget](../guides/02-style-the-widget.md#23-write-overrides-that-win).

The wrapper element renders as `<div role="group" tabindex="0">` (`tabindex="-1"` and `aria-disabled="true"` while the card is disabled). It handles keyboard activation (Enter / Space) on top of the existing click handler.

Modifier: clarity-assistant-carousel-item-wrapper--selected

* clarity-assistant-carousel-item (also carries `class-assistant-carousel-item-${product.id}` for targeting an individual product card, with the selected variant's id instead when the card shows the variant selector; with an overridden `ProductCard` this element is the mount container itself, carries clarity-mount-wrapper too and has no clarity-assistant-carousel-item-wrapper around it)
  * clarity-assistant-carousel-item-shadow
    * clarity-assistant-carousel-item-content
      * clarity-assistant-carousel-checkbox clarity-assistant-carousel-selected-checkbox (select mode)
      * clarity-assistant-carousel-item-image
      * clarity-assistant-carousel-product

### clarity-assistant-carousel-checkbox

* clarity-assistant-carousel-checkbox-input
* clarity-assistant-carousel-checkbox-background

### clarity-assistant-carousel-product

* clarity-tags-container clarity-assistant-carousel-product-tags-container
  * clarity-tag clarity-tag-${attr}
* clarity-assistant-carousel-product-attributes-container clarity-assistant-carousel-product-attributes-container-${attrs}
  * clarity-assistant-carousel-product-attribute-container
    * clarity-assistant-carousel-product-attribute-name
    * clarity-assistant-carousel-product-attribute-value
* clarity-assistant-carousel-product-title
* clarity-assistant-carousel-product-review
  * clarity-star-filled-icon
* clarity-assistant-carousel-product-variants
* clarity-assistant-carousel-product-variant-selection (when `enableProductCardVariantSelection` is on and the product has variant dimensions)
  * clarity-assistant-carousel-product-dimension (color dimension block)
    * clarity-assistant-carousel-product-dimension-selected (label + value row)
      * clarity-assistant-carousel-product-dimension-label
      * clarity-assistant-carousel-product-dimension-value
    * clarity-assistant-carousel-product-color-swatches
      * clarity-assistant-carousel-product-dimension-swatch (carries `clarity-assistant-carousel-product-dimension-swatch--selected` on the active swatch)
      * clarity-assistant-carousel-product-dimension-more (the `+N` overflow chip)
  * clarity-assistant-carousel-product-dimension-selected (size dimension block; label + select)
    * clarity-assistant-carousel-product-dimension-label
    * clarity-assistant-carousel-product-dimension-select clarity-assistant-carousel-product-size-select
  * clarity-assistant-carousel-product-dimension-selected (one block per other dimension; label + select)
    * clarity-assistant-carousel-product-dimension-label
    * clarity-assistant-carousel-product-dimension-select
* clarity-assistant-carousel-product-spacer
* clarity-assistant-carousel-product-content-footer-container
  * clarity-assistant-carousel-product-content-footer
    * clarity-assistant-carousel-product-price-container
      * clarity-assistant-carousel-product-price-group
        * clarity-assistant-carousel-product-price
        * clarity-assistant-carousel-product-discount-percentage (shown only when `showDiscountPercentage` is set and a single-price discount exists)
      * clarity-assistant-carousel-product-original-price
    * clarity-assistant-carousel-product-content-footer-buttons
      * clarity-button clarity-button--secondary clarity-assistant-carousel-product-content-footer-button clarity-assistant-carousel-product-content-footer-icon-button (ellipsis)
        * clarity-ellipsis-horizontal-icon
      * clarity-button clarity-assistant-carousel-product-content-footer-button clarity-assistant-carousel-product-atc (add to cart, conditional; + clarity-button--primary when the View details button is shown, clarity-button--secondary otherwise). Carries one of `clarity-assistant-carousel-product-atc-idle | -adding | -added | -failed` reflecting the click outcome, or `clarity-assistant-carousel-product-atc-select-size` while the in-card variant selector still has no size picked (button is disabled and shows "Select Size" without an icon).
        * clarity-cart-icon (idle) / clarity-spinner-icon (adding) / clarity-check-icon (added) / clarity-error-icon (failed)
  * clarity-button clarity-button--secondary clarity-assistant-carousel-product-content-footer-button (View details, with `showLinkInCard` and a product URL; inside clarity-assistant-carousel-product-content-footer-buttons when the add-to-cart button is off, after clarity-assistant-carousel-product-content-footer as its sibling otherwise)

### clarity-user-text-message

_(no children)_

### clarity-debug-message

* clarity-debug-message-content
  * clarity-json-div
    * clarity-json-pre

### clarity-error-message

* clarity-error-message-content
  * clarity-assistant-text-message-link
* clarity-error-message-debug
  * clarity-error-message-debug-container
    * clarity-error-message-debug-details
      * clarity-error-message-debug-pre
  * clarity-error-message-debug-button

### clarity-assistant-quick-reply-message

* clarity-assistant-quick-reply-label
* clarity-assistant-quick-reply-buttons (modifiers: clarity-fixed-bottom, clarity-horizontal-display, clarity-with-text)
  * clarity-assistant-quick-reply-prompt-button
    * clarity-prompt-icon (intent: prompt) or clarity-end-conversation-icon (intent: end_conversation) (optional, based on intent)
    * clarity-assistant-quick-reply-button-text
  * clarity-assistant-quick-reply-answer-button
    * clarity-assistant-quick-reply-button-text
  * clarity-scroll-gradient-left / clarity-scroll-gradient-right (horizontal display only; fade overlay over the scroll edges, opacity driven by scroll position)

### clarity-agent-button-group

* clarity-agent-button-group-button

### clarity-agent-carousel

* clarity-agent-carousel-container
  * clarity-agent-carousel-item-container
    * clarity-agent-carousel-item-wrapper
      * clarity-agent-carousel-item
        * clarity-agent-carousel-item-shadow
          * clarity-agent-carousel-item-content
            * clarity-agent-carousel-item-image
            * clarity-agent-carousel-product

### clarity-agent-carousel-product

* clarity-agent-carousel-product-title
* clarity-agent-carousel-product-subtitles
  * clarity-agent-carousel-product-subtitle
* clarity-agent-carousel-product-spacer
* clarity-agent-carousel-product-content-footer
  * clarity-agent-carousel-product-content-footer-buttons
    * clarity-agent-carousel-product-content-footer-button

### clarity-agent-copy-button-list

* clarity-agent-copy-button-list-button (default state)
  * clarity-copy-icon
* clarity-agent-copy-button-list-button clarity-agent-copy-button-list-button-copied (copied state)
  * clarity-check-filled-icon

### clarity-agent-form

* clarity-agent-form-field (one per field)
  * clarity-agent-form-label
  * clarity-agent-form-input (modifiers: clarity-agent-form-input-invalid, clarity-agent-form-input-placeholder while a select has no value; an `input` for text/email fields, a `select` for select fields)
  * clarity-agent-form-error (only while a validation error is shown)
* clarity-agent-form-submit (hidden once the form has been answered)

### clarity-agent-csat-survey

Modifier: clarity-agent-csat-survey-expired once the survey was left unrated for five minutes.

* clarity-agent-csat-survey-title
* clarity-agent-csat-survey-stars
  * clarity-agent-csat-survey-star (one per star; modifier: clarity-agent-csat-survey-star-active while lit — up to the hovered star, or up to the rating once given)
    * clarity-star-filled-icon
* clarity-agent-csat-survey-overlay (only while expired)
  * clarity-agent-csat-survey-overlay-label (the text of [`ui.sierraRatingTimeoutLabel`](./widget-config.md#uisierraratingtimeoutlabel))

### clarity-agent-image-attachment-container

* clarity-agent-image-attachment
  * clarity-agent-image-quick-actions (modifiers: mobile-quick-actions, desktop-quick-actions)
    * clarity-agent-image-quick-actions-button (copy)
      * clarity-copy-icon
    * clarity-agent-image-quick-actions-button (download)
      * clarity-download-icon

### clarity-pdf-backdrop

The PDF viewer. Rendered directly into `document.body`, not inside `#cocoaas_chat_wrapper`, so it inherits from `body` and its overrides cannot start with `#cocoaas_chat_wrapper`, see [Style the widget](../guides/02-style-the-widget.md#23-write-overrides-that-win).

* clarity-pdf-modal
  * clarity-pdf-close-btn
  * clarity-pdf-frame

---

## Desktop AI-Mode Side Panel (`cocoaas-desktop-ai-mode-*`)

Rendered when [`ui.desktopTemplate: 'ai_mode'`](./widget-config.md#desktop-ai-mode-side-panel) is set — a
separate tree appended directly to `document.body`, outside `#cocoaas_chat_wrapper`, so
these ids/classes use their own `cocoaas-` prefix rather than `clarity-`.

```
#cocoaas-desktop-ai-mode-host             (flex row appended to document.body; children swapped when the panel is on the left)
  ├── #cocoaas-desktop-ai-mode-page-content     (the page's original content, moved in here; scrolls independently of the widget)
  └── #cocoaas-desktop-ai-mode-widget-wrapper   (widget side: sized/resized together with the mount below)
        ├── .cocoaas-desktop-ai-mode-resize-handle (+ --left / --right)  (drag handle, only while open)
        └── #cocoaas-desktop-ai-mode-widget-mount    (mount point for #cocoaas_chat_wrapper;
                                                      + .cocoaas-desktop-ai-mode-open while the chat is open,
                                                      + .cocoaas-desktop-ai-mode-dragging while the handle is dragged)
```

`#...-widget-wrapper` carries `.cocoaas-desktop-ai-mode-side-left` / `-side-right` (border modifier,
only while open) — on the edge facing `#...-page-content`, i.e. the opposite of what the class name's
own left/right would suggest if it were on the page-content box instead. Order of `#...-widget-wrapper`
vs `#...-page-content` under the host depends on `desktopTemplateOptions.chatContainerPosition`.

The resize handle and separator border live on the widget side rather than inside
`#...-widget-mount` itself, since that div is filled entirely by the widget's own markup (via
`render()`) and would paint over anything placed inside it. `#...-widget-mount` additionally sets
`isolation: isolate`, sealing the widget's own internal stacking (dropdowns, modals, etc. — routinely
higher z-index than the handle's) so it can never paint over the handle sitting just outside it.

---

## Trigger Class Hierarchy

Trigger templates use the `cui-` prefix. Each template is injected into the merchant page by the weblayer — see [`weblayer-config.md`](./weblayer-config.md) for how templates are selected and configured.

### PDP Embedded Trigger

* cui-container
  * cui-content
    * cui-stars
    * cui-header
  * cui-buttons
    * cui-button
    * cui-button cui-anything
    * cui-button cui-gradient-wrapper
      * cui-gradient-border
        * cui-gradient-content
          * cui-gradient-background
          * cui-gradient-text
  * cui-powered-by

### PLP Embedded Trigger

* cui-container
  * cui-content
    * cui-header
    * cui-banner
      * cui-banner-image
      * cui-banner-text
        * cui-gradient-text
    * cui-buttons
      * cui-button
      * cui-button cui-anything
      * cui-button cui-gradient-wrapper
        * cui-gradient-border
          * cui-gradient-content
            * cui-gradient-background
            * cui-gradient-text
  * cui-powered-by

### PLP Banner Trigger

* cui-container
  * cui-content
    * cui-header
      * cui-gradient-text
    * cui-button
      * cui-gradient-border
        * cui-gradient-content
  * cui-banner
    * cui-banner-image
    * cui-banner-text
  * cui-powered-by

### Quiz Embedded Trigger

* cui-sg-container
  * cui-sg-header
    * cui-sg-header-title
      * cui-sg-header-icon-container
      * cui-sg-header-title-text
    * cui-sg-header-button-wrapper
      * cui-sg-component-progress-container
        * cui-sg-component-progress-question-counter
        * cui-sg-component-progress-bar-container
          * cui-sg-component-progress-bar-value
      * cui-sg-icon-button (close)
        * clarity-close-icon
  * cui-sg-content-section-wrapper
    * cui-sg-icon-container
      * cui-sg-icon-button (back)
        * clarity-arrow-down-icon
    * cui-sg-content-section
      * cui-sg-question
        * cui-sg-optional
      * cui-sg-textarea
      * cui-sg-action-row
        * cui-sg-recommendation-button-wrapper
          * cui-sg-recommendation-button
            * cui-ai-icon
      * cui-sg-options-container
        * cui-sg-option-button
        * cui-sg-option-button cui-sg-option-button-selected
        * cui-sg-option-button cui-sg-option-button-selected cui-sg-option-button-selecting
  * cui-sg-powered-by

### Interaction Embedded Trigger

* cui-interaction-embedded
  * cui-header-container
    * cui-content
      * cui-logo
        * clarity-assistant-icon
      * cui-header
    * cui-close-button
      * clarity-light-close-icon
  * cui-user-text
    * cui-user-text-content
  * cui-text-content
  * cui-buttons
    * cui-button
    * cui-button cui-anything
    * cui-button cui-gradient-wrapper
      * cui-gradient-border
        * cui-gradient-content
          * cui-gradient-background
          * cui-gradient-text
  * cui-loading-dots
    * cui-dot
  * cui-powered-by

### Floating Trigger

* cui-floating-trigger (+ cui-desktop modifier)
  * cui-floating-trigger-container
    * cui-floating-trigger-content
      * cui-floating-trigger-img-container
        * clarity-logo or clarity-assistant-icon
    * cui-floating-trigger-drag-handler
      * cui-drag-handler-icon

### Search Suggestion Trigger

* cui-suggestion-container
  * cui-suggestion-header
  * cui-suggestion-content-wrapper
    * cui-suggestion-content
      * cui-suggestion-item (+ selected modifier)
        * cui-suggestion-text

---

## Shared Component Classes

Icon and utility classes used across multiple components.

### Buttons

* clarity-button — base class of the mini PDP's add-to-cart button and of the product card's footer buttons
  * clarity-button--primary (mini PDP add to cart; the card's add to cart when its View details button is shown)
  * clarity-button--secondary (the card's View details and ellipsis buttons; its add to cart without View details)

### Component override containers

* clarity-mount-wrapper — the element a [component override](../guides/03-customize-components.md) mounts into; it also carries clarity-mini-pdp-wrapper for `MiniPDP` and clarity-assistant-carousel-item for `ProductCard`; for `ProductCarousel` it is the only child of clarity-assistant-carousel-item-container, in place of the item wrappers

### Widget icons (`clarity-*`)

* clarity-light-close-icon
* clarity-close-icon
* clarity-assistant-icon
* clarity-logo
* clarity-attachment-icon
* clarity-arrow-down-icon
* clarity-arrow-button
* clarity-back-icon
* clarity-bug-icon
* clarity-cart-icon
* clarity-check-filled-icon
* clarity-check-icon
* clarity-chevron-down-icon
* clarity-collapse-icon
* clarity-copy-icon
* clarity-download-icon
* clarity-ellipsis-horizontal-icon
* clarity-end-conversation-icon
* clarity-enter-icon
* clarity-enter-right-icon
* clarity-error-icon
* clarity-expand-icon
* clarity-feedback-icon
* clarity-find-icon
* clarity-followup-icon
* clarity-help-icon
* clarity-info-icon
* clarity-link-icon
* clarity-live-chat-icon
* clarity-minimize-icon
* clarity-pdp-link-icon
* clarity-powered-by-br-icon
* clarity-prompt-icon
* clarity-raw-voice-icon
* clarity-reference-icon
* clarity-refresh-icon
* clarity-send-message-icon
* clarity-small-info-icon
* clarity-squared-check-icon
* clarity-star-filled-icon
* clarity-thumb-down-icon
* clarity-thumb-up-icon
* clarity-voice-icon
* clarity-fade-in
* clarity-touch-enclosed-container (the chat's and the mini PDP's scroll containers)

### Trigger icons (`cui-*`)

* cui-ai-icon
* cui-assistant-icon
* cui-drag-handler-icon
* cui-powered-by-br-icon

---

## Global Utility Classes

Available throughout the widget. Two further global style blocks are described in their own sections above:
[`clarity-mini-pdp`](#clarity-mini-pdp) and
[`clarity-assistant-carousel-item-wrapper`](#clarity-assistant-carousel-item-wrapper).

* clarity-with-animation
* clarity-with-animation-in
* clarity-with-animation-out
* clarity-basic-message
* clarity-sr-only
* clarity-clickable
* clarity-hidden
* clarity-no-scroll-bar
* clarity-only-scroll-bar
* clarity-hover-scroll-bar

---

## CSS Variables

### Widget variables (`--clarity-widget-*`)

Set as inline styles on `#cocoaas_chat_wrapper` from `getUIConfig()` values, so overriding one from a stylesheet needs `!important`. The UIConfig field names correspond to `window.CLARITY_CONFIG.ui.*` — see [`widget-config.md`](./widget-config.md) for the full config reference.

| Variable | Maps to UIConfig | Purpose |
|---|---|---|
| `--clarity-widget-font` | `font` | Font family for the whole widget |
| `--clarity-widget-bg` | `background` | Widget background color |
| `--clarity-widget-assistant-bg` | `assistantBackgroundColor` | Assistant message bubble background |
| `--clarity-widget-assistant-color` | `assistantFontColor` | Assistant message text color |
| `--clarity-widget-user-bg` | `userBackgroundColor` | User message bubble background |
| `--clarity-widget-user-color` | `userFontColor` | User message text color |
| `--clarity-widget-bubble-bg` | `bubbleBackgroundColor` | Initial message bubble background |
| `--clarity-widget-bubble-color` | `bubbleFontColor` | Initial message bubble text color |
| `--clarity-widget-badge-bg` | `badgeBackgroundColor` | Badge button background |
| `--clarity-widget-badge-color` | `badgeFontColor` | Badge button text/icon color |
| `--clarity-widget-error-bg` | `errorBackgroundColor` | Error message background |
| `--clarity-widget-error-color` | `errorFontColor` | Error message text color |
| `--clarity-widget-z-index` | `zIndex` | Widget stacking order (default: 999999) |
| `--clarity-widget-pos-top` | position top | Widget position from top |
| `--clarity-widget-pos-bottom` | position bottom | Widget position from bottom |
| `--clarity-widget-pos-left` | position left | Widget position from left |
| `--clarity-widget-pos-right` | position right | Widget position from right |
| `--clarity-widget-product-image-ratio` | `productImageRatio` | Aspect ratio for product images |
| `--clarity-widget-product-image-fit` | `productImageContained` | Object-fit for product images: `contain` when set, otherwise `cover` |
| `--clarity-widget-banner-image-margin` | `templateOptions.bannerImage` | Margin-left on the banner image: `1.5em` when a banner image is set, otherwise empty |
| `--clarity-widget-messages-place-content` | `messagesAtTop` | Flex place-content for the messages container: empty when set, otherwise `flex-end` |

### Trigger variables (`--cui-param-*`)

Set on each trigger template's root element. These are populated from `window.CLARITY_WEBLAYER_CONFIG` params — see [`weblayer-config.md`](./weblayer-config.md) for the source config fields.

Trigger abbreviations: **PDP** = PDP Embedded, **PLP-E** = PLP Embedded, **PLP-B** = PLP Banner, **Int** = Interaction Embedded, **Chat** = Embedded Chat

| Variable | Default | Purpose | Used by |
|---|---|---|---|
| `--cui-param-fontFamily` | `Inter, Arial, Helvetica, sans-serif` | Font family | PDP, PLP-E, PLP-B, Int, Chat |
| `--cui-param-backgroundColor` | `#ffffff` | Container background | PLP-E, PLP-B |
| `--cui-param-textColor` | `#003160` | General text color | PDP, PLP-E, Int, Chat |
| `--cui-param-headerTextColor` | `#181818` | Header / title text color | PDP, PLP-E, PLP-B, Int, Chat |
| `--cui-param-askAnythingTextColor` | `#002840` | "Ask anything" placeholder text color | PDP, PLP-E, Int |
| `--cui-param-userTextColor` | `#e1e9fa` | User text bubble background | Int, Chat |
| `--cui-param-bannerBackgroundColor` | `#181818` | Banner section background | PLP-E, PLP-B |
| `--cui-param-bannerTextColor` | `#3d506d` | Banner section text color | PLP-E, PLP-B |
| `--cui-param-buttonTextColor` | `#ffffff` | Button label text color | PLP-B |
| `--cui-param-buttonBackgroundColor` | `#4b8eaf` | Button fill color | PLP-B, Int, Chat |
| `--cui-param-buttonHoveredBackgroundColor` | `rgba(14,192,253,0.04)` | Button fill on hover | PDP, Int, Chat |
| `--cui-param-buttonBorderColor` | `rgba(75,142,175,1)` | Button border / gradient color | PLP-B, Chat |
| `--cui-param-buttonBorderGradientColor` | — | Secondary gradient stop for button border | PDP, PLP-E, Int, Chat |
| `--cui-param-gradientTextColor` | — | Gradient text fill color | PLP-E, PLP-B |
| `--cui-param-buttonBorderRadius` | `20px` | Button corner radius | PDP, PLP-B, Int, Chat |
| `--cui-param-buttonBorderWidth` | `1px` | Inner border thickness on gradient buttons | PDP, PLP-B, Int, Chat |
| `--cui-param-buttonBorderShadowWidth` | `3px` | Outer shadow padding on gradient buttons | PDP, Int, Chat |
| `--cui-param-buttonBorderShadowOpacity` | `0` | Shadow opacity at rest | PDP, Int, Chat |
| `--cui-param-buttonBorderShadowHoveredOpacity` | `0.2` | Shadow opacity on hover | PDP, PLP-E, Int, Chat |

### Quiz trigger variables (`--cui-sg-*`)

All variables in this group are used exclusively by the **Quiz Embedded** trigger.

| Variable | Default | Purpose |
|---|---|---|
| `--cui-sg-font-family` | `Inter, Helvetica, Arial, sans-serif` | Font family |
| `--cui-sg-container-border-radius` | `8px` | Container corner radius |
| `--cui-sg-container-box-shadow` | `0 4px 6px rgba(0,0,0,0.1)` | Container drop shadow |
| `--cui-sg-header-icon-size` | `24px` | Close / back icon size |
| `--cui-sg-question-font-size` | `16px` | Question text font size |
| `--cui-sg-optional-color` | `#9ca3af` | "Optional" label color |
| `--cui-sg-textarea-font-size` | `14px` | Textarea font size |
| `--cui-sg-textarea-border-color` | `#d1d5db` | Textarea border color at rest |
| `--cui-sg-textarea-border-color--focus` | `#60a5fa` | Textarea border color when focused |
| `--cui-sg-progress-bar-color` | `gold` | Progress bar fill color |
| `--cui-sg-progress-question-counter-color` | `#6b7280` | Question counter text color |
| `--cui-sg-progress-question-counter-font-size` | `14px` | Question counter font size |
| `--cui-sg-option-button-font-size` | `14px` | Option button font size |
| `--cui-sg-option-button-border-radius` | `6px` | Option button corner radius |
| `--cui-sg-option-button-background-color` | `#8D9DB91A` | Option button background at rest |
| `--cui-sg-option-button-background-color--selected` | `#002840` | Option button background when selected |
| `--cui-sg-option-button-border-color` | `#8D9DB91A` | Option button border at rest |
| `--cui-sg-option-button-border-color--selected` | `#002840` | Option button border when selected |
| `--cui-sg-option-button-text-color` | `#002840` | Option button text at rest |
| `--cui-sg-option-button-text-color--selected` | `white` | Option button text when selected |
| `--cui-sg-recommendation-button-border-radius` | `22px` | Recommendation button corner radius |
| `--cui-sg-recommendation-button-background-color` | — | Recommendation button background at rest |
| `--cui-sg-recommendation-button-background-color--hover` | — | Recommendation button background on hover |
| `--cui-sg-recommendation-button-background-image` | — | Recommendation button background gradient |
