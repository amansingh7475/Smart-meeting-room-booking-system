/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '400px',
        '2xl': '1536px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
      colors: {
        room: {
          blue: {
            light: '#eff6ff',
            border: '#93c5fd',
            solid: '#2563eb',
            dark: '#1e40af',
          },
          red: {
            light: '#fef2f2',
            border: '#fca5a5',
            solid: '#dc2626',
            dark: '#991b1b',
          },
          yellow: {
            light: '#fefce8',
            border: '#fde047',
            solid: '#ca8a04',
            dark: '#854d0e',
          }
        }
      }
    },
  },
  plugins: [],
}
