interface ImageSource {
  crossOrigin: string | null
  currentSrc: string
}

export const isUndrawableImage = (img: ImageSource, pageOrigin: string) => {
  const src = img.currentSrc
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return false
  if (img.crossOrigin) return false
  try {
    return new URL(src, pageOrigin).origin !== pageOrigin
  } catch {
    return false
  }
}

const CORS_WAIT_MS = 1500

interface UpgradableImage extends ImageSource {
  decode: () => Promise<void>
}

const within = <T>(p: Promise<T>, ms: number, fallback: T) =>
  Promise.race([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])

export const probeCors = (url: string) =>
  within(
    new Promise<boolean>((resolve) => {
      const probe = new Image()
      probe.crossOrigin = 'anonymous'
      probe.onload = () => resolve(true)
      probe.onerror = () => resolve(false)
      probe.src = url
    }),
    CORS_WAIT_MS,
    false,
  )

export const upgradeToCors = async (
  images: UpgradableImage[],
  pageOrigin: string,
  probe: (url: string) => Promise<boolean>,
) => {
  await Promise.all(
    images
      .filter((img) => isUndrawableImage(img, pageOrigin))
      .map(async (img) => {
        if (!(await probe(img.currentSrc))) return
        img.crossOrigin = 'anonymous'
        await within(
          img.decode().catch(() => {}),
          CORS_WAIT_MS,
          undefined,
        )
      }),
  )
}

const inViewport = (r: DOMRect) =>
  r.width > 0 &&
  r.height > 0 &&
  r.bottom > 0 &&
  r.top < window.innerHeight &&
  r.right > 0 &&
  r.left < window.innerWidth

interface ClipStyle {
  borderRadius: string
  clipPath: string
  maskImage: string
  maskPosition: string
  maskRepeat: string
  maskSize: string
  overflow: string
}

interface ClipLink {
  rect: { height: number; width: number }
  style: ClipStyle
}

const MAX_CLIP_DEPTH = 4

export const clipOf = (chain: ClipLink[]) => {
  const [first] = chain
  if (!first) return ''
  for (const [i, { rect, style }] of chain.entries()) {
    if (
      Math.abs(rect.width - first.rect.width) > 1 ||
      Math.abs(rect.height - first.rect.height) > 1
    )
      break
    if (style.maskImage !== 'none')
      return `mask-image:${style.maskImage};mask-size:${style.maskSize};mask-position:${style.maskPosition};mask-repeat:${style.maskRepeat};`
    if (style.clipPath !== 'none') return `clip-path:${style.clipPath};`
    if (
      style.borderRadius !== '0px' &&
      (i === 0 || style.overflow !== 'visible')
    )
      return `border-radius:${style.borderRadius};`
  }
  return ''
}

const clipChain = (img: HTMLImageElement, scope: Element) => {
  const chain: ClipLink[] = []
  for (
    let el: Element | null = img;
    el && el !== scope && chain.length < MAX_CLIP_DEPTH;
    el = el.parentElement
  )
    chain.push({
      rect: el.getBoundingClientRect(),
      style: getComputedStyle(el),
    })
  return chain
}

export interface GhostSource {
  clip: string
  img: HTMLImageElement
  objectFit: string
  objectPosition: string
  rect: { height: number; left: number; top: number; width: number }
}

export interface ImageGhosts {
  add: (sources: GhostSource[]) => void
  readonly count: number
  remove: () => void
  setFade: (visible: number) => void
  setShift: (dy: number) => void
}

export const viewportImages = (scope: Element) =>
  [...scope.querySelectorAll('img')].filter((img) =>
    inViewport(img.getBoundingClientRect()),
  )

export const collectGhostSources = (
  scope: Element,
  images: HTMLImageElement[],
): GhostSource[] => {
  const page = scope.getBoundingClientRect()
  return images
    .filter((img) => isUndrawableImage(img, location.origin))
    .map((img) => ({ img, rect: img.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0 && rect.height > 0)
    .map(({ img, rect }) => {
      const cs = getComputedStyle(img)
      return {
        img,
        rect: {
          left: rect.left - page.left,
          top: rect.top - page.top,
          width: rect.width,
          height: rect.height,
        },
        objectFit: cs.objectFit,
        objectPosition: cs.objectPosition,
        clip: clipOf(clipChain(img, scope)),
      }
    })
}

export const ghostImages = (
  layer: HTMLElement,
  sources: GhostSource[],
): ImageGhosts => {
  const ghosts: HTMLImageElement[] = []
  let fade = 1
  let shift = 0
  const apply = (list: HTMLImageElement[]) => {
    for (const g of list) {
      g.style.opacity = String(fade)
      g.style.translate = `0 ${(1 - fade) * 6 + shift}px`
      g.style.scale = String(1 - (1 - fade) * 0.015)
    }
  }
  const add = (list: GhostSource[]) => {
    const added = list.map(({ img, rect, ...look }) => {
      const ghost = img.cloneNode() as HTMLImageElement
      ghost.removeAttribute('id')
      ghost.removeAttribute('loading')
      ghost.style.cssText = `position:absolute;margin:0;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;object-fit:${look.objectFit};object-position:${look.objectPosition};${look.clip}pointer-events:none;`
      layer.prepend(ghost)
      return ghost
    })
    apply(added)
    ghosts.push(...added)
  }
  add(sources)
  return {
    add,
    get count() {
      return ghosts.length
    },
    setFade: (visible) => {
      const v = Math.round(visible * 100) / 100
      if (v === fade) return
      fade = v
      apply(ghosts)
    },
    setShift: (dy) => {
      if (dy === shift) return
      shift = dy
      apply(ghosts)
    },
    remove: () => ghosts.forEach((g) => g.remove()),
  }
}
