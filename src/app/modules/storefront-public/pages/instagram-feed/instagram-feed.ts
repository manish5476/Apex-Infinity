import { Component, Input, signal, computed, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface InstagramFeedConfig {
  title?: string;
  username?: string;
  limit?: number;
  design?: any;       // Upgraded: Handles customBackground, borderRadius, boxShadow
  typography?: any;   // Upgraded: Handles custom fonts and text colors
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const PADDING: Record<string, string> = {
  none: '0',
  sm:   'var(--spacing-3xl)',
  md:   'var(--spacing-5xl)',
  lg:   'calc(var(--spacing-5xl) * 1.5)',
  xl:   'calc(var(--spacing-5xl) * 2)'
};

// High-quality generic placeholders to make the builder preview look premium
const MOCK_POSTS = [
  'https://images.unsplash.com/photo-1611048267451-a6a2ea6eab7f?w=600&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1f8b?w=600&q=80',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80',
  'https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=600&q=80',
  'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=600&q=80',
  'https://images.unsplash.com/photo-1550614000-4b95dd247ed3?w=600&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80'
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-instagram-feed',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="insta-root" [ngStyle]="sectionStyle()">
      <div class="insta-container relative z-10 max-w-[1400px] mx-auto px-4 md:px-8">
        
        <div class="insta-header text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <i class="pi pi-instagram text-4xl mb-4" 
             [ngStyle]="{'color': cfg().typography?.headingColor || 'var(--accent-primary)'}"></i>
          
          <h2 class="insta-title m-0" [ngStyle]="headingStyle()">
            {{ cfg().title }}
          </h2>
          
          <a [href]="'https://instagram.com/' + cfg().username" 
             target="_blank" rel="noopener" 
             class="insta-link mt-4"
             [ngStyle]="linkStyle()">
            @{{ cfg().username }}
          </a>
        </div>

        <div class="insta-grid gap-2 md:gap-4 lg:gap-6">
          @for (post of displayPosts(); track $index) {
            <a [href]="'https://instagram.com/' + cfg().username" 
               target="_blank" rel="noopener" 
               class="insta-card group" 
               [ngStyle]="cardStyle()">
              
              <img [src]="post" alt="Instagram Post" loading="lazy" class="insta-img" />
              
              <div class="insta-overlay">
                <i class="pi pi-instagram insta-icon"></i>
              </div>
            </a>
          }
        </div>

      </div>
    </section>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .insta-root { position: relative; overflow: hidden; background-color: transparent; }
    
    .insta-title { font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
    
    .insta-link { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; text-decoration: none; transition: opacity 0.2s ease; }
    .insta-link:hover { opacity: 0.7; }
    
    /* Auto-flowing grid adjusts nicely whether they select 3, 6, 8, or 12 posts */
    .insta-grid { display: grid; grid-template-columns: repeat(2, 1fr); }
    @media (min-width: 768px) { .insta-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1024px) { .insta-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); } }

    .insta-card { position: relative; display: block; aspect-ratio: 1 / 1; overflow: hidden; background: var(--bg-secondary); border: 1px solid var(--border-primary); transform: translateZ(0); }
    
    .insta-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
    .insta-card:hover .insta-img { transform: scale(1.1); }
    
    .insta-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.6); opacity: 0; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); transition: opacity 0.3s ease; }
    .insta-card:hover .insta-overlay { opacity: 1; }
    
    .insta-icon { color: white; font-size: 2.5rem; transform: scale(0.5); opacity: 0; transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease; transition-delay: 0.1s; }
    .insta-card:hover .insta-icon { transform: scale(1); opacity: 1; }
  `]
})
export class InstagramFeedComponent {
  
  @Input() set config(v: InstagramFeedConfig) { this._config.set(v ?? {}); }
  private _config = signal<InstagramFeedConfig>({});

  readonly cfg = computed(() => ({
    title:         this._config().title         ?? 'Follow Us on Instagram',
    username:      this._config().username      ?? 'apx_commerce',
    limit:         this._config().limit         ?? 6,
    design:        this._config().design,
    typography:    this._config().typography,
    paddingTop:    this._config().paddingTop    ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg'
  }));

  readonly displayPosts = computed(() => {
    return MOCK_POSTS.slice(0, this.cfg().limit);
  });

  // --- Dynamic Style Methods ---

  readonly sectionStyle = computed(() => ({
    'padding-top':    PADDING[this.cfg().paddingTop]    ?? PADDING['lg'],
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? PADDING['lg'],
    'background-color': this.cfg().design?.customBackground || 'transparent'
  }));

  headingStyle() {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)',
      'color': this.cfg().typography?.headingColor || 'var(--text-primary)'
    };
  }

  linkStyle() {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-mono)',
      'color': this.cfg().typography?.headingColor || 'var(--accent-primary)'
    };
  }

  cardStyle() {
    const base: any = {
      'border-radius': `var(--ui-border-radius-${this.cfg().design?.borderRadius || 'xl'})`,
    };
    if (this.cfg().design?.boxShadow && this.cfg().design?.boxShadow !== 'none') {
      base['box-shadow'] = `var(--shadow-${this.cfg().design.boxShadow})`;
    }
    return base;
  }
}

// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { InstagramFeedConfig } from '@core/models/storefront.model';

// @Component({
//   selector: 'app-instagram-feed',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './instagram-feed.html',
//   styles: [`
//     :host { display: block; width: 100%; }
//   `]
// })
// export class InstagramFeedComponent {
//   @Input() config: InstagramFeedConfig = {};
  
//   // Placeholder images for the feed
//   mockPosts = [
//     'assets/images/placeholder.jpg',
//     'assets/images/placeholder.jpg',
//     'assets/images/placeholder.jpg',
//     'assets/images/placeholder.jpg',
//     'assets/images/placeholder.jpg',
//     'assets/images/placeholder.jpg'
//   ];
// }
