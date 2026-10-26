import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Notice } from '@/components/Notice'
import { t } from '@/i18n'

interface Props {
  children: ReactNode
}

interface State {
  failed: boolean
}

/**
 * The last line of defence. Without it a throw during render unmounts the whole
 * tree and leaves an empty `#root` — a blank white page, which is worse than any
 * message. React offers no hook for this, so it has to be a class.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="wrap">
          <Notice
            message={t('error.boundary')}
            actionLabel={t('common.reload')}
            onAction={() => window.location.reload()}
          />
        </div>
      )
    }
    return this.props.children
  }
}
