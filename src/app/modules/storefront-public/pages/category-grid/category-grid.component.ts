import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-category-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="section-root"
             [style.background-color]="config.backgroundColor || 'transparent'"
             [style.padding-top]="paddingMap[config.paddingTop] || '4rem'"
             [style.padding-bottom]="paddingMap[config.paddingBottom] || '4rem'">
      
      <div class="container mx-auto" 
           [class.max-w-7xl]="config.containerWidth === 'standard'"
           [class.max-w-full]="config.containerWidth === 'full'"
           [class.px-4]="config.containerWidth !== 'full'"
           [class.px-8]="config.containerWidth === 'full'">

        <div class="text-center mb-12" *ngIf="config.title || config.subtitle">
          @if (config.subtitle) {
            <span class="block text-xs font-bold uppercase tracking-[0.2em] text-rose-500 mb-3 animate-fade-up">
              {{ config.subtitle }}
            </span>
          }
          @if (config.title) {
            <h2 class="font-serif text-3xl md:text-5xl font-bold text-slate-900 leading-tight animate-fade-up delay-100">
              {{ config.title }}
            </h2>
          }
        </div>

        <div class="grid-layout" 
             [style.--cols]="config.columns || 4"
             [style.--gap]="gapMap[config.gap] || '24px'">
          
          @for (cat of categories; track cat.id || cat.name; let i = $index) {
            <a [routerLink]="getLink(cat.linkUrl)" 
               class="category-card group"
               [ngClass]="[shapeClass(), 'delay-' + (i * 50)]">
              
              <div class="image-box">
                <img [src]="cat.image || 'https://via.placeholder.com/400'" 
                     [alt]="cat.name" 
                     class="base-image"
                     loading="lazy">
                
                <div class="overlay"></div>
                
                @if (config.showProductCount && cat.productCount !== null) {
                  <span class="count-badge">
                    {{ cat.productCount }} Products
                  </span>
                }
              </div>

              <div class="info-box">
                <h3 class="category-name">{{ cat.name }}</h3>
                <span class="explore-link">
                  Explore <i class="pi pi-arrow-right text-[10px] ml-1 transition-transform group-hover:translate-x-1"></i>
                </span>
              </div>

            </a>
          }
        </div>

      </div>
    </section>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,600&family=Manrope:wght@400;600;700&display=swap');

    :host { display: block; font-family: 'Manrope', sans-serif; }

    /* LAYOUT ENGINE */
    .grid-layout {
      display: grid;
      gap: var(--gap);
      /* Mobile: 2 cols usually looks better than 1 for categories */
      grid-template-columns: repeat(2, 1fr); 
      
      @media (min-width: 768px) {
        grid-template-columns: repeat(var(--cols), 1fr);
      }
    }

    /* CARD STYLES */
    .category-card {
      position: relative;
      display: block;
      overflow: hidden;
      aspect-ratio: 1 / 1; /* Perfect Square Base */
      background: #f8fafc;
      transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease;
      cursor: pointer;
      text-decoration: none;

      /* HOVER STATE */
      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);

        .base-image { transform: scale(1.1); }
        .overlay { opacity: 0.4; }
        .info-box { transform: translateY(0); }
      }
    }

    /* SHAPES (Configurable) */
    .category-card.shape-circle {
      border-radius: 50%;
      .info-box { bottom: 20%; align-items: center; text-align: center; }
    }
    .category-card.shape-rounded { border-radius: 24px; }
    .category-card.shape-square { border-radius: 0; }
    .category-card.shape-pill {
      aspect-ratio: 3 / 4;
      border-radius: 100px;
    }

    /* IMAGE LAYER */
    .image-box {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .base-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.8s ease;
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: black;
      opacity: 0.2;
      transition: opacity 0.4s;
    }

    .count-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255,255,255,0.9);
      backdrop-filter: blur(4px);
      padding: 4px 10px;
      border-radius: 100px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #0f172a;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    /* INFO LAYER */
    .info-box {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
      height: 100%;
      color: white;
      transition: transform 0.4s;
    }

    .category-name {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 4px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }

    .explore-link {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.8;
      display: flex;
      align-items: center;
    }

    /* ANIMATIONS */
    .animate-fade-up {
      animation: fadeUp 0.8s ease-out forwards;
      opacity: 0;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .delay-100 { animation-delay: 100ms; }
    .delay-200 { animation-delay: 200ms; }
  `]
})
export class CategoryGridComponent {
  @Input() config: any = {};
  @Input() categories: any[] = []; // Input is 'categories', matches JSON logic

  // Maps for Cleaner Template
  paddingMap: any = {
    'none': '0', 'sm': '2rem', 'md': '4rem', 'lg': '6rem', 'xl': '8rem'
  };
  
  gapMap: any = {
    'sm': '12px', 'md': '24px', 'lg': '40px'
  };

  shapeClass = computed(() => {
    const shape = this.config.shape || 'rounded';
    return `shape-${shape}`;
  });

  // Helper to handle internal/external links
  getLink(url: string | undefined): any[] {
    if (!url) return [];
    // If it's a full URL, you might need a different handling (href instead of routerLink)
    // For internal structure:
    return ['/store', 'shivam', 'products']; // Example fallback, replace with parsed URL logic
  }
}