import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
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
                xl: '1rem',
                '2xl': '1.25rem',
            },
            fontFamily: {
                sans: ['"Pretendard"', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};

export default config;
