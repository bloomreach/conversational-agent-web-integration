// For reference only, not for your codebase: Bloomreach sets this up in your Engagement project,
// in a tag or in the weblayer. The settings this example relies on:
const weblayerConfig = {
  // ...the rest of the weblayer configuration

  widget: {
    // ...the rest of the widget settings

    ui: {
      desktopTemplate: 'ai_mode',
      fn: {
        // 1. A product click navigates through your router instead of loading the page.
        //    window.__clarityRouter is provided by your page.
        //    Note: a click before your page has set it throws; add a fallback such as
        //    window.location.assign(config.parentProduct.url) if your page can be clicked before it mounts
        goToProductPage: (variant, config) => {
          const url = new URL(config.parentProduct.url, window.location.href)
          window.__clarityRouter.push(url.pathname + url.search + url.hash)
        },
        // 2. With desktopTemplate 'ai_mode', search results go to your page by default, as
        //    Clarity:searchedProducts events. This keeps them in the chat on a product page,
        //    which has no results grid.
        //    Note: /products/ stands for however your product pages are recognised
        hideSearchResultCarousels: () => !window.location.pathname.startsWith('/products/'),
      },
    },
  },
}
