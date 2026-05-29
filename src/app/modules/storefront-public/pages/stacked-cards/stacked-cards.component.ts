import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { headingStyle, bodyStyle } from '../../dynamic-page/section-config.utils';

@Component({
  selector: 'app-stacked-cards',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="sc-section"
             [ngStyle]="getSectionStyle()">

      <div class="sc-container"
           [class.sc-container--md]="config.cardWidth === 'md'"
           [class.sc-container--lg]="config.cardWidth === 'lg' || !config.cardWidth"
           [class.sc-container--xl]="config.cardWidth === 'xl'">

        @for (card of config.cards; track card.title; let i = $index) {
          <article class="sc-card"
                   [ngStyle]="getCardStyle(card, i)">

            <!-- TEXT SIDE -->
            <div class="sc-card__body" [ngStyle]="{'text-align': config.typography?.alignment || 'left'}">

              @if (card.badge) {
                <span class="sc-badge" [ngStyle]="getBadgeStyle()">
                  {{ card.badge }}
                </span>
              }

              <h3 class="sc-heading" [ngStyle]="getHeadingStyle()">{{ card.title }}</h3>

              <p class="sc-body" [ngStyle]="getBodyStyle()">{{ card.content }}</p>
            </div>

            <!-- IMAGE SIDE — uses a canvas approach: fixed-size stage, image absolutely centered, transforms apply without clip -->
            @if (card.image) {
              <div class="sc-card__media" [ngStyle]="getMediaStyle(card)">
                <!-- Stage: overflow visible so rotated/scaled img never gets chopped -->
                <div class="sc-media-stage">
                  <div class="sc-media-transform"
                       [ngStyle]="getImageTransformStyle(card)">
                    <img class="sc-media-img"
                         [src]="card.image"
                         [alt]="card.title"
                         [ngStyle]="getImageStyle(card)"
                         loading="lazy" />
                  </div>
                </div>
              </div>
            }

          </article>
        }

      </div>
    </section>
  `,
  styles: [`
    /* ─── Section ─────────────────────────────────────────────────────────── */
    .sc-section {
      position: relative;
      width: 100%;
      padding: 6rem 1.5rem;
    }

    /* ─── Container ───────────────────────────────────────────────────────── */
    .sc-container {
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: clamp(2rem, 6vh, 5rem);
    }
    .sc-container--md { max-width: 48rem; }
    .sc-container--lg { max-width: 72rem; }
    .sc-container--xl { max-width: 90rem; }

    /* ─── Card ────────────────────────────────────────────────────────────── */
    .sc-card {
      position: sticky;
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 26rem;
      border-radius: 1.25rem;
      overflow: hidden;          /* clip the card box */
      box-shadow: 0 20px 60px -12px rgba(0,0,0,.18),
                  0  6px 24px -6px rgba(0,0,0,.12);
      transition: box-shadow .3s ease, transform .3s ease;
    }
    .sc-card:hover {
      box-shadow: 0 28px 72px -10px rgba(0,0,0,.22),
                  0  8px 32px -6px rgba(0,0,0,.14);
    }
    @media (max-width: 768px) {
      .sc-card {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
        min-height: unset;
      }
    }

    /* ─── Text body ───────────────────────────────────────────────────────── */
    .sc-card__body {
      padding: 3rem 3.5rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.5rem;
    }
    @media (max-width: 768px) {
      .sc-card__body { padding: 2rem 1.75rem; }
    }

    .sc-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.875rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: rgba(var(--primary-500-rgb, 99 102 241) / .1);
      color: var(--primary-600, #4f46e5);
      margin-bottom: 1.25rem;
      width: max-content;
    }

    .sc-heading {
      margin: 0 0 0.75rem;
      line-height: 1.18;
    }

    .sc-body {
      margin: 0;
      line-height: 1.75;
      opacity: .85;
    }

    /* ─── Media panel ─────────────────────────────────────────────────────── */
    .sc-card__media {
      position: relative;
      /* overflow visible here — the CARD clips, not this div.
         This way the image can rotate/scale freely within the card boundary */
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Stage: absolutely fills the media panel */
    .sc-media-stage {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;   /* <── this is what clips rotated edges cleanly at the card wall */
    }

    /* Transform wrapper: the actual rotation + scale happens here
       Sizing it larger than the panel means even after rotation the image fills completely */
    .sc-media-transform {
      position: relative;
      width: 140%;
      height: 140%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      will-change: transform;
      transform-origin: center center;
    }

    .sc-media-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
    }

    @media (max-width: 768px) {
      .sc-card__media {
        min-height: 260px;
      }
    }
  `]
})
export class StackedCardsComponent {
  @Input() config: any = {};

  getSectionStyle() {
    return {
      'background-color': this.config.design?.customBackground || 'var(--bg-primary)'
    };
  }

  getCardStyle(card: any, i: number) {
    return {
      'top': `calc(12vh + ${i * 28}px)`,
      'z-index': i + 1,
      'background-color': card.cardBgColor || 'var(--bg-secondary)',
      'border': '1px solid var(--border-primary, rgba(0,0,0,.07))'
    };
  }

  getMediaStyle(card: any) {
    return {
      'background-color': card.imageBgColor || 'var(--surface-100, #f3f4f6)'
    };
  }

  getHeadingStyle() {
    return headingStyle(this.config, {
      'font-size': this.getHeadingSize(),
    });
  }

  getBodyStyle() {
    return bodyStyle(this.config, {
      'font-size': '1.0625rem',
    });
  }

  getBadgeStyle() {
    const align = this.config.typography?.alignment || 'left';
    const selfMap: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
    return headingStyle(this.config, {
      'align-self': selfMap[align] ?? 'flex-start',
      'font-size': '0.7rem',
    });
  }

  getHeadingSize() {
    const size = this.config.typography?.headingSize || 'lg';
    const map: Record<string, string> = {
      'sm': 'clamp(1.25rem, 2vw, 1.5rem)',
      'md': 'clamp(1.5rem, 2.5vw, 2rem)',
      'lg': 'clamp(1.75rem, 3vw, 2.5rem)',
      'xl': 'clamp(2rem, 4vw, 3.25rem)',
      '2xl': 'clamp(2.5rem, 5vw, 4rem)',
      'display': 'clamp(3rem, 6vw, 5.5rem)'
    };
    return map[size] || map['lg'];
  }

  /**
   * Applies rotation + scale directly to the transform wrapper div.
   * The wrapper is 140% × 140% of the panel, so even at scale(0.5) + rotate(-90deg)
   * the content still fills the visible area without hard clipping.
   */
  getImageTransformStyle(card: any) {
    const rotation = card.imageRotation ?? 0;
    const scale = card.imageScale ?? 1;
    return {
      'transform': `rotate(${rotation}deg) scale(${scale})`
    };
  }

  getImageStyle(card: any) {
    const fit = card.imageFit || 'cover';
    return {
      'object-fit': fit,
      'object-position': 'center center'
    };
  }
}
