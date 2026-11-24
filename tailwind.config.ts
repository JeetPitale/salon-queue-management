import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1F3A5F",
        accent: "#C97B63",
        background: "#FAF8F5",
        surface: "#FFFFFF",
        "custom-text": "#1B1B1F",
        muted: "#6B6F76",
        border: "#E4E1DC",
        // Status tokens
        status: {
          waiting: {
            text: "#B45F06",
            bg: "#FCE5CD",
          },
          called: {
            text: "#1F5FA8",
            bg: "#DCE9F7",
          },
          in_service: {
            text: "#6B3FA0",
            bg: "#EADCF5",
          },
          completed: {
            text: "#2D6A1F",
            bg: "#D9EAD3",
          },
          no_show: {
            text: "#8B1A1A",
            bg: "#F4CCCC",
          },
          cancelled: {
            text: "#555555",
            bg: "#E8E8E8",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
