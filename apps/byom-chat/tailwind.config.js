module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // Include SDK components so Tailwind keeps their classes
    '../../packages/byom-sdk/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {},
  },
  darkMode: 'media',
  plugins: [],
};
