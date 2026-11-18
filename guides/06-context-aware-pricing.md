[← Back to Chapter 5 — Side Panel](05-side-panel.md)

# 6. Context-Aware Pricing

Context-aware pricing lets each shopper see, and hear from the agent, only the prices that apply to them: member or
regular, trade or retail, by region. Your page tells the widget which price attributes apply to the current shopper;
the agent quotes those prices and the product cards show them.

**Before you start.** Bloomreach has to enable the feature on your agent and register the price attributes of your
catalog (for example `member_price` and `non_member_price`). Ask your Bloomreach contact for the list of attribute
names you can use. `price` is always available.

---

## How it works

Clarity never decides which prices apply to a shopper. Your page knows whether the shopper is logged in, a member, or
in a region, and expresses that through two fields returned by
[`getContext()`](../reference/widget-config.md#getcontext-contextfields):

| Field | Meaning |
|---|---|
| `priceAttributesToUse` | Which price attributes apply to *this* shopper, which one is primary, and how to show them. |
| `userPricingContext` | A free-form description of the shopper for the agent, e.g. `{ membership: 'gold' }`. |

Prices that are not in the list never reach the agent. The agent gets the listed prices together with
`userPricingContext` and decides how to present them, for example quoting the member price next to the regular one.

### Terms

- **Price attribute**: a catalog attribute holding a price, e.g. `member_price`. `price` is always one.
- **Primary**: the entry that numeric price filters and sorts apply to ("under 200"). Exactly one entry is primary:
  the first one you flag, otherwise the first entry.
- **Standalone entry**: an entry without `attachedTo`. It is shown as a price on its own.
- **Attached entry**: an entry with `attachedTo`. It is shown struck through against the standalone entry it names,
  and only when it is higher. It is still sent to the agent as a normal entry.

### Examples

**Membership tiers**: the catalog has `price` (the regular price), `member_price` and `non_member_price`.

| Shopper | `priceAttributesToUse` | What the agent sees on a product |
|---|---|---|
| Member | `[{ attributeName: 'member_price', primary: true }, { attributeName: 'price' }]` | `member_price: $80`, `price: $100` |
| Logged in, not a member | `[{ attributeName: 'non_member_price', primary: true }, { attributeName: 'price' }]` | `non_member_price: $90`, `price: $100` |
| Not logged in | `[{ attributeName: 'price' }]` | `price: $100` |

**Regional prices**: the catalog has `ca_price` and `wa_price` and **no `price`**.

| Shopper | `priceAttributesToUse` | What the agent sees on a product |
|---|---|---|
| California | `[{ attributeName: 'ca_price' }]` | `ca_price: $95` |
| Washington | `[{ attributeName: 'wa_price' }]` | `wa_price: $99` |

In the regional case every fallback to `price` shows no price at all; see [Edge cases](#edge-cases).

---

## Return the shopper's prices from the page

```js
window.CLARITY_CONFIG = {
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
        priceAttributesToUse: [
          { attributeName: 'non_member_price', primary: true },
          { attributeName: 'price' },
        ],
        userPricingContext: { membership: 'none' },
      }
    }
    return { priceAttributesToUse: [{ attributeName: 'price' }] }
  },
}
```

`getContext()` is called on every price render, so keep it cheap and free of side effects.

**Check the result.** Open the chat as a member and ask for products "under $90". The agent quotes the member price,
and the filter is applied to `member_price`, the primary entry.

---

## Reference

### `priceAttributesToUse`

Returned by [`getContext()`](../reference/widget-config.md#getcontext-contextfields). A banner's `getContext()`
replaces the top-level one.

| Field | Type | Sent to the agent | Meaning |
|---|---|---|---|
| `attributeName` | string, ≤ 128 chars | yes | Catalog attribute name, matched case-sensitively. `price` is always allowed. |
| `primary` | boolean | yes | The entry that numeric price filters and sorts use. Always flag one: the list order also sets the display order, so an unflagged list often makes the first displayed price (e.g. the regular `price`) the one filters and sorts use. |
| `attachedTo` | string | no | Display only: show this price struck through against the named entry. |
| `displayName` | string | no | Display only: label in the mini-PDP and AI Mode quick view. Default: the attribute name in title case. |

**The page sends its whole context every time.** Leaving `priceAttributesToUse` out, or returning `null`, clears the
list until the page sends one again, and the agent falls back to `price`. The same applies to `userPricingContext`.

What happens to a list that breaks a rule:

| Rule | On violation |
|---|---|
| Each entry has a non-empty `attributeName` | Entry dropped |
| `attachedTo` does not name the entry itself | `attachedTo` removed |
| The name is one of the price attributes registered for your agent | Entry dropped |
| No duplicate names | Later duplicates dropped |
| At most 4 entries | First 4 kept |
| Exactly one primary | First flagged entry, else the first entry |
| At most 2 entries without `attachedTo` | The widget shows the first 2 that have a value |
| A name longer than 128 characters, or a `primary` that is neither a boolean nor `null` | The **whole** context update is rejected, including the other context fields such as the current product |

### `userPricingContext`

A string or an object, returned by `getContext()`, e.g. `{ membership: 'gold' }`. It is passed as-is into the agent's
instructions, so the agent can explain prices to this shopper ("as a Gold member you pay..."). It does not select
prices: only `priceAttributesToUse` does.

### `ui.fn.getProductPrices`

The general override is described in [Customization](./03-customize-components.md#fngetproductprices). For
context-aware prices:

- It can override any listed price by its attribute name, e.g. `{ member_price: 75 }`. Names that are not in the list
  are ignored.
- Returning `''` for a price hides it, and the widget treats that entry as having no value.
- It changes the display only. The agent still quotes the catalog price.

---

## What the shopper sees

**Sending.** Before each user message, the widget sends the page's context if it differs from what it sent last. It
does not send while a response is still streaming. A changed list therefore applies from the shopper's next message.

**Rendering.** This is how the default widget renders the prices. You can change it with
[component overrides](./03-customize-components.md#component-overrides) and `getProductPrices`.

- **Displayed prices:** the entries without `attachedTo`, in list order, that have a value, at most 2. An entry with
  `attachedTo` is shown struck through, only if the entry it names is displayed and it is higher.
- **Product card:** one price, or a low–high range for two. No labels. A struck-through price shows only when every displayed price has one. The discount badge shows only for a single price
  with `showDiscountPercentage`. `supportPriceRange` spans the variants unless the card has a variant selector.
- **Mini-PDP and AI Mode quick view:** one labelled price per displayed entry (`displayName`, else the attribute name
  in title case), with its attached prices struck through. No badge, no range.
- **AI Mode grid:** like the product card, without strike-through or badge.
- AI Mode shows these prices only in a chat for which the widget has sent a list, see [Known issues](#known-issues).
- If no displayed entry has a value, the card falls back to the regular price rendering.

In a custom component, the prices arrive on the product as `contextAwarePrices` (`{ name: value }`) and as flat fields
on its variants; the product's top-level `price` is empty while the shopper has a list, and a listed `price` arrives in
`contextAwarePrices.price` like the others.

### What the shopper sees vs what the agent says

The agent and the product cards get their prices along two different paths, so they can disagree:

| Cause | On the card | From the agent | Advice |
|---|---|---|---|
| **`getProductPrices` changes the display only.** The agent, analytics and add-to-cart keep the catalog price. | Your price, e.g. $75 | The catalog price, e.g. $80 | Don't use `getProductPrices` for prices the agent must quote. Put them in the catalog as a price attribute instead. |
| **The widget shows fewer prices than the agent sees.** The agent gets every entry of the list (up to 4). The widget's display rules can hide some of them. | e.g. only `member_price` | `member_price` and `price` | Expected: the agent decides which prices to mention. |
| **The list changes during the chat** (e.g. the shopper logs in). The agent uses the list from the last message the widget sent. Carousels already shown are rendered with the new list. | Earlier cards: can differ from new ones | The new prices | — |

---

## Edge cases

| Situation | What happens | What to do |
|---|---|---|
| No list, `null`, `[]`, or every entry dropped | The agent falls back to `price`. In the regional example the catalog has no `price`, so **no price is shown anywhere** (the shopper's location is unknown, for example). | In a catalog without `price`, always send a list, e.g. a default region. |
| An entry without `attributeName`, a duplicate name, or more than one entry flagged `primary` | The entry without a name is dropped; for a duplicate, the first occurrence is kept; for several primaries, the first flagged entry wins. The rest of the list still applies. | — |
| More than 4 valid entries | The first 4 are kept. | — |
| A name longer than 128 characters, or a `primary` that is neither a boolean nor `null` | The **whole** context update is rejected. Nothing in that update reaches the chat, including the current product. | — |
| The shopper logs in or out during the chat | The new list applies from the next message. For carousels already shown, see [Known issues](#known-issues). | — |
| A product has no value for a listed attribute | That price is missing for this product, both for the agent and on the card. If no listed price has a value, the card shows no price. | Ask Bloomreach to configure a fallback, e.g. `member_price` → `price`. |
| A value that is not a number, e.g. `"call for price"` | The agent quotes the raw text. The widget treats it as no value and does not show it. Numeric filters don't match the product. | — |
| The agent filters or sorts on any of the shopper's prices, or on `price` | The filter or sort is always applied to the **primary** attribute. The agent cannot filter on a non-primary price, e.g. "regular price under $100" for a member filters on `member_price`. | Flag the price shoppers search by as primary. |

## Known issues

- **A reordered list is not re-sent.** If only the order of the entries changes, the widget does not send the list,
  so without a `primary` flag the agent keeps the old primary until another context field changes. Flag the primary
  entry. With more than 4 entries the agent also keeps the old first 4.
- **AI Mode does not send the pricing fields:** a chat started there uses `price`, and its context updates (when a
  product is selected) clear a list the widget stored in the same chat.
- **Cached `getProductPrices` results:** an async result is cached per product for the life of the page and is not
  refreshed when the shopper logs in or out.
- **Carousels already shown** are rendered with the shopper's current list from the price data they were sent with,
  so after a change of list their prices can differ from new cards', or be missing.

## See also

- [Widget Config](../reference/widget-config.md): `getContext()` and the other `CLARITY_CONFIG` fields
- [Customization](./03-customize-components.md#fngetproductprices): `getProductPrices`

---

[← Chapter 5 — Side Panel](05-side-panel.md) · [Chapter 7 — Search orchestration →](07-search-orchestration.md)
