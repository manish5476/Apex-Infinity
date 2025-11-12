// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // This tells Tailwind to scan all your Angular components
  ],
  theme: {
    extend: {
      // We map Tailwind's 'theme' to your CSS variables from themes.scss
      colors: {
        'theme-bg-primary': 'var(--theme-bg-primary)',
        'theme-bg-secondary': 'var(--theme-bg-secondary)',
        'theme-bg-ternary': 'var(--theme-bg-ternary)',
        'theme-text-primary': 'var(--theme-text-primary)',
        'theme-text-secondary': 'var(--theme-text-secondary)',
        'theme-text-label': 'var(--theme-text-label)',
        'theme-accent-primary': 'var(--theme-accent-primary)',
        'theme-accent-primary-hover': 'var(--theme-accent-primary-hover)',
        'theme-success': 'var(--theme-success-primary)',
        'theme-error': 'var(--theme-error-primary)',
        // ...and so on for all your colors
      },
      fontFamily: {
        // We map Tailwind's 'font' utilities to your variables
        primary: 'var(--font-primary)',
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      spacing: {
        // We map Tailwind's 'spacing' utilities (p-*, m-*, w-*, h-*) to your variables
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
      },
      borderRadius: {
        // We map Tailwind's 'rounded' utilities to your variables
        sm: 'var(--ui-border-radius-sm)',
        DEFAULT: 'var(--ui-border-radius)', // 'rounded' will now use your variable
        lg: 'var(--ui-border-radius-lg)',
        full: 'var(--ui-border-radius-full)',
      },
      boxShadow: {
        // We map Tailwind's 'shadow' utilities to your variables
        sm: 'var(--ui-shadow-sm)',
        md: 'var(--ui-shadow-md)',
        lg: 'var(--ui-shadow-lg)',
        hover: 'var(--ui-shadow-hover)',
      },
      // ... we would continue this for line-height, font-size, etc.
    },
  },
  plugins: [],
};