/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1115",
        mint: "#54e2b2",
      },
    },
  },
  plugins: [],
};