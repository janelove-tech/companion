import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: "#181818",
        panel: "#1e1e1e",
        input: "#222222",
        stone: "#F5F1EA",
        champagne: "#DCCFC0",
        bronze: "#8B7355",
        photo: "#111111",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-unbounded)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
        message: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      borderColor: {
        subtle: "rgba(220, 207, 192, 0.1)",
        medium: "rgba(220, 207, 192, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
