# `window.CLARITY_WEBLAYER_CONFIG` — Weblayer Configuration Reference

`window.CLARITY_WEBLAYER_CONFIG` is injected by the Engagement weblayer. It configures the trigger UI, safety guards, scheduling, and how the Clarity chat widget is loaded.

**Required field:** `data.banner_id` (and `widget.PARAM_clarityPersonaId`)

**Related docs:**
- [`widget-config.md`](./widget-config.md) — the `window.CLARITY_CONFIG` fields that `widget.*` maps to
- [Customize components](../guides/02-customize-components.md) — `ui.component` and `ui.fn` override signatures

---

## Top-Level Fields

### Identity & Tracking

| Field | Type | Description |
|---|---|---|
| `version` | `string` | Weblayer version. Set to `'2'` to enable v2.0 features (scroll-based show detection, `bundle_show` tracking). Omit for v1.x behavior. |
| `group` | `'clarity' \| 'weblayer control group' \| 'global control group' \| 'global control group from weblayer' \| 'undefined group'` | A/B test group for this user. `'clarity'` = treatment (widget loads). All control group variants log a `show` event and exit without loading the widget. Defaults to `'clarity'`. |
| `message` | `string` | Message logged in the event tracked alongside `group`. |
| `sdkName` | `string` | Global variable name of the Bloomreach/Exponea SDK (e.g. `'exponea'`). Used for analytics tracking via `window[sdkName].track(...)`. |
| `style` | `string` | CSS injected into a `<style>` tag on the page alongside the trigger. |

### Lifecycle

| Field | Type | Description |
|---|---|---|
| `inPreview` | `boolean` | Enable preview mode. Skips safety checks; auto-generates `banner_id` and `variant_id` if missing. |
| `directShowWidget` | `boolean` | Immediately call `show_badge` on the Clarity widget when it initializes. Used in follow-up weblayers where no trigger UI is shown. |
| `PARAM_showAfter` | `number` | Delay in milliseconds before the trigger loads and renders. |
| `PARAM_waitForElementsTimeout` | `number` | Timeout in milliseconds for `PARAM_parentElement` detection via MutationObserver. Defaults to 3000ms. |
| `PARAM_arraySplitter` | `string` | Delimiter used to split string config fields that accept multiple values. Applies to: `PARAM_parentElement`, `PARAM_itemCategoriesToShow`, `PARAM_ignoredProductCategories`, `PARAM_itemIdsToShow`, `PARAM_itemIdsInCart`, `PARAM_placeholderQuestions`, `PARAM_currentChatbotSelectorCSS`, `PARAM_buttonText`, `PARAM_staticQuestionsBefore`, `PARAM_staticReviewQuestions`, `PARAM_staticQuestionsAfter`, `PARAM_fallbackQuestions`. |
| `onLoaded` | `() => void` | Callback fired after the Clarity bundle `<script>` tag is injected into the page. |

### Product Context

| Field | Type | Description |
|---|---|---|
| `productIds` | `string[]` | Product/item IDs for the current page. Passed as `currentItemIds` or `currentItemId` in `getContext`, and used by embedded triggers that support AI-generated questions. |
| `productIdsType` | `'product_id' \| 'item_id'` | Type of IDs in `productIds`. `'item_id'` (default) targets a specific variant; `'product_id'` targets a product with multiple variants. |

### Chatbot Replacement

| Field | Type | Description |
|---|---|---|
| `PARAM_removeCurrentChatbot` | `boolean` | Remove other chatbots when Clarity loads. |
| `PARAM_currentChatbotSelectorCSS` | `string` | CSS selector(s) of DOM element(s) to remove. Only used when `PARAM_removeCurrentChatbot` is `true`. Supports `PARAM_arraySplitter` for multiple selectors. |

---

## `data` — Banner Identity

**Required.**

