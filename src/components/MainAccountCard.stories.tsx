import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { Account } from '@/types'
import { MainAccountCard } from './MainAccountCard'

const account: Account = {
  type: 'saving-account',
  amount: 62000,
  currency: 'THB',
  accountNumber: '568-2-81740-9',
  issuer: 'TestLab',
  color: '#24c875',
  isMainAccount: true,
}

const meta = {
  title: 'Main/MainAccountCard',
  component: MainAccountCard,
  parameters: { frame: 'card' },
  args: { account, isMenuOpen: false, onToggleMenu: fn(), onCopyAccountNumber: fn() },
} satisfies Meta<typeof MainAccountCard>

export default meta
type Story = StoryObj<typeof meta>

export const Savings: Story = {}

/** The card and its action bar both take the payload's colour, not the stylesheet's. */
export const PromotedGoalAccount: Story = {
  args: {
    account: { ...account, type: 'goal-saving-account', name: 'Travel New York', color: '#00a1e2' },
  },
}

export const WithMenuOpen: Story = { args: { isMenuOpen: true } }

/** The hint shown once per browser, pointing at the action menu. */
export const WithCoachMark: Story = { args: { showCoachMark: true } }

export const OpensItsMenu: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'More Action' }))
    await expect(args.onToggleMenu).toHaveBeenCalled()
  },
}
