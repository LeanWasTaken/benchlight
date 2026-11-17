import { onMounted, onBeforeUnmount } from "vue";
function formOf(el) {
  if (el.form) return el.form;
  const control = el.querySelector("input, select, textarea");
  return control?.form ?? el.closest("form");
}
function useFormReset(el, after, before) {
  let form = null;
  let timer;
  function onReset(event) {
    before?.();
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!event.defaultPrevented) after();
    }, 0);
  }
  onMounted(() => {
    form = el.value ? formOf(el.value) : null;
    form?.addEventListener("reset", onReset);
  });
  onBeforeUnmount(() => {
    clearTimeout(timer);
    form?.removeEventListener("reset", onReset);
  });
}
export {
  useFormReset
};
