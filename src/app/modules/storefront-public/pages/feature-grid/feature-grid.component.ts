import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-feature-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="section-root" [ngStyle]="backgroundStyle()">
      
      <div class="bg-overlay" *ngIf="config.backgroundImage"></div>

      <div class="container-wrapper"
           [class.standard]="config.containerWidth === 'standard'"
           [class.full]="config.containerWidth === 'full'">

        <div class="header-group" 
             [class.text-center]="config.textAlign === 'center'"
             [class.text-left]="config.textAlign === 'left'">
          
          @if (config.subtitle) {
            <span class="subtitle animate-fade-up">{{ config.subtitle }}</span>
          }
          
          @if (config.title) {
            <h2 class="section-title animate-fade-up delay-100">
              {{ config.title }}
            </h2>
          }
        </div>

        <div class="feature-grid" [ngStyle]="gridStyle()">
          
          @for (feature of config.features; track $index) {
            <div class="feature-card group" 
                 [ngClass]="'style-' + (config.cardStyle || 'minimal')"
                 [style.text-align]="config.textAlign || 'center'">
              
              <div class="media-wrapper" *ngIf="feature.image || feature.icon">
                @if (config.mediaType === 'image' && feature.image) {
                  <div class="image-frame">
                    <img [src]="feature.image" [alt]="feature.title" loading="lazy">
                  </div>
                } 
                @else if (feature.icon) {
                  <div class="icon-frame">
                    <i [class]="'pi ' + feature.icon"></i>
                  </div>
                }
              </div>

              <div class="content-box"> <h3>{{ feature.title }}</h3>
                <p>{{ feature.description }}</p>

                @if (feature.linkUrl) {
                  <a [routerLink]="getLink(feature.linkUrl)" class="action-link"
                     [style.color]="config.cardStyle === 'glass' ? 'white' : ''">
                    Learn More <i class="pi pi-arrow-right"></i>
                  </a>
                }
              </div>

            </div>
          }

        </div>

      </div>
    </section>
  `,
  styleUrls: ['./feature-grid.component.scss']
})
export class FeatureGridComponent {
  @Input() config: any = {};

  // Compute Grid Columns
  gridStyle = computed(() => {
    return {
      '--cols': this.config.columns || 3,
      '--gap': this.config.gap === 'lg' ? '40px' : '24px'
    };
  });

  // Background Style
  backgroundStyle = computed(() => {
    const style: any = {};
    
    // Background Color or Image
    style['background-color'] = this.config.backgroundColor || 'var(--bg-primary)';

    if (this.config.backgroundImage) {
      style['background-image'] = `url(${this.config.backgroundImage})`;
      style['background-size'] = 'cover';
      style['background-position'] = 'center';
    }

    // Padding Logic
    const paddingMap: any = { 
        'sm': 'var(--spacing-3xl)', 
        'md': 'var(--spacing-5xl)', 
        'lg': 'var(--spacing-7xl)' 
    };
    
    style['padding-top'] = paddingMap[this.config.paddingTop] || 'var(--spacing-5xl)';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || 'var(--spacing-5xl)';

    return style;
  });

  getLink(url: string): any[] {
    if (!url) return [];
    // If it's internal, return router array. If external, use href (not handled here for brevity)
    return [url];
  }
}

// import { Component, Input, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-feature-grid',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './feature-grid.component.html',
//   styleUrls: ['./feature-grid.component.scss']
// })
// export class FeatureGridComponent {
//   @Input() config: any = {};

//   // Compute Grid Columns (CSS Variable)
//   gridStyle = computed(() => {
//     const cols = this.config.columns || 3;
//     return {
//       '--cols': cols,
//       '--gap': '2rem'
//     };
//   });

//   // Background Style (Color or Image)
//   backgroundStyle = computed(() => {
//     const style: any = {};
    
//     // Base Color
//     if (this.config.backgroundColor) {
//       style['background-color'] = this.config.backgroundColor;
//     }

//     // Background Image (with overlay logic)
//     if (this.config.backgroundImage) {
//       style['background-image'] = `url(${this.config.backgroundImage})`;
//       style['background-size'] = 'cover';
//       style['background-position'] = 'center';
//     }

//     // Padding Logic
//     const paddingMap: any = { 'sm': '3rem', 'md': '5rem', 'lg': '8rem' };
//     style['padding-top'] = paddingMap[this.config.paddingTop] || '5rem';
//     style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '5rem';

//     return style;
//   });

//   // Helper for internal/external links
//   getLink(url: string): string | any[] {
//     if (!url) return [];
//     if (url.startsWith('http')) return url; // Handle in template via href if needed, but routerLink usually fine for internal
//     return [url];
//   }
// }