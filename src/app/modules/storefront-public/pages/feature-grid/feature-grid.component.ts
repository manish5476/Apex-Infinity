import { Component, Input, signal, computed, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface FeatureItem {
  icon?:        string;   // PrimeIcons class e.g. 'pi-shield'
  title:        string;
  description:  string;
  linkUrl?:     string;
  image?:       string;
}

export interface FeatureGridConfig {
  title?:          string;
  columns?:        2 | 3 | 4;
  items?:          FeatureItem[];
  design?:         any;       // Upgraded: Handles customBackground, borderRadius, boxShadow
  typography?:     any;       // Upgraded: Handles custom fonts and text colors
  paddingTop?:     'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?:  'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundImage?: string;
  themeMode?:      'auto' | 'light' | 'dark' | 'glass';
}

const PADDING: Record<string, string> = {
  none: '0',
  sm:   'var(--spacing-3xl)',
  md:   'var(--spacing-5xl)',
  lg:   'calc(var(--spacing-5xl) * 1.5)',
  xl:   'calc(var(--spacing-5xl) * 2)'
};

const MOCK_ITEMS: FeatureItem[] = [
  { icon: 'pi-shield',    title: 'Secure by Default',   description: 'End-to-end encryption and bank-grade security on every transaction, every time.' },
  { icon: 'pi-bolt',      title: 'Lightning Fast',      description: 'Sub-50ms response times powered by global edge infrastructure.' },
  { icon: 'pi-sync',      title: 'Always in Sync',      description: 'Real-time updates across all your devices without ever refreshing.' },
  { icon: 'pi-chart-bar', title: 'Deep Analytics',      description: 'Understand every customer touchpoint with actionable, real-time insights.' },
  { icon: 'pi-headset',   title: '24/7 Support',        description: 'Our team is available around the clock to help you succeed.' },
  { icon: 'pi-globe',     title: 'Global Reach',        description: 'Sell to customers in 150+ countries with localised pricing and checkout.' }
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-feature-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="fg-root" [ngStyle]="sectionStyle()">
      @if (cfg().backgroundImage) {
        <div class="fg-bg-image" [style.background-image]="'url(' + cfg().backgroundImage + ')'"></div>
        <div class="fg-bg-overlay"></div>
      }

      <div class="fg-container relative z-10 max-w-[1300px] mx-auto px-6 md:px-12">
        @if (cfg().title) {
          <header class="fg-header text-center mb-12 md:mb-20 flex flex-col items-center gap-4">
            <h2 class="fg-title" [ngStyle]="headingStyle()">
              {{ cfg().title }}
            </h2>
            <div class="fg-title-line w-12 h-1 rounded-sm opacity-90" 
                 [ngStyle]="{'background-color': cfg().typography?.headingColor || 'var(--accent-primary)'}"
                 [class.opacity-70]="isDarkSection()"></div>
          </header>
        }

        <div class="fg-grid" [ngStyle]="gridVars()">
          @for (item of items(); track item.title; let i = $index) {
            <div class="fg-card group" [class.fg-card-dark]="isDarkSection()" [ngStyle]="cardStyle()">
              
              @if (item.image) {
                <div class="fg-media w-full aspect-[16/9] rounded-xl overflow-hidden bg-surface-100">
                  <img [src]="item.image" [alt]="item.title" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              } @else if (item.icon) {
                <div class="fg-icon-wrap" [class.fg-icon-wrap-dark]="isDarkSection()">
                  <i [class]="'pi ' + item.icon" class="text-xl"></i>
                </div>
              }

              <div class="fg-text flex flex-col gap-2 flex-1">
                <h3 class="m-0 font-bold leading-tight transition-colors duration-200 text-xl md:text-2xl" [ngStyle]="headingStyle(true)">
                  {{ item.title }}
                </h3>
                <p class="m-0 leading-relaxed" [ngStyle]="bodyStyle()">
                  {{ item.description }}
                </p>
              </div>

              @if (item.linkUrl) {
                @if (isExternal(item.linkUrl)) {
                  <a [href]="item.linkUrl" target="_blank" rel="noopener" class="fg-link" [ngStyle]="linkStyle()">
                    Learn More <i class="pi pi-arrow-right text-[9px]"></i>
                  </a>
                } @else if (itemLink(item.linkUrl)) {
                  <a [routerLink]="itemLink(item.linkUrl)" class="fg-link" [ngStyle]="linkStyle()">
                    Learn More <i class="pi pi-arrow-right text-[9px]"></i>
                  </a>
                }
              }

              <div class="fg-card-accent" aria-hidden="true" [ngStyle]="{'background-color': cfg().typography?.headingColor || 'var(--accent-primary)'}"></div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .fg-root { position: relative; overflow: hidden; background-color: transparent; }
    .fg-root::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(circle, var(--border-secondary) 1px, transparent 1px); background-size: 28px 28px; opacity: 0.25; pointer-events: none; }
    
    .fg-bg-image { position: absolute; inset: 0; background-size: cover; background-position: center; z-index: 0; }
    .fg-bg-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.6); z-index: 1; }
    
    .fg-title { margin: 0; font-size: clamp(26px, 4vw, 44px); font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; }
    
    .fg-grid { display: grid; gap: var(--spacing-xl); grid-template-columns: repeat(1, 1fr); }
    @media (min-width: 640px) { .fg-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .fg-grid { grid-template-columns: repeat(var(--fg-cols, 3), 1fr); } }

    .fg-card { position: relative; padding: var(--spacing-2xl); background: var(--bg-primary); border: 1px solid var(--border-secondary); display: flex; flex-direction: column; gap: var(--spacing-lg); overflow: hidden; will-change: transform; transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease, border-color 0.25s ease; }
    .fg-card:hover { transform: translateY(-5px); border-color: var(--accent-primary); outline: none; }
    .fg-card:hover .fg-icon-wrap { background: var(--accent-primary); color: var(--bg-primary) !important; transform: scale(1.08) rotate(-4deg); border-color: transparent; }
    .fg-card:hover .fg-card-accent { transform: scaleX(1); }
    .fg-card:hover .fg-link { gap: 10px; }

    .fg-card-dark { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .fg-card-dark:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.25); }

    .fg-card-accent { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; transform: scaleX(0); transform-origin: left center; transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); }

    .fg-icon-wrap { width: 52px; height: 52px; border-radius: 14px; background: var(--bg-secondary); border: 1px solid var(--border-secondary); display: flex; align-items: center; justify-content: center; color: var(--accent-primary); flex-shrink: 0; transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
    .fg-icon-wrap-dark { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.12); color: rgba(255, 255, 255, 0.85); }

    .fg-link { display: inline-flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; transition: gap 0.2s ease, color 0.15s ease; margin-top: auto; padding-top: var(--spacing-sm); font-size: 10px; font-weight: 800; }
  `]
})
export class FeatureGridComponent {

  @Input() set config(v: FeatureGridConfig) { this._config.set(v ?? {}); }

  private _config = signal<FeatureGridConfig>({});

  readonly cfg = computed(() => ({
    title:         this._config().title         ?? 'Why Choose Us',
    columns:       this._config().columns       ?? 3,
    design:        this._config().design,
    typography:    this._config().typography,
    paddingTop:    this._config().paddingTop    ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundColor: this._config().backgroundColor ?? '',
    backgroundImage: this._config().backgroundImage ?? '',
    themeMode:     this._config().themeMode     ?? 'auto'
  }));

  readonly items = computed(() => {
    const src = this._config().items;
    return (Array.isArray(src) && src.length > 0) ? src : MOCK_ITEMS;
  });

  readonly hasBgImage = computed(() => !!this.cfg().backgroundImage);
  readonly isDarkSection = computed(() => this.hasBgImage() || this.cfg().themeMode === 'dark');

  // Dynamic Styles Mapping
  readonly sectionStyle = computed(() => ({
    'padding-top':    PADDING[this.cfg().paddingTop]    ?? PADDING['lg'],
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? PADDING['lg'],
    'background-color': this.cfg().design?.customBackground || this.cfg().backgroundColor || 'transparent'
  }));

  cardStyle() {
    const base: any = {
      'border-radius': `var(--ui-border-radius-${this.cfg().design?.borderRadius || '2xl'})`,
    };
    
    // Only apply custom shadow if it's set in design overrides, else default to hover state in CSS
    if (this.cfg().design?.boxShadow && this.cfg().design?.boxShadow !== 'none') {
      base['box-shadow'] = `var(--shadow-${this.cfg().design.boxShadow})`;
    }

    // Only force custom card background if specifically overridden in design settings, 
    // otherwise fallback to CSS logic (glassmorphism for dark/bg images).
    if (this.cfg().design?.customBackground) {
      base['background-color'] = this.cfg().design.customBackground;
    }
    return base;
  }

  headingStyle(isCardTitle = false) {
    const style: any = { 'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)' };
    if (this.isDarkSection()) {
      style['color'] = '#ffffff';
      if (!isCardTitle) style['text-shadow'] = '0 2px 12px rgba(0, 0, 0, 0.3)';
    } else {
      style['color'] = this.cfg().typography?.headingColor || 'var(--text-primary)';
    }
    return style;
  }

  bodyStyle() {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-body)',
      'color': this.isDarkSection() ? 'rgba(255, 255, 255, 0.65)' : (this.cfg().typography?.bodyColor || 'var(--text-secondary)')
    };
  }

  linkStyle() {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-mono)',
      'color': this.isDarkSection() ? 'rgba(255, 255, 255, 0.8)' : (this.cfg().typography?.headingColor || 'var(--accent-primary)')
    };
  }

  readonly gridVars = computed(() => ({
    '--fg-cols': String(this.cfg().columns),
  }));

  itemLink(url: string | undefined): string[] | null {
    if (!url || url.startsWith('http') || url.startsWith('www')) return null;
    const clean = url.startsWith('/') ? url.slice(1) : url;
    return clean ? ['/', clean] : null;
  }

  isExternal(url: string | undefined): boolean {
    return !!url && (url.startsWith('http') || url.startsWith('www'));
  }
}// // src/app/modules/storefront-public/pages/feature-grid/feature-grid.component.ts
// import {
//   Component, Input, signal, computed,
//   ChangeDetectionStrategy
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// // ---------------------------------------------------------------------------
// // Types — mirror SectionRegistry feature_grid schema exactly
// // ---------------------------------------------------------------------------

// export interface FeatureItem {
//   icon?:        string;   // PrimeIcons class e.g. 'pi-shield'
//   title:        string;
//   description:  string;
//   linkUrl?:     string;
//   image?:       string;
// }

// export interface FeatureGridConfig {
//   title?:       string;
//   columns?:     2 | 3 | 4;
//   items?:       FeatureItem[];      // registry uses 'items', not 'features'
//   // Style tokens from section schema
//   paddingTop?:  'none' | 'sm' | 'md' | 'lg' | 'xl';
//   paddingBottom?:'none' | 'sm' | 'md' | 'lg' | 'xl';
//   backgroundColor?: string;
//   backgroundImage?: string;
//   themeMode?:   'auto' | 'light' | 'dark' | 'glass';
// }

// // ---------------------------------------------------------------------------
// // Padding token map — only uses tokens that actually exist
// // ---------------------------------------------------------------------------
// const PADDING: Record<string, string> = {
//   none: '0',
//   sm:   'var(--spacing-3xl)',
//   md:   'var(--spacing-5xl)',
//   lg:   'calc(var(--spacing-5xl) * 1.5)',  // ~5.25rem; avoids missing 7xl token
//   xl:   'calc(var(--spacing-5xl) * 2)'
// };

// // ---------------------------------------------------------------------------
// // Mock items — used in page builder preview
// // ---------------------------------------------------------------------------
// const MOCK_ITEMS: FeatureItem[] = [
//   { icon: 'pi-shield',    title: 'Secure by Default',   description: 'End-to-end encryption and bank-grade security on every transaction, every time.' },
//   { icon: 'pi-bolt',      title: 'Lightning Fast',       description: 'Sub-50ms response times powered by global edge infrastructure.' },
//   { icon: 'pi-sync',      title: 'Always in Sync',       description: 'Real-time updates across all your devices without ever refreshing.' },
//   { icon: 'pi-chart-bar', title: 'Deep Analytics',       description: 'Understand every customer touchpoint with actionable, real-time insights.' },
//   { icon: 'pi-headset',   title: '24/7 Support',         description: 'Our team is available around the clock to help you succeed.' },
//   { icon: 'pi-globe',     title: 'Global Reach',         description: 'Sell to customers in 150+ countries with localised pricing and checkout.' }
// ];

// @Component({
//   selector: 'app-feature-grid',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './feature-grid.component.html',
//   styleUrls:   ['./feature-grid.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class FeatureGridComponent {

//   @Input() set config(v: FeatureGridConfig) { this._config.set(v ?? {}); }

//   private _config = signal<FeatureGridConfig>({});

//   readonly cfg = computed(() => ({
//     title:         this._config().title         ?? 'Why Choose Us',
//     columns:       this._config().columns       ?? 3,
//     paddingTop:    this._config().paddingTop    ?? 'lg',
//     paddingBottom: this._config().paddingBottom ?? 'lg',
//     backgroundColor: this._config().backgroundColor ?? '',
//     backgroundImage: this._config().backgroundImage ?? '',
//     themeMode:     this._config().themeMode     ?? 'auto'
//   }));

//   readonly items = computed(() => {
//     const src = this._config().items;
//     return (Array.isArray(src) && src.length > 0) ? src : MOCK_ITEMS;
//   });

//   readonly hasBgImage = computed(() => !!this.cfg().backgroundImage);
//   readonly isDarkSection = computed(() =>
//     this.hasBgImage() || this.cfg().themeMode === 'dark'
//   );

//   readonly sectionStyle = computed(() => ({
//     'padding-top':    PADDING[this.cfg().paddingTop]    ?? PADDING['lg'],
//     'padding-bottom': PADDING[this.cfg().paddingBottom] ?? PADDING['lg'],
//     'background-color': this.cfg().backgroundColor || ''
//   }));

//   readonly gridVars = computed(() => ({
//     '--fg-cols': String(this.cfg().columns),
//   }));

//   /** Safe routerLink — handles both /path and plain path */
//   itemLink(url: string | undefined): string[] | null {
//     if (!url) return null;
//     if (url.startsWith('http') || url.startsWith('www')) return null; // external
//     const clean = url.startsWith('/') ? url.slice(1) : url;
//     return clean ? ['/', clean] : null;
//   }

//   isExternal(url: string | undefined): boolean {
//     return !!url && (url.startsWith('http') || url.startsWith('www'));
//   }
// }
