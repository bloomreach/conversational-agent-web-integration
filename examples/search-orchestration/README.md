# Search orchestration

Your search bar routing conversational queries to the chat; see
[Search orchestration](../../guides/07-search-orchestration.md).

A demonstration of the calls, to adapt to your site rather than copy as it is; see [Examples](../README.md).

| Folder | Whose | What is in it |
|---|---|---|
| [`plain-js/`](./plain-js) | You | Your search handler, in one of two ways. `with-helper-tag.js`: it calls `window.CLARITY_HELPER`; the same code for version 1 and version 2 ([Your search handler](../../guides/07-search-orchestration.md#your-search-handler)). `with-npm-package.js`: it calls `@bloomreach/clarity-utils` from npm, opens the chat and tracks the `search_orchestrator` analytics event itself ([Using the library in your own code](../../guides/07-search-orchestration.md#using-the-library-in-your-own-code)) |

There is no `configuration/` folder: Bloomreach's side is the tags and the weblayer
[it deploys in your Engagement project](../../guides/07-search-orchestration.md#what-bloomreach-deploys), with
nothing in them for you to set or copy.
