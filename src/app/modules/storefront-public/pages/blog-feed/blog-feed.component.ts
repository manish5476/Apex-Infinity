// src/app/modules/storefront-public/pages/blog-feed/blog-feed.component.ts
import {
  Component, Input, computed, signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

// ---------------------------------------------------------------------------
// Config interface — mirrors SectionRegistry blog_feed schema
// ---------------------------------------------------------------------------
export interface BlogFeedConfig {
  title?: string;
  limit?: number;
  showDate?: boolean;
  showExcerpt?: boolean;
}

// ---------------------------------------------------------------------------
// Post interface — matches DataHydrationService output (or mock)
// ---------------------------------------------------------------------------
export interface BlogPost {
  id?: string;
  title: string;
  excerpt?: string;
  image?: string;
  date?: string | Date;
  category?: string;
  slug?: string;
  author?: {
    name?: string;
    avatar?: string;
  };
  readTime?: number; // minutes
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-blog-feed',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-feed.component.html',
  styleUrls: ['./blog-feed.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogFeedComponent {

  @Input() set config(v: BlogFeedConfig) { this._config.set(v ?? {}); }
  @Input() set posts(v: BlogPost[]) { this._posts.set(v ?? []); }

  private _config = signal<BlogFeedConfig>({});
  private _posts = signal<BlogPost[]>([]);

  readonly cfg = computed(() => ({
    title: this._config().title ?? 'From the Blog',
    limit: this._config().limit ?? 3,
    showDate: this._config().showDate !== false,  // default true
    showExcerpt: this._config().showExcerpt !== false   // default true
  }));

  readonly displayPosts = computed(() => {
    const live = this._posts();
    const src = live.length ? live : MOCK_POSTS;
    return src.slice(0, this.cfg().limit);
  });

  readonly featuredPost = computed(() => this.displayPosts()[0] ?? null);
  readonly sidePosts = computed(() => this.displayPosts().slice(1));

  formatDate(d: string | Date | undefined): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  trackByIndex(i: number): number { return i; }
}

// ---------------------------------------------------------------------------
// Mock posts — used in page builder preview and when API returns nothing
// ---------------------------------------------------------------------------
const MOCK_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'The Next Wave of Smart Home Technology',
    excerpt: 'From voice-activated appliances to predictive maintenance systems, discover how AI is quietly transforming the way we live at home.',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80',
    date: 'Mar 12, 2026',
    category: 'Technology',
    readTime: 5,
    slug: 'smart-home-technology'
  },
  {
    id: '2',
    title: 'Designing for Calm: A Productivity Manifesto',
    excerpt: 'Why the best tools are the ones you stop noticing — and how intentional design can give you hours back in your week.',
    image: 'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=800&q=80',
    date: 'Mar 6, 2026',
    category: 'Lifestyle',
    readTime: 7,
    slug: 'designing-for-calm'
  },
  {
    id: '3',
    title: 'Wearables in 2026: Beyond the Wrist',
    excerpt: 'Smart rings, AR glasses, and biomonitors embedded in clothing — the wearable space is exploding in every direction.',
    image: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&q=80',
    date: 'Feb 28, 2026',
    category: 'Guides',
    readTime: 6,
    slug: 'wearables-2026'
  },
  {
    id: '4',
    title: 'The Quiet Revolution in Audio',
    excerpt: 'Spatial audio, adaptive noise cancellation, and the engineers who obsess over every decibel so you don\'t have to.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    date: 'Feb 20, 2026',
    category: 'Audio',
    readTime: 4,
    slug: 'quiet-revolution-audio'
  }
];
