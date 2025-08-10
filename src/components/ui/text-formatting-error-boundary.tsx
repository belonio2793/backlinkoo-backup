import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class TextFormattingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Text formatting error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Return the fallback UI or the original children without formatting
      return this.props.fallback || this.props.children;
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap text formatting with error boundary
 */
export function withTextFormattingErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    return (
      <TextFormattingErrorBoundary>
        <Component {...props} />
      </TextFormattingErrorBoundary>
    );
  };
}

export default TextFormattingErrorBoundary;
