<template>
  <footer class="kd-colophon">
    <div class="kd-col kd-colophon__inner">
      <p class="kd-colophon__items">
        <slot>
          <span v-for="item in items" :key="item">{{ item }}</span>
        </slot>
      </p>
      <slot name="actions" />
    </div>
  </footer>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ items?: string[] }>(), { items: () => [] })
</script>
