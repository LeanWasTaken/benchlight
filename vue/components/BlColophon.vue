<template>
  <footer class="bl-colophon">
    <div class="bl-col bl-colophon__inner">
      <div class="bl-colophon__items">
        <slot>
          <span v-for="item in items" :key="item">{{ item }}</span>
        </slot>
      </div>
      <slot name="actions" />
    </div>
  </footer>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ items?: string[] }>(), { items: () => [] })
</script>
