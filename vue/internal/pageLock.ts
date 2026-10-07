// One scrollbar measurement per stack of open dialogs; nested dialogs reuse it. Pages that
// already reserve the gutter (scrollbar-gutter: stable) need no compensation.
let locks = 0

export function lockPage(): void {
  if (locks++ > 0) return
  const root = document.documentElement
  if (getComputedStyle(root).scrollbarGutter.includes('stable')) return
  root.style.setProperty('--bl-dialog-gutter', `${Math.max(0, innerWidth - root.clientWidth)}px`)
}

export function unlockPage(): void {
  if (locks === 0 || --locks > 0) return
  document.documentElement.style.removeProperty('--bl-dialog-gutter')
}
