import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        noir: {
          950: "#08090C",
          900: "#0F1117",
          850: "#151821",
          800: "#1C202C",
          700: "#2B3142",
          600: "#3E465D",
          400: "#7582A5",
          200: "#B9C2D8"
        },
        blood: {
          600: "#DC2626",
          500: "#EF4444",
          400: "#F87171"
        },
        gold: {
          500: "#F59E0B",
          400: "#FBBF24"
        }
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"]
      }
    },
  },
  plugins: [],
};

export default config;
