# Examples

Code for the integrations the [Web Integration Guide](../guides/README.md) describes. The guides explain the
fields and the behaviour; the examples show the code.

> **Examples, not drop-in code.** Each one shows how to call the widget's API and in which order, kept short
> on purpose. It is not ready to copy into production as it is: adapt it to your site, your framework setup,
> your product data, styling and error handling. Comments starting with `Note:` mark the places most likely to
> need that.

| Example | Shows | Guide |
|---|---|---|
| [`custom-components/`](./custom-components/README.md) | A product card and a mini-PDP of your own replacing the built-in ones, in plain JS, React, Vue and Angular | [Customize components](../guides/03-customize-components.md#component-overrides) |
| [`add-to-cart/`](./add-to-cart/README.md) | The widget's add-to-cart buttons adding to your cart | [`fn.addToCart`](../guides/03-customize-components.md#fnaddtocart) |
| [`side-panel/`](./side-panel/README.md) | The desktop side panel: product clicks through your router, search results on your own grid | [Side Panel](../guides/05-side-panel.md) |
| [`search-orchestration/`](./search-orchestration/README.md) | Your search bar routing conversational queries to the chat | [Search orchestration](../guides/07-search-orchestration.md) |

## Who does what

Inside an example there is one folder per side of the integration, always from the same five:

| Folder | Whose it is |
|---|---|
| `plain-js/` | **Yours.** The code for your page without a framework. |
| `react/`, `vue/`, `angular/` | **Yours.** The same code in a framework, where the framework changes how it is written: mounting a component, or navigating through a client-side router. An example without one of these folders is written the same way in that framework as in `plain-js/`. |
| `configuration/` | **Bloomreach's, for reference only.** The settings the example relies on in your Engagement project. An example without this folder needs nothing on Bloomreach's side. |

> **`configuration/` is not for you to implement.** Bloomreach sets it up in your Engagement project, in a tag or in the weblayer. It is here only to show which settings your code works with ([who changes the weblayer](../guides/README.md#how-the-widget-reaches-your-page)); you can skip it.

Where the configuration calls code of yours, it does so through a `window` global that your page provides, such as
`window.__clarityRouter` in the side panel. Its name is a convention between you and your Bloomreach contact, not part of
the widget. Inside the files, a comment starting with "Yours" marks what stands for your own code: your cart,
your search, your product grid.

On a [standalone integration](../guides/README.md#standalone-integration-without-a-weblayer) there is no
weblayer: the `widget.ui` block of a `configuration/` file is what you set as your own `window.CLARITY_CONFIG.ui`.
