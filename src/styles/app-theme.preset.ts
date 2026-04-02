/**
 * ============================================================================
 * APEX CRM — PrimeNG Preset  v1.0
 * ============================================================================
 * A complete, production-grade PrimeNG theme preset built from scratch.
 * Works with the Apex CRM multi-theme system (apex-themes-v2.scss).
 *
 * This preset defines ALL design tokens at 3 tiers:
 *   • primitive  — raw color palette (no semantic meaning)
 *   • semantic   — contextual tokens (primary, surface, form fields, focus)
 *   • components — per-component token overrides (40+ components)
 *
 * SETUP (app.config.ts)
 * ──────────────────────
 * import { definePreset } from '@primeuix/themes';
 * import Aura from '@primeuix/themes/aura';
 * import { ApexPreset } from './apex-preset';
 *
 * providePrimeNG({
 *   theme: {
 *     preset: ApexPreset,
 *     options: {
 *       darkModeSelector: '.theme-dark, .theme-neon-eclipse, .theme-obsidian-rose,
 *         .theme-deep-emerald, .theme-midnight-bronze, .theme-molten-ember,
 *         .theme-neon-void, .theme-obsidian-jade, .theme-solar-flare,
 *         .theme-nebula, .theme-luxury, .theme-abyssal-coral,
 *         .theme-crimson-noir, .theme-void-steel, .theme-aurora-glass,
 *         .theme-horizon, .theme-amethyst-dusk',
 *       cssLayer: {
 *         name: 'primeng',
 *         order: 'theme, base, primeng'
 *       }
 *     }
 *   }
 * })
 *
 * HOW APEX THEMES INTEGRATE
 * ──────────────────────────
 * The Apex theme system (apex-themes-v2.scss) sets CSS variables like:
 *   --accent-primary, --bg-primary, --text-primary, etc.
 *
 * This preset uses those same CSS variables as its token values, so when
 * a theme class (e.g. .theme-luxury) is applied to <html>, both this preset
 * and all Apex UI classes change together automatically.
 *
 * NOTE: PrimeNG preset tokens must be static strings or references to other
 * preset tokens. They cannot use var() directly — that's handled in the
 * CSS variable bridge (apex-primeng-theme.scss). This preset sets the
 * structural shape/relationships between tokens correctly so that the bridge
 * overrides take effect cleanly.
 * ============================================================================
 */

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

// ─── TYPE HELPERS ────────────────────────────────────────────────────────────
// These help TypeScript understand the preset shape
type ColorScale = {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string;
};

// ─── PRIMITIVE PALETTE ───────────────────────────────────────────────────────
// Raw color values with no semantic meaning.
// These map to the Apex accent system shades.
// For runtime theme switching, the CSS variable bridge overrides these.

