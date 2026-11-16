import { describe, expect, it, vi } from 'vitest'

import { isFocusBusy, keepScroll, rememberFocus, swallowExitKey } from './dom'

vi.mock('~/components/layout/bgm/engine', () => ({
  bgmEngine: { getState: () => ({ enabled: false }) },
}))

describe('page state around the egg', () => {
  it('leaves the page where the reader scrolled it while the egg faded', () => {
    const scrollTo = vi.fn()
    const win = { scrollX: 0, scrollY: 1400, scrollTo }
    const swap = vi.fn()
    keepScroll(win, swap)
    expect(swap).toHaveBeenCalledTimes(1)
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('undoes a jump caused by handing the page back to the document', () => {
    const scrollTo = vi.fn()
    const win = { scrollX: 0, scrollY: 1400, scrollTo }
    keepScroll(win, () => {
      win.scrollY = 0
    })
    expect(scrollTo).toHaveBeenCalledWith(0, 1400)
  })

  it('gives focus back without scrolling to it', () => {
    const focus = vi.fn()
    const restore = rememberFocus({
      activeElement: { focus } as unknown as Element,
    })
    expect(focus).not.toHaveBeenCalled()
    restore()
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('swallows the exit key so it cannot scroll the hidden page', () => {
    const e = { preventDefault: vi.fn(), stopPropagation: vi.fn() }
    const leave = vi.fn()
    swallowExitKey(e, leave)
    expect(e.preventDefault).toHaveBeenCalled()
    expect(e.stopPropagation).toHaveBeenCalled()
    expect(leave).toHaveBeenCalled()
  })

  it('treats a focused embed or text field as busy', () => {
    expect(isFocusBusy({ tagName: 'IFRAME' })).toBe(true)
    expect(isFocusBusy({ tagName: 'TEXTAREA' })).toBe(true)
    expect(isFocusBusy({ tagName: 'DIV', isContentEditable: true })).toBe(true)
    expect(isFocusBusy({ tagName: 'BODY' })).toBe(false)
    expect(isFocusBusy(null)).toBe(false)
  })
})
