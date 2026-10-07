<template>
  <BlSectionHead :level="3" eyebrow="Field" heading="Labels, hints and wiring" />
  <div class="pg-stack">
    <BlField v-slot="{ id }" label="Display name" hint="Shown next to your avatar.">
      <BlInput :id="id" v-model="displayName" />
    </BlField>
    <BlField label="Auto-wired" hint="Linked via context"><BlInput /></BlField>
    <BlField label="Contact email"><BlInput v-model="email" type="email" /></BlField>
    <BlField label="Access code" hint="Digits only."><BlInput type="password" /></BlField>
    <BlField label="Custom control" hint="Reads FIELD_CONTEXT itself."><DemoFieldInput /></BlField>
    <BlField v-slot="{ id }" label="Network">
      <BlSelect :id="id" v-model="network" :options="networks" />
    </BlField>
    <BlField v-slot="{ id }" label="Volume">
      <BlRange :id="id" v-model="volume" :min="-60" :max="0" :format="(v) => `${v} dB`" />
    </BlField>
    <BlField label="Brightness" hint="Plain numbers, step 5.">
      <BlRange v-model="brightness" :step="5" />
    </BlField>
  </div>

  <BlSectionHead :level="3" eyebrow="Toggle" heading="Switches" />
  <div data-demo="toggle">
    <BlToggle v-model="wifi" label="Wi-Fi" hint="Joins known networks automatically" />
    <BlToggle v-model="pressedOff" label="Disabled setting" disabled />
  </div>
  <form class="pg-row" data-demo="toggle-reset" @submit.prevent>
    <BlToggle v-model="autoJoin" label="Auto-join" />
    <BlButton type="reset">Reset</BlButton>
    <span data-demo="toggle-state" aria-hidden="true" class="bl-sr-only">{{ autoJoin }}</span>
  </form>
  <div data-demo="toggle-more">
    <BlToggle v-model="notify" label="Notify" name="notify" value="yes" />
    <BlToggle :model-value="true" label="Locked on" disabled />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import {
    BlButton,
    BlField,
    BlInput,
    BlRange,
    BlSectionHead,
    BlSelect,
    BlToggle
  } from '../../../vue'
  import DemoFieldInput from './DemoFieldInput.vue'

  // `wifi` belongs to the page: toggling it re-renders App, which hands BlTable fresh rows.
  const wifi = defineModel<boolean>('wifi', { required: true })
  const pressedOff = ref(false)
  const autoJoin = ref(true)
  const notify = ref(false)
  const displayName = ref('Your name')
  const email = ref('')
  const network = ref('home')
  const networks = [
    { value: 'home', label: 'home-5g · -48 dBm' },
    { value: 'guest', label: 'guest · -71 dBm' }
  ]
  const volume = ref(-12)
  const brightness = ref(40)
</script>
