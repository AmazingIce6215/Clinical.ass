import React, { Component } from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Wardly interface error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-[12px] border border-danger/25 bg-danger-soft p-6" role="alert">
          <h2 className="text-lg font-semibold text-foreground">
            This section could not be displayed
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Reload the page and try again. Your device-local saved work has not been cleared.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
