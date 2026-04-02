// /**
//  * ============================================================================
//  * APEX CRM — PrimeNG Preset  v1.0
//  * ============================================================================
//  * A complete, production-grade PrimeNG theme preset built from scratch.
//  * Works with the Apex CRM multi-theme system (apex-themes-v2.scss).
//  *
//  * This preset defines ALL design tokens at 3 tiers:
//  *   • primitive  — raw color palette (no semantic meaning)
//  *   • semantic   — contextual tokens (primary, surface, form fields, focus)
//  *   • components — per-component token overrides (40+ components)
//  *
//  * SETUP (app.config.ts)
//  * ──────────────────────
//  * import { definePreset } from '@primeuix/themes';
//  * import Aura from '@primeuix/themes/aura';
//  * import { ApexPreset } from './apex-preset';
//  *
//  * providePrimeNG({
//  *   theme: {
//  *     preset: ApexPreset,
//  *     options: {
//  *       darkModeSelector: '.theme-dark, .theme-neon-eclipse, .theme-obsidian-rose,
//  *         .theme-deep-emerald, .theme-midnight-bronze, .theme-molten-ember,
//  *         .theme-neon-void, .theme-obsidian-jade, .theme-solar-flare,
//  *         .theme-nebula, .theme-luxury, .theme-abyssal-coral,
//  *         .theme-crimson-noir, .theme-void-steel, .theme-aurora-glass,
//  *         .theme-horizon, .theme-amethyst-dusk',
//  *       cssLayer: {
//  *         name: 'primeng',
//  *         order: 'theme, base, primeng'
//  *       }
//  *     }
//  *   }
//  * })
//  *
//  * HOW APEX THEMES INTEGRATE
//  * ──────────────────────────
//  * The Apex theme system (apex-themes-v2.scss) sets CSS variables like:
//  *   --accent-primary, --bg-primary, --text-primary, etc.
//  *
//  * This preset uses those same CSS variables as its token values, so when
//  * a theme class (e.g. .theme-luxury) is applied to <html>, both this preset
//  * and all Apex UI classes change together automatically.
//  *
//  * NOTE: PrimeNG preset tokens must be static strings or references to other
//  * preset tokens. They cannot use var() directly — that's handled in the
//  * CSS variable bridge (apex-primeng-theme.scss). This preset sets the
//  * structural shape/relationships between tokens correctly so that the bridge
//  * overrides take effect cleanly.
//  * ============================================================================
//  */

// import { definePreset } from '@primeuix/themes';
// import Aura from '@primeuix/themes/aura';

// // ─── TYPE HELPERS ────────────────────────────────────────────────────────────
// // These help TypeScript understand the preset shape
// type ColorScale = {
//   50: string; 100: string; 200: string; 300: string; 400: string;
//   500: string; 600: string; 700: string; 800: string; 900: string; 950: string;
// };

// // ─── PRIMITIVE PALETTE ───────────────────────────────────────────────────────
// // Raw color values with no semantic meaning.
// // These map to the Apex accent system shades.
// // For runtime theme switching, the CSS variable bridge overrides these.

// const primitive = {
//   borderRadius: {
//     none: '0',
//     xs:   '4px',
//     sm:   '6px',
//     md:   '10px',
//     lg:   '16px',
//     xl:   '20px',
//     '2xl': '24px',
//     '3xl': '28px',
//     full: '9999px',
//   },

//   // Accent / Primary palette — indigo-violet default (Dark Default theme feel)
//   // Runtime: overridden by apex-primeng-theme.scss per active theme
//   apex: {
//     50:  '#eef2ff',
//     100: '#e0e7ff',
//     200: '#c7d2fe',
//     300: '#a5b4fc',
//     400: '#818cf8',
//     500: '#6366f1',
//     600: '#4f46e5',
//     700: '#4338ca',
//     800: '#3730a3',
//     900: '#312e81',
//     950: '#1e1b4b',
//   } as ColorScale,

//   // Surface scale — zinc dark (default dark surface)
//   surface: {
//     0:   '#ffffff',
//     50:  '#fafafa',
//     100: '#f4f4f5',
//     200: '#e4e4e7',
//     300: '#d4d4d8',
//     400: '#a1a1aa',
//     500: '#71717a',
//     600: '#52525b',
//     700: '#3f3f46',
//     800: '#27272a',
//     900: '#18181b',
//     950: '#09090b',
//   } as ColorScale,

//   // Status primitives
//   green: {
//     50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
//     400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
//     800: '#166534', 900: '#14532d', 950: '#052e16',
//   },
//   amber: {
//     50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
//     400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
//     800: '#92400e', 900: '#78350f', 950: '#451a03',
//   },
//   red: {
//     50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
//     400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
//     800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
//   },
//   sky: {
//     50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
//     400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
//     800: '#075985', 900: '#0c4a6e', 950: '#082f49',
//   },
// };

// // ─── SEMANTIC TOKENS ─────────────────────────────────────────────────────────
// // Context-aware tokens. The colorScheme block is critical — it defines
// // both light and dark values. Apex overrides these via CSS variables.

// const semantic = {
//   transitionDuration: '0.18s',
//   focusRing: {
//     width:  '2px',
//     style:  'solid',
//     color:  '{primary.color}',
//     offset: '2px',
//     shadow: 'none',
//   },
//   disabledOpacity: '0.55',
//   iconSize:        '1rem',
//   anchoredZIndex:  'auto',

//   // Primary maps to our apex primitive
//   primary: {
//     50:  '{apex.50}',
//     100: '{apex.100}',
//     200: '{apex.200}',
//     300: '{apex.300}',
//     400: '{apex.400}',
//     500: '{apex.500}',
//     600: '{apex.600}',
//     700: '{apex.700}',
//     800: '{apex.800}',
//     900: '{apex.900}',
//     950: '{apex.950}',
//   },

//   // Form fields — shared by all input components
//   formField: {
//     paddingX:           '0.75rem',
//     paddingY:           '0.5rem',
//     borderRadius:       '{border.radius.md}',
//     focusRing: {
//       width:  '2px',
//       style:  'solid',
//       color:  '{primary.color}',
//       offset: '2px',
//       shadow: '0 0 0 4px {primary.color}20',
//     },
//     transitionDuration: '0.18s',
//     sm: {
//       fontSize: '0.75rem',
//       paddingX: '0.625rem',
//       paddingY: '0.375rem',
//     },
//     lg: {
//       fontSize: '1rem',
//       paddingX: '0.875rem',
//       paddingY: '0.625rem',
//     },
//   },

//   list: {
//     padding:       '0.375rem',
//     gap:           '2px',
//     header: {
//       padding: '0.5rem 0.75rem',
//     },
//     option: {
//       padding:      '0.5rem 0.75rem',
//       borderRadius: '{border.radius.sm}',
//     },
//     optionGroup: {
//       padding:     '0.5rem 0.75rem',
//       fontWeight:  '700',
//     },
//   },

//   content: {
//     borderRadius: '{border.radius.lg}',
//   },

//   mask: {
//     transitionDuration: '0.22s',
//   },

//   navigation: {
//     list: {
//       padding:      '0.375rem',
//       gap:          '2px',
//     },
//     item: {
//       padding:      '0.5rem 0.75rem',
//       borderRadius: '{border.radius.sm}',
//       gap:          '0.5rem',
//     },
//     submenuLabel: {
//       padding:    '0.5rem 0.75rem',
//       fontWeight: '700',
//     },
//     submenuIcon: {
//       size: '0.75rem',
//     },
//   },

//   overlay: {
//     select: {
//       borderRadius: '{border.radius.lg}',
//       shadow:       '0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)',
//     },
//     popover: {
//       borderRadius: '{border.radius.lg}',
//       shadow:       '0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)',
//     },
//     modal: {
//       borderRadius: '{border.radius.xl}',
//       shadow:       '0 8px 24px rgba(0,0,0,0.14), 0 16px 48px rgba(0,0,0,0.10)',
//     },
//     navigation: {
//       shadow: '0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)',
//     },
//   },

//   colorScheme: {
//     light: {
//       surface: {
//         0:   '#ffffff',
//         50:  '#f8fafc',
//         100: '#f1f5f9',
//         200: '#e2e8f0',
//         300: '#cbd5e1',
//         400: '#94a3b8',
//         500: '#64748b',
//         600: '#475569',
//         700: '#334155',
//         800: '#1e293b',
//         900: '#0f172a',
//         950: '#020617',
//       },
//       primary: {
//         color:         '{primary.500}',
//         contrastColor: '#ffffff',
//         hoverColor:    '{primary.600}',
//         activeColor:   '{primary.700}',
//       },
//       highlight: {
//         background:        '{primary.50}',
//         focusBackground:   '{primary.100}',
//         color:             '{primary.700}',
//         focusColor:        '{primary.800}',
//       },
//       mask: {
//         background: 'rgba(0,0,0,0.5)',
//         color:      '{surface.200}',
//       },
//       formField: {
//         background:           '{surface.0}',
//         disabledBackground:   '{surface.100}',
//         filledBackground:     '{surface.50}',
//         filledHoverBackground: '{surface.100}',
//         filledFocusBackground: '{surface.50}',
//         borderColor:          '{surface.300}',
//         hoverBorderColor:     '{surface.400}',
//         focusBorderColor:     '{primary.color}',
//         invalidBorderColor:   '{red.600}',
//         color:                '{surface.900}',
//         disabledColor:        '{surface.400}',
//         placeholderColor:     '{surface.400}',
//         invalidPlaceholderColor: '{red.400}',
//         floatLabelColor:      '{surface.400}',
//         floatLabelFocusColor: '{primary.600}',
//         floatLabelActiveColor: '{surface.400}',
//         floatLabelInvalidColor: '{red.600}',
//         iconColor:            '{surface.400}',
//         shadow:               'none',
//       },
//       text: {
//         color:          '{surface.900}',
//         hoverColor:     '{surface.950}',
//         mutedColor:     '{surface.500}',
//         hoverMutedColor: '{surface.600}',
//       },
//       content: {
//         background:       '{surface.0}',
//         hoverBackground:  '{surface.100}',
//         borderColor:      '{surface.200}',
//         color:            '{surface.700}',
//         hoverColor:       '{surface.800}',
//       },
//       overlay: {
//         select: {
//           background:  '{surface.0}',
//           borderColor: '{surface.200}',
//           color:       '{surface.700}',
//         },
//         popover: {
//           background:  '{surface.0}',
//           borderColor: '{surface.200}',
//           color:       '{surface.700}',
//         },
//         modal: {
//           background:  '{surface.0}',
//           borderColor: '{surface.200}',
//           color:       '{surface.700}',
//         },
//       },
//       list: {
//         option: {
//           focusBackground:        '{surface.100}',
//           selectedBackground:     '{primary.50}',
//           selectedFocusBackground: '{primary.100}',
//           color:                  '{surface.700}',
//           focusColor:             '{surface.800}',
//           selectedColor:          '{primary.700}',
//           selectedFocusColor:     '{primary.800}',
//           icon: {
//             color:      '{surface.400}',
//             focusColor: '{surface.500}',
//           },
//         },
//         optionGroup: {
//           background: 'transparent',
//           color:      '{surface.400}',
//         },
//       },
//       navigation: {
//         item: {
//           focusBackground:  '{surface.100}',
//           activeBackground: '{primary.50}',
//           color:            '{surface.600}',
//           focusColor:       '{surface.700}',
//           activeColor:      '{primary.600}',
//           icon: {
//             color:       '{surface.400}',
//             focusColor:  '{surface.500}',
//             activeColor: '{primary.500}',
//           },
//         },
//         submenuLabel: {
//           background: 'transparent',
//           color:      '{surface.400}',
//         },
//         submenuIcon: {
//           color:       '{surface.400}',
//           focusColor:  '{surface.500}',
//           activeColor: '{primary.500}',
//         },
//       },
//     },

