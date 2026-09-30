import { Component, type ReactNode, type ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import App from './App.tsx';
import { monadMainnet } from './lib/chains.ts';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <pre
          style={{
            margin: 0,
            padding: '24px',
            minHeight: '100vh',
            width: '100vw',
            boxSizing: 'border-box',
            backgroundColor: '#0b0b10',
            color: '#ffffff',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {`${this.state.error.message}\n\n${this.state.error.stack || ''}`}
        </pre>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <PrivyProvider
      appId="cmujv4iea038h0cjvvsnhnhgy"
      config={{
        appearance: {
          theme: 'dark',
        },
        loginMethods: ['email', 'google'],
        defaultChain: monadMainnet,
        supportedChains: [monadMainnet],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </PrivyProvider>
  </ErrorBoundary>
);
