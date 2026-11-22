'use client'

import type { FC } from 'react'
import { useTransition } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { clsxm } from '~/lib/helper'

interface LanguageOption {
  code: string
  isOriginal?: boolean
  label: string
}

interface LanguageSelectorProps {
  currentLanguage: string
  displayedLanguage?: string
  languages: LanguageOption[]
  onLanguageChange: (lang: string) => void
  originalLabel?: string
  showIcon?: boolean
  triggerClassName?: string
  variant?: 'button' | 'inline'
}

export const LanguageSelector: FC<LanguageSelectorProps> = ({
  languages,
  currentLanguage,
  displayedLanguage,
  onLanguageChange,
  originalLabel,
  triggerClassName,
  showIcon = true,
  variant = 'button',
}) => {
  const [isPending, startTransition] = useTransition()

  const visualLanguage = displayedLanguage ?? currentLanguage
  const currentLabel =
    languages.find((l) => l.code === visualLanguage)?.label || visualLanguage

  const handleSelect = (lang: string) => {
    if (lang === currentLanguage || lang === visualLanguage) return
    startTransition(() => {
      onLanguageChange(lang)
    })
  }

  if (languages.length <= 1) {
    return null
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isPending}
          type="button"
          className={clsxm(
            variant === 'inline'
              ? 'inline-flex items-baseline gap-[0.2em] transition-colors hover:text-accent data-[popup-open]:text-accent'
              : 'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-copy-13 transition-colors hover:bg-neutral-2 data-[popup-open]:bg-neutral-2',
            isPending && 'opacity-50',
            triggerClassName,
          )}
        >
          {showIcon && variant === 'button' && (
            <i className="i-mingcute-translate-2-fill" />
          )}
          <span>{currentLabel}</span>
          <i
            className={clsxm(
              'i-mingcute-down-line opacity-50',
              variant === 'inline'
                ? 'self-center text-caption-10'
                : 'text-label-12',
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {languages.map((lang) => {
          const isCurrent = lang.code === visualLanguage

          return (
            <DropdownMenuItem
              className={isCurrent ? 'bg-neutral-2/80' : ''}
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {lang.label}
                  {lang.isOriginal && originalLabel && (
                    <span className="rounded bg-neutral-3 px-1 py-0.5 text-label-12">
                      {originalLabel}
                    </span>
                  )}
                </span>
                {isCurrent && (
                  <i className="i-mingcute-check-line text-accent" />
                )}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
