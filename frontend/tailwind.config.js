/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0F1115',
        panel: '#171A21',
        border: '#262A33',
        primary: '#E6E8EC',
        muted: '#8A909B',
        brand: '#E8862E',
        status: {
          available: '#2FBF71',
          trip: '#3E7BFA',
          shop: '#E8A33D',
          retired: '#E5484D'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
