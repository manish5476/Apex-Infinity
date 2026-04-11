// src/app/modules/storefront-public/components/navbar-simple/navbar-simple.component.ts
import {
  Component, Input, HostListener,
  signal, inject, OnInit, OnDestroy, computed
} from '@angular/core';

import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { StorefrontStateService } from '@core/services/storefront-state.service';

@Component({
  selector: 'app-navbar-simple',
  standalone: true,
  imports: [RouterModule],
  template: `
    <header
      class="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      [class.pt-6]="!isScrolled()"
      [class.pt-3]="isScrolled()">

      <nav
        class="pointer-events-auto relative flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        [class.w-[95%]]="!isScrolled()"
        [class.max-w-[1400px]]="!isScrolled()"
        [class.min-w-[320px]]="isScrolled()"
        [class.px-10]="!isScrolled()"
        [class.py-4]="!isScrolled()"
        [class.px-6]="isScrolled()"
        [class.py-2.5]="isScrolled()"
        [class.bg-white\/90]="isScrolled()"
        [class.shadow-xl]="isScrolled()"
        [class.border]="isScrolled()"
        [class.border-black\/5]="isScrolled()"
        [class.backdrop-blur-xl]="isScrolled()"
        style="border-radius: 999px;">

        <!-- Logo / Brand -->
        <div class="flex-shrink-0 flex items-center cursor-pointer select-none pr-8"
             [routerLink]="['/store', slug()]">
          @if (logo) {
            <img [src]="logo" [alt]="organization?.name" class="h-8 w-auto object-contain" />
          } @else {
            <span
              class="font-serif text-xl font-bold tracking-tighter"
              [class.text-slate-900]="isScrolled()"
              [class.text-white]="!isScrolled()">
              {{ organization?.name || 'Store' }}
            </span>
          }
        </div>

        <!-- Nav links -->
        <div class="hidden md:flex flex-1 justify-center">
          <div
            class="flex items-center gap-1 p-1 rounded-full backdrop-blur-md border"
            [class.bg-slate-100\/50]="isScrolled()"
            [class.border-slate-200\/50]="isScrolled()"
            [class.bg-white\/10]="!isScrolled()"
            [class.border-white\/10]="!isScrolled()">

            @for (item of config?.menuItems || config?.links || []; track item.url) {
              <a
                [routerLink]="navLink(item.url)"
                [routerLinkActive]="['bg-white', 'text-black', 'shadow-sm']"
                [routerLinkActiveOptions]="{ exact: item.url === '/' || item.url === '' }"
                class="px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 hover:bg-white/40"
                [class.text-slate-600]="isScrolled()"
                [class.text-white]="!isScrolled()">
                {{ item.label }}
              </a>
            }
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 pl-8">
          <button
            class="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
            [class.text-slate-900]="isScrolled()"
            [class.text-white]="!isScrolled()"
            aria-label="Search">
            <i class="pi pi-search text-lg"></i>
          </button>

          <a
            [routerLink]="['/store', slug(), 'cart']"
            class="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 text-white hover:bg-slate-700 transition-all hover:scale-105 shadow-lg"
            aria-label="Cart">
            <i class="pi pi-shopping-bag text-sm"></i>
          </a>
        </div>

      </nav>
    </header>
  `
})
export class NavbarSimpleComponent implements OnInit, OnDestroy {

  private stateService = inject(StorefrontStateService);
  private router       = inject(Router);
  private destroy$     = new Subject<void>();

  @Input() config:       any;
  @Input() logo:         string | undefined;
  @Input() organization: any;

  /** Explicit slug input — used as fallback if state service doesn't have it yet */
  @Input() set orgSlug(val: string) {
    if (val) this._inputSlug.set(val);
  }

  private _inputSlug  = signal('');
  isScrolled          = signal(false);

  /**
   * Resolved slug priority:
   * 1. StorefrontStateService (most reliable once page is loaded)
   * 2. Input from parent
   * 3. Parsed from current URL
   */
  slug = computed(() =>
    this.stateService.organization()?.slug ||
    this._inputSlug() ||
    this._parseSlugFromUrl(this.router.url)
  );

  ngOnInit(): void {
    // Keep slug fresh when navigating between stores
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e: NavigationEnd) => {
      const parsed = this._parseSlugFromUrl(e.urlAfterRedirects);
      if (parsed && !this._inputSlug()) {
        this._inputSlug.set(parsed);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 50);
  }

  /**
   * Build an absolute routerLink array for a nav item URL.
   * Strips leading slash so we never double-up on /store/slug//products.
   */
  navLink(url: string): string[] {
    if (!url || url === '/' || url === '') {
      return ['/store', this.slug()];
    }
    const clean = url.startsWith('/') ? url.slice(1) : url;
    return ['/store', this.slug(), clean];
  }

