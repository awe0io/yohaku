import { NextIntlClientProvider } from 'next-intl'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import activityZh from '~/messages/zh/activity.json'
import commonZh from '~/messages/zh/common.json'

import { CurrentReadingCountingMetaBarItem } from './MetaBar'

const room = vi.hoisted(() => ({ count: 0 }))

vi.mock('~/atoms/hooks/activity', () => ({
  useCurrentRoomCount: () => room.count,
}))
vi.mock('../activity', () => ({
  useMaybeInRoomContext: () => ({ roomName: 'article-1' }),
}))

const render = (count: number) => {
  room.count = count
  return renderToStaticMarkup(
    <NextIntlClientProvider
      locale="zh"
      messages={{ common: commonZh, activity: activityZh }}
      timeZone="UTC"
    >
      <CurrentReadingCountingMetaBarItem />
    </NextIntlClientProvider>,
  )
}

describe('CurrentReadingCountingMetaBarItem', () => {
  it('reads as a labelled live field instead of an eye icon', () => {
    const html = render(24)
    expect(html).not.toContain('i-mingcute-eye')
    expect(html.indexOf(commonZh.meta_label_reading_now)).toBeLessThan(
      html.lastIndexOf('24'),
    )
  })

  it('stays out of the colophon while the reader is alone', () => {
    expect(render(1)).toBe('')
  })
})
