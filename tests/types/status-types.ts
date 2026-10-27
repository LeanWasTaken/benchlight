import BlButton from '../../vue/components/BlButton.vue'
import BlDialog from '../../vue/components/BlDialog.vue'
import BlIndexRow from '../../vue/components/BlIndexRow.vue'
import BlNavLink from '../../vue/components/BlNavLink.vue'
import BlTabBarItem from '../../vue/components/BlTabBarItem.vue'
import BlLed from '../../vue/components/BlLed.vue'
import BlMsg from '../../vue/components/BlMsg.vue'
import type {
  ButtonVariant,
  DialogCloseEvent,
  DialogCloseReason,
  LedState,
  LinkCurrent,
  StatusTone,
  ToastTone
} from '../../vue/index'

// `bun run typecheck` fails here if an exported union drifts from the prop it names. Components
// keep inline literal prop types (see sfc-props.test.ts), so this is what ties them together.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertType<_T extends true>(): void {}

type Props<C extends abstract new (...args: never) => unknown> =
  InstanceType<C> extends {
    $props: infer P
  }
    ? P
    : never

assertType<Equal<NonNullable<Props<typeof BlMsg>['tone']>, StatusTone>>()
assertType<Equal<NonNullable<Props<typeof BlButton>['variant']>, ButtonVariant>>()
assertType<Equal<NonNullable<Props<typeof BlLed>['state']>, LedState>>()
assertType<Equal<ToastTone, StatusTone>>()
assertType<Equal<StatusTone, 'neutral' | 'success' | 'danger'>>()
assertType<Equal<DialogCloseEvent, { reason: DialogCloseReason; returnValue: string }>>()

type DialogClose = Parameters<NonNullable<Props<typeof BlDialog>['onClose']>>[0]
assertType<Equal<DialogClose, DialogCloseEvent>>()
assertType<Equal<LinkCurrent, boolean | 'page' | 'step' | 'location'>>()
assertType<Equal<NonNullable<Props<typeof BlNavLink>['current']>, LinkCurrent>>()
assertType<Equal<NonNullable<Props<typeof BlTabBarItem>['current']>, LinkCurrent>>()
assertType<Equal<NonNullable<Props<typeof BlIndexRow>['current']>, LinkCurrent>>()
