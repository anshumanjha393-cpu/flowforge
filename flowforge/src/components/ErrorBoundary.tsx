import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[#e2e8f0] bg-white p-8 text-center dark:border-[#2a2c38] dark:bg-[#15171f]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">
            Something went wrong
          </h3>
          <p className="mt-2 max-w-sm text-sm text-[#757684] dark:text-[#a8aab8]">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-4 rounded-lg bg-[#00288e] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 dark:bg-[#3b52d9]"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
