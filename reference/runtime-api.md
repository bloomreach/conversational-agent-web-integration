# `window.CLARITY` — Runtime API

`window.CLARITY` is the JavaScript command bridge for controlling the Clarity chat widget from external code. It lets you show/hide the widget, open the chat, send messages, switch per-source config, and more — from page scripts, SPAs, or CMS tag managers.

**Related docs:**
- [`widget-config.md`](./widget-config.md) — `window.CLARITY_CONFIG` fields
- [`weblayer-config.md`](./weblayer-config.md) — weblayer-managed integration (uses `window.CLARITY` internally)

---

## How It Works

`window.CLARITY.call(...)` is available as soon as the inline loader snippet runs — before the Clarity bundle has loaded. Calls made before the bundle is ready are queued in `window.CLARITY._tempAsyncQueue` and replayed in order once the widget initializes.

This means you can call `window.CLARITY.call('show_badge')` immediately after setting `window.CLARITY_CONFIG`, without waiting for the script to load.

A `source` argument and a `setSource` call made before the bundle has loaded are kept, with the snippet below. A queued call applies its own `source` when it runs, after the bundle has loaded and so after every `setSource` made before load: to run a queued call on a given source, pass `source` to that call.

The weblayer handles all of this automatically. The manual setup below applies to **standalone** (non-weblayer) integrations only.

### Standalone Setup

Add this inline script **before** loading the Clarity bundle. It sets up the async queue and `window.CLARITY_CONFIG`, then injects the loader script.

```html
<script>
  window.CLARITY = {
    _tempAsyncQueue: [],
    call: (name, arg, source) =>
      new Promise((res, rej) =>
        window.CLARITY._tempAsyncQueue.push({ name, arg, source, res, rej })
      ),
    setSource: (source) => { window.CLARITY_CONFIG.source = source },  // call it once CLARITY_CONFIG is set
  }

  window.CLARITY_CONFIG = {
    projectId: '<your Engagement project id>',
    personaId: '<your agent id>',
    defaultCurrency: 'EUR',
    // ... other config fields
  }

  const script = document.createElement('script')
  script.src = 'https://<conversational-agent-url>/cocoaas/public/bundle/index_cocoChatLoader.js'
  document.body.appendChild(script)

  window.CLARITY.call('show_badge')
</script>
```

---

## `call(action, args?, source?)`

Execute a widget action. Returns a `Promise` that resolves when the action completes.

```javascript
await window.CLARITY?.call(actionName, args, source)
```

The promise resolves to the action's result:

- `user_send_message`: the chat-log events of that turn — the user message, assistant text, carousels, selected items, quick replies and metadata. In the default widget, a button message with `target: 'sqr_with_search_or_extraction'` resolves to its `UPDATE_SEARCH` event only.
- `sync_chat`: the chat's events of the same kinds.
- `get_recommendations` (default widget only): the recommendations.
- Every other action: `undefined`.

