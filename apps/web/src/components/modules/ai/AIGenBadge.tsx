'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { ComponentPropsWithRef, FC, ReactElement, ReactNode } from 'react'

import { FloatPopover } from '~/components/ui/float-popover'
import { clsxm } from '~/lib/helper'

import { metaFieldLabelClassName } from '../shared/MetaField'
import type { AiGenValue, AiGenValueOrArray } from './ai-gen'
import { getAiGenDescription, getAiGenLabel, isAiGenPreset } from './ai-gen'

type TriggerProps = {
  fieldLabel: string
  label: string
} & ComponentPropsWithRef<'span'>

const Trigger: FC<TriggerProps> = ({
  fieldLabel,
  label,
  className,
  ...rest
}) => (
  <span
    data-hide-print
    {...rest}
    className={clsxm(
      'inline-flex min-w-0 items-baseline whitespace-nowrap',
      className,
    )}
  >
    <span className={metaFieldLabelClassName()}>{fieldLabel}</span>
    <span className="max-w-64 truncate">{label}</span>
  </span>
)

const withTooltip = (trigger: ReactElement, content: ReactNode) => (
  <FloatPopover asChild mobileAsSheet triggerElement={trigger} type="tooltip">
    {content}
  </FloatPopover>
)

const SingleBadge: FC<{
  value: AiGenValueOrArray
  className?: string
}> = ({ value, className }) => {
  const t = useTranslations('ai')

  if (!isAiGenPreset(value)) {
    return (
      <Trigger
        className={className}
        fieldLabel={t('field_label_ai')}
        label={String(value)}
      />
    )
  }

  const trigger = (
    <Trigger
      className={className}
      label={getAiGenLabel(t, value)}
      fieldLabel={
        value === -1 ? t('field_label_handmade') : t('field_label_ai')
      }
    />
  )
  return withTooltip(trigger, getAiGenDescription(t, value))
}

const MultiBadge: FC<{
  values: AiGenValue[]
  className?: string
}> = ({ values, className }) => {
  const t = useTranslations('ai')
  const locale = useLocale()
  const items = values.map((v) => ({
    value: v,
    label: isAiGenPreset(v) ? getAiGenLabel(t, v) : String(v),
    description: isAiGenPreset(v) ? getAiGenDescription(t, v) : null,
  }))

  if (items.length === 0) return null

  const trigger = (
    <Trigger
      className={className}
      fieldLabel={t('field_label_ai')}
      label={new Intl.ListFormat(locale, {
        style: 'long',
        type: 'conjunction',
      }).format(new Set(items.map((item) => item.label)))}
    />
  )

  const content = (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div className="flex flex-col gap-1" key={item.value}>
          <span className="font-medium">{item.label}</span>
          {item.description && (
            <span className="text-copy-13 opacity-80">{item.description}</span>
          )}
        </div>
      ))}
    </div>
  )

  return withTooltip(trigger, content)
}

export const AIGenBadge: FC<{
  value?: AiGenValueOrArray | AiGenValueOrArray[]
  className?: string
}> = ({ value, className }) => {
  if (value === undefined || value === null) return null

  // Flatten and normalize the value to an array of AiGenValue
  const normalizeToArray = (
    val: AiGenValueOrArray | AiGenValueOrArray[],
  ): AiGenValue[] => {
    if (Array.isArray(val)) {
      return val.flatMap((v) => (Array.isArray(v) ? v : [v]))
    }
    return [val]
  }

  const normalized = normalizeToArray(value)

  if (normalized.length === 0) return null

  // Merge into single badge when 2+ items
  if (normalized.length >= 2) {
    return <MultiBadge className={className} values={normalized} />
  }

  return (
    <span className="inline-flex gap-1">
      {normalized.map((v) => (
        <SingleBadge className={className} key={v} value={v} />
      ))}
    </span>
  )
}
