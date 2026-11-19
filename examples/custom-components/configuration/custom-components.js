// For reference only, not for your codebase: Bloomreach sets this up in your Engagement project,
// in a tag or in the weblayer. The settings this example relies on:
const weblayerConfig = {
  // ...the rest of the weblayer configuration

  widget: {
    // ...the rest of the widget settings

    ui: {
      // the mini-PDP, and with it the MiniPDP component, shows only with this on
      enableMiniPDP: true,
      // no ui.component here: the widget falls back to window.CLARITY_CONFIG.ui.component, which your page sets
    },
  },
}
