# `@bloomreach/clarity-utils`

The query classifier behind [search orchestration](../guides/05-search-orchestration.md): a small, dependency-free
library that decides on the page, without a network call, whether a search query is a keyword search or should
go to the Conversational Agent. The Helper Tag deployed by Bloomreach wraps it as `window.CLARITY_HELPER.isSearch`;
this page documents the library itself, for integrations that call it directly.

- npm: [`@bloomreach/clarity-utils`](https://www.npmjs.com/package/@bloomreach/clarity-utils)
- Browser global: `https://unpkg.com/@bloomreach/clarity-utils@<version>/dist/index.global.js` defines
  `window.clarityUtils`

```js
import { clarityUtils } from '@bloomreach/clarity-utils'

clarityUtils.isSearch('red sneakers')                       // true  → keyword search
clarityUtils.isSearch('what should I wear for a rainy hike') // false → conversation
clarityUtils.isSearch('where is my order')                  // false → conversation (support word)
```

---

## `isSearch(query, config?)`

```ts
isSearch(query: string, config?: ClarityUtilsConfig): boolean
```

Returns `true` when `query` should run as a keyword search and `false` when it should be handed to the agent.
Synchronous. `config` overrides, for this call only, whatever [`setup()`](#setupconfig) stored.

The query is lowercased and tokenized for the configured locale (contractions such as *won't* are expanded,
elisions such as *j'ai* are split). An empty query returns `true`.

In the current version the function logs its reasoning to the browser console (`console.group` per call).

## `setup(config)`

```ts
setup(config: ClarityUtilsConfig): Promise<{ success: true } | { success: false; error: unknown }>
```

Stores a default configuration for every following `isSearch` call and, when `whiteListJson` /
`blackListJson` are set, fetches those JSON files (arrays of strings). When they fail, or exceed `timeoutMs` if
you set one, `setup` resolves `{ success: false, error }` and `isSearch` keeps working with the built-in word
lists. Optional: `isSearch` works without `setup`, with the defaults below.
`isSearch` itself never waits on the network.

## `ClarityUtilsConfig`

| Field | Type | Used by | Description |
|---|---|---|---|
| `mode` | `'score' \| 'list' \| 'length' \| 'mixed'` | all | Which decision procedure to use, see [Modes](#modes). Default `'score'` |
| `locale` | `string` | tokenizer, `score` | Which language's word lists to use: one of `en-us`, `en-gb`, `en-ca`, `de-de`, `fr-fr`, `fr-ca`, `it-it`, `nl-nl`, `es-es`, `es-us` (case-insensitive). Any other value — including a bare language code such as `de` — falls back to English (`en-us`), so pass the full code |
| `scoreQuestionWords`, `scorePronouns`, `scoreCommonVerbs`, `scoreStopwords`, `scoreSupportWords` | `string[]` | `score` | Replace the locale's default list of that kind (single words or multi-word phrases, matched case-insensitively) |
| `timeoutMs` | `number` | `setup()` | Optional time limit for the `whiteListJson` / `blackListJson` downloads; unset means no limit. From 1.0.21 |
| `whiteList`, `blackList` | `string[]` | `list`, `mixed` | Inline word lists; a black-list entry made only of punctuation is matched as a substring of the query |
| `whiteListJson`, `blackListJson` | `string` | `list`, `mixed` | URLs of JSON arrays with the same meaning, fetched by `setup()` |
| `maxLength` | `number \| null` | `length`, `mixed` | Maximum number of words for a keyword search |

## Modes

### `score` (default)

Every query gets a **keyword** score and a **conversational** score; the result is keyword search when the
keyword score is greater than or equal to the conversational score.

| Signal | Effect |
|---|---|
| A **support word** is present (`order`, `return`, `refund`, `password`, …) | Conversational, regardless of the rest |
| 3 words or fewer | keyword +2 |
| 6 words or more | conversational +2 |
| A question word (`what`, `how`, `can`, `is`, …) | conversational +2 |
| A pronoun (`I`, `my`, `me`, …) | conversational +1 |
| A common verb (`need`, `want`, `looking`, …) | conversational +2 |
| A `?` anywhere | conversational +3 |
| More than 40 % of the words are stopwords | conversational +2, otherwise keyword +1 |
| Average word length 6 characters or more | keyword +1 |

The word lists are built in for English, German, French, Italian, Dutch and Spanish and selected by `locale`
(full codes such as `de-de`, see above); each list can be replaced with the `score*` options.

### `list`

Keyword search unless the query contains a black-listed word or punctuation; when a white list is configured,
every word must be on it.

### `length`

Keyword search when the query has at most `maxLength` words. Without `maxLength`, always keyword search.

### `mixed`

`list` and `length` both have to say keyword search.

---

## Tracking the decision

The library does not track anything. The Helper Tag records each decision as a `search_orchestrator` event
(`search_string`, `is_conversational`) through the Engagement SDK; do the same when you call the library
directly and want the routing in the Ask Me Anything dashboard.
