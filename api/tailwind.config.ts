import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        offwhite: '#F4F0E6',
        graphite: '#2A2A2A',
        mustard: '#C8A03E',
        bluepurple: '#5247A0',
        darkbg: '#0E0D12',
        darkpanel: '#15141C',
      },
      fontFamily: {
        aicon: ['Aicon', 'Impact', 'sans-serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
