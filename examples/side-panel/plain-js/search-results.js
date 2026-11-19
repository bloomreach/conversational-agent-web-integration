// For a storefront where every navigation is a page load. Include it on every page.
// Yours, not defined here: renderProducts(products), your results grid.

// 1. Every page: keep the search results the widget hands to the page, then open your results page.
window.addEventListener('Clarity:searchedProducts', (event) => {
  // from_history: the widget replaying earlier answers while it loads, handled in 2.
  if (event.detail.from_history) return

  // Note: stores the products as the widget sends them, with every attribute; sessionStorage holds about 5 MB,
  // so for large result sets keep only the fields your grid renders
  const products = event.detail.products_data.flatMap((batch) => batch.data)
  try {
    sessionStorage.setItem('clarityResults', JSON.stringify(products))
  } catch {
    // storage full: navigate anyway, the results page falls back to the replay
    sessionStorage.removeItem('clarityResults')
  }
  window.location.assign('/search?fromClarity=true')
})

// 2. Your results page: render the stored products, or the widget's replay when there are none.
if (new URLSearchParams(window.location.search).get('fromClarity') === 'true') {
  const stored = JSON.parse(sessionStorage.getItem('clarityResults') ?? 'null')
  if (stored) {
    renderProducts(stored)
  } else {
    // dispatched once, while the widget loads: this listener has to be registered before that
    // Note: it takes the last batch only; and if no replay comes, leave your loading state after a timeout of your own
    window.addEventListener('Clarity:searchedProducts', (event) => {
      if (event.detail.from_history) renderProducts(event.detail.products_data.at(-1).data)
    })
  }
}
