[← Back to Chapter 4 — Context-aware pricing](04-context-aware-pricing.md)

# 5. Search orchestration (Ask Me Anything search)

Search orchestration turns your site's search bar into one entry point. Each submitted query is routed to the
experience built for it: a **keyword** query ("red sneakers") runs your normal site search; a **conversational**
query ("what should I wear for a rainy hike") opens the Conversational Agent with the question; a **support**
question ("where is my order") reaches your customer-service agent when one is integrated, otherwise the agent
points the shopper to your support page.

The routing happens in two steps, at two levels:

| Level | Where | Decides | Who implements it |
|---|---|---|---|
| **1. Query classification** | On your page, before results load | Keyword search or conversation | Your search handler calls `isSearch()` from [`@bloomreach/clarity-utils`](../reference/clarity-utils.md), directly or through the Helper Tag |
| **2. Agent selection** | In the Conversational Agent's backend, on every message | Whether the Conversational Agent or your customer-service agent answers | Nothing to implement; configured on your agent by Bloomreach |

Level 1 is a fast, local check (no network call) that keeps keyword search as quick as it is today. Level 2 is a
language-model step that looks at the message and the conversation so far.

---

## Level 1: classify the query on the page

### What Bloomreach deploys

Your Bloomreach contact deploys four pieces in your Engagement project. They load in this order, each waiting
for the previous one:

1. **Global Tag** — defines `window.CLARITY_GLOBAL_CONFIG` (your agent id, the SDK name, the loader of the
   chat widget, tester and traffic gating). Every other Conversational Agent tag and weblayer depends on it.
2. **Helper Tag** — defines `window.CLARITY_HELPER`, the functions your search handler calls (below). It loads
   the classifier library from the CDN. Its audience in Engagement is also the on/off switch for the feature:
   restricted to testers before go-live, removed to roll back without a release on your side.
3. **Orchestrator Tag** — once the Global Tag is present, shows the orchestrator weblayer.
4. **Orchestrator WebLayer** — a weblayer with no trigger that loads the chat widget hidden, so that it can be
   opened instantly when a conversational query comes in. It is a dedicated weblayer so that conversations
   started from the search bar are reported under their own banner in analytics.

Everything is configured in Engagement; nothing of this ships in your codebase.

### `window.CLARITY_HELPER`

| Function | What it does |
|---|---|
| `isSearch(input, config?)` → `Promise<boolean \| undefined>` | `true` when the query is a keyword search, `false` when it should go to the agent. Always resolves: when the classifier library is not available within 1.5 s (not loaded yet, or failed to load), it resolves `true`, so the query runs as a keyword search. Returns `undefined` for empty input. Tracks a `search_orchestrator` event with `search_string` and `is_conversational`, which feeds the Ask Me Anything dashboard |
| `invokeSearchHubOrch(input, triggerComponent = 'search')` | Opens the chat widget and sends `input` as the shopper's message: selects the orchestrator weblayer for the current locale, shows and opens the widget, sends the message |
| `onFocus()` | Adds a `preconnect` to the agent's API host. Call it when the search input gets focus, so the first conversational query has no connection setup to wait for |

### Your search handler

Add one branch where your page handles a submitted search:

```js
const onSearchSubmit = async (query) => {
  query = query.trim()
  if (!query) return

  // Helper Tag not on the page (feature off, or shopper outside its audience): behave as before
  if (!window.CLARITY_HELPER?.isSearch) {
    runSiteSearch(query)
    return
  }

  if (await window.CLARITY_HELPER.isSearch(query)) {
    runSiteSearch(query)
  } else {
    window.CLARITY_HELPER.invokeSearchHubOrch(query)
  }
}

searchInput.addEventListener('focus', () => window.CLARITY_HELPER?.onFocus?.())
```

Two things to get right:

- **Fall back to your search when the helper is missing.** The Helper Tag may be absent for a shopper, by
  audience or because the feature is switched off. Once it is present, `isSearch` takes care of the failure
  cases itself: a classifier that is unavailable or slow answers "keyword search", never an error, and the
  `search_orchestrator` event then carries a `fallback` field (`library_unavailable` or `timeout`).
- **Deploy the branch everywhere the search bar is.** A search bar that submits without the branch simply
  shows results, and nobody notices the feature is not running there.

