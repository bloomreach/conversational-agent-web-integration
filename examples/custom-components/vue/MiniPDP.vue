<script setup>
import { computed, ref } from 'vue'

// the widget passes more props than this component uses: keep them off the root element
defineOptions({ inheritAttrs: false })

const props = defineProps([
  'product',
  'selectedVariant',
  'onClose',
  'onVariantSelect',
  'onAddToCart',
])

const addLabels = { adding: 'Adding…', success: 'Added', failed: 'Failed' }
const item = computed(() => props.selectedVariant ?? props.product)
// variants holds the product's own entry too: a product without variants has exactly one
const variants = computed(() => (props.product.variants?.length > 1 ? props.product.variants : []))
// kept with the item it belongs to, so another variant or product starts from "Add to cart"
const added = ref({})
const addState = computed(() => (added.value.id === item.value.id ? added.value.state : undefined))

// Note: price and currency are shown as they come; format them the way your shop does
const priceText = (item) => [item.price, item.currency].filter((value) => value != null).join(' ')

// the keys of extraVariantFields name the attributes that tell the variants apart (size, color, …)
const variantLabel = (variant) =>
  Object.keys(props.product.extraVariantFields ?? {}).map((name) => variant[name]).join(' / ')

const addToCart = async () => {
  const id = item.value.id
  added.value = { id, state: 'adding' }
  const result = await props.onAddToCart().catch(() => ({ status: 'failed' }))
  added.value = { id, state: result?.status }
}
</script>

<template>
  <div class="my-pdp">
    <button class="my-pdp-close" type="button" aria-label="Close" @click="props.onClose()">×</button>
    <img class="my-pdp-image" :src="item.image ?? props.product.image ?? ''" alt="" />
    <h3 class="my-pdp-title">{{ props.product.title }}</h3>
    <div class="my-pdp-price">{{ priceText(item) }}</div>
    <div class="my-pdp-variants">
      <button
        v-for="variant in variants"
        :key="variant.id"
        type="button"
        :class="{ 'is-selected': variant.id === item.id }"
        @click="props.onVariantSelect(variant.id)"
      >
        {{ variantLabel(variant) }}
      </button>
    </div>
    <button type="button" :disabled="addState === 'adding'" @click="addToCart">
      {{ addLabels[addState] ?? 'Add to cart' }}
    </button>
  </div>
</template>
