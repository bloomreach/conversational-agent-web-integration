# Analytics events

When the widget is delivered by an Engagement weblayer, the weblayer tracks every engagement hook to Engagement as a `clarity` event. This page lists those events **by `action`**: the fields each one carries, each field's type or possible values, and the hook that contributes it (one action can be fed by more than one hook, e.g. `show`). Use it to build reports and segments in Engagement.

The same fields are what a hook callback or a `Clarity:*` browser event receives, so the page is also the field reference for [`hooks.md`](./hooks.md). In a standalone `window.CLARITY_CONFIG` integration nothing is tracked unless your own hooks forward it.

Extra properties can be added to every tracked event, or to a single hook's event, with the weblayer's [`trackerConfig`](./weblayer-config.md#widget--clarity-widget-settings) (`externalAgentRespond` and `externalAgentRespondFailed` receive only the `shared` extras). Hooks that are **not** tracked are listed under [Hooks with no action](#hooks-with-no-action).

---

## Default attributes

Every tracked event — widget and trigger alike — carries these attributes in addition to the fields listed per action:

`action`, `agent_id`, `chat_id`, `banner_id`, `banner_name`, `banner_type`, `variant_id`, `variant_name`, `variant_origin`, `path`, `interaction`, `component`, `component_template`, `plp_category_name`, `global_variant_id`, `global_variant_name`, `clarity_session_state`, `clarity_session_interaction_count`, plus the weblayer's `sharedTrackerConfig` and `trackerConfig.shared` extras.

---

## Clarity Actions

Optional fields are marked with `?`. `agent_id` / `conversation_state` / `chat_widget_size` / `chat_config` recur across most actions. Every action that carries `conversation_state` also carries `chatId` (the same value as the default attribute `chat_id`).

### `chat_open`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` — Persona ID | `chatOpen` |
| `conversation_state` | `'conversation'` \| `'idle'` \| `'initial_message'` \| `'welcome_message'` \| `'home_screen'` \| `'none'` | `chatOpen` |
| `chat_widget_size` | `'large'` \| `'small'` \| `'full_screen'` \| `'half_screen'` | `chatOpen` |
| `chat_config` | `object` — config snapshot (sensitive keys excluded) | `chatOpen` |
| `action?` | `string` — e.g. `'expand_from_trigger'` | `chatOpen` |
| `button_text?` | `string` | `chatOpen` |
| `chat_opened_from_trigger?` | `string` — trigger banner name | `chatOpen` |
| `chat_opened_from_trigger_component?` | `string` — trigger component | `chatOpen` |

### `chat_closed`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `chatClosed` |
| `conversation_state` | `string` (see `chat_open`) | `chatClosed` |
| `chat_widget_size` | `string` (see `chat_open`) | `chatClosed` |
| `chat_config` | `object` | `chatClosed` |
| `action?` | `'minimize_from_open'` | `chatClosed` |

### `show`

Fed by `widgetShown` (widget becomes visible) and `surveyShow` (feedback survey displayed). The weblayer also adds `most_recently_clicked_trigger` for `widgetShown`.

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `widgetShown`, `surveyShow` |
| `conversation_state` | `string` (see `chat_open`) | `widgetShown` |
| `chat_widget_state` | `'open'` \| `'bubble'` \| `'minimized'` | `widgetShown` |
| `chat_widget_size` | `string` (see `chat_open`) | `widgetShown` |
| `chat_config` | `object` | `widgetShown` |
| `component` | `'chat'` (widget) \| `'ai_mode'` (AI Mode) \| `'feedback_survey'` (survey) | `widgetShown`, `surveyShow` |
| `component_template` | `'chat_v1'` \| `'ai_mode_v1'` \| `'feedback_survey_v1'` | `widgetShown`, `surveyShow` |
| `action?` | `string` | `widgetShown` |
| `button_text?` | `string` | `widgetShown` |
| `chat_opened_from_trigger?` | `string` | `widgetShown` |
| `chat_opened_from_trigger_component?` | `string` | `widgetShown` |
| `initial_message?` | `string` — bubble state only | `widgetShown` |
| `initial_message_product_ids?` | `string[]` — bubble state only | `widgetShown` |
| `initial_message_quick_replies?` | `object` — bubble state only | `widgetShown` |

### `close`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `badgeHidden` |
| `conversation_state` | `string` (see `chat_open`) | `badgeHidden` |
| `chat_widget_size` | `string` (see `chat_open`) | `badgeHidden` |
| `chat_config` | `object` | `badgeHidden` |
| `action?` | `'close_chat_from_trigger'` \| `'close_chat_from_minimized'` \| `'close_chat_from_open_on_mobile'` \| `'minimize_from_open'` (close button with `ui.skipMinimize`) | `badgeHidden` |

### `close_bubble`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `initialMessageBubbleHidden` |
| `conversation_state` | `string` (see `chat_open`) | `initialMessageBubbleHidden` |
| `chat_widget_size` | `string` (see `chat_open`) | `initialMessageBubbleHidden` |
| `chat_config` | `object` | `initialMessageBubbleHidden` |

### `user_respond`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `userRespond` |
| `conversation_state` | `string` (see `chat_open`) | `userRespond` |
| `chat_widget_size` | `string` (see `chat_open`) | `userRespond` |
| `chat_config` | `object` | `userRespond` |
| `type` | `'text'` \| `'quick_reply'` \| `'suggestion_button'` \| `'trigger_button'` \| `'agent_button'` \| `'agent_form'` \| `'product_card_menu'` | `userRespond` |
| `button_text?` | `string` | `userRespond` |
| `button_payload?` | `string` — JSON-encoded payload | `userRespond` |
| `target?` | `string` — intent target, e.g. `'find_similar_or_compatible_products'` | `userRespond` |
| `product_ids?` | `string[]` | `userRespond` |
| `clicked_in_trigger?` | `string` — trigger banner name | `userRespond` |

### `user_respond_product`

Sub-event fired once per product alongside `user_respond`.

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `userRespondProduct` |
| `conversation_state` | `string` (see `chat_open`) | `userRespondProduct` |
| `chat_widget_size` | `string` (see `chat_open`) | `userRespondProduct` |
| `chat_config` | `object` | `userRespondProduct` |
| `type` | `string` (see `user_respond`) | `userRespondProduct` |
| `button_text?` | `string` | `userRespondProduct` |
| `button_payload?` | `string` — JSON-encoded payload | `userRespondProduct` |
| `target?` | `string` | `userRespondProduct` |
| `clicked_in_trigger?` | `string` | `userRespondProduct` |
| `product_id` | `string` | `userRespondProduct` |
| `product_category?` | `string` — merchant-configured category attribute | `userRespondProduct` |

### `clarity_respond`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `clarityRespond` |
| `conversation_state` | `string` (see `chat_open`) | `clarityRespond` |
| `chat_widget_state` | `'open'` \| `'bubble'` \| `'minimized'` | `clarityRespond` |
| `chat_widget_size` | `string` (see `chat_open`) | `clarityRespond` |
| `chat_config` | `object` | `clarityRespond` |
| `type` | `'text'` \| `'carousel'` \| `'text_with_carousel'` | `clarityRespond` |
| `message?` | `string` | `clarityRespond` |
| `product_ids?` | `string[]` | `clarityRespond` |
| `products_display_type` | `'carousel'` \| `'thumbnail'` \| `'carousel_with_thumbnail'` | `clarityRespond` |
| `response_source?` | `'PDKB'` \| `'PDKBG'` \| `'KB'` \| `'KBG'` \| `'gk'` — knowledge-base / general-knowledge answers; absent for a plain product search | `clarityRespond` |
| `suggested_buttons?` | `Prompt[]` — quick replies + prompts; empty when `ui.hideSimilarCarouselPrompts` hides a similar-products response's buttons | `clarityRespond` |
| `latency?` | `number` — ms | `clarityRespond` |
| `intent_type` | `string` — e.g. `'search'` \| `'product_question'` \| `'kb_question'` \| `'similar_search'` \| `'unclear'` \| `'general'`; `'other'` when none was detected | `clarityRespond` |
| `server_latency?` | `string` — backend-reported response time reported by the backend | `clarityRespond` |
| `invalid_user_response?` | `string` — user text when intent not understood | `clarityRespond` |
| `blocked_clarity_response?` | `string` — original text when blocked by guardrail | `clarityRespond` |
| `traffic_type?` | `string` — backend-reported LLM traffic type reported by the backend | `clarityRespond` |
| `total_token_count?` | `number` — backend-reported total LLM token count reported by the backend | `clarityRespond` |
| `llm_call_count?` | `number` — backend-reported number of LLM calls reported by the backend | `clarityRespond` |
| `user_respond_source` | `string` — trigger component that opened the chat; `'in_chat'` when not from a trigger | `clarityRespond` |

> The hook's `carousel_product_ids`, `prompts` and `qrs` are not tracked.

> The trigger context behind `user_respond_source` is kept across `user_respond` and released by the turn's terminal hook: `clarity_respond`, `clarity_error` or `clarity_warning`, whichever comes first.

### `clarity_respond_product`

Sub-event fired once per product alongside `clarity_respond`.

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `clarityRespondProduct` |
| `conversation_state` | `string` (see `chat_open`) | `clarityRespondProduct` |
| `chat_widget_state` | `string` (see `clarity_respond`) | `clarityRespondProduct` |
| `chat_widget_size` | `string` (see `chat_open`) | `clarityRespondProduct` |
| `chat_config` | `object` | `clarityRespondProduct` |
| `type` | `string` (see `clarity_respond`) | `clarityRespondProduct` |
| `message?` | `string` | `clarityRespondProduct` |
| `products_display_type` | `string` (see `clarity_respond`) | `clarityRespondProduct` |
| `suggested_buttons?` | `Prompt[]` (see `clarity_respond`) — the product rows keep the response's buttons; only `product_ids`, `carousel_product_ids`, `prompts` and `qrs` are dropped | `clarityRespondProduct` |
| `response_source?` | `string` (see `clarity_respond`) | `clarityRespondProduct` |
| `latency?` | `number` — ms | `clarityRespondProduct` |
| `intent_type` | `string` (see `clarity_respond`) | `clarityRespondProduct` |
| `server_latency?` | `string` — backend-reported response time reported by the backend | `clarityRespondProduct` |
| `invalid_user_response?` | `string` | `clarityRespondProduct` |
| `blocked_clarity_response?` | `string` | `clarityRespondProduct` |
| `traffic_type?` | `string` — backend-reported LLM traffic type reported by the backend | `clarityRespondProduct` |
| `total_token_count?` | `number` — backend-reported total LLM token count reported by the backend | `clarityRespondProduct` |
| `llm_call_count?` | `number` — backend-reported number of LLM calls reported by the backend | `clarityRespondProduct` |
| `user_respond_source` | `string` (see `clarity_respond`) | `clarityRespondProduct` |
| `product_id` | `string` | `clarityRespondProduct` |
| `product_category?` | `string` | `clarityRespondProduct` |
| `product_display_type` | `'carousel'` \| `'thumbnail'` | `clarityRespondProduct` |

> If `ui.productAttributesToLog` is configured, each listed product property is also spread onto this event as its own top-level field, named after the property (see `productAttributesToLog` in [`widget-config.md`](./widget-config.md)).

### `clarity_respond_button`

Sub-event fired once per suggested button alongside `clarity_respond`.

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `clarityRespondButton` |
| `conversation_state` | `string` (see `chat_open`) | `clarityRespondButton` |
| `chat_widget_state` | `string` (see `clarity_respond`) | `clarityRespondButton` |
| `chat_widget_size` | `string` (see `chat_open`) | `clarityRespondButton` |
| `chat_config` | `object` | `clarityRespondButton` |
| `type` | `string` (see `clarity_respond`) | `clarityRespondButton` |
| `message?` | `string` | `clarityRespondButton` |
| `products_display_type` | `string` (see `clarity_respond`) | `clarityRespondButton` |
| `response_source?` | `string` (see `clarity_respond`) | `clarityRespondButton` |
| `latency?` | `number` — ms | `clarityRespondButton` |
| `intent_type` | `string` (see `clarity_respond`) | `clarityRespondButton` |
| `server_latency?` | `string` — backend-reported response time reported by the backend | `clarityRespondButton` |
| `invalid_user_response?` | `string` | `clarityRespondButton` |
| `blocked_clarity_response?` | `string` | `clarityRespondButton` |
| `traffic_type?` | `string` — backend-reported LLM traffic type reported by the backend | `clarityRespondButton` |
| `total_token_count?` | `number` — backend-reported total LLM token count reported by the backend | `clarityRespondButton` |
| `llm_call_count?` | `number` — backend-reported number of LLM calls reported by the backend | `clarityRespondButton` |
| `user_respond_source` | `string` (see `clarity_respond`) | `clarityRespondButton` |
| `button_text` | `string` | `clarityRespondButton` |
| `button_type` | `'fixed'` \| `'quick_reply'` \| `'suggested_question'` \| `'pdp_question'` | `clarityRespondButton` |

### `external_agent_respond`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `externalAgentRespond` |
| `conversation_state` | `string` (see `chat_open`) | `externalAgentRespond` |
| `chat_widget_state` | `string` (see `clarity_respond`) | `externalAgentRespond` |
| `chat_widget_size` | `string` (see `chat_open`) | `externalAgentRespond` |
| `chat_config` | `object` | `externalAgentRespond` |
| `agent_type` | `'customer service'` | `externalAgentRespond` |
| `agent_name` | `string` | `externalAgentRespond` |
| `message?` | `string` | `externalAgentRespond` |
| `error_message?` | `string` | `externalAgentRespond` |
| `response_json` | `string` — JSON-encoded attachments array | `externalAgentRespond` |
| `response_source` | `'ai_agent'` (the provider's bot) \| `'live_agent'` (a human agent) | `externalAgentRespond` |
| `external_conversation_id?` | `string` | `externalAgentRespond` |
| `latency?` | `number` — ms, only when the reply answered a request the widget timed | `externalAgentRespond` |
| `received_at?` | `string` — ISO, when the backend received an asynchronously-delivered reply | `externalAgentRespond` |
| `delay_ms?` | `number` — ms between `received_at` and the reply being shown | `externalAgentRespond` |

A reply delivered by helpdesk webhook (e.g. Zendesk Sunshine Conversations) belongs to no request, so
it carries `received_at`/`delay_ms` instead of `latency`. `delay_ms` is measured against the client
clock and can skew; `received_at` is the server's own value.

### `external_agent_respond_failed`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `externalAgentRespondFailed` |
| `conversation_state` | `string` (see `chat_open`) | `externalAgentRespondFailed` |
| `chat_widget_state` | `string` (see `clarity_respond`) | `externalAgentRespondFailed` |
| `chat_widget_size` | `string` (see `chat_open`) | `externalAgentRespondFailed` |
| `chat_config` | `object` | `externalAgentRespondFailed` |
| `agent_type` | `'customer service'` | `externalAgentRespondFailed` |
| `agent_name` | `string` (see `external_agent_respond`) | `externalAgentRespondFailed` |
| `error_message` | `string` — the processing step that failed and the error type | `externalAgentRespondFailed` |
| `external_conversation_id` | `string` | `externalAgentRespondFailed` |
| `received_at` | `string` — ISO, when the backend stored the failure | `externalAgentRespondFailed` |

### `url_click`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `urlClick` |
| `conversation_state` | `string` (see `chat_open`) | `urlClick` |
| `chat_widget_size` | `string` (see `chat_open`) | `urlClick` |
| `chat_config` | `object` | `urlClick` |
| `link_type` | `'product_card'` \| `'mini_pdp_product'` \| `'text_url'` \| `'product_card_menu'` \| `'srp_link'` | `urlClick` |
| `product_id?` | `string` | `urlClick` |
| `product_category?` | `string` | `urlClick` |
| `url?` | `string` | `urlClick` |
| `link_text?` | `string` — for `'text_url'` the visible link text; for `'srp_link'` the search query | `urlClick` |

> If `ui.productAttributesToLog` is configured, each listed product property is also spread onto this event as its own top-level field, named after the property (see `productAttributesToLog` in [`widget-config.md`](./widget-config.md)).

### `add_to_cart`

Fired on every add-to-cart click that reaches the handler (disabled buttons never fire), even when no `fn.addToCart` is configured. Add-to-cart clicks never navigate to the product page.

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `addToCart` |
| `conversation_state` | `string` (see `chat_open`) | `addToCart` |
| `chat_widget_size` | `string` (see `chat_open`) | `addToCart` |
| `chat_config` | `object` | `addToCart` |
| `product_id` | `string` | `addToCart` |
| `product_category?` | `string` — merchant-configured category attribute | `addToCart` |
| `location` | `'product card'` \| `'miniPDP'` \| `'customized product card'` \| `'customized product carousel'` \| `'customized miniPDP'` | `addToCart` |

### `checkout`

Fired when the shopper starts a PayPal checkout with the mini PDP's Buy now button, before the checkout overlay opens.

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `checkout` |
| `conversation_state` | `string` (see `chat_open`) | `checkout` |
| `chat_widget_size` | `string` (see `chat_open`) | `checkout` |
| `chat_config` | `object` | `checkout` |
| `product_ids` | `string[]` — item ids before `ui.paypalProductIdPrefix` | `checkout` |
| `checkout_location` | `'quick_view'` (mini PDP) | `checkout` |
| `checkout_provider` | `'paypal'` | `checkout` |
| `product_category?` | `string` — merchant-configured category attribute | `checkout` |

### `purchase` / `checkout_cancel` / `checkout_error`

Each `checkout` event is followed by at most one of these, when that checkout settles (none when the shopper leaves the page with the checkout still open): `purchase` when PayPal approved the payment, `checkout_error` when it failed, `checkout_cancel` when it ended otherwise (see [`hooks.md`](./hooks.md#purchase-checkoutcancel-checkouterror)). `interaction` is `false`.

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `purchase`, `checkoutCancel`, `checkoutError` |
| `conversation_state` | `string` (see `chat_open`) | `purchase`, `checkoutCancel`, `checkoutError` |
| `chat_widget_size` | `string` (see `chat_open`) | `purchase`, `checkoutCancel`, `checkoutError` |
| `chat_config` | `object` | `purchase`, `checkoutCancel`, `checkoutError` |
| `product_ids` | `string[]` | `purchase`, `checkoutCancel`, `checkoutError` |
| `checkout_location` | `'quick_view'` | `purchase`, `checkoutCancel`, `checkoutError` |
| `checkout_provider` | `'paypal'` | `purchase`, `checkoutCancel`, `checkoutError` |
| `product_category?` | `string` | `purchase`, `checkoutCancel`, `checkoutError` |
| `order_id?` | `string` — PayPal order id | `purchase` |
| `message` | `'paypal_closed'` \| `'chat_closed'` \| `'new_checkout'` | `checkoutCancel` |
| `error` | `string` — error message of the failed checkout, truncated to 2000 chars | `checkoutError` |

### `mini_pdp_click`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `miniPdpClick` |
| `conversation_state` | `string` (see `chat_open`) | `miniPdpClick` |
| `chat_widget_size` | `string` (see `chat_open`) | `miniPdpClick` |
| `chat_config` | `object` | `miniPdpClick` |
| `product_id` | `string` | `miniPdpClick` |
| `product_category?` | `string` — merchant-configured category attribute, taken from the parent product | `miniPdpClick` |
| `url?` | `string` | `miniPdpClick` |

### `close_mini_pdp`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `closeMiniPdp` |
| `conversation_state` | `string` (see `chat_open`) | `closeMiniPdp` |
| `chat_widget_size` | `string` (see `chat_open`) | `closeMiniPdp` |
| `chat_config` | `object` | `closeMiniPdp` |
| `product_id?` | `string` | `closeMiniPdp` |
| `url?` | `string` | `closeMiniPdp` |

### `product_select`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `selectProduct` |
| `conversation_state` | `string` (see `chat_open`) | `selectProduct` |
| `chat_widget_size` | `string` (see `chat_open`) | `selectProduct` |
| `chat_config` | `object` | `selectProduct` |
| `current_selection` | `string[]` — all selected product IDs after the action | `selectProduct` |
| `product_id?` | `string` — single select | `selectProduct` |
| `select_all?` | `boolean` — `true` when multiple selected in one action | `selectProduct` |
| `suggested_buttons?` | `Prompt[]` | `selectProduct` |
| `type?` | `'product_card_menu'` — only when triggered from the product card menu's "Ask follow up" | `selectProduct` |

### `product_deselect`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `deselectProduct` |
| `conversation_state` | `string` (see `chat_open`) | `deselectProduct` |
| `chat_widget_size` | `string` (see `chat_open`) | `deselectProduct` |
| `chat_config` | `object` | `deselectProduct` |
| `product_id?` | `string` — single deselect | `deselectProduct` |
| `current_selection?` | `string[]` — single deselect | `deselectProduct` |
| `deselect_all?` | `boolean` — `true` when multiple deselected in one action | `deselectProduct` |
| `deselected_products?` | `string[]` — IDs removed in a multi-deselect | `deselectProduct` |
| `suggested_buttons?` | `Prompt[]` | `deselectProduct` |

### `product_menu_click`

Fired the moment the user clicks an action in a product menu, alongside the downstream event that action triggers. `source_type` identifies where the menu was invoked from.

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `productMenuClick` |
| `conversation_state` | `string` (see `chat_open`) | `productMenuClick` |
| `chat_widget_state` | `string` (see `clarity_respond`) | `productMenuClick` |
| `chat_widget_size` | `string` (see `chat_open`) | `productMenuClick` |
| `chat_config` | `object` | `productMenuClick` |
| `button_content` | `'ask follow up'` \| `'find similar'` \| `'go to product page'` | `productMenuClick` |
| `source_type` | `'product_card'` \| `'carousel'` \| `'quick_view'` | `productMenuClick` |
| `product_id` | `string` | `productMenuClick` |
| `product_category?` | `string` — merchant-configured category attribute | `productMenuClick` |

### `menu_click`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `buttonClick` |
| `conversation_state` | `string` (see `chat_open`) | `buttonClick` |
| `chat_widget_size` | `string` (see `chat_open`) | `buttonClick` |
| `chat_config` | `object` | `buttonClick` |
| `button_content` | `'Clear Chat'` \| `'Get Help'` \| `'Learn More'` \| `'Give Feedback'` \| `'End Conversation'` | `buttonClick` |
| `url?` | `string` | `buttonClick` |

### `change_size`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `changeSize` |
| `conversation_state` | `string` (see `chat_open`) | `changeSize` |
| `chat_widget_size` | `string` (see `chat_open`) | `changeSize` |
| `chat_config` | `object` | `changeSize` |
| `set_size_to` | `'small'` \| `'large'` | `changeSize` |

### `thumbs_up` / `thumbs_down`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `thumbsUp` / `thumbsDown` |
| `conversation_state` | `string` (see `chat_open`) | `thumbsUp` / `thumbsDown` |
| `chat_widget_size` | `string` (see `chat_open`) | `thumbsUp` / `thumbsDown` |
| `chat_config` | `object` | `thumbsUp` / `thumbsDown` |
| `feedback_target_text?` | `string` — reacted message text (joined by `\n\n`) | `thumbsUp` / `thumbsDown` |
| `feedback_target_product_ids?` | `string[]` — product IDs from carousels | `thumbsUp` / `thumbsDown` |
| `feedback_message?` | `string` — optional comment | `thumbsUp` / `thumbsDown` |

### `close_survey`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `surveyClosed` |

### `submit_feedback`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `feedbackSubmitted` |
| `feedback_state?` | `number` — numeric survey score | `feedbackSubmitted` |
| `feedback_message?` | `string` — optional comment | `feedbackSubmitted` |

### `clarity_warning`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `clarityWarning` |
| `conversation_state` | `string` (see `chat_open`) | `clarityWarning` |
| `chat_widget_state` | `string` (see `clarity_respond`) | `clarityWarning` |
| `chat_widget_size` | `string` (see `chat_open`) | `clarityWarning` |
| `chat_config` | `object` | `clarityWarning` |
| `location` | `'Back-end'` \| `'Front-end'` (injecting events failed) \| an `'FE:…'` origin (transient network error) | `clarityWarning` |
| `type` | `string` | `clarityWarning` |
| `message` | `string` — truncated to 2000 chars | `clarityWarning` |
| `agent_name?` | `string` (see `external_agent_respond`) — only when receiving that external agent's replies failed | `clarityWarning` |

### `clarity_error`

| Field | Type / Values | Hook |
|---|---|---|
| `agent_id` | `string` | `clarityError` |
| `conversation_state` | `string` (see `chat_open`); empty string for an `'FE:…'` error | `clarityError` |
| `location` | `'Back-end'` \| `'FE:user_active'` \| `'FE:user_passive'` \| `'FE:chat_closed'` \| `'FE:app_error_boundary'` \| `'FE:error'` | `clarityError` |
| `type` | `string` | `clarityError` |
| `message` | `string` — truncated to 2000 chars | `clarityError` |
| `agent_name?` | `string` (see `external_agent_respond`) — only when receiving that external agent's replies failed | `clarityError` |
| `chat_widget_state?` | `string` (see `clarity_respond`) — `'Back-end'` only | `clarityError` |
| `chat_widget_size?` | `string` (see `chat_open`) — `'Back-end'` only | `clarityError` |
| `chat_config?` | `object` — `'Back-end'` only | `clarityError` |
| `latency?` | `number` — ms, `'Back-end'` only | `clarityError` |

Errors raised while handling a chat response (`'Back-end'`) carry the widget-state fields and `latency`; errors the widget caught itself (`'FE:…'`) carry only the fields above them.

### Diagnostic log actions

Backend diagnostic `LOG` events are tracked by the `log` hook under a dynamic action: the lowercased `subType` of the event. The payload carries `agent_id`, `conversation_state`, `chat_widget_state`, `chat_widget_size`, `chat_config` and every field of the event's `data` object. Widget-internal diagnostics are tracked by the `clarityDebug` hook as `clarity_debug` with `type` and `message`. In both cases the fields depend on the diagnostic and are not part of the documented contract; build reports on the actions above instead.

---

## Trigger Actions

Every tracked trigger event carries the [default attributes](#default-attributes); the tables list the hook-specific fields on top of them.

### `show`

| Field | Type / Values | Hook |
|---|---|---|
| `source` | `string` — `banner_id` | `show` |
| `trigger_context_product_ids` | `string[]` — product IDs extracted from the page | `show` |
| `trigger_context_product_ids_type?` | `'product_id'` \| `'item_id'` — only when the weblayer config sets it | `show` |
| `trigger_conversation_starters_list?` | `string[]` — the questions shown | `show` |
| `trigger_conversation_starters_is_generated?` | `boolean` — embedded templates | `show` |
| `trigger_conversation_starters_generated?` | `boolean[]` — per-question flags, embedded templates | `show` |
| `search_text?` | `string` — search-suggestion template | `show` |
| `search_results?` | `string[]` — search-suggestion template | `show` |

The search-suggestion template also tracks a `show` after every suggestion fetch, so it logs many per page view.

### `actual_show`

v2.0 only.

| Field | Type / Values | Hook |
|---|---|---|
| `source` | `string` — `banner_id` | `actualShow` |
| `trigger_context_product_ids` | `string[]` | `actualShow` |
| `trigger_context_product_ids_type?` | `'product_id'` \| `'item_id'` | `actualShow` |
| `trigger_conversation_starters_list?` | `string[]` — the questions shown | `actualShow` |
| `trigger_conversation_starters_is_generated?` | `boolean` — embedded templates | `actualShow` |
| `trigger_conversation_starters_generated?` | `boolean[]` — per-question flags, embedded templates | `actualShow` |

### `trigger_clicked`

| Field | Type / Values | Hook |
|---|---|---|
| `source` | `string` — `banner_id` | `clicked` |
| `trigger_context_product_ids` | `string[]` | `clicked` |
| `trigger_context_product_ids_type?` | `'product_id'` \| `'item_id'` | `clicked` |
| `chat_config` | `object` — config snapshot | `clicked` |
| `conversation_state?` | `string` (see `chat_open`) | `clicked` |
| `chat_widget_state?` | `'open'` \| `'bubble'` \| `'minimized'` | `clicked` |
| `chat_widget_size?` | `string` (see `chat_open`) | `clicked` |
| `button_text?` | `string` — clicked conversation starter / button | `clicked` |
| `button_text_is_generated?` | `boolean` | `clicked` |
| `trigger_conversation_starters_list?` | `string[]` | `clicked` |
| `trigger_conversation_starters_is_generated?` | `boolean` | `clicked` |
| `trigger_conversation_starters_generated?` | `boolean[]` — per-question flags | `clicked` |

### `trigger_error`

| Field | Type / Values | Hook |
|---|---|---|
| `source` | `string` — `banner_id` | `error` |
| `trigger_context_product_ids` | `string[]` | `error` |
| `trigger_context_product_ids_type?` | `'product_id'` \| `'item_id'` | `error` |
| `location` | `string` — e.g. `'FE:user_passive'` | `error` |
| `message` | `string` — error description | `error` |
| `interaction` | `boolean` — always `true` | `error` |

---

## Hooks with no action

These hooks exist as browser events and callbacks (see [`hooks.md`](./hooks.md)) but are **not** tracked to Engagement.

**Clarity hooks**

| Hook | Why |
|---|---|
| `initialized` | Fired before the chat state exists; not forwarded to analytics |
| `reloaded` | Not forwarded to analytics |
| `processingMessage` | Function hook — actionable callback |
| `reloadStarted` | Function hook — actionable callback |
| `initialMessage` | Function hook — actionable callback |
| `searchedProducts` | Function hook — actionable callback |

**Trigger hooks**

| Hook | Why |
|---|---|
| `initialized` | Trigger component mounted (search-suggestion template only) — not tracked |
| `closed` | Reserved; no template fires it today — not tracked |
| `suggestionsSearched` | Suggestion fetch starts — not tracked |
| `suggestionsRendered` | Suggestion items rendered — not tracked |

