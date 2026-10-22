import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Account } from '@/types'
import { SecondaryAccountCard } from './SecondaryAccountCard'

const base: Account = {
  type: 'saving-account',
  amount: 8837999,
  currency: 'THB',
  accountNumber: '568-2-81740-9',
  issuer: 'TestLab',
  color: '#15bbc7',
  isMainAccount: false,
}

const meta = {
  title: 'Main/SecondaryAccountCard',
  component: SecondaryAccountCard,
  parameters: { frame: 'card' },
  args: {
    isMenuOpen: false,
    onToggleMenu: () => {},
    onSetMainAccount: () => {},
    onCopyAccountNumber: () => {},
  },
} satisfies Meta<typeof SecondaryAccountCard>

export default meta
type Story = StoryObj<typeof meta>

export const Savings: Story = { args: { account: base } }

export const CreditLoan: Story = {
  args: { account: { ...base, type: 'credit-loan', amount: 300.1, color: '#f88355' } },
}

/** A goal account trades the action button for a progress ring. */
export const GoalWithProgress: Story = {
  args: {
    account: {
      ...base,
      type: 'goal-saving-account',
      name: 'Travel New York',
      amount: 30000,
      progress: 24,
      color: '#9366ed',
    },
  },
}

/** Flags turn a loan into a repayment, and "Disbursement" renders with a padlock. */
export const OverdueLoan: Story = {
  args: {
    account: {
      ...base,
      type: 'credit-loan',
      name: 'Need to repay',
      amount: 30000,
      flags: ['Disbursement', 'Overdue'],
      color: '#557bf2',
    },
  },
}

export const WithMenuOpen: Story = { args: { account: base, isMenuOpen: true } }
