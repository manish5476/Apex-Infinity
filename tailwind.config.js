// tailwind.config.js
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    "./src/**/*.{html,ts,css,scss}",
  ],
  important: true,
  theme: {
    extend: {
      // Map your existing font sizes
      fontSize: {
        'xs': 'var(--font-size-xs)',
        'sm': 'var(--font-size-sm)',
        'base': 'var(--font-size-base)',
        'md': 'var(--font-size-md)',
        'lg': 'var(--font-size-lg)',
        'xl': 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
        '5xl': 'var(--font-size-5xl)',
      },
      fontWeight: {
        'light': 'var(--font-weight-light)',
        'normal': 'var(--font-weight-normal)',
        'medium': 'var(--font-weight-medium)',
        'semibold': 'var(--font-weight-semibold)',
        'bold': 'var(--font-weight-bold)',
      },
      lineHeight: {
        'tight': 'var(--line-height-tight)',
        'normal': 'var(--line-height-normal)',
        'relaxed': 'var(--line-height-relaxed)',
      },
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
        '4xl': 'var(--spacing-4xl)',
        '5xl': 'var(--spacing-5xl)',
      },
      borderRadius: {
        'sm': 'var(--ui-border-radius-sm)',
        'DEFAULT': 'var(--ui-border-radius)',
        'lg': 'var(--ui-border-radius-lg)',
        'xl': 'var(--ui-border-radius-xl)',
      },
      borderWidth: {
        'DEFAULT': 'var(--ui-border-width)',
        'lg': 'var(--ui-border-width-lg)',
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        '3xl': 'var(--shadow-3xl)',
        '4xl': 'var(--shadow-4xl)',
        '5xl': 'var(--shadow-5xl)',
        '6xl': 'var(--shadow-6xl)',
      },
      // Colors mapped to YOUR existing CSS variables
      colors: {
        'accent': {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          tertiary: 'var(--accent-tertiary)',
          hover: 'var(--accent-hover)',
        },
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'error': 'var(--color-error)',
        'info': 'var(--color-info)',
        'disabled': 'var(--color-disabled)',
      },
      backgroundColor: {
        'primary': 'var(--bg-primary)',
        'secondary': 'var(--bg-secondary)',
        'ternary': 'var(--bg-ternary)',
        'glass': 'var(--glass-bg-c)',
        'hover': 'var(--component-bg-hover)',
        'active': 'var(--component-bg-active)',
      },
      textColor: {
        'primary': 'var(--text-primary)',
        'secondary': 'var(--text-secondary)',
        'tertiary': 'var(--text-tertiary)',
        'label': 'var(--text-label)',
        'disabled': 'var(--color-disabled-text)',
      },
      borderColor: {
        'primary': 'var(--border-primary)',
        'secondary': 'var(--border-secondary)',
        'glass': 'var(--glass-border-c)',
        'focus': 'var(--component-border-focus)',
        'divider': 'var(--component-divider)',
      },
      backdropBlur: {
        'glass': 'var(--glass-blur-c)',
      },
      // Animations
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.2, 0.9, 0.2, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.2, 0.9, 0.2, 1)',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.2, 0.9, 0.2, 1)',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { 
          from: { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
      },
      // Z-index
      zIndex: {
        'dropdown': 'var(--z-dropdown)',
        'sticky': 'var(--z-sticky)',
        'fixed': 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        'modal': 'var(--z-modal)',
        'toast': 'var(--z-toast)',
        'tooltip': 'var(--z-tooltip)',
      },
      // Opacity
      opacity: {
        'disabled': 'var(--state-disabled-opacity)',
        'loading': 'var(--state-loading-opacity)',
        'readonly': 'var(--state-readonly-opacity)',
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities, addComponents, theme }) {
      // Custom utilities that use YOUR token names
      addUtilities({
        '.glass-effect': {
          'background': 'var(--glass-bg-c)',
          'backdrop-filter': 'blur(var(--glass-blur-c))',
          '-webkit-backdrop-filter': 'blur(var(--glass-blur-c))',
          'border': 'var(--ui-border-width) solid var(--glass-border-c)',
          'box-shadow': 'var(--glass-shadow-c)',
        },
        '.surface-raised': {
          'background': 'var(--component-surface-raised)',
          'box-shadow': 'var(--shadow-lg)',
        },
        '.text-gradient-accent': {
          'background': 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.bg-gradient-accent': {
          'background': 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
        },
        '.focus-ring': {
          'outline': 'var(--focus-ring-width) solid var(--focus-ring-color)',
          'outline-offset': 'var(--focus-ring-offset)',
        },
        '.focus-ring-alt': {
          'outline': 'var(--focus-ring-width) solid var(--focus-ring-color-alt)',
          'outline-offset': 'var(--focus-ring-offset)',
        },
        '.custom-scrollbar': {
          '&::-webkit-scrollbar': {
            'width': '6px',
            'height': '6px',
          },
          '&::-webkit-scrollbar-track': {
            'background': 'var(--scroll-track-c)',
            'border-radius': '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            'background': 'var(--scroll-thumb-c)',
            'border-radius': '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            'background': 'var(--accent-primary)',
          },
        },
        '.transition-colors': {
          'transition': 'var(--transition-colors)',
        },
        '.transition-fast': {
          'transition': 'var(--transition-fast)',
        },
        '.transition-base': {
          'transition': 'var(--transition-base)',
        },
        '.transition-slow': {
          'transition': 'var(--transition-slow)',
        },
      });

      // Custom components
      addComponents({
        '.glass-card': {
          '@apply glass-effect rounded-lg': {},
          'transition': 'var(--transition-base)',
        },
        '.btn-primary': {
          '@apply bg-accent-primary text-white px-4 py-2 rounded font-medium transition-colors': {},
          '&:hover': {
            '@apply bg-accent-hover': {},
          },
        },
        '.badge-success': {
          'background': 'rgba(16, 185, 129, 0.1)',
          'color': 'var(--color-success)',
          '@apply inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium': {},
        },
        '.badge-warning': {
          'background': 'rgba(245, 158, 11, 0.1)',
          'color': 'var(--color-warning)',
          '@apply inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium': {},
        },
        '.badge-error': {
          'background': 'rgba(239, 68, 68, 0.1)',
          'color': 'var(--color-error)',
          '@apply inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium': {},
        },
      });
    }),
  ],
}
// // tailwind.config.js
// module.exports = {
//   content: [
//     "./src/**/*.{html,ts,css,scss}",
//   ],
//   important: true,
//   theme: {
//     extend: {
//       // Map your custom tokens to Tailwind classes
//       fontSize: {
//         'xs': 'var(--font-size-xs)',
//         'sm': 'var(--font-size-sm)',
//         'base': 'var(--font-size-base)',
//         'md': 'var(--font-size-md)',
//         'lg': 'var(--font-size-lg)',
//         'xl': 'var(--font-size-xl)',
//         '2xl': 'var(--font-size-2xl)',
//         '3xl': 'var(--font-size-3xl)',
//         '4xl': 'var(--font-size-4xl)',
//         '5xl': 'var(--font-size-5xl)',
//       },
//       fontWeight: {
//         'light': 'var(--font-weight-light)',
//         'normal': 'var(--font-weight-normal)',
//         'medium': 'var(--font-weight-medium)',
//         'semibold': 'var(--font-weight-semibold)',
//         'bold': 'var(--font-weight-bold)',
//       },
//       lineHeight: {
//         'tight': 'var(--line-height-tight)',
//         'normal': 'var(--line-height-normal)',
//         'relaxed': 'var(--line-height-relaxed)',
//       },
//       spacing: {
//         'xs': 'var(--spacing-xs)',
//         'sm': 'var(--spacing-sm)',
//         'md': 'var(--spacing-md)',
//         'lg': 'var(--spacing-lg)',
//         'xl': 'var(--spacing-xl)',
//         '2xl': 'var(--spacing-2xl)',
//         '3xl': 'var(--spacing-3xl)',
//         '4xl': 'var(--spacing-4xl)',
//         '5xl': 'var(--spacing-5xl)',
//       },
//       borderRadius: {
//         'sm': 'var(--ui-border-radius-sm)',
//         'DEFAULT': 'var(--ui-border-radius)',
//         'lg': 'var(--ui-border-radius-lg)',
//         'xl': 'var(--ui-border-radius-xl)',
//       },
//       borderWidth: {
//         'DEFAULT': 'var(--ui-border-width)',
//         'lg': 'var(--ui-border-width-lg)',
//       },
//       boxShadow: {
//         'xs': 'var(--shadow-xs)',
//         'sm': 'var(--shadow-sm)',
//         'md': 'var(--shadow-md)',
//         'lg': 'var(--shadow-lg)',
//         'xl': 'var(--shadow-xl)',
//         '2xl': 'var(--shadow-2xl)',
//         '3xl': 'var(--shadow-3xl)',
//         '4xl': 'var(--shadow-4xl)',
//         '5xl': 'var(--shadow-5xl)',
//         '6xl': 'var(--shadow-6xl)',
//       },
//       // Custom colors mapped to CSS variables
//       colors: {
//         primary: {
//           DEFAULT: 'var(--accent-primary)',
//           hover: 'var(--accent-hover)',
//         },
//         secondary: 'var(--accent-secondary)',
//         tertiary: 'var(--accent-tertiary)',
//         success: 'var(--color-success)',
//         warning: 'var(--color-warning)',
//         error: 'var(--color-error)',
//         info: 'var(--color-info)',
//         disabled: 'var(--color-disabled)',
//       },
//       backgroundColor: {
//         primary: 'var(--bg-primary)',
//         secondary: 'var(--bg-secondary)',
//         ternary: 'var(--bg-ternary)',
//         glass: 'var(--glass-bg-c)',
//       },
//       textColor: {
//         primary: 'var(--text-primary)',
//         secondary: 'var(--text-secondary)',
//         tertiary: 'var(--text-tertiary)',
//         label: 'var(--text-label)',
//         disabled: 'var(--color-disabled-text)',
//       },
//       borderColor: {
//         primary: 'var(--border-primary)',
//         secondary: 'var(--border-secondary)',
//         glass: 'var(--glass-border-c)',
//       },
//       backdropBlur: {
//         'glass': 'var(--glass-blur-c)',
//       },
//       // Custom animation classes
//       animation: {
//         'fade-in': 'fadeIn 0.2s cubic-bezier(0.2, 0.9, 0.2, 1)',
//         'slide-up': 'slideUp 0.3s cubic-bezier(0.2, 0.9, 0.2, 1)',
//         'fade-up': 'fadeUp 0.5s cubic-bezier(0.2, 0.9, 0.2, 1)',
//       },
//       keyframes: {
//         fadeIn: {
//           'from': { opacity: '0' },
//           'to': { opacity: '1' },
//         },
//         slideUp: {
//           'from': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
//           'to': { opacity: '1', transform: 'translateY(0) scale(1)' },
//         },
//         fadeUp: {
//           'from': { opacity: '0', transform: 'translateY(10px)' },
//           'to': { opacity: '1', transform: 'translateY(0)' },
//         },
//       },
//       // Custom utilities for transitions
//       transitionProperty: {
//         'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
//         'transform': 'transform',
//         'all': 'all',
//       },
//       transitionTimingFunction: {
//         'smooth': 'cubic-bezier(0.2, 0.9, 0.2, 1)',
//         'bouncy': 'cubic-bezier(0.23, 1, 0.32, 1)',
//       },
//       zIndex: {
//         'dropdown': 'var(--z-dropdown)',
//         'sticky': 'var(--z-sticky)',
//         'fixed': 'var(--z-fixed)',
//         'modal-backdrop': 'var(--z-modal-backdrop)',
//         'modal': 'var(--z-modal)',
//         'toast': 'var(--z-toast)',
//         'tooltip': 'var(--z-tooltip)',
//       },
//     },
//   },
//   plugins: [
//     // Custom plugin for theme-specific utilities
//     function({ addUtilities, theme }) {
//       const newUtilities = {
//         '.glass-effect': {
//           background: 'var(--glass-bg-c)',
//           backdropFilter: 'blur(var(--glass-blur-c))',
//           '-webkit-backdrop-filter': 'blur(var(--glass-blur-c))',
//           border: '1px solid var(--glass-border-c)',
//           boxShadow: 'var(--glass-shadow-c)',
//         },
//         '.focus-ring': {
//           outline: '2px solid var(--focus-ring-color)',
//           outlineOffset: 'var(--focus-ring-offset)',
//         },
//         '.focus-ring-alt': {
//           outline: '2px solid var(--focus-ring-color-alt)',
//           outlineOffset: 'var(--focus-ring-offset)',
//         },
//         '.gradient-primary': {
//           background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
//         },
//         '.gradient-secondary': {
//           background: 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-tertiary) 100%)',
//         },
//         '.text-gradient-primary': {
//           background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
//           '-webkit-background-clip': 'text',
//           '-webkit-text-fill-color': 'transparent',
//           'background-clip': 'text',
//         },
//         '.custom-scrollbar': {
//           '&::-webkit-scrollbar': {
//             width: '6px',
//             height: '6px',
//           },
//           '&::-webkit-scrollbar-track': {
//             background: 'var(--scroll-track-c)',
//             borderRadius: '3px',
//           },
//           '&::-webkit-scrollbar-thumb': {
//             background: 'var(--scroll-thumb-c)',
//             borderRadius: '3px',
//           },
//           '&::-webkit-scrollbar-thumb:hover': {
//             background: 'var(--accent-primary)',
//           },
//         },
//       };
//       addUtilities(newUtilities);
//     },
//   ],
// }

