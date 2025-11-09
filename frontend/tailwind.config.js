/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { cyan: "#43D3FF", pink: "#FF66E5", lime: "#39FF88" }
      },
      boxShadow: {
        glow: "0 10px 40px rgba(67,211,255,.18)"
      },
      backgroundImage: {
        aurora:
          "radial-gradient(40% 60% at 15% 0%, rgba(67,211,255,.18), transparent), radial-gradient(40% 60% at 90% 10%, rgba(255,102,229,.16), transparent)"
      }
    }
  },
  plugins: []
};
