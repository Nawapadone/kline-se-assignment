import { t } from '@/i18n'

interface AccountMenuProps {
  isOpen: boolean
  /** Absent on the account that is already main — there is nothing to promote. */
  onSetMainAccount?: () => void
  onCopyAccountNumber: () => void
  /** `tooltip--sub-acc` positions the menu for the smaller cards. */
  variant?: 'main' | 'sub'
}

/**
 * The "More Action" menu from bank_main.html. "Edit Name and Color" is rendered
 * because the template lists it, but stays inert: the resources include no form
 * or colour picker for it, and no endpoint accepts the change.
 */
export function AccountMenu({
  isOpen,
  onSetMainAccount,
  onCopyAccountNumber,
  variant = 'main',
}: AccountMenuProps) {
  const className = variant === 'sub' ? 'tooltip tooltip--sub-acc' : 'tooltip'

  return (
    <div className={className} style={{ display: isOpen ? 'block' : 'none' }}>
      {onSetMainAccount && (
        <button type="button" className="tooltip__btn-more" onClick={onSetMainAccount}>
          {t('account.setMain')}
        </button>
      )}
      <button type="button" className="tooltip__btn-more" onClick={onCopyAccountNumber}>
        {t('account.copyNumber')}
      </button>
      <button type="button" className="tooltip__btn-more" disabled>
        {t('account.editNameColor')}
      </button>
    </div>
  )
}
