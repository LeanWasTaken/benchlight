import { shallowRef } from "vue";
// vue/internal/toastHosts.ts
var toastHosts = shallowRef([]);
function pushToastHost(el) {
	toastHosts.value = [...toastHosts.value.filter((h) => h !== el), el];
}
function removeToastHost(el) {
	toastHosts.value = toastHosts.value.filter((h) => h !== el);
}
var toastFocus = { returnTarget: null };
export { pushToastHost, removeToastHost, toastFocus, toastHosts };