`user_send_message` and `sync_chat` resolve to the same shape in the default widget and in mobile AI Mode ([`widgetTemplate: 'ai_mode'`](./weblayer-config.md#widgettemplate)).

| Parameter | Type | Description |
|---|---|---|
| `action` | `string` | The action to execute. See [Actions](#actions) below. |
| `args` | `object` | Action-specific arguments. Optional for most actions. |
| `source` | `string` | Banner source string (`${banner_id}::${banner_name}`). If provided, switches the active source **before** executing the action, applying that source's `bannerSettings` overrides. |

After the bundle has loaded, a call with `source` is equivalent to calling `setSource(source)` then `call(action, args)` — the source change and the action happen atomically.

### Which widget template handles the call

Calls are routed to whichever widget template is live on the page — the default widget or AI Mode (see [`widgetTemplate`](./weblayer-config.md#widgettemplate)) — so integrations do not need to know which bundle was loaded. Each template implements the subset of actions that is meaningful to it and ignores the rest; AI Mode, for example, has no badge and is always open, so `show_badge` / `hide_badge` / `open_chat` / `close_chat` are no-ops there, and it does not support `inject_chat` or `get_recommendations`.

To address one template explicitly, add `template` to `args`. It is routing metadata and is stripped before the action is delivered:

```javascript
await window.CLARITY?.call('sync_chat', { template: 'ai_mode' })
await window.CLARITY?.call('show_badge', { template: 'all' })  // every registered template
```

An unrecognized action, or one addressed to a template that is not on the page, is logged and ignored — it does not throw. (A call queued before load and addressed to a template that has not loaded stays queued until that template registers.)

---

## `setSource(source)`

Switch the active source without executing any action. Updates `CLARITY_CONFIG.source`, applies the matching `bannerSettings` overrides (UI, agent config, initial message, etc.), and re-renders the widget. No chat action is triggered.

```javascript
window.CLARITY?.setSource('banner_id::banner_name')  // full key
window.CLARITY?.setSource('banner_id')               // prefix match also accepted
```

`source` is matched against `bannerSettings` keys in three passes, first hit wins: **exact** match, then **prefix** match, then a **substring** (`includes`) match. Passing the full `banner_id::banner_name` key always works; passing just the `banner_id` portion (before `::`) is also accepted as a shorthand. If no key matches, the value is set as-is.

Use this when multiple banners are on the same page and you need to update the widget's appearance or config before an interaction without opening the chat. See [`widget-config.md → bannerSettings`](./widget-config.md#bannersettings) for how per-source overrides work.

---

## Actions

### `show_badge`

Make the widget visible in its minimized (badge) state.

```javascript
await window.CLARITY?.call('show_badge')
await window.CLARITY?.call('show_badge', { bannerName: 'My Banner' })
```

| Arg | Type | Description |
|---|---|---|
| `bannerName` | `string` | Optional label used in analytics tracking. |
| `triggerComponent` | `string` | Optional trigger component (e.g. trigger template) used in analytics tracking. |

---

### `hide_badge`

Hide the widget entirely (both badge and expanded states).

```javascript
await window.CLARITY?.call('hide_badge')
await window.CLARITY?.call('hide_badge', { log: true })
```

| Arg | Type | Description |
|---|---|---|
| `log` | `boolean` | When `true`, routes through the same close path as the widget's own close button — runs the mini-PDP/survey side effects and logs a `badge_hidden` analytics event (`action: 'close_chat_from_trigger'`). When omitted/`false`, the widget is hidden with no analytics event. |

---

### `open_chat`

Expand the widget to the full chat view. While the widget is hidden, the chat opens out of sight and shows open
at the next [`show_badge`](#show_badge), reported as `widgetShown` in the open state rather than `chatOpen`.

```javascript
await window.CLARITY?.call('open_chat')

// open, then send the message
await window.CLARITY?.call('open_chat', { input: 'Show me waterproof jackets' })
await window.CLARITY?.call('user_send_message', { type: 'text', input: 'Show me waterproof jackets' })
```

| Arg | Type | Description |
|---|---|---|
| `input` | `string` | Marks that a message for this text follows. It is not sent or pre-filled — send it with [`user_send_message`](#user_send_message). |
| `bannerName` | `string` | Optional label used in analytics tracking. |
| `triggerComponent` | `string` | Optional trigger component (e.g. trigger template) used in analytics tracking. |

---

### `close_chat`

Minimize the widget back to badge state.

```javascript
await window.CLARITY?.call('close_chat')
```

---

### `user_send_message`

Send a message on behalf of the user. Supports two variants: plain text and button-style (with optional routing metadata).

#### Text message

```javascript
await window.CLARITY?.call('user_send_message', {
  type: 'text',
  input: 'Show me waterproof jackets',
})
```

#### Button message

```javascript
await window.CLARITY?.call('user_send_message', {
  type: 'button',
  input: 'show similar products',
  invisible: true,    // hide the message from the chat UI
  target: 'find_similar_or_compatible_products',  // route to a specific agent action
  payload: { productIds: ['123', '456'] },
})
```

| Arg | Type | Description |
|---|---|---|
| `type` | `'text' \| 'button'` | **Required.** Message type. |
| `input` | `string` | **Required.** The message text sent to the AI. |
| `force` | `boolean` | Send immediately without waiting for full initialization. Use with caution. Without it, the call waits until the widget is shown (`show_badge`) and initialized. |
| `bannerName` | `string` | Optional label for analytics tracking. |
| `triggerComponent` | `string` | Optional trigger component (e.g. trigger template) for analytics tracking. |
| `invisible` | `boolean` | (`button` only) Hide the user message bubble in the chat UI. |
| `target` | `string` | (`button` only) Direct the message to a specific agent action, bypassing intent classification. One of `'results_summarizer'`, `'search_in_catalog'`, `'sqr_with_search_or_extraction'`, `'products_expert_question'`, `'find_similar_or_compatible_products'`, `'post_search'`. |
| `source` | `string` | (`button` only) Button source context passed to the AI for conversation quality. |
| `payload` | `any` | (`button` only) Arbitrary data passed alongside the message to the agent. |

---

### `delete_chat`

Clear the chat history and reset the session. It takes no arguments.

```javascript
await window.CLARITY?.call('delete_chat')
```

---

### `inject_chat`

Inject a synthetic chat history into the widget. Used by the quiz trigger to pre-populate the chat with collected answers before opening.

```javascript
await window.CLARITY?.call('inject_chat', {
  events: [
    { type: 'user_text', text: 'I am looking for a birthday gift' },
    { type: 'assistant_text', text: 'Great! What is your budget?' },
    { type: 'user_text', text: 'Under $100' },
  ],
})
```

| Arg | Type | Description |
|---|---|---|
| `events` | `{ type: 'user_text' \| 'assistant_text', text: string }[]` | **Required.** Ordered list of messages to inject. |

The call waits until the widget is shown and has finished initializing (including the opening message of a new chat) before sending, so the injected messages always appear after the opening message. While the widget is hidden (before `show_badge`), nothing is sent and the call stays pending until the widget is shown — call `show_badge` first rather than awaiting `inject_chat` before it.

---

### `sync_chat`

Re-synchronize the widget's chat state. In AI Mode it reloads the current session from the backend; the default widget does not contact the backend.

```javascript
await window.CLARITY?.call('sync_chat')
```

---

### `get_recommendations`

Fetch product recommendations based on viewed products, without opening the chat.

```javascript
const result = await window.CLARITY?.call('get_recommendations', {
  viewedProductIds: ['prod-123', 'prod-456'],
  maxTotalRecommendations: 10,
  productIdsToExclude: ['prod-789'],
})
```

| Arg | Type | Description |
|---|---|---|
| `viewedProductIds` | `string[]` | **Required.** IDs of products the user has viewed. |
| `maxTotalRecommendations` | `number` | **Required.** Maximum total recommendations to return. |
| `recommendationLimit` | `number \| null` | Per-request limit. |
| `productIdsToExclude` | `string[]` | **Required.** Product IDs to exclude from results. |

---

## Examples

### Show badge on page load

```javascript
window.CLARITY?.call('show_badge')
```

### Open chat pre-filled from a search input

```javascript
searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    await window.CLARITY?.call('open_chat', { input: searchInput.value })
    await window.CLARITY?.call('user_send_message', { type: 'text', input: searchInput.value })
  }
})
```

### Switch banner source and open chat

When multiple banners are active on the same page (e.g., a PDP widget and a search widget), use `source` to route the call to the right banner config:

```javascript
// Opens the chat using the PDP banner's UI config and context
await window.CLARITY?.call('open_chat', {}, 'pdp-trigger::PDP Trigger')

// Opens the chat using the search banner's UI config and context
await window.CLARITY?.call('open_chat', {}, 'search-trigger::Search Trigger')
```

### Update widget config without opening chat

```javascript
// Switch to PDP banner config silently (e.g., user navigates to a PDP)
window.CLARITY?.setSource('pdp-trigger::PDP Trigger')
```

### Send a hidden button action (e.g., from an embedded trigger button)

```javascript
buttonEl.addEventListener('click', async () => {
  await window.CLARITY?.call('user_send_message', {
    type: 'button',
    input: 'Show similar products',
    invisible: true,
    target: 'find_similar_or_compatible_products',
    payload: { productIds: currentProductIds },
  })
})
```
