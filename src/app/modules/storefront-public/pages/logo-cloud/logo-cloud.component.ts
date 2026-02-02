import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-logo-cloud',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="section-root" 
             [ngStyle]="backgroundStyle()"
             [class.text-white]="isDark()"
             [class.text-dark]="!isDark()">
      
      <div class="bg-overlay" 
           *ngIf="config.backgroundImage"
           [style.background]="isDark() ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)'">
      </div>

      <div class="container-wrapper" 
           [class.standard]="config.containerWidth === 'standard'"
           [class.full]="config.containerWidth === 'full'">

        <div class="header-group" *ngIf="config.title">
          <h3 class="section-label">
            {{ config.title }}
          </h3>
          <div class="divider-line"></div>
        </div>

        <div class="logo-grid">
          
          @for (logo of config.logos; track $index) {
            
            <ng-container *ngIf="logo.url; else staticLogo">
              <a [attr.href]="isExternal(logo.url) ? logo.url : null"
                 [routerLink]="!isExternal(logo.url) ? getLink(logo.url) : null"
                 [target]="isExternal(logo.url) ? '_blank' : '_self'"
                 class="logo-item group"
                 [ngStyle]="logoStyle()">
                 
                 <img [src]="logo.image" [alt]="logo.name" loading="lazy">
              </a>
            </ng-container>

            <ng-template #staticLogo>
              <div class="logo-item" [ngStyle]="logoStyle()">
                <img [src]="logo.image" [alt]="logo.name" loading="lazy">
              </div>
            </ng-template>

          }

        </div>

      </div>
    </section>
  `,
  styleUrls: ['./logo-cloud.component.scss']
})
export class LogoCloudComponent {
  @Input() config: any = {};

  // Helpers
  isDark = computed(() => this.config.theme === 'dark');

  backgroundStyle = computed(() => {
    const style: any = {};
    
    // Background Color or Default
style['background-color'] = this.config.backgroundColor || 'var(--bg-primary)';

    if (this.config.backgroundImage) {
      // style['background-image'] = `url('${this.config.backgroundImage}')`;
      style['background-size'] = 'cover';
      style['background-position'] = 'center';
    }

    // Spacing
    const paddingMap: any = { 
      'sm': 'var(--spacing-3xl)', 
      'md': 'var(--spacing-5xl)', 
      'lg': 'var(--spacing-7xl)' 
    };
    
    style['padding-top'] = paddingMap[this.config.paddingTop] || 'var(--spacing-5xl)';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || 'var(--spacing-5xl)';

    return style;
  });

  logoStyle = computed(() => {
    // If Grayscale is ON, force grayscale.
    // If Dark Mode is ON, maybe invert brightness for dark logos?
    // For now, simpler is better:
    return {
      'opacity': this.config.opacity || 0.6,
      'filter': this.config.grayscale ? 'grayscale(100%)' : 'none',
      // Optional: Add brightness filter if logo is dark on dark bg
      // 'filter': this.isDark() ? 'brightness(0) invert(1)' : 'grayscale(100%)' 
    };
  });

  getLink(url: string | undefined): any[] | null {
    if (!url) return null;
    return [url];
  }

  isExternal(url: string | undefined): boolean {
    return !!url && (url.startsWith('http') || url.startsWith('www'));
  }
}

// import { Component, Input, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-logo-cloud',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './logo-cloud.component.html',
//   styleUrls: ['./logo-cloud.component.scss']
// })
// export class LogoCloudComponent {
//   @Input() config: any = {};

//   // Computed Styles for the container
//   backgroundStyle = computed(() => {
//     const style: any = {};
    
//     // 1. Background Color
//     if (this.config.backgroundColor) {
//       style['background-color'] = this.config.backgroundColor;
//     }

//     // 2. Background Image (Added quotes to handle URLs safely)
//     if (this.config.backgroundImage) {
//       style['background-image'] = `url('${this.config.backgroundImage}')`;
//       style['background-size'] = 'cover';
//       style['background-position'] = 'center';
//       style['background-repeat'] = 'no-repeat';
//     }

//     // 3. Spacing
//     const paddingMap: any = { 'sm': '3rem', 'md': '5rem', 'lg': '7rem' };
//     style['padding-top'] = paddingMap[this.config.paddingTop] || '5rem';
//     style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '5rem';

//     return style;
//   });

//   // Logo Filters (Grayscale + Opacity)
//   logoStyle = computed(() => {
//     return {
//       'opacity': this.config.opacity || 0.7,
//       'filter': this.config.grayscale ? 'grayscale(100%) contrast(80%)' : 'none'
//     };
//   });

//   getLink(url: string | undefined): any[] | string | undefined {
//     if (!url) return undefined;
//     return url.startsWith('http') ? url : [url];
//   }

//   isExternal(url: string | undefined): boolean {
//     return !!url && url.startsWith('http');
//   }
// }