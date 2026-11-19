// For reference only, not for your codebase: Bloomreach sets this up in your Engagement project,
// in a tag or in the weblayer. The settings this example relies on:
const weblayerConfig = {
  // ...the rest of the weblayer configuration

  widget: {
    // ...the rest of the widget settings

    // the element your page provides, see ../plain-js/own-container.html
    // in place of ui.desktopTemplate and ui.desktopTemplateOptions
    PARAM_clarityParentElement: '#clarity-mount',

    ui: {
      fn: {
        // Without desktopTemplate 'ai_mode', search results stay in the chat by default:
        // they go to your page only where this returns true.
        // Note: /products/ stands for however your product pages are recognised
        hideSearchResultCarousels: () => !window.location.pathname.startsWith('/products/'),
      },
    },
  },
}
