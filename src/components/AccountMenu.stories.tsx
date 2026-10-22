import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { AccountMenu } from './AccountMenu'

const meta = {
  title: 'Main/AccountMenu',
  component: AccountMenu,
  parameters: { frame: 'card' },
  args: { isOpen: true, onCopyAccountNumber: fn() },
  decorators: [
    Story => (
      <div className="main-acc is-small" style={{ backgroundColor: '#15bbc7', minHeight: 220 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountMenu>

export default meta
type Story = StoryObj<typeof meta>

/** On the main card there is nothing to promote, so that entry is absent. */
export const OnMainAccount: Story = {}

export const OnSecondaryAccount: Story = {
  args: { variant: 'sub', onSetMainAccount: fn() },
}

export const Closed: Story = { args: { isOpen: false } }

export const CopiesTheAccountNumber: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Copy account number' }))
    await expect(args.onCopyAccountNumber).toHaveBeenCalled()

    // Listed because the template lists it, but inert: the resources include no
    // form or endpoint for it.
    await expect(canvas.getByRole('button', { name: 'Edit Name and Color' })).toBeDisabled()
  },
}
