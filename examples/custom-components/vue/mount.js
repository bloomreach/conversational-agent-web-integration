import { createApp, h, shallowReactive } from 'vue'
import ProductCard from './ProductCard.vue'
import MiniPDP from './MiniPDP.vue'

const mountVue = (Component) => (el, props) => {
  // shallow: the widget hands over new objects when the props change, so nested reactivity is not needed
  const state = shallowReactive({ ...props })
  const app = createApp({ render: () => h(Component, state) })
  app.mount(el)
  return {
    update: (next) => Object.assign(state, next),
    cleanup: () => app.unmount(),
  }
}

// Until this has run, the widget shows its built-in components.
// Note: browser only; in a server-rendered app such as Nuxt, import this file on the client only
window.CLARITY_CONFIG = {
  ...(window.CLARITY_CONFIG ?? {}),
  ui: {
    ...window.CLARITY_CONFIG?.ui,
    component: {
      ...window.CLARITY_CONFIG?.ui?.component,
      ProductCard: mountVue(ProductCard),
      MiniPDP: mountVue(MiniPDP),
    },
  },
}
