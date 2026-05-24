import { Component, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface SplitImageTextConfig {
  image?: string;
  imagePosition?: 'left' | 'right';
  title?: string;
  content?: string;
  ctaButton?: { text: string; link: string; variant?: string };
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
}

const PADDING: Record<string, string> = {
  none: '0',
  sm: 'var(--spacing-3xl, 3rem)',
  md: 'var(--spacing-5xl, 5rem)',
  lg: 'var(--spacing-7xl, 8rem)',
  xl: 'var(--spacing-9xl, 12rem)'
};

const PLACEHOLDER = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&q=80';

@Component({
  selector: 'app-split-content',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="prem-split" [ngStyle]="sectionStyle()">
      <div class="prem-split__container">
        
        <div class="prem-grid" [class.prem-grid--reversed]="cfg().imagePosition === 'right'">
          
          <div class="prem-media">
            <div class="prem-media__glow" aria-hidden="true"></div>
            
            <div class="prem-media__card">
              <img [src]="cfg().image" [alt]="cfg().title" loading="lazy" class="prem-media__img" />
            </div>
          </div>

          <div class="prem-content">
            <span class="prem-eyebrow">Discover</span>
            
            <h2 class="prem-title">{{ cfg().title }}</h2>
            
            <p class="prem-desc">{{ cfg().content }}</p>

            @if (cfg().ctaButton?.text) {
              <div class="prem-actions">
                @if (isExternal(cfg().ctaButton!.link)) {
                  <a [href]="cfg().ctaButton!.link" target="_blank" rel="noopener" class="prem-btn">
                    <span>{{ cfg().ctaButton!.text }}</span>
                    <i class="pi pi-arrow-right"></i>
                  </a>
                } @else {
                  <a [routerLink]="[cfg().ctaButton!.link]" class="prem-btn">
                    <span>{{ cfg().ctaButton!.text }}</span>
                    <i class="pi pi-arrow-right"></i>
                  </a>
                }
              </div>
            }
          </div>

        </div>
      </div>
    </section>
  `,
  styles: [`
    /* ==========================================================================
       APPLE / LINEAR PREMIUM SPLIT CONTENT AESTHETIC
       ========================================================================== */
    :host {
      display: block;
      width: 100%;
      
      /* Premium Easing Curves */
      --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.1);
      --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
    }

    .prem-split {
      background-color: var(--bg-primary, #ffffff);
      overflow: hidden;
      transition: background-color 0.5s var(--ease-smooth);
      font-family: var(--font-body, 'Inter', -apple-system, sans-serif);
      color: var(--text-primary, #0f172a);
    }

    .prem-split__container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 5%;
    }

    /* --- Grid Layout --- */
    .prem-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 4rem;
      align-items: center;
    }

    @media (min-width: 1024px) {
      .prem-grid {
        grid-template-columns: 1fr 1fr;
        gap: 6rem; /* Wide, breathable spacing */
      }
      /* RTL smoothly swaps the visual order of the grid without flex-order hacks */
      .prem-grid--reversed {
        direction: rtl;
      }
      .prem-grid--reversed > * {
        direction: ltr; /* Reset text direction for children */
      }
    }

    /* --- Media Area (Cinematic Elevation) --- */
    .prem-media {
      position: relative;
      width: 100%;
      perspective: 1000px;
      opacity: 0;
      animation: prem-fade-up 1s var(--ease-smooth) forwards;
    }

    .prem-media__glow {
      position: absolute;
      inset: -5%;
      background: radial-gradient(circle at center, color-mix(in srgb, var(--theme-accent-primary, #2563eb) 35%, transparent), transparent 70%);
      filter: blur(50px);
      opacity: 0.4;
      z-index: 0;
      transition: opacity 0.8s var(--ease-smooth), transform 0.8s var(--ease-smooth);
    }

    .prem-media:hover .prem-media__glow {
      opacity: 0.7;
      transform: scale(1.05);
    }

    .prem-media__card {
      position: relative;
      z-index: 1;
      width: 100%;
      aspect-ratio: 4 / 3;
      border-radius: 2rem;
      background-color: var(--bg-secondary, #f8fafc);
      border: 1px solid color-mix(in srgb, var(--border-secondary, #e2e8f0) 50%, transparent);
      box-shadow: 
        0 4px 6px -1px rgba(0, 0, 0, 0.05),
        0 20px 40px -10px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: transform 0.6s var(--ease-spring), box-shadow 0.6s var(--ease-smooth);
    }

    @media (min-width: 1024px) {
      .prem-media__card { aspect-ratio: 1 / 1; }
    }

    .prem-media:hover .prem-media__card {
      transform: translateY(-8px);
      box-shadow: 
        0 10px 15px -3px rgba(0, 0, 0, 0.05),
        0 30px 60px -15px color-mix(in srgb, var(--theme-accent-primary, #2563eb) 20%, rgba(0,0,0,0.15));
    }

    .prem-media__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.8s var(--ease-smooth);
    }

    .prem-media:hover .prem-media__img {
      transform: scale(1.04);
    }

    /* --- Content Area --- */
    .prem-content {
      display: flex;
      flex-direction: column;
      z-index: 2;
      opacity: 0;
      animation: prem-fade-up 1s var(--ease-smooth) 0.2s forwards;
    }

    .prem-eyebrow {
      display: inline-block;
      font-family: var(--font-mono, monospace);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-tertiary, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 1rem;
    }

    .prem-title {
      font-family: var(--font-heading, 'Inter', sans-serif);
      font-size: clamp(2.5rem, 4vw, 3.5rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.1;
      margin: 0 0 1.5rem 0;
      /* Subtle text gradient for a highly polished feel */
      background: linear-gradient(to right bottom, var(--text-primary, #0f172a) 30%, color-mix(in srgb, var(--text-primary, #0f172a) 60%, transparent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .prem-desc {
      font-size: 1.125rem;
      line-height: 1.7;
      color: var(--text-secondary, #475569);
      margin: 0 0 2.5rem 0;
      max-width: 540px;
      /* Supports multi-line textarea input perfectly */
      white-space: pre-line;
    }

    /* --- Actions --- */
    .prem-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .prem-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      height: 3.5rem;
      padding: 0 2rem;
      border-radius: 100px;
      background-color: var(--theme-accent-primary, #0f172a);
      color: var(--bg-primary, #ffffff);
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      border: 1px solid transparent;
      box-shadow: 0 4px 14px color-mix(in srgb, var(--theme-accent-primary, #0f172a) 25%, transparent);
      cursor: pointer;
      transition: all 0.3s var(--ease-spring);
    }

    .prem-btn i {
      font-size: 0.9rem;
      transition: transform 0.3s var(--ease-spring);
    }

    .prem-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px color-mix(in srgb, var(--theme-accent-primary, #0f172a) 40%, transparent);
      filter: brightness(1.1);
    }

    .prem-btn:hover i {
      transform: translateX(4px);
    }

    /* --- Animations --- */
    @keyframes prem-fade-up {
      0% { opacity: 0; transform: translateY(30px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SplitContentComponent {
  @Input() set config(v: SplitImageTextConfig) {
    this._config.set(v ?? {});
  }

  private _config = signal<SplitImageTextConfig>({});

  readonly cfg = computed(() => ({
    image: this._config().image ?? PLACEHOLDER,
    imagePosition: this._config().imagePosition ?? 'left',
    title: this._config().title ?? 'Crafted with Purpose',
    content: this._config().content ?? 'Every detail matters. We combine thoughtful design with premium materials to create products that stand the test of time.',
    ctaButton: this._config().ctaButton,
    paddingTop: this._config().paddingTop ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundColor: this._config().backgroundColor ?? ''
  }));

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop] ?? PADDING['lg'],
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? PADDING['lg'],
    'background-color': this.cfg().backgroundColor || ''
  }));

  isExternal(url: string): boolean {
    return url?.startsWith('http') || url?.startsWith('www');
  }
}