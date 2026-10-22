import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from './Avatar'

const meta = {
  title: 'Common/Avatar',
  component: Avatar,
  parameters: { frame: 'card' },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Photo: Story = {
  args: { src: 'https://dummyimage.com/54x54/999/fff', className: 'rctly__thumb' },
}

/** What a broken or blocked image URL falls back to. */
export const PersonFallback: Story = {
  args: { src: 'https://example.invalid/missing.png', className: 'rctly__thumb' },
}

export const BankFallback: Story = {
  args: {
    src: 'https://example.invalid/missing.png',
    className: 'rctly__thumb is-bank',
    variant: 'bank',
  },
}
