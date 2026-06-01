import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        ink: "#111827",
        line: "#e5e7eb"
      }
    }
  },
  plugins: []
};

export default config;
