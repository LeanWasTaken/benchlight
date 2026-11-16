import { onBeforeUnmount, onMounted, type Ref } from 'vue'

type Owned = HTMLElement & { form?: HTMLFormElement | null }

// The form a control belongs to. `.form` honours a `form="id"` attribute, which `closest('form')`
// ignores; a wrapper without `.form` (a div) asks its first form control instead.
function formOf(el: Owned): HTMLFormElement | null {
  if (el.form) return el.form
  const control = el.querySelector<HTMLInputElement>('input, select, textarea')
  return control?.form ?? el.closest('form')
}

// Runs `after` once a native form reset has finished. The reset event fires BEFORE the browser
// resets the controls (and a microtask can still run before that), so `after` runs in a macrotask
// and reads the reset state. `before` runs synchronously inside the event, for work the reset
// algorithm depends on (restoring `defaultChecked`). A pending `after` is cancelled on unmount and
// skipped when the reset was cancelled (`preventDefault`). The form is resolved once, at mount: a
// control moved to another form later, or a changed `form` attribute, is not re-resolved.
export function useFormReset(
  el: Ref<HTMLElement | undefined | null>,
  after: () => void,
  before?: () => void
): void {
  let form: HTMLFormElement | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  function onReset(event: Event): void {
    before?.()
    clearTimeout(timer)
    // Later listeners can still cancel the reset, so check once the event has finished.
    timer = setTimeout(() => {
      if (!event.defaultPrevented) after()
    }, 0)
  }
  onMounted(() => {
    form = el.value ? formOf(el.value) : null
    form?.addEventListener('reset', onReset)
  })
  onBeforeUnmount(() => {
    clearTimeout(timer)
    form?.removeEventListener('reset', onReset)
  })
}