//     dark: {
//       surface: {
//         0:   '#ffffff',
//         50:  '#fafafa',
//         100: '#f4f4f5',
//         200: '#e4e4e7',
//         300: '#d4d4d8',
//         400: '#a1a1aa',
//         500: '#71717a',
//         600: '#52525b',
//         700: '#3f3f46',
//         800: '#27272a',
//         900: '#18181b',
//         950: '#09090b',
//       },
//       primary: {
//         color:         '{primary.400}',
//         contrastColor: '{surface.900}',
//         hoverColor:    '{primary.300}',
//         activeColor:   '{primary.200}',
//       },
//       highlight: {
//         background:        '{primary.950}',
//         focusBackground:   '{primary.900}',
//         color:             '{primary.300}',
//         focusColor:        '{primary.200}',
//       },
//       mask: {
//         background: 'rgba(0,0,0,0.6)',
//         color:      '{surface.200}',
//       },
//       formField: {
//         background:           '{surface.950}',
//         disabledBackground:   '{surface.800}',
//         filledBackground:     '{surface.800}',
//         filledHoverBackground: '{surface.700}',
//         filledFocusBackground: '{surface.800}',
//         borderColor:          '{surface.700}',
//         hoverBorderColor:     '{surface.600}',
//         focusBorderColor:     '{primary.color}',
//         invalidBorderColor:   '{red.400}',
//         color:                '{surface.50}',
//         disabledColor:        '{surface.500}',
//         placeholderColor:     '{surface.500}',
//         invalidPlaceholderColor: '{red.400}',
//         floatLabelColor:      '{surface.500}',
//         floatLabelFocusColor: '{primary.400}',
//         floatLabelActiveColor: '{surface.400}',
//         floatLabelInvalidColor: '{red.400}',
//         iconColor:            '{surface.500}',
//         shadow:               'none',
//       },
//       text: {
//         color:          '{surface.50}',
//         hoverColor:     '{surface.0}',
//         mutedColor:     '{surface.400}',
//         hoverMutedColor: '{surface.300}',
//       },
//       content: {
//         background:       '{surface.900}',
//         hoverBackground:  '{surface.800}',
//         borderColor:      '{surface.700}',
//         color:            '{surface.100}',
//         hoverColor:       '{surface.0}',
//       },
//       overlay: {
//         select: {
//           background:  '{surface.900}',
//           borderColor: '{surface.700}',
//           color:       '{surface.100}',
//         },
//         popover: {
//           background:  '{surface.900}',
//           borderColor: '{surface.700}',
//           color:       '{surface.100}',
//         },
//         modal: {
//           background:  '{surface.900}',
//           borderColor: '{surface.700}',
//           color:       '{surface.100}',
//         },
//       },
//       list: {
//         option: {
//           focusBackground:        '{surface.800}',
//           selectedBackground:     '{primary.950}',
//           selectedFocusBackground: '{primary.900}',
//           color:                  '{surface.300}',
//           focusColor:             '{surface.100}',
//           selectedColor:          '{primary.300}',
//           selectedFocusColor:     '{primary.200}',
//           icon: {
//             color:      '{surface.500}',
//             focusColor: '{surface.400}',
//           },
//         },
//         optionGroup: {
//           background: 'transparent',
//           color:      '{surface.500}',
//         },
//       },
//       navigation: {
//         item: {
//           focusBackground:  '{surface.800}',
//           activeBackground: '{primary.950}',
//           color:            '{surface.400}',
//           focusColor:       '{surface.200}',
//           activeColor:      '{primary.300}',
//           icon: {
//             color:       '{surface.500}',
//             focusColor:  '{surface.400}',
//             activeColor: '{primary.400}',
//           },
//         },
//         submenuLabel: {
//           background: 'transparent',
//           color:      '{surface.500}',
//         },
//         submenuIcon: {
//           color:       '{surface.500}',
//           focusColor:  '{surface.400}',
//           activeColor: '{primary.400}',
//         },
//       },
//     },
//   },
// };

// // ─── COMPONENT TOKENS ────────────────────────────────────────────────────────
// // Per-component overrides. These map to the semantic tokens above.
// // Format exactly matches PrimeNG's Aura preset component shape.

// const components = {

//   // ── ACCORDION ──────────────────────────────────────────────────────────────
//   accordion: {
//     transitionDuration: '{transition.duration}',
//     panel: {
//       borderWidth: '1px',
//       borderColor: '{content.border.color}',
//     },
//     header: {
//       color:            '{text.muted.color}',
//       hoverColor:       '{text.color}',
//       activeColor:      '{primary.color}',
//       activeHoverColor: '{primary.hover.color}',
//       padding:          '1rem 1.25rem',
//       fontWeight:       '600',
//       borderRadius:     '{content.border.radius}',
//       borderWidth:      '0',
//       borderColor:      'transparent',
//       background:       '{content.background}',
//       hoverBackground:  '{content.hover.background}',
//       activeBackground: '{content.background}',
//       activeHoverBackground: '{content.hover.background}',
//       focusRing: {
//         width:  '{focus.ring.width}',
//         style:  '{focus.ring.style}',
//         color:  '{focus.ring.color}',
//         offset: '{focus.ring.offset}',
//         shadow: 'none',
//       },
//       toggleIcon: {
//         color:            '{text.muted.color}',
//         hoverColor:       '{text.color}',
//         activeColor:      '{primary.color}',
//         activeHoverColor: '{primary.hover.color}',
//       },
//     },
//     content: {
//       borderWidth:  '1px',
//       borderColor:  '{content.border.color}',
//       background:   '{content.background}',
//       color:        '{text.muted.color}',
//       padding:      '0.75rem 1.25rem 1rem',
//     },
//   },

//   // ── AUTOCOMPLETE ───────────────────────────────────────────────────────────
//   autocomplete: {
//     background:          '{form.field.background}',
//     disabledBackground:  '{form.field.disabled.background}',
//     filledBackground:    '{form.field.filled.background}',
//     filledHoverBackground: '{form.field.filled.hover.background}',
//     filledFocusBackground: '{form.field.filled.focus.background}',
//     borderColor:         '{form.field.border.color}',
//     hoverBorderColor:    '{form.field.hover.border.color}',
//     focusBorderColor:    '{form.field.focus.border.color}',
//     invalidBorderColor:  '{form.field.invalid.border.color}',
//     color:               '{form.field.color}',
//     disabledColor:       '{form.field.disabled.color}',
//     placeholderColor:    '{form.field.placeholder.color}',
//     shadow:              '{form.field.shadow}',
//     paddingX:            '{form.field.padding.x}',
//     paddingY:            '{form.field.padding.y}',
//     borderRadius:        '{form.field.border.radius}',
//     focusRing: {
//       width:  '{form.field.focus.ring.width}',
//       style:  '{form.field.focus.ring.style}',
//       color:  '{form.field.focus.ring.color}',
//       offset: '{form.field.focus.ring.offset}',
//       shadow: '{form.field.focus.ring.shadow}',
//     },
//     transitionDuration: '{form.field.transition.duration}',
//     overlay: {
//       background:   '{overlay.select.background}',
//       borderColor:  '{overlay.select.border.color}',
//       borderRadius: '{overlay.select.border.radius}',
//       color:        '{overlay.select.color}',
//       shadow:       '{overlay.select.shadow}',
//     },
//     list: {
//       padding:   '{list.padding}',
//       gap:       '{list.gap}',
//       header: {
//         padding: '{list.header.padding}',
//       },
//     },
//     option: {
//       focusBackground:         '{list.option.focus.background}',
//       selectedBackground:      '{list.option.selected.background}',
//       selectedFocusBackground: '{list.option.selected.focus.background}',
//       color:                   '{list.option.color}',
//       focusColor:              '{list.option.focus.color}',
//       selectedColor:           '{list.option.selected.color}',
//       selectedFocusColor:      '{list.option.selected.focus.color}',
//       padding:                 '{list.option.padding}',
//       borderRadius:            '{list.option.border.radius}',
//     },
//     optionGroup: {
//       background:  '{list.option.group.background}',
//       color:       '{list.option.group.color}',
//       fontWeight:  '{list.option.group.font.weight}',
//       padding:     '{list.option.group.padding}',
//     },
//     emptyMessagePadding: '0.625rem 0.875rem',
//     chipBorderRadius: '999px',
//   },

//   // ── AVATAR ─────────────────────────────────────────────────────────────────
//   avatar: {
//     width:       '2.5rem',
//     height:      '2.5rem',
//     fontSize:    '1rem',
//     background:  '{primary.50}',
//     color:       '{primary.700}',
//     borderRadius: '50%',
//     group: {
//       borderColor:  '{content.background}',
//       offset:       '-0.75rem',
//     },
//     lg: {
//       width:    '3rem',
//       height:   '3rem',
//       fontSize: '1.25rem',
//     },
//     xl: {
//       width:    '4rem',
//       height:   '4rem',
//       fontSize: '1.5rem',
//     },
//   },

//   // ── BADGE ──────────────────────────────────────────────────────────────────
//   badge: {
//     borderRadius:  '999px',
//     padding:       '0 0.5rem',
//     minWidth:      '1.25rem',
//     height:        '1.25rem',
//     fontSize:      '0.65rem',
//     fontWeight:    '700',
//     dotSize:       '0.5rem',
//     sm: {
//       fontSize: '0.6rem',
//       minWidth: '1rem',
//       height:   '1rem',
//     },
//     lg: {
//       fontSize: '0.75rem',
//       minWidth: '1.5rem',
//       height:   '1.5rem',
//     },
//     xl: {
//       fontSize: '0.875rem',
//       minWidth: '1.75rem',
//       height:   '1.75rem',
//     },
//     primary: {
//       background: '{primary.color}',
//       color:      '{primary.contrast.color}',
//     },
//     secondary: {
//       background: '{content.hover.background}',
//       color:      '{text.muted.color}',
//     },
//     success: {
//       background: 'rgba(34,197,94,1)',
//       color:      '#ffffff',
//     },
//     info: {
//       background: 'rgba(14,165,233,1)',
//       color:      '#ffffff',
//     },
//     warn: {
//       background: 'rgba(245,158,11,1)',
//       color:      '#ffffff',
//     },
//     danger: {
//       background: 'rgba(239,68,68,1)',
//       color:      '#ffffff',
//     },
//     contrast: {
//       background: '{text.color}',
//       color:      '{content.background}',
//     },
//   },

//   // ── BREADCRUMB ─────────────────────────────────────────────────────────────
//   breadcrumb: {
//     padding:            '0.75rem 1rem',
//     background:         '{content.background}',
//     gap:                '0.5rem',
//     transitionDuration: '{transition.duration}',
//     item: {
//       color:       '{text.muted.color}',
//       hoverColor:  '{text.color}',
//       borderRadius: '4px',
//       gap:          '0.375rem',
//       icon: {
//         color:      '{text.muted.color}',
//         hoverColor: '{text.color}',
//       },
//       focusRing: {
//         width:  '{focus.ring.width}',
//         style:  '{focus.ring.style}',
//         color:  '{focus.ring.color}',
//         offset: '{focus.ring.offset}',
//         shadow: 'none',
//       },
//     },
//     separator: {
//       color: '{text.muted.color}',
//     },
//   },

