import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: '@storybook/react-vite',
  // Nothing about this review project needs to be reported anywhere.
  core: { disableTelemetry: true },
  // The play functions assert English names, so a local `.env` must not switch the locale.
  viteFinal: config => ({
    ...config,
    define: { ...config.define, 'import.meta.env.VITE_LOCALE': JSON.stringify('en') },
  }),
}

export default config
