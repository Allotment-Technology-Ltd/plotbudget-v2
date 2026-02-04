import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    screens: {
      xs: '390px',
      sm: '640px',
      md: '810px',
      lg: '1024px',
      xl: '1200px',
      '2xl': '1440px',
    },

    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',

        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },

        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },

        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },

        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },

        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },

        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },

        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },

        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',

        plot: {
          bg: 'rgb(var(--bg-primary) / <alpha-value>)',
          surface: 'rgb(var(--bg-secondary) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
          text: 'rgb(var(--text-primary) / <alpha-value>)',
          muted: 'rgb(var(--text-secondary) / <alpha-value>)',
          accent: 'rgb(var(--accent-primary) / <alpha-value>)',
          glow: 'rgb(var(--accent-glow) / <alpha-value>)',
        },

        needs: {
          DEFAULT: 'rgb(var(--needs) / <alpha-value>)',
          subtle: 'rgb(var(--needs) / 0.3)',
          strong: 'rgb(var(--needs) / 0.8)',
          'very-subtle': 'rgb(var(--needs) / 0.1)',
        },

        wants: {
          DEFAULT: 'rgb(var(--wants) / <alpha-value>)',
          subtle: 'rgb(var(--wants) / 0.3)',
          strong: 'rgb(var(--wants) / 0.8)',
          'very-subtle': 'rgb(var(--wants) / 0.1)',
        },

        repay: {
          DEFAULT: 'rgb(var(--repay) / <alpha-value>)',
          subtle: 'rgb(var(--repay) / 0.3)',
          strong: 'rgb(var(--repay) / 0.8)',
          'very-subtle': 'rgb(var(--repay) / 0.1)',
        },

        savings: {
          DEFAULT: 'rgb(var(--savings) / <alpha-value>)',
          subtle: 'rgb(var(--savings) / 0.3)',
          strong: 'rgb(var(--savings) / 0.8)',
          'very-subtle': 'rgb(var(--savings) / 0.1)',
        },

        success: 'rgb(var(--success) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
      },

      fontFamily: {
        display: ['var(--font-jetbrains)', 'monospace'],
        heading: ['var(--font-space)', 'monospace'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display-lg': ['4.5rem', { lineHeight: '1.05', letterSpacing: '0.06em' }],
        'display-sm': ['2.5rem', { lineHeight: '1.1', letterSpacing: '0.04em' }],
        'headline': ['3rem', { lineHeight: '1.15', letterSpacing: '0.02em' }],
        'headline-sm': ['1.75rem', { lineHeight: '1.2', letterSpacing: '0.02em' }],
        'sub': ['1.5rem', { lineHeight: '1.3', letterSpacing: '0.01em' }],
        'sub-sm': ['1.125rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        'label': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.15em' }],
        'label-sm': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.15em' }],
        'cta': ['1rem', { lineHeight: '1', letterSpacing: '0.2em' }],
        'cta-sm': ['0.875rem', { lineHeight: '1', letterSpacing: '0.15em' }],
      },

      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },

      maxWidth: {
        content: '1200px',
        prose: '700px',
        narrow: '520px',
      },

      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-DEFAULT)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },

      boxShadow: {
        'glow': '0 0 30px rgb(var(--accent-glow) / 0.15)',
        'glow-lg': '0 0 60px rgb(var(--accent-glow) / 0.2)',
        'glow-sm': '0 0 15px rgb(var(--accent-glow) / 0.1)',
        'phone': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },

      animation: {
        'cursor-blink': 'blink 1s step-end infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },

      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgb(var(--accent-glow) / 0.15)' },
          '50%': { boxShadow: '0 0 40px rgb(var(--accent-glow) / 0.25)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },

      zIndex: {
        'dropdown': '50',
        'sticky': '100',
        'modal': '200',
        'popover': '300',
        'tooltip': '400',
        'toast': '500',
      },
    },
  },

  plugins: [
    require('tailwindcss-animate'),
  ],
};

export default config;
