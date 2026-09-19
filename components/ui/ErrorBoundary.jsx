"use client";

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error details for debugging
    console.group('🚨 React Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-rose-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-2xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-slate-400 mb-6">
                We encountered an unexpected error. The error has been logged and our team will look into it.
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Error Details</h2>
              
              {this.state.error && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Error Message:</p>
                    <p className="text-sm text-rose-400 font-mono bg-rose-500/10 p-2 rounded mt-1">
                      {this.state.error.message || this.state.error.toString()}
                    </p>
                  </div>
                  
                  {this.state.errorInfo && (
                    <div>
                      <p className="text-sm font-medium text-slate-300">Component Stack:</p>
                      <pre className="text-xs text-slate-400 bg-slate-800 p-2 rounded mt-1 overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Reload Page
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => window.history.back()}
                className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                ← Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
