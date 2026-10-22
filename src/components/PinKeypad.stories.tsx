import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { PinKeypad } from './PinKeypad'

const meta = {
  title: 'PIN/PinKeypad',
  component: PinKeypad,
  parameters: { frame: 'pin' },
  args: { onDigit: fn(), onDelete: fn() },
} satisfies Meta<typeof PinKeypad>

export default meta
type Story = StoryObj<typeof meta>

/** Press a key, or type a digit — both flash the same highlight. */
export const Interactive: Story = {}

/** Reports the digit that was pressed, and marks that key as pressed. */
export const ReportsAPress: Story = {
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement)
    const seven = canvas.getByRole('button', { name: '7' })

    await step('press 7', async () => {
      await userEvent.click(seven)
      await expect(args.onDigit).toHaveBeenCalledWith('7')
      // th-bank.css ships the highlight at opacity 0 with no :active rule, so
      // the class is the only evidence a press was acknowledged.
      await expect(seven).toHaveClass('pin__key is-pressed')
    })

    await step('press delete', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Delete' }))
      await expect(args.onDelete).toHaveBeenCalled()
    })
  },
}

/** How the keypad looks once the attempts are spent — and that it stays silent. */
export const Locked: Story = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '1' }))
    await expect(args.onDigit).not.toHaveBeenCalled()
  },
}
