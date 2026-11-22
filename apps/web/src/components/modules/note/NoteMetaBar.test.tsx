import { NextIntlClientProvider } from 'next-intl'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import activityZh from '~/messages/zh/activity.json'
import commonZh from '~/messages/zh/common.json'

import { MetaContextStream, MetaStats } from './NoteMetaBar'

vi.mock('~/i18n/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push() {}, replace() {} }),
}))

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale="zh"
      messages={{ common: commonZh, activity: activityZh }}
      timeZone="UTC"
    >
      {node}
    </NextIntlClientProvider>,
  )

describe('MetaStats', () => {
  it('labels each count instead of joining them with middle dots', () => {
    const html = render(
      <MetaStats likeCount={42} readCount={1203} realtime={3} />,
    )
    expect(html).not.toContain('·')
    expect(html).toContain(commonZh.meta_label_reads)
    expect(html).toContain(commonZh.meta_label_likes)
    expect(html.indexOf(commonZh.meta_label_reads)).toBeLessThan(
      html.indexOf('1,203'),
    )
  })
})

describe('MetaContextStream', () => {
  it('separates weather and mood without a middle dot', () => {
    const html = render(<MetaContextStream mood="平静" weather="晴" />)
    expect(html).not.toContain('·')
  })
})