//   // ── BUTTON ─────────────────────────────────────────────────────────────────
//   button: {
//     borderRadius:       '{border.radius.md}',
//     roundedBorderRadius: '999px',
//     gap:                '0.5rem',
//     paddingX:           '1rem',
//     paddingY:           '0.5rem',
//     iconOnlyWidth:      '2.5rem',
//     labelFontWeight:    '600',
//     raisedShadow:       '0 1px 3px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
//     focusRing: {
//       width:  '{focus.ring.width}',
//       style:  '{focus.ring.style}',
//       offset: '{focus.ring.offset}',
//     },
//     transitionDuration: '{transition.duration}',
//     sm: {
//       fontSize:     '0.75rem',
//       paddingX:     '0.75rem',
//       paddingY:     '0.375rem',
//       iconOnlyWidth: '2rem',
//     },
//     lg: {
//       fontSize:     '1rem',
//       paddingX:     '1.25rem',
//       paddingY:     '0.625rem',
//       iconOnlyWidth: '3rem',
//     },
//     primary: {
//       background:       '{primary.color}',
//       hoverBackground:  '{primary.hover.color}',
//       activeBackground: '{primary.active.color}',
//       borderColor:      '{primary.color}',
//       hoverBorderColor: '{primary.hover.color}',
//       activeBorderColor: '{primary.active.color}',
//       color:            '{primary.contrast.color}',
//       hoverColor:       '{primary.contrast.color}',
//       activeColor:      '{primary.contrast.color}',
//       focusRing: {
//         color:  '{primary.color}',
//         shadow: '0 0 0 4px {primary.color}20',
//       },
//     },
//     secondary: {
//       background:       '{content.hover.background}',
//       hoverBackground:  '{content.border.color}',
//       activeBackground: '{content.border.color}',
//       borderColor:      '{content.border.color}',
//       hoverBorderColor: '{content.border.color}',
//       activeBorderColor: '{content.border.color}',
//       color:            '{text.muted.color}',
//       hoverColor:       '{text.color}',
//       activeColor:      '{text.color}',
//       focusRing: {
//         color:  '{primary.color}',
//         shadow: '0 0 0 4px {primary.color}20',
//       },
//     },
//     success: {
//       background:       '{green.600}',
//       hoverBackground:  '{green.700}',
//       activeBackground: '{green.800}',
//       borderColor:      '{green.600}',
//       hoverBorderColor: '{green.700}',
//       activeBorderColor: '{green.800}',
//       color:            '#ffffff',
//       hoverColor:       '#ffffff',
//       activeColor:      '#ffffff',
//       focusRing: {
//         color:  '{green.600}',
//         shadow: '0 0 0 4px {green.600}20',
//       },
//     },
//     info: {
//       background:       '{sky.600}',
//       hoverBackground:  '{sky.700}',
//       activeBackground: '{sky.800}',
//       borderColor:      '{sky.600}',
//       hoverBorderColor: '{sky.700}',
//       activeBorderColor: '{sky.800}',
//       color:            '#ffffff',
//       hoverColor:       '#ffffff',
//       activeColor:      '#ffffff',
//       focusRing: {
//         color:  '{sky.600}',
//         shadow: '0 0 0 4px {sky.600}20',
//       },
//     },
//     warn: {
//       background:       '{amber.500}',
//       hoverBackground:  '{amber.600}',
//       activeBackground: '{amber.700}',
//       borderColor:      '{amber.500}',
//       hoverBorderColor: '{amber.600}',
//       activeBorderColor: '{amber.700}',
//       color:            '#ffffff',
//       hoverColor:       '#ffffff',
//       activeColor:      '#ffffff',
//       focusRing: {
//         color:  '{amber.500}',
//         shadow: '0 0 0 4px {amber.500}20',
//       },
//     },
//     danger: {
//       background:       '{red.600}',
//       hoverBackground:  '{red.700}',
//       activeBackground: '{red.800}',
//       borderColor:      '{red.600}',
//       hoverBorderColor: '{red.700}',
//       activeBorderColor: '{red.800}',
//       color:            '#ffffff',
//       hoverColor:       '#ffffff',
//       activeColor:      '#ffffff',
//       focusRing: {
//         color:  '{red.600}',
//         shadow: '0 0 0 4px {red.600}20',
//       },
//     },
//     contrast: {
//       background:       '{text.color}',
//       hoverBackground:  '{text.hover.color}',
//       activeBackground: '{text.muted.color}',
//       borderColor:      '{text.color}',
//       hoverBorderColor: '{text.hover.color}',
//       activeBorderColor: '{text.muted.color}',
//       color:            '{content.background}',
//       hoverColor:       '{content.background}',
//       activeColor:      '{content.background}',
//       focusRing: {
//         color:  '{text.color}',
//         shadow: '0 0 0 4px {primary.color}20',
//       },
//     },
//   },

//   // ── CARD ───────────────────────────────────────────────────────────────────
//   card: {
//     background:   '{content.background}',
//     borderRadius: '{content.border.radius}',
//     color:        '{text.color}',
//     shadow:       '0 1px 3px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)',
//     body: {
//       padding: '1.5rem',
//       gap:     '0.75rem',
//     },
//     caption: {
//       gap: '0.375rem',
//     },
//     title: {
//       fontSize:   '1rem',
//       fontWeight: '600',
//     },
//     subtitle: {
//       color: '{text.muted.color}',
//     },
//   },

//   // ── CHECKBOX ───────────────────────────────────────────────────────────────
//   checkbox: {
//     borderRadius:           '{border.radius.sm}',
//     width:                  '1.125rem',
//     height:                 '1.125rem',
//     background:             '{form.field.background}',
//     checkedBackground:      '{primary.color}',
//     checkedHoverBackground: '{primary.hover.color}',
//     disabledBackground:     '{form.field.disabled.background}',
//     filledBackground:       '{form.field.filled.background}',
//     borderColor:            '{form.field.border.color}',
//     hoverBorderColor:       '{form.field.border.color}',
//     focusBorderColor:       '{primary.color}',
//     checkedBorderColor:     '{primary.color}',
//     checkedHoverBorderColor: '{primary.hover.color}',
//     checkedFocusBorderColor: '{primary.color}',
//     checkedDisabledBorderColor: '{form.field.disabled.background}',
//     invalidBorderColor:     '{form.field.invalid.border.color}',
//     shadow:                 'none',
//     focusRing: {
//       width:  '{focus.ring.width}',
//       style:  '{focus.ring.style}',
//       color:  '{focus.ring.color}',
//       offset: '{focus.ring.offset}',
//       shadow: '0 0 0 4px {primary.color}20',
//     },
//     transitionDuration: '{transition.duration}',
//     icon: {
//       size:              '0.75rem',
//       color:             '{primary.contrast.color}',
//       checkedColor:      '{primary.contrast.color}',
//       checkedHoverColor: '{primary.contrast.color}',
//       disabledColor:     '{form.field.disabled.color}',
//     },
//     sm: { width: '0.875rem', height: '0.875rem' },
//     lg: { width: '1.375rem', height: '1.375rem' },
//   },

//   // ── CHIP ───────────────────────────────────────────────────────────────────
//   chip: {
//     borderRadius:         '999px',
//     paddingX:             '0.75rem',
//     paddingY:             '0.25rem',
//     gap:                  '0.375rem',
//     background:           '{content.hover.background}',
//     color:                '{text.muted.color}',
//     iconSize:             '0.875rem',
//     image: {
//       width:  '1.75rem',
//       height: '1.75rem',
//     },
//     removeIcon: {
//       size: '0.875rem',
//       focusRing: {
//         width:  '{focus.ring.width}',
//         style:  '{focus.ring.style}',
//         color:  '{focus.ring.color}',
//         offset: '{focus.ring.offset}',
//         shadow: '0 0 0 4px {primary.color}20',
//       },
//     },
//     transitionDuration: '{transition.duration}',
//   },

//   // ── DATEPICKER ─────────────────────────────────────────────────────────────
//   datepicker: {
//     transitionDuration: '{transition.duration}',
//     panel: {
//       background:   '{overlay.select.background}',
//       borderColor:  '{overlay.select.border.color}',
//       color:        '{overlay.select.color}',
//       borderRadius: '{overlay.select.border.radius}',
//       shadow:       '{overlay.select.shadow}',
//       padding:      '1rem',
//     },
//     header: {
//       background:  'transparent',
//       borderColor: '{content.border.color}',
//       color:       '{text.color}',
//       padding:     '0 0 0.75rem',
//     },
//     title: {
//       gap:        '0.375rem',
//       fontWeight: '600',
//     },
//     dropdown: {
//       width:              '2.5rem',
//       borderRadius:       '{border.radius.md}',
//       background:         'transparent',
//       hoverBackground:    '{content.hover.background}',
//       activeBackground:   '{content.hover.background}',
//       borderColor:        '{content.border.color}',
//       hoverBorderColor:   '{primary.color}',
//       activeBorderColor:  '{primary.color}',
//       color:              '{text.muted.color}',
//       hoverColor:         '{text.color}',
//       activeColor:        '{primary.color}',
//       focusRing: {
//         width: '{focus.ring.width}', style: '{focus.ring.style}',
//         color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
//       },
//     },
//     inputIcon: { color: '{text.muted.color}' },
//     selectMonth: {
//       hoverBackground: '{content.hover.background}',
//       color:           '{text.muted.color}',
//       hoverColor:      '{text.color}',
//       padding:         '0.25rem 0.5rem',
//       borderRadius:    '{border.radius.sm}',
//     },
//     selectYear: {
//       hoverBackground: '{content.hover.background}',
//       color:           '{text.muted.color}',
//       hoverColor:      '{text.color}',
//       padding:         '0.25rem 0.5rem',
//       borderRadius:    '{border.radius.sm}',
//     },
//     group: { borderColor: '{content.border.color}', gap: '0' },
//     dayView: { margin: '0.75rem 0 0' },
//     weekDay: {
//       padding:    '0.25rem',
//       fontWeight: '600',
//       color:      '{text.muted.color}',
//     },
//     date: {
//       hoverBackground:       '{content.hover.background}',
//       selectedBackground:    '{primary.color}',
//       rangeSelectedBackground: '{primary.50}',
//       color:                 '{text.muted.color}',
//       hoverColor:            '{text.color}',
//       selectedColor:         '{primary.contrast.color}',
//       rangeSelectedColor:    '{primary.700}',
//       width:                 '2.25rem',
//       height:                '2.25rem',
//       borderRadius:          '{border.radius.md}',
//       padding:               '0.25rem',
//       focusRing: {
//         width: '{focus.ring.width}', style: '{focus.ring.style}',
//         color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
//       },
//     },
//     monthView: { margin: '0.75rem 0 0' },
//     month: { padding: '0.375rem 0.625rem', borderRadius: '{border.radius.md}' },
//     yearView:  { margin: '0.75rem 0 0' },
//     year:  { padding: '0.375rem 0.625rem', borderRadius: '{border.radius.md}' },
//     buttonbar: { padding: '0.75rem 0 0', borderColor: '{content.border.color}' },
//     timePicker: {
//       padding:      '0.5rem 0 0',
//       borderColor:  '{content.border.color}',
//       gap:          '0.25rem',
//       buttonGap:    '0.375rem',
//     },
//     today: {
//       background: '{primary.50}',
//       color:      '{primary.700}',
//     },
//   },

//   // ── DIALOG ─────────────────────────────────────────────────────────────────
//   dialog: {
//     background:   '{overlay.modal.background}',
//     borderColor:  '{overlay.modal.border.color}',
//     color:        '{overlay.modal.color}',
//     borderRadius: '{overlay.modal.border.radius}',
//     shadow:       '{overlay.modal.shadow}',
//     header: {
//       padding: '1.25rem 1.5rem',
//       gap:     '0.75rem',
//     },
//     title: {
//       fontSize:   '1rem',
//       fontWeight: '600',
//     },
//     content: {
//       padding: '0 1.5rem 1.5rem',
//     },
//     footer: {
//       padding: '1rem 1.5rem',
//       gap:     '0.5rem',
//     },
//   },

//   // ── DIVIDER ────────────────────────────────────────────────────────────────
//   divider: {
//     borderColor:      '{content.border.color}',
//     content: {
//       background: '{content.background}',
//       color:      '{text.muted.color}',
//     },
//   },

//   // ── DRAWER ─────────────────────────────────────────────────────────────────
//   drawer: {
//     background:   '{overlay.modal.background}',
//     borderColor:  '{overlay.modal.border.color}',
//     color:        '{overlay.modal.color}',
//     shadow:       '{overlay.modal.shadow}',
//     header: {
//       padding: '1.25rem 1.5rem',
//     },
//     content: {
//       padding: '0 1.5rem',
//     },
//     footer: {
//       padding: '1rem 1.5rem',
//     },
//     closeButton: {
//       width:        '2rem',
//       height:       '2rem',
//       borderRadius: '{border.radius.md}',
//       hoverBackground: '{content.hover.background}',
//       color:        '{text.muted.color}',
//       hoverColor:   '{text.color}',
//       focusRing: {
//         width: '{focus.ring.width}', style: '{focus.ring.style}',
//         color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
//       },
//     },
//   },

//   // ── FIELDSET ───────────────────────────────────────────────────────────────
//   fieldset: {
//     background:   '{content.background}',
//     borderColor:  '{content.border.color}',
//     borderRadius: '{content.border.radius}',
//     color:        '{text.color}',
//     padding:      '1.25rem 1.5rem',
//     legend: {
//       background:       '{content.background}',
//       hoverBackground:  '{content.hover.background}',
//       color:            '{text.color}',
//       hoverColor:       '{text.color}',
//       padding:          '0.5rem 0.75rem',
//       fontWeight:       '600',
//       borderRadius:     '{border.radius.md}',
//       focusRing: {
//         width: '{focus.ring.width}', style: '{focus.ring.style}',
//         color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
//       },
//     },
//     toggleIcon: {
//       color:      '{text.muted.color}',
//       hoverColor: '{text.color}',
//     },
//   },

