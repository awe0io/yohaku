'use client'

import type { PostModel } from '@mx-space/api-client'
import { useTranslations } from 'next-intl'
import { Fragment, useMemo } from 'react'

import { MotionButtonBase } from '~/components/ui/button'
import { FloatPopover } from '~/components/ui/float-popover'
import { useModalStack } from '~/components/ui/modal'
import { NumberSmoothTransition } from '~/components/ui/number-transition/NumberSmoothTransition'
import { RelativeTime } from '~/components/ui/relative-time'
import { useIsClient } from '~/hooks/common/use-is-client'
import { useRouter } from '~/i18n/navigation'
import { createTagLabeler, type TagGlossaryPair } from '~/lib/api/tag-glossary'
import { clsxm } from '~/lib/helper'
import { routeBuilder, Routes } from '~/lib/route-builder'

import { MetaField } from '../shared/MetaField'
import { TagDetailModal } from './fab/PostTagsFAB'

export const PostMetaBar: Component<{
  meta: Partial<
    Pick<
      PostModel,
      | 'createdAt'
      | 'modifiedAt'
      | 'category'
      | 'tags'
      | 'readCount'
      | 'likeCount'
    >
  >
  tagGlossary?: TagGlossaryPair[]
}> = ({ className, meta, tagGlossary, children }) => {
  const t = useTranslations('common')
  const labelTag = useMemo(() => createTagLabeler(tagGlossary), [tagGlossary])
  const { present } = useModalStack()
  const router = useRouter()
  const isClient = useIsClient()
  return (
    <div
      className={clsxm(
        'flex min-w-0 shrink grow flex-wrap items-baseline gap-x-[1.2em] gap-y-1 text-label-12 text-neutral-7',
        className,
      )}
    >
      {!!meta.createdAt && (
        <MetaField label={t('meta_label_published')}>
          {isClient && meta.modifiedAt ? (
            <FloatPopover
              mobileAsSheet
              as="span"
              triggerElement={<RelativeTime date={meta.createdAt} />}
              type="tooltip"
            >
              {t('edited_at')} <RelativeTime date={meta.modifiedAt} />
            </FloatPopover>
          ) : (
            <RelativeTime date={meta.createdAt} />
          )}
        </MetaField>
      )}

      {meta.modifiedAt ? (
        <MetaField className="max-md:hidden" label={t('meta_label_revised')}>
          <RelativeTime date={meta.modifiedAt} />
        </MetaField>
      ) : null}

      {!!meta.category && (
        <MetaField
          className="max-md:order-first max-md:basis-full max-md:justify-center"
          label={t('meta_label_category')}
        >
          <span className="min-w-0 truncate">
            <MotionButtonBase
              className="yohaku-link--underline font-normal text-accent"
              onClick={() =>
                !!meta.category &&
                router.push(
                  routeBuilder(Routes.Category, {
                    slug: meta.category.slug,
                  }),
                )
              }
            >
              {meta.category.name}
            </MotionButtonBase>

            {meta.tags?.length ? (
              <>
                {' / '}
                {meta.tags.map((tag, index) => {
                  const isLast = index === meta.tags!.length - 1
                  const label = labelTag(tag)
                  return (
                    <Fragment key={tag}>
                      <button
                        className="yohaku-link--underline"
                        onClick={() =>
                          present({
                            content: () => <TagDetailModal name={tag} />,
                            clickOutsideToDismiss: true,
                            title: `Tag: ${label}`,
                          })
                        }
                      >
                        {label}
                      </button>
                      {!isLast && ', '}
                    </Fragment>
                  )
                })}
              </>
            ) : null}
          </span>
        </MetaField>
      )}

      {!!meta.readCount && (
        <MetaField label={t('meta_label_reads')}>
          <NumberSmoothTransition>{meta.readCount}</NumberSmoothTransition>
        </MetaField>
      )}

      {!!meta.likeCount && (
        <MetaField label={t('meta_label_likes')}>
          <NumberSmoothTransition>{meta.likeCount}</NumberSmoothTransition>
        </MetaField>
      )}

      {children}
    </div>
  )
}
