import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler']],
            },
        }),
    ],
    resolve: {
        alias: {
            '~': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://localhost:3332',
            },
            '/graphql': {
                target: 'http://localhost:3332',
            },
            '/assets/images': {
                target: 'http://localhost:3332',
            },
            '/socket.io': {
                target: 'http://localhost:3332',
                ws: true,
            },
        },
    },
    preview: {
        host: '0.0.0.0',
    },
    test: {
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
    },
});
