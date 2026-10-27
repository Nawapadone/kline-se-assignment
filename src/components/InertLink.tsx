import type { ComponentProps } from 'react'

/**
 * A template link with no destination yet: it keeps the template's markup and
 * CSS, tells assistive tech it does nothing, and does not jump to the top.
 */
export function InertLink(props: Omit<ComponentProps<'a'>, 'href' | 'onClick' | 'aria-disabled'>) {
  return <a {...props} href="#" aria-disabled="true" onClick={event => event.preventDefault()} />
}
