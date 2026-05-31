/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: 'rgb(var(--bg-slate-950) / <alpha-value>)',
          900: 'rgb(var(--bg-slate-900) / <alpha-value>)',
          850: 'rgb(var(--border-slate-800) / <alpha-value>)',
          800: 'rgb(var(--border-slate-800) / <alpha-value>)',
        },
        blue: {
          600: 'rgb(var(--accent-color-dark) / <alpha-value>)',
          500: 'rgb(var(--accent-color) / <alpha-value>)',
          400: 'rgb(var(--accent-color-light) / <alpha-value>)',
        },
        indigo: {
          600: 'rgb(var(--accent-color-dark) / <alpha-value>)',
          500: 'rgb(var(--accent-color) / <alpha-value>)',
          400: 'rgb(var(--accent-color-light) / <alpha-value>)',
        },
        purple: {
          950: 'rgb(var(--bg-slate-950) / <alpha-value>)',
          900: 'rgb(var(--bg-slate-900) / <alpha-value>)',
          600: 'rgb(var(--accent-color-dark) / <alpha-value>)',
          500: 'rgb(var(--accent-color) / <alpha-value>)',
          400: 'rgb(var(--accent-color-light) / <alpha-value>)',
        },
        pink: {
          600: 'rgb(var(--accent-color-dark) / <alpha-value>)',
          500: 'rgb(var(--accent-color) / <alpha-value>)',
          400: 'rgb(var(--accent-color-light) / <alpha-value>)',
        },
        rose: {
          600: 'rgb(var(--accent-color-dark) / <alpha-value>)',
          500: 'rgb(var(--accent-color) / <alpha-value>)',
          400: 'rgb(var(--accent-color-light) / <alpha-value>)',
        }
      }
    },
  },
  plugins: [],
}
