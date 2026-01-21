import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

export const MyPreset = definePreset(Aura, {
    // 1. PRIMITIVES: Connect to your CSS Variables
    primitive: {
        borderRadius: {
            none: '0',
            xs: 'var(--ui-border-radius-sm)',
            sm: 'var(--ui-border-radius)',
            md: 'var(--ui-border-radius)',
            lg: 'var(--ui-border-radius-lg)',
            xl: 'var(--ui-border-radius-xl)'
        }
    },

    // 2. SEMANTIC LAYER: The Design System Logic
    semantic: {
        transitionDuration: '0.2s',
        
        // ACCESSIBILITY: Focus Ring
        focusRing: {
            width: '2px',
            style: 'solid',
            color: 'var(--accent-primary)',
            offset: '1px',
            shadow: '0 0 0 2px var(--accent-focus)'
        },

        disabledOpacity: '0.6',
        iconSize: '0.875rem', // Slightly smaller icons for compact look
        anchorGutter: '0',

        // PRIMARY COLOR: Mapped to your Theme's "Accent"
        primary: {
            50: 'var(--accent-focus)',
            100: 'var(--accent-focus)',
            200: 'var(--accent-secondary)',
            300: 'var(--accent-secondary)',
            400: 'var(--accent-primary)',
            500: 'var(--accent-primary)',
            600: 'var(--accent-hover)',
            700: 'var(--accent-hover)',
            800: 'var(--accent-tertiary)',
            900: 'var(--accent-tertiary)',
            950: 'var(--accent-tertiary)'
        },

        // 3. FORM FIELDS: Compact Scale Logic
        formField: {
            // REDUCED PADDING for Smaller Height (~32px)
            paddingX: '0.65rem',       
            paddingY: '0.3rem',        // Reduced from 0.5rem
            
            borderRadius: 'var(--ui-border-radius)',
            
            // Remove default Aura shadow to keep it flat/clean
            focusRing: {
                width: '0',
                style: 'none',
                color: 'transparent',
                offset: '0',
                shadow: 'none'
            },
            transitionDuration: '0.2s'
        },

        // 4. COLOR SCHEMES
        // We map light/dark identically because your CSS Variables handle the switching.
        colorScheme: {
            light: {
                surface: {
                    0: 'var(--bg-secondary)',      // Component Background
                    50: 'var(--bg-primary)',       // Base Background
                    100: 'var(--bg-ternary)',
                    200: 'var(--border-primary)',  // Borders
                    300: 'var(--border-secondary)',
                    400: 'var(--text-tertiary)',
                    500: 'var(--text-secondary)',
                    600: 'var(--text-primary)',
                    700: 'var(--text-primary)',
                    800: 'var(--text-primary)',
                    900: 'var(--text-primary)',
                    950: 'var(--text-primary)'
                },
                primary: {
                    color: 'var(--accent-primary)',
                    contrastColor: '#ffffff',
                    hoverColor: 'var(--accent-hover)',
                    activeColor: 'var(--accent-hover)'
                },
                highlight: {
                    // Background for selected items in dropdowns
                    background: 'var(--accent-primary)',
                    focusBackground: 'var(--accent-hover)',
                    color: '#ffffff', // Force white text on selected items
                    focusColor: '#ffffff'
                },
                formField: {
                    // 5. BACKGROUND FIX: Ensure inputs are visible
                    background: 'var(--bg-secondary)', 
                    disabledBackground: 'var(--bg-ternary)',
                    filledBackground: 'var(--bg-ternary)',
                    
                    // Borders
                    borderColor: 'var(--border-primary)',
                    hoverBorderColor: 'var(--text-secondary)',
                    focusBorderColor: 'var(--accent-primary)',
                    invalidBorderColor: 'var(--color-error)',
                    
                    // Text Colors
                    color: 'var(--text-primary)',
                    disabledColor: 'var(--text-tertiary)',
                    placeholderColor: 'var(--text-tertiary)',
                    
                    // Icons (Datepicker calendar icon, Dropdown arrow)
                    iconColor: 'var(--text-secondary)',
                    
                    shadow: 'none'
                },
                text: {
                    color: 'var(--text-primary)',
                    hoverColor: 'var(--text-primary)',
                    mutedColor: 'var(--text-secondary)',
                    hoverMutedColor: 'var(--text-primary)'
                },
                overlay: {
                    select: {
                        background: 'var(--bg-secondary)', // Dropdown Panel BG
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)',
                        // shadow: 'var(--shadow-xl)'
                    },
                    popover: {
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)',
                        // shadow: 'var(--shadow-xl)'
                    }
                },
                list: {
                    option: {
                        // Dropdown List Items
                        focusBackground: 'var(--component-bg-hover)',
                        selectedBackground: 'var(--accent-primary)', 
                        selectedFocusBackground: 'var(--accent-hover)',
                        color: 'var(--text-primary)',
                        focusColor: 'var(--text-primary)',
                        selectedColor: '#ffffff', // White text when selected
                        selectedFocusColor: '#ffffff'
                    }
                }
            },
            // Clone configuration for Dark Mode (CSS Vars handle the values)
            dark: {
                surface: {
                    0: 'var(--bg-secondary)',
                    50: 'var(--bg-primary)',
                    100: 'var(--bg-ternary)',
                    200: 'var(--border-primary)',
                    300: 'var(--border-secondary)',
                    400: 'var(--text-tertiary)',
                    500: 'var(--text-secondary)',
                    600: 'var(--text-primary)',
                    700: 'var(--text-primary)',
                    800: 'var(--text-primary)',
                    900: 'var(--text-primary)',
                    950: 'var(--text-primary)'
                },
                primary: {
                    color: 'var(--accent-primary)',
                    contrastColor: '#ffffff',
                    hoverColor: 'var(--accent-hover)',
                    activeColor: 'var(--accent-hover)'
                },
                highlight: {
                    background: 'var(--accent-primary)',
                    focusBackground: 'var(--accent-hover)',
                    color: '#ffffff',
                    focusColor: '#ffffff'
                },
                formField: {
                    background: 'var(--bg-secondary)',
                    disabledBackground: 'var(--bg-ternary)',
                    filledBackground: 'var(--bg-ternary)',
                    borderColor: 'var(--border-primary)',
                    hoverBorderColor: 'var(--text-secondary)',
                    focusBorderColor: 'var(--accent-primary)',
                    invalidBorderColor: 'var(--color-error)',
                    color: 'var(--text-primary)',
                    disabledColor: 'var(--text-tertiary)',
                    placeholderColor: 'var(--text-tertiary)',
                    iconColor: 'var(--text-secondary)',
                    shadow: 'none'
                },
                text: {
                    color: 'var(--text-primary)',
                    hoverColor: 'var(--text-primary)',
                    mutedColor: 'var(--text-secondary)',
                    hoverMutedColor: 'var(--text-primary)'
                },
                overlay: {
                    select: {
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)',
                        // shadow: 'var(--shadow-xl)'
                    },
                    popover: {
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)',
                        // shadow: 'var(--shadow-xl)'
                    }
                },
                list: {
                    option: {
                        focusBackground: 'var(--component-bg-hover)',
                        selectedBackground: 'var(--accent-primary)',
                        selectedFocusBackground: 'var(--accent-hover)',
                        color: 'var(--text-primary)',
                        focusColor: 'var(--text-primary)',
                        selectedColor: '#ffffff',
                        selectedFocusColor: '#ffffff'
                    }
                }
            }
        }
    }
});

