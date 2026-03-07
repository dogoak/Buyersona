import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    declare props: Readonly<Props>;
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    padding: '1rem',
                }}>
                    <div style={{
                        maxWidth: '480px',
                        width: '100%',
                        textAlign: 'center',
                        background: 'white',
                        borderRadius: '1.5rem',
                        padding: '3rem 2rem',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                        border: '1px solid #e2e8f0',
                    }}>
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '1rem',
                        }}>
                            😵
                        </div>
                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            color: '#1e293b',
                            marginBottom: '0.75rem',
                        }}>
                            ¡Algo salió mal!
                        </h1>
                        <p style={{
                            color: '#64748b',
                            fontSize: '0.95rem',
                            lineHeight: 1.6,
                            marginBottom: '2rem',
                        }}>
                            Ocurrió un error inesperado. Podés intentar recargar la página o volver al inicio.
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.background = '#4f46e5')}
                                onMouseOut={(e) => (e.currentTarget.style.background = '#6366f1')}
                            >
                                🔄 Recargar página
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                                onMouseOut={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                            >
                                🏠 Ir al inicio
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details style={{
                                marginTop: '2rem',
                                textAlign: 'left',
                                background: '#fef2f2',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #fecaca',
                            }}>
                                <summary style={{ color: '#dc2626', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                                    Detalle del error (dev)
                                </summary>
                                <pre style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.75rem',
                                    color: '#991b1b',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                }}>
                                    {this.state.error.message}
                                    {'\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
