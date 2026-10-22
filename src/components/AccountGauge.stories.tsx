import type { Meta, StoryObj } from '@storybook/react-vite'
import { AccountGauge } from './AccountGauge'

const meta = {
  title: 'Main/AccountGauge',
  component: AccountGauge,
  parameters: { frame: 'card' },
  argTypes: { progress: { control: { type: 'range', min: 0, max: 100 } } },
  decorators: [
    Story => (
      <div className="main-acc is-small" style={{ backgroundColor: '#00a1e2' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountGauge>

export default meta
type Story = StoryObj<typeof meta>

/** The value the design shows. */
export const Quarter: Story = { args: { progress: 24 } }

export const Empty: Story = { args: { progress: 0 } }

export const Complete: Story = { args: { progress: 100 } }

/** Out-of-range values are clamped rather than drawn past the ring. */
export const OutOfRange: Story = { args: { progress: 140 } }
