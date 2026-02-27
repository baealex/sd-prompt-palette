import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
    plugins: [svelte()],
    resolve: {
        alias: {
            '~': '/src',
        }
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
            }
        }
    },
    preview: {
        host: '0.0.0.0',
    }
});
