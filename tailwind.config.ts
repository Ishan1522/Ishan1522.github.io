import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Petrol-drenched signal field. Deep petrol backgrounds (blue+green
        // blend — the owner's two favourite colours), blue = INTERACTION,
        // green = LIVE DATA. Values defined once as CSS custom properties in
        // app/globals.css (`:root`). Referenced here as
        // `rgb(var(--color-*) / <alpha-value>)` so every opacity modifier
        // keeps working.
        ink: {
          950: 'rgb(var(--color-ink-950) / <alpha-value>)',
          900: 'rgb(var(--color-ink-900) / <alpha-value>)',
          800: 'rgb(var(--color-ink-800) / <alpha-value>)',
          700: 'rgb(var(--color-ink-700) / <alpha-value>)',
          600: 'rgb(var(--color-ink-600) / <alpha-value>)',
        },
        cyan: {
          // Interaction blue — links, focus, active nav, section chrome
          DEFAULT: 'rgb(var(--color-cyan) / <alpha-value>)',
          glow: 'rgb(var(--color-cyan-glow) / <alpha-value>)',
          deep: 'rgb(var(--color-cyan-deep) / <alpha-value>)',
        },
        mint: {
          // Live green — status, firing traces, live data marks only
          DEFAULT: 'rgb(var(--color-mint) / <alpha-value>)',
          glow: 'rgb(var(--color-mint-glow) / <alpha-value>)',
          deep: 'rgb(var(--color-mint-deep) / <alpha-value>)',
        },
        slate: {
          muted: 'rgb(var(--color-slate-muted) / <alpha-value>)',
          soft: 'rgb(var(--color-slate-soft) / <alpha-value>)',
          text: 'rgb(var(--color-slate-text) / <alpha-value>)',
          bright: 'rgb(var(--color-slate-bright) / <alpha-value>)',
        },
      },
      backdropBlur: {
        xs: '2px', // useful for subtle glass effects
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-display)', 'sans-serif'],  // Space Grotesk works as body too, ditch plex-sans
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(3.5rem, 10vw, 8rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 3s linear infinite',
        'scan': 'scan 8s linear infinite',
      },
      keyframes: {
        flicker: {
          '0%, 18%, 22%, 25%, 53%, 57%, 100%': { opacity: '1' },
          '20%, 24%, 55%': { opacity: '0.65' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgb(var(--color-cyan) / 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--color-cyan) / 0.04) 1px, transparent 1px)',
        'radial-glow':
          'radial-gradient(ellipse at center, rgb(var(--color-cyan) / 0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};

export default config;
