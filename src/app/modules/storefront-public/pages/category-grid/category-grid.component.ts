import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-category-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="section-root" [ngStyle]="sectionStyles()">
      
      <div class="bg-image-layer" *ngIf="config.backgroundImage"
           [style.background-image]="'url(' + config.backgroundImage + ')'">
      </div>
      
      <div class="bg-overlay" [style.opacity]="config.backgroundImage ? 0.6 : 0"></div>

      <div class="container-wrapper" 
           [class.standard]="config.containerWidth === 'standard'"
           [class.full]="config.containerWidth === 'full'">

        <div class="header-group" *ngIf="config.title || config.subtitle">
          @if (config.subtitle) {
            <span class="subtitle animate-in" 
                  [class.text-white]="hasBgImage()" 
                  [class.text-primary]="!hasBgImage()">
              {{ config.subtitle }}
            </span>
          }
          @if (config.title) {
            <h2 class="section-title animate-in delay-1"
                [class.text-white]="hasBgImage()" 
                [class.text-dark]="!hasBgImage()">
              {{ config.title }}
            </h2>
          }
        </div>

        <div class="grid-layout animate-in delay-2"
             [style.--cols]="config.columns || 4"
             [style.--gap]="gapMap[config.gap] || '24px'">
          
          @for (cat of categories; track cat.id || cat.name; let i = $index) {
            
            <a [href]="isExternal(cat.linkUrl) ? cat.linkUrl : null"
               [routerLink]="!isExternal(cat.linkUrl) ? getInternalLink(cat) : null"
               [target]="isExternal(cat.linkUrl) ? '_blank' : '_self'"
               class="category-card group"
               [ngClass]="[shapeClass(), 'delay-' + (i * 50)]">

              <div class="card-inner">
                <div class="image-box">
                  <img [src]="cat.image || 'https://via.placeholder.com/600x600'" 
                       [alt]="cat.name" 
                       class="base-image"
                       loading="lazy">
                  <div class="card-overlay"></div>
                </div>

                @if (config.showProductCount && cat.productCount !== null) {
                  <span class="count-badge">
                    {{ cat.productCount }} Items
                  </span>
                }

                <div class="content-box">
                  <h3 class="cat-name">{{ cat.name }}</h3>
                  
                  <div class="action-row">
                    <span class="btn-text">Explore</span>
                    <span class="btn-icon">
                      <i class="pi pi-arrow-right"></i>
                    </span>
                  </div>
                </div>
              </div>

            </a>
          }
        </div>

      </div>
    </section>
  `,
  styles: [`
    /* Copy styles from previous response - they remain unchanged */
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,600&family=Manrope:wght@400;500;700&display=swap');

    :host { display: block; font-family: 'Manrope', sans-serif; }
    .section-root { position: relative; width: 100%; overflow: hidden; background-color: var(--bg-primary, #ffffff); }
    .bg-image-layer { position: absolute; inset: 0; background-size: cover; background-position: center; background-attachment: fixed; z-index: 0; }
    .bg-overlay { position: absolute; inset: 0; background: #000; z-index: 1; pointer-events: none; transition: opacity 0.3s; }
    .container-wrapper { position: relative; z-index: 10; margin: 0 auto; padding: 0 24px; &.standard { max-width: 1440px; } &.full { max-width: 100%; padding: 0 40px; } }
    .header-group { text-align: center; margin-bottom: 60px; max-width: 800px; margin-left: auto; margin-right: auto; }
    .subtitle { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 12px; }
    .text-primary { color: var(--color-primary, #e11d48); }
    .section-title { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 600; line-height: 1.1; margin: 0; }
    .text-white { color: #ffffff; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
    .text-dark { color: var(--text-primary, #0f172a); }
    .grid-layout { display: grid; gap: var(--gap); grid-template-columns: repeat(1, 1fr); @media (min-width: 640px) { grid-template-columns: repeat(2, 1fr); } @media (min-width: 1024px) { grid-template-columns: repeat(var(--cols), 1fr); } }
    .category-card { display: block; text-decoration: none; width: 100%; cursor: pointer; &:hover { .card-inner { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.2); } .base-image { transform: scale(1.1); } .card-overlay { opacity: 0.5; } .btn-icon { transform: translateX(5px); background: #fff; color: #000; } .action-row { opacity: 1; transform: translateY(0); } } }
    .card-inner { position: relative; width: 100%; aspect-ratio: 1/1; overflow: hidden; background: #f1f5f9; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
    .shape-rounded .card-inner { border-radius: 20px; } .shape-circle .card-inner { border-radius: 50%; } .shape-pill .card-inner { border-radius: 100px; aspect-ratio: 3/4; }
    .image-box { position: absolute; inset: 0; }
    .base-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s ease; }
    .card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%); opacity: 0.3; transition: opacity 0.4s; }
    .count-badge { position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.3); color: #fff; padding: 4px 12px; border-radius: 100px; font-size: 10px; font-weight: 700; text-transform: uppercase; z-index: 2; }
    .content-box { position: absolute; bottom: 0; left: 0; width: 100%; padding: 24px; z-index: 2; display: flex; flex-direction: column; justify-content: flex-end; }
    .cat-name { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 500; color: #ffffff; margin: 0 0 12px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .action-row { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 12px; opacity: 0.8; transform: translateY(10px); transition: all 0.4s ease; }
    .btn-text { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #fff; }
    .btn-icon { width: 32px; height: 32px; border-radius: 50%; border: 1px solid #fff; display: flex; align-items: center; justify-content: center; color: #fff; transition: all 0.3s; i { font-size: 12px; } }
    .animate-in { opacity: 0; animation: fadeUp 0.8s ease forwards; } .delay-1 { animation-delay: 100ms; } .delay-2 { animation-delay: 200ms; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CategoryGridComponent {
  @Input() config: any = {};
  
  // ✅ FIXED: Renamed from 'data' to 'categories' to match parent binding
  @Input() categories: any[] = []; 
  
  @Input() orgSlug: string = '';

  private router = inject(Router);

  gapMap: any = { 'sm': '12px', 'md': '24px', 'lg': '40px' };
  paddingMap: any = { 'sm': '3rem', 'md': '5rem', 'lg': '8rem' };

  sectionStyles() {
    return {
      'background-color': this.config.backgroundColor || '#ffffff',
      'padding-top': this.paddingMap[this.config.paddingTop] || '5rem',
      'padding-bottom': this.paddingMap[this.config.paddingBottom] || '5rem'
    };
  }

  hasBgImage() {
    return !!this.config.backgroundImage;
  }

  shapeClass() {
    return `shape-${this.config.shape || 'rounded'}`;
  }

  isExternal(url: string | undefined): boolean {
    return !!url && (url.startsWith('http') || url.startsWith('www'));
  }

  getInternalLink(cat: any): any[] {
    if (cat.linkUrl && !this.isExternal(cat.linkUrl)) {
      return [cat.linkUrl];
    }
    const slug = this.orgSlug || this.extractSlugFromUrl();
    if (slug) {
        return ['/store', slug, 'products'];
    }
    return [];
  }

  private extractSlugFromUrl(): string {
    const match = this.router.url.match(/\/store\/([^\/]+)/);
    return match ? match[1] : '';
  }
}
// import { Component, Input, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-category-grid',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   template: `
//     <section class="section-root"
//              [style.background-color]="config.backgroundColor || 'transparent'"
//              [style.padding-top]="paddingMap[config.paddingTop] || '4rem'"
//              [style.padding-bottom]="paddingMap[config.paddingBottom] || '4rem'">
      
//       <div class="container mx-auto" 
//            [class.max-w-7xl]="config.containerWidth === 'standard'"
//            [class.max-w-full]="config.containerWidth === 'full'"
//            [class.px-4]="config.containerWidth !== 'full'"
//            [class.px-8]="config.containerWidth === 'full'">

//         <div class="text-center mb-12" *ngIf="config.title || config.subtitle">
//           @if (config.subtitle) {
//             <span class="block text-xs font-bold uppercase tracking-[0.2em] text-rose-500 mb-3 animate-fade-up">
//               {{ config.subtitle }}
//             </span>
//           }
//           @if (config.title) {
//             <h2 class="font-serif text-3xl md:text-5xl font-bold text-slate-900 leading-tight animate-fade-up delay-100">
//               {{ config.title }}
//             </h2>
//           }
//         </div>

//         <div class="grid-layout" 
//              [style.--cols]="config.columns || 4"
//              [style.--gap]="gapMap[config.gap] || '24px'">
          
//           @for (cat of categories; track cat.id || cat.name; let i = $index) {
//             <a [routerLink]="getLink(cat.linkUrl)" 
//                class="category-card group"
//                [ngClass]="[shapeClass(), 'delay-' + (i * 50)]">
              
//               <div class="image-box">
//                 <img [src]="cat.image || 'https://via.placeholder.com/400'" 
//                      [alt]="cat.name" 
//                      class="base-image"
//                      loading="lazy">
                
//                 <div class="overlay"></div>
                
//                 @if (config.showProductCount && cat.productCount !== null) {
//                   <span class="count-badge">
//                     {{ cat.productCount }} Products
//                   </span>
//                 }
//               </div>

//               <div class="info-box">
//                 <h3 class="category-name">{{ cat.name }}</h3>
//                 <span class="explore-link">
//                   Explore <i class="pi pi-arrow-right text-[10px] ml-1 transition-transform group-hover:translate-x-1"></i>
//                 </span>
//               </div>

//             </a>
//           }
//         </div>

//       </div>
//     </section>
//   `,
//   styles: [`
//     @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,600&family=Manrope:wght@400;600;700&display=swap');

//     :host { display: block; font-family: 'Manrope', sans-serif; }

//     /* LAYOUT ENGINE */
//     .grid-layout {
//       display: grid;
//       gap: var(--gap);
//       /* Mobile: 2 cols usually looks better than 1 for categories */
//       grid-template-columns: repeat(2, 1fr); 
      
//       @media (min-width: 768px) {
//         grid-template-columns: repeat(var(--cols), 1fr);
//       }
//     }

//     /* CARD STYLES */
//     .category-card {
//       position: relative;
//       display: block;
//       overflow: hidden;
//       aspect-ratio: 1 / 1; /* Perfect Square Base */
//       background: #f8fafc;
//       transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease;
//       cursor: pointer;
//       text-decoration: none;

//       /* HOVER STATE */
//       &:hover {
//         transform: translateY(-8px);
//         box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);

//         .base-image { transform: scale(1.1); }
//         .overlay { opacity: 0.4; }
//         .info-box { transform: translateY(0); }
//       }
//     }

//     /* SHAPES (Configurable) */
//     .category-card.shape-circle {
//       border-radius: 50%;
//       .info-box { bottom: 20%; align-items: center; text-align: center; }
//     }
//     .category-card.shape-rounded { border-radius: 24px; }
//     .category-card.shape-square { border-radius: 0; }
//     .category-card.shape-pill {
//       aspect-ratio: 3 / 4;
//       border-radius: 100px;
//     }

//     /* IMAGE LAYER */
//     .image-box {
//       width: 100%;
//       height: 100%;
//       position: relative;
//     }

//     .base-image {
//       width: 100%;
//       height: 100%;
//       object-fit: cover;
//       transition: transform 0.8s ease;
//     }

//     .overlay {
//       position: absolute;
//       inset: 0;
//       background: black;
//       opacity: 0.2;
//       transition: opacity 0.4s;
//     }

//     .count-badge {
//       position: absolute;
//       top: 16px;
//       right: 16px;
//       background: rgba(255,255,255,0.9);
//       backdrop-filter: blur(4px);
//       padding: 4px 10px;
//       border-radius: 100px;
//       font-size: 10px;
//       font-weight: 700;
//       text-transform: uppercase;
//       color: #0f172a;
//       box-shadow: 0 4px 10px rgba(0,0,0,0.1);
//     }

//     /* INFO LAYER */
//     .info-box {
//       position: absolute;
//       bottom: 0;
//       left: 0;
//       width: 100%;
//       padding: 24px;
//       display: flex;
//       flex-direction: column;
//       justify-content: flex-end;
//       background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
//       height: 100%;
//       color: white;
//       transition: transform 0.4s;
//     }

//     .category-name {
//       font-family: 'Playfair Display', serif;
//       font-size: 1.5rem;
//       font-weight: 600;
//       margin-bottom: 4px;
//       text-shadow: 0 2px 10px rgba(0,0,0,0.3);
//     }

//     .explore-link {
//       font-size: 11px;
//       font-weight: 700;
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//       opacity: 0.8;
//       display: flex;
//       align-items: center;
//     }

//     /* ANIMATIONS */
//     .animate-fade-up {
//       animation: fadeUp 0.8s ease-out forwards;
//       opacity: 0;
//     }
//     @keyframes fadeUp {
//       from { opacity: 0; transform: translateY(20px); }
//       to { opacity: 1; transform: translateY(0); }
//     }
//     .delay-100 { animation-delay: 100ms; }
//     .delay-200 { animation-delay: 200ms; }
//   `]
// })
// export class CategoryGridComponent {
//   @Input() config: any = {};
//   @Input() categories: any[] = []; // Input is 'categories', matches JSON logic

//   // Maps for Cleaner Template
//   paddingMap: any = {
//     'none': '0', 'sm': '2rem', 'md': '4rem', 'lg': '6rem', 'xl': '8rem'
//   };
  
//   gapMap: any = {
//     'sm': '12px', 'md': '24px', 'lg': '40px'
//   };

//   shapeClass = computed(() => {
//     const shape = this.config.shape || 'rounded';
//     return `shape-${shape}`;
//   });

//   // Helper to handle internal/external links
//   getLink(url: string | undefined): any[] {
//     if (!url) return [];
//     // If it's a full URL, you might need a different handling (href instead of routerLink)
//     // For internal structure:
//     return ['/store', 'shivam', 'products']; // Example fallback, replace with parsed URL logic
//   }
// }