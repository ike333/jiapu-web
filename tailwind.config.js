/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1565C0",
          50: "#E3F2FD",
          100: "#BBDEFB",
          200: "#90CAF9",
          300: "#64B5F6",
          400: "#42A5F5",
          500: "#2196F3",
          600: "#1E88E5",
          700: "#1976D2",
          800: "#1565C0",
          900: "#0D47A1",
        },
        accent: {
          gold: "#C9A84C",
          red: "#C62828",
        },
      },
      fontFamily: {
        serif: ["Noto Serif SC", "Source Han Serif SC", "serif"],
        sans: ["Noto Sans SC", "Source Han Sans SC", "sans-serif"],
      },
    },
  },
  plugins: [],
};
