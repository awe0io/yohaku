import { clsxm } from '~/lib/helper'

export const metaFieldLabelClassName = (extra?: string) =>
  clsxm('mr-[0.45em] text-caption-10 tracking-[0.12em] text-neutral-6', extra)

export const MetaField: Component<{
  label: string
  labelClassName?: string
}> = ({ label, labelClassName, className, children }) => (
  <span
    className={clsxm(
      'inline-flex min-w-0 items-baseline whitespace-nowrap',
      className,
    )}
  >
    <span className={metaFieldLabelClassName(labelClassName)}>{label}</span>
    {children}
  </span>
)

export const LivePulseDot = () => (
  <span
    aria-hidden
    className="mr-[0.45em] size-1.5 self-center rounded-full bg-current motion-safe:[animation:dotPulse_2.4s_ease-in-out_infinite]"
  />
)
