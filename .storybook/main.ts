import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: '@storybook/react-vite',
  // Nothing about this review project needs to be reported anywhere.
  core: { disableTelemetry: true },
}

export default config
