import type { Preview } from '@storybook/react-vite'
import '../src/styles/th-bank.css'
import '../src/styles/app.css'

/**
 * The provided stylesheet positions almost everything against `.wrap` and the
 * green `.container--pin-type`, so a bare canvas would show the components
 * unstyled or unreadable. Each story declares the ancestry it needs through the
 * `frame` parameter instead of repeating a wrapper.
 */
const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
  },
  decorators: [
    (Story, context) => {
      const frame = context.parameters.frame as 'pin' | 'card' | 'plain' | undefined
      if (frame === 'pin') {
        return (
          <div className="wrap" style={{ width: 375, height: 700 }}>
            <main className="container container--pin-type">
              <div className="pin">
                <Story />
              </div>
            </main>
          </div>
        )
      }
      if (frame === 'card') {
        return (
          <div className="wrap" style={{ width: 375 }}>
            <main className="container container--main">
              <div className="content_wrap">
                <Story />
              </div>
            </main>
          </div>
        )
      }
      return <Story />
    },
  ],
}

export default preview
