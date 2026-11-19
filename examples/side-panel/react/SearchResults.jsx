'use client'
import { useSearchParams } from 'next/navigation'
import { getClarityResults } from './ClarityBridge'

// render in your results route (app/search/page.jsx), inside <Suspense>, which useSearchParams needs
export const SearchResults = () => {
  const resultsKey = useSearchParams().get('clarityResults')
  const products = resultsKey && getClarityResults(resultsKey)

  // Yours: your regular search results.
  if (!products) return <RegularSearchResults />

  // Yours: your product grid. Each product has id, title, url, image, price and originalPrice.
  return <ProductGrid products={products} />
}
