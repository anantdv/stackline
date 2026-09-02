/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--sh-accent))",
          foreground: "hsl(var(--sh-accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Stackline design tokens — CSS custom properties, theme-aware
        // (dark on :root, overridden under [data-theme="light"] in index.css)
        void: "rgb(var(--rgb-void) / <alpha-value>)",
        page: "rgb(var(--rgb-page) / <alpha-value>)",
        surface: "rgb(var(--rgb-surface) / <alpha-value>)",
        raised: "rgb(var(--rgb-raised) / <alpha-value>)",
        line: "var(--line)",
        linestrong: "var(--line-strong)",
        ink0: "rgb(var(--rgb-text-0) / <alpha-value>)",
        ink1: "rgb(var(--rgb-text-1) / <alpha-value>)",
        ink2: "rgb(var(--rgb-text-2) / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(var(--rgb-accent) / <alpha-value>)",
          hover: "rgb(var(--rgb-accent-hover) / <alpha-value>)",
          soft: "var(--accent-soft)",
        },
        onbrand: "var(--on-accent)",
        data: {
          DEFAULT: "rgb(var(--rgb-data) / <alpha-value>)",
          soft: "var(--data-soft)",
        },
        warn: "rgb(var(--rgb-warn) / <alpha-value>)",
        crit: "rgb(var(--rgb-crit) / <alpha-value>)",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        glow: "0 0 24px rgba(255,107,26,0.35)",
        "glow-data": "0 0 24px rgba(45,212,191,0.30)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "pulse-dot": {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.8)" },
        },
        "scroll-cue": {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "45%": { transform: "scaleY(1)", transformOrigin: "top" },
          "55%": { transform: "scaleY(1)", transformOrigin: "bottom" },
          "100%": { transform: "scaleY(0)", transformOrigin: "bottom" },
        },
        "float-slow": {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
        "dash-flow": {
          to: { strokeDashoffset: "-24" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        marquee: "marquee 28s linear infinite",
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
        "scroll-cue": "scroll-cue 2.2s cubic-bezier(0.22,1,0.36,1) infinite",
        "float-slow": "float-slow 20s ease-in-out infinite",
        "dash-flow": "dash-flow 1.2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