//   // ── INPUTTEXT ──────────────────────────────────────────────────────────────
//   inputtext: {
//     background:          '{form.field.background}',
//     disabledBackground:  '{form.field.disabled.background}',
//     filledBackground:    '{form.field.filled.background}',
//     filledHoverBackground: '{form.field.filled.hover.background}',
//     filledFocusBackground: '{form.field.filled.focus.background}',
//     borderColor:         '{form.field.border.color}',
//     hoverBorderColor:    '{form.field.hover.border.color}',
//     focusBorderColor:    '{form.field.focus.border.color}',
//     invalidBorderColor:  '{form.field.invalid.border.color}',
//     color:               '{form.field.color}',
//     disabledColor:       '{form.field.disabled.color}',
//     placeholderColor:    '{form.field.placeholder.color}',
//     invalidPlaceholderColor: '{form.field.invalid.placeholder.color}',
//     shadow:              '{form.field.shadow}',
//     paddingX:            '{form.field.padding.x}',
//     paddingY:            '{form.field.padding.y}',
//     borderRadius:        '{form.field.border.radius}',
//     focusRing: {
//       width:  '{form.field.focus.ring.width}',
//       style:  '{form.field.focus.ring.style}',
//       color:  '{form.field.focus.ring.color}',
//       offset: '{form.field.focus.ring.offset}',
//       shadow: '{form.field.focus.ring.shadow}',
//     },
//     transitionDuration: '{form.field.transition.duration}',
//     sm: {
//       fontSize: '{form.field.sm.font.size}',
//       paddingX: '{form.field.sm.padding.x}',
//       paddingY: '{form.field.sm.padding.y}',
//     },
//     lg: {
//       fontSize: '{form.field.lg.font.size}',
//       paddingX: '{form.field.lg.padding.x}',
//       paddingY: '{form.field.lg.padding.y}',
//     },
//   },

//   // ── LISTBOX ────────────────────────────────────────────────────────────────
//   listbox: {
//     background:   '{form.field.background}',
//     disabledBackground: '{form.field.disabled.background}',
//     borderColor:  '{form.field.border.color}',
//     invalidBorderColor: '{form.field.invalid.border.color}',
//     color:        '{form.field.color}',
//     disabledColor: '{form.field.disabled.color}',
//     shadow:       '0 1px 3px rgba(0,0,0,0.1)',
//     borderRadius: '{content.border.radius}',
//     padding:      '{list.padding}',
//     list: {
//       padding: '{list.padding}',
//       gap:     '{list.gap}',
//       header:  { padding: '{list.header.padding}' },
//     },
//     option: {
//       focusBackground:         '{list.option.focus.background}',
//       selectedBackground:      '{list.option.selected.background}',
//       selectedFocusBackground: '{list.option.selected.focus.background}',
//       color:                   '{list.option.color}',
//       focusColor:              '{list.option.focus.color}',
//       selectedColor:           '{list.option.selected.color}',
//       selectedFocusColor:      '{list.option.selected.focus.color}',
//       padding:                 '{list.option.padding}',
//       borderRadius:            '{list.option.border.radius}',
//       gap:                     '0.5rem',
//     },
//     optionGroup: {
//       background:  '{list.option.group.background}',
//       color:       '{list.option.group.color}',
//       fontWeight:  '{list.option.group.font.weight}',
//       padding:     '{list.option.group.padding}',
//     },
//     emptyMessagePadding: '0.625rem 0.875rem',
//     checkmark: {
//       color:        '{list.option.color}',
//       gutterStart:  '0.5rem',
//       gutterEnd:    '0.25rem',
//     },
//     focusRing: {
//       width: '{focus.ring.width}', style: '{focus.ring.style}',
//       color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
//     },
//   },

//   // ── MESSAGE ────────────────────────────────────────────────────────────────
//   message: {
//     borderRadius:       '{content.border.radius}',
//     borderWidth:        '1px',
//     transitionDuration: '{transition.duration}',
//     content: {
//       padding:    '0.875rem 1rem',
//       gap:        '0.5rem',
//       sm:         { padding: '0.625rem 0.75rem' },
//       lg:         { padding: '1.125rem 1.25rem' },
//     },
//     text: {
//       fontSize:   '0.875rem',
//       fontWeight: '500',
//       sm:         { fontSize: '0.75rem' },
//       lg:         { fontSize: '1rem' },
//     },
//     icon: {
//       size:   '1.125rem',
//       sm:     { size: '0.875rem' },
//       lg:     { size: '1.25rem' },
//     },
//     closeButton: {
//       width: '1.75rem', height: '1.75rem',
//       borderRadius: '{border.radius.sm}',
//       focusRing: {
//         width: '{focus.ring.width}', style: '{focus.ring.style}',
//         color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
//       },
//     },
//     closeIcon: { size: '0.875rem', sm: { size: '0.75rem' }, lg: { size: '1rem' } },
//     outlined: { borderWidth: '1px' },
//     info: {
//       background:        '{sky.50}',   borderColor:  '{sky.200}',  color: '{sky.700}',
//       shadow:            'none',
//       closeButton: { hoverBackground: '{sky.100}', focusRing: { color: '{sky.600}', shadow: 'none' } },
//       outlined:    { color: '{sky.600}', borderColor: '{sky.600}' },
//       simple:      { color: '{sky.700}' },
//     },
//     success: {
//       background:  '{green.50}',  borderColor: '{green.200}', color: '{green.700}',
//       shadow:      'none',
//       closeButton: { hoverBackground: '{green.100}', focusRing: { color: '{green.600}', shadow: 'none' } },
//       outlined:    { color: '{green.600}', borderColor: '{green.600}' },
//       simple:      { color: '{green.700}' },
//     },
//     warn: {
//       background:  '{amber.50}',  borderColor: '{amber.200}', color: '{amber.700}',
//       shadow:      'none',
//       closeButton: { hoverBackground: '{amber.100}', focusRing: { color: '{amber.600}', shadow: 'none' } },
//       outlined:    { color: '{amber.600}', borderColor: '{amber.600}' },
//       simple:      { color: '{amber.700}' },
//     },
//     error: {
//       background:  '{red.50}',   borderColor: '{red.200}',   color: '{red.700}',
//       shadow:      'none',
//       closeButton: { hoverBackground: '{red.100}', focusRing: { color: '{red.600}', shadow: 'none' } },
//       outlined:    { color: '{red.600}', borderColor: '{red.600}' },
//       simple:      { color: '{red.700}' },
//     },
//     secondary: {
//       background:  '{content.hover.background}', borderColor: '{content.border.color}',
//       color:       '{text.muted.color}', shadow: 'none',
//       closeButton: { hoverBackground: '{content.border.color}', focusRing: { color: '{primary.color}', shadow: 'none' } },
//       outlined:    { color: '{text.muted.color}', borderColor: '{content.border.color}' },
//       simple:      { color: '{text.muted.color}' },
//     },
//     contrast: {
//       background:  '{text.color}', borderColor: '{text.color}',
//       color:       '{content.background}', shadow: 'none',
//     },
//   },

//   // ── MULTISELECT ────────────────────────────────────────────────────────────
//   multiselect: {
//     background:          '{form.field.background}',
//     disabledBackground:  '{form.field.disabled.background}',
//     filledBackground:    '{form.field.filled.background}',
//     filledHoverBackground: '{form.field.filled.hover.background}',
//     filledFocusBackground: '{form.field.filled.focus.background}',
//     borderColor:         '{form.field.border.color}',
//     hoverBorderColor:    '{form.field.hover.border.color}',
//     focusBorderColor:    '{form.field.focus.border.color}',
//     invalidBorderColor:  '{form.field.invalid.border.color}',
//     color:               '{form.field.color}',
//     disabledColor:       '{form.field.disabled.color}',
//     placeholderColor:    '{form.field.placeholder.color}',
//     shadow:              '{form.field.shadow}',
//     paddingX:            '{form.field.padding.x}',
//     paddingY:            '{form.field.padding.y}',
//     borderRadius:        '{form.field.border.radius}',
//     focusRing: {
//       width: '{form.field.focus.ring.width}', style: '{form.field.focus.ring.style}',
//       color: '{form.field.focus.ring.color}', offset: '{form.field.focus.ring.offset}',
//       shadow: '{form.field.focus.ring.shadow}',
//     },
//     transitionDuration: '{form.field.transition.duration}',
//     overlay: {
//       background:   '{overlay.select.background}',
//       borderColor:  '{overlay.select.border.color}',
//       borderRadius: '{overlay.select.border.radius}',
//       color:        '{overlay.select.color}',
//       shadow:       '{overlay.select.shadow}',
//     },
//     list: {
//       padding: '{list.padding}',
//       gap:     '{list.gap}',
//       header:  { padding: '{list.header.padding}' },
//     },
//     option: {
//       focusBackground:         '{list.option.focus.background}',
//       selectedBackground:      '{list.option.selected.background}',
//       selectedFocusBackground: '{list.option.selected.focus.background}',
//       color:                   '{list.option.color}',
//       focusColor:              '{list.option.focus.color}',
//       selectedColor:           '{list.option.selected.color}',
//       selectedFocusColor:      '{list.option.selected.focus.color}',
//       padding:                 '{list.option.padding}',
//       borderRadius:            '{list.option.border.radius}',
//       gap:                     '0.5rem',
//     },
//     optionGroup: {
//       background:  '{list.option.group.background}',
//       color:       '{list.option.group.color}',
//       fontWeight:  '{list.option.group.font.weight}',
//       padding:     '{list.option.group.padding}',
//     },
//     clearIconColor: '{form.field.icon.color}',
//     chipBorderRadius: '999px',
//     emptyMessagePadding: '0.625rem 0.875rem',
//     checkmark: {
//       color:        '{list.option.selected.color}',
//       gutterStart:  '0.5rem',
//       gutterEnd:    '0.25rem',
//     },
//     sm: {
//       fontSize: '{form.field.sm.font.size}',
//       paddingX: '{form.field.sm.padding.x}',
//       paddingY: '{form.field.sm.padding.y}',
//     },
//     lg: {
//       fontSize: '{form.field.lg.font.size}',
//       paddingX: '{form.field.lg.padding.x}',
//       paddingY: '{form.field.lg.padding.y}',
//     },
//   },

//   // ── PAGINATOR ──────────────────────────────────────────────────────────────
//   paginator: {
//     padding:            '0.5rem',
//     gap:                '0.25rem',
//     borderRadius:       '{content.border.radius}',
//     background:         '{content.background}',
//     color:              '{text.muted.color}',
//     transitionDuration: '{transition.duration}',
//     navButton: {
//       background:         'transparent',
//       hoverBackground:    '{content.hover.background}',
//       selectedBackground: '{primary.color}',
//       color:              '{text.muted.color}',
//       hoverColor:         '{text.color}',
//       selectedColor:      '{primary.contrast.color}',
//       width:              '2.25rem',
//       height:             '2.25rem',
//       borderRadius:       '{border.radius.md}',
//       focusRing: {
//         width: '{focus.ring.width}', style: '{focus.ring.style}',
//         color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
//       },
//     },
//     currentPageReport: { color: '{text.muted.color}' },
//     jumpToPageInput: { maxWidth: '3rem' },
//   },

//   // ── PANEL ──────────────────────────────────────────────────────────────────
//   panel: {
//     background:     '{content.background}',
//     borderColor:    '{content.border.color}',
//     borderRadius:   '{content.border.radius}',
//     color:          '{text.color}',
//     header: {
//       background:       '{content.background}',
//       color:            '{text.color}',
//       padding:          '1rem 1.25rem',
//       fontWeight:       '600',
//       borderRadius:     '{content.border.radius}',
//     },
//     toggleableHeader: { padding: '0.875rem 1.25rem' },
//     content: { padding: '0.75rem 1.25rem 1.25rem' },
//     footer: {
//       padding:     '0.75rem 1.25rem',
//       borderColor: '{content.border.color}',
//     },
//     toggleButton: {
//       hoverBackground: '{content.hover.background}',
//       borderRadius:    '{border.radius.md}',
//       color:           '{text.muted.color}',
//       hoverColor:      '{text.color}',
//       width:           '1.75rem',
//       height:          '1.75rem',
//       focusRing: {
//         width: '{focus.ring.width}', style: '{focus.ring.style}',
//         color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
//       },
//     },
//   },

