import { createRoot } from 'react-dom/client'
import { ProductCard } from './ProductCard'
import { MiniPDP } from './MiniPDP'

const mountReact = (Component) => (el, props) => {
  const root = createRoot(el)
  root.render(<Component {...props} />)
  return {
    update: (next) => root.render(<Component {...next} />),
    cleanup: () => root.unmount(),
  }
}

// Until this has run, the widget shows its built-in components.
// Note: browser only; in a server-rendered app such as Next.js, import this file on the client only
window.CLARITY_CONFIG = {
  ...(window.CLARITY_CONFIG ?? {}),
  ui: {
    ...window.CLARITY_CONFIG?.ui,
    component: {
      ...window.CLARITY_CONFIG?.ui?.component,
      ProductCard: mountReact(ProductCard),
      MiniPDP: mountReact(MiniPDP),
    },
  },
}
