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
        sans: ["var(--font-geist-sans)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        canvas:   "#010102",
        s1:       "#0f1011",
        s2:       "#141516",
        s3:       "#18191a",
        hairline: "#23252a",
        "hairline-strong": "#34343a",
        ink:      "#f7f8f8",
        "ink-muted":    "#d0d6e0",
        "ink-subtle":   "#8a8f98",
        "ink-tertiary": "#62666d",
        lavender:       "#5e6ad2",
        "lavender-hover": "#828fff",
        success:        "#27a644",
        // issue tag palette (from Linear product)
        "tag-red":    "#e5484d",
        "tag-orange": "#f76b15",
        "tag-yellow": "#f5d90a",
        "tag-green":  "#3e9b4f",
        "tag-blue":   "#3b9edd",
        "tag-purple": "#6e56cf",
      },
    },
  },
  plugins: [],
};
