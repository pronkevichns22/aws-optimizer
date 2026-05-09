// ============================================================================
// FILE: tailwind.config.js
// LOCATION: client/
// PURPOSE: Tailwind CSS configuration with custom theme extensions
// ============================================================================

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'albert-sans': ['Albert Sans', 'sans-serif'],
      },
      colors: {
        main: "var(--main)",
        "main-collection-cost": "var(--main-collection-cost)",
        "main-collection-dark-navy": "var(--main-collection-dark-navy)",
        "main-collection-dark-navy-border": "var(--main-collection-dark-navy-border)",
        "main-collection-passive": "var(--main-collection-passive)",
        "main-collection-passivetext": "var(--main-collection-passivetext)",
        "main-collection-tgblue": "var(--main-collection-tgblue)",
        "main-collection-tgblueborder": "var(--main-collection-tgblueborder)",
        "resources-color": "var(--resources-color)",
        "resources-ebsvol": "var(--resources-ebsvol)",
        "resources-ebsvolbg": "var(--resources-ebsvolbg)",
        "resources-elasticip": "var(--resources-elasticip)",
        "resources-elasticip-BG": "var(--resources-elasticip-BG)",
        "resources-resid": "var(--resources-resid)",
        "resources-resid-BG": "var(--resources-resid-BG)",
        "resources-snapshot": "var(--resources-snapshot)",
        "resources-snapshotbg": "var(--resources-snapshotbg)",
      },
    },
  },
  plugins: [],
}
