import { NextIntlClientProvider } from 'next-intl'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import commonZh from '~/messages/zh/common.json'

import { PostMetaBar } from './PostMetaBar'

vi.mock('~/i18n/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push() {}, replace() {} }),
}))

const render = () =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale="zh"
      messages={{ common: commonZh }}
      now={new Date('2026-11-21T00:00:00Z')}
      timeZone="UTC"
    >
      <PostMetaBar
        meta={{
          createdAt: '2026-11-18T00:00:00Z',
          modifiedAt: '2026-11-20T00:00:00Z',
          category: { name: '思考', slug: 'thinking' } as never,
          tags: ['AI'],
          readCount: 1203,
          likeCount: 42,
        }}
      />
    </NextIntlClientProvider>,
  )

describe('PostMetaBar', () => {
  it('separates fields with colophon labels instead of middle dots', () => {
    const html = render()
    expect(html).not.toContain('·')
    for (const label of [
      commonZh.meta_label_published,
      commonZh.meta_label_revised,
      commonZh.meta_label_category,
      commonZh.meta_label_reads,
      commonZh.meta_label_likes,
    ]) {
      expect(html).toContain(label)
    }
  })

  it('hides the revised field on narrow screens', () => {
    const html = render()
    const revisedAt = html.indexOf(commonZh.meta_label_revised)
    const openTag = html.lastIndexOf(
      '<span',
      html.lastIndexOf('<span', revisedAt) - 1,
    )
    expect(html.slice(openTag, revisedAt)).toContain('max-md:hidden')
  })

  it('puts the category on its own first line on narrow screens', () => {
    const html = render()
    const categoryAt = html.indexOf(commonZh.meta_label_category)
    const before = html.slice(0, categoryAt)
    const openTag = before.lastIndexOf('<span', before.lastIndexOf('<span') - 1)
    expect(html.slice(openTag, categoryAt)).toContain('max-md:order-first')
  })
})
