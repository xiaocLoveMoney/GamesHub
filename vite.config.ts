import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import compression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        compression({
            verbose: true,
            disable: false,
            threshold: 10240,
            algorithm: 'gzip',
            ext: '.gz',
        }),
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
        reportCompressedSize: true,
        rollupOptions: {
            output: {
                // 使用对象形式的manualChunks，避免循环依赖问题
                manualChunks(id) {
                    // 分割游戏
                    if (id.includes('src/pages/games/')) {
                        const match = id.match(/src\/pages\/games\/([^/.]+)\.tsx?/)
                        if (match && match[1]) {
                            return `game-${match[1]}`
                        }
                    }

                    // 分割vendor - 尽可能将所有可能依赖React的库都放在vendor-react中
                    if (id.includes('node_modules')) {
                        // 图表库单独 (不依赖React context)
                        if (id.includes('recharts')) {
                            return 'vendor-charts'
                        }

                        // i18n单独 (不依赖React context)
                        if (id.includes('i18next')) {
                            return 'vendor-i18n'
                        }

                        // 其他所有库都在vendor-react中，因为它们可能间接依赖React
                        // 这解决了createContext的问题
                        return 'vendor-react'
                    }
                },

                chunkFileNames: (chunkInfo) => {
                    const name = chunkInfo.name
                    if (name.match(/^game-/)) {
                        return `games/[name]-[hash].js`
                    }
                    if (name.match(/^vendor-/)) {
                        return `vendors/[name]-[hash].js`
                    }
                    return `chunks/[name]-[hash].js`
                },

                entryFileNames: 'js/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    const name = assetInfo.name || 'asset'
                    const ext = name.split('.').pop() || ''
                    if (/png|jpe?g|gif|svg|webp|ico/.test(ext)) {
                        return `images/[name]-[hash][extname]`
                    }
                    if (/woff|woff2|ttf|otf|eot/.test(ext)) {
                        return `fonts/[name]-[hash][extname]`
                    }
                    if (ext === 'css') {
                        return `css/[name]-[hash][extname]`
                    }
                    return `assets/[name]-[hash][extname]`
                },
            },
        },
        chunkSizeWarningLimit: 1000,
    },
    server: {
        port: 5173,
        open: true,
        cors: true,
    },
})