// // // tailwind.config.js

// // /** @type {import('tailwindcss').Config} */
// // module.exports = {
// //   content: [
// //     "./src/**/*.{html,ts}", // This tells Tailwind to scan all your Angular components
// //   ],
// //   theme: {
// //     extend: {
// //       // We map Tailwind's 'theme' to your CSS variables from themes.scss
// //       colors: {
// //         'theme-bg-primary': 'var(--theme-bg-primary)',
// //         'theme-bg-secondary': 'var(--theme-bg-secondary)',
// //         'theme-bg-ternary': 'var(--theme-bg-ternary)',
// //         'theme-text-primary': 'var(--theme-text-primary)',
// //         'theme-text-secondary': 'var(--theme-text-secondary)',
// //         'theme-text-label': 'var(--theme-text-label)',
// //         'theme-accent-primary': 'var(--theme-accent-primary)',
// //         'theme-accent-primary-hover': 'var(--theme-accent-primary-hover)',
// //         'theme-success': 'var(--theme-success-primary)',
// //         'theme-error': 'var(--theme-error-primary)',
// //         // ...and so on for all your colors
// //       },
// //       fontFamily: {
// //         // We map Tailwind's 'font' utilities to your variables
// //         primary: 'var(--font-primary)',
// //         heading: 'var(--font-heading)',
// //         body: 'var(--font-body)',
// //         mono: 'var(--font-mono)',
// //       },
// //       spacing: {
// //         // We map Tailwind's 'spacing' utilities (p-*, m-*, w-*, h-*) to your variables
// //         xs: 'var(--spacing-xs)',
// //         sm: 'var(--spacing-sm)',
// //         md: 'var(--spacing-md)',
// //         lg: 'var(--spacing-lg)',
// //         xl: 'var(--spacing-xl)',
// //         '2xl': 'var(--spacing-2xl)',
// //         '3xl': 'var(--spacing-3xl)',
// //       },
// //       borderRadius: {
// //         // We map Tailwind's 'rounded' utilities to your variables
// //         sm: 'var(--ui-border-radius-sm)',
// //         DEFAULT: 'var(--ui-border-radius)', // 'rounded' will now use your variable
// //         lg: 'var(--ui-border-radius-lg)',
// //         full: 'var(--ui-border-radius-full)',
// //       },
// //       boxShadow: {
// //         // We map Tailwind's 'shadow' utilities to your variables
// //         sm: 'var(--ui-shadow-sm)',
// //         md: 'var(--ui-shadow-md)',
// //         lg: 'var(--ui-shadow-lg)',
// //         hover: 'var(--ui-shadow-hover)',
// //       },
// //       // ... we would continue this for line-height, font-size, etc.
// //     },
// //   },
// //   plugins: [],
// // };