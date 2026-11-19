# Hooks and browser events

The widget tells your page what happens in the chat — it opened, the shopper sent a message, a product was added to the cart — through **hooks**. Every hook is also dispatched as a browser `CustomEvent` on `window`, so there are three ways to react, depending on how the widget reaches your page:

| Your integration | How to listen | What you receive |
|---|---|---|
| Any: the widget is delivered by an Engagement weblayer, or you set up `window.CLARITY_CONFIG` yourself | `window.addEventListener('Clarity:<hook>', e => …)`. Weblayer-delivered: nothing to configure. Standalone: set `hooks: { version: 'WBL_BUNDLE' }` even if you register no callbacks. See [Browser events](#browser-events). Trigger events (`ClarityTrigger:<hook>`) exist only with a weblayer | `event.detail`: the params object documented on this page |
| Weblayer-delivered, with callbacks set in the weblayer's [`widget.hooks`](./weblayer-config.md#widget--clarity-widget-settings) or a trigger's `hooks` | The callbacks run in addition to the weblayer's own analytics tracking. See [Hooks on a weblayer page](#hooks-on-a-weblayer-page) | The params object (`WBL_BUNDLE` format) |
| Standalone `window.CLARITY_CONFIG` | [`hooks: { version: 'WBL_BUNDLE', … }`](./widget-config.md#hooks--event-hooks). See [The `hooks` object](#the-hooks-object) | The params object |

Hooks come in three groups. **Engagement hooks** describe what the shopper and the assistant did; when the widget is weblayer-delivered, the weblayer tracks each of them to Engagement analytics under the **action** listed with the hook — the tracked fields are in [`analytics-events.md`](./analytics-events.md). **Function hooks** are actionable callbacks (e.g. "a response is being processed") and are not tracked. **Trigger hooks** come from the weblayer's trigger templates (floating button, PDP/PLP embeds, search suggestions, quiz), not from the chat itself.

---

## The `hooks` object

`version` must be `'WBL_BUNDLE'`: it is the only supported format, and the weblayer always uses it. Every callback receives one params object (`processingMessage` a boolean), which is also the shape of `event.detail` on the [browser events](#browser-events).

```typescript
hooks: {
  version: 'WBL_BUNDLE'
  // Functional hooks (not for logging):
  reloadStarted?: (a: HookParams) => void
  initialMessage?: (a: HookParams) => void
  searchedProducts?: (a: HookParams) => void
  processingMessage?: (processing: boolean) => void

  // Engagement event hooks:
  initialized?: (a: HookParams) => void
  reloaded?: (a: HookParams) => void
  chatOpen?: (a: HookParams) => void
  chatClosed?: (a: HookParams) => void
  widgetShown?: (a: HookParams) => void
  badgeHidden?: (a: HookParams) => void
  userRespond?: (a: HookParams) => void
  clarityRespond?: (a: HookParams) => void
  clarityError?: (a: HookParams) => void
  // ... every engagement hook listed below
}
```

### Hooks on a weblayer page

- **For one weblayer:** callbacks in its [`widget.hooks`](./weblayer-config.md#widget--clarity-widget-settings), set by your Bloomreach contact, are called while that weblayer's banner is the active source, that is, while the widget runs on that weblayer's settings.
- **For every weblayer on the page:** set them on `window.CLARITY_CONFIG.hooks` from your page. Add to that object rather than replacing it, so it works whether your script runs before or after the weblayer:

  ```javascript
  window.CLARITY_CONFIG = window.CLARITY_CONFIG || {}
  window.CLARITY_CONFIG.hooks = {
    ...window.CLARITY_CONFIG.hooks,
    version: 'WBL_BUNDLE',
    searchedProducts: (a) => { /* … */ },
  }
  ```

- **Both:** for a [function hook](#function-hooks), the weblayer's callback replaces the page's while its banner is active. An engagement hook set in both places is called from both.

Of the function hooks, mobile AI Mode fires only `processingMessage`; the others are fired by the default widget only. A trigger's `hooks` are called for that trigger's own events.

---

## Clarity Hooks

Fired by the chat widget. Each hook lists the analytics **action** the weblayer tracks it under; _(none)_ means it is not tracked. `chatOpen`, `chatClosed` and `badgeHidden` are tracked under their own [`action`](#property-reference) param when they carry one (for example `expand_from_minimized`).

Mobile AI Mode fires only `initialized`, `widgetShown`, `chatClosed`, `userRespond`, `clarityRespond`, `externalAgentRespond`, `urlClick`, `miniPdpClick`, `closeMiniPdp`, `clarityWarning` and `clarityError`, each with `agent_id`, `source` and the hook's own fields only; the per-product and per-button hooks are not fired.

### Hook → Action mapping

| Hook | Action |
|---|---|
| `initialized` | _(none — not forwarded to analytics)_ |
| `reloaded` | _(none — not forwarded to analytics)_ |
| `chatOpen` | `chat_open` |
| `chatClosed` | `chat_closed` |
| `widgetShown` | `show` |
| `badgeHidden` | `close` |
| `initialMessageBubbleHidden` | `close_bubble` |
| `userRespond` | `user_respond` |
| `userRespondProduct` | `user_respond_product` |
| `clarityRespond` | `clarity_respond` |
| `clarityRespondProduct` | `clarity_respond_product` |
| `clarityRespondButton` | `clarity_respond_button` |
| `externalAgentRespond` | `external_agent_respond` |
| `externalAgentRespondFailed` | `external_agent_respond_failed` |
| `urlClick` | `url_click` |
| `addToCart` | `add_to_cart` |
| `checkout` | `checkout` |
| `purchase` | `purchase` |
| `checkoutCancel` | `checkout_cancel` |
| `checkoutError` | `checkout_error` |
| `miniPdpClick` | `mini_pdp_click` |
| `closeMiniPdp` | `close_mini_pdp` |
| `selectProduct` | `product_select` |
| `deselectProduct` | `product_deselect` |
| `productMenuClick` | `product_menu_click` |
| `buttonClick` | `menu_click` |
| `changeSize` | `change_size` |
| `thumbsUp` / `thumbsDown` | `thumbs_up` / `thumbs_down` |
| `surveyShow` | `show` |
| `surveyClosed` | `close_survey` |
| `feedbackSubmitted` | `submit_feedback` |
| `clarityWarning` | `clarity_warning` |
| `clarityError` | `clarity_error` |
| `log` | _(dynamic — the lowercased log `subType`)_ |
| `clarityDebug` | `clarity_debug` _(diagnostic; fields not part of the contract)_ |
| Function hooks (`processingMessage`, `reloadStarted`, `initialMessage`, `searchedProducts`) | _(none — actionable callbacks)_ |

### Engagement Hooks

#### `initialized`

Fired once when the plugin finishes initializing.

**Action:** _(none — not forwarded to analytics `track`)_

> Fired before the chat state exists, so it does **not** include `conversation_state`, `chat_widget_state`, `chat_widget_size`, or `chat_config`.

Fields: `agent_id`, `source`, `has_chat`, `has_user_message`

---

#### `reloaded`

Fired after the chat reloads because it was cleared in this tab (clear-chat button or `delete_chat`).

**Action:** _(none — not forwarded to analytics)_

Fields: `agent_id`, `source`, `conversation_state` (always `'welcome_message'`), `chat_widget_state`, `chat_widget_size`, `chat_config`, `state`

---

#### `chatOpen`

Fired when the user explicitly expands the chat widget.

**Action:** `chat_open`

Fields: `agent_id`, `source`, `conversation_state`, `chat_config`, `action`?, `button_text`?, `chat_opened_from_trigger`?, `chat_opened_from_trigger_component`?

---

#### `chatClosed`

Fired when the user minimizes the chat widget. AI Mode fires it from its close button.

**Action:** `chat_closed`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_size`, `chat_config`, `action`?

---

#### `widgetShown`

Fired when the widget becomes visible (on page load or after a trigger reveals it).

**Action:** `show` (the weblayer also adds `most_recently_clicked_trigger`)

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_state`, `chat_widget_size`, `chat_config`, `component`, `component_template`, `action`?, `button_text`?, `chat_opened_from_trigger`?, `chat_opened_from_trigger_component`?

When `chat_widget_state` is `'bubble'`, also includes: `initial_message`?, `initial_message_product_ids`?, `initial_message_quick_replies`?

---

#### `badgeHidden`

Fired when the user closes the widget entirely.

**Action:** `close`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_size`?, `chat_config`, `action`? (e.g. `'close_chat_from_trigger'`, `'close_chat_from_minimized'`)

---

#### `initialMessageBubbleHidden`

Fired when the user dismisses the initial message bubble.

**Action:** `close_bubble`

Fields: `agent_id`, `source`, `conversation_state`, `chat_config`

---

#### `userRespond`

Fired when the user sends any message (text, button, or quick reply).

**Action:** `user_respond`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_size`, `chat_config`, `type`, `button_text`?, `button_payload`?, `target`?, `product_ids`?, `product_names`?, `clicked_in_trigger`?

> When `product_ids` is non-empty, `userRespondProduct` is also fired once per product.

---

#### `userRespondProduct`

Sub-hook fired once per product when the user responds with selected products. Always fires alongside `userRespond`.

**Action:** `user_respond_product`

Fields: same as `userRespond` **except** no `product_ids`. Adds: `product_id`, `product_category`?

---

#### `clarityRespond`

Fired when the Clarity AI sends a response.

**Action:** `clarity_respond`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_state`, `chat_widget_size`, `chat_config`, `type`, `message`?, `product_ids`?, `products_display_type`, `carousel_product_ids`?, `response_source`?, `suggested_buttons`?, `prompts`?, `qrs`?, `latency`?, `server_latency`?, `intent_type` (`'other'` when none was detected), `invalid_user_response`?, `blocked_clarity_response`?, `traffic_type`?, `total_token_count`?, `llm_call_count`?, `user_respond_source` (defaults to `'in_chat'`)

> When `product_ids` is non-empty, `clarityRespondProduct` is also fired once per product.
> When `suggested_buttons` is non-empty, `clarityRespondButton` is also fired once per button.
> `suggested_buttons`, `prompts` and `qrs` only carry buttons the widget shows: with [`ui.hideSimilarCarouselPrompts`](./widget-config.md#display-toggles) on, a similar-products response reports all three empty.

---

#### `clarityRespondProduct`

Sub-hook fired once per product in a Clarity response. Always fires alongside `clarityRespond`.

**Action:** `clarity_respond_product`

Fields: same as `clarityRespond` **except** no `product_ids`, `carousel_product_ids`, `prompts`, or `qrs` (`suggested_buttons` stays, so a product row still names the buttons shown with it). Adds: `product_id`, `product_category`?, `product_display_type`

> If `ui.productAttributesToLog` is configured, each listed product property is also spread onto this event as its own top-level field, named after the property. See `productAttributesToLog` in [`widget-config.md`](./widget-config.md).

---

#### `clarityRespondButton`

Sub-hook fired once per suggested button in a Clarity response. Always fires alongside `clarityRespond`.

**Action:** `clarity_respond_button`

Fields: same as `clarityRespond` **except** no `product_ids`, `carousel_product_ids`, `prompts`, `qrs`, or `suggested_buttons`. Adds: `button_text`, `button_type`

---

#### `externalAgentRespond`

Fired when an external agent returns a response — the provider's own bot (`response_source`
`'ai_agent'`) or a human agent (`'live_agent'`).

**Action:** `external_agent_respond`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_state`, `chat_widget_size`, `chat_config`, `agent_type`, `agent_name`, `message`?, `error_message`?, `response_json`, `response_source`, `external_conversation_id`?, `latency`?, `received_at`?, `delay_ms`?

> A reply delivered asynchronously by helpdesk webhook (e.g. Zendesk Sunshine Conversations) answers
> no request, so it carries `received_at` (when the backend received it) and `delay_ms` instead of
> `latency`.

---

#### `externalAgentRespondFailed`

Fired when a message or update an external agent sent by helpdesk webhook (e.g. Zendesk Sunshine
Conversations) could not be processed; the shopper sees an error message. It belongs to no shopper
message.

**Action:** `external_agent_respond_failed`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_state`, `chat_widget_size`, `chat_config`, `agent_type`, `agent_name`, `error_message`, `external_conversation_id`, `received_at`

---

#### `urlClick`

Fired when the user clicks a link in the chat: a product link, a link in a message, or See all results.

**Action:** `url_click`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_size`, `chat_config`, `link_type`, `product_id`?, `product_category`?, `url`?, `link_text`? (text links and SRP links)

> If `ui.productAttributesToLog` is configured, each listed product property is also spread onto this event as its own top-level field, named after the property. See `productAttributesToLog` in [`widget-config.md`](./widget-config.md).

---

#### `addToCart`

Fired when the user clicks an add-to-cart button. Every click that reaches the handler logs (disabled buttons never fire), so the event fires even when no `fn.addToCart` is configured. Add-to-cart clicks never navigate to the product page (unlike `urlClick`).

**Action:** `add_to_cart`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_size`, `chat_config`, `product_id`, `product_category`?, `location`

`location` is where the click originated: `'product card'` \| `'miniPDP'` \| `'customized product card'` \| `'customized product carousel'` \| `'customized miniPDP'`.

---

#### `checkout`

Fired when the shopper starts a PayPal checkout with the mini PDP's **Buy now** button (shown when `ui.enableCheckOut` is on). Fires before the checkout overlay opens.

**Action:** `checkout`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_size`, `chat_config`, `product_ids`, `checkout_location`, `checkout_provider`, `product_category`?

`product_ids` are the item ids before `ui.paypalProductIdPrefix` is applied. `checkout_location` is `'quick_view'` (the mini PDP). `checkout_provider` is always `'paypal'`.

---

#### `purchase`, `checkoutCancel`, `checkoutError`

Each `checkout` settles at most once, with one of these three hooks. A checkout still open when the shopper leaves the page fires none of them.

| Hook | Action | Fired when | Fields |
|---|---|---|---|
| `purchase` | `purchase` | PayPal approved the payment | same as `checkout`, plus `order_id`? (the PayPal order id) |
| `checkoutCancel` | `checkout_cancel` | the checkout ended without a payment or an error | same as `checkout`, plus `message` |
| `checkoutError` | `checkout_error` | setting up the checkout failed (the PayPal client token request or loading the PayPal SDK) or took longer than 45 seconds, or the PayPal SDK threw (e.g. the cart could not be created because an item id is unknown to PayPal) or returned an unexpected status | same as `checkout`, plus `error`: the failure's message, `'PayPal setup timed out'` for the 45-second limit, or `'PayPal status <status>'` for an unexpected status |

`message` of `checkoutCancel` says what ended the checkout: `'paypal_closed'` (the shopper closed the PayPal checkout without paying), `'chat_closed'` (the chat was closed, cleared or reset while the checkout was open) or `'new_checkout'` (the shopper started another checkout before this one settled).

---

#### `miniPdpClick`

Fired when the user opens the mini PDP panel.

**Action:** `mini_pdp_click`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_size`, `chat_config`, `product_id`, `product_category`?, `url`?

---

#### `closeMiniPdp`

Fired when the mini PDP panel closes.

**Action:** `close_mini_pdp`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_size`, `chat_config`, `product_id`?, `url`?

---

#### `selectProduct`

Fired when the user selects one or more products.

**Action:** `product_select`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_size`, `chat_config`, `current_selection`, `product_id`? (single select), `select_all`? (multi-select), `suggested_buttons`?, `type`? (`'product_card_menu'` when triggered from the product card menu's "Ask follow up")

---

#### `deselectProduct`

Fired when the user deselects one or more products.

**Action:** `product_deselect`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_size`, `chat_config`, `product_id`? (single deselect), `current_selection`? (single deselect), `deselect_all`? (multi-deselect), `deselected_products`? (multi-deselect), `suggested_buttons`?

---

#### `productMenuClick`

Fired the moment the user clicks one of the actions in a product menu. Captures menu engagement directly, in addition to the downstream event the chosen action triggers (`selectProduct` for "Ask follow up", `userRespond`/`userRespondProduct` for "Find similar", `urlClick` for "Go to product page"). The `source_type` field identifies where the menu was invoked from: the built-in template or a customized product card (`'product_card'`), a customized carousel (`'carousel'`), or a customized miniPDP / quick view (`'quick_view'`). The `onFollowUp` / `onShowSimilar` callbacks of a customized carousel log `'carousel'`; the built-in menu it opens through `onEllipsisClick` logs `'product_card'`.

**Action:** `product_menu_click`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_state`, `chat_widget_size`, `chat_config`, `button_content` (`'ask follow up'` \| `'find similar'` \| `'go to product page'`), `source_type` (`'product_card'` \| `'carousel'` \| `'quick_view'`), `product_id`, `product_category`?

---

#### `buttonClick`

Fired when the user clicks a menu button inside the widget.

**Action:** `menu_click`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_size`, `chat_config`, `button_content`, `url`?

---

#### `changeSize`

Fired when the user toggles the widget between small and large.

**Action:** `change_size`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_size`, `chat_config`, `set_size_to`

---

#### `thumbsUp` / `thumbsDown`

Fired when the user reacts to a message with thumbs up or down, and again when they add a comment to that reaction (then with `feedback_message`).

**Action:** `thumbs_up` / `thumbs_down`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_size`, `chat_config`, `feedback_target_text`?, `feedback_target_product_ids`?, `feedback_message`?

---

#### `surveyShow`

Fired when the feedback survey dialog is displayed.

**Action:** `show`

> Does **not** include `conversation_state`, `chat_widget_state`, `chat_widget_size`, or `chat_config`.

Fields: `agent_id`, `source`, `component`, `component_template`

---

#### `surveyClosed`

Fired when the user closes the survey, also after submitting it.

**Action:** `close_survey`

Fields: `agent_id`, `source`

---

#### `feedbackSubmitted`

Fired when the user picks a survey score, and again when they submit a comment (then with `feedback_message`).

**Action:** `submit_feedback`

Fields: `agent_id`, `source`, `feedback_state`?, `feedback_message`?

---

#### `clarityWarning`

Fired when a non-fatal warning is logged (e.g. inject event failure).

**Action:** `clarity_warning`

Fields: `agent_id`, `source`, `conversation_state`, `chat_widget_state`, `chat_widget_size`, `chat_config`, `location` (`'Back-end'`, `'Front-end'` or an `'FE:…'` origin), `type`, `message` (truncated to 2000 chars), `agent_name`?

---

#### `clarityError`

Fired when a fatal error is logged.

**Action:** `clarity_error`

Fields: `agent_id`, `source`, `conversation_state`, `location`, `type`, `message` (truncated to 2000 chars), `chat_widget_state`?, `chat_widget_size`?, `chat_config`?, `latency`?, `agent_name`?

> Errors reported while handling a chat response (`location` `'Back-end'`) carry the widget-state fields and `latency`. Errors caught in the widget itself (`location` `'FE:user_active'` \| `'FE:user_passive'` \| `'FE:chat_closed'` \| `'FE:app_error_boundary'`) carry none of them, and `conversation_state` may be an empty string.

---

#### `log`

Fired for backend diagnostic `LOG` events. The action is dynamic: the lowercased `subType` of the log event. The fields of the event's `data` object are copied onto the params; they depend on the `subType` and are not part of the documented contract.

**Action:** the lowercased log `subType`

---

#### `clarityDebug`

Fired for widget-internal diagnostics, for example when a response stream had to be buffered.

**Action:** `clarity_debug`

Fields: `agent_id`, `source`, `type`, `message`. Diagnostic only; the fields are not part of the documented contract.

---

### Function Hooks

Actionable callbacks rather than analytics: the weblayer does not track them. Set them in `hooks` (on a weblayer page, see [Hooks on a weblayer page](#hooks-on-a-weblayer-page)), or listen to their `Clarity:*` browser event.

#### `processingMessage`

Fired when the widget starts and finishes sending to the chat: every message, and also background sends such as the chat sync on page load.

```ts
processingMessage?: (processing: boolean) => void
```

`processing` — `true` when the send starts, `false` when it finishes. While an answer streams, `true` can repeat with a new `notificationText`.

> The `CustomEvent` carries the full params (`processing`, `agent_id`, `source`, `notificationText`), but the handler function receives only the `boolean`.

---

#### `reloadStarted`

Fired just before the chat is cleared (the clear-chat button or `delete_chat`).

```ts
reloadStarted?: (a: HookParams) => void
```

Fields: `agent_id`, `source`, `user_action`?

`user_action` — `true` if the reload was triggered by the user.

---

#### `initialMessage`

Fired after the initial assistant message loads, before any user interaction.

```ts
initialMessage?: (a: HookParams) => void
```

Fields: `agent_id`, `source`, `text`?, `qrs`?

---

#### `searchedProducts`

Fired when search results are handed to the page instead of rendering in the chat (see [`ui.fn.hideSearchResultCarousels`](./widget-config.md#function-overrides)), carrying those batches.

```ts
searchedProducts?: (a: HookParams) => void
```

Fields: `agent_id`, `source`, `products_data`?, `from_history`?

`products_data` — array of `{ rephrased_query?: string, result_source: 'SEARCH', data: CarouselItem[] }`: only plain search batches are handed to the page.
`from_history` — `true` when loaded from existing chat history.

---

### Property Reference

The properties that can appear in the params object of an engagement hook.

| Property | Type | Description | Hooks |
|---|---|---|---|
| `agent_id` | `string` | Persona ID | all |
| `source` | `string` | Weblayer identifier (`"{weblayerId}::{weblayerName}"`) | all (not passed to the engagement callbacks of a weblayer's `widget.hooks`; `event.detail` has it) |
| `conversation_state` | `string` | State of the conversation at the time of the event. Values: `'conversation'` (user active within last 10 min) \| `'idle'` (last user message over 10 min ago, or events exist but no user messages) \| `'initial_message'` (only the assistant's initial message, no user messages) \| `'welcome_message'` (the agent's default greeting is showing instead of a configured initial message, no user messages) \| `'home_screen'` (home screen mode, no messages) \| `'none'` (completely empty). Can be an empty string on a `clarityError` caught in the widget itself | all engagement hooks except `initialized`, `surveyShow`, `surveyClosed`, `feedbackSubmitted` |
| `chatId` | `string` | ID of the chat conversation (the tracked event also carries it as `chat_id`) | all engagement hooks except `initialized`, `surveyShow`, `surveyClosed`, `feedbackSubmitted`, and `clarityError` caught in the widget itself |
| `chat_widget_state` | `string` | Visibility state of the widget: `'open'` \| `'bubble'` \| `'minimized'` | `reloaded`, `widgetShown`, `productMenuClick`, `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton`, `externalAgentRespond`, `externalAgentRespondFailed`, `clarityWarning`, `clarityError` (`'Back-end'` only) |
| `chat_widget_size` | `string` | Size of the open widget: `'large'` \| `'small'` \| `'full_screen'` \| `'half_screen'`. Only present when `chat_widget_state` is `'open'` | all engagement hooks except `initialized`, `surveyShow`, `surveyClosed`, `feedbackSubmitted`, and `clarityError` caught in the widget itself |
| `chat_config` | `object` | Snapshot of the plugin config at the time of the event (sensitive keys excluded) | all engagement hooks except `initialized`, `surveyShow`, `surveyClosed`, `feedbackSubmitted`, and `clarityError` caught in the widget itself |
| `has_chat` | `boolean` | Whether the chat has any messages | `initialized` |
| `has_user_message` | `boolean` | Whether the user has ever sent a message | `initialized` |
| `state` | `number` | Numeric code of the reload reason | `reloaded` |
| `action` | `string` | Describes what triggered the event. `chatOpen`: `'expand_from_trigger'` \| `'expand_from_bubble'` \| `'expand_from_minimized'`; `chatClosed`: `'minimize_from_open'`; `badgeHidden`: `'close_chat_from_trigger'` \| `'close_chat_from_minimized'` \| `'close_chat_from_open_on_mobile'` \| `'minimize_from_open'` (close button with `ui.skipMinimize`) | `chatOpen`, `chatClosed`, `badgeHidden`, `widgetShown` |
| `button_text` | `string` | Label of the button that triggered the event | `chatOpen`, `widgetShown`, `userRespond`, `userRespondProduct`, `clarityRespondButton` |
| `button_payload` | `string` | JSON-encoded payload attached to the clicked button or quick reply (e.g. `target`, `source`, `productIds`, plus any merchant-defined fields). Serialized via `JSON.stringify` | `userRespond`, `userRespondProduct` |
| `chat_opened_from_trigger` | `string` | Name of the trigger banner that opened the chat | `chatOpen`, `widgetShown` |
| `chat_opened_from_trigger_component` | `string` | Trigger component (e.g. trigger template) that opened the chat | `chatOpen`, `widgetShown` |
| `clicked_in_trigger` | `string` | Trigger banner name associated with the chat session when the user responded | `userRespond`, `userRespondProduct` |
| `product_names` | `string[]` | Titles of the products in `product_ids`. In the callback and `event.detail` only, not on the tracked event | `userRespond` |
| `user_respond_source` | `string` | Trigger component (e.g. trigger template) that opened the chat for this response. Defaults to `'in_chat'` when the response did not originate from a trigger | `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton` |
| `component` | `string` | Component identifier. `'chat'` (`'ai_mode'` in AI Mode) for `widgetShown`, `'feedback_survey'` for `surveyShow` | `widgetShown`, `surveyShow` |
| `component_template` | `string` | Component template version. `'chat_v1'`, `'ai_mode_v1'` or `'feedback_survey_v1'` | `widgetShown`, `surveyShow` |
| `initial_message` | `string` | Text of the initial assistant message shown in the bubble | `widgetShown` (bubble state) |
| `initial_message_product_ids` | `string[]` | Product IDs shown in the initial carousel bubble | `widgetShown` (bubble state) |
| `initial_message_quick_replies` | `object` | Quick reply config from the initial message bubble | `widgetShown` (bubble state) |
| `type` | `string` | Describes the nature of the event. For `userRespond`: `'text'` \| `'quick_reply'` \| `'suggestion_button'` \| `'trigger_button'` \| `'agent_button'` \| `'agent_form'` \| `'product_card_menu'`. For `clarityRespond`: `'text'` \| `'carousel'` \| `'text_with_carousel'`. For `selectProduct`: `'product_card_menu'` (only when triggered from the product card menu) | `userRespond`, `userRespondProduct`, `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton`, `selectProduct`, `clarityWarning`, `clarityError` |
| `target` | `string` | Intent target for quick reply messages (e.g. `'find_similar_or_compatible_products'`) | `userRespond`, `userRespondProduct` |
| `product_ids` | `string[]` | All product IDs involved in the event | `userRespond`, `clarityRespond`, `checkout`, `purchase`, `checkoutCancel`, `checkoutError` |
| `checkout_location` | `string` | Where the checkout started: `'quick_view'` (mini PDP Buy now) | `checkout`, `purchase`, `checkoutCancel`, `checkoutError` |
| `checkout_provider` | `string` | Payment provider, currently always `'paypal'` | `checkout`, `purchase`, `checkoutCancel`, `checkoutError` |
| `order_id` | `string` | PayPal order id of a successful purchase | `purchase` |
| `error` | `string` | Error message of the failed checkout | `checkoutError` |
| `product_id` | `string` | Single product ID (used in per-product sub-hooks and link/PDP click hooks) | `userRespondProduct`, `clarityRespondProduct`, `urlClick`, `addToCart`, `miniPdpClick`, `closeMiniPdp`, `selectProduct`, `deselectProduct`, `productMenuClick` |
| `product_category` | `string` | Value of the merchant-configured category attribute for the product | `userRespondProduct`, `clarityRespondProduct`, `urlClick`, `addToCart`, `checkout`, `purchase`, `checkoutCancel`, `checkoutError`, `miniPdpClick`, `productMenuClick` |
| `source_type` | `string` | Where a product menu action was invoked from: `'product_card'` \| `'carousel'` \| `'quick_view'` | `productMenuClick` |
| `product_display_type` | `string` | How a single product was displayed: `'carousel'` \| `'thumbnail'` | `clarityRespondProduct` |
| `products_display_type` | `string` | How products in a response were displayed: `'carousel'` \| `'thumbnail'` \| `'carousel_with_thumbnail'` | `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton` |
| `carousel_product_ids` | `string[]` | Subset of `product_ids` that appeared in the carousel (vs thumbnail) section | `clarityRespond` |
| `message` | `string` | Text content of a response or warning/error description; for `checkoutCancel`, what ended the checkout | `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton`, `externalAgentRespond`, `clarityWarning`, `clarityError`, `checkoutCancel` |
| `response_source` | `string` | Source of a response, derived from response metadata. Clarity responses: `'PDKB'` \| `'PDKBG'` (product question answered from the knowledge base, `G` = with general knowledge) \| `'KB'` \| `'KBG'` (knowledge-base question) \| `'gk'` (general knowledge only); absent for a plain product search. External agents: `'ai_agent'` (the provider's bot) \| `'live_agent'` (a human agent) | `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton`, `externalAgentRespond` |
| `suggested_buttons` | `Prompt[]` | All suggestion buttons in a Clarity response (quick replies + prompt buttons combined) | `clarityRespond`, `clarityRespondProduct`, `selectProduct`, `deselectProduct` |
| `prompts` | `Prompt[]` | Prompt-type buttons only | `clarityRespond` |
| `qrs` | `QuickReply[]` | Quick reply buttons only | `clarityRespond`, `initialMessage` |
| `latency` | `number` | Response time in milliseconds | `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton`, `externalAgentRespond`, `clarityError` (`'Back-end'` only) |
| `intent_type` | `string` | Detected intent type for a Clarity response, e.g. `'search'` \| `'product_question'` \| `'kb_question'` \| `'similar_search'` \| `'unclear'` \| `'general'`; `'other'` when none was detected | `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton` |
| `server_latency` | `string` | Backend-reported response time, reported by the backend | `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton` |
| `traffic_type` | `string` | Backend-reported LLM traffic type, reported by the backend | `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton` |
| `total_token_count` | `number` | Backend-reported total LLM token count, reported by the backend | `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton` |
| `llm_call_count` | `number` | Backend-reported number of LLM calls, reported by the backend | `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton` |
| `invalid_user_response` | `string` | The user's message text when Clarity could not understand the intent | `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton` |
| `blocked_clarity_response` | `string` | The original response text when it failed to pass the guardrail (present only when blocked) | `clarityRespond`, `clarityRespondProduct`, `clarityRespondButton` |
| `button_type` | `string` | Type of a suggestion button: `'fixed'` (system buttons) \| `'quick_reply'` \| `'suggested_question'` \| `'pdp_question'` | `clarityRespondButton` |
| `link_type` | `string` | Type of link clicked: `'product_card'` \| `'mini_pdp_product'` \| `'text_url'` \| `'product_card_menu'` \| `'srp_link'` | `urlClick` |
| `url` | `string` | URL associated with the clicked product or link | `urlClick`, `miniPdpClick`, `closeMiniPdp`, `buttonClick` |
| `link_text` | `string` | For `link_type` `'text_url'`, the visible text of the clicked link; for `'srp_link'`, the search query passed to the results page, or the category name when there is none | `urlClick` |
| `select_all` | `boolean` | `true` when multiple products are selected in a single action | `selectProduct` |
| `current_selection` | `string[]` | Full list of currently selected product IDs after the action | `selectProduct`, `deselectProduct` |
| `deselect_all` | `boolean` | `true` when multiple products are deselected in a single action | `deselectProduct` |
| `deselected_products` | `string[]` | IDs of all products removed in a multi-deselect action | `deselectProduct` |
| `button_content` | `string` | Button identifier. For `buttonClick`: `'Clear Chat'` \| `'Get Help'` \| `'Learn More'` \| `'Give Feedback'` \| `'End Conversation'`. For `productMenuClick`: `'ask follow up'` \| `'find similar'` \| `'go to product page'` | `buttonClick`, `productMenuClick` |
| `set_size_to` | `string` | Target widget size: `'small'` \| `'large'` | `changeSize` |
| `feedback_target_text` | `string` | The assistant message text that received a thumbs reaction (multiple messages joined by `\n\n`) | `thumbsUp`, `thumbsDown` |
| `feedback_target_product_ids` | `string[]` | Product IDs from carousels that received the thumbs reaction | `thumbsUp`, `thumbsDown` |
| `feedback_message` | `string` | Optional text comment submitted alongside a reaction or survey | `thumbsUp`, `thumbsDown`, `feedbackSubmitted` |
| `feedback_state` | `number` | Numeric score from a survey submission | `feedbackSubmitted` |
| `agent_type` | `string` | Type of external agent. Always `'customer service'` | `externalAgentRespond`, `externalAgentRespondFailed` |
| `agent_name` | `string` | External agent identifier. On `clarityWarning` and `clarityError`, set only when the widget failed to receive that agent's replies (its reply stream, or a chat sync while the widget is waiting for that agent's replies) | `externalAgentRespond`, `externalAgentRespondFailed`, `clarityWarning`, `clarityError` |
| `error_message` | `string` | Why the exchange with an external agent failed. On `externalAgentRespondFailed`, the processing step that failed and the error type | `externalAgentRespond`, `externalAgentRespondFailed` |
| `response_json` | `string` | JSON-encoded array of attachments from an external agent | `externalAgentRespond` |
| `external_conversation_id` | `string` | Sierra's conversation ID; for a helpdesk hand-over (e.g. Zendesk), the chat's own ID | `externalAgentRespond`, `externalAgentRespondFailed` |
| `location` | `string` | For `clarityWarning`/`clarityError`: origin of the warning or error — `'Back-end'` (raised while handling a chat response), `'Front-end'` (warning: injecting events failed), or where the widget caught it: `'FE:user_active'` \| `'FE:user_passive'` \| `'FE:chat_closed'` \| `'FE:app_error_boundary'`. For `addToCart`: where the click originated (`'product card'` \| `'miniPDP'` \| `'customized product card'` \| `'customized product carousel'` \| `'customized miniPDP'`) | `clarityWarning`, `clarityError`, `addToCart` |

---

## Trigger Hooks

The **weblayer** trigger system (floating button, PDP/PLP embeds, search suggestions, quiz, etc.) fires its own event stream, separate from the Clarity hooks above. These are dispatched as `ClarityTrigger:{hookName}` `CustomEvent`s on `window`, and the weblayer listener forwards the analytics-mapped ones to `track('clarity', ...)`.

### Hook → Action mapping

| Hook | Action | When it fires |
|---|---|---|
| `show` | `show` | Trigger element enters the viewport (v1.x), or scroll-based detection (v2.0) |
| `actualShow` | `actual_show` | v2.0 only — element enters viewport via `IntersectionObserver` |
| `clicked` | `trigger_clicked` | User clicks the trigger / a conversation-starter question |
| `error` | `trigger_error` | Recoverable error inside a trigger (e.g. search or generated-questions fetch fails) |
| `initialized` | _(none — not tracked)_ | Trigger component mounted (search-suggestion template only) |
| `closed` | _(none — not tracked)_ | Reserved; no template fires it today |
| `suggestionsSearched` | _(none — not tracked)_ | Search-suggestion template starts a suggestion fetch |
| `suggestionsRendered` | _(none — not tracked)_ | Suggestion items rendered |

> Only `show`, `actualShow`, `clicked`, and `error` carry an analytics `action`. `initialized`, `suggestionsSearched`, and `suggestionsRendered` exist as `CustomEvent`s and custom-hook callbacks (`config.trigger.hooks`) but are not forwarded to `track`.

**Default attributes** — the tracked event carries the [default attributes](./analytics-events.md#default-attributes) on top of the fields below. `event.detail` carries only `source`, `agent_id`, `trigger_context_product_ids` (plus `trigger_context_product_ids_type` when set) and the hook-specific fields.

### Trigger Hook Details

#### `show`

**Action:** `show`

Fired when the trigger is already in / scrolls into the viewport (v1.x), or via scroll detection (v2.0). The search-suggestion template also fires it after every suggestion fetch, carrying the search context; the PLP category name arrives through the default attribute `plp_category_name`.

Fields: default attrs + `source`, `trigger_context_product_ids`, `trigger_conversation_starters_list`? (the questions shown), `trigger_conversation_starters_is_generated`?, `trigger_conversation_starters_generated`? (embedded templates), `search_text`? + `search_results`? (search-suggestion template)

---

#### `actualShow`

**Action:** `actual_show`

v2.0 only. Fired when the trigger element actually enters the viewport via `IntersectionObserver` (distinct from the scroll-based `show`).

Fields: default attrs + `source`, `trigger_context_product_ids`, `trigger_conversation_starters_list`?, `trigger_conversation_starters_is_generated`?, `trigger_conversation_starters_generated`? (embedded templates)

---

#### `clicked`

**Action:** `trigger_clicked`

Fired when the user clicks the trigger or one of its conversation-starter questions. Adds `chat_config` and the shared logging props (`conversation_state`, `chat_widget_state`, `chat_widget_size`).

Fields: default attrs + `source`, `trigger_context_product_ids`, `chat_config`, `conversation_state`?, `chat_widget_state`?, `chat_widget_size`?, `button_text`?, `button_text_is_generated`?, `trigger_conversation_starters_list`?, `trigger_conversation_starters_is_generated`?, `trigger_conversation_starters_generated`?

---

#### `error`

**Action:** `trigger_error`

Fired on a recoverable error inside a trigger (search fetch, generated-questions fetch, shared error handler). Carries `location: 'FE:user_passive'` and `interaction: true`.

Fields: default attrs + `source`, `trigger_context_product_ids`, `location`, `message`, `interaction`

---

#### `suggestionsSearched`

Not forwarded to analytics (no `action`). Fired by the search-suggestion template when a suggestion fetch starts (before results return). Dispatches `ClarityTrigger:suggestionsSearched` and invokes `config.trigger.hooks.suggestionsSearched`.

Fields: `source`, `agent_id`, `trigger_context_product_ids`, `search_text`

---

#### `initialized` / `closed` / `suggestionsRendered`

Not forwarded to analytics (no `action`). They dispatch `ClarityTrigger:{hook}` `CustomEvent`s and invoke any matching custom hook in `config.trigger.hooks`. `initialized` is fired by the search-suggestion template only; `closed` is reserved and fired by no template today; `suggestionsRendered` carries `trigger_conversation_starters_list`.

---

### Property Reference

All properties that can appear in the params object of a trigger hook.

| Property | Type | Description | Hooks |
|---|---|---|---|
| `source` | `string` | `banner_id` of the event source | all |
| `agent_id` | `string` | Persona ID | all |
| `chat_id` | `string` | ID of the chat conversation (`undefined` before the widget initializes) | tracked event only; `clicked` carries it in `event.detail` as `chatId` |
| `component` | `string` | Component identifier | tracked event only |
| `component_template` | `string` | Component template + version (e.g. `floating_trigger_v2`) | tracked event only |
| `interaction` | `boolean` | Whether the event is user-initiated | tracked event only; `error` also carries it in `event.detail` (always `true`) |
| `trigger_context_product_ids` | `string[]` | Product IDs extracted from the page by the trigger | all |
| `trigger_context_product_ids_type` | `string` | Which kind of ID `trigger_context_product_ids` holds: `'product_id'` \| `'item_id'`. Only when the weblayer config sets it | all |
| `plp_category_name` | `string` | PLP category name | tracked event only (default attribute) |
| `chat_config` | `object` | Snapshot of the plugin config (sensitive keys excluded) | `clicked` |
| `chat_widget_state` | `string` | Widget visibility state at click time | `clicked` |
| `chat_widget_size` | `string` | Size of the open widget at click time | `clicked` |
| `conversation_state` | `string` | Conversation state at click time | `clicked` |
| `trigger_conversation_starters_list` | `string[]` | Text of the conversation-starter questions shown in the trigger | `show`, `actualShow`, `clicked`, `suggestionsRendered` |
| `trigger_conversation_starters_is_generated` | `boolean` | Whether the starter list is AI-generated | `show`, `actualShow`, `clicked` |
| `trigger_conversation_starters_generated` | `boolean[]` | Per-question generated flags | `show`, `actualShow`, `clicked` |
| `button_text` | `string` | Text of the clicked conversation starter / button | `clicked` |
| `button_text_is_generated` | `boolean` | Whether the clicked question was AI-generated | `clicked` |
| `search_text` | `string` | Search query text | `show`, `suggestionsSearched` (search suggestion) |
| `search_results` | `string[]` | Search results returned | `show` (search suggestion) |
| `location` | `string` | Origin of an error (e.g. `'FE:user_passive'`) | `error` |
| `message` | `string` | Error description | `error` |

---

## Browser events

Every hook is also dispatched as a `CustomEvent` on `window`: `Clarity:{hookName}` for Clarity hooks, `ClarityTrigger:{hookName}` for trigger hooks (weblayer only). `event.detail` is the params object documented above. A weblayer-delivered widget needs nothing for this; a standalone `window.CLARITY_CONFIG` has to set `hooks: { version: 'WBL_BUNDLE' }` even when it registers no callbacks; otherwise only the function hooks and a legacy subset of the engagement hooks are dispatched, the latter mostly with a positional or empty `detail` and some under legacy names, not the shape on this page.

```js
window.addEventListener('Clarity:userRespond', (event) => {
  console.log(event.detail) // { source, agent_id, type, ... }
})
window.addEventListener('ClarityTrigger:clicked', (event) => {
  console.log(event.detail) // { source, agent_id, button_text, ... }
})
```

Every `Clarity:*` event includes `source` in `event.detail`, set to the current `CLARITY_CONFIG.source`; use it to tell apart events from different banners when several weblayers are active on the same page.

`processingMessage` is the only hook where the callback argument (the boolean) differs from the `CustomEvent` detail, which carries the full params object.

The event name is the hook name: `Clarity:chatOpen`, `Clarity:userRespond`, `Clarity:addToCart`, … for every hook under [Clarity Hooks](#clarity-hooks), engagement and function hooks alike, and `ClarityTrigger:show`, `ClarityTrigger:clicked`, … for the [Trigger Hooks](#trigger-hooks).
