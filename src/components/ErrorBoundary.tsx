import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangleIcon } from './icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BreatheFresh Uncaught React Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangleIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
              <p className="text-xs text-slate-500">
                BreatheFresh encountered an unexpected UI render error. Your profile data is safely
                saved in local storage.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
