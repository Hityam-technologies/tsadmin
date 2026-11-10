/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FBF7EE',
          100: '#F7EFCB',
          200: '#E9D7A0',
          300: '#DFC688',
          400: '#D4AF37',
          500: '#C5A253', // Antique Temple Gold
          600: '#A08035',
          700: '#7D6428',
          800: '#5A471C',
          900: '#3A2E11',
        },
        saffron: {
          50: '#FDF2EB',
          100: '#FBE4D4',
          200: '#F6C8A6',
          300: '#EEA674',
          400: '#DE7335',
          500: '#BF5B21', // Burnt Saffron Silk
          600: '#A34B19',
          700: '#843C13',
          800: '#642E0F',
          900: '#46200A',
        },
        maroon: {
          50: '#FDF2F4',
          100: '#FBE2E7',
          200: '#F4BCC8',
          500: '#6B1728', // Deep Royal Maroon
          600: '#500E1C',
          900: '#340811',
        },
        sand: {
          50: '#FFFDF0',
          100: '#FBF9F4',
          200: '#F4EFE6',
          300: '#EFEAE1',
          400: '#E8E2D5',
          500: '#D2C8B8',
        },
        charcoal: {
          50: '#F6F5F4',
          100: '#E7E5E3',
          200: '#C8C4C0',
          500: '#6B5E51',
          700: '#3B3530',
          900: '#1E1B18', // Rich dark charcoal
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

