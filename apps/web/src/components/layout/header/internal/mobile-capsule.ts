export type CapsuleOverlay = 'expanded' | 'lang' | 'menu' | 'none' | 'tts'
export type CapsuleVisualState =
  'dot' | 'expanded' | 'idle' | 'lang' | 'menu' | 'narrating' | 'ticket'

export const COLLAPSE_SCROLL_THRESHOLD = 160
export const COLLAPSE_SCROLL_DISTANCE = 48
export const RESTORE_SCROLL_DISTANCE = 64

export interface CapsuleScrollState {
  anchorY: number
  collapsed: boolean
  lastY: number
}

export const resolveCapsuleState = ({
  collapsed,
  hasLive,
  isNarrating = false,
  overlay,
}: {
  collapsed: boolean
  hasLive: boolean
  isNarrating?: boolean
  overlay: CapsuleOverlay
}): CapsuleVisualState => {
  const effectiveOverlay = overlay === 'expanded' && !hasLive ? 'none' : overlay
  if (effectiveOverlay === 'menu') return 'menu'
  if (effectiveOverlay === 'lang') return 'lang'
  if (effectiveOverlay === 'expanded') return 'expanded'
  if (effectiveOverlay === 'tts') return 'narrating'
  if (collapsed) return 'dot'
  if (isNarrating) return 'narrating'
  return hasLive ? 'ticket' : 'idle'
}

export const toggleMenuOverlay = (overlay: CapsuleOverlay): CapsuleOverlay =>
  overlay === 'none' ? 'menu' : 'none'

export const overlayOnPrimaryTap = (
  overlay: CapsuleOverlay,
  hasLive: boolean,
  isNarrating = false,
): CapsuleOverlay => {
  if (overlay !== 'none') return 'none'
  if (isNarrating) return 'tts'
  return hasLive ? 'expanded' : 'menu'
}

export const stepCapsuleScroll = (
  state: CapsuleScrollState,
  y: number,
): CapsuleScrollState => {
  if (y <= COLLAPSE_SCROLL_THRESHOLD) {
    return { anchorY: y, collapsed: false, lastY: y }
  }
  const reversed = (y - state.lastY) * (state.lastY - state.anchorY) < 0
  const anchorY = reversed ? state.lastY : state.anchorY
  const distance = y - anchorY
  if (!state.collapsed && distance > COLLAPSE_SCROLL_DISTANCE) {
    return { anchorY: y, collapsed: true, lastY: y }
  }
  if (state.collapsed && distance < -RESTORE_SCROLL_DISTANCE) {
    return { anchorY: y, collapsed: false, lastY: y }
  }
  return { anchorY, collapsed: state.collapsed, lastY: y }
}