  private _parseSlugFromUrl(url: string): string {
    const match = url.match(/\/store\/([^/?#]+)/);
    return (match?.[1] && match[1] !== 'undefined') ? match[1] : '';
  }
}

// import { Component, Input, HostListener, signal, inject, OnInit, EffectRef, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router, NavigationEnd } from '@angular/router';
// import { filter } from 'rxjs/operators';
// import { StorefrontStateService } from '../../../../core/services/storefront-state.service';

// @Component({
//   selector: 'app-navbar-simple',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   template: `
//     <header class="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
//             [class.pt-6]="!isScrolled()"
//             [class.pt-3]="isScrolled()">

//       <nav class="pointer-events-auto relative flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
//         [class.w-[95%]]="!isScrolled()"
//         [class.max-w-[1400px]]="!isScrolled()"
//         [class.w-auto]="isScrolled()" 
//         [class.min-w-[300px]]="isScrolled()"
//         [class.px-10]="!isScrolled()" 
//         [class.py-4]="!isScrolled()"
//         [class.px-6]="isScrolled()"
//         [class.py-2.5]="isScrolled()"
//         style="border-radius: 999px;"
//         [ngClass]="isScrolled() ? 'bg-white/90 shadow-xl border border-black/5 backdrop-blur-xl' : 'bg-transparent'">

//         <div class="flex-shrink-0 flex items-center cursor-pointer select-none pr-8" 
//              [routerLink]="['/store', computedSlug()]">
//           @if (logo) {
//             <img [src]="logo" [alt]="organization?.name" class="h-8 w-auto object-contain">
//           } @else {
//             <span class="font-serif text-xl font-bold tracking-tighter"
//                   [class.text-slate-900]="isScrolled() || !isDarkHero"
//                   [class.text-white]="!isScrolled() && isDarkHero">
//               {{ organization?.name }}
//             </span>
//           }
//         </div>

//         <div class="hidden md:flex flex-1 justify-center">
//           <div class="flex items-center gap-1 bg-black/5 p-1 rounded-full backdrop-blur-md border border-white/10"
//                [ngClass]="isScrolled() ? 'bg-slate-100/50' : 'bg-white/10'">
            
//             @for (item of config?.menuItems; track item.url) {
//               <a [routerLink]="['/store', computedSlug(), getLink(item.url)]"
//                  [routerLinkActive]="['bg-white', 'text-black', 'shadow-sm']"
//                  [routerLinkActiveOptions]="{exact: item.url === '/'}"
//                  class="px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 hover:bg-white/40"
//                  [class.text-slate-600]="isScrolled()"
//                  [class.text-white]="!isScrolled() && isDarkHero"
//                  [class.text-slate-800]="!isScrolled() && !isDarkHero">
//                  {{ item.label }}
//               </a>
//             }
//           </div>
//         </div>

//         <div class="flex items-center gap-3 pl-8">
//           <button class="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
//                   [class.text-slate-900]="isScrolled() || !isDarkHero"
//                   [class.text-white]="!isScrolled() && isDarkHero">
//              <i class="pi pi-search text-lg"></i>
//           </button>
          
//           <button class="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-transform hover:scale-105 shadow-lg">
//              <i class="pi pi-shopping-bag text-sm"></i>
//           </button>
//         </div>

//       </nav>
//     </header>
//   `,
//   styles: []
// })
// export class NavbarSimpleComponent implements OnInit {
//   // Services
//   private stateService = inject(StorefrontStateService);
//   private router = inject(Router);

//   @Input() config: any;
//   @Input() logo: string | undefined;
  
//   // 3. Fallback Input (in case parent passes it)
//   @Input() set orgSlug(val: string) {
//     if (val) this.manualSlug.set(val);
//   }
//   @Input() organization: any;
  
//   isDarkHero = false; 
//   isScrolled = signal(false);
//   manualSlug = signal('');

//   // 4. COMPUTED SLUG: Tries State Service first, then Router URL, then Input
//   computedSlug = signal('');

//   ngOnInit() {
//     // A. Try to get slug from URL immediately (The most reliable backup)
//     this.extractSlugFromUrl(this.router.url);

//     // B. Listen to router events to keep slug fresh
//     this.router.events.pipe(
//       filter(e => e instanceof NavigationEnd)
//     ).subscribe((e: NavigationEnd) => {
//       this.extractSlugFromUrl(e.urlAfterRedirects);
//     });

//     // C. SYNC with State Service (Best Practice)
//     // Assuming your stateService has an 'orgSlug' signal or observable
//     effect(() => {
//         // If the service has the slug, update our local signal
//         // const serviceSlug = this.stateService.orgSlug(); 
//         // if(serviceSlug) this.computedSlug.set(serviceSlug);
//     }, { allowSignalWrites: true });
//   }

//   @HostListener('window:scroll', [])
//   onWindowScroll() {
//     this.isScrolled.set(window.scrollY > 50);
//   }

//   getLink(url: string): string {
//     if (!url || url === '/') return '';
//     return url.startsWith('/') ? url.substring(1) : url;
//   }

//   private extractSlugFromUrl(url: string) {
//     // Regex to find 'store/SLUG'
//     const match = url.match(/\/store\/([^\/]+)/);
//     if (match && match[1] && match[1] !== 'undefined') {
//       this.computedSlug.set(match[1]);
//     } else if (this.manualSlug()) {
//       this.computedSlug.set(this.manualSlug());
//     }
//   }
// }
