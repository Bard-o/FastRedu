import { Component, type ReactNode, type ErrorInfo } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className={styles.fallback} role="alert">
          <IconAlertTriangle className={styles.fallbackIcon} />
          <div className={styles.fallbackTitle}>
            {this.props.fallbackTitle ?? 'Something went wrong'}
          </div>
          <div className={styles.fallbackMessage}>
            {this.props.fallbackMessage ??
              'An unexpected error occurred. Try refreshing the page.'}
          </div>
          <button className={styles.fallbackRetry} onClick={this.handleRetry}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}