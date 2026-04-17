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
        // Cyberpunk — muted. Deep ink backgrounds, cyan primary, mint accent.
        ink: {
          950: '#05080f',
          900: '#0a0e1a',
          800: '#111827',
          700: '#1c2433',
          600: '#2a3446',
        },
        cyan: {
          // Primary — signal color for the neuron spike + headings
          DEFAULT: '#22d3ee',
          glow: '#67e8f9',
          deep: '#0891b2',
        },
        mint: {
          // Secondary — STDP synapses, dendrite tips, hover states
          DEFAULT: '#34d399',
          glow: '#6ee7b7',
          deep: '#059669',
        },
        slate: {
          muted: '#64748b',
          soft: '#94a3b8',
          text: '#cbd5e1',
          bright: '#f1f5f9',
        },
      },
      fontFamily: {
        display: ['var(--font-plex-condensed)', 'sans-serif'],
        sans: ['var(--font-plex-sans)', 'sans-serif'],
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
          'linear-gradient(to right, rgba(34, 211, 238, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(34, 211, 238, 0.04) 1px, transparent 1px)',
        'radial-glow':
          'radial-gradient(ellipse at center, rgba(34, 211, 238, 0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};

export default config;
