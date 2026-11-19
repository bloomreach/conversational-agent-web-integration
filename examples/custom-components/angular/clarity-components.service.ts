import {
  ApplicationRef,
  EnvironmentInjector,
  Injectable,
  NgZone,
  Type,
  createComponent,
  reflectComponentType,
} from '@angular/core'
import { MiniPdpComponent } from './mini-pdp.component'
import { ProductCardComponent } from './product-card.component'

type Props = Record<string, unknown>
type MountFn = (el: HTMLElement, props: Props) => unknown

declare global {
  interface Window {
    CLARITY_CONFIG?: { ui?: { component?: Record<string, MountFn> } }
  }
}

// inject once at start-up, for example in the root component
// Note: browser only; with server-side rendering, inject it only when isPlatformBrowser(PLATFORM_ID)
@Injectable({ providedIn: 'root' })
export class ClarityComponentsService {
  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector,
    private zone: NgZone
  ) {
    // Until it is created, the widget shows its built-in components.
    window.CLARITY_CONFIG = {
      ...(window.CLARITY_CONFIG ?? {}),
      ui: {
        ...window.CLARITY_CONFIG?.ui,
        component: {
          ...window.CLARITY_CONFIG?.ui?.component,
          ProductCard: (el, props) => this.mount(ProductCardComponent, el, props),
          MiniPDP: (el, props) => this.mount(MiniPdpComponent, el, props),
        },
      },
    }
  }

  // The widget calls the mount function from outside Angular's zone. Running it in the zone lets the
  // component's own events and async updates (like the add-to-cart state) trigger change detection.
  // Note: a zoneless app has to schedule change detection itself, for example with signals in the component
  private mount<T>(component: Type<T>, el: HTMLElement, props: Props) {
    return this.zone.run(() => {
      const ref = createComponent(component, { environmentInjector: this.injector, hostElement: el })
      // setInput on a name the component does not declare is an error in dev mode
      const inputs = new Set(reflectComponentType(component)?.inputs.map((input) => input.templateName))
      const setInputs = (next: Props) => {
        for (const [name, value] of Object.entries(next)) if (inputs.has(name)) ref.setInput(name, value)
        ref.changeDetectorRef.detectChanges()
      }

      setInputs(props)
      this.appRef.attachView(ref.hostView)
      return {
        update: (next: Props) => this.zone.run(() => setInputs(next)),
        cleanup: () =>
          this.zone.run(() => {
            this.appRef.detachView(ref.hostView)
            ref.destroy()
          }),
      }
    })
  }
}
