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

  <BlSectionHead :level="3" eyebrow="Number field" heading="Typed numbers" />
  <div class="pg-stack" data-demo="number-field">
    <BlField label="Channel" hint="1 to 13; clamped when you leave the field.">
      <BlNumberField v-model="channel" :min="1" :max="13" />
    </BlField>
    <BlField label="Offset" hint="Zero or more, step 0.5.">
      <BlNumberField v-model="offset" :min="0" :step="0.5" />
    </BlField>
    <span data-demo="number-field-state" aria-hidden="true" class="bl-sr-only">{{
      offset === null ? 'null' : offset
    }}</span>
    <BlField label="Retries (locked)"><BlNumberField :model-value="3" disabled /></BlField>
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

  <BlSectionHead :level="3" eyebrow="Textarea" heading="Multi-line text" />
  <div class="pg-stack" data-demo="textarea">
    <BlField label="Notes" hint="Resizes vertically.">
      <BlTextarea v-model="notes" />
    </BlField>
    <BlField label="Archived notes"><BlTextarea model-value="Read only now." disabled /></BlField>
  </div>

  <BlSectionHead :level="3" eyebrow="Checkbox" heading="Ticks and dashes" />
  <div class="pg-stack" data-demo="checkbox">
    <BlCheckbox v-model="allChannels" v-model:indeterminate="someChannels" label="All channels" />
    <BlCheckbox v-model="backups" label="Nightly backups" hint="Runs at 03:00 local time" />
    <BlCheckbox v-model="metrics" label="Send metrics" />
    <BlCheckbox :model-value="true" label="Required by policy" disabled />
    <BlCheckbox :model-value="false" label="Not available" disabled />
  </div>
  <form class="pg-row" data-demo="checkbox-reset" @submit.prevent>
    <BlCheckbox v-model="keepLogs" label="Keep logs" />
    <BlButton type="reset">Reset</BlButton>
    <span data-demo="checkbox-state" aria-hidden="true" class="bl-sr-only">{{ keepLogs }}</span>
  </form>

  <BlSectionHead :level="3" eyebrow="Radio" heading="One of several" />
  <div data-demo="radio">
    <BlRadioGroup v-model="band" legend="Band" hint="Arrow keys move between options.">
      <BlRadio label="2.4 GHz" value="2.4" hint="Longer range" />
      <BlRadio label="5 GHz" value="5" />
      <BlRadio label="6 GHz" value="6" />
    </BlRadioGroup>
    <span data-demo="radio-state" aria-hidden="true" class="bl-sr-only">{{ band }}</span>
    <BlRadioGroup v-model="channelWidth" legend="Channel width" class="bl-fieldset--inline">
      <BlRadio label="20 MHz" value="20" />
      <BlRadio label="40 MHz" value="40" />
      <BlRadio label="80 MHz" value="80" disabled />
    </BlRadioGroup>
    <BlRadioGroup model-value="auto" legend="Region (locked)" disabled>
      <BlRadio label="Automatic" value="auto" />
      <BlRadio label="Fixed" value="fixed" />
    </BlRadioGroup>
  </div>

  <BlSectionHead :level="3" eyebrow="Validation" heading="Invalid fields" />
  <div class="pg-stack" data-demo="invalid">
    <BlField label="Contact email" hint="We never share it." error="Enter an email address.">
      <BlInput v-model="badEmail" type="email" />
    </BlField>
    <BlField label="Network" error="Pick a network.">
      <BlSelect v-model="badNetwork" :options="networks" />
    </BlField>
    <BlField label="Gain" error="Gain is above the safe limit.">
      <BlRange v-model="gain" :min="0" :max="24" />
    </BlField>
    <BlField label="Message" error="Write at least 20 characters.">
      <BlTextarea v-model="message" :rows="3" />
    </BlField>
    <BlToggle v-model="terms" label="Accept the terms" error="Accept the terms to continue." />
    <BlCheckbox v-model="confirm" label="I have a backup" error="Confirm that a backup exists." />
    <BlRadioGroup v-model="plan" legend="Plan" error="Choose a plan.">
      <BlRadio label="Basic" value="basic" />
      <BlRadio label="Pro" value="pro" />
    </BlRadioGroup>
    <fieldset class="bl-fieldset bl-fieldset--invalid" aria-describedby="pg-cg-error">
      <legend class="bl-fieldset__legend">Notify me about</legend>
      <p id="pg-cg-error" class="bl-fieldset__error">Choose at least one topic.</p>
      <BlCheckbox v-model="topicUpdates" label="Updates" />
      <BlCheckbox v-model="topicOutages" label="Outages" />
    </fieldset>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import {
    BlButton,
    BlCheckbox,
    BlField,
    BlInput,
    BlNumberField,
    BlRadio,
    BlRadioGroup,
    BlRange,
    BlSectionHead,
    BlSelect,
    BlTextarea,
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
  const channel = ref<number | null>(6)
  const offset = ref<number | null>(2)

  const notes = ref('First line.\nSecond line.')
  const allChannels = ref(false)
  const someChannels = ref(true)
  const backups = ref(true)
  const metrics = ref(false)
  const keepLogs = ref(true)
  const band = ref('5')
  const channelWidth = ref('40')

  const badEmail = ref('not-an-email')
  const badNetwork = ref('guest')
  const gain = ref(22)
  const message = ref('Too short')
  const terms = ref(false)
  const confirm = ref(false)
  const plan = ref<string | number | undefined>()
  const topicUpdates = ref(false)
  const topicOutages = ref(false)
</script>