const primitive = {
  borderRadius: {
    none: '0',
    xs:   '4px',
    sm:   '6px',
    md:   '10px',
    lg:   '16px',
    xl:   '20px',
    '2xl': '24px',
    '3xl': '28px',
    full: '9999px',
  },

  // Accent / Primary palette — indigo-violet default (Dark Default theme feel)
  // Runtime: overridden by apex-primeng-theme.scss per active theme
  apex: {
    50:  '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  } as ColorScale,

  // Surface scale — zinc dark (default dark surface)
  surface: {
    0:   '#ffffff',
    50:  '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  } as ColorScale,

  // Status primitives
  green: {
    50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
    400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
    800: '#166534', 900: '#14532d', 950: '#052e16',
  },
  amber: {
    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
    400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
    800: '#92400e', 900: '#78350f', 950: '#451a03',
  },
  red: {
    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
    400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
    800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
  },
  sky: {
    50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
    400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
    800: '#075985', 900: '#0c4a6e', 950: '#082f49',
  },
};

// ─── SEMANTIC TOKENS ─────────────────────────────────────────────────────────
// Context-aware tokens. The colorScheme block is critical — it defines
// both light and dark values. Apex overrides these via CSS variables.

const semantic = {
  transitionDuration: '0.18s',
  focusRing: {
    width:  '2px',
    style:  'solid',
    color:  '{primary.color}',
    offset: '2px',
    shadow: 'none',
  },
  disabledOpacity: '0.55',
  iconSize:        '1rem',
  anchoredZIndex:  'auto',

  // Primary maps to our apex primitive
  primary: {
    50:  '{apex.50}',
    100: '{apex.100}',
    200: '{apex.200}',
    300: '{apex.300}',
    400: '{apex.400}',
    500: '{apex.500}',
    600: '{apex.600}',
    700: '{apex.700}',
    800: '{apex.800}',
    900: '{apex.900}',
    950: '{apex.950}',
  },

  // Form fields — shared by all input components
  formField: {
    paddingX:           '0.75rem',
    paddingY:           '0.5rem',
    borderRadius:       '{border.radius.md}',
    focusRing: {
      width:  '2px',
      style:  'solid',
      color:  '{primary.color}',
      offset: '2px',
      shadow: '0 0 0 4px {primary.color}20',
    },
    transitionDuration: '0.18s',
    sm: {
      fontSize: '0.75rem',
      paddingX: '0.625rem',
      paddingY: '0.375rem',
    },
    lg: {
      fontSize: '1rem',
      paddingX: '0.875rem',
      paddingY: '0.625rem',
    },
  },

  list: {
    padding:       '0.375rem',
    gap:           '2px',
    header: {
      padding: '0.5rem 0.75rem',
    },
    option: {
      padding:      '0.5rem 0.75rem',
      borderRadius: '{border.radius.sm}',
    },
    optionGroup: {
      padding:     '0.5rem 0.75rem',
      fontWeight:  '700',
    },
  },

  content: {
    borderRadius: '{border.radius.lg}',
  },

  mask: {
    transitionDuration: '0.22s',
  },

  navigation: {
    list: {
      padding:      '0.375rem',
      gap:          '2px',
    },
    item: {
      padding:      '0.5rem 0.75rem',
      borderRadius: '{border.radius.sm}',
      gap:          '0.5rem',
    },
    submenuLabel: {
      padding:    '0.5rem 0.75rem',
      fontWeight: '700',
    },
    submenuIcon: {
      size: '0.75rem',
    },
  },

  overlay: {
    select: {
      borderRadius: '{border.radius.lg}',
      shadow:       '0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)',
    },
    popover: {
      borderRadius: '{border.radius.lg}',
      shadow:       '0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)',
    },
    modal: {
      borderRadius: '{border.radius.xl}',
      shadow:       '0 8px 24px rgba(0,0,0,0.14), 0 16px 48px rgba(0,0,0,0.10)',
    },
    navigation: {
      shadow: '0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)',
    },
  },

  colorScheme: {
    light: {
      surface: {
        0:   '#ffffff',
        50:  '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617',
      },
      primary: {
        color:         '{primary.500}',
        contrastColor: '#ffffff',
        hoverColor:    '{primary.600}',
        activeColor:   '{primary.700}',
      },
      highlight: {
        background:        '{primary.50}',
        focusBackground:   '{primary.100}',
        color:             '{primary.700}',
        focusColor:        '{primary.800}',
      },
      mask: {
        background: 'rgba(0,0,0,0.5)',
        color:      '{surface.200}',
      },
      formField: {
        background:           '{surface.0}',
        disabledBackground:   '{surface.100}',
        filledBackground:     '{surface.50}',
        filledHoverBackground: '{surface.100}',
        filledFocusBackground: '{surface.50}',
        borderColor:          '{surface.300}',
        hoverBorderColor:     '{surface.400}',
        focusBorderColor:     '{primary.color}',
        invalidBorderColor:   '{red.600}',
        color:                '{surface.900}',
        disabledColor:        '{surface.400}',
        placeholderColor:     '{surface.400}',
        invalidPlaceholderColor: '{red.400}',
        floatLabelColor:      '{surface.400}',
        floatLabelFocusColor: '{primary.600}',
        floatLabelActiveColor: '{surface.400}',
        floatLabelInvalidColor: '{red.600}',
        iconColor:            '{surface.400}',
        shadow:               'none',
      },
      text: {
        color:          '{surface.900}',
        hoverColor:     '{surface.950}',
        mutedColor:     '{surface.500}',
        hoverMutedColor: '{surface.600}',
      },
      content: {
        background:       '{surface.0}',
        hoverBackground:  '{surface.100}',
        borderColor:      '{surface.200}',
        color:            '{surface.700}',
        hoverColor:       '{surface.800}',
      },
      overlay: {
        select: {
          background:  '{surface.0}',
          borderColor: '{surface.200}',
          color:       '{surface.700}',
        },
        popover: {
          background:  '{surface.0}',
          borderColor: '{surface.200}',
          color:       '{surface.700}',
        },
        modal: {
          background:  '{surface.0}',
          borderColor: '{surface.200}',
          color:       '{surface.700}',
        },
      },
      list: {
        option: {
          focusBackground:        '{surface.100}',
          selectedBackground:     '{primary.50}',
          selectedFocusBackground: '{primary.100}',
          color:                  '{surface.700}',
          focusColor:             '{surface.800}',
          selectedColor:          '{primary.700}',
          selectedFocusColor:     '{primary.800}',
          icon: {
            color:      '{surface.400}',
            focusColor: '{surface.500}',
          },
        },
        optionGroup: {
          background: 'transparent',
          color:      '{surface.400}',
        },
      },
      navigation: {
        item: {
          focusBackground:  '{surface.100}',
          activeBackground: '{primary.50}',
          color:            '{surface.600}',
          focusColor:       '{surface.700}',
          activeColor:      '{primary.600}',
          icon: {
            color:       '{surface.400}',
            focusColor:  '{surface.500}',
            activeColor: '{primary.500}',
          },
        },
        submenuLabel: {
          background: 'transparent',
          color:      '{surface.400}',
        },
        submenuIcon: {
          color:       '{surface.400}',
          focusColor:  '{surface.500}',
          activeColor: '{primary.500}',
        },
      },
    },

    dark: {
      surface: {
        0:   '#ffffff',
        50:  '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
        950: '#09090b',
      },
      primary: {
        color:         '{primary.400}',
        contrastColor: '{surface.900}',
        hoverColor:    '{primary.300}',
        activeColor:   '{primary.200}',
      },
      highlight: {
        background:        '{primary.950}',
        focusBackground:   '{primary.900}',
        color:             '{primary.300}',
        focusColor:        '{primary.200}',
      },
      mask: {
        background: 'rgba(0,0,0,0.6)',
        color:      '{surface.200}',
      },
      formField: {
        background:           '{surface.950}',
        disabledBackground:   '{surface.800}',
        filledBackground:     '{surface.800}',
        filledHoverBackground: '{surface.700}',
        filledFocusBackground: '{surface.800}',
        borderColor:          '{surface.700}',
        hoverBorderColor:     '{surface.600}',
        focusBorderColor:     '{primary.color}',
        invalidBorderColor:   '{red.400}',
        color:                '{surface.50}',
        disabledColor:        '{surface.500}',
        placeholderColor:     '{surface.500}',
        invalidPlaceholderColor: '{red.400}',
        floatLabelColor:      '{surface.500}',
        floatLabelFocusColor: '{primary.400}',
        floatLabelActiveColor: '{surface.400}',
        floatLabelInvalidColor: '{red.400}',
        iconColor:            '{surface.500}',
        shadow:               'none',
      },
      text: {
        color:          '{surface.50}',
        hoverColor:     '{surface.0}',
        mutedColor:     '{surface.400}',
        hoverMutedColor: '{surface.300}',
      },
      content: {
        background:       '{surface.900}',
        hoverBackground:  '{surface.800}',
        borderColor:      '{surface.700}',
        color:            '{surface.100}',
        hoverColor:       '{surface.0}',
      },
      overlay: {
        select: {
          background:  '{surface.900}',
          borderColor: '{surface.700}',
          color:       '{surface.100}',
        },
        popover: {
          background:  '{surface.900}',
          borderColor: '{surface.700}',
          color:       '{surface.100}',
        },
        modal: {
          background:  '{surface.900}',
          borderColor: '{surface.700}',
          color:       '{surface.100}',
        },
      },
      list: {
        option: {
          focusBackground:        '{surface.800}',
          selectedBackground:     '{primary.950}',
          selectedFocusBackground: '{primary.900}',
          color:                  '{surface.300}',
          focusColor:             '{surface.100}',
          selectedColor:          '{primary.300}',
          selectedFocusColor:     '{primary.200}',
          icon: {
            color:      '{surface.500}',
            focusColor: '{surface.400}',
          },
        },
        optionGroup: {
          background: 'transparent',
          color:      '{surface.500}',
        },
      },
      navigation: {
        item: {
          focusBackground:  '{surface.800}',
          activeBackground: '{primary.950}',
          color:            '{surface.400}',
          focusColor:       '{surface.200}',
          activeColor:      '{primary.300}',
          icon: {
            color:       '{surface.500}',
            focusColor:  '{surface.400}',
            activeColor: '{primary.400}',
          },
        },
        submenuLabel: {
          background: 'transparent',
          color:      '{surface.500}',
        },
        submenuIcon: {
          color:       '{surface.500}',
          focusColor:  '{surface.400}',
          activeColor: '{primary.400}',
        },
      },
    },
  },
};

// ─── COMPONENT TOKENS ────────────────────────────────────────────────────────
// Per-component overrides. These map to the semantic tokens above.
// Format exactly matches PrimeNG's Aura preset component shape.

const components = {

  // ── ACCORDION ──────────────────────────────────────────────────────────────
  accordion: {
    transitionDuration: '{transition.duration}',
    panel: {
      borderWidth: '1px',
      borderColor: '{content.border.color}',
    },
    header: {
      color:            '{text.muted.color}',
      hoverColor:       '{text.color}',
      activeColor:      '{primary.color}',
      activeHoverColor: '{primary.hover.color}',
      padding:          '1rem 1.25rem',
      fontWeight:       '600',
      borderRadius:     '{content.border.radius}',
      borderWidth:      '0',
      borderColor:      'transparent',
      background:       '{content.background}',
      hoverBackground:  '{content.hover.background}',
      activeBackground: '{content.background}',
      activeHoverBackground: '{content.hover.background}',
      focusRing: {
        width:  '{focus.ring.width}',
        style:  '{focus.ring.style}',
        color:  '{focus.ring.color}',
        offset: '{focus.ring.offset}',
        shadow: 'none',
      },
      toggleIcon: {
        color:            '{text.muted.color}',
        hoverColor:       '{text.color}',
        activeColor:      '{primary.color}',
        activeHoverColor: '{primary.hover.color}',
      },
    },
    content: {
      borderWidth:  '1px',
      borderColor:  '{content.border.color}',
      background:   '{content.background}',
      color:        '{text.muted.color}',
      padding:      '0.75rem 1.25rem 1rem',
    },
  },

  // ── AUTOCOMPLETE ───────────────────────────────────────────────────────────
  autocomplete: {
    background:          '{form.field.background}',
    disabledBackground:  '{form.field.disabled.background}',
    filledBackground:    '{form.field.filled.background}',
    filledHoverBackground: '{form.field.filled.hover.background}',
    filledFocusBackground: '{form.field.filled.focus.background}',
    borderColor:         '{form.field.border.color}',
    hoverBorderColor:    '{form.field.hover.border.color}',
    focusBorderColor:    '{form.field.focus.border.color}',
    invalidBorderColor:  '{form.field.invalid.border.color}',
    color:               '{form.field.color}',
    disabledColor:       '{form.field.disabled.color}',
    placeholderColor:    '{form.field.placeholder.color}',
    shadow:              '{form.field.shadow}',
    paddingX:            '{form.field.padding.x}',
    paddingY:            '{form.field.padding.y}',
    borderRadius:        '{form.field.border.radius}',
    focusRing: {
      width:  '{form.field.focus.ring.width}',
      style:  '{form.field.focus.ring.style}',
      color:  '{form.field.focus.ring.color}',
      offset: '{form.field.focus.ring.offset}',
      shadow: '{form.field.focus.ring.shadow}',
    },
    transitionDuration: '{form.field.transition.duration}',
    overlay: {
      background:   '{overlay.select.background}',
      borderColor:  '{overlay.select.border.color}',
      borderRadius: '{overlay.select.border.radius}',
      color:        '{overlay.select.color}',
      shadow:       '{overlay.select.shadow}',
    },
    list: {
      padding:   '{list.padding}',
      gap:       '{list.gap}',
      header: {
        padding: '{list.header.padding}',
      },
    },
    option: {
      focusBackground:         '{list.option.focus.background}',
      selectedBackground:      '{list.option.selected.background}',
      selectedFocusBackground: '{list.option.selected.focus.background}',
      color:                   '{list.option.color}',
      focusColor:              '{list.option.focus.color}',
      selectedColor:           '{list.option.selected.color}',
      selectedFocusColor:      '{list.option.selected.focus.color}',
      padding:                 '{list.option.padding}',
      borderRadius:            '{list.option.border.radius}',
    },
    optionGroup: {
      background:  '{list.option.group.background}',
      color:       '{list.option.group.color}',
      fontWeight:  '{list.option.group.font.weight}',
      padding:     '{list.option.group.padding}',
    },
    emptyMessagePadding: '0.625rem 0.875rem',
    chipBorderRadius: '999px',
  },

  // ── AVATAR ─────────────────────────────────────────────────────────────────
  avatar: {
    width:       '2.5rem',
    height:      '2.5rem',
    fontSize:    '1rem',
    background:  '{primary.50}',
    color:       '{primary.700}',
    borderRadius: '50%',
    group: {
      borderColor:  '{content.background}',
      offset:       '-0.75rem',
    },
    lg: {
      width:    '3rem',
      height:   '3rem',
      fontSize: '1.25rem',
    },
    xl: {
      width:    '4rem',
      height:   '4rem',
      fontSize: '1.5rem',
    },
  },

  // ── BADGE ──────────────────────────────────────────────────────────────────
  badge: {
    borderRadius:  '999px',
    padding:       '0 0.5rem',
    minWidth:      '1.25rem',
    height:        '1.25rem',
    fontSize:      '0.65rem',
    fontWeight:    '700',
    dotSize:       '0.5rem',
    sm: {
      fontSize: '0.6rem',
      minWidth: '1rem',
      height:   '1rem',
    },
    lg: {
      fontSize: '0.75rem',
      minWidth: '1.5rem',
      height:   '1.5rem',
    },
    xl: {
      fontSize: '0.875rem',
      minWidth: '1.75rem',
      height:   '1.75rem',
    },
    primary: {
      background: '{primary.color}',
      color:      '{primary.contrast.color}',
    },
    secondary: {
      background: '{content.hover.background}',
      color:      '{text.muted.color}',
    },
    success: {
      background: 'rgba(34,197,94,1)',
      color:      '#ffffff',
    },
    info: {
      background: 'rgba(14,165,233,1)',
      color:      '#ffffff',
    },
    warn: {
      background: 'rgba(245,158,11,1)',
      color:      '#ffffff',
    },
    danger: {
      background: 'rgba(239,68,68,1)',
      color:      '#ffffff',
    },
    contrast: {
      background: '{text.color}',
      color:      '{content.background}',
    },
  },

  // ── BREADCRUMB ─────────────────────────────────────────────────────────────
  breadcrumb: {
    padding:            '0.75rem 1rem',
    background:         '{content.background}',
    gap:                '0.5rem',
    transitionDuration: '{transition.duration}',
    item: {
      color:       '{text.muted.color}',
      hoverColor:  '{text.color}',
      borderRadius: '4px',
      gap:          '0.375rem',
      icon: {
        color:      '{text.muted.color}',
        hoverColor: '{text.color}',
      },
      focusRing: {
        width:  '{focus.ring.width}',
        style:  '{focus.ring.style}',
        color:  '{focus.ring.color}',
        offset: '{focus.ring.offset}',
        shadow: 'none',
      },
    },
    separator: {
      color: '{text.muted.color}',
    },
  },

  // ── BUTTON ─────────────────────────────────────────────────────────────────
  button: {
    borderRadius:       '{border.radius.md}',
    roundedBorderRadius: '999px',
    gap:                '0.5rem',
    paddingX:           '1rem',
    paddingY:           '0.5rem',
    iconOnlyWidth:      '2.5rem',
    labelFontWeight:    '600',
    raisedShadow:       '0 1px 3px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
    focusRing: {
      width:  '{focus.ring.width}',
      style:  '{focus.ring.style}',
      offset: '{focus.ring.offset}',
    },
    transitionDuration: '{transition.duration}',
    sm: {
      fontSize:     '0.75rem',
      paddingX:     '0.75rem',
      paddingY:     '0.375rem',
      iconOnlyWidth: '2rem',
    },
    lg: {
      fontSize:     '1rem',
      paddingX:     '1.25rem',
      paddingY:     '0.625rem',
      iconOnlyWidth: '3rem',
    },
    primary: {
      background:       '{primary.color}',
      hoverBackground:  '{primary.hover.color}',
      activeBackground: '{primary.active.color}',
      borderColor:      '{primary.color}',
      hoverBorderColor: '{primary.hover.color}',
      activeBorderColor: '{primary.active.color}',
      color:            '{primary.contrast.color}',
      hoverColor:       '{primary.contrast.color}',
      activeColor:      '{primary.contrast.color}',
      focusRing: {
        color:  '{primary.color}',
        shadow: '0 0 0 4px {primary.color}20',
      },
    },
    secondary: {
      background:       '{content.hover.background}',
      hoverBackground:  '{content.border.color}',
      activeBackground: '{content.border.color}',
      borderColor:      '{content.border.color}',
      hoverBorderColor: '{content.border.color}',
      activeBorderColor: '{content.border.color}',
      color:            '{text.muted.color}',
      hoverColor:       '{text.color}',
      activeColor:      '{text.color}',
      focusRing: {
        color:  '{primary.color}',
        shadow: '0 0 0 4px {primary.color}20',
      },
    },
    success: {
      background:       '{green.600}',
      hoverBackground:  '{green.700}',
      activeBackground: '{green.800}',
      borderColor:      '{green.600}',
      hoverBorderColor: '{green.700}',
      activeBorderColor: '{green.800}',
      color:            '#ffffff',
      hoverColor:       '#ffffff',
      activeColor:      '#ffffff',
      focusRing: {
        color:  '{green.600}',
        shadow: '0 0 0 4px {green.600}20',
      },
    },
    info: {
      background:       '{sky.600}',
      hoverBackground:  '{sky.700}',
      activeBackground: '{sky.800}',
      borderColor:      '{sky.600}',
      hoverBorderColor: '{sky.700}',
      activeBorderColor: '{sky.800}',
      color:            '#ffffff',
      hoverColor:       '#ffffff',
      activeColor:      '#ffffff',
      focusRing: {
        color:  '{sky.600}',
        shadow: '0 0 0 4px {sky.600}20',
      },
    },
    warn: {
      background:       '{amber.500}',
      hoverBackground:  '{amber.600}',
      activeBackground: '{amber.700}',
      borderColor:      '{amber.500}',
      hoverBorderColor: '{amber.600}',
      activeBorderColor: '{amber.700}',
      color:            '#ffffff',
      hoverColor:       '#ffffff',
      activeColor:      '#ffffff',
      focusRing: {
        color:  '{amber.500}',
        shadow: '0 0 0 4px {amber.500}20',
      },
    },
    danger: {
      background:       '{red.600}',
      hoverBackground:  '{red.700}',
      activeBackground: '{red.800}',
      borderColor:      '{red.600}',
      hoverBorderColor: '{red.700}',
      activeBorderColor: '{red.800}',
      color:            '#ffffff',
      hoverColor:       '#ffffff',
      activeColor:      '#ffffff',
      focusRing: {
        color:  '{red.600}',
        shadow: '0 0 0 4px {red.600}20',
      },
    },
    contrast: {
      background:       '{text.color}',
      hoverBackground:  '{text.hover.color}',
      activeBackground: '{text.muted.color}',
      borderColor:      '{text.color}',
      hoverBorderColor: '{text.hover.color}',
      activeBorderColor: '{text.muted.color}',
      color:            '{content.background}',
      hoverColor:       '{content.background}',
      activeColor:      '{content.background}',
      focusRing: {
        color:  '{text.color}',
        shadow: '0 0 0 4px {primary.color}20',
      },
    },
  },

  // ── CARD ───────────────────────────────────────────────────────────────────
  card: {
    background:   '{content.background}',
    borderRadius: '{content.border.radius}',
    color:        '{text.color}',
    shadow:       '0 1px 3px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)',
    body: {
      padding: '1.5rem',
      gap:     '0.75rem',
    },
    caption: {
      gap: '0.375rem',
    },
    title: {
      fontSize:   '1rem',
      fontWeight: '600',
    },
    subtitle: {
      color: '{text.muted.color}',
    },
  },

  // ── CHECKBOX ───────────────────────────────────────────────────────────────
  checkbox: {
    borderRadius:           '{border.radius.sm}',
    width:                  '1.125rem',
    height:                 '1.125rem',
    background:             '{form.field.background}',
    checkedBackground:      '{primary.color}',
    checkedHoverBackground: '{primary.hover.color}',
    disabledBackground:     '{form.field.disabled.background}',
    filledBackground:       '{form.field.filled.background}',
    borderColor:            '{form.field.border.color}',
    hoverBorderColor:       '{form.field.border.color}',
    focusBorderColor:       '{primary.color}',
    checkedBorderColor:     '{primary.color}',
    checkedHoverBorderColor: '{primary.hover.color}',
    checkedFocusBorderColor: '{primary.color}',
    checkedDisabledBorderColor: '{form.field.disabled.background}',
    invalidBorderColor:     '{form.field.invalid.border.color}',
    shadow:                 'none',
    focusRing: {
      width:  '{focus.ring.width}',
      style:  '{focus.ring.style}',
      color:  '{focus.ring.color}',
      offset: '{focus.ring.offset}',
      shadow: '0 0 0 4px {primary.color}20',
    },
    transitionDuration: '{transition.duration}',
    icon: {
      size:              '0.75rem',
      color:             '{primary.contrast.color}',
      checkedColor:      '{primary.contrast.color}',
      checkedHoverColor: '{primary.contrast.color}',
      disabledColor:     '{form.field.disabled.color}',
    },
    sm: { width: '0.875rem', height: '0.875rem' },
    lg: { width: '1.375rem', height: '1.375rem' },
  },

  // ── CHIP ───────────────────────────────────────────────────────────────────
  chip: {
    borderRadius:         '999px',
    paddingX:             '0.75rem',
    paddingY:             '0.25rem',
    gap:                  '0.375rem',
    background:           '{content.hover.background}',
    color:                '{text.muted.color}',
    iconSize:             '0.875rem',
    image: {
      width:  '1.75rem',
      height: '1.75rem',
    },
    removeIcon: {
      size: '0.875rem',
      focusRing: {
        width:  '{focus.ring.width}',
        style:  '{focus.ring.style}',
        color:  '{focus.ring.color}',
        offset: '{focus.ring.offset}',
        shadow: '0 0 0 4px {primary.color}20',
      },
    },
    transitionDuration: '{transition.duration}',
  },

  // ── DATEPICKER ─────────────────────────────────────────────────────────────
  datepicker: {
    transitionDuration: '{transition.duration}',
    panel: {
      background:   '{overlay.select.background}',
      borderColor:  '{overlay.select.border.color}',
      color:        '{overlay.select.color}',
      borderRadius: '{overlay.select.border.radius}',
      shadow:       '{overlay.select.shadow}',
      padding:      '1rem',
    },
    header: {
      background:  'transparent',
      borderColor: '{content.border.color}',
      color:       '{text.color}',
      padding:     '0 0 0.75rem',
    },
    title: {
      gap:        '0.375rem',
      fontWeight: '600',
    },
    dropdown: {
      width:              '2.5rem',
      borderRadius:       '{border.radius.md}',
      background:         'transparent',
      hoverBackground:    '{content.hover.background}',
      activeBackground:   '{content.hover.background}',
      borderColor:        '{content.border.color}',
      hoverBorderColor:   '{primary.color}',
      activeBorderColor:  '{primary.color}',
      color:              '{text.muted.color}',
      hoverColor:         '{text.color}',
      activeColor:        '{primary.color}',
      focusRing: {
        width: '{focus.ring.width}', style: '{focus.ring.style}',
        color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
      },
    },
    inputIcon: { color: '{text.muted.color}' },
    selectMonth: {
      hoverBackground: '{content.hover.background}',
      color:           '{text.muted.color}',
      hoverColor:      '{text.color}',
      padding:         '0.25rem 0.5rem',
      borderRadius:    '{border.radius.sm}',
    },
    selectYear: {
      hoverBackground: '{content.hover.background}',
      color:           '{text.muted.color}',
      hoverColor:      '{text.color}',
      padding:         '0.25rem 0.5rem',
      borderRadius:    '{border.radius.sm}',
    },
    group: { borderColor: '{content.border.color}', gap: '0' },
    dayView: { margin: '0.75rem 0 0' },
    weekDay: {
      padding:    '0.25rem',
      fontWeight: '600',
      color:      '{text.muted.color}',
    },
    date: {
      hoverBackground:       '{content.hover.background}',
      selectedBackground:    '{primary.color}',
      rangeSelectedBackground: '{primary.50}',
      color:                 '{text.muted.color}',
      hoverColor:            '{text.color}',
      selectedColor:         '{primary.contrast.color}',
      rangeSelectedColor:    '{primary.700}',
      width:                 '2.25rem',
      height:                '2.25rem',
      borderRadius:          '{border.radius.md}',
      padding:               '0.25rem',
      focusRing: {
        width: '{focus.ring.width}', style: '{focus.ring.style}',
        color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
      },
    },
    monthView: { margin: '0.75rem 0 0' },
    month: { padding: '0.375rem 0.625rem', borderRadius: '{border.radius.md}' },
    yearView:  { margin: '0.75rem 0 0' },
    year:  { padding: '0.375rem 0.625rem', borderRadius: '{border.radius.md}' },
    buttonbar: { padding: '0.75rem 0 0', borderColor: '{content.border.color}' },
    timePicker: {
      padding:      '0.5rem 0 0',
      borderColor:  '{content.border.color}',
      gap:          '0.25rem',
      buttonGap:    '0.375rem',
    },
    today: {
      background: '{primary.50}',
      color:      '{primary.700}',
    },
  },

  // ── DIALOG ─────────────────────────────────────────────────────────────────
  dialog: {
    background:   '{overlay.modal.background}',
    borderColor:  '{overlay.modal.border.color}',
    color:        '{overlay.modal.color}',
    borderRadius: '{overlay.modal.border.radius}',
    shadow:       '{overlay.modal.shadow}',
    header: {
      padding: '1.25rem 1.5rem',
      gap:     '0.75rem',
    },
    title: {
      fontSize:   '1rem',
      fontWeight: '600',
    },
    content: {
      padding: '0 1.5rem 1.5rem',
    },
    footer: {
      padding: '1rem 1.5rem',
      gap:     '0.5rem',
    },
  },

  // ── DIVIDER ────────────────────────────────────────────────────────────────
  divider: {
    borderColor:      '{content.border.color}',
    content: {
      background: '{content.background}',
      color:      '{text.muted.color}',
    },
  },

  // ── DRAWER ─────────────────────────────────────────────────────────────────
  drawer: {
    background:   '{overlay.modal.background}',
    borderColor:  '{overlay.modal.border.color}',
    color:        '{overlay.modal.color}',
    shadow:       '{overlay.modal.shadow}',
    header: {
      padding: '1.25rem 1.5rem',
    },
    content: {
      padding: '0 1.5rem',
    },
    footer: {
      padding: '1rem 1.5rem',
    },
    closeButton: {
      width:        '2rem',
      height:       '2rem',
      borderRadius: '{border.radius.md}',
      hoverBackground: '{content.hover.background}',
      color:        '{text.muted.color}',
      hoverColor:   '{text.color}',
      focusRing: {
        width: '{focus.ring.width}', style: '{focus.ring.style}',
        color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
      },
    },
  },

  // ── FIELDSET ───────────────────────────────────────────────────────────────
  fieldset: {
    background:   '{content.background}',
    borderColor:  '{content.border.color}',
    borderRadius: '{content.border.radius}',
    color:        '{text.color}',
    padding:      '1.25rem 1.5rem',
    legend: {
      background:       '{content.background}',
      hoverBackground:  '{content.hover.background}',
      color:            '{text.color}',
      hoverColor:       '{text.color}',
      padding:          '0.5rem 0.75rem',
      fontWeight:       '600',
      borderRadius:     '{border.radius.md}',
      focusRing: {
        width: '{focus.ring.width}', style: '{focus.ring.style}',
        color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
      },
    },
    toggleIcon: {
      color:      '{text.muted.color}',
      hoverColor: '{text.color}',
    },
  },

  // ── INPUTTEXT ──────────────────────────────────────────────────────────────
  inputtext: {
    background:          '{form.field.background}',
    disabledBackground:  '{form.field.disabled.background}',
    filledBackground:    '{form.field.filled.background}',
    filledHoverBackground: '{form.field.filled.hover.background}',
    filledFocusBackground: '{form.field.filled.focus.background}',
    borderColor:         '{form.field.border.color}',
    hoverBorderColor:    '{form.field.hover.border.color}',
    focusBorderColor:    '{form.field.focus.border.color}',
    invalidBorderColor:  '{form.field.invalid.border.color}',
    color:               '{form.field.color}',
    disabledColor:       '{form.field.disabled.color}',
    placeholderColor:    '{form.field.placeholder.color}',
    invalidPlaceholderColor: '{form.field.invalid.placeholder.color}',
    shadow:              '{form.field.shadow}',
    paddingX:            '{form.field.padding.x}',
    paddingY:            '{form.field.padding.y}',
    borderRadius:        '{form.field.border.radius}',
    focusRing: {
      width:  '{form.field.focus.ring.width}',
      style:  '{form.field.focus.ring.style}',
      color:  '{form.field.focus.ring.color}',
      offset: '{form.field.focus.ring.offset}',
      shadow: '{form.field.focus.ring.shadow}',
    },
    transitionDuration: '{form.field.transition.duration}',
    sm: {
      fontSize: '{form.field.sm.font.size}',
      paddingX: '{form.field.sm.padding.x}',
      paddingY: '{form.field.sm.padding.y}',
    },
    lg: {
      fontSize: '{form.field.lg.font.size}',
      paddingX: '{form.field.lg.padding.x}',
      paddingY: '{form.field.lg.padding.y}',
    },
  },

  // ── LISTBOX ────────────────────────────────────────────────────────────────
  listbox: {
    background:   '{form.field.background}',
    disabledBackground: '{form.field.disabled.background}',
    borderColor:  '{form.field.border.color}',
    invalidBorderColor: '{form.field.invalid.border.color}',
    color:        '{form.field.color}',
    disabledColor: '{form.field.disabled.color}',
    shadow:       '0 1px 3px rgba(0,0,0,0.1)',
    borderRadius: '{content.border.radius}',
    padding:      '{list.padding}',
    list: {
      padding: '{list.padding}',
      gap:     '{list.gap}',
      header:  { padding: '{list.header.padding}' },
    },
    option: {
      focusBackground:         '{list.option.focus.background}',
      selectedBackground:      '{list.option.selected.background}',
      selectedFocusBackground: '{list.option.selected.focus.background}',
      color:                   '{list.option.color}',
      focusColor:              '{list.option.focus.color}',
      selectedColor:           '{list.option.selected.color}',
      selectedFocusColor:      '{list.option.selected.focus.color}',
      padding:                 '{list.option.padding}',
      borderRadius:            '{list.option.border.radius}',
      gap:                     '0.5rem',
    },
    optionGroup: {
      background:  '{list.option.group.background}',
      color:       '{list.option.group.color}',
      fontWeight:  '{list.option.group.font.weight}',
      padding:     '{list.option.group.padding}',
    },
    emptyMessagePadding: '0.625rem 0.875rem',
    checkmark: {
      color:        '{list.option.color}',
      gutterStart:  '0.5rem',
      gutterEnd:    '0.25rem',
    },
    focusRing: {
      width: '{focus.ring.width}', style: '{focus.ring.style}',
      color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
    },
  },

  // ── MESSAGE ────────────────────────────────────────────────────────────────
  message: {
    borderRadius:       '{content.border.radius}',
    borderWidth:        '1px',
    transitionDuration: '{transition.duration}',
    content: {
      padding:    '0.875rem 1rem',
      gap:        '0.5rem',
      sm:         { padding: '0.625rem 0.75rem' },
      lg:         { padding: '1.125rem 1.25rem' },
    },
    text: {
      fontSize:   '0.875rem',
      fontWeight: '500',
      sm:         { fontSize: '0.75rem' },
      lg:         { fontSize: '1rem' },
    },
    icon: {
      size:   '1.125rem',
      sm:     { size: '0.875rem' },
      lg:     { size: '1.25rem' },
    },
    closeButton: {
      width: '1.75rem', height: '1.75rem',
      borderRadius: '{border.radius.sm}',
      focusRing: {
        width: '{focus.ring.width}', style: '{focus.ring.style}',
        color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
      },
    },
    closeIcon: { size: '0.875rem', sm: { size: '0.75rem' }, lg: { size: '1rem' } },
    outlined: { borderWidth: '1px' },
    info: {
      background:        '{sky.50}',   borderColor:  '{sky.200}',  color: '{sky.700}',
      shadow:            'none',
      closeButton: { hoverBackground: '{sky.100}', focusRing: { color: '{sky.600}', shadow: 'none' } },
      outlined:    { color: '{sky.600}', borderColor: '{sky.600}' },
      simple:      { color: '{sky.700}' },
    },
    success: {
      background:  '{green.50}',  borderColor: '{green.200}', color: '{green.700}',
      shadow:      'none',
      closeButton: { hoverBackground: '{green.100}', focusRing: { color: '{green.600}', shadow: 'none' } },
      outlined:    { color: '{green.600}', borderColor: '{green.600}' },
      simple:      { color: '{green.700}' },
    },
    warn: {
      background:  '{amber.50}',  borderColor: '{amber.200}', color: '{amber.700}',
      shadow:      'none',
      closeButton: { hoverBackground: '{amber.100}', focusRing: { color: '{amber.600}', shadow: 'none' } },
      outlined:    { color: '{amber.600}', borderColor: '{amber.600}' },
      simple:      { color: '{amber.700}' },
    },
    error: {
      background:  '{red.50}',   borderColor: '{red.200}',   color: '{red.700}',
      shadow:      'none',
      closeButton: { hoverBackground: '{red.100}', focusRing: { color: '{red.600}', shadow: 'none' } },
      outlined:    { color: '{red.600}', borderColor: '{red.600}' },
      simple:      { color: '{red.700}' },
    },
    secondary: {
      background:  '{content.hover.background}', borderColor: '{content.border.color}',
      color:       '{text.muted.color}', shadow: 'none',
      closeButton: { hoverBackground: '{content.border.color}', focusRing: { color: '{primary.color}', shadow: 'none' } },
      outlined:    { color: '{text.muted.color}', borderColor: '{content.border.color}' },
      simple:      { color: '{text.muted.color}' },
    },
    contrast: {
      background:  '{text.color}', borderColor: '{text.color}',
      color:       '{content.background}', shadow: 'none',
    },
  },

  // ── MULTISELECT ────────────────────────────────────────────────────────────
  multiselect: {
    background:          '{form.field.background}',
    disabledBackground:  '{form.field.disabled.background}',
    filledBackground:    '{form.field.filled.background}',
    filledHoverBackground: '{form.field.filled.hover.background}',
    filledFocusBackground: '{form.field.filled.focus.background}',
    borderColor:         '{form.field.border.color}',
    hoverBorderColor:    '{form.field.hover.border.color}',
    focusBorderColor:    '{form.field.focus.border.color}',
    invalidBorderColor:  '{form.field.invalid.border.color}',
    color:               '{form.field.color}',
    disabledColor:       '{form.field.disabled.color}',
    placeholderColor:    '{form.field.placeholder.color}',
    shadow:              '{form.field.shadow}',
    paddingX:            '{form.field.padding.x}',
    paddingY:            '{form.field.padding.y}',
    borderRadius:        '{form.field.border.radius}',
    focusRing: {
      width: '{form.field.focus.ring.width}', style: '{form.field.focus.ring.style}',
      color: '{form.field.focus.ring.color}', offset: '{form.field.focus.ring.offset}',
      shadow: '{form.field.focus.ring.shadow}',
    },
    transitionDuration: '{form.field.transition.duration}',
    overlay: {
      background:   '{overlay.select.background}',
      borderColor:  '{overlay.select.border.color}',
      borderRadius: '{overlay.select.border.radius}',
      color:        '{overlay.select.color}',
      shadow:       '{overlay.select.shadow}',
    },
    list: {
      padding: '{list.padding}',
      gap:     '{list.gap}',
      header:  { padding: '{list.header.padding}' },
    },
    option: {
      focusBackground:         '{list.option.focus.background}',
      selectedBackground:      '{list.option.selected.background}',
      selectedFocusBackground: '{list.option.selected.focus.background}',
      color:                   '{list.option.color}',
      focusColor:              '{list.option.focus.color}',
      selectedColor:           '{list.option.selected.color}',
      selectedFocusColor:      '{list.option.selected.focus.color}',
      padding:                 '{list.option.padding}',
      borderRadius:            '{list.option.border.radius}',
      gap:                     '0.5rem',
    },
    optionGroup: {
      background:  '{list.option.group.background}',
      color:       '{list.option.group.color}',
      fontWeight:  '{list.option.group.font.weight}',
      padding:     '{list.option.group.padding}',
    },
    clearIconColor: '{form.field.icon.color}',
    chipBorderRadius: '999px',
    emptyMessagePadding: '0.625rem 0.875rem',
    checkmark: {
      color:        '{list.option.selected.color}',
      gutterStart:  '0.5rem',
      gutterEnd:    '0.25rem',
    },
    sm: {
      fontSize: '{form.field.sm.font.size}',
      paddingX: '{form.field.sm.padding.x}',
      paddingY: '{form.field.sm.padding.y}',
    },
    lg: {
      fontSize: '{form.field.lg.font.size}',
      paddingX: '{form.field.lg.padding.x}',
      paddingY: '{form.field.lg.padding.y}',
    },
  },

  // ── PAGINATOR ──────────────────────────────────────────────────────────────
  paginator: {
    padding:            '0.5rem',
    gap:                '0.25rem',
    borderRadius:       '{content.border.radius}',
    background:         '{content.background}',
    color:              '{text.muted.color}',
    transitionDuration: '{transition.duration}',
    navButton: {
      background:         'transparent',
      hoverBackground:    '{content.hover.background}',
      selectedBackground: '{primary.color}',
      color:              '{text.muted.color}',
      hoverColor:         '{text.color}',
      selectedColor:      '{primary.contrast.color}',
      width:              '2.25rem',
      height:             '2.25rem',
      borderRadius:       '{border.radius.md}',
      focusRing: {
        width: '{focus.ring.width}', style: '{focus.ring.style}',
        color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
      },
    },
    currentPageReport: { color: '{text.muted.color}' },
    jumpToPageInput: { maxWidth: '3rem' },
  },

  // ── PANEL ──────────────────────────────────────────────────────────────────
  panel: {
    background:     '{content.background}',
    borderColor:    '{content.border.color}',
    borderRadius:   '{content.border.radius}',
    color:          '{text.color}',
    header: {
      background:       '{content.background}',
      color:            '{text.color}',
      padding:          '1rem 1.25rem',
      fontWeight:       '600',
      borderRadius:     '{content.border.radius}',
    },
    toggleableHeader: { padding: '0.875rem 1.25rem' },
    content: { padding: '0.75rem 1.25rem 1.25rem' },
    footer: {
      padding:     '0.75rem 1.25rem',
      borderColor: '{content.border.color}',
    },
    toggleButton: {
      hoverBackground: '{content.hover.background}',
      borderRadius:    '{border.radius.md}',
      color:           '{text.muted.color}',
      hoverColor:      '{text.color}',
      width:           '1.75rem',
      height:          '1.75rem',
      focusRing: {
        width: '{focus.ring.width}', style: '{focus.ring.style}',
        color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
      },
    },
  },

  // ── PASSWORD ───────────────────────────────────────────────────────────────
  password: {
    meter: {
      background:   '{content.border.color}',
      borderRadius: '999px',
      height:       '4px',
    },
    icon: {
      color:      '{form.field.icon.color}',
      hoverColor: '{text.muted.color}',
    },
    overlay: {
      background:   '{overlay.popover.background}',
      borderColor:  '{overlay.popover.border.color}',
      borderRadius: '{overlay.popover.border.radius}',
      color:        '{overlay.popover.color}',
      shadow:       '{overlay.popover.shadow}',
      padding:      '1rem 1.25rem',
    },
    content: { gap: '0.75rem' },
    weak:   { background: '{red.500}' },
    medium: { background: '{amber.500}' },
    strong: { background: '{green.500}' },
  },

  // ── POPOVER ────────────────────────────────────────────────────────────────
  popover: {
    background:   '{overlay.popover.background}',
    borderColor:  '{overlay.popover.border.color}',
    color:        '{overlay.popover.color}',
    borderRadius: '{overlay.popover.border.radius}',
    shadow:       '{overlay.popover.shadow}',
    gutter:       '10px',
    arrowOffset:  '1.25rem',
    content: { padding: '1rem 1.25rem' },
  },

  // ── PROGRESSBAR ────────────────────────────────────────────────────────────
  progressbar: {
    background:   '{content.border.color}',
    borderRadius: '999px',
    height:       '4px',
    value: {
      background: '{primary.color}',
    },
    label: {
      color:      '{primary.contrast.color}',
      fontSize:   '0.65rem',
      fontWeight: '600',
    },
  },

  // ── RADIOBUTTON ────────────────────────────────────────────────────────────
  radiobutton: {
    width:              '1.125rem',
    height:             '1.125rem',
    background:         '{form.field.background}',
    checkedBackground:  '{primary.color}',
    checkedHoverBackground: '{primary.hover.color}',
    disabledBackground: '{form.field.disabled.background}',
    filledBackground:   '{form.field.filled.background}',
    borderColor:        '{form.field.border.color}',
    hoverBorderColor:   '{primary.color}',
    focusBorderColor:   '{primary.color}',
    checkedBorderColor: '{primary.color}',
    checkedHoverBorderColor: '{primary.hover.color}',
    checkedDisabledBorderColor: '{form.field.disabled.background}',
    invalidBorderColor: '{form.field.invalid.border.color}',
    shadow:             'none',
    focusRing: {
      width: '{focus.ring.width}', style: '{focus.ring.style}',
      color: '{focus.ring.color}', offset: '{focus.ring.offset}',
      shadow: '0 0 0 4px {primary.color}20',
    },
    transitionDuration: '{transition.duration}',
    icon: {
      size:                  '0.5rem',
      checkedBackground:     '{primary.contrast.color}',
      checkedHoverBackground: '{primary.contrast.color}',
      disabledBackground:    '{form.field.disabled.color}',
    },
    sm: { width: '0.875rem', height: '0.875rem' },
    lg: { width: '1.375rem', height: '1.375rem' },
  },

  // ── RATING ─────────────────────────────────────────────────────────────────
  rating: {
    gap:           '0.25rem',
    transitionDuration: '{transition.duration}',
    icon: {
      size:        '1.125rem',
      color:       '{text.muted.color}',
      hoverColor:  '{primary.color}',
      activeColor: '{primary.color}',
    },
    focusRing: {
      width: '{focus.ring.width}', style: '{focus.ring.style}',
      color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
    },
  },

  // ── SELECT ─────────────────────────────────────────────────────────────────
  select: {
    background:          '{form.field.background}',
    disabledBackground:  '{form.field.disabled.background}',
    filledBackground:    '{form.field.filled.background}',
    filledHoverBackground: '{form.field.filled.hover.background}',
    filledFocusBackground: '{form.field.filled.focus.background}',
    borderColor:         '{form.field.border.color}',
    hoverBorderColor:    '{form.field.hover.border.color}',
    focusBorderColor:    '{form.field.focus.border.color}',
    invalidBorderColor:  '{form.field.invalid.border.color}',
    color:               '{form.field.color}',
    disabledColor:       '{form.field.disabled.color}',
    placeholderColor:    '{form.field.placeholder.color}',
    invalidPlaceholderColor: '{form.field.invalid.placeholder.color}',
    shadow:              '{form.field.shadow}',
    paddingX:            '{form.field.padding.x}',
    paddingY:            '{form.field.padding.y}',
    borderRadius:        '{form.field.border.radius}',
    focusRing: {
      width: '{form.field.focus.ring.width}', style: '{form.field.focus.ring.style}',
      color: '{form.field.focus.ring.color}', offset: '{form.field.focus.ring.offset}',
      shadow: '{form.field.focus.ring.shadow}',
    },
    transitionDuration: '{form.field.transition.duration}',
    dropdown: {
      width: '2.5rem',
      color: '{form.field.icon.color}',
    },
    overlay: {
      background:   '{overlay.select.background}',
      borderColor:  '{overlay.select.border.color}',
      borderRadius: '{overlay.select.border.radius}',
      color:        '{overlay.select.color}',
      shadow:       '{overlay.select.shadow}',
    },
    list: {
      padding:       '{list.padding}',
      gap:           '{list.gap}',
      header:        { padding: '{list.header.padding}' },
    },
    option: {
      focusBackground:         '{list.option.focus.background}',
      selectedBackground:      '{list.option.selected.background}',
      selectedFocusBackground: '{list.option.selected.focus.background}',
      color:                   '{list.option.color}',
      focusColor:              '{list.option.focus.color}',
      selectedColor:           '{list.option.selected.color}',
      selectedFocusColor:      '{list.option.selected.focus.color}',
      padding:                 '{list.option.padding}',
      borderRadius:            '{list.option.border.radius}',
    },
    optionGroup: {
      background:  '{list.option.group.background}',
      color:       '{list.option.group.color}',
      fontWeight:  '{list.option.group.font.weight}',
      padding:     '{list.option.group.padding}',
    },
    clearIconColor:  '{form.field.icon.color}',
    checkmarkColor:  '{list.option.selected.color}',
    checkmark: {
      color:       '{list.option.selected.color}',
      gutterStart: '0.5rem',
      gutterEnd:   '0.25rem',
    },
    emptyMessagePadding: '0.625rem 0.875rem',
    sm: {
      fontSize: '{form.field.sm.font.size}',
      paddingX: '{form.field.sm.padding.x}',
      paddingY: '{form.field.sm.padding.y}',
    },
    lg: {
      fontSize: '{form.field.lg.font.size}',
      paddingX: '{form.field.lg.padding.x}',
      paddingY: '{form.field.lg.padding.y}',
    },
  },

  // ── SKELETON ───────────────────────────────────────────────────────────────
  skeleton: {
    background:          '{content.border.color}',
    animationBackground: 'rgba(255,255,255,0.1)',
    borderRadius:        '{border.radius.sm}',
  },

  // ── SLIDER ─────────────────────────────────────────────────────────────────
  slider: {
    trackBackground:    '{content.border.color}',
    trackBorderRadius:  '999px',
    trackSize:          '4px',
    rangeBackground:    '{primary.color}',
    handle: {
      width:            '1.125rem',
      height:           '1.125rem',
      borderRadius:     '50%',
      background:       '{primary.color}',
      hoverBackground:  '{primary.hover.color}',
      content: {
        borderRadius: '50%',
        width:        '0.375rem',
        height:       '0.375rem',
        shadow:       'none',
        background:   '{primary.contrast.color}',
        hoverBackground: '{primary.contrast.color}',
      },
      focusRing: {
        width: '{focus.ring.width}', style: '{focus.ring.style}',
        color: '{focus.ring.color}', offset: '{focus.ring.offset}',
        shadow: '0 0 0 4px {primary.color}20',
      },
    },
    transitionDuration: '{transition.duration}',
  },

  // ── STEPPER ────────────────────────────────────────────────────────────────
  stepper: {
    transitionDuration:    '{transition.duration}',
    separator: {
      background:       '{content.border.color}',
      activeBackground: '{primary.color}',
      size:             '2px',
    },
    step: {
      padding:      '0.5rem 1rem',
      gap:          '1rem',
    },
    stepHeader: {
      padding:      '0.5rem 1rem',
      borderRadius: '{border.radius.md}',
      gap:          '0.5rem',
      focusRing: {
        width: '{focus.ring.width}', style: '{focus.ring.style}',
        color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
      },
    },
    stepTitle: {
      color:            '{text.muted.color}',
      activeColor:      '{primary.color}',
      fontWeight:       '500',
      activeFontWeight: '600',
    },
    stepNumber: {
      background:         '{content.hover.background}',
      activeBackground:   '{primary.color}',
      borderRadius:       '50%',
      color:              '{text.muted.color}',
      activeColor:        '{primary.contrast.color}',
      size:               '1.875rem',
      fontSize:           '0.875rem',
      fontWeight:         '600',
    },
    stepPanel: {
      background: 'transparent',
      color:      '{text.muted.color}',
      padding:    '1rem 1.25rem',
    },
  },

  // ── TABS ───────────────────────────────────────────────────────────────────
  tabs: {
    transitionDuration: '{transition.duration}',
    tablist: {
      borderWidth: '0 0 1px 0',
      background:  'transparent',
      borderColor: '{content.border.color}',
    },
    tab: {
      background:       'transparent',
      hoverBackground:  '{content.hover.background}',
      activeBackground: 'transparent',
      borderWidth:      '0 0 2px 0',
      borderColor:      'transparent',
      hoverBorderColor: '{content.border.color}',
      activeBorderColor: '{primary.color}',
      color:            '{text.muted.color}',
      hoverColor:       '{text.color}',
      activeColor:      '{primary.color}',
      padding:          '0.75rem 1.25rem',
      fontWeight:       '500',
      margin:           '0',
      gap:              '0',
      focusRing: {
        width: '{focus.ring.width}', style: '{focus.ring.style}',
        color: '{focus.ring.color}', offset: '-1px', shadow: 'none',
      },
    },
    tabpanel: {
      background:     'transparent',
      color:          '{text.muted.color}',
      padding:        '1rem 0',
      focusRing: {
        width: '0', style: 'none', color: 'transparent', offset: '0', shadow: 'none',
      },
    },
    navButton: {
      background:     '{content.background}',
      color:          '{text.muted.color}',
      hoverColor:     '{text.color}',
      width:          '2.5rem',
      shadow:         '0 1px 3px rgba(0,0,0,0.1)',
      focusRing: {
        width: '{focus.ring.width}', style: '{focus.ring.style}',
        color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
      },
    },
    activeBar: {
      height:     '2px',
      bottom:     '-1px',
      background: '{primary.color}',
    },
  },

  // ── TAG ────────────────────────────────────────────────────────────────────
  tag: {
    fontSize:   '0.65rem',
    fontWeight: '700',
    padding:    '0.2rem 0.625rem',
    gap:        '0.25rem',
    borderRadius: '999px',
    iconSize:   '0.75rem',
    primary:    { background: '{primary.color}',      color: '{primary.contrast.color}' },
    secondary:  { background: '{content.hover.background}', color: '{text.muted.color}' },
    success:    { background: '{green.100}',          color: '{green.800}' },
    info:       { background: '{sky.100}',            color: '{sky.800}' },
    warn:       { background: '{amber.100}',          color: '{amber.800}' },
    danger:     { background: '{red.100}',            color: '{red.800}' },
    contrast:   { background: '{text.color}',         color: '{content.background}' },
  },

  // ── TOAST ──────────────────────────────────────────────────────────────────
  toast: {
    width:              '24rem',
    borderRadius:       '{content.border.radius}',
    borderWidth:        '1px',
    transitionDuration: '{transition.duration}',
    content:            { padding: '1rem 1.25rem', gap: '0.625rem' },
    text:               { gap: '0.25rem' },
    summary:            { fontWeight: '600', fontSize: '0.875rem' },
    detail:             { fontWeight: '400', fontSize: '0.8125rem' },
    closeButton: {
      width: '1.75rem', height: '1.75rem',
      borderRadius: '{border.radius.sm}',
      focusRing: {
        width: '{focus.ring.width}', style: '{focus.ring.style}',
        color: '{focus.ring.color}', offset: '{focus.ring.offset}', shadow: 'none',
      },
    },
    closeIcon:    { size: '0.875rem' },
    info: {
      background: '{sky.50}',   borderColor: '{sky.200}',
      color:      '{sky.700}',  detailColor: '{sky.600}',
      shadow:     '0 2px 8px rgba(14,165,233,0.12)',
      closeButton: { hoverBackground: '{sky.100}', focusRing: { color: '{sky.600}', shadow: 'none' } },
    },
    success: {
      background: '{green.50}', borderColor: '{green.200}',
      color:      '{green.700}', detailColor: '{green.600}',
      shadow:     '0 2px 8px rgba(34,197,94,0.12)',
      closeButton: { hoverBackground: '{green.100}', focusRing: { color: '{green.600}', shadow: 'none' } },
    },
    warn: {
      background: '{amber.50}', borderColor: '{amber.200}',
      color:      '{amber.700}', detailColor: '{amber.600}',
      shadow:     '0 2px 8px rgba(245,158,11,0.12)',
      closeButton: { hoverBackground: '{amber.100}', focusRing: { color: '{amber.600}', shadow: 'none' } },
    },
    error: {
      background: '{red.50}',   borderColor: '{red.200}',
      color:      '{red.700}',  detailColor: '{red.600}',
      shadow:     '0 2px 8px rgba(239,68,68,0.12)',
      closeButton: { hoverBackground: '{red.100}', focusRing: { color: '{red.600}', shadow: 'none' } },
    },
    secondary: {
      background: '{content.hover.background}', borderColor: '{content.border.color}',
      color:      '{text.color}', detailColor: '{text.muted.color}',
      shadow:     '0 2px 8px rgba(0,0,0,0.08)',
      closeButton: { hoverBackground: '{content.border.color}', focusRing: { color: '{primary.color}', shadow: 'none' } },
    },
    contrast: {
      background: '{text.color}', borderColor: '{text.color}',
      color:      '{content.background}', detailColor: '{content.hover.background}',
      shadow:     '0 2px 8px rgba(0,0,0,0.15)',
    },
  },

  // ── TOGGLESWITCH (InputSwitch) ─────────────────────────────────────────────
  toggleswitch: {
    width:              '1.875rem',
    height:             '1.125rem',
    borderRadius:       '999px',
    background:         '{form.field.border.color}',
    hoverBackground:    '{form.field.hover.border.color}',
    checkedBackground:  '{primary.color}',
    checkedHoverBackground: '{primary.hover.color}',
    disabledBackground: '{form.field.disabled.background}',
    invalidBorderColor: '{form.field.invalid.border.color}',
    focusRing: {
      width: '{focus.ring.width}', style: '{focus.ring.style}',
      color: '{focus.ring.color}', offset: '{focus.ring.offset}',
      shadow: '0 0 0 4px {primary.color}20',
    },
    transitionDuration: '{transition.duration}',
    handle: {
      width:             '0.75rem',
      height:            '0.75rem',
      borderRadius:      '50%',
      background:        '#ffffff',
      disabledBackground: '{form.field.disabled.color}',
    },
    sm: { width: '1.5rem', height: '0.875rem' },
    lg: { width: '2.25rem', height: '1.375rem' },
  },

  // ── TOOLBAR ────────────────────────────────────────────────────────────────
  toolbar: {
    background:   '{content.background}',
    borderColor:  '{content.border.color}',
    borderRadius: '{content.border.radius}',
    color:        '{text.color}',
    gap:          '0.5rem',
    padding:      '0.75rem 1rem',
  },

  // ── TOOLTIP ────────────────────────────────────────────────────────────────
  tooltip: {
    background:   '{content.hover.background}',
    color:        '{text.color}',
    padding:      '0.375rem 0.625rem',
    borderRadius: '{border.radius.sm}',
    shadow:       '0 1px 3px rgba(0,0,0,0.1)',
    maxWidth:     '16rem',
    arrow: {
      width:  '6px',
      height: '4px',
    },
  },

  // ── TREE ───────────────────────────────────────────────────────────────────
  tree: {
    background:   '{content.background}',
    borderColor:  '{content.border.color}',
    color:        '{text.color}',
    borderRadius: '{content.border.radius}',
    padding:      '{list.padding}',
    indent:       '1.5rem',
    gap:          '2px',
    node: {
      background:         'transparent',
      hoverBackground:    '{content.hover.background}',
      selectedBackground: '{primary.50}',
      color:              '{text.muted.color}',
      hoverColor:         '{text.color}',
      selectedColor:      '{primary.700}',
      borderRadius:       '{border.radius.sm}',
      padding:            '0.375rem 0.5rem',
      gap:                '0.375rem',
      icon: {
        color:         '{text.muted.color}',
        hoverColor:    '{text.muted.color}',
        selectedColor: '{primary.color}',
      },
      focusRing: {
        width: '{focus.ring.width}', style: '{focus.ring.style}',
        color: '{focus.ring.color}', offset: '-1px', shadow: 'none',
      },
    },
    loadingIcon: { size: '2rem' },
    toggleButton: {
      width:              '1.5rem',
      height:             '1.5rem',
      borderRadius:       '{border.radius.sm}',
      hoverBackground:    '{content.hover.background}',
      selectedBackground: 'transparent',
      color:              '{text.muted.color}',
      hoverColor:         '{text.muted.color}',
      selectedColor:      '{primary.color}',
    },
  },

  // ── DATATABLE ──────────────────────────────────────────────────────────────
  datatable: {
    headerCell: {
      background:         '{content.background}',
      hoverBackground:    '{content.hover.background}',
      selectedBackground: '{primary.50}',
      borderColor:        '{content.border.color}',
      color:              '{text.muted.color}',
      hoverColor:         '{text.color}',
      selectedColor:      '{primary.700}',
      gap:                '0.5rem',
      padding:            '0.625rem 1rem',
      focusRing: {
        width: '0', style: 'none', color: 'transparent', offset: '0', shadow: 'none',
      },
    },
    columnTitle: { fontWeight: '600', fontSize: '0.7rem' },
    row: {
      background:         'transparent',
      hoverBackground:    '{content.hover.background}',
      selectedBackground: '{primary.50}',
      color:              '{text.muted.color}',
      hoverColor:         '{text.color}',
      selectedColor:      '{primary.700}',
      focusRing: {
        width: '0', style: 'none', color: 'transparent', offset: '0', shadow: 'none',
      },
    },
    bodyCell:   { borderColor: '{content.border.color}', padding: '0.625rem 1rem' },
    footerCell: {
      background:  '{content.background}',
      borderColor: '{content.border.color}',
      color:       '{text.muted.color}',
      padding:     '0.625rem 1rem',
    },
    sortIcon: {
      color:      '{text.muted.color}',
      hoverColor: '{primary.color}',
    },
    loadingIcon:    { size: '2rem' },
    stripedRow:     { background: '{content.background}' },
    sm: { headerCellPadding: '0.4rem 0.75rem', bodyCellPadding: '0.4rem 0.75rem' },
    lg: { headerCellPadding: '0.875rem 1.25rem', bodyCellPadding: '0.875rem 1.25rem' },
    filterOverlay: {
      background:   '{overlay.popover.background}',
      borderColor:  '{overlay.popover.border.color}',
      borderRadius: '{overlay.popover.border.radius}',
      color:        '{overlay.popover.color}',
      shadow:       '{overlay.popover.shadow}',
      padding:      '1rem',
    },
    filterConstraint: {
      borderColor:         '{content.border.color}',
      focusBackground:     '{content.hover.background}',
      selectedBackground:  '{primary.50}',
      color:               '{text.muted.color}',
      focusColor:          '{text.color}',
      selectedColor:       '{primary.700}',
      padding:             '0.5rem 0.75rem',
      borderRadius:        '{border.radius.sm}',
    },
    transitionDuration: '{transition.duration}',
  },

};

// ─── EXPORT THE PRESET ───────────────────────────────────────────────────────

export const ApexPreset = definePreset(Aura, {
  primitive,
  semantic,
  components,
});

export default ApexPreset;


/**
 * ============================================================================
 * USAGE IN app.config.ts
 * ============================================================================
 *
 * import { ApplicationConfig } from '@angular/core';
 * import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
 * import { providePrimeNG } from 'primeng/config';
 * import { ApexPreset } from './theme/apex-preset';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideAnimationsAsync(),
 *     providePrimeNG({
 *       ripple: true,
 *       theme: {
 *         preset: ApexPreset,
 *         options: {
 *           // Matches all Apex dark themes — add/remove as needed
 *           darkModeSelector: [
 *             '.theme-dark',
 *             '.theme-neon-eclipse',
 *             '.theme-obsidian-rose',
 *             '.theme-deep-emerald',
 *             '.theme-midnight-bronze',
 *             '.theme-molten-ember',
 *             '.theme-neon-void',
 *             '.theme-obsidian-jade',
 *             '.theme-solar-flare',
 *             '.theme-nebula',
 *             '.theme-luxury',
 *             '.theme-abyssal-coral',
 *             '.theme-crimson-noir',
 *             '.theme-void-steel',
 *             '.theme-aurora-glass',
 *             '.theme-horizon',
 *             '.theme-amethyst-dusk',
 *           ].join(', '),
 *           // Wrap PrimeNG styles in a CSS layer for clean specificity
 *           cssLayer: {
 *             name:  'primeng',
 *             order: 'theme, base, primeng',
 *           },
 *           prefix: 'p',   // keep default --p-* variable prefix
 *         },
 *       },
 *     }),
 *   ],
 * };
 *
 * ============================================================================
 * RUNTIME THEME SWITCHING (ThemeService)
 * ============================================================================
 *
 * import { Injectable, signal } from '@angular/core';
 * import { PrimeNG } from 'primeng/config';
 * import { updatePreset } from '@primeuix/themes';
 * import { ThemeFontLoader } from './apex-font-loader';
 *
 * @Injectable({ providedIn: 'root' })
 * export class ThemeService {
 *   private readonly DARK_THEMES = new Set([
 *     'theme-dark', 'theme-neon-eclipse', 'theme-obsidian-rose',
 *     'theme-deep-emerald', 'theme-midnight-bronze', 'theme-molten-ember',
 *     'theme-neon-void', 'theme-obsidian-jade', 'theme-solar-flare',
 *     'theme-nebula', 'theme-luxury', 'theme-abyssal-coral',
 *     'theme-crimson-noir', 'theme-void-steel', 'theme-aurora-glass',
 *     'theme-horizon', 'theme-amethyst-dusk',
 *   ]);
 *
 *   current = signal<string>('theme-light');
 *
 *   constructor(private primeng: PrimeNG) {
 *     const saved = localStorage.getItem('apex-theme') ?? 'theme-light';
 *     this.apply(saved);
 *   }
 *
 *   async apply(themeId: string): Promise<void> {
 *     await ThemeFontLoader.loadFontsForTheme(themeId);
 *     const root = document.documentElement;
 *     // Remove all theme classes
 *     root.className = root.className
 *       .split(' ')
 *       .filter(c => !c.startsWith('theme-'))
 *       .join(' ')
 *       .trim();
 *     root.classList.add(themeId);
 *     this.current.set(themeId);
 *     localStorage.setItem('apex-theme', themeId);
 *   }
 *
 *   isDark(themeId = this.current()): boolean {
 *     return this.DARK_THEMES.has(themeId);
 *   }
 * }
 * ============================================================================
 */

// // ============================================================================
// //  app-theme.preset.ts
// //  Comprehensive PrimeNG definePreset — maps ALL component tokens to our
// //  application CSS variable system (--theme-*, --color-*, --accent-primary-*)
// //
// //  Usage in app.config.ts:
// //    import { appThemePreset } from './app-theme.preset';
// //    providePrimeNG({ theme: { preset: appThemePreset, options: { darkModeSelector: '.app-dark' } } })
// //
// //  Token tiers used:
// //    Primitive  → raw palette values (slate, blue, green, red, amber, purple)
// //    Semantic   → form.field, focus ring, primary, surface mapped to our tokens
// //    Component  → button, inputtext, select, checkbox, datepicker, textarea,
// //                 inputnumber, multiselect, tag, badge, toast, dialog, card,
// //                 tabs, tooltip, toggleswitch, table, paginator, menu, drawer,
// //                 accordion, panel, message, chip, slider, skeleton, stepper …
// // ============================================================================

// import { definePreset } from '@primeuix/themes';
// import Aura from '@primeuix/themes/aura';

// // ─────────────────────────────────────────────────────────────────────────────
// //  OUR CSS VARIABLE → PRIMENG ROLE MAP
// //
// //  --theme-bg-primary         surface (panels, inputs, overlays)
// //  --theme-bg-secondary       surface elevated (headers, hover rows)
// //  --theme-bg-ternary         surface muted (disabled, filled inputs)
// //  --theme-border-primary     default border
// //  --theme-border-secondary   input/interactive border
// //  --theme-text-primary       main text
// //  --theme-text-secondary     secondary / label text
// //  --theme-text-tertiary      placeholder / muted text
// //  --theme-accent-primary     primary (brand blue)
// //  --component-bg-hover       hover fill for rows/options
// //  --color-success            #22c55e green
// //  --color-warning            #f59e0b amber
// //  --color-error              #ef4444 red
// // ─────────────────────────────────────────────────────────────────────────────

// export const appThemePreset = definePreset(Aura, {

//   // ==========================================================================
//   //  PRIMITIVE — raw color palette, no context, feeds semantic tokens
//   // ==========================================================================
//   primitive: {
//     borderRadius: {
//       none: '0',
//       xs:   '3px',
//       sm:   '5px',      // --ui-border-radius
//       md:   '8px',
//       lg:   '10px',     // --ui-border-radius-lg
//       xl:   '14px',
//       full: '9999px',
//     },

//     blue: {
//       50:  '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
//       400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
//       800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
//     },
//     green: {
//       50:  '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
//       400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
//       800: '#166534', 900: '#14532d', 950: '#052e16',
//     },
//     amber: {
//       50:  '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
//       400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
//       800: '#92400e', 900: '#78350f', 950: '#451a03',
//     },
//     red: {
//       50:  '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
//       400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
//       800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
//     },
//     slate: {
//       0:   '#ffffff',
//       50:  '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
//       400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
//       800: '#1e293b', 900: '#0f172a', 950: '#020617',
//     },
//   },

//   // ==========================================================================
//   //  SEMANTIC — context tokens that reference primitives OR our CSS vars
//   // ==========================================================================
//   semantic: {

//     primary: {
//       50:  '{blue.50}',  100: '{blue.100}', 200: '{blue.200}', 300: '{blue.300}',
//       400: '{blue.400}', 500: '{blue.500}', 600: '{blue.600}', 700: '{blue.700}',
//       800: '{blue.800}', 900: '{blue.900}', 950: '{blue.950}',
//     },

//     focusRing: {
//       width:  '2px',
//       style:  'solid',
//       color:  '{primary.500}',
//       offset: '1px',
//       shadow: '0 0 0 3px rgba(59,130,246,0.18)',
//     },

//     formField: {
//       paddingX:           '0.625rem',
//       paddingY:           '0.4375rem',
//       sm: { fontSize: '0.8125rem', paddingX: '0.5rem',  paddingY: '0.3125rem' },
//       lg: { fontSize: '1rem',      paddingX: '0.75rem', paddingY: '0.5625rem' },
//       borderRadius:       '{primitive.borderRadius.sm}',
//       focusRing: {
//         width:  '2px', style: 'solid',
//         color:  '{primary.500}', offset: '0px',
//         shadow: '0 0 0 3px rgba(59,130,246,0.15)',
//       },
//       transitionDuration: '0.12s',
//     },

//     colorScheme: {

//       // ──────────────────────────────  LIGHT  ────────────────────────────────
//       light: {
//         primary: {
//           color:         '{blue.500}', contrastColor:  '#ffffff',
//           hoverColor:    '{blue.600}', activeColor:    '{blue.700}',
//         },
//         highlight: {
//           background:      'rgba(59,130,246,0.08)',
//           focusBackground: 'rgba(59,130,246,0.14)',
//           color:           '{blue.600}',
//           focusColor:      '{blue.700}',
//         },
//         surface: {
//           0: '#ffffff',
//           50:  '{slate.50}',  100: '{slate.100}', 200: '{slate.200}',
//           300: '{slate.300}', 400: '{slate.400}', 500: '{slate.500}',
//           600: '{slate.600}', 700: '{slate.700}', 800: '{slate.800}',
//           900: '{slate.900}', 950: '{slate.950}',
//         },
//         formField: {
//           background:              'var(--theme-bg-primary)',
//           disabledBackground:      'var(--theme-bg-ternary)',
//           filledBackground:        'var(--theme-bg-secondary)',
//           filledHoverBackground:   'var(--theme-bg-ternary)',
//           filledFocusBackground:   'var(--theme-bg-secondary)',
//           borderColor:             'var(--theme-border-secondary)',
//           hoverBorderColor:        '{primary.400}',
//           focusBorderColor:        '{primary.500}',
//           invalidBorderColor:      '{red.500}',
//           color:                   'var(--theme-text-primary)',
//           disabledColor:           'var(--theme-text-tertiary)',
//           placeholderColor:        'var(--theme-text-tertiary)',
//           invalidPlaceholderColor: '{red.400}',
//           floatLabelColor:         'var(--theme-text-tertiary)',
//           floatLabelFocusColor:    '{primary.500}',
//           floatLabelActiveColor:   'var(--theme-text-secondary)',
//           floatLabelInvalidColor:  '{red.500}',
//           iconColor:               'var(--theme-text-tertiary)',
//           shadow:                  '0 1px 3px 0 rgba(0,0,0,0.06)',
//         },
//         text: {
//           color:           'var(--theme-text-primary)',
//           hoverColor:      'var(--theme-text-primary)',
//           mutedColor:      'var(--theme-text-secondary)',
//           hoverMutedColor: 'var(--theme-text-primary)',
//         },
//         content: {
//           background:      'var(--theme-bg-primary)',
//           hoverBackground: 'var(--component-bg-hover)',
//           borderColor:     'var(--theme-border-primary)',
//           color:           'var(--theme-text-primary)',
//           hoverColor:      'var(--theme-text-primary)',
//         },
//         overlay: {
//           select:     { background: 'var(--theme-bg-primary)',   borderColor: 'var(--theme-border-primary)', color: 'var(--theme-text-primary)', shadow: '0 4px 20px rgba(0,0,0,0.10)' },
//           popover:    { background: 'var(--theme-bg-primary)',   borderColor: 'var(--theme-border-primary)', color: 'var(--theme-text-primary)', shadow: '0 8px 24px rgba(0,0,0,0.12)' },
//           modal:      { background: 'var(--theme-bg-primary)',   borderColor: 'var(--theme-border-primary)', color: 'var(--theme-text-primary)', shadow: '0 20px 60px rgba(0,0,0,0.18)' },
//           navigation: { background: 'var(--theme-bg-primary)',   borderColor: 'var(--theme-border-primary)', color: 'var(--theme-text-primary)', shadow: '0 4px 16px rgba(0,0,0,0.10)' },
//         },
//         list: {
//           option: {
//             focusBackground:          'var(--component-bg-hover)',
//             selectedBackground:       'rgba(59,130,246,0.08)',
//             selectedFocusBackground:  'rgba(59,130,246,0.14)',
//             color:                    'var(--theme-text-primary)',
//             focusColor:               'var(--theme-text-primary)',
//             selectedColor:            '{primary.600}',
//             selectedFocusColor:       '{primary.700}',
//             icon: { color: 'var(--theme-text-tertiary)', focusColor: 'var(--theme-text-secondary)' },
//           },
//           optionGroup: { background: 'transparent', color: 'var(--theme-text-tertiary)', fontWeight: '700' },
//           padding: '0.25rem', gap: '2px',
//           header: {
//             padding: '0.5rem 0.75rem', color: 'var(--theme-text-secondary)',
//             background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border-primary)',
//           },
//         },
//         navigation: {
//           item: {
//             focusBackground:   'var(--component-bg-hover)',
//             activeBackground:  'rgba(59,130,246,0.08)',
//             color:             'var(--theme-text-primary)',
//             focusColor:        'var(--theme-text-primary)',
//             activeColor:       '{primary.600}',
//             icon: { color: 'var(--theme-text-tertiary)', focusColor: 'var(--theme-text-secondary)', activeColor: '{primary.500}' },
//           },
//           submenuLabel: { background: 'transparent', color: 'var(--theme-text-tertiary)' },
//           submenuIcon:  { color: 'var(--theme-text-tertiary)', focusColor: 'var(--theme-text-secondary)', activeColor: '{primary.500}' },
//         },
//       },

//       // ──────────────────────────────  DARK  ─────────────────────────────────
//       dark: {
//         primary: {
//           color:         '{blue.400}', contrastColor: '#0f172a',
//           hoverColor:    '{blue.300}', activeColor:   '{blue.200}',
//         },
//         highlight: {
//           background:      'rgba(96,165,250,0.12)',
//           focusBackground: 'rgba(96,165,250,0.20)',
//           color:           '{blue.300}',
//           focusColor:      '{blue.200}',
//         },
//         surface: {
//           0: '#ffffff',
//           50:  '{slate.50}',  100: '{slate.100}', 200: '{slate.200}',
//           300: '{slate.300}', 400: '{slate.400}', 500: '{slate.500}',
//           600: '{slate.600}', 700: '{slate.700}', 800: '{slate.800}',
//           900: '{slate.900}', 950: '{slate.950}',
//         },
//         formField: {
//           background:              'var(--theme-bg-primary)',
//           disabledBackground:      'var(--theme-bg-ternary)',
//           filledBackground:        'var(--theme-bg-secondary)',
//           filledHoverBackground:   'var(--theme-bg-ternary)',
//           filledFocusBackground:   'var(--theme-bg-secondary)',
//           borderColor:             'var(--theme-border-secondary)',
//           hoverBorderColor:        '{blue.400}',
//           focusBorderColor:        '{blue.400}',
//           invalidBorderColor:      '{red.400}',
//           color:                   'var(--theme-text-primary)',
//           disabledColor:           'var(--theme-text-tertiary)',
//           placeholderColor:        'var(--theme-text-tertiary)',
//           invalidPlaceholderColor: '{red.300}',
//           floatLabelColor:         'var(--theme-text-tertiary)',
//           floatLabelFocusColor:    '{blue.400}',
//           floatLabelActiveColor:   'var(--theme-text-secondary)',
//           floatLabelInvalidColor:  '{red.400}',
//           iconColor:               'var(--theme-text-tertiary)',
//           shadow:                  '0 1px 4px rgba(0,0,0,0.30)',
//         },
//         text: {
//           color:           'var(--theme-text-primary)',
//           hoverColor:      'var(--theme-text-primary)',
//           mutedColor:      'var(--theme-text-secondary)',
//           hoverMutedColor: 'var(--theme-text-primary)',
//         },
//         content: {
//           background:      'var(--theme-bg-primary)',
//           hoverBackground: 'var(--component-bg-hover)',
//           borderColor:     'var(--theme-border-primary)',
//           color:           'var(--theme-text-primary)',
//           hoverColor:      'var(--theme-text-primary)',
//         },
//         overlay: {
//           select:     { background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border-primary)', color: 'var(--theme-text-primary)', shadow: '0 4px 20px rgba(0,0,0,0.40)' },
//           popover:    { background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border-primary)', color: 'var(--theme-text-primary)', shadow: '0 8px 28px rgba(0,0,0,0.50)' },
//           modal:      { background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border-primary)', color: 'var(--theme-text-primary)', shadow: '0 20px 60px rgba(0,0,0,0.60)' },
//           navigation: { background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border-primary)', color: 'var(--theme-text-primary)', shadow: '0 4px 20px rgba(0,0,0,0.40)' },
//         },
//         list: {
//           option: {
//             focusBackground:          'var(--component-bg-hover)',
//             selectedBackground:       'rgba(96,165,250,0.12)',
//             selectedFocusBackground:  'rgba(96,165,250,0.20)',
//             color:                    'var(--theme-text-primary)',
//             focusColor:               'var(--theme-text-primary)',
//             selectedColor:            '{blue.300}',
//             selectedFocusColor:       '{blue.200}',
//             icon: { color: 'var(--theme-text-tertiary)', focusColor: 'var(--theme-text-secondary)' },
//           },
//           optionGroup: { background: 'transparent', color: 'var(--theme-text-tertiary)', fontWeight: '700' },
//           padding: '0.25rem', gap: '2px',
//           header: {
//             padding: '0.5rem 0.75rem', color: 'var(--theme-text-secondary)',
//             background: 'var(--theme-bg-ternary)', borderColor: 'var(--theme-border-primary)',
//           },
//         },
//         navigation: {
//           item: {
//             focusBackground:   'var(--component-bg-hover)',
//             activeBackground:  'rgba(96,165,250,0.12)',
//             color:             'var(--theme-text-primary)',
//             focusColor:        'var(--theme-text-primary)',
//             activeColor:       '{blue.300}',
//             icon: { color: 'var(--theme-text-tertiary)', focusColor: 'var(--theme-text-secondary)', activeColor: '{blue.400}' },
//           },
//           submenuLabel: { background: 'transparent', color: 'var(--theme-text-tertiary)' },
//           submenuIcon:  { color: 'var(--theme-text-tertiary)', focusColor: 'var(--theme-text-secondary)', activeColor: '{blue.400}' },
//         },
//       },
//     },
//   },

//   // ==========================================================================
//   //  COMPONENTS — explicit token overrides, one section per component
//   // ==========================================================================
//   components: {

//     // ── BUTTON ───────────────────────────────────────────────────────────────
//     button: {
//       borderRadius: '{primitive.borderRadius.sm}',
//       gap: '0.5rem',
//       paddingX: '0.875rem', paddingY: '0.4375rem',
//       iconOnlyWidth: '2.25rem',
//       sm: { fontSize: '0.8125rem', paddingX: '0.625rem', paddingY: '0.3125rem', iconOnlyWidth: '1.875rem' },
//       lg: { fontSize: '1rem',      paddingX: '1rem',     paddingY: '0.5625rem', iconOnlyWidth: '2.625rem' },
//       labelFontWeight: '600',
//       raisedShadow: '0 3px 8px rgba(0,0,0,0.15)',
//       focusRing: { width: '2px', style: 'solid', offset: '1px' },
//       transitionDuration: '0.15s',
//       primary:   { background: '{blue.500}',  hoverBackground: '{blue.600}',  activeBackground: '{blue.700}',  borderColor: '{blue.500}',  hoverBorderColor: '{blue.600}',  activeBorderColor: '{blue.700}',  color: '#fff', hoverColor: '#fff', activeColor: '#fff', focusRing: { color: '{blue.500}',  shadow: '0 0 0 3px rgba(59,130,246,0.25)'  } },
//       secondary: { background: 'var(--theme-bg-secondary)', hoverBackground: 'var(--component-bg-hover)', activeBackground: 'var(--theme-bg-ternary)', borderColor: 'var(--theme-border-primary)', hoverBorderColor: 'var(--theme-border-secondary)', activeBorderColor: 'var(--theme-border-secondary)', color: 'var(--theme-text-secondary)', hoverColor: 'var(--theme-text-primary)', activeColor: 'var(--theme-text-primary)', focusRing: { color: 'var(--theme-border-secondary)', shadow: 'none' } },
//       success:   { background: '{green.500}', hoverBackground: '{green.600}', activeBackground: '{green.700}', borderColor: '{green.500}', hoverBorderColor: '{green.600}', activeBorderColor: '{green.700}', color: '#fff', hoverColor: '#fff', activeColor: '#fff', focusRing: { color: '{green.500}', shadow: '0 0 0 3px rgba(34,197,94,0.25)'  } },
//       warn:      { background: '{amber.500}', hoverBackground: '{amber.600}', activeBackground: '{amber.700}', borderColor: '{amber.500}', hoverBorderColor: '{amber.600}', activeBorderColor: '{amber.700}', color: '#fff', hoverColor: '#fff', activeColor: '#fff', focusRing: { color: '{amber.500}', shadow: '0 0 0 3px rgba(245,158,11,0.25)' } },
//       danger:    { background: '{red.500}',   hoverBackground: '{red.600}',   activeBackground: '{red.700}',   borderColor: '{red.500}',   hoverBorderColor: '{red.600}',   activeBorderColor: '{red.700}',   color: '#fff', hoverColor: '#fff', activeColor: '#fff', focusRing: { color: '{red.500}',   shadow: '0 0 0 3px rgba(239,68,68,0.25)'   } },
//       info:      { background: '{blue.100}',  hoverBackground: '{blue.200}',  activeBackground: '{blue.300}',  borderColor: '{blue.200}',  hoverBorderColor: '{blue.300}',  activeBorderColor: '{blue.400}',  color: '{blue.700}', hoverColor: '{blue.800}', activeColor: '{blue.900}', focusRing: { color: '{blue.400}', shadow: '0 0 0 3px rgba(59,130,246,0.18)' } },
//       help:      { background: '#a855f7',     hoverBackground: '#9333ea',     activeBackground: '#7e22ce',     borderColor: '#a855f7',     hoverBorderColor: '#9333ea',     activeBorderColor: '#7e22ce',     color: '#fff', hoverColor: '#fff', activeColor: '#fff', focusRing: { color: '#a855f7', shadow: '0 0 0 3px rgba(168,85,247,0.25)' } },
//       contrast:  { background: 'var(--theme-text-primary)', hoverBackground: 'var(--theme-text-secondary)', activeBackground: 'var(--theme-text-tertiary)', borderColor: 'var(--theme-text-primary)', hoverBorderColor: 'var(--theme-text-secondary)', activeBorderColor: 'var(--theme-text-tertiary)', color: 'var(--theme-bg-primary)', hoverColor: 'var(--theme-bg-primary)', activeColor: 'var(--theme-bg-primary)', focusRing: { color: 'var(--theme-text-primary)', shadow: 'none' } },
//       outlined: {
//         primary:   { hoverBackground: 'rgba(59,130,246,0.06)',  activeBackground: 'rgba(59,130,246,0.12)', borderColor: '{blue.500}',  color: '{blue.500}'  },
//         secondary: { hoverBackground: 'var(--component-bg-hover)', activeBackground: 'var(--theme-bg-ternary)', borderColor: 'var(--theme-border-secondary)', color: 'var(--theme-text-secondary)' },
//         success:   { hoverBackground: 'rgba(34,197,94,0.06)',   activeBackground: 'rgba(34,197,94,0.12)', borderColor: '{green.500}', color: '{green.500}' },
//         warn:      { hoverBackground: 'rgba(245,158,11,0.06)',  activeBackground: 'rgba(245,158,11,0.12)',borderColor: '{amber.500}', color: '{amber.600}' },
//         danger:    { hoverBackground: 'rgba(239,68,68,0.06)',   activeBackground: 'rgba(239,68,68,0.12)', borderColor: '{red.500}',   color: '{red.500}'   },
//         info:      { hoverBackground: 'rgba(59,130,246,0.06)',  activeBackground: 'rgba(59,130,246,0.10)',borderColor: '{blue.300}',  color: '{blue.600}'  },
//         help:      { hoverBackground: 'rgba(168,85,247,0.06)',  activeBackground: 'rgba(168,85,247,0.12)',borderColor: '#a855f7',     color: '#a855f7'     },
//         contrast:  { hoverBackground: 'var(--component-bg-hover)', activeBackground: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-text-primary)', color: 'var(--theme-text-primary)' },
//         plain:     { hoverBackground: 'var(--component-bg-hover)', activeBackground: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border-primary)', color: 'var(--theme-text-secondary)' },
//       },
//       text: {
//         primary:   { hoverBackground: 'rgba(59,130,246,0.06)',  activeBackground: 'rgba(59,130,246,0.12)', color: '{blue.500}'  },
//         secondary: { hoverBackground: 'var(--component-bg-hover)', activeBackground: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' },
//         success:   { hoverBackground: 'rgba(34,197,94,0.06)',   activeBackground: 'rgba(34,197,94,0.12)', color: '{green.500}' },
//         warn:      { hoverBackground: 'rgba(245,158,11,0.06)',  activeBackground: 'rgba(245,158,11,0.12)',color: '{amber.600}' },
//         danger:    { hoverBackground: 'rgba(239,68,68,0.06)',   activeBackground: 'rgba(239,68,68,0.12)', color: '{red.500}'   },
//         info:      { hoverBackground: 'rgba(59,130,246,0.06)',  activeBackground: 'rgba(59,130,246,0.10)',color: '{blue.600}'  },
//         help:      { hoverBackground: 'rgba(168,85,247,0.06)',  activeBackground: 'rgba(168,85,247,0.12)',color: '#a855f7'     },
//         contrast:  { hoverBackground: 'var(--component-bg-hover)', activeBackground: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' },
//         plain:     { hoverBackground: 'var(--component-bg-hover)', activeBackground: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' },
//       },
//       link: { color: '{blue.500}', hoverColor: '{blue.600}', activeColor: '{blue.700}' },
//     },

//     // ── INPUTTEXT ────────────────────────────────────────────────────────────
//     inputtext: {
//       background: 'var(--theme-bg-primary)', disabledBackground: 'var(--theme-bg-ternary)',
//       filledBackground: 'var(--theme-bg-secondary)', filledHoverBackground: 'var(--theme-bg-ternary)', filledFocusBackground: 'var(--theme-bg-secondary)',
//       borderColor: 'var(--theme-border-secondary)', hoverBorderColor: '{primary.400}', focusBorderColor: '{primary.500}', invalidBorderColor: '{red.500}',
//       color: 'var(--theme-text-primary)', disabledColor: 'var(--theme-text-tertiary)',
//       placeholderColor: 'var(--theme-text-tertiary)', invalidPlaceholderColor: '{red.400}',
//       shadow: '0 1px 3px rgba(0,0,0,0.05)',
//       paddingX: '0.625rem', paddingY: '0.4375rem',
//       borderRadius: '{primitive.borderRadius.sm}',
//       focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: '0 0 0 3px rgba(59,130,246,0.15)' },
//       transitionDuration: '0.12s',
//       sm: { fontSize: '0.8125rem', paddingX: '0.5rem',  paddingY: '0.3125rem' },
//       lg: { fontSize: '1rem',      paddingX: '0.75rem', paddingY: '0.5rem'    },
//     },

//     // ── TEXTAREA ─────────────────────────────────────────────────────────────
//     textarea: {
//       background: 'var(--theme-bg-primary)', disabledBackground: 'var(--theme-bg-ternary)',
//       filledBackground: 'var(--theme-bg-secondary)', filledHoverBackground: 'var(--theme-bg-ternary)', filledFocusBackground: 'var(--theme-bg-secondary)',
//       borderColor: 'var(--theme-border-secondary)', hoverBorderColor: '{primary.400}', focusBorderColor: '{primary.500}', invalidBorderColor: '{red.500}',
//       color: 'var(--theme-text-primary)', disabledColor: 'var(--theme-text-tertiary)',
//       placeholderColor: 'var(--theme-text-tertiary)', invalidPlaceholderColor: '{red.400}',
//       shadow: '0 1px 3px rgba(0,0,0,0.05)',
//       paddingX: '0.625rem', paddingY: '0.5rem',
//       borderRadius: '{primitive.borderRadius.sm}',
//       focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: '0 0 0 3px rgba(59,130,246,0.15)' },
//       transitionDuration: '0.12s',
//       sm: { fontSize: '0.8125rem', paddingX: '0.5rem',  paddingY: '0.375rem' },
//       lg: { fontSize: '1rem',      paddingX: '0.75rem', paddingY: '0.625rem' },
//     },

//     // ── SELECT ───────────────────────────────────────────────────────────────
//     select: {
//       background: 'var(--theme-bg-primary)', disabledBackground: 'var(--theme-bg-ternary)',
//       filledBackground: 'var(--theme-bg-secondary)', filledHoverBackground: 'var(--theme-bg-ternary)', filledFocusBackground: 'var(--theme-bg-secondary)',
//       borderColor: 'var(--theme-border-secondary)', hoverBorderColor: '{primary.400}', focusBorderColor: '{primary.500}', invalidBorderColor: '{red.500}',
//       color: 'var(--theme-text-primary)', disabledColor: 'var(--theme-text-tertiary)',
//       placeholderColor: 'var(--theme-text-tertiary)', invalidPlaceholderColor: '{red.400}',
//       shadow: '0 1px 3px rgba(0,0,0,0.05)',
//       paddingX: '0.625rem', paddingY: '0.4375rem',
//       borderRadius: '{primitive.borderRadius.sm}',
//       focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: '0 0 0 3px rgba(59,130,246,0.15)' },
//       transitionDuration: '0.12s',
//       sm: { fontSize: '0.8125rem', paddingX: '0.5rem',  paddingY: '0.3125rem' },
//       lg: { fontSize: '1rem',      paddingX: '0.75rem', paddingY: '0.5rem'    },
//       dropdown: { width: '2.25rem', color: 'var(--theme-text-tertiary)' },
//       overlay: { background: 'var(--theme-bg-primary)', borderColor: 'var(--theme-border-primary)', borderRadius: '{primitive.borderRadius.md}', color: 'var(--theme-text-primary)', shadow: '0 4px 20px rgba(0,0,0,0.10)' },
//       list: { padding: '0.25rem', gap: '1px', headerPadding: '0.5rem 0.75rem' },
//       option: {
//         focusBackground: 'var(--component-bg-hover)', selectedBackground: 'rgba(59,130,246,0.08)', selectedFocusBackground: 'rgba(59,130,246,0.14)',
//         color: 'var(--theme-text-primary)', focusColor: 'var(--theme-text-primary)', selectedColor: '{primary.600}', selectedFocusColor: '{primary.700}',
//         padding: '0.4375rem 0.625rem', borderRadius: '{primitive.borderRadius.sm}',
//       },
//       optionGroup: { background: 'transparent', color: 'var(--theme-text-tertiary)', fontWeight: '700', padding: '0.5rem 0.75rem' },
//       clearIconColor: 'var(--theme-text-tertiary)', checkmarkColor: '{primary.500}',
//       checkmarkGutterStart: '0.375rem', checkmarkGutterEnd: '0.375rem',
//       emptyMessagePadding: '0.5rem 0.75rem',
//     },

//     // ── MULTISELECT ──────────────────────────────────────────────────────────
//     multiselect: {
//       background: 'var(--theme-bg-primary)', disabledBackground: 'var(--theme-bg-ternary)',
//       filledBackground: 'var(--theme-bg-secondary)', filledHoverBackground: 'var(--theme-bg-ternary)', filledFocusBackground: 'var(--theme-bg-secondary)',
//       borderColor: 'var(--theme-border-secondary)', hoverBorderColor: '{primary.400}', focusBorderColor: '{primary.500}', invalidBorderColor: '{red.500}',
//       color: 'var(--theme-text-primary)', disabledColor: 'var(--theme-text-tertiary)',
//       placeholderColor: 'var(--theme-text-tertiary)', invalidPlaceholderColor: '{red.400}',
//       shadow: '0 1px 3px rgba(0,0,0,0.05)',
//       paddingX: '0.625rem', paddingY: '0.4375rem',
//       borderRadius: '{primitive.borderRadius.sm}',
//       focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: '0 0 0 3px rgba(59,130,246,0.15)' },
//       transitionDuration: '0.12s',
//       sm: { fontSize: '0.8125rem', paddingX: '0.5rem',  paddingY: '0.3125rem' },
//       lg: { fontSize: '1rem',      paddingX: '0.75rem', paddingY: '0.5rem'    },
//       dropdown: { width: '2.25rem', color: 'var(--theme-text-tertiary)' },
//       overlay: { background: 'var(--theme-bg-primary)', borderColor: 'var(--theme-border-primary)', borderRadius: '{primitive.borderRadius.md}', color: 'var(--theme-text-primary)', shadow: '0 4px 20px rgba(0,0,0,0.10)' },
//       list: { padding: '0.25rem', gap: '1px', headerPadding: '0.5rem 0.75rem' },
//       option: {
//         focusBackground: 'var(--component-bg-hover)', selectedBackground: 'rgba(59,130,246,0.08)', selectedFocusBackground: 'rgba(59,130,246,0.14)',
//         color: 'var(--theme-text-primary)', focusColor: 'var(--theme-text-primary)', selectedColor: '{primary.600}', selectedFocusColor: '{primary.700}',
//         padding: '0.4375rem 0.625rem', borderRadius: '{primitive.borderRadius.sm}', gap: '0.5rem',
//       },
//       optionGroup: { background: 'transparent', color: 'var(--theme-text-tertiary)', fontWeight: '700', padding: '0.5rem 0.75rem' },
//       clearIconColor: 'var(--theme-text-tertiary)',
//       chip: { borderRadius: '4px' },
//       emptyMessagePadding: '0.5rem 0.75rem',
//     },

//     // ── INPUTNUMBER ──────────────────────────────────────────────────────────
//     inputnumber: {
//       transitionDuration: '0.12s',
//       button: {
//         width: '2.25rem', borderRadius: '{primitive.borderRadius.sm}', verticalPadding: '0',
//         background: 'var(--theme-bg-secondary)', hoverBackground: 'var(--component-bg-hover)', activeBackground: 'var(--theme-bg-ternary)',
//         borderColor: 'var(--theme-border-secondary)', hoverBorderColor: '{primary.400}', activeBorderColor: '{primary.500}',
//         color: 'var(--theme-text-secondary)', hoverColor: 'var(--theme-text-primary)', activeColor: '{primary.500}',
//       },
//     },

//     // ── CHECKBOX ─────────────────────────────────────────────────────────────
//     checkbox: {
//       borderRadius: '{primitive.borderRadius.xs}',
//       width: '1.125rem', height: '1.125rem',
//       background: 'var(--theme-bg-primary)',
//       checkedBackground: '{primary.500}', checkedHoverBackground: '{primary.600}',
//       disabledBackground: 'var(--theme-bg-ternary)', filledBackground: 'var(--theme-bg-secondary)',
//       borderColor: 'var(--theme-border-secondary)', hoverBorderColor: '{primary.400}',
//       focusBorderColor: '{primary.500}',
//       checkedBorderColor: '{primary.500}', checkedHoverBorderColor: '{primary.600}',
//       checkedFocusBorderColor: '{primary.500}', checkedDisabledBorderColor: 'var(--theme-border-primary)',
//       invalidBorderColor: '{red.500}',
//       shadow: '0 1px 2px rgba(0,0,0,0.05)',
//       focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '1px', shadow: '0 0 0 3px rgba(59,130,246,0.18)' },
//       transitionDuration: '0.12s',
//       sm: { width: '0.875rem',  height: '0.875rem'  },
//       lg: { width: '1.375rem',  height: '1.375rem'  },
//       icon: {
//         size: '0.6875rem', color: 'transparent',
//         checkedColor: '#ffffff', checkedHoverColor: '#ffffff', disabledColor: 'var(--theme-text-tertiary)',
//         sm: { size: '0.5625rem' }, lg: { size: '0.875rem' },
//       },
//     },

//     // ── TOGGLESWITCH ─────────────────────────────────────────────────────────
//     toggleswitch: {
//       width: '2.5rem', height: '1.375rem',
//       borderRadius: '{primitive.borderRadius.full}', gap: '0.25rem',
//       shadow: '0 1px 3px rgba(0,0,0,0.08)',
//       focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '1px', shadow: '0 0 0 3px rgba(59,130,246,0.18)' },
//       borderWidth: '2px', borderColor: 'transparent', hoverBorderColor: 'transparent',
//       checkedBorderColor: 'transparent', checkedHoverBorderColor: 'transparent',
//       invalidBorderColor: '{red.500}',
//       transitionDuration: '0.15s', slideDuration: '0.15s',
//       background: 'var(--theme-border-secondary)', disabledBackground: 'var(--theme-bg-ternary)',
//       hoverBackground: 'var(--theme-text-tertiary)',
//       checkedBackground: '{primary.500}', checkedHoverBackground: '{primary.600}',
//       handle: {
//         borderRadius: '{primitive.borderRadius.full}', size: '0.875rem',
//         background: '#ffffff', disabledBackground: '{slate.300}',
//         hoverBackground: '#ffffff', checkedBackground: '#ffffff', checkedHoverBackground: '#ffffff',
//         color: 'transparent', hoverColor: 'transparent', checkedColor: 'transparent', checkedHoverColor: 'transparent',
//       },
//     },

//     // ── DATEPICKER ───────────────────────────────────────────────────────────
//     datepicker: {
//       transitionDuration: '0.12s',
//       panel: {
//         background: 'var(--theme-bg-primary)', borderColor: 'var(--theme-border-primary)',
//         color: 'var(--theme-text-primary)', borderRadius: '{primitive.borderRadius.md}',
//         shadow: '0 6px 24px rgba(0,0,0,0.12)', padding: '0.75rem',
//       },
//       header: {
//         background: 'transparent', borderColor: 'var(--theme-border-primary)',
//         color: 'var(--theme-text-primary)', padding: '0 0 0.5rem 0',
//       },
//       title: { gap: '0.375rem', fontWeight: '600' },
//       dropdown: {
//         width: '2rem', background: 'transparent', hoverBackground: 'var(--component-bg-hover)',
//         activeBackground: 'var(--theme-bg-ternary)', borderColor: 'transparent',
//         hoverBorderColor: 'transparent', activeBorderColor: 'transparent',
//         borderRadius: '{primitive.borderRadius.sm}',
//         color: 'var(--theme-text-secondary)', hoverColor: 'var(--theme-text-primary)', activeColor: '{primary.500}',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//       },
//       inputIconColor: 'var(--theme-text-tertiary)',
//       selectMonth: {
//         hoverBackground: 'var(--component-bg-hover)',
//         color: 'var(--theme-text-primary)', hoverColor: 'var(--theme-text-primary)',
//         padding: '0.3125rem 0.5rem', borderRadius: '{primitive.borderRadius.sm}',
//       },
//       selectYear: {
//         hoverBackground: 'var(--component-bg-hover)',
//         color: 'var(--theme-text-primary)', hoverColor: 'var(--theme-text-primary)',
//         padding: '0.3125rem 0.5rem', borderRadius: '{primitive.borderRadius.sm}',
//       },
//       groupBorderColor: 'var(--theme-border-primary)', groupGap: '0.75rem',
//       dayViewMargin: '0.5rem 0 0 0',
//       weekDay: { padding: '0.25rem', fontWeight: '600', color: 'var(--theme-text-tertiary)' },
//       date: {
//         hoverBackground: 'var(--component-bg-hover)',
//         selectedBackground: '{primary.500}', rangeSelectedBackground: 'rgba(59,130,246,0.10)',
//         color: 'var(--theme-text-primary)', hoverColor: 'var(--theme-text-primary)',
//         selectedColor: '#ffffff', rangeSelectedColor: '{primary.600}',
//         width: '2rem', height: '2rem', borderRadius: '{primitive.borderRadius.sm}',
//         padding: '0.125rem',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: '0 0 0 3px rgba(59,130,246,0.18)' },
//       },
//       monthViewMargin: '0.5rem 0 0 0',
//       month: { padding: '0.4375rem', borderRadius: '{primitive.borderRadius.sm}' },
//       yearViewMargin: '0.5rem 0 0 0',
//       year: { padding: '0.4375rem', borderRadius: '{primitive.borderRadius.sm}' },
//       buttonbarPadding: '0.5rem 0 0 0', buttonbarBorderColor: 'var(--theme-border-primary)',
//       timePicker: {
//         padding: '0.5rem 0 0 0', borderColor: 'var(--theme-border-primary)',
//         gap: '0.375rem', buttonGap: '0.125rem',
//       },
//       todayBackground: 'rgba(59,130,246,0.08)', todayColor: '{primary.600}',
//     },

//     // ── TAG ──────────────────────────────────────────────────────────────────
//     tag: {
//       fontSize: '0.6875rem', fontWeight: '700',
//       padding: '0.1875rem 0.5rem', gap: '0.25rem',
//       borderRadius: '{primitive.borderRadius.xs}',
//       roundedBorderRadius: '{primitive.borderRadius.full}',
//       iconSize: '0.6875rem',
//       primary:   { background: 'rgba(59,130,246,0.12)',  color: '{blue.600}'            },
//       secondary: { background: 'var(--theme-bg-ternary)', color: 'var(--theme-text-secondary)' },
//       success:   { background: 'rgba(34,197,94,0.12)',   color: '{green.600}'           },
//       info:      { background: 'rgba(59,130,246,0.10)',  color: '{blue.600}'            },
//       warn:      { background: 'rgba(245,158,11,0.12)',  color: '{amber.600}'           },
//       danger:    { background: 'rgba(239,68,68,0.12)',   color: '{red.600}'             },
//       contrast:  { background: 'var(--theme-text-primary)', color: 'var(--theme-bg-primary)' },
//     },

//     // ── BADGE ────────────────────────────────────────────────────────────────
//     badge: {
//       borderRadius: '{primitive.borderRadius.full}',
//       padding: '0 0.375rem', fontSize: '0.6875rem', fontWeight: '700',
//       minWidth: '1.25rem', height: '1.25rem', dotSize: '0.5rem',
//       sm: { fontSize: '0.5625rem', minWidth: '1rem',    height: '1rem'     },
//       lg: { fontSize: '0.8125rem', minWidth: '1.5rem',  height: '1.5rem'   },
//       xl: { fontSize: '1rem',      minWidth: '1.875rem',height: '1.875rem' },
//       primary:   { background: '{primary.500}',            color: '#ffffff'                       },
//       secondary: { background: 'var(--theme-bg-ternary)',  color: 'var(--theme-text-secondary)'   },
//       success:   { background: '{green.500}',              color: '#ffffff'                       },
//       info:      { background: '{blue.400}',               color: '#ffffff'                       },
//       warn:      { background: '{amber.500}',              color: '#ffffff'                       },
//       danger:    { background: '{red.500}',                color: '#ffffff'                       },
//       contrast:  { background: 'var(--theme-text-primary)',color: 'var(--theme-bg-primary)'       },
//     },

//     // ── TOAST ────────────────────────────────────────────────────────────────
//     toast: {
//       width: '22rem', borderRadius: '{primitive.borderRadius.md}',
//       borderWidth: '1px', transitionDuration: '0.2s', blur: '0px',
//       iconSize: '1.25rem',
//       content: { padding: '0.875rem 1rem', gap: '0.75rem' },
//       text: { gap: '0.25rem' },
//       summary: { fontWeight: '700', fontSize: '0.875rem' },
//       detail:  { fontWeight: '400', fontSize: '0.8125rem' },
//       closeButton: {
//         width: '1.75rem', height: '1.75rem',
//         borderRadius: '{primitive.borderRadius.sm}',
//         focusRing: { width: '2px', style: 'solid', offset: '1px' },
//       },
//       closeIconSize: '0.875rem',
//       info:      { background: 'var(--theme-bg-primary)', borderColor: '{blue.400}',  color: '{blue.600}',  detailColor: 'var(--theme-text-secondary)', shadow: '0 4px 16px rgba(59,130,246,0.12)',  closeButton: { hoverBackground: 'rgba(59,130,246,0.08)',  focusRing: { color: '{blue.400}',  shadow: '0 0 0 3px rgba(59,130,246,0.18)'  } } },
//       success:   { background: 'var(--theme-bg-primary)', borderColor: '{green.400}', color: '{green.600}', detailColor: 'var(--theme-text-secondary)', shadow: '0 4px 16px rgba(34,197,94,0.12)',   closeButton: { hoverBackground: 'rgba(34,197,94,0.08)',   focusRing: { color: '{green.400}', shadow: '0 0 0 3px rgba(34,197,94,0.18)'   } } },
//       warn:      { background: 'var(--theme-bg-primary)', borderColor: '{amber.400}', color: '{amber.600}', detailColor: 'var(--theme-text-secondary)', shadow: '0 4px 16px rgba(245,158,11,0.12)',  closeButton: { hoverBackground: 'rgba(245,158,11,0.08)',  focusRing: { color: '{amber.400}', shadow: '0 0 0 3px rgba(245,158,11,0.18)'  } } },
//       error:     { background: 'var(--theme-bg-primary)', borderColor: '{red.400}',   color: '{red.600}',   detailColor: 'var(--theme-text-secondary)', shadow: '0 4px 16px rgba(239,68,68,0.12)',   closeButton: { hoverBackground: 'rgba(239,68,68,0.08)',   focusRing: { color: '{red.400}',   shadow: '0 0 0 3px rgba(239,68,68,0.18)'   } } },
//       secondary: { background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border-primary)', color: 'var(--theme-text-primary)', detailColor: 'var(--theme-text-secondary)', shadow: '0 4px 16px rgba(0,0,0,0.08)', closeButton: { hoverBackground: 'var(--component-bg-hover)', focusRing: { color: 'var(--theme-border-secondary)', shadow: 'none' } } },
//       contrast:  { background: 'var(--theme-text-primary)', borderColor: 'var(--theme-text-secondary)', color: 'var(--theme-bg-primary)', detailColor: 'var(--theme-bg-secondary)', shadow: '0 4px 16px rgba(0,0,0,0.20)', closeButton: { hoverBackground: 'rgba(255,255,255,0.12)', focusRing: { color: 'var(--theme-bg-primary)', shadow: 'none' } } },
//     },

//     // ── DIALOG ───────────────────────────────────────────────────────────────
//     dialog: {
//       background: 'var(--theme-bg-primary)', borderColor: 'var(--theme-border-primary)',
//       color: 'var(--theme-text-primary)', borderRadius: '{primitive.borderRadius.lg}',
//       shadow: '0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px var(--theme-border-primary)',
//       header: { padding: '1.25rem 1.5rem 0.875rem 1.5rem', gap: '0.75rem' },
//       title: { fontSize: '1rem', fontWeight: '700' },
//       content: { padding: '0 1.5rem 1.25rem 1.5rem' },
//       footer:  { padding: '0.75rem 1.5rem 1.25rem 1.5rem', gap: '0.5rem' },
//     },

//     // ── CARD ─────────────────────────────────────────────────────────────────
//     card: {
//       background: 'var(--theme-bg-primary)', borderRadius: '{primitive.borderRadius.lg}',
//       color: 'var(--theme-text-primary)',
//       shadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px var(--theme-border-primary)',
//       body: { padding: '1.25rem', gap: '0.75rem' },
//       caption: { gap: '0.375rem' },
//       title: { fontSize: '1rem', fontWeight: '700' },
//       subtitleColor: 'var(--theme-text-secondary)',
//     },

//     // ── TABS ─────────────────────────────────────────────────────────────────
//     tabs: {
//       transitionDuration: '0.15s',
//       tablist: { borderWidth: '0 0 1px 0', background: 'transparent', borderColor: 'var(--theme-border-primary)' },
//       tab: {
//         background: 'transparent', hoverBackground: 'var(--component-bg-hover)', activeBackground: 'transparent',
//         borderWidth: '0 0 2px 0', borderColor: 'transparent',
//         hoverBorderColor: 'var(--theme-border-secondary)', activeBorderColor: '{primary.500}',
//         color: 'var(--theme-text-secondary)', hoverColor: 'var(--theme-text-primary)', activeColor: '{primary.600}',
//         padding: '0.625rem 1rem', fontWeight: '600', margin: '0', gap: '0.375rem',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//       },
//       tabpanel: {
//         background: 'transparent', color: 'var(--theme-text-primary)', padding: '0.875rem 0 0 0',
//         focusRing: { width: '0px', style: 'none', color: 'transparent', offset: '0px', shadow: 'none' },
//       },
//       navButton: {
//         background: 'var(--theme-bg-primary)', color: 'var(--theme-text-secondary)',
//         hoverColor: 'var(--theme-text-primary)', width: '2rem',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//         shadow: '0 2px 8px rgba(0,0,0,0.08)',
//       },
//       activeBar: { height: '2px', bottom: '-1px', background: '{primary.500}' },
//     },

//     // ── TOOLTIP ──────────────────────────────────────────────────────────────
//     tooltip: {
//       maxWidth: '14rem', gutter: '6px',
//       shadow: '0 4px 14px rgba(0,0,0,0.14)',
//       padding: '0.375rem 0.625rem', borderRadius: '{primitive.borderRadius.sm}',
//       background: 'var(--theme-text-primary)', color: 'var(--theme-bg-primary)',
//     },

//     // ── ACCORDION ────────────────────────────────────────────────────────────
//     accordion: {
//       transitionDuration: '0.15s',
//       panel: { borderWidth: '0 0 1px 0', borderColor: 'var(--theme-border-primary)' },
//       header: {
//         color: 'var(--theme-text-primary)', hoverColor: 'var(--theme-text-primary)',
//         activeColor: '{primary.600}', activeHoverColor: '{primary.700}',
//         padding: '0.875rem 1rem', fontWeight: '600',
//         borderRadius: '{primitive.borderRadius.sm}', borderWidth: '0', borderColor: 'transparent',
//         background: 'transparent', hoverBackground: 'var(--component-bg-hover)',
//         activeBackground: 'transparent', activeHoverBackground: 'var(--component-bg-hover)',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//         toggleIcon: { color: 'var(--theme-text-tertiary)', hoverColor: 'var(--theme-text-secondary)', activeColor: '{primary.500}', activeHoverColor: '{primary.600}' },
//         first: { topBorderRadius: '{primitive.borderRadius.sm}', borderWidth: '0' },
//         last:  { bottomBorderRadius: '{primitive.borderRadius.sm}', activeBottomBorderRadius: '0' },
//       },
//       content: {
//         borderWidth: '0', borderColor: 'transparent',
//         background: 'transparent', color: 'var(--theme-text-primary)',
//         padding: '0 1rem 0.875rem 1rem',
//       },
//     },

//     // ── PANEL ────────────────────────────────────────────────────────────────
//     panel: {
//       background: 'var(--theme-bg-primary)', borderColor: 'var(--theme-border-primary)',
//       color: 'var(--theme-text-primary)', borderRadius: '{primitive.borderRadius.lg}',
//       header: {
//         background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)',
//         padding: '0.875rem 1rem', borderRadius: '{primitive.borderRadius.lg}',
//         borderWidth: '0 0 1px 0', borderColor: 'var(--theme-border-primary)',
//         fontWeight: '700',
//         toggleButtonHoverBackground: 'var(--component-bg-hover)',
//         toggleButtonColor: 'var(--theme-text-tertiary)', toggleButtonHoverColor: 'var(--theme-text-secondary)',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//       },
//       content: { padding: '0.875rem 1rem' },
//       footer:  { padding: '0.875rem 1rem', borderWidth: '1px 0 0 0', borderColor: 'var(--theme-border-primary)' },
//     },

//     // ── DIVIDER ──────────────────────────────────────────────────────────────
//     divider: {
//       borderColor: 'var(--theme-border-primary)',
//       content: { background: 'var(--theme-bg-primary)', color: 'var(--theme-text-tertiary)' },
//     },

//     // ── PROGRESSBAR ──────────────────────────────────────────────────────────
//     progressbar: {
//       background: 'var(--theme-bg-ternary)', borderRadius: '{primitive.borderRadius.full}', height: '0.375rem',
//       value: { background: '{primary.500}' }, labelColor: '#ffffff',
//     },

//     // ── PROGRESSSPINNER ──────────────────────────────────────────────────────
//     progressspinner: {
//       colorOne: '{primary.400}', colorTwo: '{primary.500}',
//       colorThree: '{primary.600}', colorFour: '{primary.700}',
//     },

//     // ── SKELETON ─────────────────────────────────────────────────────────────
//     skeleton: {
//       background: 'var(--theme-bg-ternary)',
//       animationBackground: 'rgba(255,255,255,0.18)',
//     },

//     // ── CHIP ─────────────────────────────────────────────────────────────────
//     chip: {
//       borderRadius: '{primitive.borderRadius.full}',
//       paddingX: '0.625rem', paddingY: '0.25rem', gap: '0.375rem',
//       background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)',
//       iconSize: '0.75rem', iconColor: 'var(--theme-text-secondary)',
//       removeIcon: { size: '0.75rem', color: 'var(--theme-text-tertiary)', focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' } },
//       image: { width: '1.5rem', height: '1.5rem' },
//       focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '1px', shadow: '0 0 0 3px rgba(59,130,246,0.18)' },
//       transitionDuration: '0.12s',
//     },

//     // ── SLIDER ───────────────────────────────────────────────────────────────
//     slider: {
//       track: { background: 'var(--theme-bg-ternary)', borderRadius: '{primitive.borderRadius.full}', size: '0.3125rem' },
//       range: { background: '{primary.500}' },
//       handle: {
//         width: '1.125rem', height: '1.125rem',
//         borderRadius: '{primitive.borderRadius.full}',
//         background: '#ffffff', hoverBackground: '{primary.100}',
//         contentBackground: '{primary.500}', contentHoverBackground: '{primary.600}',
//         borderWidth: '2px', borderColor: '{primary.500}', hoverBorderColor: '{primary.600}',
//         shadow: '0 1px 4px rgba(0,0,0,0.10)',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '1px', shadow: '0 0 0 3px rgba(59,130,246,0.18)' },
//         transitionDuration: '0.12s',
//       },
//     },

//     // ── RATING ───────────────────────────────────────────────────────────────
//     rating: {
//       gap: '0.25rem', iconSize: '1.125rem',
//       icon: {
//         color: 'var(--theme-border-secondary)', hoverColor: '{amber.400}', activeColor: '{amber.500}',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//       },
//     },

//     // ── MESSAGE ──────────────────────────────────────────────────────────────
//     message: {
//       borderRadius: '{primitive.borderRadius.md}', borderWidth: '0 0 0 4px',
//       paddingX: '0.875rem', paddingY: '0.5rem', gap: '0.5rem', contentGap: '0.5rem',
//       sm: { paddingX: '0.625rem', paddingY: '0.375rem', fontSize: '0.8125rem', iconSize: '0.8125rem' },
//       lg: { paddingX: '1rem',     paddingY: '0.625rem', fontSize: '1rem',      iconSize: '1rem'      },
//       transitionDuration: '0.12s',
//       icon: { size: '0.875rem' },
//       closeButton: { width: '1.75rem', height: '1.75rem', borderRadius: '{primitive.borderRadius.sm}', focusRing: { width: '2px', style: 'solid', offset: '0px' } },
//       closeIcon: { size: '0.875rem' },
//       info:      { background: 'rgba(59,130,246,0.08)',  borderColor: '{blue.400}',  color: '{blue.700}',  shadow: 'none', closeButton: { hoverBackground: 'rgba(59,130,246,0.10)',  focusRing: { color: '{blue.400}',  shadow: 'none' } } },
//       success:   { background: 'rgba(34,197,94,0.08)',   borderColor: '{green.400}', color: '{green.700}', shadow: 'none', closeButton: { hoverBackground: 'rgba(34,197,94,0.10)',   focusRing: { color: '{green.400}', shadow: 'none' } } },
//       warn:      { background: 'rgba(245,158,11,0.08)',  borderColor: '{amber.400}', color: '{amber.700}', shadow: 'none', closeButton: { hoverBackground: 'rgba(245,158,11,0.10)',  focusRing: { color: '{amber.400}', shadow: 'none' } } },
//       error:     { background: 'rgba(239,68,68,0.08)',   borderColor: '{red.400}',   color: '{red.700}',   shadow: 'none', closeButton: { hoverBackground: 'rgba(239,68,68,0.10)',   focusRing: { color: '{red.400}',   shadow: 'none' } } },
//       secondary: { background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border-secondary)', color: 'var(--theme-text-secondary)', shadow: 'none', closeButton: { hoverBackground: 'var(--component-bg-hover)', focusRing: { color: 'var(--theme-border-secondary)', shadow: 'none' } } },
//       contrast:  { background: 'var(--theme-text-primary)', borderColor: 'var(--theme-text-secondary)', color: 'var(--theme-bg-primary)', shadow: 'none', closeButton: { hoverBackground: 'rgba(255,255,255,0.10)', focusRing: { color: 'var(--theme-bg-primary)', shadow: 'none' } } },
//     },

//     // ── DRAWER ───────────────────────────────────────────────────────────────
//     drawer: {
//       background: 'var(--theme-bg-primary)', borderColor: 'var(--theme-border-primary)',
//       color: 'var(--theme-text-primary)', shadow: '0 8px 32px rgba(0,0,0,0.14)',
//       header: { padding: '1.25rem 1.5rem 0.75rem 1.5rem', gap: '0.75rem' },
//       title: { fontSize: '1rem', fontWeight: '700' },
//       content: { padding: '0 1.5rem 1.25rem 1.5rem' },
//       footer:  { padding: '0.75rem 1.5rem 1.25rem 1.5rem' },
//     },

//     // ── POPOVER / CONFIRMPOPUP ────────────────────────────────────────────────
//     popover: {
//       background: 'var(--theme-bg-primary)', borderColor: 'var(--theme-border-primary)',
//       color: 'var(--theme-text-primary)', borderRadius: '{primitive.borderRadius.md}',
//       shadow: '0 6px 24px rgba(0,0,0,0.12)', gutter: '6px', arrowOffset: '1.125rem',
//       content: { padding: '0.625rem 0.875rem' },
//     },

//     // ── CONFIRMDIALOG ────────────────────────────────────────────────────────
//     confirmDialog: {
//       icon: { size: '1.75rem', color: 'var(--theme-text-secondary)' },
//       content: { gap: '0.875rem' },
//     },

//     // ── MENU ─────────────────────────────────────────────────────────────────
//     menu: {
//       background: 'var(--theme-bg-primary)', borderColor: 'var(--theme-border-primary)',
//       color: 'var(--theme-text-primary)', borderRadius: '{primitive.borderRadius.md}',
//       shadow: '0 4px 16px rgba(0,0,0,0.10)',
//       list: { padding: '0.25rem', gap: '1px' },
//       item: {
//         padding: '0.4375rem 0.625rem', borderRadius: '{primitive.borderRadius.sm}', gap: '0.5rem',
//         color: 'var(--theme-text-primary)',
//         focusBackground: 'var(--component-bg-hover)', activeBackground: 'rgba(59,130,246,0.08)',
//         focusColor: 'var(--theme-text-primary)', activeColor: '{primary.600}',
//         icon: { color: 'var(--theme-text-tertiary)', focusColor: 'var(--theme-text-secondary)', activeColor: '{primary.500}' },
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//       },
//       submenuLabel: { padding: '0.375rem 0.625rem', fontWeight: '700', color: 'var(--theme-text-tertiary)', background: 'transparent' },
//       separator: { borderColor: 'var(--theme-border-primary)', margin: '0.25rem 0' },
//     },

//     // ── PAGINATOR ────────────────────────────────────────────────────────────
//     paginator: {
//       padding: '0.5rem 0.75rem', gap: '0.25rem',
//       borderRadius: '{primitive.borderRadius.md}',
//       background: 'var(--theme-bg-primary)', color: 'var(--theme-text-secondary)',
//       navButton: {
//         background: 'transparent', hoverBackground: 'var(--component-bg-hover)',
//         selectedBackground: 'rgba(59,130,246,0.08)',
//         color: 'var(--theme-text-secondary)', hoverColor: 'var(--theme-text-primary)', selectedColor: '{primary.600}',
//         width: '2.25rem', height: '2.25rem', borderRadius: '{primitive.borderRadius.sm}',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//       },
//       currentPageReport: { color: 'var(--theme-text-tertiary)' },
//       jumpToPageInput: { maxWidth: '3.5rem' },
//     },

//     // ── DATATABLE ────────────────────────────────────────────────────────────
//     dataTable: {
//       header:     { background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border-primary)', color: 'var(--theme-text-primary)', padding: '0.75rem 1rem', borderWidth: '0 0 1px 0' },
//       headerCell: {
//         background: 'var(--theme-bg-secondary)', hoverBackground: 'var(--component-bg-hover)',
//         selectedBackground: 'rgba(59,130,246,0.06)',
//         color: 'var(--theme-text-secondary)', hoverColor: 'var(--theme-text-primary)', selectedColor: '{primary.600}',
//         padding: '0.625rem 0.875rem', borderWidth: '0 0 1px 0', borderColor: 'var(--theme-border-primary)',
//         fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//         sortIcon: { color: 'var(--theme-text-tertiary)', hoverColor: 'var(--theme-text-secondary)', focusColor: '{primary.500}' },
//         sortBadgeBackground: 'rgba(59,130,246,0.08)', sortBadgeColor: '{primary.600}',
//       },
//       body: {
//         cell: {
//           selectedBackground: 'rgba(59,130,246,0.05)',
//           borderColor: 'var(--theme-border-primary)',
//           hoverColor: 'var(--theme-text-primary)', selectedColor: 'var(--theme-text-primary)',
//           gap: '0.375rem', padding: '0.5625rem 0.875rem',
//           focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//         },
//         row: {
//           background: 'var(--theme-bg-primary)', hoverBackground: 'var(--component-bg-hover)',
//           selectedBackground: 'rgba(59,130,246,0.06)',
//           color: 'var(--theme-text-primary)', hoverColor: 'var(--theme-text-primary)', selectedColor: 'var(--theme-text-primary)',
//           borderColor: 'var(--theme-border-primary)', stripedBackground: 'var(--theme-bg-secondary)',
//           focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//         },
//         rowExpansion: { background: 'var(--theme-bg-primary)', color: 'var(--theme-text-primary)' },
//       },
//       footer: {
//         cell: {
//           background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border-primary)',
//           color: 'var(--theme-text-secondary)', fontWeight: '600', padding: '0.625rem 0.875rem',
//         },
//       },
//       borderColor: 'var(--theme-border-primary)',
//       resizeIndicatorBackground: '{primary.400}',
//       reorderIndicatorBackground: '{primary.400}',
//       scrollableHeaderBackground: 'var(--theme-bg-secondary)',
//       scrollableFooterBackground: 'var(--theme-bg-secondary)',
//       paginatorTop:    { borderColor: 'var(--theme-border-primary)', borderWidth: '0 0 1px 0' },
//       paginatorBottom: { borderColor: 'var(--theme-border-primary)', borderWidth: '1px 0 0 0' },
//       rowToggleButton: {
//         hoverBackground: 'var(--component-bg-hover)', selectedHoverBackground: 'rgba(59,130,246,0.12)',
//         color: 'var(--theme-text-tertiary)', hoverColor: 'var(--theme-text-secondary)',
//         selectedColor: '{primary.500}', selectedHoverColor: '{primary.600}',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//         borderRadius: '{primitive.borderRadius.sm}', size: '1.5rem',
//       },
//       smSize: { headerCellPadding: '0.375rem 0.625rem', bodyCellPadding: '0.375rem 0.625rem' },
//       lgSize: { headerCellPadding: '0.875rem 1.125rem', bodyCellPadding: '0.875rem 1.125rem' },
//     },

//     // ── STEPPER ──────────────────────────────────────────────────────────────
//     stepper: {
//       transitionDuration: '0.15s',
//       separator: { background: 'var(--theme-border-primary)', activeBackground: '{primary.400}', size: '2px', marginInlineStart: '0' },
//       step: { padding: '0.5rem', gap: '0.5rem' },
//       stepHeader: {
//         padding: '0.625rem', borderRadius: '{primitive.borderRadius.md}', gap: '0.5rem',
//         background: 'transparent', hoverBackground: 'var(--component-bg-hover)', activeBackground: 'transparent',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//       },
//       stepNumber: {
//         activeBackground: '{primary.500}', activeColor: '#ffffff',
//         background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)',
//         size: '2rem', fontSize: '0.875rem', fontWeight: '700',
//         borderRadius: '{primitive.borderRadius.full}', shadow: 'none',
//       },
//       stepTitle: {
//         color: 'var(--theme-text-secondary)', activeColor: 'var(--theme-text-primary)',
//         fontWeight: '600', fontSize: '0.875rem',
//       },
//     },

//     // ── AVATAR ───────────────────────────────────────────────────────────────
//     avatar: {
//       width: '2rem', height: '2rem', fontSize: '0.75rem', fontWeight: '700',
//       background: 'rgba(59,130,246,0.12)', color: '{primary.600}',
//       borderRadius: '{primitive.borderRadius.sm}',
//       lg: { width: '2.5rem', height: '2.5rem', fontSize: '0.9375rem' },
//       xl: { width: '3rem',   height: '3rem',   fontSize: '1.125rem'  },
//       group: { borderColor: 'var(--theme-bg-primary)', offset: '-0.625rem' },
//     },

//     // ── BREADCRUMB ───────────────────────────────────────────────────────────
//     breadcrumb: {
//       padding: '0.5rem 0.75rem', background: 'transparent', gap: '0.5rem',
//       item: {
//         color: 'var(--theme-text-secondary)', hoverColor: 'var(--theme-text-primary)',
//         icon: { color: 'var(--theme-text-tertiary)', hoverColor: 'var(--theme-text-secondary)' },
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//       },
//       separator: { color: 'var(--theme-text-tertiary)' },
//     },

//     // ── FIELDSET ─────────────────────────────────────────────────────────────
//     fieldset: {
//       background: 'var(--theme-bg-primary)', borderColor: 'var(--theme-border-primary)',
//       borderRadius: '{primitive.borderRadius.md}', color: 'var(--theme-text-primary)',
//       legend: {
//         background: 'var(--theme-bg-primary)', hoverBackground: 'var(--component-bg-hover)',
//         color: 'var(--theme-text-primary)', hoverColor: 'var(--theme-text-primary)',
//         borderRadius: '{primitive.borderRadius.sm}', borderWidth: '1px', borderColor: 'var(--theme-border-primary)',
//         fontWeight: '600', padding: '0.375rem 0.75rem', gap: '0.375rem',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//       },
//       content: { padding: '0.875rem 1rem 1rem 1rem' },
//       toggleIcon: { color: 'var(--theme-text-tertiary)', hoverColor: 'var(--theme-text-secondary)' },
//     },

//     // ── INPLACE ──────────────────────────────────────────────────────────────
//     inplace: {
//       display: {
//         hoverBackground: 'var(--component-bg-hover)', hoverColor: 'var(--theme-text-primary)',
//         borderRadius: '{primitive.borderRadius.sm}', padding: '0.375rem 0.625rem',
//         focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px', shadow: 'none' },
//         transitionDuration: '0.12s',
//       },
//     },

//     // ── KNOB ─────────────────────────────────────────────────────────────────
//     knob: {
//       value: { background: '{primary.500}' }, range: { background: 'var(--theme-bg-ternary)' },
//       text: { color: 'var(--theme-text-primary)', fontWeight: '600', fontSize: '0.8125rem' },
//       focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '1px', shadow: 'none' },
//     },

//     // ── METERGROUP ───────────────────────────────────────────────────────────
//     meterGroup: {
//       gap: '0.75rem', labelListGap: '0.5rem', labelGap: '0.375rem', labelIconSize: '0.875rem',
//       meter: { background: 'var(--theme-bg-ternary)', borderRadius: '{primitive.borderRadius.full}', size: '0.5rem' },
//     },
//   },

//   // ==========================================================================
//   //  OPTIONS
//   // ==========================================================================
//   options: {
//     prefix:           'p',
//     darkModeSelector: '.app-dark',
//     cssLayer:         false,
//   },
// });
