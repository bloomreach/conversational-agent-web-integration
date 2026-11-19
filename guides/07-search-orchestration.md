[← Back to Chapter 6 — Context-aware pricing](06-context-aware-pricing.md)

# 7. Search orchestration (Ask Me Anything search)

Search orchestration turns your site's search bar into one entry point. Each submitted query is routed to the
experience built for it: a **keyword** query ("red sneakers") runs your normal site search; a **conversational**
query ("what should I wear for a rainy hike") opens the Conversational Agent with the question; a **support**
question ("where is my order") reaches your customer-service agent when one is integrated, otherwise the agent
points the shopper to your support page.

Search orchestration comes in two versions. They differ in where a query is classified as keyword search or
conversation:

- **Search orchestration version 1 — on-page classification.** A heuristic runs in the shopper's browser and
  decides without a network call, from the words of the query.
- **Search orchestration version 2 — classifier service.** The page sends the query to Bloomreach's classifier
  service, which answers with the model trained for your agent. Classification takes one network call, bounded
  at 500 ms.

| | Version 1 | Version 2 |
|---|---|---|
| Where the query is classified | In the browser (on-page classification) | Bloomreach's classifier service |
| `@bloomreach/clarity-utils` npm tag | `latest` | `next` |
| Classification time, once the library has loaded | No network call | Up to 500 ms, overlapped with the keyword search when that is started in parallel ([below](#your-search-handler)) |

Everything else is shared: the other tags Bloomreach deploys, `isSearch` and `invokeSearchHubOrch`, the analytics
event, and the agent selection of Level 2. [Moving from version 1 to version
2](#moving-from-version-1-to-version-2) lists what changes on your side.

The routing happens in two steps, at two levels:

| Level | Where | Decides | Who implements it |
|---|---|---|---|
| **1. Query classification** | On your page, before results load | Keyword search or conversation | Your search handler calls `isSearch()` from [`@bloomreach/clarity-utils`](../reference/clarity-utils.md), directly or through the Helper Tag |
| **2. Agent selection** | In the Conversational Agent's backend, on each typed message or quick reply | Whether the Conversational Agent or your customer-service agent answers | Nothing to implement; configured on your agent by Bloomreach |

Level 1 keeps keyword search fast: version 1 decides locally, version 2 gives up on the classifier service after
500 ms and runs the keyword search. Level 2 is a language-model step that looks at the message and the
conversation so far.

---

## Level 1: classify the query on the page

### What Bloomreach deploys

Your Bloomreach contact deploys four pieces in your Engagement project:

1. **Global Tag** — defines `window.CLARITY_GLOBAL_CONFIG` (your agent id, the SDK name, the loader of the
   chat widget, tester and traffic gating). Every other Conversational Agent tag and weblayer depends on it.
2. **Helper Tag** — defines `window.CLARITY_HELPER`, the functions your search handler calls (below). It loads
   the classifier library from the CDN. Its audience in Engagement is also the on/off switch for the feature:
   restricted to testers before go-live, removed to roll back without a release on your side. One Helper Tag
   serves both versions: its settings select version 1 or version 2, and for version 2 it is set up with the
   address of the classifier service and sends your agent id from the Global Tag with each query.
3. **Orchestrator Tag** — once the Global Tag is present, shows the orchestrator weblayer.
4. **Orchestrator WebLayer** — a weblayer with no trigger that loads the chat widget hidden, so that it can be
   opened instantly when a conversational query comes in. It is a dedicated weblayer so that conversations
   started from the search bar are reported under their own banner in analytics.

Everything is configured in Engagement; nothing of this ships in your codebase.

### `window.CLARITY_HELPER`

| Function | What it does |
|---|---|
| `isSearch(input, config?)` → `Promise<boolean>` | `true` when the query is a keyword search, `false` when it should go to the agent. Always resolves: when the classifier library is not available within 1.5 s (not loaded yet, or failed to load), it resolves `true`, so the query runs as a keyword search. It also resolves `true`, without classifying, when the chat cannot be opened: the page's locale has no orchestrator weblayer, or no Conversational Agent weblayer has started on the page yet. Resolves `true` for empty input, without tracking. Tracks a `search_orchestrator` event with `search_string` and `is_conversational`, which feeds the Ask Me Anything dashboard; when one of the cases above made it answer keyword search, the event also carries `fallback` (`library_unavailable`: the library failed to load; `timeout`: it was still loading after 1.5 s; or `chat_unavailable`). **Version 1:** `config` is passed to the classifier; on a non-English page pass `{ locale }` with one of the [supported codes](../reference/clarity-utils.md#clarityutilsconfig) (for example `{ locale: 'fr-ca' }`); any other value, bare or regional (`de`, `de-at`), uses the English word lists. **Version 2:** the query goes to the classifier service; when the service answers with an error or not within 500 ms, it resolves `true`, tracked as a keyword search without `fallback`. `locale` is not needed |
| `onFocus()` | Call it when the search input gets focus. With version 2 it opens the connection to the classifier service ahead of the query, so the classification that follows does not wait for a new connection. Calls closer than 5 seconds apart do nothing, and so does every call with version 1 |
| `invokeSearchHubOrch(input, triggerComponent = 'search')` | Opens the chat widget and sends `input` as the shopper's message: selects the orchestrator weblayer for the current locale, shows and opens the widget, sends the message. Does nothing when the page's locale has no orchestrator weblayer, or no Conversational Agent weblayer has started on the page yet; `isSearch` resolves `true` in both cases, so a query it routes to the agent always opens the chat. Called after that but before the widget bundle has loaded, it is queued and runs once the bundle is ready. `triggerComponent` labels the opening in analytics (`chat_opened_from_trigger_component`) |

### Your search handler

Add one branch where your page handles a submitted search, and call `onFocus()` when the search input gets
focus, as [`with-helper-tag.js`](../examples/search-orchestration/plain-js/with-helper-tag.js) does. The same code works with both
versions, so switching versions needs no change on your side.

`fetchSearchResults` and `renderSearchResults` are your search request and your results view. Starting the
request together with `isSearch` means a keyword search does not wait for the classification first and the
search second. If your results page runs its own search when it loads, call `runSiteSearch(query)` when
`isSearch` answers keyword search instead.

- **Check only that `window.CLARITY_HELPER` exists.** It is missing for shoppers outside the Helper Tag's
  audience or when the feature is switched off; run your search as before then. Everything else is handled by
  `isSearch`: whenever the query cannot go to the agent, it answers keyword search.
- **Deploy the branch everywhere the search bar is.** A search bar that submits without the branch simply
  shows results, and nobody notices the feature is not running there.

### Using the library in your own code

If you prefer not to call the injected `window.CLARITY_HELPER`, the classifier is published as an npm package
and you can call it yourself. The npm tag and the `setup()` argument select the version; the rest of the code
is the same for both. [`with-npm-package.js`](../examples/search-orchestration/plain-js/with-npm-package.js) is the search handler on this path.

```bash
npm install --save-exact @bloomreach/clarity-utils@latest   # version 2: @next
```

`isSearch` returns a `Promise` on `next` and a `boolean` on `latest`, and `warmUp()` exists only on `next`; the
example's `await` and `?.()` make it work with either tag. The full API, modes and options are in the [`@bloomreach/clarity-utils`
reference](../reference/clarity-utils.md). On this path you also take care of:

- **Opening the chat.** Use the [runtime API](../reference/runtime-api.md): `call('show_badge', opening, source)`,
  `call('open_chat', opening, source)` and
  `call('user_send_message', { input: query, type: 'text', force: true, ...opening }, source)`, with
  `opening = { triggerComponent: 'search' }`, which labels the opening in analytics, and the orchestrator
  weblayer's id as `source`.
- **Analytics.** The Helper Tag tracks the `search_orchestrator` event; when you call the library directly,
  track it yourself through the Engagement SDK (`track('clarity', { action: 'search_orchestrator',
  search_string, is_conversational })`): the Ask Me Anything dashboard is built on it.
- **Updates.** Install from the npm tag of your version, `latest` or `next`, as above, and run the install
  command again to pick up a new release.

The library is also available as a browser global for pages without a bundler
(`https://unpkg.com/@bloomreach/clarity-utils@latest/dist/index.global.js`, or `@next` for version 2, exposing
`window.clarityUtils`).

### How the classification decides

**Version 1.** The default `score` mode weighs simple signals of the query — word count, question words,
pronouns, common verbs, a question mark, the share of stopwords, average word length — and compares a keyword
score with a conversational score; ties go to keyword search. A query containing a **support** word (order,
return, refund, password, …) is always routed to the agent, so that the support hand-over of Level 2 can take
it. The word lists exist per language (English, German, French, Italian, Dutch, Spanish) and can be overridden
per call. Details and the other modes are in the [reference](../reference/clarity-utils.md#modes).

Being a heuristic, it has edge cases: a long exact product name can score as conversational, a short question
as a keyword search. Report misclassified queries to your Bloomreach contact; most fixes are additions to the
word lists.

**Version 2.** The query is sent as typed, with your agent id, to Bloomreach's classifier service. The
service's model for your agent recognizes whether the query is a keyword search or a conversation and returns
the result. An error, or no answer within 500 ms, gives keyword search. Report misclassified queries to your
Bloomreach contact; they are used to improve the model.

---

## Level 2: the agent decides who answers

Once a query reaches the Conversational Agent, each typed message or quick reply is routed once more, in the
backend; buttons that call a Conversational Agent action, and messages during a live customer-service session, are
not. When your
account has a customer-service agent integrated (see [Customer service hand-over](./08-customer-service-zendesk.md)),
the **agent orchestrator** looks at the message and the conversation so far and decides whether the
Conversational Agent answers or the message is handed to the customer-service agent, together with a summary
of the conversation. The decision is driven by the list of **topics** that belong to customer service, agreed
with Bloomreach when the integration is set up (for example order inquiries, returns, shipping policy, asking
for a human). A topic match hands the message over; everything else stays with the Conversational Agent.

Nothing on your page is involved: the shopper stays in the same chat window, the widget shows who is answering,
and the customer-service agent's replies appear in your analytics as
[`external_agent_respond`](../reference/analytics-events.md#external_agent_respond) events, one per reply.
Without a customer-service integration there is no Level 2: the Conversational Agent answers every message it
receives and points shoppers with support questions to your support page. Level 2 is the same in both versions.

---

## Moving from version 1 to version 2

Ask your Bloomreach contact to switch the Helper Tag to version 2. With the [search
handler](#your-search-handler) above, nothing changes on your side.

If you call the library in your own code instead of the Helper Tag, install the `next` tag (`npm install
--save-exact @bloomreach/clarity-utils@next`), pass `{ mode: 'api', classifierUrl, agentId }` to `setup()` with
the values from your Bloomreach contact, and `await` every `isSearch` call; see [Using the library in your own
code](#using-the-library-in-your-own-code).

Analytics do not change: both versions track the same `search_orchestrator` event.

---

## See also

- [`@bloomreach/clarity-utils` reference](../reference/clarity-utils.md): `isSearch`, `setup`, `warmUp`, modes and options
- [Runtime API](../reference/runtime-api.md): opening the chat and sending a message from page code
- [Customer service hand-over: Zendesk](./08-customer-service-zendesk.md): what Level 2 hands over to
- [Ask me anything search](https://documentation.bloomreach.com/clarity/docs/ask-me-anything-search) in the product documentation

---

[← Chapter 6 — Context-aware pricing](06-context-aware-pricing.md) · [Chapter 8 — Customer service hand-over →](08-customer-service-zendesk.md)