//   // ── PASSWORD ───────────────────────────────────────────────────────────────
//   password: {
//     meter: {
//       background:   '{content.border.color}',
//       borderRadius: '999px',
//       height:       '4px',
//     },
//     icon: {
//       color:      '{form.field.icon.color}',
//       hoverColor: '{text.muted.color}',
//     },
//     overlay: {
//       background:   '{overlay.popover.background}',
//       borderColor:  '{overlay.popover.border.color}',
//       borderRadius: '{overlay.popover.border.radius}',
//       color:        '{overlay.popover.color}',
//       shadow:       '{overlay.popover.shadow}',
//       padding:      '1rem 1.25rem',
//     },
//     content: { gap: '0.75rem' },
//     weak:   { background: '{red.500}' },
//     medium: { background: '{amber.500}' },
//     strong: { background: '{green.500}' },
//   },

//   // ── POPOVER ────────────────────────────────────────────────────────────────
//   popover: {
//     background:   '{overlay.popover.background}',
//     borderColor:  '{overlay.popover.border.color}',
//     color:        '{overlay.popover.color}',
//     borderRadius: '{overlay.popover.border.radius}',
//     shadow:       '{overlay.popover.shadow}',
//     gutter:       '10px',
//     arrowOffset:  '1.25rem',
//     content: { padding: '1rem 1.25rem' },
//   },

//   // ── PROGRESSBAR ────────────────────────────────────────────────────────────
//   progressbar: {
//     background:   '{content.border.color}',
//     borderRadius: '999px',
//     height:       '4px',
//     value: {
//       background: '{primary.color}',
//     },
//     label: {
//       color:      '{primary.contrast.color}',
//       fontSize:   '0.65rem',
//       fontWeight: '600',
//     },
//   },

//   // ── RADIOBUTTON ────────────────────────────────────────────────────────────
//   radiobutton: {
//     width:              '1.125rem',
//     height:             '1.125rem',
//     background:         '{form.field.background}',
//     checkedBackground:  '{primary.color}',
//     checkedHoverBackground: '{primary.hover.color}',
//     disabledBackground: '{form.field.disabled.background}',
//     filledBackground:   '{form.field.filled.background}',
//     borderColor:        '{form.field.border.color}',
//     hoverBorderColor:   '{primary.color}',
//     focusBorderColor:   '{primary.color}',
//     checkedBorderColor: '{primary.color}',
//     checkedHoverBorderColor: '{primary.hover.color}',
//     checkedDisabledBorderColor: '{form.field.disabled.background}',
//     invalidBorderColor: '{form.field.invalid.border.color}',
//     shadow:             'none',
//     focusRing: {
//       width: '{focus.ring.width}', style: '{focus.ring.style}',
//       color: '{focus.ring.color}', offset: '{focus.ring.offset}',
//       shadow: '0 0 0 4px {primary.color}20',
//     },
//     transitionDuration: '{transition.duration}',
//     icon: {
//       size:                  '0.5rem',
//       checkedBackground:     '{primary.contrast.color}',
//       checkedHoverBackground: '{primary.contrast.color}',
//       disabledBackground:    '{form.field.disabled.color}',
//     },
//     sm: { width: '0.875rem', height: '0.875rem' },
//     lg: { width: '1.375rem', height: '1.375rem' },
//   },

//   // ── RATING ─────────────────────────────────────────────────────────────────
//   rating: {
//     gap:           '0.25rem',
//     transitionDuration: '{transition.duration}',
//     icon: {
//       size:        '1.125rem',
//       color:       '{text.muted.color}',
//       hoverColor:  '{primary.color}',
//       activeColor: '{primary.color}',
//     },
//     focusRing: {
//       width: '{focus.ring.width}', style: '{focus.ring.style}',
//       color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
//     },
//   },

//   // ── SELECT ─────────────────────────────────────────────────────────────────
//   select: {
//     background:          '{form.field.background}',
//     disabledBackground:  '{form.field.disabled.background}',
//     filledBackground:    '{form.field.filled.background}',
//     filledHoverBackground: '{form.field.filled.hover.background}',
//     filledFocusBackground: '{form.field.filled.focus.background}',
//     borderColor:         '{form.field.border.color}',
//     hoverBorderColor:    '{form.field.hover.border.color}',
//     focusBorderColor:    '{form.field.focus.border.color}',
//     invalidBorderColor:  '{form.field.invalid.border.color}',
//     color:               '{form.field.color}',
//     disabledColor:       '{form.field.disabled.color}',
//     placeholderColor:    '{form.field.placeholder.color}',
//     invalidPlaceholderColor: '{form.field.invalid.placeholder.color}',
//     shadow:              '{form.field.shadow}',
//     paddingX:            '{form.field.padding.x}',
//     paddingY:            '{form.field.padding.y}',
//     borderRadius:        '{form.field.border.radius}',
//     focusRing: {
//       width: '{form.field.focus.ring.width}', style: '{form.field.focus.ring.style}',
//       color: '{form.field.focus.ring.color}', offset: '{form.field.focus.ring.offset}',
//       shadow: '{form.field.focus.ring.shadow}',
//     },
//     transitionDuration: '{form.field.transition.duration}',
//     dropdown: {
//       width: '2.5rem',
//       color: '{form.field.icon.color}',
//     },
//     overlay: {
//       background:   '{overlay.select.background}',
//       borderColor:  '{overlay.select.border.color}',
//       borderRadius: '{overlay.select.border.radius}',
//       color:        '{overlay.select.color}',
//       shadow:       '{overlay.select.shadow}',
//     },
//     list: {
//       padding:       '{list.padding}',
//       gap:           '{list.gap}',
//       header:        { padding: '{list.header.padding}' },
//     },
//     option: {
//       focusBackground:         '{list.option.focus.background}',
//       selectedBackground:      '{list.option.selected.background}',
//       selectedFocusBackground: '{list.option.selected.focus.background}',
//       color:                   '{list.option.color}',
//       focusColor:              '{list.option.focus.color}',
//       selectedColor:           '{list.option.selected.color}',
//       selectedFocusColor:      '{list.option.selected.focus.color}',
//       padding:                 '{list.option.padding}',
//       borderRadius:            '{list.option.border.radius}',
//     },
//     optionGroup: {
//       background:  '{list.option.group.background}',
//       color:       '{list.option.group.color}',
//       fontWeight:  '{list.option.group.font.weight}',
//       padding:     '{list.option.group.padding}',
//     },
//     clearIconColor:  '{form.field.icon.color}',
//     checkmarkColor:  '{list.option.selected.color}',
//     checkmark: {
//       color:       '{list.option.selected.color}',
//       gutterStart: '0.5rem',
//       gutterEnd:   '0.25rem',
//     },
//     emptyMessagePadding: '0.625rem 0.875rem',
//     sm: {
//       fontSize: '{form.field.sm.font.size}',
//       paddingX: '{form.field.sm.padding.x}',
//       paddingY: '{form.field.sm.padding.y}',
//     },
//     lg: {
//       fontSize: '{form.field.lg.font.size}',
//       paddingX: '{form.field.lg.padding.x}',
//       paddingY: '{form.field.lg.padding.y}',
//     },
//   },

//   // ── SKELETON ───────────────────────────────────────────────────────────────
//   skeleton: {
//     background:          '{content.border.color}',
//     animationBackground: 'rgba(255,255,255,0.1)',
//     borderRadius:        '{border.radius.sm}',
//   },

//   // ── SLIDER ─────────────────────────────────────────────────────────────────
//   slider: {
//     trackBackground:    '{content.border.color}',
//     trackBorderRadius:  '999px',
//     trackSize:          '4px',
//     rangeBackground:    '{primary.color}',
//     handle: {
//       width:            '1.125rem',
//       height:           '1.125rem',
//       borderRadius:     '50%',
//       background:       '{primary.color}',
//       hoverBackground:  '{primary.hover.color}',
//       content: {
//         borderRadius: '50%',
//         width:        '0.375rem',
//         height:       '0.375rem',
//         shadow:       'none',
//         background:   '{primary.contrast.color}',
//         hoverBackground: '{primary.contrast.color}',
//       },
//       focusRing: {
//         width: '{focus.ring.width}', style: '{focus.ring.style}',
//         color: '{focus.ring.color}', offset: '{focus.ring.offset}',
//         shadow: '0 0 0 4px {primary.color}20',
//       },
//     },
//     transitionDuration: '{transition.duration}',
//   },

//   // ── STEPPER ────────────────────────────────────────────────────────────────
//   stepper: {
//     transitionDuration:    '{transition.duration}',
//     separator: {
//       background:       '{content.border.color}',
//       activeBackground: '{primary.color}',
//       size:             '2px',
//     },
//     step: {
//       padding:      '0.5rem 1rem',
//       gap:          '1rem',
//     },
//     stepHeader: {
//       padding:      '0.5rem 1rem',
//       borderRadius: '{border.radius.md}',
//       gap:          '0.5rem',
//       focusRing: {
//         width: '{focus.ring.width}', style: '{focus.ring.style}',
//         color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
//       },
//     },
//     stepTitle: {
//       color:            '{text.muted.color}',
//       activeColor:      '{primary.color}',
//       fontWeight:       '500',
//       activeFontWeight: '600',
//     },
//     stepNumber: {
//       background:         '{content.hover.background}',
//       activeBackground:   '{primary.color}',
//       borderRadius:       '50%',
//       color:              '{text.muted.color}',
//       activeColor:        '{primary.contrast.color}',
//       size:               '1.875rem',
//       fontSize:           '0.875rem',
//       fontWeight:         '600',
//     },
//     stepPanel: {
//       background: 'transparent',
//       color:      '{text.muted.color}',
//       padding:    '1rem 1.25rem',
//     },
//   },

//   // ── TABS ───────────────────────────────────────────────────────────────────
//   tabs: {
//     transitionDuration: '{transition.duration}',
//     tablist: {
//       borderWidth: '0 0 1px 0',
//       background:  'transparent',
//       borderColor: '{content.border.color}',
//     },
//     tab: {
//       background:       'transparent',
//       hoverBackground:  '{content.hover.background}',
//       activeBackground: 'transparent',
//       borderWidth:      '0 0 2px 0',
//       borderColor:      'transparent',
//       hoverBorderColor: '{content.border.color}',
//       activeBorderColor: '{primary.color}',
//       color:            '{text.muted.color}',
//       hoverColor:       '{text.color}',
//       activeColor:      '{primary.color}',
//       padding:          '0.75rem 1.25rem',
//       fontWeight:       '500',
//       margin:           '0',
//       gap:              '0',
//       focusRing: {
//         width: '{focus.ring.width}', style: '{focus.ring.style}',
//         color: '{focus.ring.color}', offset: '-1px', shadow: 'none',
//       },
//     },
//     tabpanel: {
//       background:     'transparent',
//       color:          '{text.muted.color}',
//       padding:        '1rem 0',
//       focusRing: {
//         width: '0', style: 'none', color: 'transparent', offset: '0', shadow: 'none',
//       },
//     },
//     navButton: {
//       background:     '{content.background}',
//       color:          '{text.muted.color}',
//       hoverColor:     '{text.color}',
//       width:          '2.5rem',
//       shadow:         '0 1px 3px rgba(0,0,0,0.1)',
//       focusRing: {
//         width: '{focus.ring.width}', style: '{focus.ring.style}',
//         color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
//       },
//     },
//     activeBar: {
//       height:     '2px',
//       bottom:     '-1px',
//       background: '{primary.color}',
//     },
//   },

