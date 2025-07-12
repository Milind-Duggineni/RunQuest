/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./game/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      // Add any custom theme extensions here
    },
  },
  plugins: [],
  // Important for Nativewind
  presets: [require('nativewind/preset')],
  // Enable important to ensure styles aren't overridden
  important: 'html',
  // Disable core plugins you don't need
  corePlugins: {
    // Disable the ring utilities to reduce bundle size
    ringWidth: false,
    ringColor: false,
    ringOpacity: false,
    ringOffsetWidth: false,
    ringOffsetColor: false,
  },
  // Ensure all colors are available as classes
  safelist: [
    'bg-transparent',
    'text-transparent',
    'border-transparent',
  ],
}

