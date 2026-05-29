import { Component, Input, computed, signal, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface BlogFeedConfig {
  title?: string;
  limit?: number;
  showDate?: boolean;
  showExcerpt?: boolean;
  design?: any;
  typography?: any;
  paddingTop?: string;
  paddingBottom?: string;
}

export interface BlogPost {
  id?: string;
  title: string;
  excerpt?: string;
  image?: string;
  date?: string | Date;
  category?: string;
  slug?: string;
  readTime?: number;
}

const MOCK_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'The Next Wave of Smart Home Technology',
    excerpt: 'From voice-activated appliances to predictive maintenance systems, discover how AI is quietly transforming the way we live at home.',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80',
    date: 'Mar 12, 2026',
    category: 'Technology',
    readTime: 5
  },
  {
    id: '2',
    title: 'Designing for Calm: A Productivity Manifesto',
    excerpt: 'Why the best tools are the ones you stop noticing — and how intentional design can give you hours back in your week.',
    image: 'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=800&q=80',
    date: 'Mar 6, 2026',
    category: 'Lifestyle',
    readTime: 7
  },
  {
    id: '3',
    title: 'Wearables in 2026: Beyond the Wrist',
    excerpt: 'Smart rings, AR glasses, and biomonitors embedded in clothing — the wearable space is exploding in every direction.',
    image: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&q=80',
    date: 'Feb 28, 2026',
    category: 'Guides',
    readTime: 6
  },
  {
    id: '4',
    title: 'The Quiet Revolution in Audio',
    excerpt: 'Spatial audio, adaptive noise cancellation, and the engineers who obsess over every decibel.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    date: 'Feb 20, 2026',
    category: 'Audio',
    readTime: 4
  }
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-blog-feed',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="feed-root" [ngStyle]="rootStyles()">
      <div class="feed-container">
        <header class="feed-header">
          <div class="feed-header-left">
            <span class="feed-eyebrow" [ngStyle]="{'color': _config().typography?.headingColor || 'var(--accent-primary)'}">Journal</span>
            <h2 class="feed-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h2>
          </div>
          <a href="#" class="feed-view-all">
            <span>Read all stories</span>
            <span class="feed-view-all-arrow"><i class="pi pi-arrow-right"></i></span>
          </a>
        </header>

        @if (displayPosts().length > 0) {
          @if (displayPosts().length === 1) {
            <div class="layout-single">
              <ng-container *ngTemplateOutlet="featuredCard; context: { $implicit: displayPosts()[0] }"></ng-container>
            </div>
          }
          @else if (displayPosts().length === 2) {
            <div class="layout-two">
              @for (post of displayPosts(); track post.id ?? $index) {
                <ng-container *ngTemplateOutlet="standardCard; context: { $implicit: post }"></ng-container>
              }
            </div>
          }
          @else {
            <div class="layout-featured">
              <div class="featured-col">
                <ng-container *ngTemplateOutlet="featuredCard; context: { $implicit: featuredPost() }"></ng-container>
              </div>
              <div class="side-col">
                @for (post of sidePosts(); track post.id ?? $index; let last = $last) {
                  <ng-container *ngTemplateOutlet="sideCard; context: { $implicit: post, last: last }"></ng-container>
                }
              </div>
            </div>
          }
        } @else {
          <div class="feed-empty">
            <i class="pi pi-book"></i>
            <p>No posts yet. Connect a blog to populate this section.</p>
          </div>
        }

        <div class="feed-mobile-cta">
          <button class="mobile-view-all-btn" type="button">View All Posts</button>
        </div>
      </div>
    </section>

    <ng-template #featuredCard let-post>
      <article class="card-featured" tabindex="0" role="button">
        <div class="card-featured-image">
          <img [src]="post.image" [alt]="post.title" loading="lazy" class="img-cover" />
          <div class="card-featured-gradient"></div>
        </div>
        <div class="card-featured-chips">
          @if (post.category) { <span class="chip chip-cat">{{ post.category }}</span> }
          @if (post.readTime) { <span class="chip chip-time"><i class="pi pi-clock"></i> {{ post.readTime }} min</span> }
        </div>
        @if (cfg().showDate && post.date) { <div class="card-date-pill">{{ formatDate(post.date) }}</div> }
        <div class="card-featured-content">
          <h3 class="card-featured-title" [ngStyle]="headingStyle(true)">{{ post.title }}</h3>
          @if (cfg().showExcerpt && post.excerpt) { <p class="card-featured-excerpt" [ngStyle]="bodyStyle(true)">{{ post.excerpt }}</p> }
          <span class="card-cta-text">Read Story <i class="pi pi-arrow-right text-[10px]"></i></span>
        </div>
      </article>
    </ng-template>

    <ng-template #standardCard let-post>
      <article class="card-standard" tabindex="0" role="button">
        <div class="card-standard-image">
          <img [src]="post.image" [alt]="post.title" loading="lazy" class="img-cover" />
          <div class="card-standard-overlay"></div>
          @if (post.category) { <span class="card-cat-badge">{{ post.category }}</span> }
        </div>
        <div class="card-standard-body">
          @if (cfg().showDate && post.date) { 
            <span class="card-meta">{{ formatDate(post.date) }} @if(post.readTime){ · {{ post.readTime }} min read }</span> 
          }
          <h3 class="card-standard-title" [ngStyle]="headingStyle()">{{ post.title }}</h3>
          @if (cfg().showExcerpt && post.excerpt) { <p class="card-standard-excerpt" [ngStyle]="bodyStyle()">{{ post.excerpt }}</p> }
          <span class="card-read-more">Read Story</span>
        </div>
      </article>
    </ng-template>

    <ng-template #sideCard let-post let-last="last">
      <article class="card-side" [class.card-side-last]="last" tabindex="0" role="button">
        <div class="card-side-image">
          <img [src]="post.image" [alt]="post.title" loading="lazy" class="img-cover" />
        </div>
        <div class="card-side-body">
          @if (post.category) { <span class="card-side-cat" [ngStyle]="{'color': _config().typography?.headingColor || 'var(--accent-primary)'}">{{ post.category }}</span> }
          <h4 class="card-side-title" [ngStyle]="headingStyle()">{{ post.title }}</h4>
          @if (cfg().showDate && post.date) { <span class="card-side-meta">{{ formatDate(post.date) }}</span> }
        </div>
        <div class="card-side-arrow"><i class="pi pi-arrow-right"></i></div>
      </article>
    </ng-template>
  `,
  styles: [`
    :host { display: block; }
    
    .feed-root { position: relative; overflow: hidden; width: 100%; }
    .feed-container { max-width: 1340px; margin: 0 auto; padding: 0 28px; position: relative; z-index: 1; }
    
    .feed-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 52px; padding-bottom: 28px; border-bottom: 1px solid var(--border-primary); }
    .feed-header-left { flex: 1; }
    .feed-eyebrow { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 8px; font-family: var(--font-mono); }
    .feed-title { margin: 0; font-size: clamp(28px, 4vw, 44px); font-weight: 700; line-height: 1.1; letter-spacing: -0.025em; }
    
    .feed-view-all { display: none; align-items: center; gap: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-secondary); text-decoration: none; flex-shrink: 0; transition: color 0.2s ease; }
    @media (min-width: 768px) { .feed-view-all { display: flex; } }
    .feed-view-all:hover { color: var(--text-primary); }
    .feed-view-all:hover .feed-view-all-arrow { transform: translateX(4px); border-color: var(--text-primary); }
    .feed-view-all-arrow { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border-primary); display: flex; align-items: center; justify-content: center; transition: all 0.25s ease; i { font-size: 10px; } }

    .layout-single { max-width: 860px; margin: 0 auto; }
    .layout-two { display: grid; grid-template-columns: 1fr; gap: 24px; }
    @media (min-width: 768px) { .layout-two { grid-template-columns: repeat(2, 1fr); } }
    .layout-featured { display: grid; grid-template-columns: 1fr; gap: 24px; }
    @media (min-width: 900px) { .layout-featured { grid-template-columns: 1.35fr 1fr; align-items: start; } }
    .featured-col { height: 100%; }
    .side-col { display: flex; flex-direction: column; }

    .card-featured { position: relative; height: 540px; border-radius: var(--ui-border-radius-lg, 20px); overflow: hidden; cursor: pointer; display: block; border: 1px solid var(--border-primary); transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease, border-color 0.3s ease; }
    .card-featured:hover { transform: translateY(-5px); box-shadow: var(--shadow-2xl); border-color: var(--border-secondary); }
    .card-featured:hover .img-cover { transform: scale(1.04); }
    .card-featured:hover .card-featured-gradient { opacity: 1; }
    .card-featured:hover .card-cta-text { gap: 8px; color: #fff; }
    @media (max-width: 899px) { .card-featured { height: 440px; } }

    .card-featured-image { position: absolute; inset: 0; }
    .img-cover { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
    .card-featured-gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 70%, transparent 100%); opacity: 0.88; transition: opacity 0.3s ease; }
    
    .card-featured-chips { position: absolute; top: 18px; left: 18px; display: flex; gap: 6px; z-index: 10; }
    .chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; backdrop-filter: blur(8px); font-family: var(--font-mono); }
    .chip-cat { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); color: #fff; }
    .chip-time { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); i { font-size: 8px; } }
    .card-date-pill { position: absolute; top: 18px; right: 18px; z-index: 10; font-family: var(--font-mono); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: rgba(255,255,255,0.7); background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); }
    
    .card-featured-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 28px 28px 24px; z-index: 10; }
    .card-featured-title { margin: 0 0 10px; font-size: clamp(20px, 2.5vw, 28px); font-weight: 700; line-height: 1.25; letter-spacing: -0.02em; }
    .card-featured-excerpt { margin: 0 0 16px; font-size: 14px; line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-cta-text { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.75); font-family: var(--font-mono); transition: all 0.2s ease; }

    .card-standard { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius, 16px); overflow: hidden; cursor: pointer; display: flex; flex-direction: column; transition: transform 0.35s ease, border-color 0.2s ease; box-shadow: var(--shadow-sm); }
    .card-standard:hover { transform: translateY(-4px); border-color: var(--border-secondary); box-shadow: var(--shadow-lg); }
    .card-standard:hover .img-cover { transform: scale(1.05); }
    .card-standard:hover .card-read-more { letter-spacing: 2.5px; color: var(--accent-primary); }
    .card-standard-image { position: relative; aspect-ratio: 4 / 3; overflow: hidden; }
    .card-standard-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.05); transition: background 0.3s ease; }
    .card-cat-badge { position: absolute; bottom: 12px; left: 12px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #fff; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); padding: 3px 8px; border-radius: 4px; font-family: var(--font-mono); }
    
    .card-standard-body { padding: 20px; display: flex; flex-direction: column; flex: 1; }
    .card-meta { font-size: 10px; font-weight: 600; color: var(--text-tertiary); font-family: var(--font-mono); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .card-standard-title { margin: 0 0 10px; font-size: 18px; font-weight: 700; line-height: 1.3; letter-spacing: -0.015em; }
    .card-standard-excerpt { margin: 0 0 16px; font-size: 13px; line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }
    .card-read-more { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.8px; color: var(--text-secondary); font-family: var(--font-mono); transition: all 0.25s ease; margin-top: auto; }

    .card-side { display: flex; align-items: center; gap: 16px; padding: 20px 0; border-bottom: 1px solid var(--border-primary); cursor: pointer; transition: opacity 0.2s ease; }
    .card-side.card-side-last { border-bottom: none; }
    .card-side:hover { opacity: 0.82; }
    .card-side:hover .card-side-arrow { transform: translateX(3px); color: var(--accent-primary); }
    .card-side:hover .img-cover { transform: scale(1.06); }
    @media (min-width: 900px) { .card-side:first-child { padding-top: 0; } }
    
    .card-side-image { width: 96px; height: 72px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: var(--bg-secondary); }
    .card-side-body { flex: 1; min-width: 0; }
    .card-side-cat { display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-family: var(--font-mono); margin-bottom: 5px; }
    .card-side-title { margin: 0 0 5px; font-size: 14px; font-weight: 700; line-height: 1.3; letter-spacing: -0.01em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-side-meta { font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono); }
    .card-side-arrow { color: var(--text-secondary); flex-shrink: 0; transition: transform 0.25s ease, color 0.2s ease; i { font-size: 11px; } }

    .feed-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: var(--text-tertiary); text-align: center; gap: 12px; border: 1px dashed var(--border-primary); border-radius: 16px; i { font-size: 2rem; } p { font-size: 13px; margin: 0; } }
    .feed-mobile-cta { display: flex; justify-content: center; margin-top: 40px; }
    @media (min-width: 768px) { .feed-mobile-cta { display: none; } }
    .mobile-view-all-btn { padding: 12px 32px; border: 1px solid var(--border-primary); border-radius: 100px; background: transparent; color: var(--text-secondary); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer; font-family: var(--font-mono); transition: all 0.2s ease; }
    .mobile-view-all-btn:hover { background: var(--text-primary); color: var(--bg-primary); border-color: var(--text-primary); }
  `]
})
export class BlogFeedComponent {
  @Input() set config(v: BlogFeedConfig) { this._config.set(v ?? {}); }
  @Input() set posts(v: BlogPost[]) { this._posts.set(v ?? []); }

  readonly _config = signal<BlogFeedConfig>({});
  readonly _posts = signal<BlogPost[]>([]);

  readonly cfg = computed(() => ({
    title: this._config().title ?? 'From the Blog',
    limit: this._config().limit ?? 3,
    showDate: this._config().showDate !== false,
    showExcerpt: this._config().showExcerpt !== false
  }));

  readonly displayPosts = computed(() => {
    const live = this._posts();
    const src = live.length ? live : MOCK_POSTS;
    return src.slice(0, this.cfg().limit);
  });

  readonly featuredPost = computed(() => this.displayPosts()[0] ?? null);
  readonly sidePosts = computed(() => this.displayPosts().slice(1));

  // Dynamic Styles Mapping
  readonly rootStyles = computed(() => ({
    'background-color': this._config().design?.customBackground || 'var(--bg-primary)',
    'padding-top': `var(--spacing-${this._config().paddingTop || '4xl'})`,
    'padding-bottom': `var(--spacing-${this._config().paddingBottom || '4xl'})`
  }));

  // Typography for standard elements. Forces white text if rendered over the dark image overlay.
  headingStyle(isImageOverlay = false) {
    return {
      'font-family': this._config().typography?.headingFont || 'var(--font-heading)',
      'color': isImageOverlay ? '#ffffff' : (this._config().typography?.headingColor || 'var(--text-primary)')
    };
  }

  bodyStyle(isImageOverlay = false) {
    return {
      'font-family': this._config().typography?.bodyFont || 'var(--font-body)',
      'color': isImageOverlay ? 'rgba(255, 255, 255, 0.8)' : (this._config().typography?.bodyColor || 'var(--text-secondary)')
    };
  }

  formatDate(d: string | Date | undefined): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}// // src/app/modules/storefront-public/pages/blog-feed/blog-feed.component.ts
