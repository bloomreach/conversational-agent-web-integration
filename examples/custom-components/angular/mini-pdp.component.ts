import { NgFor } from '@angular/common'
import { Component, Input } from '@angular/core'

type Product = {
  id: string
  title: string | null
  image: string | null
  price: number | string | null
  currency: string | null
  variants: Product[] | null
  extraVariantFields?: Record<string, unknown> | null
  [attribute: string]: unknown
}

const addLabels: Record<string, string> = { adding: 'Adding…', success: 'Added', failed: 'Failed' }

@Component({
  selector: 'my-mini-pdp',
  standalone: true,
  imports: [NgFor],
  template: `
    <div class="my-pdp">
      <button class="my-pdp-close" type="button" aria-label="Close" (click)="onClose()">×</button>
      <img class="my-pdp-image" [src]="item.image ?? product.image ?? ''" alt="" />
      <h3 class="my-pdp-title">{{ product.title }}</h3>
      <div class="my-pdp-price">{{ priceText() }}</div>
      <div class="my-pdp-variants">
        <button
          *ngFor="let variant of variants"
          type="button"
          [class.is-selected]="variant.id === item.id"
          (click)="onVariantSelect(variant.id)"
        >
          {{ variantLabel(variant) }}
        </button>
      </div>
      <button type="button" [disabled]="addState === 'adding'" (click)="addToCart()">{{ addLabel }}</button>
    </div>
  `,
})
export class MiniPdpComponent {
  @Input({ required: true }) product!: Product
  @Input() selectedVariant?: Product
  @Input({ required: true }) onClose!: () => void
  @Input({ required: true }) onVariantSelect!: (variantId: string) => void
  @Input({ required: true }) onAddToCart!: () => Promise<{ status: string } | void>

  // kept with the item it belongs to, so another variant or product starts from "Add to cart"
  private added: { id?: string; state?: string } = {}

  get item() {
    return this.selectedVariant ?? this.product
  }

  // variants holds the product's own entry too: a product without variants has exactly one
  get variants() {
    return this.product.variants && this.product.variants.length > 1 ? this.product.variants : []
  }

  get addState() {
    return this.added.id === this.item.id ? this.added.state : undefined
  }

  get addLabel() {
    return addLabels[this.addState ?? ''] ?? 'Add to cart'
  }

  // Note: price and currency are shown as they come; format them the way your shop does
  priceText() {
    return [this.item.price, this.item.currency].filter((value) => value != null).join(' ')
  }

  // the keys of extraVariantFields name the attributes that tell the variants apart (size, color, …)
  variantLabel(variant: Product) {
    return Object.keys(this.product.extraVariantFields ?? {})
      .map((name) => variant[name])
      .join(' / ')
  }

  async addToCart() {
    const id = this.item.id
    this.added = { id, state: 'adding' }
    const result = await this.onAddToCart().catch(() => ({ status: 'failed' }))
    this.added = { id, state: result?.status }
  }
}
