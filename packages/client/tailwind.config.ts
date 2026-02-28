import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                bg: 'rgb(var(--color-bg) / <alpha-value>)',
                ink: {
                    DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
                    muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
                    subtle: 'rgb(var(--color-ink-subtle) / <alpha-value>)',
                    inverse: 'rgb(var(--color-ink-inverse) / <alpha-value>)',
                },
                surface: {
                    base: 'rgb(var(--color-surface-base) / <alpha-value>)',
                    muted: 'rgb(var(--color-surface-muted) / <alpha-value>)',
                    raised: 'rgb(var(--color-surface-raised) / <alpha-value>)',
                },
                line: {
                    DEFAULT: 'rgb(var(--color-line) / <alpha-value>)',
                    strong: 'rgb(var(--color-line-strong) / <alpha-value>)',
                },
                info: {
                    50: 'rgb(var(--color-info-50) / <alpha-value>)',
                    200: 'rgb(var(--color-info-200) / <alpha-value>)',
                    700: 'rgb(var(--color-info-700) / <alpha-value>)',
                },
                success: {
                    50: 'rgb(var(--color-success-50) / <alpha-value>)',
                    200: 'rgb(var(--color-success-200) / <alpha-value>)',
                    700: 'rgb(var(--color-success-700) / <alpha-value>)',
                },
                warning: {
                    50: 'rgb(var(--color-warning-50) / <alpha-value>)',
                    200: 'rgb(var(--color-warning-200) / <alpha-value>)',
                    700: 'rgb(var(--color-warning-700) / <alpha-value>)',
                },
                danger: {
                    50: 'rgb(var(--color-danger-50) / <alpha-value>)',
                    200: 'rgb(var(--color-danger-200) / <alpha-value>)',
                    700: 'rgb(var(--color-danger-700) / <alpha-value>)',
                    800: 'rgb(var(--color-danger-800) / <alpha-value>)',
                },
                overlay: 'rgb(var(--color-overlay) / <alpha-value>)',
                brand: {
                    50: '#effaf8',
                    100: '#d9f3ee',
                    200: '#b7e7dc',
                    300: '#87d5c3',
                    400: '#55bea7',
                    500: '#2f9f8a',
                    600: '#247f70',
                    700: '#1f655a',
                    800: '#1d5149',
                    900: '#1b443d',
                },
                accent: {
                    50: '#fffbeb',
                    100: '#fff3c6',
                    200: '#ffe588',
                    300: '#ffd149',
                    400: '#ffbc1f',
                    500: '#f99a07',
                    600: '#dd7202',
                    700: '#b74d06',
                    800: '#943b0c',
                    900: '#7a320d',
                },
            },
            borderRadius: {
                'token-sm': 'var(--radius-sm)',
                'token-md': 'var(--radius-md)',
                'token-lg': 'var(--radius-lg)',
                xl: '1rem',
                '2xl': '1.25rem',
            },
            boxShadow: {
                surface: 'var(--shadow-surface)',
                raised: 'var(--shadow-raised)',
                overlay: 'var(--shadow-overlay)',
            },
            fontFamily: {
                sans: [
                    '"Pretendard"',
                    '"Noto Sans KR"',
                    'system-ui',
                    'sans-serif',
                ],
            },
        },
    },
    plugins: [],
};

export default config;
