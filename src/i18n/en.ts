/**
 * The source of truth for message keys. One key per complete sentence or line:
 * variable parts are `{name}` placeholders, never pieces joined in code, so a
 * translation can put them where its own word order needs them.
 */
export const en = {
  'common.tryAgain': 'Try again',
  'common.reload': 'Reload',
  'common.loading': 'Loading',

  'error.boundary': 'Something went wrong. Please reload the app.',
  'error.generic': 'Something went wrong. Please try again.',
  'error.notAvailable': 'This service is not available yet.',
  'error.server': 'The server is having trouble. Please try again.',
  'error.loadFailed': 'We could not load your data. Please try again.',
  'error.offline': 'No connection. Check your network and try again.',
  'error.timeout': 'The server took too long to answer. Please try again.',

  'pin.locked.title': 'Your PIN is locked.',
  'pin.locked.detail': 'Please contact our call centre to unlock it.',
  'pin.cooldown.title': 'Too many incorrect attempts.',
  'pin.cooldown.detail': 'Try again in {time}.',
  'pin.invalid.title': 'Invalid PIN Code.',
  'pin.attemptsLeft.one': 'You have {count} attempt left.',
  'pin.attemptsLeft.other': 'You have {count} attempts left.',
  'pin.verifyFailed.title': 'We could not check your PIN.',
  'pin.verifyFailed.detail': 'Please try again.',
  'pin.loginWithPassword': 'Login with ID / Password',
  'pin.poweredBy': 'Powered by TestLab',
  'pin.delete': 'Delete',
  'pin.dotsLabel': '{filled} of {total} digits entered',

  'main.loadingAccounts': 'Loading your accounts',
  'main.noAccounts': 'You have no accounts yet.',
  'main.seeAll': 'See all',
  'main.totalBalance': 'Total Balance',
  'main.menu': 'Menu',
  'main.cancel': 'Cancel',
  'main.copied': 'Account number copied',
  'main.copyFailed': 'Could not copy the account number',
  // Wording and typo are the template's own (bank_main.html).
  'main.coachMark': 'Change your main account for\nUsing transfer, Wallet more easliy',

  'account.title.saving-account': 'Saving Account',
  'account.title.credit-loan': 'Credit Loan',
  'account.title.goal-saving-account': 'Goal Saving Account',
  'account.product.saving-account': 'Smart account',
  'account.product.credit-loan': 'Credit Loan',
  'account.product.goal-saving-account': 'Goal driven savings',
  'account.numberLine': '{product} {number}',
  'account.poweredBy': 'Powered by {issuer}',
  'account.moreActionFor': 'More Action for {account}',
  'account.withdrawal': 'Withdrawal',
  'account.qrScan': 'QR scan',
  'account.addMoney': 'Add money',
  'account.disburse': 'Disburse',
  'account.pay': 'Pay',
  'account.setMain': 'Set main account',
  'account.copyNumber': 'Copy account number',
  'account.editNameColor': 'Edit Name and Color',

  'card.issuedBy': 'Issued by {issuer}',
} as const
