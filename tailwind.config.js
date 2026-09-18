/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Wondiyo acik tema paleti
                'bg-primary': '#F4F6F2',
                'bg-secondary': '#EAEEE6',
                'bg-card': '#FFFFFF',
                'bg-card-hover': '#F7F9F5',
                'header-green': '#1E8A45',
                'navbar-green': '#146B34',
                'accent-green': '#1E8A45',
                'accent-yellow': '#C8D92E',
                'accent-green-hover': '#2FA857',
                'accent-yellow-hover': '#D8E33F',
                'border-custom': '#DCE3D6',
                'border-light': '#E7ECE2',
                'divider': '#DCE3D6',
                'text-primary': '#16261B',
                'text-secondary': '#4A5B4F',
                'text-muted': '#77857A',
                'btn-green': '#1E8A45',
                'btn-green-hover': '#146B34',
                'btn-gray': '#EAEEE6',
                'btn-gray-hover': '#DCE3D6',
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
