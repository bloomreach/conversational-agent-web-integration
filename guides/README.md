# <img src="../images/bloomreach-logo.svg" width="32" height="32" alt="Bloomreach logo" /> Conversational Agent — Web Integration Guide

This guide explains how the Conversational Agent chat widget (also referred to as Clarity) is integrated on a
merchant's website and what the merchant's developers can do with it. The widget itself is delivered to the page
by a Bloomreach Engagement weblayer, configured together with your Bloomreach contact; this guide covers the part
that happens in your code. The [reference pages](../README.md#contents) are the source of truth for every field,
action, hook and class — when a guide and a reference page disagree, the reference wins.

## Contents

**Getting Started** (this page)

1. [Triggers: how the widget appears on the page](01-triggers.md)
2. [Style the widget](02-style-the-widget.md)
3. [Customize components](03-customize-components.md)
4. [Track events](04-track-events.md)
5. [Side Panel (Desktop AI Mode)](05-side-panel.md)
6. [Context-aware pricing](06-context-aware-pricing.md)
7. [Search orchestration (Ask Me Anything search)](07-search-orchestration.md)
8. [Customer service hand-over: Zendesk](08-customer-service-zendesk.md)

---

## Getting Started

### What you need

- A Bloomreach Engagement project with the Conversational Agent enabled and at least one **agent**. Your
  Bloomreach contact creates the agent and gives you its **agent id**.
- The **Engagement SDK** on your pages. The widget and its triggers are delivered through it as a weblayer, so
  pages without the SDK never show the widget. The SDK snippet belongs to your Engagement project; ask your
  Bloomreach contact for it.
- The **Engagement project id** and the **Conversational Agent URL** of your environment, both provided by
  Bloomreach. You only need them yourself for a [standalone integration](#standalone-integration-without-a-weblayer).

### How the widget reaches your page

```
Engagement SDK on your page
  └─ weblayer (configured by Bloomreach)
       ├─ trigger: a floating button, a banner, a panel of suggested questions, …   → Chapter 1
       └─ the chat widget, loaded behind the trigger and opened when the shopper clicks
```

The weblayer carries the whole configuration: which trigger to show and where, the agent id, colours and texts,
and the widget settings (`window.CLARITY_WEBLAYER_CONFIG`, see [`weblayer-config.md`](../reference/weblayer-config.md)).
It writes the widget's own configuration, `window.CLARITY_CONFIG`
([`widget-config.md`](../reference/widget-config.md)), for you. Bloomreach builds and maintains the weblayer, and
its code is not published; ask your Bloomreach contact for any change to it, such as another trigger or
different settings. In this setup your page is involved in four places:

| Your page provides | Where | Why |
|---|---|---|
| A container element for embedded triggers | A CSS selector agreed with Bloomreach (`PARAM_parentElement`) | Panels of suggested questions render *into* your listing or product page, see [Chapter 1](01-triggers.md#how-every-trigger-behaves) |
| The page context: current product, category, cart | [`getContext()`](../reference/widget-config.md#getcontext-contextfields) and the other context functions, set through the weblayer's widget settings | So the agent answers about the product on screen and the embedded triggers can generate questions for it |
| The shopper's id | [`getCurrentCustomerId()`](../reference/widget-config.md#getcurrentcustomerid-string) | Identifies the shopper to the agent (Engagement personalization, customer-service hand-over); must return the same id on every call |
| Styling | Your stylesheet, overriding the widget's and triggers' classes and CSS variables ([`styles.md`](../reference/styles.md)) | The widget inherits nothing from your page by itself |

Everything else — custom product cards, add-to-cart, listening to events, the side panel, pricing, search
orchestration, customer service hand-over — is optional and has its own chapter.

### Standalone integration (without a weblayer)

A page can also load the widget directly, with no weblayer and no trigger. Define `window.CLARITY_CONFIG`, then
load the loader script Bloomreach gives you; the inline queue makes `window.CLARITY.call(...)` usable before
the bundle has loaded:

```html
<script>
  window.CLARITY = {
    _tempAsyncQueue: [],
    call: (name, arg, source) =>
      new Promise((res, rej) => window.CLARITY._tempAsyncQueue.push({ name, arg, source, res, rej })),
    setSource: (source) => { window.CLARITY_CONFIG.source = source },  // call it once CLARITY_CONFIG is set
  }

  window.CLARITY_CONFIG = {
    projectId: '<your Engagement project id>',
    personaId: '<your agent id>',
    defaultCurrency: 'EUR',
    getCurrentCustomerId: () => getShopperId(),
    getContext: () => ({ currentItemId: getProductId() }),
    hooks: { version: 'WBL_BUNDLE' },   // required for the Clarity:* browser events
  }

  const script = document.createElement('script')
  script.src = 'https://<conversational-agent-url>/cocoaas/public/bundle/index_cocoChatLoader.js'
  document.body.appendChild(script)

  window.CLARITY.call('show_badge')
</script>
```

`projectId`, `personaId` and `defaultCurrency` are required; the full field list and a complete example are in
[`widget-config.md`](../reference/widget-config.md#configuration-example-standalone). Without a weblayer there
is no trigger: show and open the widget from your own code with the [runtime API](../reference/runtime-api.md).
Analytics tracking to Engagement is done by the weblayer, so a standalone page has to forward the
[hooks](../reference/hooks.md) itself if it wants them tracked.

### Check that it works

1. Open a page with the weblayer (or your standalone snippet). The trigger, or the widget's badge, appears.
2. Click it: the chat opens.
3. Send a message. The answer arrives, and `Clarity:userRespond` / `Clarity:clarityRespond` events fire on
   `window` ([`hooks.md`](../reference/hooks.md)).

### Where to go next

| You want to | Read |
|---|---|
| Change how the widget appears on the page, or show it with no trigger | [Chapter 1 — Triggers](01-triggers.md) |
| Restyle the widget or a trigger | [Chapter 2 — Style the widget](02-style-the-widget.md) |
| Replace the product card, carousel or mini-PDP, or intercept add-to-cart | [Chapter 3 — Customize components](03-customize-components.md) |
| React to what happens in the chat, feed your own analytics | [Chapter 4 — Track events](04-track-events.md) |
| Dock the widget as a side panel on desktop | [Chapter 5 — Side Panel](05-side-panel.md) |
| Show each shopper the prices that apply to them | [Chapter 6 — Context-aware pricing](06-context-aware-pricing.md) |
| Route queries from your search bar to the agent | [Chapter 7 — Search orchestration](07-search-orchestration.md) |
| Hand conversations over to your Zendesk agents | [Chapter 8 — Customer service hand-over](08-customer-service-zendesk.md) |
| Open the chat, send a message or switch configuration from page code | [`runtime-api.md`](../reference/runtime-api.md) |

---

Next: [Chapter 1 — Triggers: how the widget appears on the page](01-triggers.md)