//   // ── TAG ────────────────────────────────────────────────────────────────────
//   tag: {
//     fontSize:   '0.65rem',
//     fontWeight: '700',
//     padding:    '0.2rem 0.625rem',
//     gap:        '0.25rem',
//     borderRadius: '999px',
//     iconSize:   '0.75rem',
//     primary:    { background: '{primary.color}',      color: '{primary.contrast.color}' },
//     secondary:  { background: '{content.hover.background}', color: '{text.muted.color}' },
//     success:    { background: '{green.100}',          color: '{green.800}' },
//     info:       { background: '{sky.100}',            color: '{sky.800}' },
//     warn:       { background: '{amber.100}',          color: '{amber.800}' },
//     danger:     { background: '{red.100}',            color: '{red.800}' },
//     contrast:   { background: '{text.color}',         color: '{content.background}' },
//   },

//   // ── TOAST ──────────────────────────────────────────────────────────────────
//   toast: {
//     width:              '24rem',
//     borderRadius:       '{content.border.radius}',
//     borderWidth:        '1px',
//     transitionDuration: '{transition.duration}',
//     content:            { padding: '1rem 1.25rem', gap: '0.625rem' },
//     text:               { gap: '0.25rem' },
//     summary:            { fontWeight: '600', fontSize: '0.875rem' },
//     detail:             { fontWeight: '400', fontSize: '0.8125rem' },
//     closeButton: {
//       width: '1.75rem', height: '1.75rem',
//       borderRadius: '{border.radius.sm}',
//       focusRing: {
//         width: '{focus.ring.width}', style: '{focus.ring.style}',
//         color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
//       },
//     },
//     closeIcon:    { size: '0.875rem' },
//     info: {
//       background: '{sky.50}',   borderColor: '{sky.200}',
//       color:      '{sky.700}',  detailColor: '{sky.600}',
//       shadow:     '0 2px 8px rgba(14,165,233,0.12)',
//       closeButton: { hoverBackground: '{sky.100}', focusRing: { color: '{sky.600}', shadow: 'none' } },
//     },
//     success: {
//       background: '{green.50}', borderColor: '{green.200}',
//       color:      '{green.700}', detailColor: '{green.600}',
//       shadow:     '0 2px 8px rgba(34,197,94,0.12)',
//       closeButton: { hoverBackground: '{green.100}', focusRing: { color: '{green.600}', shadow: 'none' } },
//     },
//     warn: {
//       background: '{amber.50}', borderColor: '{amber.200}',
//       color:      '{amber.700}', detailColor: '{amber.600}',
//       shadow:     '0 2px 8px rgba(245,158,11,0.12)',
//       closeButton: { hoverBackground: '{amber.100}', focusRing: { color: '{amber.600}', shadow: 'none' } },
//     },
//     error: {
//       background: '{red.50}',   borderColor: '{red.200}',
//       color:      '{red.700}',  detailColor: '{red.600}',
//       shadow:     '0 2px 8px rgba(239,68,68,0.12)',
//       closeButton: { hoverBackground: '{red.100}', focusRing: { color: '{red.600}', shadow: 'none' } },
//     },
//     secondary: {
//       background: '{content.hover.background}', borderColor: '{content.border.color}',
//       color:      '{text.color}', detailColor: '{text.muted.color}',
//       shadow:     '0 2px 8px rgba(0,0,0,0.08)',
//       closeButton: { hoverBackground: '{content.border.color}', focusRing: { color: '{primary.color}', shadow: 'none' } },
//     },
//     contrast: {
//       background: '{text.color}', borderColor: '{text.color}',
//       color:      '{content.background}', detailColor: '{content.hover.background}',
//       shadow:     '0 2px 8px rgba(0,0,0,0.15)',
//     },
//   },

//   // ── TOGGLESWITCH (InputSwitch) ─────────────────────────────────────────────
//   toggleswitch: {
//     width:              '1.875rem',
//     height:             '1.125rem',
//     borderRadius:       '999px',
//     background:         '{form.field.border.color}',
//     hoverBackground:    '{form.field.hover.border.color}',
//     checkedBackground:  '{primary.color}',
//     checkedHoverBackground: '{primary.hover.color}',
//     disabledBackground: '{form.field.disabled.background}',
//     invalidBorderColor: '{form.field.invalid.border.color}',
//     focusRing: {
//       width: '{focus.ring.width}', style: '{focus.ring.style}',
//       color: '{focus.ring.color}', offset: '{focus.ring.offset}',
//       shadow: '0 0 0 4px {primary.color}20',
//     },
//     transitionDuration: '{transition.duration}',
//     handle: {
//       width:             '0.75rem',
//       height:            '0.75rem',
//       borderRadius:      '50%',
//       background:        '#ffffff',
//       disabledBackground: '{form.field.disabled.color}',
//     },
//     sm: { width: '1.5rem', height: '0.875rem' },
//     lg: { width: '2.25rem', height: '1.375rem' },
//   },

//   // ── TOOLBAR ────────────────────────────────────────────────────────────────
//   toolbar: {
//     background:   '{content.background}',
//     borderColor:  '{content.border.color}',
//     borderRadius: '{content.border.radius}',
//     color:        '{text.color}',
//     gap:          '0.5rem',
//     padding:      '0.75rem 1rem',
//   },

//   // ── TOOLTIP ────────────────────────────────────────────────────────────────
//   tooltip: {
//     background:   '{content.hover.background}',
//     color:        '{text.color}',
//     padding:      '0.375rem 0.625rem',
//     borderRadius: '{border.radius.sm}',
//     shadow:       '0 1px 3px rgba(0,0,0,0.1)',
//     maxWidth:     '16rem',
//     arrow: {
//       width:  '6px',
//       height: '4px',
//     },
//   },

//   // ── TREE ───────────────────────────────────────────────────────────────────
//   tree: {
//     background:   '{content.background}',
//     borderColor:  '{content.border.color}',
//     color:        '{text.color}',
//     borderRadius: '{content.border.radius}',
//     padding:      '{list.padding}',
//     indent:       '1.5rem',
//     gap:          '2px',
//     node: {
//       background:         'transparent',
//       hoverBackground:    '{content.hover.background}',
//       selectedBackground: '{primary.50}',
//       color:              '{text.muted.color}',
//       hoverColor:         '{text.color}',
//       selectedColor:      '{primary.700}',
//       borderRadius:       '{border.radius.sm}',
//       padding:            '0.375rem 0.5rem',
//       gap:                '0.375rem',
//       icon: {
//         color:         '{text.muted.color}',
//         hoverColor:    '{text.muted.color}',
//         selectedColor: '{primary.color}',
//       },
//       focusRing: {
//         width: '{focus.ring.width}', style: '{focus.ring.style}',
//         color: '{focus.ring.color}', offset: '-1px', shadow: 'none',
//       },
//     },
//     loadingIcon: { size: '2rem' },
//     toggleButton: {
//       width:              '1.5rem',
//       height:             '1.5rem',
//       borderRadius:       '{border.radius.sm}',
//       hoverBackground:    '{content.hover.background}',
//       selectedBackground: 'transparent',
//       color:              '{text.muted.color}',
//       hoverColor:         '{text.muted.color}',
//       selectedColor:      '{primary.color}',
//     },
//   },

//   // ── DATATABLE ──────────────────────────────────────────────────────────────
//   datatable: {
//     headerCell: {
//       background:         '{content.background}',
//       hoverBackground:    '{content.hover.background}',
//       selectedBackground: '{primary.50}',
//       borderColor:        '{content.border.color}',
//       color:              '{text.muted.color}',
//       hoverColor:         '{text.color}',
//       selectedColor:      '{primary.700}',
//       gap:                '0.5rem',
//       padding:            '0.625rem 1rem',
//       focusRing: {
//         width: '0', style: 'none', color: 'transparent', offset: '0', shadow: 'none',
//       },
//     },
//     columnTitle: { fontWeight: '600', fontSize: '0.7rem' },
//     row: {
//       background:         'transparent',
//       hoverBackground:    '{content.hover.background}',
//       selectedBackground: '{primary.50}',
//       color:              '{text.muted.color}',
//       hoverColor:         '{text.color}',
//       selectedColor:      '{primary.700}',
//       focusRing: {
//         width: '0', style: 'none', color: 'transparent', offset: '0', shadow: 'none',
//       },
//     },
//     bodyCell:   { borderColor: '{content.border.color}', padding: '0.625rem 1rem' },
//     footerCell: {
//       background:  '{content.background}',
//       borderColor: '{content.border.color}',
//       color:       '{text.muted.color}',
//       padding:     '0.625rem 1rem',
//     },
//     sortIcon: {
//       color:      '{text.muted.color}',
//       hoverColor: '{primary.color}',
//     },
//     loadingIcon:    { size: '2rem' },
//     stripedRow:     { background: '{content.background}' },
//     sm: { headerCellPadding: '0.4rem 0.75rem', bodyCellPadding: '0.4rem 0.75rem' },
//     lg: { headerCellPadding: '0.875rem 1.25rem', bodyCellPadding: '0.875rem 1.25rem' },
//     filterOverlay: {
//       background:   '{overlay.popover.background}',
//       borderColor:  '{overlay.popover.border.color}',
//       borderRadius: '{overlay.popover.border.radius}',
//       color:        '{overlay.popover.color}',
//       shadow:       '{overlay.popover.shadow}',
//       padding:      '1rem',
//     },
//     filterConstraint: {
//       borderColor:         '{content.border.color}',
//       focusBackground:     '{content.hover.background}',
//       selectedBackground:  '{primary.50}',
//       color:               '{text.muted.color}',
//       focusColor:          '{text.color}',
//       selectedColor:       '{primary.700}',
//       padding:             '0.5rem 0.75rem',
//       borderRadius:        '{border.radius.sm}',
//     },
//     transitionDuration: '{transition.duration}',
//   },

// };

// // ─── EXPORT THE PRESET ───────────────────────────────────────────────────────

// export const ApexPreset = definePreset(Aura, {
//   primitive,
//   semantic,
//   components,
// });

// export default ApexPreset;


// /**
//  * ============================================================================
//  * USAGE IN app.config.ts
//  * ============================================================================
//  *
//  * import { ApplicationConfig } from '@angular/core';
//  * import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
//  * import { providePrimeNG } from 'primeng/config';
//  * import { ApexPreset } from './theme/apex-preset';
//  *
//  * export const appConfig: ApplicationConfig = {
//  *   providers: [
//  *     provideAnimationsAsync(),
//  *     providePrimeNG({
//  *       ripple: true,
//  *       theme: {
//  *         preset: ApexPreset,
//  *         options: {
//  *           // Matches all Apex dark themes — add/remove as needed
//  *           darkModeSelector: [
//  *             '.theme-dark',
//  *             '.theme-neon-eclipse',
//  *             '.theme-obsidian-rose',
//  *             '.theme-deep-emerald',
//  *             '.theme-midnight-bronze',
//  *             '.theme-molten-ember',
//  *             '.theme-neon-void',
//  *             '.theme-obsidian-jade',
//  *             '.theme-solar-flare',
//  *             '.theme-nebula',
//  *             '.theme-luxury',
//  *             '.theme-abyssal-coral',
//  *             '.theme-crimson-noir',
//  *             '.theme-void-steel',
//  *             '.theme-aurora-glass',
//  *             '.theme-horizon',
//  *             '.theme-amethyst-dusk',
//  *           ].join(', '),
//  *           // Wrap PrimeNG styles in a CSS layer for clean specificity
//  *           cssLayer: {
//  *             name:  'primeng',
//  *             order: 'theme, base, primeng',
//  *           },
//  *           prefix: 'p',   // keep default --p-* variable prefix
//  *         },
//  *       },
//  *     }),
//  *   ],
//  * };
//  *
//  * ============================================================================
//  * RUNTIME THEME SWITCHING (ThemeService)
//  * ============================================================================
//  *
//  * import { Injectable, signal } from '@angular/core';
//  * import { PrimeNG } from 'primeng/config';
//  * import { updatePreset } from '@primeuix/themes';
//  * import { ThemeFontLoader } from './apex-font-loader';
//  *
//  * @Injectable({ providedIn: 'root' })
//  * export class ThemeService {
//  *   private readonly DARK_THEMES = new Set([
//  *     'theme-dark', 'theme-neon-eclipse', 'theme-obsidian-rose',
//  *     'theme-deep-emerald', 'theme-midnight-bronze', 'theme-molten-ember',
//  *     'theme-neon-void', 'theme-obsidian-jade', 'theme-solar-flare',
//  *     'theme-nebula', 'theme-luxury', 'theme-abyssal-coral',
//  *     'theme-crimson-noir', 'theme-void-steel', 'theme-aurora-glass',
//  *     'theme-horizon', 'theme-amethyst-dusk',
//  *   ]);
//  *
//  *   current = signal<string>('theme-light');
//  *
//  *   constructor(private primeng: PrimeNG) {
//  *     const saved = localStorage.getItem('apex-theme') ?? 'theme-light';
//  *     this.apply(saved);
//  *   }
//  *
//  *   async apply(themeId: string): Promise<void> {
//  *     await ThemeFontLoader.loadFontsForTheme(themeId);
//  *     const root = document.documentElement;
//  *     // Remove all theme classes
//  *     root.className = root.className
//  *       .split(' ')
//  *       .filter(c => !c.startsWith('theme-'))
//  *       .join(' ')
//  *       .trim();
//  *     root.classList.add(themeId);
//  *     this.current.set(themeId);
//  *     localStorage.setItem('apex-theme', themeId);
//  *   }
//  *
//  *   isDark(themeId = this.current()): boolean {
//  *     return this.DARK_THEMES.has(themeId);
//  *   }
//  * }
//  * ============================================================================
//  */
// // import { definePreset } from '@primeng/themes';
// // import Aura from '@primeng/themes/aura';

