import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import viteApiPlugin from './vite-api-plugin.js';

export default defineConfig({
    base: './',
    plugins: [
        react(),
        viteApiPlugin(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            devOptions: {
                enabled: true
            },
            includeAssets: ['favicon.png', 'pwa-192.png', 'pwa-512.png'],
            manifestFilename: 'manifest.json',
            manifest: {
                name: 'MetricStack — Car Rental Management',
                short_name: 'MetricStack',
                description: 'Premium Car Rental Management System',
                theme_color: '#0F172A',
                background_color: '#0F172A',
                display: 'standalone',
                start_url: '.',
                icons: [
                    {
                        src: 'pwa-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'pwa-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                navigateFallback: 'index.html',
                navigateFallbackDenylist: [/^\/api\//],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
                        },
                    },
                ],
            },
        }),
    ],
    server: {
        port: 5173,
    },
    build: {
        outDir: 'dist',
    },
});
