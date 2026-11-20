'use client'

import { useEffect, useState } from 'react'

import { PageBleed } from '~/components/common/PageBleed'

const ACCENTS = [
  { label: '默认', value: '' },
  { label: '浅葱', value: 'oklch(0.68 0.09 205)' },
  { label: '桃', value: 'oklch(0.75 0.12 15)' },
  { label: '苔', value: 'oklch(0.67 0.15 145)' },
  { label: '琥珀', value: 'oklch(0.75 0.14 75)' },
]

export default function PageBleedDevPage() {
  const [replay, setReplay] = useState(0)
  const [seed, setSeed] = useState(0.5)
  const [hue, setHue] = useState(200)
  const [accent, setAccent] = useState('')

  useEffect(() => {
    const root = document.documentElement
    if (accent) root.style.setProperty('--color-accent', accent)
    else root.style.removeProperty('--color-accent')
    return () => {
      root.style.removeProperty('--color-accent')
    }
  }, [accent])

  const reseed = () => {
    setSeed(Math.round(Math.random() * 1000) / 1000)
    setHue(Math.round(Math.random() * 360))
    setReplay((n) => n + 1)
  }

  return (
    <>
      <PageBleed hue={hue} key={`${replay}-${seed}`} seed={seed} />

      <div className="mx-auto max-w-3xl pt-[132px]">
        <header className="mb-10">
          <p className="mb-3 font-mono text-caption-10 uppercase tracking-[0.3em] text-neutral-6">
            ambient · page bleed
          </p>
          <h1 className="text-display-36 font-medium tracking-tight text-neutral-10">
            天头水晕
          </h1>
          <p className="mt-4 max-w-prose text-copy-14 leading-[1.8] text-neutral-7">
            源自版画「一文字ぼかし」：两层轻染水彩贴近天头顶缘浸入和纸，
            受楮皮纤维肌理与毛细水痕调制，在导航栏下方自然化开、不干扰顶栏文字。
            开页约 1.4s 完成浸染后彻底静止（零空转帧），形态由 seed 复算，
            油墨读 --color-accent，桌面与移动端统一渲染。
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-y border-neutral-3 py-4">
          <button
            className="rounded border border-neutral-4 px-3 py-1.5 font-mono text-label-12 text-neutral-8 transition-colors hover:border-accent hover:text-accent"
            type="button"
            onClick={() => setReplay((n) => n + 1)}
          >
            重播浸染
          </button>
          <button
            className="rounded border border-neutral-4 px-3 py-1.5 font-mono text-label-12 text-neutral-8 transition-colors hover:border-accent hover:text-accent"
            type="button"
            onClick={reseed}
          >
            换 seed
          </button>

          <span className="ml-2 font-mono text-caption-10 uppercase tracking-[0.2em] text-neutral-5">
            seed {seed.toFixed(3)} · hue {hue}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-3 py-4">
          <span className="mr-2 font-mono text-caption-10 uppercase tracking-[0.2em] text-neutral-5">
            accent
          </span>
          {ACCENTS.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`rounded border px-3 py-1.5 font-mono text-label-12 transition-colors ${
                accent === item.value
                  ? 'border-accent text-accent'
                  : 'border-neutral-4 text-neutral-8 hover:border-accent hover:text-accent'
              }`}
              onClick={() => {
                setAccent(item.value)
                setReplay((n) => n + 1)
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="py-8 text-copy-13 leading-[1.9] text-neutral-7">
          正文从这里开始。天头水晕不该抢走它的注意力——滚动时随页面一起走，
          浸染完成后自动停帧，prefers-reduced-motion 直接定格在稳态。
        </p>
      </div>
    </>
  )
}
