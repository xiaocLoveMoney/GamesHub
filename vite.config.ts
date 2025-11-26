import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve('./src'),
        },
    },
    css: {
        postcss: {
            plugins: [
                tailwindcss,
                autoprefixer({
                    flexbox: 'no-2009',
                }),
            ],
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
            output: {
                // 代码分割
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router'],
                    'ui-vendor': [
                        '@radix-ui/react-accordion',
                        '@radix-ui/react-alert-dialog',
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-select',
                        '@radix-ui/react-tabs',
                        '@radix-ui/react-toast',
                    ],
                },
                // 文件命名
                chunkFileNames: 'chunks/[name]-[hash].js',
                entryFileNames: '[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
        // 性能优化
        chunkSizeWarningLimit: 1000,
        reportCompressedSize: true,
    },
    server: {
        port: 5173,
        open: true,
        cors: true,
    },
})