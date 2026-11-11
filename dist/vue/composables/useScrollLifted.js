import { ref, onMounted, watch, toValue, onBeforeUnmount } from "vue";
function useScrollLifted(threshold = 24) {
  const lifted = ref(false);
  const update = () => {
    const limit = toValue(threshold);
    lifted.value = limit !== false && window.scrollY > limit;
  };
  onMounted(() => {
    update();
    window.addEventListener("scroll", update, { passive: true });
  });
  watch(() => toValue(threshold), update, { flush: "post" });
  onBeforeUnmount(() => window.removeEventListener("scroll", update));
  return lifted;
}
export {
  useScrollLifted
};