### Using the library in your own code

If you prefer not to call the injected `window.CLARITY_HELPER`, the classifier is published as an npm package
and you can call it yourself:

```bash
npm install @bloomreach/clarity-utils
```

```js
import { clarityUtils } from '@bloomreach/clarity-utils'

const onSearchSubmit = (query) => {
  // locale: a full code such as 'en-us' or 'de-de'; a bare 'de' falls back to English
  if (clarityUtils.isSearch(query, { mode: 'score', locale: 'en-us' })) {
    runSiteSearch(query)
  } else {
    window.CLARITY_HELPER?.invokeSearchHubOrch(query)
  }
}
```

`clarityUtils.isSearch` is synchronous and returns a plain `boolean`: classification never waits on the network
(only the optional `setup()` list downloads do, which you can bound with `timeoutMs`). The full API, modes and options are in
the [`@bloomreach/clarity-utils` reference](../reference/clarity-utils.md). What you have to take care of
yourself on this path:

- **Opening the chat.** `invokeSearchHubOrch` lives in the Helper Tag. Without it, open the widget through the
  [runtime API](../reference/runtime-api.md): `window.CLARITY.setSource(<orchestrator weblayer id>)`, then
  `call('show_badge')`, `call('open_chat')` and `call('user_send_message', { input: query, type: 'text',
  force: true })`. The widget has to be on the page already (the orchestrator weblayer, or your own
  [`window.CLARITY_CONFIG`](../reference/widget-config.md)).
- **Analytics.** The Helper Tag tracks the `search_orchestrator` event; when you call the library directly,
  track it yourself through the Engagement SDK (`track('clarity', { action: 'search_orchestrator',
  search_string, is_conversational })`) if you want the routing in the dashboard.
- **Versions.** Pin the package version and update it deliberately: the word lists the classifier uses are
  tuned over time.

The library is also available as a browser global for pages without a bundler
(`https://unpkg.com/@bloomreach/clarity-utils@<version>/dist/index.global.js`, exposing `window.clarityUtils`).

### How the classification decides

The default `score` mode weighs simple signals of the query — word count, question words, pronouns, common
verbs, a question mark, the share of stopwords, average word length — and compares a keyword score with a
conversational score; ties go to keyword search. A query containing a **support** word (order, return, refund,
password, …) is always routed to the agent, so that the support hand-over of Level 2 can take it. The word
lists exist per language (English, German, French, Italian, Dutch, Spanish) and can be overridden per call.
Details and the other modes are in the [reference](../reference/clarity-utils.md#modes).

Being a heuristic, it has edge cases: a long exact product name can score as conversational, a short question
as a keyword search. Report misclassified queries to your Bloomreach contact; most fixes are additions to the
word lists.

---

## Level 2: the agent decides who answers

Once a query reaches the Conversational Agent, each message is routed once more, in the backend. When your
account has a customer-service agent integrated (see [Customer service hand-over](./06-customer-service-zendesk.md)),
the **agent orchestrator** looks at the message and the conversation so far and decides whether the
Conversational Agent answers or the message is handed to the customer-service agent, together with a summary
of the conversation. The decision is driven by the list of **topics** that belong to customer service, agreed
with Bloomreach when the integration is set up (for example order inquiries, returns, shipping policy, asking
for a human). A topic match hands the message over; everything else stays with the Conversational Agent.

Nothing on your page is involved: the shopper stays in the same chat window, the widget shows who is answering,
and the hand-over appears in your analytics as [`externalAgentRespond`](../reference/hooks.md#externalagentrespond)
events. Without a customer-service integration there is no Level 2: the Conversational Agent answers every
message it receives and points shoppers with support questions to your support page.

---

## See also

- [`@bloomreach/clarity-utils` reference](../reference/clarity-utils.md): `isSearch`, `setup`, modes and options
- [Runtime API](../reference/runtime-api.md): opening the chat and sending a message from page code
- [Customer service hand-over: Zendesk](./06-customer-service-zendesk.md): what Level 2 hands over to
- [Ask me anything search](https://documentation.bloomreach.com/clarity/docs/ask-me-anything-search) in the product documentation

---

[← Chapter 4 — Context-aware pricing](04-context-aware-pricing.md) · [Chapter 6 — Customer service hand-over →](06-customer-service-zendesk.md)
