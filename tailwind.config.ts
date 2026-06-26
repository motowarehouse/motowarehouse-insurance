import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#009BB4',
          'teal-light': '#00EFD1',
          'teal-mid': '#0AB9D5',
          'teal-pale': '#72D6E5',
          navy: '#001A22',
          'navy-2': '#002D3A',
          'navy-mid': '#005F73',
          'row-tint': '#E6F7FA',
        },
      },
      fontFamily: {
        sans: ['Lato', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
