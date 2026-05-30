/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#EEF4FF',
          100: '#C7D9FC',
          200: '#9DBDF8',
          300: '#5E90F2',
          400: '#2563EB',
          500: '#1D4ED8',
          600: '#1E40AF',
          700: '#1E3A8A',
          800: '#1E3069',
          900: '#172554',
        }
      }
    }
  },
  plugins: []
}
