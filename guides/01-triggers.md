[← Back to Getting Started](README.md)

# 1. Triggers: how the widget appears on the page

The chat widget reaches your site through an Engagement **weblayer**. The weblayer renders a **trigger**, the
element a shopper interacts with to start the conversation (a floating button, a banner on a listing page, a
panel of suggested questions on a product page, …), and loads the chat widget behind it. Which trigger you get
is the weblayer's [`triggerTemplate`](../reference/weblayer-config.md#triggertemplate); a weblayer can also
show the widget with no trigger at all.

This guide explains what each template is, where it renders, what happens when the shopper clicks it, and what
your page has to provide. The complete list of parameters is in
[`weblayer-config.md`](../reference/weblayer-config.md); the CSS classes of each template are in
[`styles.md`](../reference/styles.md#trigger-class-hierarchy).

---

## Choosing a template

| Template | Looks like | Where | On click |
|---|---|---|---|
| [`floating_trigger`](#floating-trigger) | A draggable tab with your logo | Over the page, right edge | Opens the chat |
| [`plp_banner`](#plp-banner) | A banner with a headline, an image and one button | In a listing page, where you place it | Opens the chat and sends the banner text as the first message |
| [`plp_embedded`](#plp-embedded) | A panel with a banner and suggested questions | In a listing page | Opens the chat with the clicked question |
| [`pdp_embedded`](#pdp-embedded) | A panel of suggested questions about the product | In a product page | Opens the chat with the clicked question, about this product |
| [`interaction_embedded`](#interaction-embedded) | A panel that answers inside itself | Anywhere on the page | Shows the answer in the panel; opens the chat for recommendations |
| [`embedded_chat`](#embedded-chat) | A small chat (input and messages) inline | Anywhere on the page | Converses inline, without opening the widget |
| [`search_suggestion`](#search-suggestion) | Suggestions under your own search box | Where your page tells it to | Opens the chat with the chosen suggestion |
| [`quiz_embedded`](#quiz-embedded) | A step-by-step questionnaire | Anywhere on the page | Opens the chat with the answers and asks for recommendations |
| [No template](#no-trigger-directshowwidget) | Nothing: the widget itself appears | — | — |

The template is a weblayer setting, usually chosen with your Bloomreach contact. Your page is involved in two
places: it has to contain the element the embedded templates render into, and it can style the trigger and
listen to its events.

---

## How every trigger behaves

**Loading.** When the weblayer runs on a page, it first checks its
[safety gates](../reference/weblayer-config.md#safety-metrics) and its
[scheduling](../reference/weblayer-config.md#scheduling), once: if either says no, nothing loads on that page.
When both pass, it waits [`PARAM_showAfter`](../reference/weblayer-config.md#lifecycle) seconds and the parent
element (see Placement), then loads the chat widget bundle, or reuses the one another weblayer already loaded
on the page. The trigger is rendered once the widget has initialized.

**Placement.** `floating_trigger` renders over the page. Every other template renders **into an element of
your page** selected by [`PARAM_parentElement`](../reference/weblayer-config.md#shared-all-templates) (a CSS
selector; several candidates separated by `PARAM_arraySplitter`, the first match wins). The weblayer waits up
to `PARAM_waitForElementsTimeout` (default 3 s) for that element to exist, so single-page apps that render the
container late are covered; if it never appears, the trigger is not rendered. Inside the parent,
`PARAM_index`, `PARAM_targetElement` and `PARAM_positiontoTargetElement` decide the exact position. The trigger
is a `<div>` in your page's DOM, not a shadow root, with the classes `cui-trigger`,
`clarity-trigger-<template>` (`clarity-trigger-base` without a template) and `clarity-trigger-id-<banner_id>` (plus
`PARAM_className`, and `clarity-trigger-control-group` for a control group).

**Styling.** The trigger inherits your page's CSS. Override its `cui-*` classes and `--cui-param-*` variables
from your stylesheet, or put CSS in the weblayer's [`style`](../reference/weblayer-config.md#identity--tracking)
field. See [`styles.md` → Trigger Class Hierarchy](../reference/styles.md#trigger-class-hierarchy).

**Opening the chat.** When a trigger opens the chat it shows the widget, opens it, and, if the trigger carries a
text (a suggested question, the banner text, a quiz answer), sends that text as the shopper's first message.
When a text is sent, the widget's own initial message is skipped.

**Events.** Every trigger fires `ClarityTrigger:*` browser events (`show` when it scrolls into view, `clicked`,
…) that your page can listen to, and tracks them to Engagement; see
[`hooks.md` → Trigger Hooks](../reference/hooks.md#trigger-hooks). The weblayer's `trigger.hooks` and
`trigger.trackerConfig` add your own callbacks and analytics properties.

**Empty state.** An embedded template that would render nothing (no questions came back and none are
configured) hides itself instead of showing an empty panel. Configure `PARAM_fallbackQuestions` so it has
content when nothing is generated; it is still hidden when the product or category lookup fails, see
[`weblayer-config.md`](../reference/weblayer-config.md#plp-embedded--pdp-embedded--interaction-embedded--embedded-chat).

**One widget per page.** All triggers on a page share one widget. They may differ in template and settings,
but [`widgetTemplate`](../reference/weblayer-config.md#widgettemplate) has to be the same for all of them.

---

## Templates

### Floating trigger

`triggerTemplate: 'floating_trigger'`. A tab fixed to the right edge of the page, vertically centred, that the
shopper can drag up and down (the position is remembered); shows your logo (`PARAM_logo`) or the assistant
icon. Needs no element on your page.

Click: opens the chat. While the chat is open the button is hidden; `PARAM_showTriggerWhenMinimized` keeps it
visible when the widget is minimized.

### PLP banner

`triggerTemplate: 'plp_banner'`. A banner for a listing page: a headline in three parts
(`PARAM_headerPrefixText`, `PARAM_headerGradientText`, `PARAM_headerSuffixText`), an image
(`PARAM_bannerImage`), a text (`PARAM_bannerText`) and one button (`PARAM_buttonText`). Renders into
`PARAM_parentElement`.

Click: opens the chat and sends `PARAM_bannerText` as the shopper's first message. With
`PARAM_isToggleButton` the button toggles the widget instead: it hides the widget when it is visible, firing the
[`badgeHidden`](../reference/hooks.md#badgehidden) hook, which makes the banner an open/close control, used for example with the
[Side Panel](./05-side-panel.md), where hiding the widget collapses the panel.

### PLP embedded

`triggerTemplate: 'plp_embedded'`. A panel for a listing page: a header, a banner (image and three-part
text: `PARAM_bannerPrefixText`, `PARAM_bannerGradientText`, `PARAM_bannerSuffixText`) and a row of suggested
questions. The questions are either generated for the listed products (`PARAM_enableGeneratedQuestions`,
with `PARAM_generatedQuestionsCountLimit` and the static questions before and after) or the static list in
`PARAM_buttonText`; an "Ask anything" button (`PARAM_anythingPrompt`) opens the chat without a question.
Renders into `PARAM_parentElement`.

Click on a question: opens the chat with that question as the first message.

### PDP embedded

`triggerTemplate: 'pdp_embedded'`. The product-page counterpart: a header (`PARAM_headerText`) and suggested
questions about the product on the page, generated from the product (`PARAM_enableGeneratedQuestions`, with
`PARAM_staticQuestionsBefore`, `PARAM_staticQuestionsAfter`, `PARAM_staticReviewQuestions` when a review summary
exists, and `PARAM_fallbackQuestions` when nothing is generated) or static (`PARAM_buttonText`), and an "Ask
anything" button. Renders into `PARAM_parentElement`.

The product is identified by the weblayer's [`productIds`](../reference/weblayer-config.md#product-context),
which your page provides (through the weblayer's product context or
[`getContext()`](../reference/widget-config.md#getcontext-contextfields)).

Click on a question: opens the chat with that question, scoped to the product on the page.

### Interaction embedded

`triggerTemplate: 'interaction_embedded'`. A panel that holds a short conversation **inside itself**: a header
(`PARAM_headerText`; once an answer is shown, a close button that starts the conversation over), suggested questions (generated or static, same parameters as the
PDP template), and room for the answer. Renders into `PARAM_parentElement`.

Click on a question: the question and the assistant's text answer are shown in the panel, followed by the next
suggested questions. The widget is not opened. When the answer comes with product recommendations, a button
(`PARAM_seeRecommendationsPrompt`, default "See product recommendations") opens the chat with them; the "Ask
anything" button (`PARAM_anythingPrompt`) opens the chat too. The panel's conversation and the chat are the
same conversation.

### Embedded chat

`triggerTemplate: 'embedded_chat'`. A compact chat inline on the page: a message area capped at
`PARAM_maxChatContainerHeight`, an input (`PARAM_inputPlaceholder`) and suggested questions (generated or
static, same parameters as the PDP template; long button texts wrap according to `PARAM_textLengthToDivide`).
Renders into `PARAM_parentElement`.

The shopper converses in the panel; messages and answers are shown inline and the floating widget stays
closed, except that an answer with products carries a "See products" link that opens it. A reset control starts
the conversation over.

### Search suggestion

`triggerTemplate: 'search_suggestion'`. Conversational suggestions under **your own search box**. This template
renders nothing on its own: your page drives it through the trigger API as the shopper types,

```js
await window.CLARITY_WEBLAYER?.call(bannerId, 'search', {
  text: input.value,            // what the shopper typed
  container: suggestionsEl,     // the element to render the suggestions into
})
```

and the weblayer renders a list of suggested questions (`PARAM_resultsHeaderText` above it, at most
`PARAM_suggestionsLimit` items) once the text has `PARAM_minSearchLength` characters (default 3); shorter input,
or a search with no results, shows `PARAM_fallbackQuestions` (or, if unset, `widget.PARAM_placeholderQuestions`). The `rerender`, `hide` and `select` commands are described under
[`window.CLARITY_WEBLAYER`](../reference/weblayer-config.md#windowclarity_weblayer--trigger-api). `bannerId`
is the weblayer's `data.banner_id`.

Click on a suggestion: opens the chat with that suggestion as the first message. The list clears unless
`PARAM_keepSuggestionsAfterClick` is set, and the previous conversation is reset unless
`PARAM_keepChatHistoryOnSuggestionClick` is set.

### Quiz embedded

`triggerTemplate: 'quiz_embedded'`. A step-by-step questionnaire (`quizQuestions`: each with options or a
free-text field, `PARAM_optionalText` shown after free-text questions), with a progress bar, back and close buttons, an
optional banner (`PARAM_bannerImage`, `PARAM_bannerText`). Renders into `PARAM_parentElement`.

On the last answer: opens the chat, replays the questions and answers into it as the conversation so far, and
sends the last answer as the message, so the assistant recommends products from the whole questionnaire.
`PARAM_resetChat` clears the previous conversation first.

### No trigger: `directShowWidget`

A weblayer with **no `triggerTemplate`** and [`directShowWidget: true`](../reference/weblayer-config.md#lifecycle)
loads the chat widget and shows it as soon as it has initialized, with no trigger element on the page. The
widget appears in its own minimized form, the badge, or in the state
[`initialState`](../reference/widget-config.md#initial-state) selects; with the default `0`, it expands by itself
for a visitor who has not chatted yet, in each new browser tab, once the first message has loaded (not when
`suppressInitialMessage` is set or the home screen shows). Otherwise the shopper opens it from there. Use
this when the brand starts the conversation: a campaign landing page, a page where the widget should simply be
present, or a hand-off from another channel.

The widget's own settings (`widget.ui`, `widget.PARAM_initialMessage`, …) decide what the shopper sees; everything
else in this guide about triggers does not apply, since there is none. The `follow_up` template, for weblayers
that continue an earlier conversation, likewise renders no trigger; it loads the widget but shows it only with
`directShowWidget: true`.

---

## Listening to triggers from your page

Every template dispatches `ClarityTrigger:<hook>` events on `window`, with the trigger's identity in
`event.detail` (`source` is the `banner_id`):

```js
window.addEventListener('ClarityTrigger:clicked', event => {
  console.log(event.detail.source, event.detail.button_text)
})
```

The hooks and their params are listed under [Trigger Hooks](../reference/hooks.md#trigger-hooks); the events
the weblayer tracks to Engagement for them under
[Trigger Actions](../reference/analytics-events.md#trigger-actions).

---

[← Getting Started](README.md) · [Chapter 2 — Style the widget →](02-style-the-widget.md)
