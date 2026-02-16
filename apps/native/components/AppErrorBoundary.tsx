import React, { Component, type ReactNode } from 'react';
import { ErrorScreen } from './ErrorScreen';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for render-time errors.
 * Catches thrown errors in child components and shows ErrorScreen.
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorScreen
          title="Something went wrong"
          message={this.state.error.message}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}
