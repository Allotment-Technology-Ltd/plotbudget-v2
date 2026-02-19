/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],

  /*
   * We use 'class' strategy so the useTheme hook can toggle
   * a .dark class on <html>. All color changes are handled
   * by CSS custom properties — no dark: prefix needed in markup.
   */
  darkMode: 'class',

  theme: {
    /*
     * Custom breakpoints matching the PLOT mobile-first spec.
     * xs  = smallest supported phone (iPhone SE / mini)
     * sm  = standard phone (iPhone 14 / Pixel)
     * md  = tablet (iPad portrait)
     * lg  = small laptop
     * xl  = desktop (primary design canvas)
     * 2xl = ultrawide
     */
    screens: {
      xs: '390px',
      sm: '640px',
      md: '810px',
      lg: '1024px',
      xl: '1200px',
      '2xl': '1440px',
    },

    extend: {
      /*
       * Colors reference CSS custom properties defined in index.css.
       * This means a single class like `bg-plot-bg` automatically
       * resolves to the correct light/dark value based on the .dark
       * class — no conditional className strings needed.
       */
      colors: {
        plot: {
          bg:        'var(--bg-primary)',
          surface:   'var(--bg-secondary)',
          elevated:  'var(--bg-elevated)',
          text:      'var(--text-primary)',
          muted:     'var(--text-secondary)',
          accent:    'var(--accent-primary)',
          'accent-text': 'var(--accent-text)',
          glow:      'var(--accent-glow)',
          border:    'var(--border-subtle)',
          'border-accent': 'var(--border-accent)',
          overlay:   'var(--surface-overlay)',
        },
      },

      /*
       * Typography stack:
       * - display  → JetBrains Mono (hero headline, numbers)
       * - heading  → Space Mono (section titles, labels, CTAs)
       * - body     → Inter (readable paragraph text)
       */
      fontFamily: {
        display: ['"JetBrains Mono"', 'monospace'],
        heading: ['"Space Mono"', 'monospace'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display-lg': ['4.5rem',  { lineHeight: '1.05', letterSpacing: '0.06em' }],  // 72px desktop
        'display-sm': ['2.5rem',  { lineHeight: '1.1',  letterSpacing: '0.04em' }],  // 40px mobile
        'headline':   ['3rem',    { lineHeight: '1.15', letterSpacing: '0.02em' }],  // 48px desktop
        'headline-sm':['1.75rem', { lineHeight: '1.2',  letterSpacing: '0.02em' }],  // 28px mobile
        'sub':        ['1.5rem',  { lineHeight: '1.3',  letterSpacing: '0.01em' }],  // 24px
        'sub-sm':     ['1.125rem',{ lineHeight: '1.4',  letterSpacing: '0.01em' }],  // 18px
        'label':      ['0.875rem',{ lineHeight: '1.4',  letterSpacing: '0.15em' }],  // 14px
        'label-sm':   ['0.75rem', { lineHeight: '1.4',  letterSpacing: '0.15em' }],  // 12px
        'cta':        ['1rem',    { lineHeight: '1',     letterSpacing: '0.2em'  }],  // 16px
        'cta-sm':     ['0.875rem',{ lineHeight: '1',     letterSpacing: '0.15em' }],  // 14px
      },

      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },

      maxWidth: {
        content: '1200px',
        prose:   '700px',
        narrow:  '520px',
      },

      borderRadius: {
        none: '0px',  // reinforced — PLOT uses 0 radius everywhere
      },

      boxShadow: {
        'glow':      '0 0 30px var(--accent-glow)',
        'glow-lg':   '0 0 60px var(--accent-glow)',
        'glow-sm':   '0 0 15px var(--accent-glow)',
        'phone':     '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      },

      animation: {
        'cursor-blink': 'blink 1s step-end infinite',
        'fade-in':      'fadeIn 0.6s ease-out forwards',
        'slide-up':     'slideUp 0.6s ease-out forwards',
        'glow-pulse':   'glowPulse 3s ease-in-out infinite',
      },

      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px var(--accent-glow)' },
          '50%':      { boxShadow: '0 0 40px var(--accent-glow)' },
        },
      },
    },
  },

  plugins: [],
};
