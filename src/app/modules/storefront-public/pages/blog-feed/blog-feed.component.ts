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
  title?:       string;
  limit?:       number;
  showDate?:    boolean;
  showExcerpt?: boolean;
}

// ---------------------------------------------------------------------------
// Post interface — matches DataHydrationService output (or mock)
// ---------------------------------------------------------------------------
export interface BlogPost {
  id?:       string;
  title:     string;
  excerpt?:  string;
  image?:    string;
  date?:     string | Date;
  category?: string;
  slug?:     string;
  author?: {
    name?:   string;
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
  styleUrls:   ['./blog-feed.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogFeedComponent {

  @Input() set config(v: BlogFeedConfig) { this._config.set(v ?? {}); }
  @Input() set posts(v: BlogPost[])     { this._posts.set(v ?? []); }

  private _config = signal<BlogFeedConfig>({});
  private _posts  = signal<BlogPost[]>([]);

  readonly cfg = computed(() => ({
    title:       this._config().title       ?? 'From the Blog',
    limit:       this._config().limit       ?? 3,
    showDate:    this._config().showDate    !== false,  // default true
    showExcerpt: this._config().showExcerpt !== false   // default true
  }));

  readonly displayPosts = computed(() => {
    const live = this._posts();
    const src  = live.length ? live : MOCK_POSTS;
    return src.slice(0, this.cfg().limit);
  });

  readonly featuredPost = computed(() => this.displayPosts()[0] ?? null);
  readonly sidePosts    = computed(() => this.displayPosts().slice(1));

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
    id:       '1',
    title:    'The Next Wave of Smart Home Technology',
    excerpt:  'From voice-activated appliances to predictive maintenance systems, discover how AI is quietly transforming the way we live at home.',
    image:    'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80',
    date:     'Mar 12, 2026',
    category: 'Technology',
    readTime: 5,
    slug:     'smart-home-technology'
  },
  {
    id:       '2',
    title:    'Designing for Calm: A Productivity Manifesto',
    excerpt:  'Why the best tools are the ones you stop noticing — and how intentional design can give you hours back in your week.',
    image:    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=800&q=80',
    date:     'Mar 6, 2026',
    category: 'Lifestyle',
    readTime: 7,
    slug:     'designing-for-calm'
  },
  {
    id:       '3',
    title:    'Wearables in 2026: Beyond the Wrist',
    excerpt:  'Smart rings, AR glasses, and biomonitors embedded in clothing — the wearable space is exploding in every direction.',
    image:    'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&q=80',
    date:     'Feb 28, 2026',
    category: 'Guides',
    readTime: 6,
    slug:     'wearables-2026'
  },
  {
    id:       '4',
    title:    'The Quiet Revolution in Audio',
    excerpt:  'Spatial audio, adaptive noise cancellation, and the engineers who obsess over every decibel so you don\'t have to.',
    image:    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    date:     'Feb 20, 2026',
    category: 'Audio',
    readTime: 4,
    slug:     'quiet-revolution-audio'
  }
];

// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-blog-feed',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   template: `
//     <section class="py-24 relative overflow-hidden bg-white">
      
//       <div class="absolute inset-0 opacity-[0.03]" *ngIf="config.backgroundImage">
//         <img [src]="config.backgroundImage" class="w-full h-full object-cover grayscale">
//       </div>

//       <div class="container mx-auto px-6 relative z-10" [class.max-w-7xl]="config.containerWidth === 'standard'">
        
//         <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 border-b border-slate-100 pb-8">
//           <div>
//             <h2 class="font-serif text-4xl font-bold text-slate-900 mb-2">{{ config.title }}</h2>
//             <p class="text-slate-500">Latest news, tips, and stories from our team.</p>
//           </div>
//           <a href="#" class="hidden md:inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-900 hover:text-rose-500 transition-colors">
//             View All Posts <i class="pi pi-arrow-right"></i>
//           </a>
//         </div>

//         <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          
//           @for (post of (posts.length ? posts : mockPosts); track $index) {
//             <article class="group cursor-pointer flex flex-col h-full">
              
//               <div class="overflow-hidden rounded-2xl mb-6 aspect-[4/3] bg-slate-100 relative">
//                 <img [src]="post.image || 'https://via.placeholder.com/600x400'" 
//                      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
//                 <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500"></div>
                
//                 @if (config.showDate) {
//                   <div class="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-900 shadow-sm">
//                     {{ post.date }}
//                   </div>
//                 }
//               </div>

//               <div class="flex-1 flex flex-col">
//                 <span class="text-rose-500 text-xs font-bold uppercase tracking-widest mb-3">{{ post.category }}</span>
//                 <h3 class="font-serif text-xl font-bold text-slate-900 mb-3 group-hover:text-rose-600 transition-colors leading-tight">
//                   {{ post.title }}
//                 </h3>
//                 <p class="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4 flex-grow">
//                   {{ post.excerpt }}
//                 </p>
//                 <span class="inline-flex items-center text-xs font-bold uppercase tracking-wider text-slate-900 group-hover:underline decoration-rose-500 underline-offset-4">
//                   Read Article
//                 </span>
//               </div>

//             </article>
//           }

//         </div>

//         <div class="mt-12 text-center md:hidden">
//           <button class="px-8 py-3 border border-slate-200 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-colors">
//             View All Posts
//           </button>
//         </div>

//       </div>
//     </section>
//   `,
//   styles: [`
//     @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Manrope:wght@400;600;700&display=swap');
//     :host { display: block; font-family: 'Manrope', sans-serif; }
//   `]
// })
// export class BlogFeedComponent {
//   @Input() config: any = {};
//   @Input() posts: any[] = []; // If data comes from API

//   // Mock data fallback because your JSON has data: null
//   mockPosts = [
//     {
//       title: 'The Future of Electronics in 2026',
//       excerpt: 'Explore the cutting-edge trends shaping the industry this year, from AI integration to sustainable tech.',
//       image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80',
//       date: 'Jan 15, 2026',
//       category: 'Technology'
//     },
//     {
//       title: 'Top 10 Gadgets for Productivity',
//       excerpt: 'Boost your workflow with these essential tools designed for modern professionals.',
//       image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80',
//       date: 'Jan 10, 2026',
//       category: 'Lifestyle'
//     },
//     {
//       title: 'How to Choose the Perfect Smart Watch',
//       excerpt: 'A comprehensive guide to finding the wearable that fits your health and fitness goals.',
//       image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=80',
//       date: 'Jan 05, 2026',
//       category: 'Guides'
//     }
//   ];
// }