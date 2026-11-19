'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Note: kept in memory only, so a reload of the results page finds nothing; store them if you need that
let clarityResults = { key: null, products: [] }

export const getClarityResults = (key) => (clarityResults.key === key ? clarityResults.products : null)

// render once in the root layout
export const ClarityBridge = () => {
  const router = useRouter()

  useEffect(() => {
    // 1. read by the goToProductPage setting, see ../configuration/side-panel.js
    window.__clarityRouter = router

    // 2. the search results the widget hands to the page
    const onSearchedProducts = (event) => {
      // from_history: the widget replaying an earlier answer while it loads; do not navigate for it
      if (event.detail.from_history) return
      const products = event.detail.products_data.flatMap((batch) => batch.data)
      // a key per answer, so a new answer on the results page gets a new URL and renders
      clarityResults = { key: String(Date.now()), products }
      // Note: /search stands for your results route
      router.push(`/search?clarityResults=${clarityResults.key}`)
    }
    window.addEventListener('Clarity:searchedProducts', onSearchedProducts)

    return () => {
      window.removeEventListener('Clarity:searchedProducts', onSearchedProducts)
      delete window.__clarityRouter
    }
  }, [router])

  return null
}
