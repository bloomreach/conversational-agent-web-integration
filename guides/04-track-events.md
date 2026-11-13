[← Back to Chapter 3 — Customize components](03-customize-components.md)

# 4. Track events

The widget reports what happens in the chat: it opened, the shopper sent a message, the assistant answered with
products, a product went into the cart. This chapter explains where those reports arrive, which one to use for
what, and which event to pick for a given question. It is an overview: the fields of each event are in
[`hooks.md`](../reference/hooks.md) and [`analytics-events.md`](../reference/analytics-events.md), linked from
every row below.

---

## 4.1 How an event comes about

Every report starts as a **hook**: a named moment in the widget, such as `userRespond` when the shopper sends a
message. When a hook fires, the widget hands one params object to up to three places:

```
the shopper sends a message
  └─ hook userRespond, with its params
       ├─ your callback hooks.userRespond(params), if you set one
       ├─ browser event 'Clarity:userRespond' on window, event.detail = params
       └─ weblayer pages only: an Engagement event 'clarity' with action 'user_respond',
          the params plus the default attributes
```

| Where it arrives | Who sees it | Set-up |
|---|---|---|
| **Browser event** `Clarity:<hook>` on `window` | Your page code | Nothing on a weblayer page. A standalone page sets [`hooks: { version: 'WBL_BUNDLE' }`](../reference/hooks.md#the-hooks-object) |
| **Callback** in `hooks` | Your page code | [`hooks`](../reference/hooks.md#hooks-on-a-weblayer-page) in `window.CLARITY_CONFIG` or the weblayer's widget settings |
| **Engagement event** `clarity`, one `action` per hook | Reports, segments and scenarios in Engagement | Nothing: the weblayer tracks it. A standalone page tracks nothing |

The triggers (floating button, embedded questions, search suggestions) report the same way, through **trigger
hooks**: browser events named `ClarityTrigger:<hook>`, and Engagement events with the trigger actions. They exist
only on a weblayer page.

Events are notifications. A listener cannot stop or change what the widget does; for that, use the
[function overrides](03-customize-components.md#function-overrides), for example
[`fn.addToCart`](03-customize-components.md#fnaddtocart) to put the product into your cart.

---

## 4.2 Which one to use

| You want to | Use |
|---|---|
| Report on chat usage, build segments or start scenarios in Engagement | The Engagement events, by [action](#44-engagement-events-by-action). Nothing to code |
| Send chat activity to another analytics tool | A listener on the browser events that forwards what you need |
| React on your page: show your own loading state, render search results, follow the shopper's choice | A listener on the browser events |
| Add your own properties to the Engagement events | The weblayer's [`trackerConfig`](../reference/weblayer-config.md#widget--clarity-widget-settings), set by your Bloomreach contact |

Prefer the browser events over callbacks: your listener stays in your own code and does not touch the widget's
configuration. With several weblayers on a page, `event.detail.source` tells which one the event belongs to.

```javascript
window.addEventListener('Clarity:addToCart', (event) => {
  myAnalytics.track('chat_add_to_cart', { productId: event.detail.product_id })
})
```

---

## 4.3 Browser events: what fires when

Each event links to its params in [`hooks.md`](../reference/hooks.md).

### The widget

| Event | Fires when | Typical use |
|---|---|---|
| [`Clarity:initialized`](../reference/hooks.md#initialized) | The widget has started, once per page load | Know that the widget is ready; once [`window.CLARITY`](../reference/runtime-api.md) exists, calls to it are queued and need not wait for this event |
| [`Clarity:widgetShown`](../reference/hooks.md#widgetshown) | The widget becomes visible: badge, bubble or open chat | Count impressions |
| [`Clarity:chatOpen`](../reference/hooks.md#chatopen) | The shopper opens the chat; `action` says from where. A chat opened while the widget was hidden, for example by a trigger, comes as `Clarity:widgetShown` with `chat_widget_state: 'open'` | For example, an input for counting opens |
| [`Clarity:chatClosed`](../reference/hooks.md#chatclosed) | The shopper minimizes the chat | |
| [`Clarity:badgeHidden`](../reference/hooks.md#badgehidden) | The shopper closes the widget entirely | |
| [`Clarity:initialMessageBubbleHidden`](../reference/hooks.md#initialmessagebubblehidden) | The shopper dismisses the initial message bubble | |
| [`Clarity:changeSize`](../reference/hooks.md#changesize) | The shopper switches between small and large | Adapt your layout to the large widget |
| [`Clarity:reloadStarted`](../reference/hooks.md#reloadstarted), [`Clarity:reloaded`](../reference/hooks.md#reloaded) | The chat is cleared and reloads | Reset what you derived from the conversation |
| `ClarityState:widgetState` | The widget is hidden, minimized, opened or maximized; `event.detail.state` says which | Keep your page's layout in step with the widget, as the [side panel](05-side-panel.md) does |

### The conversation

| Event | Fires when | Typical use |
|---|---|---|
| [`Clarity:userRespond`](../reference/hooks.md#userrespond) | The shopper sends a message, a quick reply or a button; `type` says which | Count questions |
| [`Clarity:processingMessage`](../reference/hooks.md#processingmessage) | An answer starts (`processing: true`) and ends (`false`) | Show your own loading state |
| [`Clarity:clarityRespond`](../reference/hooks.md#clarityrespond) | The assistant answers; `product_ids` lists the products shown | Know which products were recommended |
| [`Clarity:externalAgentRespond`](../reference/hooks.md#externalagentrespond) | A customer-service agent answers after a [hand-over](08-customer-service-zendesk.md) | |
| [`Clarity:initialMessage`](../reference/hooks.md#initialmessage) | The initial assistant message has loaded | |
| [`Clarity:searchedProducts`](../reference/hooks.md#searchedproducts) | Search results are handed to your page by [`fn.hideSearchResultCarousels`](03-customize-components.md#fnhidesearchresultcarousels) | Render the results on your page |

`userRespond` and `clarityRespond` also fire one `userRespondProduct` / `clarityRespondProduct` per product and one
`clarityRespondButton` per suggested button, for per-product and per-button reports.

### Products and the cart

| Event | Fires when | Typical use |
|---|---|---|
| [`Clarity:urlClick`](../reference/hooks.md#urlclick) | The shopper clicks a link to a product or another page; `link_type` says which | Attribute product page visits to the chat |
| [`Clarity:miniPdpClick`](../reference/hooks.md#minipdpclick), [`Clarity:closeMiniPdp`](../reference/hooks.md#closeminipdp) | The mini PDP opens and closes | |
| [`Clarity:addToCart`](../reference/hooks.md#addtocart) | The shopper clicks add to cart in the chat; `location` says where | Attribute add-to-cart to the chat (the product itself is added by [`fn.addToCart`](03-customize-components.md#fnaddtocart)) |
| [`Clarity:selectProduct`](../reference/hooks.md#selectproduct), [`Clarity:deselectProduct`](../reference/hooks.md#deselectproduct) | The shopper selects products, for example to compare them | |
| [`Clarity:productMenuClick`](../reference/hooks.md#productmenuclick) | The shopper picks an action in a product card's menu | |
| [`Clarity:checkout`](../reference/hooks.md#checkout) | A PayPal checkout starts in the mini PDP | Count checkouts started from the chat |
| [`Clarity:purchase`](../reference/hooks.md#purchase-checkoutcancel-checkouterror) | PayPal approved the payment | Count chat purchases |
| [`Clarity:checkoutCancel`](../reference/hooks.md#purchase-checkoutcancel-checkouterror), [`Clarity:checkoutError`](../reference/hooks.md#purchase-checkoutcancel-checkouterror) | The checkout ended without a payment (`message` says why), or failed (`error`) | Count abandoned and failed checkouts |

### Feedback and problems

| Event | Fires when | Typical use |
|---|---|---|
| [`Clarity:thumbsUp`, `Clarity:thumbsDown`](../reference/hooks.md#thumbsup--thumbsdown) | The shopper rates an answer | |
| [`Clarity:surveyShow`](../reference/hooks.md#surveyshow), [`Clarity:surveyClosed`](../reference/hooks.md#surveyclosed), [`Clarity:feedbackSubmitted`](../reference/hooks.md#feedbacksubmitted) | The feedback survey shows, is closed, is submitted | |
| [`Clarity:buttonClick`](../reference/hooks.md#buttonclick) | The shopper clicks a widget button, such as a header menu entry or End conversation; `button_content` says which | |
| [`Clarity:clarityWarning`](../reference/hooks.md#claritywarning), [`Clarity:clarityError`](../reference/hooks.md#clarityerror) | Something went wrong; `location` says where | Monitor your integration |

### The triggers (weblayer only)

| Event | Fires when | Typical use |
|---|---|---|
| [`ClarityTrigger:show`](../reference/hooks.md#show), [`ClarityTrigger:actualShow`](../reference/hooks.md#actualshow) | The trigger is shown; with weblayer `version: '2'`, `actualShow` when it is actually in the viewport | Count trigger impressions |
| [`ClarityTrigger:clicked`](../reference/hooks.md#clicked) | The shopper clicks the trigger or one of its questions | Count trigger clicks |
| [`ClarityTrigger:error`](../reference/hooks.md#error) | A trigger could not load its content | |
| [`ClarityTrigger:suggestionsSearched`](../reference/hooks.md#suggestionssearched) and the others in [Trigger hooks](../reference/hooks.md#trigger-hooks) | Search-suggestion steps | |

---

## 4.4 Engagement events by action

On a weblayer page each tracked hook becomes an Engagement event named `clarity`, with the hook's params, the
[default attributes](../reference/analytics-events.md#default-attributes) (weblayer, variant, chat id, page path,
…) and an `action`. Filter on `action` to get one kind of event. Each action links to its fields in
[`analytics-events.md`](../reference/analytics-events.md).

| Action | Browser event it comes from |
|---|---|
| [`show`](../reference/analytics-events.md#show) | `Clarity:widgetShown`, `Clarity:surveyShow` and `ClarityTrigger:show`; [`component`](../reference/analytics-events.md#default-attributes) tells them apart |
| [`chat_open`](../reference/analytics-events.md#chat_open) | `Clarity:chatOpen` |
| [`chat_closed`](../reference/analytics-events.md#chat_closed) | `Clarity:chatClosed` |
| [`close`](../reference/analytics-events.md#close) | `Clarity:badgeHidden` |
| [`close_bubble`](../reference/analytics-events.md#close_bubble) | `Clarity:initialMessageBubbleHidden` |
| [`change_size`](../reference/analytics-events.md#change_size) | `Clarity:changeSize` |
| [`user_respond`](../reference/analytics-events.md#user_respond) | `Clarity:userRespond` |
| [`user_respond_product`](../reference/analytics-events.md#user_respond_product) | `Clarity:userRespondProduct`, one per product |
| [`clarity_respond`](../reference/analytics-events.md#clarity_respond) | `Clarity:clarityRespond` |
| [`clarity_respond_product`](../reference/analytics-events.md#clarity_respond_product) | `Clarity:clarityRespondProduct`, one per product |
| [`clarity_respond_button`](../reference/analytics-events.md#clarity_respond_button) | `Clarity:clarityRespondButton`, one per suggested button |
| [`external_agent_respond`](../reference/analytics-events.md#external_agent_respond) | `Clarity:externalAgentRespond` |
| [`url_click`](../reference/analytics-events.md#url_click) | `Clarity:urlClick` |
| [`mini_pdp_click`](../reference/analytics-events.md#mini_pdp_click) | `Clarity:miniPdpClick` |
| [`close_mini_pdp`](../reference/analytics-events.md#close_mini_pdp) | `Clarity:closeMiniPdp` |
| [`add_to_cart`](../reference/analytics-events.md#add_to_cart) | `Clarity:addToCart` |
| [`product_select`](../reference/analytics-events.md#product_select) | `Clarity:selectProduct` |
| [`product_deselect`](../reference/analytics-events.md#product_deselect) | `Clarity:deselectProduct` |
| [`product_menu_click`](../reference/analytics-events.md#product_menu_click) | `Clarity:productMenuClick` |
| [`checkout`](../reference/analytics-events.md#checkout) | `Clarity:checkout` |
| [`purchase`](../reference/analytics-events.md#purchase--checkout_cancel--checkout_error) | `Clarity:purchase` |
| [`checkout_cancel`](../reference/analytics-events.md#purchase--checkout_cancel--checkout_error) | `Clarity:checkoutCancel` |
| [`checkout_error`](../reference/analytics-events.md#purchase--checkout_cancel--checkout_error) | `Clarity:checkoutError` |
| [`menu_click`](../reference/analytics-events.md#menu_click) | `Clarity:buttonClick` |
| [`thumbs_up` / `thumbs_down`](../reference/analytics-events.md#thumbs_up--thumbs_down) | `Clarity:thumbsUp` / `Clarity:thumbsDown` |
| [`close_survey`](../reference/analytics-events.md#close_survey) | `Clarity:surveyClosed` |
| [`submit_feedback`](../reference/analytics-events.md#submit_feedback) | `Clarity:feedbackSubmitted` |
| [`clarity_warning`](../reference/analytics-events.md#clarity_warning) | `Clarity:clarityWarning`, plus warnings of the weblayer itself |
| [`clarity_error`](../reference/analytics-events.md#clarity_error) | `Clarity:clarityError` |
| [`actual_show`](../reference/analytics-events.md#actual_show) | `ClarityTrigger:actualShow` |
| [`trigger_clicked`](../reference/analytics-events.md#trigger_clicked) | `ClarityTrigger:clicked` |
| [`trigger_error`](../reference/analytics-events.md#trigger_error) | `ClarityTrigger:error` |

Not tracked, browser event only: `initialized`, `reloaded`, `reloadStarted`, `processingMessage`,
`initialMessage`, `searchedProducts`, `ClarityState:widgetState`, and the trigger events `initialized`,
`suggestionsSearched` and `suggestionsRendered` ([list](../reference/analytics-events.md#hooks-with-no-action)).
The weblayer also tracks a few actions of its own, for example when it fails to load, and the widget's diagnostic
`log` and `clarityDebug` hooks arrive as further actions ([Diagnostic log actions](../reference/analytics-events.md#diagnostic-log-actions));
neither is part of the contract.

---

## 4.5 Check that it works

1. Open the browser console on a page with the widget and listen to an event, for example
   `window.addEventListener('Clarity:chatOpen', (e) => console.log(e.detail))`, then open the chat with the badge.
2. On a weblayer page, the same interaction shows up in Engagement as a `clarity` event with
   `action: 'chat_open'`.
3. On a standalone page with missing or incomplete events, check that `hooks.version` is `'WBL_BUNDLE'`.

---

[← Chapter 3 — Customize components](03-customize-components.md) · [Chapter 5 — Side Panel →](05-side-panel.md)
