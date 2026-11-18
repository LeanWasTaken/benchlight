import { addToast, clearToasts, dismissToast } from "../internal/toastStore.js";
// vue/composables/useToast.ts
function useToast() {
	return {
		toast: addToast,
		dismiss: dismissToast,
		clear: clearToasts
	};
}
export { useToast };
