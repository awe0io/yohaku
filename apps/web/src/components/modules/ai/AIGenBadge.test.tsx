import { NextIntlClientProvider } from 'next-intl'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import aiZh from '~/messages/zh/ai.json'

import { AIGenBadge } from './AIGenBadge'

const render = (value: Parameters<typeof AIGenBadge>[0]['value']) =>
  renderToStaticMarkup(
    <NextIntlClientProvider locale="zh" messages={{ ai: aiZh }} timeZone="UTC">
      <AIGenBadge value={value} />
    </NextIntlClientProvider>,
  )

describe('AIGenBadge', () => {
  it('renders as a labelled meta field without icons or middle dots', () => {
    const html = render([0, 4, 9])
    expect(html).not.toContain('·')
    expect(html).not.toContain('i-mingcute')
    expect(html.indexOf(aiZh.field_label_ai)).toBeLessThan(
      html.indexOf(aiZh.preset_assist_label),
    )
    expect(html).toContain('辅助、标题和语音输入')
  })

  it('lists a merged legacy preset only once', () => {
    const html = render([9, 0, 4, 1])
    expect(html.split(aiZh.preset_assist_label)).toHaveLength(2)
  })

  it('labels handmade writing by its pen rather than AI', () => {
    const html = render(-1)
    expect(html).toContain(aiZh.field_label_handmade)
    expect(html).toContain(aiZh.preset_handmade_label)
  })
})
