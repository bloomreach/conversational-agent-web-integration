<script setup>
// the widget passes more props than this component uses: keep them off the root element
defineOptions({ inheritAttrs: false })

const props = defineProps([
  'product',
  'isSelected',
  'isDisabled',
  'onProductClick',
  'onAddToCart',
])

// Note: price and currency are shown as they come; format them the way your shop does
const priceText = (item) => [item.price, item.currency].filter((value) => value != null).join(' ')
</script>

<template>
  <div
    class="my-card"
    :class="{ 'is-selected': props.isSelected, 'is-disabled': props.isDisabled }"
    @click="props.onProductClick()"
  >
    <img class="my-card-image" :src="props.product.image ?? ''" alt="" />
    <div class="my-card-title">{{ props.product.title }}</div>
    <div class="my-card-price">{{ priceText(props.product) }}</div>
    <button type="button" @click.stop="props.onAddToCart()">Add to cart</button>
  </div>
</template>
