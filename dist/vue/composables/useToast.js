import { clearToasts, dismissToast, addToast } from "../internal/toastStore.js";
function useToast() {
  return { toast: addToast, dismiss: dismissToast, clear: clearToasts };
}
export {
  useToast
};
