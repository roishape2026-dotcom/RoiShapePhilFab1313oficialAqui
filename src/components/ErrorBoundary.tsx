import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ROI Shape Error Boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
          <div className="max-w-md w-full text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-neon-500/10 border border-neon-500/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-neon-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-3">Algo deu errado</h1>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Ocorreu um erro inesperado ao carregar o aplicativo. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary inline-flex items-center justify-center gap-2 text-sm px-6 py-3"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
