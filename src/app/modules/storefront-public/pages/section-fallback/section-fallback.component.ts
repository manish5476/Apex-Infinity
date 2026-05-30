import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  asRecord,
  asString,
  bodyStyle,
  headingStyle,
  normalizeDesign,
  normalizeTypography,
  resolveSectionSubtitle,
  resolveSectionTitle,
  sectionPaddingStyles,
} from '../../dynamic-page/section-config.utils';

@Component({
  selector: 'app-section-fallback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="fallback-section" [ngStyle]="sectionStyle()">
      <div class="fallback-inner" [class.has-media]="mediaItems().length">
        <div class="fallback-copy" [style.text-align]="typography().alignment">
          @if (title()) {
            <h2 [ngStyle]="headingStyleMap()">{{ title() }}</h2>
          }
          @if (subtitle()) {
            <p [ngStyle]="bodyStyleMap()">{{ subtitle() }}</p>
          }
        </div>

        @if (mediaItems().length) {
          <div class="fallback-media-grid">
            @for (item of mediaItems(); track item.src + item.title) {
              <article class="fallback-media-card">
                <img [src]="item.src" [alt]="item.title || title() || 'Section image'" loading="lazy" />
                @if (item.title || item.caption) {
                  <div>
                    @if (item.title) { <h3>{{ item.title }}</h3> }
                    @if (item.caption) { <p>{{ item.caption }}</p> }
                  </div>
                }
              </article>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .fallback-section {
      color: var(--theme-text-primary, var(--text-primary, #111827));
      background: var(--theme-bg, var(--bg-primary, #ffffff));
    }

    .fallback-inner {
      width: min(100% - 2rem, 1180px);
      margin: 0 auto;
      display: grid;
      gap: clamp(1.25rem, 4vw, 2.5rem);
    }

    .fallback-inner.has-media {
      grid-template-columns: minmax(0, 0.72fr) minmax(0, 1.28fr);
      align-items: center;
    }

    .fallback-copy h2 {
      margin: 0;
      font-size: clamp(1.8rem, 4vw, 3.2rem);
      line-height: 1.08;
      letter-spacing: 0;
    }

    .fallback-copy p {
      max-width: 62ch;
      margin: 0.85rem 0 0;
      font-size: clamp(0.98rem, 1.6vw, 1.12rem);
      line-height: 1.7;
    }

    .fallback-media-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
      gap: 1rem;
    }

    .fallback-media-card {
      overflow: hidden;
      border-radius: var(--apx-radius-md, 0.75rem);
      background: color-mix(in srgb, var(--theme-text-primary, #111827) 4%, transparent);
      border: 1px solid color-mix(in srgb, var(--theme-text-primary, #111827) 10%, transparent);
    }

    .fallback-media-card img {
      display: block;
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      background: var(--theme-bg-muted, #f3f4f6);
    }

    .fallback-media-card div {
      padding: 0.85rem;
    }

    .fallback-media-card h3,
    .fallback-media-card p {
      margin: 0;
    }

    .fallback-media-card h3 {
      font-size: 0.95rem;
      line-height: 1.35;
    }

    .fallback-media-card p {
      margin-top: 0.3rem;
      font-size: 0.85rem;
      line-height: 1.5;
      color: var(--theme-text-secondary, var(--text-secondary, #4b5563));
    }

    @media (max-width: 760px) {
      .fallback-inner,
      .fallback-inner.has-media {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SectionFallbackComponent {
  @Input() config: unknown = {};
  @Input() data: unknown = null;
  @Input() sectionType = 'section';

  title(): string {
    return resolveSectionTitle(this.config, this.formatType(this.sectionType));
  }

  subtitle(): string {
    return resolveSectionSubtitle(this.config, '');
  }

  typography() {
    return normalizeTypography(this.config);
  }

  headingStyleMap() {
    return headingStyle(this.config);
  }

  bodyStyleMap() {
    return bodyStyle(this.config);
  }

  sectionStyle(): Record<string, string> {
    const design = normalizeDesign(this.config);
    return {
      ...sectionPaddingStyles(this.config, 'md'),
      ...(design.customBackground ? { background: design.customBackground } : {}),
    };
  }

  mediaItems(): Array<{ src: string; title?: string; caption?: string }> {
    const cfg = asRecord(this.config);
    const candidates = [
      asString(cfg['mainImage']),
      asString(cfg['secondaryImage']),
      asString(cfg['backgroundImage']),
      asString(cfg['image']),
      asString(cfg['beforeImage']),
      asString(cfg['afterImage']),
    ].filter((src): src is string => Boolean(src));

    for (const key of ['items', 'images', 'slides', 'cards', 'layers', 'hotspots']) {
      const list = cfg[key];
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        const record = asRecord(item);
        const src = asString(record['image']) ?? asString(record['src']) ?? asString(record['url']);
        if (src) {
          candidates.push(src);
        }
      }
    }

    return Array.from(new Set(candidates)).slice(0, 8).map(src => ({ src }));
  }

  private formatType(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }
}
