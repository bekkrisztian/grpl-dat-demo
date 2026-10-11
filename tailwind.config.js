// The gruim remote loads its own Tailwind build into this same document, so a
// shared colour name would mean two definitions of one class and whichever
// stylesheet arrives last would win. These names are ours alone.
const token = (name) => ({ opacityValue }) =>
  opacityValue === undefined ? `rgb(var(${name}))` : `rgb(var(${name}) / ${opacityValue})`;

module.exports = {
  content: ["./src/**/*.{html,js,ts,svelte}"],
  theme: {
    extend: {
      colors: {
        "app-bg": token("--dat-bg"),
        "app-surface": token("--dat-surface"),
        "app-sunken": token("--dat-sunken"),
        "app-line": token("--dat-line"),
        "app-line-strong": token("--dat-line-strong"),
        "app-ink": token("--dat-ink"),
        "app-muted": token("--dat-muted"),
        "app-accent": token("--dat-accent"),
        "app-accent-hover": token("--dat-accent-hover"),
        "app-accent-soft": token("--dat-accent-soft"),
        "app-accent-ink": token("--dat-accent-ink"),
        "app-danger": token("--dat-danger"),
        "app-danger-soft": token("--dat-danger-soft"),
      },
    },
  },
  plugins: [],
};
