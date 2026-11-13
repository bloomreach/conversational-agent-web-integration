# <img src="images/bloomreach-logo.svg" width="32" height="32" alt="Bloomreach logo" /> Bloomreach Conversational Agent — Web Integration

Documentation for integrating the Bloomreach Conversational Agent chat widget (also referred to as Clarity) on a
merchant's website: what your page can configure, call, listen to and restyle. This repo is meant for the
merchant's frontend developers. The widget itself is delivered to the page by a Bloomreach Engagement weblayer
that your Bloomreach contact configures; the pages here cover the part that happens in your code.

Refer to the [Bloomreach documentation](https://documentation.bloomreach.com/clarity/) for the product
documentation. To build your own chat UI on the headless API instead of using the widget, see
[conversational-agent-api](https://github.com/bloomreach/conversational-agent-api).

## Contents

| Path | What it is |
|---|---|
| [`guides/`](./guides/README.md) | **Web Integration Guide.** Getting started, then one chapter per integration task: triggers, styling, custom components, event tracking, side panel, context-aware pricing, search orchestration, customer service hand-over. Start here. |
| [`reference/widget-config.md`](./reference/widget-config.md) | `window.CLARITY_CONFIG`: every field of the widget configuration your page defines or the weblayer writes for you. |
| [`reference/weblayer-config.md`](./reference/weblayer-config.md) | `window.CLARITY_WEBLAYER_CONFIG`: trigger templates and their parameters, scheduling, safety gates, and the widget settings set in the weblayer. |
| [`reference/runtime-api.md`](./reference/runtime-api.md) | `window.CLARITY`: the commands your page code can call — open the chat, send a message, switch configuration. |
| [`reference/hooks.md`](./reference/hooks.md) | How your page reacts to the widget: hook callbacks and the `Clarity:*` / `ClarityTrigger:*` browser events, with their params. |
| [`reference/analytics-events.md`](./reference/analytics-events.md) | The `clarity` events the weblayer tracks to Engagement, action by action, with their fields. |
| [`reference/styles.md`](./reference/styles.md) | CSS classes and CSS variables of the widget and its trigger templates. |
| [`reference/clarity-utils.md`](./reference/clarity-utils.md) | The `@bloomreach/clarity-utils` query classifier used by search orchestration: `isSearch`, `setup`, `warmUp`, modes and options. |
| [`CHANGELOG.md`](./CHANGELOG.md) | What changed in the documented contract with each widget release published here; the version headings are the widget release tags. |
| [`AGENTS.md`](./AGENTS.md) | Instructions for AI coding agents working on an integration: what this repo covers, which page answers which task, the rules that keep an integration working. `CLAUDE.md` points to it. |

Guides explain *how* to do a task and link into the reference pages instead of repeating them; the reference
pages are the source of truth when the two disagree.

## Suggested workflow

1. Read [Getting Started](./guides/README.md) for how the widget reaches your page and what your page provides.
2. Pick the chapter for your task — most integrations need only [Chapter 1](./guides/01-triggers.md) and, for a
   custom product card, [Chapter 3](./guides/03-customize-components.md).
3. Keep the reference pages open while coding; [`hooks.md`](./reference/hooks.md) and
   [`styles.md`](./reference/styles.md) are the ones you will come back to.

## Versions

The version headings in [`CHANGELOG.md`](./CHANGELOG.md) (`v2.42.10`, …) are widget releases: the docs under a
heading match the code released as that version. Releases reach the Bloomreach environments one after the other,
so your page can run an earlier version than the latest one documented here for a while; your Bloomreach contact
can tell you which version your environment runs.

## Compatibility

Component and function overrides, the documented CSS classes and CSS variables, and the documented hooks are a
contract: they stay backward compatible across releases. Anything not documented here can change without notice.
