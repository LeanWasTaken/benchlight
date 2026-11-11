import { type Ref } from 'vue';
/** Ref that mirrors `prefers-reduced-motion: reduce`; `false` on the server and until mounted. */
export declare function useReducedMotion(): Ref<boolean>;
