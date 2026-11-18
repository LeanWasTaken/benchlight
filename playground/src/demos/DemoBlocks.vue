<template>
  <div data-demo="disclosure">
    <BlDisclosure v-model:open="faqA" summary="What does this do?" name="faq">
      <p>It shows one answer at a time.</p>
    </BlDisclosure>
    <BlDisclosure v-model:open="faqB" summary="Can several be open?" name="faq">
      <p>Not in a named group; the browser closes the other one.</p>
    </BlDisclosure>
    <BlDisclosure summary="Independent section">
      <p>Without a name it opens and closes on its own.</p>
    </BlDisclosure>
    <BlDisclosure open>
      <template #summary>Rich <em>summary</em> slot, open at first</template>
      <p>The summary slot takes markup; <code>open</code> alone sets the initial state.</p>
    </BlDisclosure>
    <span data-demo="faq-state" class="bl-sr-only" aria-hidden="true">{{ faqA }}/{{ faqB }}</span>
  </div>

  <div class="pg-row" data-demo="dialog">
    <BlButton variant="secondary" @click="dialogOpen = true">Rename</BlButton>
    <BlButton variant="secondary" @click="lockedOpen = true">Delete project</BlButton>
    <BlButton variant="secondary" @click="wideOpen = true">Wide panel</BlButton>
    <span class="bl-annotation">Last close: {{ lastClose }}</span>
    <BlDialog
      v-model:open="dialogOpen"
      title="Rename item"
      description="Names show in lists and exports."
      @close="lastClose = $event.reason"
    >
      <BlField label="Name"><BlInput v-model="itemName" /></BlField>
      <BlTooltip text="Copies the name to the clipboard.">
        <template #trigger="{ bind }">
          <BlButton variant="ghost" v-bind="bind" @click="toast('Copied')">Copy name</BlButton>
        </template>
      </BlTooltip>
      <template #footer>
        <BlButton variant="secondary" @click="dialogOpen = false">Cancel</BlButton>
        <BlButton @click="dialogOpen = false">Save</BlButton>
      </template>
    </BlDialog>
    <BlDialog
      v-model:open="lockedOpen"
      title="Delete project?"
      :dismissible="false"
      @close="lastClose = $event.reason"
    >
      <p>This cannot be undone.</p>
      <template #footer>
        <BlButton variant="secondary" autofocus @click="lockedOpen = false">Keep</BlButton>
        <BlButton variant="danger" @click="lockedOpen = false">Delete</BlButton>
      </template>
    </BlDialog>
    <BlDialog
      v-model:open="wideOpen"
      class="pg-dialog-wide"
      title="Wide panel"
      :labels="{ close: 'Dismiss panel' }"
      @close="lastClose = $event.reason"
    >
      <p>Set <code>--bl-dialog-width</code> to resize a centred dialog.</p>
    </BlDialog>
  </div>

  <div class="pg-row" data-demo="lightbox">
    <button
      v-for="(photo, i) in photos"
      :key="i"
      type="button"
      class="pg-thumb"
      @click="openViewer(i)"
    >
      <img :src="photo.src" :alt="photo.alt" />
    </button>
    <span class="bl-annotation">Last close: {{ viewerClose }}</span>
    <BlLightbox
      v-model:open="viewerOpen"
      v-model:index="viewerIndex"
      :items="photos"
      @close="viewerClose = $event.reason"
    />
  </div>

  <div class="pg-row" data-demo="lightbox-plates">
    <button
      v-for="(plate, i) in plates"
      :key="plate.key ?? i"
      type="button"
      class="pg-thumb"
      @click="openPlates(i)"
    >
      <img :src="plate.src ?? drawingThumb" :alt="plate.alt" />
    </button>
    <BlLightbox
      v-model:open="platesOpen"
      v-model:index="platesIndex"
      :items="plates"
      announce="position+caption"
    >
      <template #title="{ item }">{{ item.title }}</template>
      <template #actions="{ item, index }">
        <BlButton
          v-if="item.src"
          variant="secondary"
          :href="item.src"
          :download="`plate-${index + 1}.svg`"
        >
          Download
        </BlButton>
      </template>
      <template #default="{ item, loaded }">
        <!-- eslint-disable vue/no-v-html -- fixed markup generated in data.ts -->
        <svg
          v-if="!item.src"
          class="bl-lightbox__media"
          :viewBox="`0 0 ${item.width} ${item.height}`"
          :width="item.width"
          :height="item.height"
          role="img"
          :aria-label="item.alt"
          @vue:mounted="loaded({ width: item.width!, height: item.height! })"
          v-html="drawingMarkup"
        />
        <!-- eslint-enable vue/no-v-html -->
      </template>
    </BlLightbox>
  </div>

  <div class="pg-row" data-demo="toast">
    <BlButton variant="secondary" @click="toast('Saved')">Toast</BlButton>
    <BlButton variant="secondary" @click="toast({ message: 'Connected', tone: 'success' })">
      Success
    </BlButton>
    <BlButton variant="secondary" @click="toast({ message: 'Upload failed', tone: 'danger' })">
      Danger
    </BlButton>
    <BlButton
      variant="secondary"
      @click="toast({ message: 'Item deleted', action: { label: 'Undo', onClick: () => {} } })"
    >
      With action
    </BlButton>
    <BlButton variant="secondary" @click="toast({ message: 'Syncing', id: 'sync', duration: 0 })">
      Persistent
    </BlButton>
    <BlButton variant="secondary" @click="dismiss('sync')">Dismiss persistent</BlButton>
    <BlButton variant="ghost" @click="clear()">Clear all</BlButton>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { drawingMarkup, drawingThumb, photos, plates } from './data'
  import {
    BlButton,
    BlDialog,
    BlDisclosure,
    BlField,
    BlInput,
    BlLightbox,
    BlTooltip,
    useToast
  } from '../../../vue'

  const faqA = ref(true)
  const faqB = ref(false)
  const dialogOpen = ref(false)
  const lockedOpen = ref(false)
  const wideOpen = ref(false)
  const itemName = ref('Item 1')
  const lastClose = ref('none')
  const { toast, dismiss, clear } = useToast()
  const viewerOpen = ref(false)
  const viewerIndex = ref(0)
  const viewerClose = ref('none')
  function openViewer(i: number): void {
    viewerIndex.value = i
    viewerOpen.value = true
  }
  const platesOpen = ref(false)
  const platesIndex = ref(0)
  function openPlates(i: number): void {
    platesIndex.value = i
    platesOpen.value = true
  }
</script>
