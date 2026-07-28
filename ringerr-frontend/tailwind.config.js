/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        bg: '#09090B',
        surface: '#111827',
        card: '#1A1F2E',
        primary: { DEFAULT: '#FF8A00', dark: '#FF6B00' },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#06B6D4',
        purple: '#A855F7',
      },
      borderRadius: { '2xl': '20px', '3xl': '24px' },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.3)',
        glow: '0 0 20px rgba(255,138,0,0.25)',
      },
    },
  },
  plugins: [],
}
