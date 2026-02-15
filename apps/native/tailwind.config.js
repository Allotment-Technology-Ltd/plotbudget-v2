/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        /* PLOT design tokens — aligned with @repo/design-tokens (tokens.css) */
        plot: {
          'bg-primary': '#F5F0EA',
          'bg-secondary': '#FFFFFF',
          'bg-elevated': '#F0EBE4',
          'text-primary': '#111111',
          'text-secondary': '#555555',
          'accent-primary': '#0E8345',
          'accent-glow': 'rgba(14, 131, 69, 0.15)',
          'border-subtle': 'rgba(0, 0, 0, 0.08)',
          'border-accent': 'rgba(14, 131, 69, 0.3)',
        },
        /* Dark mode equivalents for reference (use with dark: prefix) */
        'plot-dark': {
          'bg-primary': '#111111',
          'bg-secondary': '#1A1A1A',
          'bg-elevated': '#222222',
          'text-primary': '#F5F0EA',
          'text-secondary': '#999999',
          'accent-primary': '#69F0AE',
        },
      },
    },
  },
  plugins: [],
};
