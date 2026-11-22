import { useLocale, useTranslations } from 'next-intl'

import { MetaField } from '~/components/modules/shared/MetaField'
import { Link } from '~/i18n/navigation'
import { routeBuilder, Routes } from '~/lib/route-builder'

interface PinnedFeatureBlockProps {
  categorySlug: string
  post: {
    id: string
    title: string
    slug: string
    summary?: string | null
    createdAt: string
    readCount?: number
    likeCount?: number
  }
}

export const PinnedFeatureBlock = ({
  post,
  categorySlug,
}: PinnedFeatureBlockProps) => {
  const t = useTranslations('post')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const href = routeBuilder(Routes.Post, {
    category: categorySlug,
    slug: post.slug,
  })

  const dateFmt = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(post.createdAt))

  return (
    <section className="mb-6 border-b border-neutral-10/[0.06] pb-6">
      <div className="mb-1.5 text-caption-10 tracking-[2px] uppercase text-accent">
        {t('category_pinned_label')}
      </div>
      <Link className="group block" href={href} prefetch={false}>
        <h2 className="text-title-20 font-normal leading-snug text-neutral-10 transition-colors duration-200 group-hover:text-accent">
          {post.title}
        </h2>
        {post.summary ? (
          <p className="mt-2 line-clamp-2 text-label-12 leading-relaxed text-neutral-10/55">
            {post.summary}
          </p>
        ) : null}
        <div className="mt-2 flex items-baseline gap-x-[1.2em] text-label-12 text-neutral-7 tabular-nums">
          <MetaField label={tCommon('meta_label_published')}>
            {dateFmt}
          </MetaField>
          {post.readCount ? (
            <MetaField label={tCommon('meta_label_reads')}>
              {post.readCount.toLocaleString(locale)}
            </MetaField>
          ) : null}
        </div>
      </Link>
    </section>
  )
}
