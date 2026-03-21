// src/app/modules/storefront-public/pages/feature-grid/feature-grid.component.ts
import {
  Component, Input, signal, computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// ---------------------------------------------------------------------------
// Types — mirror SectionRegistry feature_grid schema exactly
// ---------------------------------------------------------------------------

export interface FeatureItem {
  icon?:        string;   // PrimeIcons class e.g. 'pi-shield'
  title:        string;
  description:  string;
  linkUrl?:     string;
  image?:       string;
}

export interface FeatureGridConfig {
  title?:       string;
  columns?:     2 | 3 | 4;
  items?:       FeatureItem[];      // registry uses 'items', not 'features'
  // Style tokens from section schema
  paddingTop?:  'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?:'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
  backgroundImage?: string;
  themeMode?:   'auto' | 'light' | 'dark' | 'glass';
}

// ---------------------------------------------------------------------------
// Padding token map — only uses tokens that actually exist
// ---------------------------------------------------------------------------
const PADDING: Record<string, string> = {
  none: '0',
  sm:   'var(--spacing-3xl)',
  md:   'var(--spacing-5xl)',
  lg:   'calc(var(--spacing-5xl) * 1.5)',  // ~5.25rem; avoids missing 7xl token
  xl:   'calc(var(--spacing-5xl) * 2)'
};

// ---------------------------------------------------------------------------
// Mock items — used in page builder preview
// ---------------------------------------------------------------------------
const MOCK_ITEMS: FeatureItem[] = [
  { icon: 'pi-shield',    title: 'Secure by Default',   description: 'End-to-end encryption and bank-grade security on every transaction, every time.' },
  { icon: 'pi-bolt',      title: 'Lightning Fast',       description: 'Sub-50ms response times powered by global edge infrastructure.' },
  { icon: 'pi-sync',      title: 'Always in Sync',       description: 'Real-time updates across all your devices without ever refreshing.' },
  { icon: 'pi-chart-bar', title: 'Deep Analytics',       description: 'Understand every customer touchpoint with actionable, real-time insights.' },
  { icon: 'pi-headset',   title: '24/7 Support',         description: 'Our team is available around the clock to help you succeed.' },
  { icon: 'pi-globe',     title: 'Global Reach',         description: 'Sell to customers in 150+ countries with localised pricing and checkout.' }
];

@Component({
  selector: 'app-feature-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './feature-grid.component.html',
  styleUrls:   ['./feature-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureGridComponent {

  @Input() set config(v: FeatureGridConfig) { this._config.set(v ?? {}); }

  private _config = signal<FeatureGridConfig>({});

  readonly cfg = computed(() => ({
    title:         this._config().title         ?? 'Why Choose Us',
    columns:       this._config().columns       ?? 3,
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
  readonly isDarkSection = computed(() =>
    this.hasBgImage() || this.cfg().themeMode === 'dark'
  );

  readonly sectionStyle = computed(() => ({
    'padding-top':    PADDING[this.cfg().paddingTop]    ?? PADDING['lg'],
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? PADDING['lg'],
    'background-color': this.cfg().backgroundColor || ''
  }));

  readonly gridVars = computed(() => ({
    '--fg-cols': String(this.cfg().columns),
  }));

  /** Safe routerLink — handles both /path and plain path */
  itemLink(url: string | undefined): string[] | null {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('www')) return null; // external
    const clean = url.startsWith('/') ? url.slice(1) : url;
    return clean ? ['/', clean] : null;
  }

  isExternal(url: string | undefined): boolean {
    return !!url && (url.startsWith('http') || url.startsWith('www'));
  }
}


// import { Component, Input, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-feature-grid',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   template: `
//     <section class="section-root" [ngStyle]="backgroundStyle()">
      
//       <div class="bg-overlay" *ngIf="config.backgroundImage"></div>

//       <div class="container-wrapper"
//            [class.standard]="config.containerWidth === 'standard'"
//            [class.full]="config.containerWidth === 'full'">

//         <div class="header-group" 
//              [class.text-center]="config.textAlign === 'center'"
//              [class.text-left]="config.textAlign === 'left'">
          
//           @if (config.subtitle) {
//             <span class="subtitle animate-fade-up">{{ config.subtitle }}</span>
//           }
          
//           @if (config.title) {
//             <h2 class="section-title animate-fade-up delay-100">
//               {{ config.title }}
//             </h2>
//           }
//         </div>

//         <div class="feature-grid" [ngStyle]="gridStyle()">
          
//           @for (feature of config.features; track $index) {
//             <div class="feature-card group" 
//                  [ngClass]="'style-' + (config.cardStyle || 'minimal')"
//                  [style.text-align]="config.textAlign || 'center'">
              
//               <div class="media-wrapper" *ngIf="feature.image || feature.icon">
//                 @if (config.mediaType === 'image' && feature.image) {
//                   <div class="image-frame">
//                     <img [src]="feature.image" [alt]="feature.title" loading="lazy">
//                   </div>
//                 } 
//                 @else if (feature.icon) {
//                   <div class="icon-frame">
//                     <i [class]="'pi ' + feature.icon"></i>
//                   </div>
//                 }
//               </div>

//               <div class="content-box"> <h3>{{ feature.title }}</h3>
//                 <p>{{ feature.description }}</p>

//                 @if (feature.linkUrl) {
//                   <a [routerLink]="getLink(feature.linkUrl)" class="action-link"
//                      [style.color]="config.cardStyle === 'glass' ? 'white' : ''">
//                     Learn More <i class="pi pi-arrow-right"></i>
//                   </a>
//                 }
//               </div>

//             </div>
//           }

//         </div>

//       </div>
//     </section>
//   `,
//   styleUrls: ['./feature-grid.component.scss']
// })
// export class FeatureGridComponent {
//   @Input() config: any = {};

//   // Compute Grid Columns
//   gridStyle = computed(() => {
//     return {
//       '--cols': this.config.columns || 3,
//       '--gap': this.config.gap === 'lg' ? '40px' : '24px'
//     };
//   });

//   // Background Style
//   backgroundStyle = computed(() => {
//     const style: any = {};
    
//     // Background Color or Image
//     style['background-color'] = this.config.backgroundColor || 'var(--bg-primary)';

//     if (this.config.backgroundImage) {
//       style['background-image'] = `url(${this.config.backgroundImage})`;
//       style['background-size'] = 'cover';
//       style['background-position'] = 'center';
//     }

//     // Padding Logic
//     const paddingMap: any = { 
//         'sm': 'var(--spacing-3xl)', 
//         'md': 'var(--spacing-5xl)', 
//         'lg': 'var(--spacing-7xl)' 
//     };
    
//     style['padding-top'] = paddingMap[this.config.paddingTop] || 'var(--spacing-5xl)';
//     style['padding-bottom'] = paddingMap[this.config.paddingBottom] || 'var(--spacing-5xl)';

//     return style;
//   });

//   getLink(url: string): any[] {
//     if (!url) return [];
//     // If it's internal, return router array. If external, use href (not handled here for brevity)
//     return [url];
//   }
// }
