/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  safelist: [
    'bg-surface',
    'dark:bg-surface-dark',
    'bg-bg-main',
    'bg-bg-section',
    'text-text-heading',
    'text-text-body',
    'text-text-muted',
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5', 'grid-cols-6',
    'md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4', 'md:grid-cols-5', 'md:grid-cols-6',
    'lg:grid-cols-1', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4', 'lg:grid-cols-5', 'lg:grid-cols-6',
    'max-w-screen-xl', 'max-w-screen-2xl',
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem' },
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    },
    extend: {
      colors: {
        // Stripe-style SaaS palette
        primary: '#635BFF',
        'primary-hover': '#4F46E5',
        'primary-light': '#E0E7FF',
        secondary: '#0F172A',
        'secondary-light': '#1E293B',
        // Backgrounds
        'bg-main': '#F8FAFC',
        'bg-card': '#FFFFFF',
        'bg-section': '#F1F5F9',
        // Border & text
        'border-default': '#E5E7EB',
        'text-heading': '#0F172A',
        'text-body': '#334155',
        'text-muted': '#64748B',
        // Footer (dark)
        'footer-bg': '#020617',
        'footer-text': '#94A3B8',
        'footer-heading': '#CBD5F5',
        // Legacy aliases
        surface: '#F8FAFC',
        'surface-dark': '#0F172A',
        mint: '#E0E7FF',
        'edur-steel': '#4F46E5',
        'edur-blue': '#635BFF',
        'edur-sky': '#E0E7FF',
        'edur-bg': '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', 'Inter', 'serif'],
        arabic: ['"Noto Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'tight': '-0.025em',
      },
      fontSize: {
        'h1': ['2.25rem', { lineHeight: '1.2' }],
        'h2': ['1.875rem', { lineHeight: '1.3' }],
        'h3': ['1.5rem', { lineHeight: '1.35' }],
        'h4': ['1.25rem', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.08)',
        'btn-primary': '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      transitionDuration: {
        200: '200ms',
        250: '250ms',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'reveal-up': {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'reveal-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'dropdown-enter': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'drawer-enter': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'drawer-leave': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'overlay-enter': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'overlay-leave': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.35s ease-out',
        'reveal-up': 'reveal-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'reveal-in': 'reveal-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'dropdown-enter': 'dropdown-enter 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'drawer-enter': 'drawer-enter 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'drawer-leave': 'drawer-leave 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'overlay-enter': 'overlay-enter 0.2s ease-out',
        'overlay-leave': 'overlay-leave 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};
