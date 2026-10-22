import type { Meta, StoryObj } from '@storybook/react-vite'
import { PIN_LENGTH } from '@/lib/pin'
import { PinDots } from './PinDots'

const meta = {
  title: 'PIN/PinDots',
  component: PinDots,
  parameters: { frame: 'pin' },
  argTypes: { filled: { control: { type: 'range', min: 0, max: PIN_LENGTH } } },
} satisfies Meta<typeof PinDots>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = { args: { filled: 0 } }

/** The state design.jpg shows: two digits entered. */
export const PartiallyEntered: Story = { args: { filled: 2 } }

export const Complete: Story = { args: { filled: PIN_LENGTH } }
