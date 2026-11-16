import { bgmEngine } from '~/components/layout/bgm/engine'

import { KEEP_ATTR } from './capture'

const OVERLAYS =
  '[role="dialog"], [role="alertdialog"], [aria-modal="true"], [data-search-panel]'

const isShown = (el: Element) => {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

export const isOverlayOpen = () =>
  [...document.querySelectorAll(OVERLAYS)].some(
    (el) => !el.closest(`[${KEEP_ATTR}]`) && isShown(el),
  )

const EDITABLE = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'IFRAME'])

export const isFocusBusy = (
  active: { isContentEditable?: boolean; tagName: string } | null,
) => !!active && (EDITABLE.has(active.tagName) || !!active.isContentEditable)

export const swallowExitKey = (
  e: { preventDefault: () => void; stopPropagation: () => void },
  leave: () => void,
) => {
  e.preventDefault()
  e.stopPropagation()
  leave()
}

export const keepScroll = (
  win: {
    scrollTo: (x: number, y: number) => void
    scrollX: number
    scrollY: number
  },
  swap: () => void,
) => {
  const { scrollX, scrollY } = win
  swap()
  if (win.scrollX !== scrollX || win.scrollY !== scrollY)
    win.scrollTo(scrollX, scrollY)
}

export const rememberFocus = (doc: { activeElement: Element | null }) => {
  const active = doc.activeElement as HTMLElement | null
  return () => active?.focus?.({ preventScroll: true })
}

export const isMediaPlaying = () =>
  bgmEngine.getState().enabled ||
  [...document.querySelectorAll('audio, video')].some(
    (m) => !(m as HTMLMediaElement).paused,
  )