```typescript
data: {
  banner_id: string             // Required. Identifies this weblayer instance.
  banner_name?: string          // Human-readable name. Used in analytics events.
  banner_type?: string          // Type label. Used in analytics events.
  variant_id?: string           // A/B variant ID. Used in analytics events.
  variant_name?: string         // A/B variant name. Used in analytics events.
  contextual_personalization?: string  // If set, tracked as 'variant_origin: contextual personalization'; otherwise 'ABtest'.
}
```

---

## Safety Metrics

When these fields are present and valid, the weblayer runs health checks before loading. If any threshold is exceeded, the weblayer exits silently (no analytics event).

| Field | Type | Stop condition |
|---|---|---|
| `errorRate24H` | `number` | Exit if > 0.1 (10% error rate in last 24h). |
| `errorRate1H` | `number` | Exit if > 0.75 AND `messageCount1H` > 5. |
| `messageCount1H` | `number` | Number of Clarity messages in the last hour (used with `errorRate1H` and `sorryRate1H`). |
| `sorryRate24H` | `number` | Exit if > 0.9 (>90% of responses contain an apology). |
| `sorryRate1H` | `number` | Exit if > 0.9 AND `messageCount1H` > 5. |

If any value is missing, `NaN`, `null`, or `''`, all safety checks are skipped.

### User-Count Gate

| Field | Type | Description |
|---|---|---|
| `PARAM_numberOfUniqueUsers` | `number` | Maximum unique user count before stopping to show. Compared against `clarityUniqueUsersCount`. |
| `clarityUniqueUsersCount` | `number` | Current number of unique users that have interacted with Clarity. |
| `hadInteractedWithClarity` | `boolean` | If the current user has already interacted with Clarity. When `true`, the user-count gate is bypassed for this user. |

The weblayer loads only when: `(PARAM_numberOfUniqueUsers <= 0 OR clarityUniqueUsersCount <= PARAM_numberOfUniqueUsers OR hadInteractedWithClarity) AND (PARAM_showEmptyProductList OR productIds.length > 0)`.

### Product Filter Gate

| Field | Type | Description |
|---|---|---|
| `PARAM_showEmptyProductList` | `boolean` | Allow loading even when `productIds` is empty. |
| `PARAM_filterProductCategory` | `boolean` | Whether to filter the product list by category before checking if it's empty. |
| `PARAM_itemCategoriesToShow` | `string` | Allowed product categories (split by `PARAM_arraySplitter`). Only items in these categories pass the filter. |
| `PARAM_ignoredProductCategories` | `string` | Blocked product categories (split by `PARAM_arraySplitter`). Items in these categories are excluded. |

---

## Scheduling

Controls when the weblayer is allowed to run based on the user's local time.

| Field | Type | Description |
|---|---|---|
| `displayWeekdays` | `boolean \| string` | `true` (or truthy string) to allow loading on weekdays. Set to `false` to block weekdays entirely. |
| `startBlockWeekdays` | `number` | Start of the blocked time window on weekdays. Minutes from midnight (e.g. `540` = 9:00 AM), or `HH:mm` string. |
| `endBlockWeekdays` | `number` | End of the blocked time window on weekdays. Same format as `startBlockWeekdays`. |
| `displayWeekends` | `boolean \| string` | Same as `displayWeekdays` but for weekends. |
| `startBlockWeekends` | `number` | Start of the blocked time window on weekends. |
| `endBlockWeekends` | `number` | End of the blocked time window on weekends. |

---

## `triggerTemplate`

Selects the trigger UI template to render. Case-insensitive. What each template looks like, where it renders and what a click does is described in the [Triggers guide](../guides/01-triggers.md).

| Value | Description |
|---|---|
| `'floating_trigger'` | Floating draggable button (most common). |
| `'plp_banner'` | Banner across a product listing page. |
| `'plp_embedded'` | Embedded prompts panel in a product listing page. |
| `'pdp_embedded'` | Embedded prompts panel in a product detail page. |
| `'search_suggestion'` | Appears in a search input or results area. |
| `'quiz_embedded'` | Interactive quiz embedded on the page. |
| `'interaction_embedded'` | Interactive embedded widget. |
| `'embedded_chat'` | Full embedded chat container (no floating UI). |
| `'banner'` | Simple debug/hello-world banner. |
| `'follow_up'` | Follow-up weblayer; no trigger UI, loads Clarity directly. |

