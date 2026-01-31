/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 背景色系
        'bg-primary': '#0B0E14',
        'bg-secondary': '#151921',
        'bg-tertiary': '#1F242D',
        'border-subtle': '#2A2F3E',
        
        // 主色调 (Polygon)
        'polygon': '#0EA5E9',
        
        // 盈利/亏损
        'profit': '#10B981',
        'loss': '#F43F5E',
        
        // 特殊颜色
        'gold': '#FFD700',
        'blue-industrial': '#4B69FF',
        'purple-rare': '#F59E0B',
        'red-classified': '#EB4B4B',
      },
      fontFamily: {
        'sans': ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'ticker': 'ticker 20s linear infinite',
        'flash-up': 'flash-up 0.7s ease-out',
        'flash-down': 'flash-down 0.7s ease-out',
        'market-flow': 'market-flow 2.5s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(130, 71, 229, 0.7)' },
          '50%': { boxShadow: '0 0 0 10px rgba(130, 71, 229, 0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'flash-up': {
          '0%': { color: '#10B981' },
          '100%': { color: 'inherit' },
        },
        'flash-down': {
          '0%': { color: '#F43F5E' },
          '100%': { color: 'inherit' },
        },
        'market-flow': {
          '0%': { strokeDashoffset: '12' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};
