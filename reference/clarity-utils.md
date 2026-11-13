# `@bloomreach/clarity-utils`

The query classifier behind [search orchestration](../guides/07-search-orchestration.md): a small, dependency-free
library that decides whether a search query is a keyword search or should go to the Conversational Agent, either
on the page without a network call or, in [`api` mode](#api), with Bloomreach's classifier service. The Helper
Tag deployed by Bloomreach wraps it as `window.CLARITY_HELPER.isSearch`; this page documents the library itself,
for integrations that call it directly.

- npm: [`@bloomreach/clarity-utils`](https://www.npmjs.com/package/@bloomreach/clarity-utils)
- Browser global: `https://unpkg.com/@bloomreach/clarity-utils@<version>/dist/index.global.js` defines
  `window.clarityUtils`

Two versions are published:

| Version | npm tag | Used by | What it adds |
|---|---|---|---|
| 1.0.20 | `latest` | Search orchestration version 1 | |
| 1.0.21 | `next` | Search orchestration version 2 | `isSearch` returns a `Promise`; [`api` mode](#api), [`warmUp()`](#warmupconfig), `setup()` `timeoutMs`; `mode: 'list'` applies the word lists |

```js
import { clarityUtils } from '@bloomreach/clarity-utils'

// 1.0.20
clarityUtils.isSearch('red sneakers')                       // true  → keyword search
clarityUtils.isSearch('what should I wear for a rainy hike') // false → conversation
clarityUtils.isSearch('where is my order')                  // false → conversation (support word)

// 1.0.21: the same calls resolve to the same results
await clarityUtils.isSearch('red sneakers')                 // true  → keyword search
```

---

## `isSearch(query, config?)`

```ts
isSearch(query: string, config?: ClarityUtilsConfig): boolean            // 1.0.20
isSearch(query: string, config?: ClarityUtilsConfig): Promise<boolean>   // 1.0.21
```

Returns `true` when `query` should run as a keyword search and `false` when it should be handed to the agent.
`config` overrides, for this call only, the fields [`setup()`](#setupconfig) stored; lists downloaded by `setup()` stay in force, and an inline `whiteList` / `blackList` is added to them.

In 1.0.20 the function is synchronous. From 1.0.21 it returns a `Promise` in every mode; always `await` it: a
`Promise` is truthy, so `if (clarityUtils.isSearch(query))` would treat every query as a keyword search.

Outside `api` mode, the query is lowercased and tokenized; in `score` mode for the configured locale, in the other modes as English (contractions such as *won't* are expanded; French and
Italian elisions such as *j'ai* are split in `score` mode with that locale only). An empty query returns `true`.

In the current version the function logs its reasoning to the browser console (`console.group` per call).

## `setup(config)`

```ts
setup(config: ClarityUtilsConfig): Promise<{ success: true } | { success: false; error: unknown }>
```

Stores a default configuration for every following `isSearch` call and, when `whiteListJson` /
`blackListJson` are set, fetches those JSON files (arrays of strings). When they fail, or from 1.0.21 exceed
`timeoutMs` if you set one, `setup` resolves `{ success: false, error }`: the configuration is still stored,
without the downloaded lists, and `isSearch` keeps working with it. Optional: `isSearch` works without `setup`,
with the defaults below. Except in [`api` mode](#api), `isSearch` itself never waits on the network.

From 1.0.21, with `classifierUrl` set, `setup` also adds a `<link rel="preconnect">` to the classifier service's
host, so the first `api` call does not wait for the connection to be set up.

## `warmUp(config?)`

```ts
warmUp(config?: ClarityUtilsConfig): void
```

From 1.0.21, for `api` mode. Call it when the search input gets focus: it opens the connection to
`classifierUrl` (the one passed here, or else the one stored by `setup()`), which browsers close after a few idle
seconds, so the classification that follows does not wait for a new one. Calls closer than 5 seconds apart do
nothing. Without `classifierUrl`, it does nothing.

## `ClarityUtilsConfig`

| Field | Type | Used by | Description |
|---|---|---|---|
| `mode` | `'score' \| 'list' \| 'length' \| 'mixed' \| 'api'` | all | Which decision procedure to use, see [Modes](#modes). Default `'score'`. `'api'` from 1.0.21 |
| `locale` | `string` | `score` (tokenizer and word lists) | Which language's word lists to use: one of `en-us`, `en-gb`, `en-ca`, `de-de`, `fr-fr`, `fr-ca`, `it-it`, `nl-nl`, `es-es`, `es-us` (case-insensitive). Any other value — including a bare language code such as `de` — falls back to English (`en-us`), so pass the full code |
| `scoreQuestionWords`, `scorePronouns`, `scoreCommonVerbs`, `scoreStopwords`, `scoreSupportWords` | `string[]` | `score` | Replace the locale's default list of that kind (single words or multi-word phrases, matched case-insensitively) |
| `whiteList`, `blackList` | `string[]` | `mixed`; also `list` from 1.0.21 | Inline word lists of single words (a multi-word entry never matches); a black-list entry made only of punctuation is matched as a substring of the query |
| `whiteListJson`, `blackListJson` | `string` | `mixed`; also `list` from 1.0.21 | URLs of JSON arrays with the same meaning, fetched by `setup()` |
| `timeoutMs` | `number` | `setup()` | From 1.0.21. Time limit for the `whiteListJson` / `blackListJson` downloads; unset means no limit |
| `maxLength` | `number \| null` | `length`, `mixed` | Maximum number of words for a keyword search; unset, `null` or `0` means no limit |
| `classifierUrl` | `string` | `api`, `setup()`, `warmUp()` | From 1.0.21. Address of Bloomreach's classifier service, given to you by your Bloomreach contact |
| `agentId` | `string` | `api` | From 1.0.21. Your agent id, so the service answers with the model for your agent; given to you by your Bloomreach contact |
| `classifierTimeoutMs` | `number` | `api` | From 1.0.21. How long to wait for the classifier service before treating the query as a keyword search. Default `500` |

## Modes

### `score` (default)

Every query gets a **keyword** score and a **conversational** score; the result is keyword search when the
keyword score is greater than or equal to the conversational score.

Word counts and lengths below include punctuation marks, each counted as a word (apostrophes excepted).

| Signal | Effect |
|---|---|
| A **support word** is present (`order`, `return`, `refund`, `password`, …) | Conversational, regardless of the rest |
| 3 words or fewer | keyword +2 |
| 6 words or more | conversational +2 |
| A question word (`what`, `how`, `can`, `is`, …) | conversational +2 |
| A pronoun (`I`, `my`, `me`, …) | conversational +1 |
| A common verb (`need`, `want`, `look`, …) | conversational +2 |
| A `?` anywhere | conversational +3 |
| More than 40 % of the words are distinct stopwords | conversational +2, otherwise keyword +1 |
| Average word length 6 characters or more | keyword +1 |

The word lists are built in for English, German, French, Italian, Dutch and Spanish and selected by `locale`
(full codes such as `de-de`, see above); each list can be replaced with the `score*` options.

### `list`

In 1.0.20, `mode: 'list'` classifies like `score`, and the word lists apply only in `mixed`. From 1.0.21,
`mode: 'list'` applies the word lists on their own. The lists mean:
keyword search unless the query contains a black-listed word or punctuation; when a white list is configured,
every word must be on it. Every punctuation mark other than an apostrophe counts as a word of its own (a run such
as `...` counts once per character), so with a white list a query containing punctuation is conversational unless
that mark is on the list.

### `length`

Keyword search when the query has at most `maxLength` words; punctuation marks other than apostrophes count as words. Without `maxLength` (or with `0`), always keyword search.

### `mixed`

The word lists and `length` both have to say keyword search.

### `api`

From 1.0.21. Sends the query, as typed, to Bloomreach's classifier service at `classifierUrl`, with `agentId`.
The service recognizes whether the query is a keyword search or a conversation and returns the result. An error,
a missing `classifierUrl`, or no answer within `classifierTimeoutMs` gives keyword search, so the search bar never
waits longer than that. Pair it with [`warmUp()`](#warmupconfig) on search input focus.

---

## Tracking the decision

The library does not track anything. The Helper Tag records each decision as a `search_orchestrator` event
(`search_string`, `is_conversational`) through the Engagement SDK; do the same when you call the library
directly and want the routing in the Ask Me Anything dashboard.