If `triggerTemplate` is not set, `directShowWidget: true` is typically used to load the widget without a trigger — see [No trigger](../guides/01-triggers.md#no-trigger-directshowwidget).

---

## `widgetTemplate`

Selects which **widget bundle** the trigger loads when it opens Clarity. Distinct from [`triggerTemplate`](#triggertemplate), which only selects the trigger UI on the page.

| Value | Description |
|---|---|
| `'default'` | Default widget — the floating/embedded chat. Used when `widgetTemplate` is unset. |
| `'ai_mode'` | AI Mode — the full-screen conversational search overlay. |

Both bundles read the same [`window.CLARITY_CONFIG`](./widget-config.md), but they honor different `ui` fields — see [which template honors which field](./widget-config.md#which-template-honors-which-field).

**Only one widget template can be live per page.** All triggers share one `window.CLARITY_CONFIG` — including the mutable `source` that per-banner overrides resolve against — so two templates would resolve each other's config. The first weblayer to initialize claims the page's template; any later weblayer configured for a different one is dropped before it renders, with a console warning and a `clarity_warning` / `widget_template_conflict` analytics event. Which weblayer claims the page depends on each one's `PARAM_showAfter` scheduling, not on config order, so keep `widgetTemplate` consistent across the triggers on a page.

Per-banner settings still belong in `bannerSettings[source]`, since the surviving template serves every trigger on the page.

---

## `trigger` — Trigger Configuration

`WeblayerTriggerConfig` fields. Fields marked with template names apply only to those templates.

### Shared (all templates)

| Field | Type | Description |
|---|---|---|
| `PARAM_hideBRPowered` | `boolean` | Hide the "Powered by Bloomreach" logo in the trigger UI. |
| `PARAM_parentElement` | `string` | CSS selector for the DOM element to insert the trigger into. Supports `PARAM_arraySplitter` for multiple candidates (uses the first matching one). Required for embedded templates. |
| `PARAM_index` | `number` | Child index within `PARAM_parentElement` at which to insert the trigger element. Defaults to `0`. Ignored when `PARAM_targetElement` finds a match. |
| `PARAM_targetElement` | `string` | CSS selector for a specific child element inside `PARAM_parentElement`. When found, the trigger is inserted before/after this element and `PARAM_index` is ignored. |
| `PARAM_positiontoTargetElement` | `'before' \| 'after'` | Where to insert relative to `PARAM_targetElement`. Defaults to `'before'`. |
| `PARAM_CGDetectBorder` | `'top' \| 'bottom'` | For control group containers: which edge of the assigned DOM element to detect for logging the `show` event. |
| `PARAM_disableScrollDetection` | `boolean` | Skip viewport visibility detection and fire the `show` event immediately when the code runs. |
| `PARAM_buttonText` | `string` | Main CTA button text. For embedded triggers with `PARAM_enableGeneratedQuestions: false`, used as the static button list. Supports `PARAM_arraySplitter` or JSON objects with `{ text, target, payload }`. |
| `PARAM_resetChat` | `boolean` | Clear the chat history when this trigger's button is clicked. |
| `PARAM_className` | `string` | Custom CSS class name added to the trigger root element. |

### Floating Trigger Only

| Field | Type | Description |
|---|---|---|
| `PARAM_showTriggerWhenMinimized` | `boolean` | Show the floating trigger button when the Clarity widget is minimized. Defaults to `false`. |
| `PARAM_logo` | `string` | URL of the logo image used inside the floating trigger button. |

### PLP Banner + PLP Embedded

| Field | Type | Description |
|---|---|---|
| `PARAM_bannerImage` | `string` | URL of the image displayed in the banner area. |

### PLP Banner Only

| Field | Type | Description |
|---|---|---|
| `PARAM_bannerText` | `string` | Main text content of the banner. |
| `PARAM_headerGradientText` | `string` | Gradient-styled middle text in the header. |
| `PARAM_headerPrefixText` | `string` | Text before the gradient section in the header. |
| `PARAM_headerSuffixText` | `string` | Text after the gradient section in the header. |
| `PARAM_isToggleButton` | `string \| boolean` | When truthy, clicking the button toggles the widget instead of always showing it: hides it (`hide_badge`) if currently visible, shows it otherwise. |

### PLP Embedded Only

| Field | Type | Description |
|---|---|---|
| `PARAM_bannerPrefixText` | `string` | Text before the gradient text in the banner. |
| `PARAM_bannerGradientText` | `string` | Gradient-styled middle text in the banner. |
| `PARAM_bannerSuffixText` | `string` | Text after the gradient text in the banner. |

### PLP Embedded + PDP Embedded + Interaction Embedded

| Field | Type | Description |
|---|---|---|
| `PARAM_anythingPrompt` | `string` | Text for the "Ask anything" button. |
| `PARAM_headerText` | `string` | Text placed in the trigger header. |
| `PARAM_generatedQuestionsMethod` | `'random' \| 'bandit'` | How AI-generated questions are selected. `'random'` sorts by weight; `'bandit'` picks randomly. Defaults to `'random'`. |

### PDP Embedded + Interaction Embedded + Embedded Chat

| Field | Type | Description |
|---|---|---|
| `PARAM_enableGeneratedQuestions` | `boolean` | Enable AI-generated question buttons for the current product/category. |
| `PARAM_generatedQuestionsCountLimit` | `number` | Maximum number of AI-generated question buttons to display. |
| `PARAM_staticQuestionsBefore` | `string` | Fixed questions shown before the AI-generated ones. Supports `PARAM_arraySplitter` or JSON `{ text, target, payload }` objects. |
| `PARAM_staticReviewQuestions` | `string` | Fixed questions shown before AI-generated ones when a review summary exists in the response. Same format as `PARAM_staticQuestionsBefore`. |
| `PARAM_staticQuestionsAfter` | `string` | Fixed questions shown after the AI-generated ones. Same format. |
| `PARAM_generatedQuestionsMaxCharLength` | `number` | Maximum character length of an individual AI-generated question. |

### PDP Embedded + Interaction Embedded + Search Suggestion

| Field | Type | Description |
|---|---|---|
| `PARAM_fallbackQuestions` | `string` | Questions shown when no AI-generated questions are available. Same format as `PARAM_staticQuestionsBefore`. |

If an embedded trigger (PDP Embedded, PLP Embedded, Interaction Embedded, Embedded Chat) would render nothing — `PARAM_buttonText` is empty, or no generated questions came back and no `PARAM_fallbackQuestions`, `PARAM_staticQuestionsBefore` or `PARAM_staticQuestionsAfter` are configured — its container is hidden (`display: none`) instead of rendering empty, no `show` event is tracked, and a `clarity_warning` / `no_questions` analytics event is sent. Configure `PARAM_fallbackQuestions` to guarantee the trigger always has content.

### Interaction Embedded Only

| Field | Type | Description |
|---|---|---|
| `PARAM_seeRecommendationsPrompt` | `string` | Text for the "See recommendations" button, shown when the Clarity response includes a carousel. |

### Embedded Chat Only

| Field | Type | Description |
|---|---|---|
| `PARAM_maxChatContainerHeight` | `string` | Maximum CSS height of the embedded chat container (e.g. `'400px'`). |
| `PARAM_inputPlaceholder` | `string` | Placeholder text for the embedded chat input field. |
| `PARAM_textLengthToDivide` | `number` | Character length threshold above which a prompt button text is split onto two lines. |

### Search Suggestion Only

| Field | Type | Description |
|---|---|---|
| `PARAM_keepSuggestionsAfterClick` | `boolean` | When `true`, the suggestion list stays visible after a suggestion is clicked. Defaults to `false` (list clears on click). |
| `PARAM_keepChatHistoryOnSuggestionClick` | `boolean` | When `true`, the existing chat history is preserved when a suggestion is clicked. Defaults to `false` (chat is reset on click). |
| `PARAM_resultsHeaderText` | `string` | Header text shown above the suggestion results list. |
| `PARAM_minSearchLength` | `number` | Minimum input length to trigger a search. Defaults to `3`. |
| `PARAM_suggestionsLimit` | `number \| string` | Maximum number of suggestions to display. Accepts a number or numeric string. Values ≤ 0 or non-numeric are ignored (no limit applied). |

### Quiz Embedded Only

| Field | Type | Description |
|---|---|---|
| `quizQuestions` | `QuizQuestion[]` | Array of quiz questions. See below. |
| `PARAM_optionalText` | `string` | Helper text displayed after the question when `type` is `'text'`. |

#### `QuizQuestion`

```typescript
type QuizQuestion = {
  question: string           // Question text
  options?: Array<{
    value: string            // Value sent to the backend when this option is selected
    label?: string           // Button label shown to user; defaults to value
  }>
  placeholder?: string       // Placeholder for the free-text textarea (when type = 'text')
  type?: 'text'              // If 'text', renders a free-text input instead of buttons
}
```

### Trigger Analytics

| Field | Type | Description |
|---|---|---|
| `hooks` | `TriggerHooksConfig` | Callbacks for the trigger hooks (`show`, `actualShow`, `clicked`, `error`, `suggestionsSearched`, `suggestionsRendered`, see [`hooks.md`](./hooks.md#trigger-hooks)). Called in addition to the default analytics tracking. |
| `trackerConfig` | `{ [hookKey \| 'shared']: Record<string, string \| number \| null \| undefined> }` | Extra properties merged into analytics events. `'shared'` applies to all trigger events; individual hook keys apply only to that event. |

---

## `sharedTrackerConfig`

Properties merged into **every** analytics event fired by this weblayer instance (both trigger and widget events). Takes the lowest priority — overridden by `trigger.trackerConfig.shared` and per-event `trackerConfig` values.

Used internally by the weblayer to track session state progression:
- `clarity_session_state`: `'clarity_unseen'` → `'clarity_seen'` (on first `show`) → `'clarity_interacted'` (on first `user_respond` or `url_click`)
- `clarity_session_interaction_count`: increments on each interaction

You can add arbitrary keys here for custom event attribution.

```typescript
sharedTrackerConfig?: {
  [key: string]: string | number | null | undefined
}
```

---

## `widget` — Clarity Widget Settings

These fields are mapped to `window.CLARITY_CONFIG` when the weblayer initializes. For a walkthrough of the desktop side-panel layout and the settings that go with it, see the [Desktop AI Mode setup guide](../guides/03-side-panel.md). Fields prefixed with `PARAM_` correspond to `window.CLARITY_CONFIG` fields; see [`widget-config.md`](./widget-config.md) for full details on each target field.

| Field | Maps to | Description |
|---|---|---|
| `projectId` | [`CLARITY_CONFIG.projectId`](./widget-config.md#top-level-fields) | **Required.** Project identifier. |
| `PARAM_clarityPersonaId` | [`CLARITY_CONFIG.personaId`](./widget-config.md#top-level-fields) | **Required.** Persona (agent) identifier. |
| `pageType` | — | `'pdp'` causes `getContext` to return `currentItemId` (single item) from `productIds`. `'plp'` and `'cart'` are also valid. |
| `suppressInitialMessage` | [`CLARITY_CONFIG.bannerSettings[source].suppressInitialMessage`](./widget-config.md#bannersettings) | Skip the initial welcome/trigger message. |
| `fullMode` | [`CLARITY_CONFIG.fullMode`](./widget-config.md#top-level-fields) | Full-page widget mode. |
| `pdpUrl` | `getContext().pdpUrl` | Passed to `getContext` as the current PDP URL. |
| `userContextFilter` | `getContext().userContextFilter` | Passed to `getContext`. |
| `plpCategoryName` | `getCategoryInfo().plpCategoryName` | Passed to `getCategoryInfo`. |
| `plpCategoryDescription` | `getCategoryInfo().plpCategoryDescription` | Passed to `getCategoryInfo`. |
| `urlQueryParams` | `getCategoryInfo().urlQueryParams` | Passed to `getCategoryInfo`. |
| `PARAM_clarityParentElement` | [`CLARITY_CONFIG.parentElement`](./widget-config.md#top-level-fields) | CSS selector for the widget's parent container. |
| `PARAM_initialMessage` | [`CLARITY_CONFIG.bannerSettings[source].initialMessage.text`](./widget-config.md#bannersettings) | Initial message text. |
| `PARAM_engInitialMessage` | [`CLARITY_CONFIG.bannerSettings[source].initialMessage.engText`](./widget-config.md#bannersettings) | English version of the initial message. |
| `PARAM_itemIdsToShow` | [`CLARITY_CONFIG.bannerSettings[source].initialMessage.itemIdsToShow`](./widget-config.md#bannersettings) | Item IDs for a product carousel in the initial message. Split by `PARAM_arraySplitter`. |
| `PARAM_itemIdsInCart` | `getContext().cartItemIds` | Cart item IDs. Split by `PARAM_arraySplitter`. |
| `PARAM_clarityCurrency` | [`CLARITY_CONFIG.defaultCurrency`](./widget-config.md#top-level-fields) | Currency code for product pricing. |
| `PARAM_initialState` | [`CLARITY_CONFIG.bannerSettings[source].initialState`](./widget-config.md#bannersettings) | Widget initial expand state (`0`–`3`). |
| `PARAM_placeholderQuestions` | [`CLARITY_CONFIG.bannerSettings[source].initialMessage.placeholderStrings`](./widget-config.md#bannersettings) | Rotating input placeholder strings. Split by `PARAM_arraySplitter`. |
| `PARAM_showPlaceholderStringsHome` | [`CLARITY_CONFIG.bannerSettings[source].initialMessage.showPlaceholderStringsHome`](./widget-config.md#bannersettings) | Show home screen when no messages exist. |
| `PARAM_zIndex` | [`CLARITY_CONFIG.ui.zIndex`](./widget-config.md#ui--appearance--behavior) | **Prefer `widget.ui.zIndex` instead.** |
| `PARAM_widgetFont` | [`CLARITY_CONFIG.ui.font`](./widget-config.md#ui--appearance--behavior) | **Prefer `widget.ui.font` instead.** |
| `PARAM_clarityBackgroundColor` | [`CLARITY_CONFIG.ui.background`](./widget-config.md#ui--appearance--behavior) | **Prefer `widget.ui.background` instead.** |
| `PARAM_bubbleBackgroundColor` | [`CLARITY_CONFIG.ui.bubbleBackgroundColor`](./widget-config.md#ui--appearance--behavior) | **Prefer `widget.ui.bubbleBackgroundColor` instead.** |
| `PARAM_bubbleFontColor` | [`CLARITY_CONFIG.ui.bubbleFontColor`](./widget-config.md#ui--appearance--behavior) | **Prefer `widget.ui.bubbleFontColor` instead.** |
| `PARAM_badgeFontColor` | [`CLARITY_CONFIG.ui.badgeFontColor`](./widget-config.md#ui--appearance--behavior) | **Prefer `widget.ui.badgeFontColor` instead.** |
| `PARAM_badgeBackgroundColor` | [`CLARITY_CONFIG.ui.badgeBackgroundColor`](./widget-config.md#ui--appearance--behavior) | **Prefer `widget.ui.badgeBackgroundColor` instead.** |
| `hooks` | [`CLARITY_CONFIG.hooks`](./widget-config.md#hooks--event-hooks) | Clarity event hooks (`version: 'WBL_BUNDLE'`). See [`hooks.md`](./hooks.md). |
| `ui` | [`CLARITY_CONFIG.bannerSettings[source].ui`](./widget-config.md#bannersettings) | Full UI config object. See [`widget-config.md → ui`](./widget-config.md#ui--appearance--behavior) for all fields. For component overrides (`ui.component`, `ui.fn`), see [Customize components](../guides/02-customize-components.md). |
| `agentConfig` | [`CLARITY_CONFIG.bannerSettings[source].agentConfig`](./widget-config.md#bannersettings) | Agent-level configuration. |
| `feedback` | [`CLARITY_CONFIG.bannerSettings[source].feedback`](./widget-config.md#bannersettings) | Feedback settings. |
| `trackerConfig` | — | Extra properties for Clarity event analytics. Keyed by hook name (see [`hooks.md`](./hooks.md)) plus `'shared'` (applies to all events). |
| `getContext` | [`CLARITY_CONFIG.getContext`](./widget-config.md#context-functions) | Override the default `getContext` function. |
| `getCategoryInfo` | [`CLARITY_CONFIG.getCategoryInfo`](./widget-config.md#context-functions) | Override the default `getCategoryInfo` function. |
| `getUserInfo` | [`CLARITY_CONFIG.getUserInfo`](./widget-config.md#context-functions) | Override the default `getUserInfo` function. |

---

## `window.CLARITY_WEBLAYER` — Trigger API

The async command bridge to interact with specific trigger instances from external code. Commands queued before the trigger mounts are automatically replayed when it does.

```javascript
await window.CLARITY_WEBLAYER?.call(bannerId, action, args)
```

### Actions (for `SEARCH_SUGGESTION` template)

#### `search`
Trigger a search query and render results.
```javascript
{
  text: string         // search query
  container: HTMLElement  // DOM element to render results into
  force?: boolean      // bypass caching and always call the API
}
```

#### `rerender`
Force a re-render of the trigger.
```javascript
{ container: HTMLElement }
```

#### `hide`
Hide the trigger.

#### `select`
Select a suggestion item by index.
```javascript
{ index: number }
```

---

## Trigger Browser Events (`ClarityTrigger:*`)

| Event | Description |
|---|---|
| `ClarityTrigger:initialized` | Trigger component mounted. |
| `ClarityTrigger:show` | Trigger scrolled into the viewport (v1.x: IntersectionObserver; v2.0: scroll-based). |
| `ClarityTrigger:actual_show` | (v2.0 only) Element confirmed in viewport via IntersectionObserver. |
| `ClarityTrigger:clicked` | User clicked the trigger. |
| `ClarityTrigger:closed` | User dismissed the trigger. |
| `ClarityTrigger:suggestionsSearched` | Search-suggestion template started a suggestion fetch (carries `search_text`). |
| `ClarityTrigger:suggestionsRendered` | Suggestion items were displayed. |

---

## Configuration Example

```javascript
window.CLARITY_WEBLAYER_CONFIG = {
  version: '2',
  group: 'clarity',
  sdkName: 'exponea',
  data: {
    banner_id: 'my-pdp-trigger',
    banner_name: 'PDP Floating Trigger',
    variant_id: 'v1',
    variant_name: 'Control',
  },
  productIds: [getProductId()],
  productIdsType: 'item_id',
  PARAM_showAfter: 2000,
  errorRate24H: 0.02,
  errorRate1H: 0.05,
  messageCount1H: 12,
  triggerTemplate: 'floating_trigger',
  trigger: {
    PARAM_logo: 'https://cdn.example.com/logo.png',
    PARAM_showTriggerWhenMinimized: true,
    PARAM_buttonText: 'Ask about this product',
  },
  widget: {
    projectId: '00000000-0000-0000-0000-000000000000', // your Engagement project id
    PARAM_clarityPersonaId: '00000000-0000-0000-0000-000000000000', // your agent id
    PARAM_clarityCurrency: 'EUR',
    PARAM_initialState: 0,
    ui: {
      background: '#FFFFFF',
      enableMiniPDP: true,
    },
  },
}
```
