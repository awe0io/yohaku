'use client'

import { useTranslations } from 'next-intl'
import type { FC } from 'react'

import { useCurrentRoomCount } from '~/atoms/hooks/activity'
import { FloatPopover } from '~/components/ui/float-popover'
import { clsxm } from '~/lib/helper'

import { useMaybeInRoomContext } from '../activity'
import { LivePulseDot, metaFieldLabelClassName } from './MetaField'

export const CurrentReadingCountingMetaBarItem: FC<{
  className?: string
}> = ({ className }) => {
  const t = useTranslations('activity')
  const tCommon = useTranslations('common')
  const roomCtx = useMaybeInRoomContext()
  const count = useCurrentRoomCount(roomCtx?.roomName || '')

  if (!roomCtx || count <= 1) return null

  const displayLabel = `${t('current_readers')}${count}${t('reading_now')}`

  return (
    <FloatPopover
      asChild
      mobileAsSheet
      type="tooltip"
      triggerElement={
        <span
          aria-label={displayLabel}
          className={clsxm(
            'inline-flex items-baseline whitespace-nowrap text-accent tabular-nums',
            className,
          )}
        >
          <LivePulseDot />
          <span className={metaFieldLabelClassName('text-current opacity-80')}>
            {tCommon('meta_label_reading_now')}
          </span>
          {count}
        </span>
      }
    >
      {displayLabel}
    </FloatPopover>
  )
}
