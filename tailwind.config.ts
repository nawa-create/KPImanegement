import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#000000',
          secondary: '#0A0A0A',
          tertiary: '#141414',
          elevated: '#1C1C1E',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1A6',
          tertiary: '#636366',
        },
        accent: {
          DEFAULT: '#FF6B35',
          light: '#FF8B5E',
          dark: '#E55A25',
          glow: 'rgba(255, 107, 53, 0.4)',
        },
        success: '#30D158',
        warning: '#FFD60A',
        error: '#FF453A',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Noto Sans JP',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '24px',
        button: '14px',
      },
      boxShadow: {
        card: '0 8px 32px rgba(0, 0, 0, 0.4)',
        glow: '0 0 40px rgba(255, 107, 53, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