// // export const MyPreset = definePreset(Aura, {
// //     // 1. PRIMITIVES: Connect to your CSS Variables
// //     primitive: {
// //         borderRadius: {
// //             none: '0',
// //             xs: 'var(--ui-border-radius-sm)',
// //             sm: 'var(--ui-border-radius)',
// //             md: 'var(--ui-border-radius)',
// //             lg: 'var(--ui-border-radius-lg)',
// //             xl: 'var(--ui-border-radius-xl)'
// //         }
// //     },

// //     // 2. SEMANTIC LAYER: The Design System Logic
// //     semantic: {
// //         transitionDuration: '0.2s',
        
// //         // ACCESSIBILITY: Focus Ring
// //         focusRing: {
// //             width: '2px',
// //             style: 'solid',
// //             color: 'var(--accent-primary)',
// //             offset: '1px',
// //             shadow: '0 0 0 2px var(--accent-focus)'
// //         },

// //         disabledOpacity: '0.6',
// //         iconSize: '0.875rem', // Slightly smaller icons for compact look
// //         anchorGutter: '0',

// //         // PRIMARY COLOR: Mapped to your Theme's "Accent"
// //         primary: {
// //             50: 'var(--accent-focus)',
// //             100: 'var(--accent-focus)',
// //             200: 'var(--accent-secondary)',
// //             300: 'var(--accent-secondary)',
// //             400: 'var(--accent-primary)',
// //             500: 'var(--accent-primary)',
// //             600: 'var(--accent-hover)',
// //             700: 'var(--accent-hover)',
// //             800: 'var(--accent-tertiary)',
// //             900: 'var(--accent-tertiary)',
// //             950: 'var(--accent-tertiary)'
// //         },

// //         // 3. FORM FIELDS: Compact Scale Logic
// //         formField: {
// //             // REDUCED PADDING for Smaller Height (~32px)
// //             paddingX: '0.65rem',       
// //             paddingY: '0.3rem',        // Reduced from 0.5rem
            
// //             borderRadius: 'var(--ui-border-radius)',
            
// //             // Remove default Aura shadow to keep it flat/clean
// //             focusRing: {
// //                 width: '0',
// //                 style: 'none',
// //                 color: 'transparent',
// //                 offset: '0',
// //                 shadow: 'none'
// //             },
// //             transitionDuration: '0.2s'
// //         },

// //         // 4. COLOR SCHEMES
// //         // We map light/dark identically because your CSS Variables handle the switching.
// //         colorScheme: {
// //             light: {
// //                 surface: {
// //                     0: 'var(--bg-secondary)',      // Component Background
// //                     50: 'var(--bg-primary)',       // Base Background
// //                     100: 'var(--bg-ternary)',
// //                     200: 'var(--border-primary)',  // Borders
// //                     300: 'var(--border-secondary)',
// //                     400: 'var(--text-tertiary)',
// //                     500: 'var(--text-secondary)',
// //                     600: 'var(--text-primary)',
// //                     700: 'var(--text-primary)',
// //                     800: 'var(--text-primary)',
// //                     900: 'var(--text-primary)',
// //                     950: 'var(--text-primary)'
// //                 },
// //                 primary: {
// //                     color: 'var(--accent-primary)',
// //                     contrastColor: '#ffffff',
// //                     hoverColor: 'var(--accent-hover)',
// //                     activeColor: 'var(--accent-hover)'
// //                 },
// //                 highlight: {
// //                     // Background for selected items in dropdowns
// //                     background: 'var(--accent-primary)',
// //                     focusBackground: 'var(--accent-hover)',
// //                     color: '#ffffff', // Force white text on selected items
// //                     focusColor: '#ffffff'
// //                 },
// //                 formField: {
// //                     // 5. BACKGROUND FIX: Ensure inputs are visible
// //                     background: 'var(--bg-secondary)', 
// //                     disabledBackground: 'var(--bg-ternary)',
// //                     filledBackground: 'var(--bg-ternary)',
                    
// //                     // Borders
// //                     borderColor: 'var(--border-primary)',
// //                     hoverBorderColor: 'var(--text-secondary)',
// //                     focusBorderColor: 'var(--accent-primary)',
// //                     invalidBorderColor: 'var(--color-error)',
                    
// //                     // Text Colors
// //                     color: 'var(--text-primary)',
// //                     disabledColor: 'var(--text-tertiary)',
// //                     placeholderColor: 'var(--text-tertiary)',
                    
// //                     // Icons (Datepicker calendar icon, Dropdown arrow)
// //                     iconColor: 'var(--text-secondary)',
                    
// //                     shadow: 'none'
// //                 },
// //                 text: {
// //                     color: 'var(--text-primary)',
// //                     hoverColor: 'var(--text-primary)',
// //                     mutedColor: 'var(--text-secondary)',
// //                     hoverMutedColor: 'var(--text-primary)'
// //                 },
// //                 overlay: {
// //                     select: {
// //                         background: 'var(--bg-secondary)', // Dropdown Panel BG
// //                         borderColor: 'var(--border-primary)',
// //                         color: 'var(--text-primary)',
// //                         // shadow: 'var(--shadow-xl)'
// //                     },
// //                     popover: {
// //                         background: 'var(--bg-secondary)',
// //                         borderColor: 'var(--border-primary)',
// //                         color: 'var(--text-primary)',
// //                         // shadow: 'var(--shadow-xl)'
// //                     }
// //                 },
// //                 list: {
// //                     option: {
// //                         // Dropdown List Items
// //                         focusBackground: 'var(--component-bg-hover)',
// //                         selectedBackground: 'var(--accent-primary)', 
// //                         selectedFocusBackground: 'var(--accent-hover)',
// //                         color: 'var(--text-primary)',
// //                         focusColor: 'var(--text-primary)',
// //                         selectedColor: '#ffffff', // White text when selected
// //                         selectedFocusColor: '#ffffff'
// //                     }
// //                 }
// //             },
// //             // Clone configuration for Dark Mode (CSS Vars handle the values)
// //             dark: {
// //                 surface: {
// //                     0: 'var(--bg-secondary)',
// //                     50: 'var(--bg-primary)',
// //                     100: 'var(--bg-ternary)',
// //                     200: 'var(--border-primary)',
// //                     300: 'var(--border-secondary)',
// //                     400: 'var(--text-tertiary)',
// //                     500: 'var(--text-secondary)',
// //                     600: 'var(--text-primary)',
// //                     700: 'var(--text-primary)',
// //                     800: 'var(--text-primary)',
// //                     900: 'var(--text-primary)',
// //                     950: 'var(--text-primary)'
// //                 },
// //                 primary: {
// //                     color: 'var(--accent-primary)',
// //                     contrastColor: '#ffffff',
// //                     hoverColor: 'var(--accent-hover)',
// //                     activeColor: 'var(--accent-hover)'
// //                 },
// //                 highlight: {
// //                     background: 'var(--accent-primary)',
// //                     focusBackground: 'var(--accent-hover)',
// //                     color: '#ffffff',
// //                     focusColor: '#ffffff'
// //                 },
// //                 formField: {
// //                     background: 'var(--bg-secondary)',
// //                     disabledBackground: 'var(--bg-ternary)',
// //                     filledBackground: 'var(--bg-ternary)',
// //                     borderColor: 'var(--border-primary)',
// //                     hoverBorderColor: 'var(--text-secondary)',
// //                     focusBorderColor: 'var(--accent-primary)',
// //                     invalidBorderColor: 'var(--color-error)',
// //                     color: 'var(--text-primary)',
// //                     disabledColor: 'var(--text-tertiary)',
// //                     placeholderColor: 'var(--text-tertiary)',
// //                     iconColor: 'var(--text-secondary)',
// //                     shadow: 'none'
// //                 },
// //                 text: {
// //                     color: 'var(--text-primary)',
// //                     hoverColor: 'var(--text-primary)',
// //                     mutedColor: 'var(--text-secondary)',
// //                     hoverMutedColor: 'var(--text-primary)'
// //                 },
// //                 overlay: {
// //                     select: {
// //                         background: 'var(--bg-secondary)',
// //                         borderColor: 'var(--border-primary)',
// //                         color: 'var(--text-primary)',
// //                         // shadow: 'var(--shadow-xl)'
// //                     },
// //                     popover: {
// //                         background: 'var(--bg-secondary)',
// //                         borderColor: 'var(--border-primary)',
// //                         color: 'var(--text-primary)',
// //                         // shadow: 'var(--shadow-xl)'
// //                     }
// //                 },
// //                 list: {
// //                     option: {
// //                         focusBackground: 'var(--component-bg-hover)',
// //                         selectedBackground: 'var(--accent-primary)',
// //                         selectedFocusBackground: 'var(--accent-hover)',
// //                         color: 'var(--text-primary)',
// //                         focusColor: 'var(--text-primary)',
// //                         selectedColor: '#ffffff',
// //                         selectedFocusColor: '#ffffff'
// //                     }
// //                 }
// //             }
// //         }
// //     }
// // });

// // // import { definePreset } from '@primeng/themes';
// // // import Aura from '@primeng/themes/aura';

// // // export const MyPreset = definePreset(Aura, {
// // //     // 1. PRIMITIVES: Standardize sizes to your CSS variables
// // //     primitive: {
// // //         borderRadius: {
// // //             none: '0',
// // //             xs: 'var(--ui-border-radius-sm)',
// // //             sm: 'var(--ui-border-radius)',
// // //             md: 'var(--ui-border-radius)',
// // //             lg: 'var(--ui-border-radius-lg)',
// // //             xl: 'var(--ui-border-radius-xl)'
// // //         }
// // //         // Note: We don't need to redefine emerald/green/etc here 
// // //         // because we override the semantic layer below.
// // //     },

// // //     // 2. SEMANTIC: The Bridge between PrimeNG and Your Tokens
// // //     semantic: {
// // //         transitionDuration: '0.2s',
        
// // //         // Focus Ring (Accessibility)
// // //         focusRing: {
// // //             width: '2px',
// // //             style: 'solid',
// // //             color: 'var(--accent-primary)', // Uses your active theme accent
// // //             offset: '2px',
// // //             shadow: '0 0 0 2px var(--accent-focus)'
// // //         },

// // //         disabledOpacity: '0.6',
// // //         iconSize: '1rem',
// // //         anchorGutter: '0',

// // //         // 3. PRIMARY COLOR (Mapped to your Accent)
// // //         primary: {
// // //             50: 'var(--accent-focus)',
// // //             100: 'var(--accent-focus)',
// // //             200: 'var(--accent-secondary)',
// // //             300: 'var(--accent-secondary)',
// // //             400: 'var(--accent-primary)',
// // //             500: 'var(--accent-primary)', // Main Token
// // //             600: 'var(--accent-hover)',
// // //             700: 'var(--accent-hover)',
// // //             800: 'var(--accent-tertiary)',
// // //             900: 'var(--accent-tertiary)',
// // //             950: 'var(--accent-tertiary)'
// // //         },

