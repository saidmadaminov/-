import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#bcd7ff",
          300: "#8ebeff",
          400: "#5999ff",
          500: "#3374ff",
          600: "#1b52f5",
          700: "#143ee1",
          800: "#1734b6",
          900: "#19318f",
          950: "#141f57",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5d9e2",
          300: "#b1b9c9",
          400: "#8794ad",
          500: "#687694",
          600: "#535f7a",
          700: "#444e64",
          800: "#3b4353",
          900: "#0f1729",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,41,.06), 0 4px 16px rgba(15,23,41,.07)",
      },
      borderRadius: { xl2: "1.1rem" },
    },
  },
  plugins: [],
};
export default config;
