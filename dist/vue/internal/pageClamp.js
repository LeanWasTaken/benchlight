import { watch } from "vue";
import { clampPage } from "./table.js";
function useClampedPage(page, total, pageSize) {
  watch(
    () => [total(), pageSize()],
    ([count, size]) => {
      if (!size || count <= 0) return;
      const next = clampPage(page.value, count, size);
      if (next !== page.value) page.value = next;
    },
    { immediate: true }
  );
}
export {
  useClampedPage
};
