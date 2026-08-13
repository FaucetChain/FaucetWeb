/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#fafafa",
        card: "#121214",
        muted: "#a1a1aa",
        line: "#27272a",
        accent: "#14f195",
        danger: "#ef4444",
      },
    },
  },
  plugins: [],
};
