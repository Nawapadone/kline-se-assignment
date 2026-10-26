import { env } from '@/config/env'
import { en } from './en'
import { th } from './th'

export type Locale = 'en' | 'th'
export type MessageKey = keyof typeof en
export type MessageParams = Record<string, string | number>

const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = { en, th }

/**
 * A placeholder with no matching param stays as `{name}`, and an unknown key
 * renders as the key itself: visible, not a crash.
 */
export function createT(locale: Locale) {
  const messages = DICTIONARIES[locale]
  return (key: MessageKey, params?: MessageParams): string =>
    (messages[key] ?? key).replace(/\{(\w+)\}/g, (match, name: string) =>
      params && Object.hasOwn(params, name) ? String(params[name]) : match,
    )
}

/**
 * Bound once: the locale is fixed per build, so there is nothing to re-render
 * and plain modules (lib/, the store) can translate as freely as components.
 */
export const t = createT(env.locale)
