[← Back to Chapter 5 — Side panel](05-side-panel.md)

# 6. Set up context-aware pricing

With context-aware pricing, each shopper sees and hears only the prices that apply to them, such as member or regular, trade or retail, or regional prices. Your page tells the widget which price attributes apply to the current shopper. The agent then quotes those prices, and the product cards show them.

## Before you start

- Ask your Product Engagement Manager to turn on the feature for your agent and to register your catalog's price attributes, for example `member_price` and `non_member_price`.
- Get the list of attribute names you can use from your Product Engagement Manager. `price` is always available.

---

## How it works

The Conversational agent never decides which prices apply to a shopper. Your page knows whether the shopper is logged in, is a member, or is in a specific region. It passes this information through two fields that [`getContext()`](../reference/widget-config.md#getcontext-contextfields) returns:

| Field | Description |
|---|---|
| `priceAttributesToUse` | Which price attributes apply to *this* shopper, which one is primary, and how to show them. |
| `userPricingContext` | A free-form description of the shopper for the agent, for example `{ membership: 'gold' }`. |

Prices that aren't in the list never reach the agent. The agent receives the listed prices together with `userPricingContext` and decides how to present them. For example, it can quote the member price next to the regular price.

### Key terms

- **Attached entry:** An entry with `attachedTo`. The widget shows it struck through next to the standalone entry it names, and only when it's higher. The agent still receives it as a normal entry.
- **Price attribute:** A catalog attribute that holds a price, for example `member_price`. `price` is always a price attribute.
- **Primary:** The entry that numeric price filters and sorting apply to, for example "under 200". Exactly one entry is primary: the first entry you flag, or the first entry in the list if you flag none.
- **Standalone entry:** An entry without `attachedTo`. The widget shows it as a price on its own.

### Examples

**Membership tiers:** The catalog has `price` (the regular price), `member_price`, and `non_member_price`.

| Shopper | `priceAttributesToUse` | What the agent sees on a product |
|---|---|---|
| Member | `[{ attributeName: 'member_price', primary: true }, { attributeName: 'price' }]` | `member_price: $80.00`, `price: $100.00` |
| Logged in, not a member | `[{ attributeName: 'non_member_price', primary: true }, { attributeName: 'price' }]` | `non_member_price: $90.00`, `price: $100.00` |
| Not logged in | `[{ attributeName: 'price' }]` | `price: $100.00` |

**Regional prices:** The catalog has `ca_price` and `wa_price`, and **no `price`**.

| Shopper | `priceAttributesToUse` | What the agent sees on a product |
|---|---|---|
| California | `[{ attributeName: 'ca_price' }]` | `ca_price: $95.00` |
| Washington | `[{ attributeName: 'wa_price' }]` | `wa_price: $99.00` |

In the regional example, any fallback to `price` shows no price at all. For details, see [Edge cases](#edge-cases).

---

## Return the shopper's prices from the page

On a weblayer page, `getContext()` is the weblayer's [`widget.getContext`](../reference/weblayer-config.md#widget--clarity-widget-settings). Ask your Product Engagement Manager to make it return the two fields described below.

The widget reads a top-level `window.CLARITY_CONFIG.getContext`, as in the following sample, only on a [standalone integration](./README.md#standalone-integration-without-a-weblayer).

```js
window.CLARITY_CONFIG = {
  ...(window.CLARITY_CONFIG ?? {}),
  // ...
  getContext: () => {
    const shopper = myShop.currentShopper()
    if (shopper.isMember) {
      return {
        // ...the other context fields
        priceAttributesToUse: [
          { attributeName: 'member_price', primary: true },
          { attributeName: 'price' },
        ],
        userPricingContext: { membership: 'gold' },
      }
    }
    if (shopper.isLoggedIn) {
      return {
        // ...the other context fields
        priceAttributesToUse: [
          { attributeName: 'non_member_price', primary: true },
          { attributeName: 'price' },
        ],
        userPricingContext: { membership: 'none' },
      }
    }
    return {
      // ...the other context fields
      priceAttributesToUse: [{ attributeName: 'price' }],
    }
  },
}
```

The widget calls `getContext()` every time it renders a price, so keep the function fast and free of side effects.

**Test your setup:** Open the chat as a member and ask for products "under $90". The agent quotes the member price and applies the filter to `member_price`, the primary entry.

---

## Reference

### `priceAttributesToUse`

[`getContext()`](../reference/widget-config.md#getcontext-contextfields) returns this field. A banner's `getContext()` replaces the top-level one.

| Field | Type | Sent to the agent | Description |
|---|---|---|---|
| `attachedTo` | string | No | Display only. Shows this price struck through next to the named entry. |
| `attributeName` | string, up to 128 characters | Yes | The catalog attribute name, matched case-sensitively. `price` is always allowed. |
| `displayName` | string | No | Display only. The label in the mini product detail page (mini-PDP) and the AI Mode quick view. Defaults to the attribute name in title case. |
| `primary` | boolean | Yes | The entry that numeric price filters and sorting use. Always flag one entry. The list order also sets the display order, so if you flag none, the first displayed price (often the regular `price`) is used for filters and sorting. |

**The page sends its whole context every time.** If you leave out `priceAttributesToUse` or return `null`, the widget clears the list until the page sends a new one, and the agent falls back to `price`. The same applies to `userPricingContext`.

If a list breaks a rule, the widget handles it as follows:

| Rule | If the rule is broken |
|---|---|
| Each entry has a non-empty `attributeName`. | The widget drops the entry. |
| `attachedTo` doesn't name its own entry. | The widget removes `attachedTo`. |
| The name is one of the price attributes registered for your agent. | The widget drops the entry. |
| Names are unique. | The widget drops later duplicates. |
| The list has at most 4 entries. | The widget keeps the first 4. |
| Exactly one entry is primary. | The first flagged entry becomes primary. If none is flagged, the first entry does. |
| At most 2 entries have no `attachedTo`. | The widget shows the first 2 that have a value. |
| Names are 128 characters or fewer, and `primary` is a boolean or `null`. | The widget rejects the **whole** context update, including other context fields such as the current product. |

### `userPricingContext`

A string or an object that `getContext()` returns, for example `{ membership: 'gold' }`. The widget passes it unchanged into the agent's instructions, so the agent can explain prices to this shopper, for example "As a Gold member, you pay…". This field doesn't select prices. Only `priceAttributesToUse` does.

### `ui.fn.getProductPrices`

For the general override, see [Customize components](./03-customize-components.md#fngetproductprices). For context-aware prices:

- The override can replace any listed price by its attribute name, for example `{ member_price: 75 }`. The widget ignores names that aren't in the list.
- If you return `''` for a price, the widget hides it and treats that entry as having no value.
- The override changes only the display. The agent still quotes the catalog price.

---

## What the shopper sees

**When the widget sends the context:** Before each shopper message, the widget sends the page's context if it differs from the last context it sent. The widget doesn't send the context while a response is still streaming, so a changed list applies from the shopper's next message.

**How the widget renders prices:** The default widget renders prices as described below. You can change this with [component overrides](./03-customize-components.md#component-overrides) and `getProductPrices`.

- **Displayed prices:** Up to 2 entries without `attachedTo` that have a value, in list order. The widget shows an entry with `attachedTo` struck through only if the entry it names is displayed and the attached price is higher.
- **Product card:** One price, or a low–high range for two prices. No labels. A struck-through price appears only when every displayed price has one. The discount badge appears only for a single price with `showDiscountPercentage`. `supportPriceRange` covers all variants unless the card has a variant selector.
- **Mini-PDP and AI Mode quick view:** One labeled price per displayed entry, with its attached prices struck through. The label is `displayName`, or the attribute name in title case. No badge and no range.
- **AI Mode grid:** Same as the product card, but without strike-through prices or a badge.
- **AI Mode availability:** AI Mode shows these prices only in a chat for which the widget has sent a list. For details, see [Known limitations](#known-limitations).
- **No value:** If no displayed entry has a value, the card falls back to the regular price rendering.

In a custom component, the product receives the prices in two places:

- As `contextAwarePrices` (`{ name: value }`) on the product. A listed `price` also arrives here, as `contextAwarePrices.price`.
- As flat fields on its variants.

While the shopper has a list, the product's top-level `price` is empty.

### Why the card and the agent can show different prices

The agent and the product cards get their prices through different paths, so they can show different prices:

| Cause | On the card | From the agent | Recommendation |
|---|---|---|---|
| **`getProductPrices` changes only the display.** The agent, analytics, and add-to-cart keep the catalog price. | Your price, for example $75 | The catalog price, for example $80 | Don't use `getProductPrices` for prices the agent must quote. Add them to the catalog as a price attribute instead. |
| **The widget shows fewer prices than the agent sees.** The agent gets every entry in the list (up to 4), but the widget's display rules can hide some of them. | For example, only `member_price` | `member_price` and `price` | This is expected. The agent decides which prices to mention. |
| **The list changes during the chat,** for example when the shopper logs in. The agent uses the list from the last message the widget sent. The widget renders carousels that are already shown with the new list. | Earlier cards can differ from new ones | The new prices | — |

---

## Edge cases

| Situation | What happens | What to do |
|---|---|---|
| No list, `null`, `[]`, or every entry dropped | The agent falls back to `price`. In the regional example, the catalog has no `price`, so **no price appears anywhere**, for example when the shopper's location is unknown. | In a catalog without `price`, always send a list, for example with a default region. |
| An entry without `attributeName`, a duplicate name, or more than one entry flagged `primary` | The widget drops the entry without a name, keeps the first occurrence of a duplicate, and makes the first flagged entry primary. The rest of the list still applies. | — |
| More than 4 valid entries | The widget keeps the first 4. | — |
| A name longer than 128 characters, or a `primary` that's neither a boolean nor `null` | The widget rejects the **whole** context update. Nothing in that update reaches the chat, including the current product. | — |
| The shopper logs in or out during the chat | The new list applies from the next message. For carousels already shown, see [Known limitations](#known-limitations). | — |
| A product has no value for a listed attribute | That price is missing for this product, both for the agent and on the card. If no listed price has a value, the card shows no price. | Ask your Product Engagement Manager to configure a fallback, for example `member_price` → `price`. |
| A value that isn't a number, for example `"call for price"` | The agent quotes the raw text. The widget treats it as no value and doesn't show it. Numeric filters don't match the product. | — |
| The agent filters or sorts by any of the shopper's prices, or by `price` | The filter or sorting always applies to the **primary** attribute. The agent can't filter by a non-primary price. For example, "regular price under $100" filters by `member_price` for a member. | Flag the price that shoppers search by as primary. |

## Known limitations

- **The widget doesn't resend a reordered list.** If only the order of the entries changes, the widget doesn't send the list. Without a `primary` flag, the agent keeps the old primary entry until another context field changes, so flag the primary entry. With more than 4 entries, the agent also keeps the old first 4.
- **AI Mode doesn't send the pricing fields.** A chat started in AI Mode uses `price`. When the shopper selects a product, AI Mode's context updates clear any list the widget stored in the same chat.
- **The widget caches `getProductPrices` results.** It caches an async result per product for as long as the page is open, and doesn't refresh it when the shopper logs in or out.
- **Carousels already shown can show outdated prices.** The widget renders them with the shopper's current list but with the price data they originally received. After the list changes, their prices can differ from those on new cards, or be missing.

## See also

- [Widget configuration](../reference/widget-config.md): `getContext()` and the other `CLARITY_CONFIG` fields.
- [Customize components](./03-customize-components.md#fngetproductprices): `getProductPrices`.

---

[← Chapter 5 — Side panel](05-side-panel.md) · [Chapter 7 — Search orchestration →](07-search-orchestration.md)
