// Yours, not defined here:
//   searchInput                  your search input element
//   runSiteSearch(query)         your search as it runs today
//   fetchSearchResults(query)    your search request, returning a promise of the results
//   renderSearchResults(results) your results view

import { clarityUtils } from '@bloomreach/clarity-utils'

// from your Bloomreach contact
const ORCHESTRATOR_WEBLAYER_ID = '<the orchestrator weblayer id>'

// version 1 (npm tag latest): { mode: 'score', locale: 'en-us' }
// version 2 (npm tag next): { mode: 'api', classifierUrl, agentId }, values from your Bloomreach contact
// Note: pass your page's locale, one of the supported codes
clarityUtils.setup({ mode: 'score', locale: 'en-us' })
searchInput.addEventListener('focus', () => clarityUtils.warmUp?.())

// triggerComponent labels the opening in analytics
const openChatWithQuery = async (query) => {
  const opening = { triggerComponent: 'search' }
  await window.CLARITY.call('show_badge', opening, ORCHESTRATOR_WEBLAYER_ID)
  await window.CLARITY.call('open_chat', opening, ORCHESTRATOR_WEBLAYER_ID)
  await window.CLARITY.call(
    'user_send_message',
    { input: query, type: 'text', force: true, ...opening },
    ORCHESTRATOR_WEBLAYER_ID
  )
}

// call this where your page handles a submitted search
export const onSearchSubmit = async (query) => {
  // the chat widget is not on the page: search as before
  if (!window.CLARITY) return runSiteSearch(query)

  // started together, so a keyword search does not wait for the classification first
  const searchRequest = fetchSearchResults(query)
  const isKeywordSearch = await clarityUtils.isSearch(query)

  // the analytics event of search orchestration, through the Engagement SDK on your page
  // Note: exponea is the SDK's default global name; use yours if your project renamed it
  window.exponea.track('clarity', {
    action: 'search_orchestrator',
    search_string: query,
    is_conversational: !isKeywordSearch,
  })

  if (isKeywordSearch) {
    renderSearchResults(await searchRequest)
  } else {
    // Note: not awaited, and a failing call leaves the shopper with neither results nor chat;
    // fall back to renderSearchResults(await searchRequest) if you want to cover that
    openChatWithQuery(query)
  }
}
