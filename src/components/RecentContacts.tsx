import type { RecentTransaction } from '@/types'
import { Avatar } from './Avatar'

interface RecentContactsProps {
  contacts: RecentTransaction[]
}

/** The row of recent payees. Nothing to show means the row is left out entirely. */
export function RecentContacts({ contacts }: RecentContactsProps) {
  if (contacts.length === 0) return null

  return (
    <div className="rctly__wrap main-loading main-loading--order5">
      <ul className="rctly__lst">
        {contacts.map((contact, index) => (
          <li className="rctly__item" key={`${contact.name}-${index}`}>
            <a href="#" className="rctly__link">
              <Avatar
                src={contact.image}
                alt=""
                className={contact.isBank ? 'rctly__thumb is-bank' : 'rctly__thumb'}
                variant={contact.isBank ? 'bank' : 'person'}
              />
              <span className="rctly__name">{contact.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
