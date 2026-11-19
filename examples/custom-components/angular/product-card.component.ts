import { Component, Input } from '@angular/core'

type Product = {
  id: string
  title: string | null
  image: string | null
  price: number | string | null
  currency: string | null
}

@Component({
  selector: 'my-product-card',
  standalone: true,
  template: `
    <div
      class="my-card"
      [class.is-selected]="isSelected"
      [class.is-disabled]="isDisabled"
      (click)="onProductClick()"
    >
      <img class="my-card-image" [src]="product.image ?? ''" alt="" />
      <div class="my-card-title">{{ product.title }}</div>
      <div class="my-card-price">{{ priceText() }}</div>
      <button type="button" (click)="$event.stopPropagation(); onAddToCart()">Add to cart</button>
    </div>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product
  @Input() isSelected = false
  @Input() isDisabled = false
  @Input({ required: true }) onProductClick!: () => void
  @Input({ required: true }) onAddToCart!: () => Promise<unknown>

  // Note: price and currency are shown as they come; format them the way your shop does
  priceText() {
    return [this.product.price, this.product.currency].filter((value) => value != null).join(' ')
  }
}
