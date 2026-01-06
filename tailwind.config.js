/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Bet365 Color Palette
                'bg-primary': '#1a1a1a',
                'bg-secondary': '#2d2d2d',
                'bg-card': '#242424',
                'bg-card-hover': '#303030',
                'header-green': '#00473e',
                'navbar-green': '#1a4d2e',
                'accent-green': '#52d858',
                'accent-yellow': '#ffd800',
                'accent-green-hover': '#00ff87',
                'accent-yellow-hover': '#ffed4e',
                'border-custom': '#404040',
                'border-light': '#4a4a4a',
                'divider': '#353535',
                'text-muted': '#999999',
                'btn-green': '#52d858',
                'btn-green-hover': '#1a4d2e',
                'btn-gray': '#3a3a3a',
                'btn-gray-hover': '#4a4a4a',
            },
            fontFamily: {
                sans: ['Poppins', 'sans-serif'],
                display: ['Rajdhani', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in-down': 'fade-in-down 1s ease-out',
                'fade-in-up': 'fade-in-up 1s ease-out 0.2s both',
                'fade-in-up-delay': 'fade-in-up 1s ease-out 0.4s both',
                'fade-in': 'fade-in 1s ease-out 0.3s both',
                'fade-in-delay': 'fade-in 1s ease-out 0.5s both',
            },
            keyframes: {
                'fade-in-down': {
                    'from': { opacity: '0', transform: 'translateY(-30px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in-up': {
                    'from': { opacity: '0', transform: 'translateY(30px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    'from': { opacity: '0' },
                    'to': { opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}
