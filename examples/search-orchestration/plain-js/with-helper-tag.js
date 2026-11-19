// Yours, not defined here:
//   searchInput                  your search input element
//   runSiteSearch(query)         your search as it runs today
//   fetchSearchResults(query)    your search request, returning a promise of the results
//   renderSearchResults(results) your results view

searchInput.addEventListener('focus', () => window.CLARITY_HELPER?.onFocus?.())

// call this where your page handles a submitted search
export const onSearchSubmit = async (query) => {
  // the Helper Tag is not on the page: search as before
  if (!window.CLARITY_HELPER) return runSiteSearch(query)

  // started together, so a keyword search does not wait for the classification first
  const searchRequest = fetchSearchResults(query)
  // Note: pass your page's locale, one of the supported codes
  const isKeywordSearch = await window.CLARITY_HELPER.isSearch(query, { locale: 'en-us' })

  if (isKeywordSearch) {
    renderSearchResults(await searchRequest)
  } else {
    window.CLARITY_HELPER.invokeSearchHubOrch(query)
  }
}
