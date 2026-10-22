import type { Meta, StoryObj } from '@storybook/react-vite'
import { DebitCardItem } from './DebitCardItem'

const meta = {
  title: 'Main/DebitCardItem',
  component: DebitCardItem,
  parameters: { frame: 'card' },
} satisfies Meta<typeof DebitCardItem>

export default meta
type Story = StoryObj<typeof meta>

export const InProgress: Story = {
  args: { card: { name: 'My Salary', status: 'in-progress', issuer: 'TestLab', color: '#00a1e2' } },
}

/** An issued card shows its masked number in place of the status. */
export const Active: Story = {
  args: {
    card: {
      name: 'My Debit card',
      status: 'Active',
      issuer: 'TestLab',
      color: '#ffffff',
      borderColor: '#f2f3f7',
      number: '9440 7841 2222 3115',
    },
  },
}
