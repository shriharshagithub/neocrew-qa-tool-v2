/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "system-ui", "sans-serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        qa: {
          bg:      "#09090b",
          surface: "#111116",
          card:    "#18181f",
          border:  "#2a2a35",
          bright:  "#3a3a48",
          text:    "#f0f0f5",
          muted:   "#71717a",
          faint:   "#3f3f46",
        },
      },
      animation: {
        "slide-in": "slideIn 0.2s ease-out",
        "pop":      "pop 0.15s ease-out",
        "pulse-amber": "pulseAmber 2s ease-in-out infinite",
      },
      keyframes: {
        slideIn: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%":   { transform: "scale(0.95)" },
          "60%":  { transform: "scale(1.03)" },
          "100%": { transform: "scale(1)" },
        },
        pulseAmber: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(245,158,11,0)" },
          "50%":      { boxShadow: "0 0 0 4px rgba(245,158,11,0.15)" },
        },
      },
    },
  },
  plugins: [],
};
