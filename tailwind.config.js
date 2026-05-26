/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./store/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./constants.tsx",
    "./types.ts",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        script: ['Dancing Script', 'cursive'],
      },
      colors: {
        googleBlue: '#1a73e8',
        ghBorder: '#d0d7de',
        ghBg: '#f6f8fa',
        ghText: '#24292f',
        brandNavy: '#002D50',
      },
    },
  },
  plugins: [],
}
