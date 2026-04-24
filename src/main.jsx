import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import App from './App';
import './index.css';

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
    import('virtual:pwa-register').then(({ registerSW }) => {
        registerSW({
            immediate: true,
            onOfflineReady() {
                console.log('MetricStack is ready for offline use');
            },
        });
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <DataProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                style: {
                                    background: '#1e293b',
                                    color: '#f1f5f9',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                },
                            }}
                        />
                        <App />
                    </AuthProvider>
                </ThemeProvider>
            </DataProvider>
        </BrowserRouter>
    </React.StrictMode>
);