// // //         // 4. FORM FIELDS (Compact Scale Enforced)
// // //         formField: {
// // //             paddingX: '0.75rem',       // 12px
// // //             paddingY: '0.375rem',      // Compact vertical padding
// // //             borderRadius: 'var(--ui-border-radius)',
// // //             focusRing: {
// // //                 width: '0', // We handle shadow manually in CSS
// // //                 style: 'none',
// // //                 color: 'transparent',
// // //                 offset: '0',
// // //                 shadow: 'none'
// // //             },
// // //             transitionDuration: '0.2s'
// // //         },

// // //         // 5. COLORSCHEME (The Magic)
// // //         // We map BOTH Light and Dark to the SAME variables.
// // //         // Why? Because your CSS class (.theme-dark) changes the variable values automatically.
// // //         colorScheme: {
// // //             light: {
// // //                 surface: {
// // //                     0: 'var(--bg-secondary)',      // Card Background
// // //                     50: 'var(--bg-primary)',       // App Background
// // //                     100: 'var(--bg-ternary)',      // Subtle Background
// // //                     200: 'var(--border-primary)',  // Borders
// // //                     300: 'var(--border-secondary)',
// // //                     400: 'var(--text-tertiary)',
// // //                     500: 'var(--text-secondary)',
// // //                     600: 'var(--text-primary)',
// // //                     700: 'var(--text-primary)',
// // //                     800: 'var(--text-primary)',
// // //                     900: 'var(--text-primary)',
// // //                     950: 'var(--text-primary)'
// // //                 },
// // //                 primary: {
// // //                     color: 'var(--accent-primary)',
// // //                     contrastColor: '#ffffff',
// // //                     hoverColor: 'var(--accent-hover)',
// // //                     activeColor: 'var(--accent-hover)'
// // //                 },
// // //                 highlight: {
// // //                     background: 'var(--accent-focus)',
// // //                     focusBackground: 'var(--component-bg-active)',
// // //                     color: 'var(--accent-primary)',
// // //                     focusColor: 'var(--accent-primary)'
// // //                 },
// // //                 mask: {
// // //                     background: 'rgba(0,0,0,0.6)',
// // //                     color: 'var(--text-primary)'
// // //                 },
// // //                 formField: {
// // //                     background: 'var(--bg-secondary)',
// // //                     disabledBackground: 'var(--bg-ternary)',
// // //                     filledBackground: 'var(--bg-ternary)',
// // //                     filledHoverBackground: 'var(--bg-ternary)',
// // //                     filledFocusBackground: 'var(--bg-secondary)',
// // //                     borderColor: 'var(--border-primary)',
// // //                     hoverBorderColor: 'var(--text-secondary)',
// // //                     focusBorderColor: 'var(--accent-primary)',
// // //                     invalidBorderColor: 'var(--color-error)',
// // //                     color: 'var(--text-primary)',
// // //                     disabledColor: 'var(--text-tertiary)',
// // //                     placeholderColor: 'var(--text-tertiary)',
// // //                     invalidPlaceholderColor: 'var(--color-error)',
// // //                     floatLabelColor: 'var(--text-secondary)',
// // //                     floatLabelFocusColor: 'var(--accent-primary)',
// // //                     floatLabelActiveColor: 'var(--text-secondary)',
// // //                     floatLabelInvalidColor: 'var(--color-error)',
// // //                     iconColor: 'var(--text-secondary)',
// // //                     shadow: 'none'
// // //                 },
// // //                 text: {
// // //                     color: 'var(--text-primary)',
// // //                     hoverColor: 'var(--text-primary)',
// // //                     mutedColor: 'var(--text-secondary)',
// // //                     hoverMutedColor: 'var(--text-primary)'
// // //                 },
// // //                 content: {
// // //                     background: 'var(--bg-secondary)',
// // //                     hoverBackground: 'var(--component-bg-hover)',
// // //                     borderColor: 'var(--border-primary)',
// // //                     color: 'var(--text-primary)',
// // //                     hoverColor: 'var(--text-primary)'
// // //                 },
// // //                 overlay: {
// // //                     select: {
// // //                         background: 'var(--bg-secondary)',
// // //                         borderColor: 'var(--border-primary)',
// // //                         color: 'var(--text-primary)',
// // //                         // height:''
// // //                         // shadow: 'var(--shadow-xl)'
// // //                     },
// // //                     popover: {
// // //                         background: 'var(--bg-secondary)',
// // //                         borderColor: 'var(--border-primary)',
// // //                         color: 'var(--text-primary)',
// // //                         // shadow: 'var(--shadow-xl)'
// // //                     },
// // //                     modal: {
// // //                         background: 'var(--bg-secondary)',
// // //                         borderColor: 'var(--border-primary)',
// // //                         color: 'var(--text-primary)',
// // //                         // shadow: 'var(--shadow-2xl)'
// // //                     }
// // //                 },
// // //                 list: {
// // //                     option: {
// // //                         focusBackground: 'var(--component-bg-hover)',
// // //                         selectedBackground: 'var(--accent-primary)',
// // //                         selectedFocusBackground: 'var(--accent-hover)',
// // //                         color: 'var(--text-primary)',
// // //                         focusColor: 'var(--text-primary)',
// // //                         selectedColor: '#ffffff', // Always white on accent
// // //                         selectedFocusColor: '#ffffff',
// // //                         icon: {
// // //                             color: 'var(--text-secondary)',
// // //                             focusColor: 'var(--text-primary)'
// // //                         }
// // //                     },
// // //                     optionGroup: {
// // //                         background: 'transparent',
// // //                         color: 'var(--text-tertiary)'
// // //                     }
// // //                 },
// // //                 navigation: {
// // //                     item: {
// // //                         focusBackground: 'var(--component-bg-hover)',
// // //                         activeBackground: 'var(--component-bg-active)',
// // //                         color: 'var(--text-primary)',
// // //                         focusColor: 'var(--text-primary)',
// // //                         activeColor: 'var(--accent-primary)',
// // //                         icon: {
// // //                             color: 'var(--text-secondary)',
// // //                             focusColor: 'var(--text-primary)',
// // //                             activeColor: 'var(--accent-primary)'
// // //                         }
// // //                     },
// // //                     submenuLabel: {
// // //                         background: 'transparent',
// // //                         color: 'var(--text-tertiary)'
// // //                     },
// // //                     submenuIcon: {
// // //                         color: 'var(--text-secondary)',
// // //                         focusColor: 'var(--text-primary)',
// // //                         activeColor: 'var(--accent-primary)'
// // //                     }
// // //                 }
// // //             },
// // //             // Since we use CSS variables, Dark Scheme is IDENTICAL to Light Scheme.
// // //             // The variables change values in the browser, PrimeNG just uses the variable name.
// // //             dark: {
// // //                 surface: {
// // //                     0: 'var(--bg-secondary)',
// // //                     50: 'var(--bg-primary)',
// // //                     100: 'var(--bg-ternary)',
// // //                     200: 'var(--border-primary)',
// // //                     300: 'var(--border-secondary)',
// // //                     400: 'var(--text-tertiary)',
// // //                     500: 'var(--text-secondary)',
// // //                     600: 'var(--text-primary)',
// // //                     700: 'var(--text-primary)',
// // //                     800: 'var(--text-primary)',
// // //                     900: 'var(--text-primary)',
// // //                     950: 'var(--text-primary)'
// // //                 },
// // //                 primary: {
// // //                     color: 'var(--accent-primary)',
// // //                     contrastColor: '#ffffff',
// // //                     hoverColor: 'var(--accent-hover)',
// // //                     activeColor: 'var(--accent-hover)'
// // //                 },
// // //                 highlight: {
// // //                     background: 'var(--accent-focus)',
// // //                     focusBackground: 'var(--component-bg-active)',
// // //                     color: 'var(--accent-primary)',
// // //                     focusColor: 'var(--accent-primary)'
// // //                 },
// // //                 mask: {
// // //                     background: 'rgba(0,0,0,0.6)',
// // //                     color: 'var(--text-primary)'
// // //                 },
// // //                 formField: {
// // //                     background: 'var(--bg-secondary)',
// // //                     disabledBackground: 'var(--bg-ternary)',
// // //                     filledBackground: 'var(--bg-ternary)',
// // //                     filledHoverBackground: 'var(--bg-ternary)',
// // //                     filledFocusBackground: 'var(--bg-secondary)',
// // //                     borderColor: 'var(--border-primary)',
// // //                     hoverBorderColor: 'var(--text-secondary)',
// // //                     focusBorderColor: 'var(--accent-primary)',
// // //                     invalidBorderColor: 'var(--color-error)',
// // //                     color: 'var(--text-primary)',
// // //                     disabledColor: 'var(--text-tertiary)',
// // //                     placeholderColor: 'var(--text-tertiary)',
// // //                     invalidPlaceholderColor: 'var(--color-error)',
// // //                     floatLabelColor: 'var(--text-secondary)',
// // //                     floatLabelFocusColor: 'var(--accent-primary)',
// // //                     floatLabelActiveColor: 'var(--text-secondary)',
// // //                     floatLabelInvalidColor: 'var(--color-error)',
// // //                     iconColor: 'var(--text-secondary)',
// // //                     shadow: 'none'
// // //                 },
// // //                 text: {
// // //                     color: 'var(--text-primary)',
// // //                     hoverColor: 'var(--text-primary)',
// // //                     mutedColor: 'var(--text-secondary)',
// // //                     hoverMutedColor: 'var(--text-primary)'
// // //                 },
// // //                 content: {
// // //                     background: 'var(--bg-secondary)',
// // //                     hoverBackground: 'var(--component-bg-hover)',
// // //                     borderColor: 'var(--border-primary)',
// // //                     color: 'var(--text-primary)',
// // //                     hoverColor: 'var(--text-primary)'
// // //                 },
// // //                 overlay: {
// // //                     select: {
// // //                         background: 'var(--bg-secondary)',
// // //                         borderColor: 'var(--border-primary)',
// // //                         color: 'var(--text-primary)',
// // //                         // shadow: 'var(--shadow-xl)'
// // //                     },
// // //                     popover: {
// // //                         background: 'var(--bg-secondary)',
// // //                         borderColor: 'var(--border-primary)',
// // //                         color: 'var(--text-primary)',
// // //                         // shadow: 'var(--shadow-xl)'
// // //                     },
// // //                     modal: {
// // //                         background: 'var(--bg-secondary)',
// // //                         borderColor: 'var(--border-primary)',
// // //                         color: 'var(--text-primary)',
// // //                          // shadow: 'var(--shadow-2xl)'
// // //                     }
// // //                 },
// // //                 list: {
// // //                     option: {
// // //                         focusBackground: 'var(--component-bg-hover)',
// // //                         selectedBackground: 'var(--accent-primary)',
// // //                         selectedFocusBackground: 'var(--accent-hover)',
// // //                         color: 'var(--text-primary)',
// // //                         focusColor: 'var(--text-primary)',
// // //                         selectedColor: '#ffffff',
// // //                         selectedFocusColor: '#ffffff',
// // //                         icon: {
// // //                             color: 'var(--text-secondary)',
// // //                             focusColor: 'var(--text-primary)'
// // //                         }
// // //                     },
// // //                     optionGroup: {
// // //                         background: 'transparent',
// // //                         color: 'var(--text-tertiary)'
// // //                     }
// // //                 },
// // //                 navigation: {
// // //                     item: {
// // //                         focusBackground: 'var(--component-bg-hover)',
// // //                         activeBackground: 'var(--component-bg-active)',
// // //                         color: 'var(--text-primary)',
// // //                         focusColor: 'var(--text-primary)',
// // //                         activeColor: 'var(--accent-primary)',
// // //                         icon: {
// // //                             color: 'var(--text-secondary)',
// // //                             focusColor: 'var(--text-primary)',
// // //                             activeColor: 'var(--accent-primary)'
// // //                         }
// // //                     },
// // //                     submenuLabel: {
// // //                         background: 'transparent',
// // //                         color: 'var(--text-tertiary)'
// // //                     },
// // //                     submenuIcon: {
// // //                         color: 'var(--text-secondary)',
// // //                         focusColor: 'var(--text-primary)',
// // //                         activeColor: 'var(--accent-primary)'
// // //                     }
// // //                 }
// // //             }
// // //         }
// // //     }
// // // });
