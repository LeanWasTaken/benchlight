<template>
  <input :id="field?.id.value" class="bl-input" :aria-describedby="field?.describedBy.value" />
</template>

<script setup lang="ts">
  import { inject } from 'vue'
  import { FIELD_CONTEXT } from '../../../vue'

  // What any custom control does to join a BlField: read its id and hint wiring.
  const field = inject(FIELD_CONTEXT, null)
</script>