// import { definePreset } from '@primeng/themes';
// import Aura from '@primeng/themes/aura';

// export const MyPreset = definePreset(Aura, {
//     // 1. PRIMITIVES: Standardize sizes to your CSS variables
//     primitive: {
//         borderRadius: {
//             none: '0',
//             xs: 'var(--ui-border-radius-sm)',
//             sm: 'var(--ui-border-radius)',
//             md: 'var(--ui-border-radius)',
//             lg: 'var(--ui-border-radius-lg)',
//             xl: 'var(--ui-border-radius-xl)'
//         }
//         // Note: We don't need to redefine emerald/green/etc here 
//         // because we override the semantic layer below.
//     },

//     // 2. SEMANTIC: The Bridge between PrimeNG and Your Tokens
//     semantic: {
//         transitionDuration: '0.2s',
        
//         // Focus Ring (Accessibility)
//         focusRing: {
//             width: '2px',
//             style: 'solid',
//             color: 'var(--accent-primary)', // Uses your active theme accent
//             offset: '2px',
//             shadow: '0 0 0 2px var(--accent-focus)'
//         },

//         disabledOpacity: '0.6',
//         iconSize: '1rem',
//         anchorGutter: '0',

//         // 3. PRIMARY COLOR (Mapped to your Accent)
//         primary: {
//             50: 'var(--accent-focus)',
//             100: 'var(--accent-focus)',
//             200: 'var(--accent-secondary)',
//             300: 'var(--accent-secondary)',
//             400: 'var(--accent-primary)',
//             500: 'var(--accent-primary)', // Main Token
//             600: 'var(--accent-hover)',
//             700: 'var(--accent-hover)',
//             800: 'var(--accent-tertiary)',
//             900: 'var(--accent-tertiary)',
//             950: 'var(--accent-tertiary)'
//         },

