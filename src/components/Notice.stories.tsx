import type { Meta, StoryObj } from '@storybook/react-vite'
import { Notice } from './Notice'

const meta = {
  title: 'Common/Notice',
  component: Notice,
  parameters: { frame: 'card' },
} satisfies Meta<typeof Notice>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing could be loaded, so the whole screen says why. */
export const LoadFailed: Story = {
  args: {
    message: 'No connection. Check your network and try again.',
    actionLabel: 'Try again',
    onAction: () => {},
  },
}

/** One section failed while the rest of the screen arrived. */
export const SectionFailed: Story = {
  args: {
    variant: 'inline',
    message: 'The server is having trouble. Please try again.',
    actionLabel: 'Reload',
    onAction: () => {},
  },
}

/** An empty list is not a failure, so it offers no retry. */
export const Empty: Story = { args: { message: 'You have no accounts yet.' } }
