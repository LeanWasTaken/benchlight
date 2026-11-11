import { ref, onMounted, onBeforeUnmount } from "vue";
function useReducedMotion() {
  const reduced = ref(false);
  let media = null;
  const update = () => {
    reduced.value = media?.matches ?? false;
  };
  onMounted(() => {
    media = window.matchMedia("(prefers-reduced-motion: reduce)");
    update();
    media.addEventListener("change", update);
  });
  onBeforeUnmount(() => media?.removeEventListener("change", update));
  return reduced;
}
export {
  useReducedMotion
};