//         // 4. FORM FIELDS (Compact Scale Enforced)
//         formField: {
//             paddingX: '0.75rem',       // 12px
//             paddingY: '0.375rem',      // Compact vertical padding
//             borderRadius: 'var(--ui-border-radius)',
//             focusRing: {
//                 width: '0', // We handle shadow manually in CSS
//                 style: 'none',
//                 color: 'transparent',
//                 offset: '0',
//                 shadow: 'none'
//             },
//             transitionDuration: '0.2s'
//         },

//         // 5. COLORSCHEME (The Magic)
//         // We map BOTH Light and Dark to the SAME variables.
//         // Why? Because your CSS class (.theme-dark) changes the variable values automatically.
//         colorScheme: {
//             light: {
//                 surface: {
//                     0: 'var(--bg-secondary)',      // Card Background
//                     50: 'var(--bg-primary)',       // App Background
//                     100: 'var(--bg-ternary)',      // Subtle Background
//                     200: 'var(--border-primary)',  // Borders
//                     300: 'var(--border-secondary)',
//                     400: 'var(--text-tertiary)',
//                     500: 'var(--text-secondary)',
//                     600: 'var(--text-primary)',
//                     700: 'var(--text-primary)',
//                     800: 'var(--text-primary)',
//                     900: 'var(--text-primary)',
//                     950: 'var(--text-primary)'
//                 },
//                 primary: {
//                     color: 'var(--accent-primary)',
//                     contrastColor: '#ffffff',
//                     hoverColor: 'var(--accent-hover)',
//                     activeColor: 'var(--accent-hover)'
//                 },
//                 highlight: {
//                     background: 'var(--accent-focus)',
//                     focusBackground: 'var(--component-bg-active)',
//                     color: 'var(--accent-primary)',
//                     focusColor: 'var(--accent-primary)'
//                 },
//                 mask: {
//                     background: 'rgba(0,0,0,0.6)',
//                     color: 'var(--text-primary)'
//                 },
//                 formField: {
//                     background: 'var(--bg-secondary)',
//                     disabledBackground: 'var(--bg-ternary)',
//                     filledBackground: 'var(--bg-ternary)',
//                     filledHoverBackground: 'var(--bg-ternary)',
//                     filledFocusBackground: 'var(--bg-secondary)',
//                     borderColor: 'var(--border-primary)',
//                     hoverBorderColor: 'var(--text-secondary)',
//                     focusBorderColor: 'var(--accent-primary)',
//                     invalidBorderColor: 'var(--color-error)',
//                     color: 'var(--text-primary)',
//                     disabledColor: 'var(--text-tertiary)',
//                     placeholderColor: 'var(--text-tertiary)',
//                     invalidPlaceholderColor: 'var(--color-error)',
//                     floatLabelColor: 'var(--text-secondary)',
//                     floatLabelFocusColor: 'var(--accent-primary)',
//                     floatLabelActiveColor: 'var(--text-secondary)',
//                     floatLabelInvalidColor: 'var(--color-error)',
//                     iconColor: 'var(--text-secondary)',
//                     shadow: 'none'
//                 },
//                 text: {
//                     color: 'var(--text-primary)',
//                     hoverColor: 'var(--text-primary)',
//                     mutedColor: 'var(--text-secondary)',
//                     hoverMutedColor: 'var(--text-primary)'
//                 },
//                 content: {
//                     background: 'var(--bg-secondary)',
//                     hoverBackground: 'var(--component-bg-hover)',
//                     borderColor: 'var(--border-primary)',
//                     color: 'var(--text-primary)',
//                     hoverColor: 'var(--text-primary)'
//                 },
//                 overlay: {
//                     select: {
//                         background: 'var(--bg-secondary)',
//                         borderColor: 'var(--border-primary)',
//                         color: 'var(--text-primary)',
//                         // height:''
//                         // shadow: 'var(--shadow-xl)'
//                     },
//                     popover: {
//                         background: 'var(--bg-secondary)',
//                         borderColor: 'var(--border-primary)',
//                         color: 'var(--text-primary)',
//                         // shadow: 'var(--shadow-xl)'
//                     },
//                     modal: {
//                         background: 'var(--bg-secondary)',
//                         borderColor: 'var(--border-primary)',
//                         color: 'var(--text-primary)',
//                         // shadow: 'var(--shadow-2xl)'
//                     }
//                 },
//                 list: {
//                     option: {
//                         focusBackground: 'var(--component-bg-hover)',
//                         selectedBackground: 'var(--accent-primary)',
//                         selectedFocusBackground: 'var(--accent-hover)',
//                         color: 'var(--text-primary)',
//                         focusColor: 'var(--text-primary)',
//                         selectedColor: '#ffffff', // Always white on accent
//                         selectedFocusColor: '#ffffff',
//                         icon: {
//                             color: 'var(--text-secondary)',
//                             focusColor: 'var(--text-primary)'
//                         }
//                     },
//                     optionGroup: {
//                         background: 'transparent',
//                         color: 'var(--text-tertiary)'
//                     }
//                 },
//                 navigation: {
//                     item: {
//                         focusBackground: 'var(--component-bg-hover)',
//                         activeBackground: 'var(--component-bg-active)',
//                         color: 'var(--text-primary)',
//                         focusColor: 'var(--text-primary)',
//                         activeColor: 'var(--accent-primary)',
//                         icon: {
//                             color: 'var(--text-secondary)',
//                             focusColor: 'var(--text-primary)',
//                             activeColor: 'var(--accent-primary)'
//                         }
//                     },
//                     submenuLabel: {
//                         background: 'transparent',
//                         color: 'var(--text-tertiary)'
//                     },
//                     submenuIcon: {
//                         color: 'var(--text-secondary)',
//                         focusColor: 'var(--text-primary)',
//                         activeColor: 'var(--accent-primary)'
//                     }
//                 }
//             },
//             // Since we use CSS variables, Dark Scheme is IDENTICAL to Light Scheme.
//             // The variables change values in the browser, PrimeNG just uses the variable name.
//             dark: {
//                 surface: {
//                     0: 'var(--bg-secondary)',
//                     50: 'var(--bg-primary)',
//                     100: 'var(--bg-ternary)',
//                     200: 'var(--border-primary)',
//                     300: 'var(--border-secondary)',
//                     400: 'var(--text-tertiary)',
//                     500: 'var(--text-secondary)',
//                     600: 'var(--text-primary)',
//                     700: 'var(--text-primary)',
//                     800: 'var(--text-primary)',
//                     900: 'var(--text-primary)',
//                     950: 'var(--text-primary)'
//                 },
//                 primary: {
//                     color: 'var(--accent-primary)',
//                     contrastColor: '#ffffff',
//                     hoverColor: 'var(--accent-hover)',
//                     activeColor: 'var(--accent-hover)'
//                 },
//                 highlight: {
//                     background: 'var(--accent-focus)',
//                     focusBackground: 'var(--component-bg-active)',
//                     color: 'var(--accent-primary)',
//                     focusColor: 'var(--accent-primary)'
//                 },
//                 mask: {
//                     background: 'rgba(0,0,0,0.6)',
//                     color: 'var(--text-primary)'
//                 },
//                 formField: {
//                     background: 'var(--bg-secondary)',
//                     disabledBackground: 'var(--bg-ternary)',
//                     filledBackground: 'var(--bg-ternary)',
//                     filledHoverBackground: 'var(--bg-ternary)',
//                     filledFocusBackground: 'var(--bg-secondary)',
//                     borderColor: 'var(--border-primary)',
//                     hoverBorderColor: 'var(--text-secondary)',
//                     focusBorderColor: 'var(--accent-primary)',
//                     invalidBorderColor: 'var(--color-error)',
//                     color: 'var(--text-primary)',
//                     disabledColor: 'var(--text-tertiary)',
//                     placeholderColor: 'var(--text-tertiary)',
//                     invalidPlaceholderColor: 'var(--color-error)',
//                     floatLabelColor: 'var(--text-secondary)',
//                     floatLabelFocusColor: 'var(--accent-primary)',
//                     floatLabelActiveColor: 'var(--text-secondary)',
//                     floatLabelInvalidColor: 'var(--color-error)',
//                     iconColor: 'var(--text-secondary)',
//                     shadow: 'none'
//                 },
//                 text: {
//                     color: 'var(--text-primary)',
//                     hoverColor: 'var(--text-primary)',
//                     mutedColor: 'var(--text-secondary)',
//                     hoverMutedColor: 'var(--text-primary)'
//                 },
//                 content: {
//                     background: 'var(--bg-secondary)',
//                     hoverBackground: 'var(--component-bg-hover)',
//                     borderColor: 'var(--border-primary)',
//                     color: 'var(--text-primary)',
//                     hoverColor: 'var(--text-primary)'
//                 },
//                 overlay: {
//                     select: {
//                         background: 'var(--bg-secondary)',
//                         borderColor: 'var(--border-primary)',
//                         color: 'var(--text-primary)',
//                         // shadow: 'var(--shadow-xl)'
//                     },
//                     popover: {
//                         background: 'var(--bg-secondary)',
//                         borderColor: 'var(--border-primary)',
//                         color: 'var(--text-primary)',
//                         // shadow: 'var(--shadow-xl)'
//                     },
//                     modal: {
//                         background: 'var(--bg-secondary)',
//                         borderColor: 'var(--border-primary)',
//                         color: 'var(--text-primary)',
//                          // shadow: 'var(--shadow-2xl)'
//                     }
//                 },
//                 list: {
//                     option: {
//                         focusBackground: 'var(--component-bg-hover)',
//                         selectedBackground: 'var(--accent-primary)',
//                         selectedFocusBackground: 'var(--accent-hover)',
//                         color: 'var(--text-primary)',
//                         focusColor: 'var(--text-primary)',
//                         selectedColor: '#ffffff',
//                         selectedFocusColor: '#ffffff',
//                         icon: {
//                             color: 'var(--text-secondary)',
//                             focusColor: 'var(--text-primary)'
//                         }
//                     },
//                     optionGroup: {
//                         background: 'transparent',
//                         color: 'var(--text-tertiary)'
//                     }
//                 },
//                 navigation: {
//                     item: {
//                         focusBackground: 'var(--component-bg-hover)',
//                         activeBackground: 'var(--component-bg-active)',
//                         color: 'var(--text-primary)',
//                         focusColor: 'var(--text-primary)',
//                         activeColor: 'var(--accent-primary)',
//                         icon: {
//                             color: 'var(--text-secondary)',
//                             focusColor: 'var(--text-primary)',
//                             activeColor: 'var(--accent-primary)'
//                         }
//                     },
//                     submenuLabel: {
//                         background: 'transparent',
//                         color: 'var(--text-tertiary)'
//                     },
//                     submenuIcon: {
//                         color: 'var(--text-secondary)',
//                         focusColor: 'var(--text-primary)',
//                         activeColor: 'var(--accent-primary)'
//                     }
//                 }
//             }
//         }
//     }
// });