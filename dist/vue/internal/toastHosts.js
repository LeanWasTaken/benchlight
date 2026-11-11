import { shallowRef } from "vue";
const toastHosts = shallowRef([]);
function pushToastHost(el) {
  toastHosts.value = [...toastHosts.value.filter((h) => h !== el), el];
}
function removeToastHost(el) {
  toastHosts.value = toastHosts.value.filter((h) => h !== el);
}
const toastFocus = { returnTarget: null };
export {
  pushToastHost,
  removeToastHost,
  toastFocus,
  toastHosts
};
