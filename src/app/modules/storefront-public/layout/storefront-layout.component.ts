import { 
  Component, 
  inject, 
  computed, 
  effect, 
  viewChild, 
  signal, 
  OnInit,
  OnDestroy,
  ElementRef, 
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, filter, takeUntil } from 'rxjs';

// ✅ PrimeNG Imports
import { PopoverModule } from 'primeng/popover';
import { Popover } from 'primeng/popover';
import { SliderModule } from 'primeng/slider';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';

// ✅ Services (Assumed paths based on context)
import { StorefrontStateService } from '../../../core/services/storefront-state.service';
import { ThemeService, ThemeSettings } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';

// ✅ Components
import { NavbarSimpleComponent } from '../components/navbar-simple/navbar-simple.component';
import { FooterSimpleComponent } from '../components/footer-simple/footer-simple.component';
import { LayoutService } from '../../../projectLayout/layout.service';
import { AuthService } from '../../auth/services/auth-service';

// ✅ Interfaces
export interface Theme {
  name: string;
  id: string;
  color: string;
  gradient: string;
  category: string;
  description: string;
}

export interface ThemeGroup {
  category: string;
  themes: Theme[];
}

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    NavbarSimpleComponent, 
    FooterSimpleComponent,
    PopoverModule,
    SliderModule,
    TooltipModule,
    BadgeModule
  ],
  templateUrl: './storefront-layout.component.html',
  styleUrls: ['./storefront-layout.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StorefrontLayoutComponent implements OnInit, OnDestroy {
  // Dependency Injection
  public state = inject(StorefrontStateService);
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private layout = inject(LayoutService);
  private router = inject(Router);
  
  private destroy$ = new Subject<void>();

  // ✅ ViewChildren using Signal queries (Angular 18+)
  settingsPopover = viewChild<Popover>('settingsPopover');

  // ✅ State Signals
  activeTab = signal<'themes' | 'settings'>('themes');
  currentUser = signal<any>(null);
  recentNotifications = signal<any[]>([]);
  
  // ✅ Theme State
  isDarkMode = signal(false);
  activeThemeId = signal('auto-theme');
  textScale = signal(100);
  themeGroups = signal<ThemeGroup[]>([]);

  // ✅ Active Theme Computed (Merges Store Default + User Selection)
  activeThemeStyle = computed(() => {
    // 1. If user selected a specific theme from the list, use that
    const selectedId = this.activeThemeId();
    const selectedTheme = this.allThemes.find(t => t.id === selectedId);

    if (selectedTheme && selectedId !== 'auto-theme') {
      return {
        '--primary': selectedTheme.color,
        '--bg-page': this.isDarkMode() ? '#0f172a' : '#FDFCF8',
        '--glass-border': this.isDarkMode() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
      };
    }

    // 2. Fallback to Storefront State (Merchant Config)
    const storeTheme = this.state.page()?.theme;
    return {
      '--primary': storeTheme?.primaryColor || '#000000',
      '--secondary': storeTheme?.secondaryColor || '#666666',
      '--bg-page': storeTheme?.backgroundColor || (this.isDarkMode() ? '#0f172a' : '#FDFCF8'),
      '--glass-border': 'rgba(255,255,255,0.2)'
    };
  });

  constructor() {
    // Scroll to top on nav
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });

    // Effect to apply Text Scale to Root
    effect(() => {
      document.documentElement.style.fontSize = `${this.textScale()}%`;
    });
  }

  ngOnInit() {
    this.organizeThemes();
    
    // Auth Subscription
    // this.authService.currentUser$
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(u => this.currentUser.set(u));

    // // Notifications Subscription
    // this.notificationService.notifications$
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(n => {
    //     const unread = n.filter(x => !x.isRead);
    //     this.recentNotifications.set(unread.length ? unread : []);
    //   });

    // Theme Settings Subscription
    this.themeService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((s: ThemeSettings) => {
        this.isDarkMode.set(s.isDarkMode);
        this.activeThemeId.set(s.isDarkMode ? 'theme-dark' : (s.lightThemeClass || 'theme-light'));
        if (s.textScale) this.textScale.set(s.textScale);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Helper: Is Home Page?
  isHomePage(): boolean {
    const slug = this.state.organization()?.slug;
    return this.router.url.endsWith(`/${slug}`) || this.router.url.endsWith('/home');
  }

  // --- THEME LOGIC ---

  organizeThemes() {
    const categoryMapping: Record<string, string> = {
      'core': 'Essentials',
      'professional': 'Professional',
      'minimal': 'Minimalist',
      'colorful': 'Vibrant',
      'luxury': 'Luxury',
      'modern': 'Modern',
    };

    const categories = [...new Set(this.allThemes.map(t => t.category))];

    const groups = categories.map(cat => ({
      category: categoryMapping[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
      themes: this.allThemes.filter(t => t.category === cat)
    }));

    this.themeGroups.set(groups);
  }

  selectTheme(id: string) {
    if (id === 'theme-dark') {
      this.themeService.setDarkMode(true);
    } else if (id === 'auto-theme') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.themeService.setDarkMode(prefersDark);
      this.activeThemeId.set(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      this.themeService.setLightTheme(id);
      this.themeService.setDarkMode(false);
      this.activeThemeId.set(id);
    }
  }

  toggleDarkModeSwitch() {
    this.themeService.setDarkMode(!this.isDarkMode());
  }

  updateTextScale(event: any) {
    // PrimeNG Slider emits { originalEvent, value }
    const val = event.value || event; 
    this.themeService.setTextScale(val);
  }

  resetToDefault() {
    this.selectTheme('auto-theme');
    this.textScale.set(100);
  }

  // --- DATA ---
  allThemes: Theme[] = [
    // --- CORE THEMES ---
    { name: "Auto", id: "auto-theme", color: "#2563eb", gradient: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)", category: "core", description: "System preference" },
    { name: "Light", id: "theme-light", color: "#64748b", gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", category: "core", description: "Clean data-optimized" },
    { name: "Dark", id: "theme-dark", color: "#0f172a", gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", category: "core", description: "High-contrast dark" },
    
    // --- PROFESSIONAL ---
    { name: "Titanium", id: "theme-titanium", color: "#0891b2", gradient: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)", category: "professional", description: "Industrial Cyan" },
    { name: "Cobalt", id: "theme-cobalt-steel", color: "#0284c7", gradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", category: "professional", description: "Corporate Navy" },

    // --- COLORFUL ---
    { name: "Rose", id: "theme-rose", color: "#e11d48", gradient: "linear-gradient(135deg, #be123c 0%, #e11d48 100%)", category: "colorful", description: "Executive Crimson" },
    { name: "Sunset", id: "theme-sunset", color: "#ea580c", gradient: "linear-gradient(135deg, #ea580c 0%, #db2777 100%)", category: "colorful", description: "Golden Hour Glow" },
    { name: "Nebula", id: "theme-nebula", color: "#d946ef", gradient: "linear-gradient(to right, #ec4899, #8b5cf6)", category: "colorful", description: "Electric Neon" },

    // --- LUXURY ---
    { name: "Luxury", id: "theme-luxury", color: "#d4af37", gradient: "linear-gradient(135deg, #d4af37 0%, #b45309 100%)", category: "luxury", description: "Sharp Onyx & Gold" },
    { name: "Emerald", id: "theme-emerald-regal", color: "#059669", gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)", category: "luxury", description: "Wealth Green" },

    // --- MODERN ---
    { name: "Material", id: "theme-material-you", color: "#c026d3", gradient: "linear-gradient(135deg, #c026d3 0%, #a21caf 100%)", category: "modern", description: "Android Orchid" },
    { name: "Oceanic", id: "theme-oceanic", color: "#1CB5E0", gradient: "linear-gradient(to right, #1CB5E0, #000046)", category: "modern", description: "Cyan to Deep Blue" }
  ];
}

// import { Component, inject, computed, effect, ElementRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router, NavigationEnd } from '@angular/router';
// import { StorefrontStateService } from '../../../core/services/storefront-state.service';
// import { NavbarSimpleComponent } from '../components/navbar-simple/navbar-simple.component';
// import { FooterSimpleComponent } from '../components/footer-simple/footer-simple.component';
// import { filter } from 'rxjs';

// @Component({
//   selector: 'app-storefront-layout',
//   standalone: true,
//   imports: [CommonModule, RouterModule, NavbarSimpleComponent, FooterSimpleComponent],
//   template: `
//     <div class="min-h-screen w-full flex flex-col font-sans relative bg-slate-50 text-slate-900 selection:bg-primary-200 selection:text-primary-900"
//          [style.--primary]="theme()?.primaryColor"
//          [style.--secondary]="theme()?.secondaryColor"
//          [style.--bg-page]="theme()?.backgroundColor">

//       <div class="fixed inset-0 pointer-events-none z-0">
//         <div class="absolute inset-0 opacity-[0.03]" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise%22)%22 opacity=%221%22/%3E%3C/svg%3E')"></div>
//         <div class="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-[var(--primary)] opacity-10 blur-[120px]"></div>
//         <div class="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[var(--secondary)] opacity-10 blur-[100px]"></div>
//       </div>

//       @if (state.layout(); as layout) {
//         @for (section of layout.header; track section.id) {
//           @if (section.type === 'navbar_simple') {
//             <app-navbar-simple 
//               [config]="section.config" 
//               [organization]="state.organization()"
//               [logo]="state.organization()?.logo"
//               [orgSlug]="state.organization()?.slug"> 
//             </app-navbar-simple>
//           }
//         }
//       }

//       <main class="relative z-10 flex-grow w-full flex flex-col transition-all duration-700">
        
//         <div class="w-full transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
//              [ngClass]="{
//                'pt-24 px-0 pb-0': !isHomePage(), 
//                'pt-28 px-4 pb-4 md:px-6 md:pb-6': isHomePage()
//              }">
             
//           <div class="w-full relative overflow-hidden bg-[var(--bg-page)] shadow-sm transition-all duration-1000"
//                [ngClass]="{
//                  'min-h-[90vh] rounded-[2.5rem] md:rounded-[3.5rem]': isHomePage(),
//                  'min-h-screen': !isHomePage()
//                }">
            
//             <router-outlet></router-outlet>

//             <div *ngIf="isHomePage()" class="absolute bottom-0 left-0 w-full h-16 md:h-24 bg-gradient-to-t from-[var(--bg-page)] to-transparent pointer-events-none"></div>
//           </div>

//         </div>
//       </main>

//       <div class="relative z-0 mt-auto">
//         @if (state.layout(); as layout) {
//           @for (section of layout.footer; track section.id) {
//             @if (section.type === 'footer_simple') {
//               <app-footer-simple [config]="section.config" [organization]="state.organization()"></app-footer-simple>
//             }
//           }
//         }
//       </div>

//       <div class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto">
//         <div class="glass-dock px-6 py-3 rounded-full flex items-center gap-8 shadow-2xl border border-white/40">
//            <a [routerLink]="['/store', state.organization()?.slug]" routerLinkActive="text-[var(--primary)]" class="text-slate-400 hover:text-slate-900"><i class="pi pi-home text-xl"></i></a>
//            <a [routerLink]="['/store', state.organization()?.slug, 'products']" routerLinkActive="text-[var(--primary)]" class="text-slate-400 hover:text-slate-900"><i class="pi pi-search text-xl"></i></a>
//            <a [routerLink]="['/store', state.organization()?.slug, 'cart']" routerLinkActive="text-[var(--primary)]" class="relative text-slate-400 hover:text-slate-900">
//              <i class="pi pi-shopping-bag text-xl"></i>
//              <span class="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-[var(--primary)] rounded-full border-2 border-white"></span>
//            </a>
//         </div>
//       </div>

//     </div>
//   `,
//   styles: [`
//     :host { display: block; }
//     .glass-dock {
//       background: rgba(255, 255, 255, 0.9);
//       backdrop-filter: blur(20px);
//       -webkit-backdrop-filter: blur(20px);
//       box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
//     }
//   `]
// })
// export class StorefrontLayoutComponent {
//   public state = inject(StorefrontStateService);
//   private router = inject(Router);
  
//   // Computed Theme from JSON
//   theme = computed(() => this.state.page()?.theme || {
//     primaryColor: '#000000',
//     secondaryColor: '#666666',
//     backgroundColor: '#FDFCF8'
//   });

//   constructor() {
//     this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
//       window.scrollTo({ top: 0, behavior: 'instant' });
//     });
//   }

//   isHomePage(): boolean {
//     const slug = this.state.organization()?.slug;
//     // Check if we are on the base route or /home
//     return this.router.url.endsWith(`/${slug}`) || this.router.url.endsWith('/home');
//   }
// }

// // import { Component, inject } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { RouterModule, Router, NavigationEnd } from '@angular/router';
// // import { StorefrontStateService } from '../../../core/services/storefront-state.service';
// // import { NavbarSimpleComponent } from '../components/navbar-simple/navbar-simple.component';
// // import { FooterSimpleComponent } from '../components/footer-simple/footer-simple.component';
// // import { filter } from 'rxjs';
// // import { trigger, transition, style, animate } from '@angular/animations';

// // @Component({
// //   selector: 'app-storefront-layout',
// //   standalone: true,
// //   imports: [CommonModule, RouterModule, NavbarSimpleComponent, FooterSimpleComponent],
// //   template: `
// //     <div class="min-h-screen flex flex-col font-sans relative overflow-x-hidden bg-[#FDFCF8] text-slate-900 selection:bg-rose-200 selection:text-rose-900">
      
// //       <div class="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" 
// //            style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise%22)%22 opacity=%221%22/%3E%3C/svg%3E')">
// //       </div>
      
// //       <div class="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-rose-400/10 blur-[120px] pointer-events-none z-0"></div>
// //       <div class="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-400/10 blur-[100px] pointer-events-none z-0"></div>

// //       @if (state.layout(); as layout) {
// //         @for (section of layout.header; track section.id) {
// //           @if (section.type === 'navbar_simple') {
// //             <div class="fixed top-0 left-0 right-0 z-50">
// //               <app-navbar-simple 
// //                 [config]="section.config" 
// //                 [organization]="state.organization()"
// //                 [logo]="state.organization()?.logo"
// //                 [orgSlug]="state.organization()?.slug"> 
// //               </app-navbar-simple>
// //             </div>
// //           }
// //         }
// //       }

// //       <main class="flex-grow w-full relative z-10 flex flex-col pt-28 md:pt-32 transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)]">
        
// //         <div class="flex-grow w-full transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
// //              [ngClass]="{
// //                'px-3 md:px-6 pb-6': isHomePage(), 
// //                'px-0': !isHomePage()
// //              }">
             
// //              <div class="w-full h-full relative transition-all duration-700"
// //                   [ngClass]="{
// //                     'rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white': isHomePage(),
// //                     'min-h-[85vh]': isHomePage()
// //                   }">
                  
// //                   <router-outlet></router-outlet>
                  
// //              </div>
// //         </div>

// //       </main>

// //       <div class="relative z-10 mt-auto">
// //         @if (state.layout(); as layout) {
// //           @for (section of layout.footer; track section.id) {
// //             @if (section.type === 'footer_simple') {
// //               <app-footer-simple [config]="section.config"></app-footer-simple>
// //             }
// //           }
// //         }
// //       </div>

// //       <div class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto">
// //         <div class="glass-dock px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl border border-white/40">
// //            <a [routerLink]="['/store', state.organization()?.slug]" routerLinkActive="text-rose-600" class="text-slate-500 hover:text-slate-900 transition-colors">
// //              <i class="pi pi-home text-xl"></i>
// //            </a>
// //            <a [routerLink]="['/store', state.organization()?.slug, 'products']" routerLinkActive="text-rose-600" class="text-slate-500 hover:text-slate-900 transition-colors">
// //              <i class="pi pi-th-large text-xl"></i>
// //            </a>
// //            <a [routerLink]="['/store', state.organization()?.slug, 'cart']" routerLinkActive="text-rose-600" class="relative text-slate-500 hover:text-slate-900 transition-colors">
// //              <i class="pi pi-shopping-bag text-xl"></i>
// //              <span class="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
// //            </a>
// //         </div>
// //       </div>

// //     </div>
// //   `,
// //   styles: [`
// //     :host {
// //       display: block;
// //       -webkit-font-smoothing: antialiased;
// //       -moz-osx-font-smoothing: grayscale;
// //     }

// //     .glass-dock {
// //       background: rgba(255, 255, 255, 0.85);
// //       backdrop-filter: blur(16px);
// //       -webkit-backdrop-filter: blur(16px);
// //       box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);
// //     }
// //   `],
// //   animations: [
// //     trigger('routeAnimations', [
// //       transition('* <=> *', [
// //         style({ opacity: 0, transform: 'translateY(15px)' }),
// //         animate('500ms cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
// //       ])
// //     ])
// //   ]
// // })
// // export class StorefrontLayoutComponent {
// //   public state = inject(StorefrontStateService);
// //   private router = inject(Router);
  
// //   currentUrl = '';

// //   constructor() {
// //     this.router.events.pipe(
// //       filter(event => event instanceof NavigationEnd)
// //     ).subscribe((event: any) => {
// //       this.currentUrl = event.url;
// //       window.scrollTo({ top: 0, behavior: 'smooth' });
// //     });
// //   }

// //   isHomePage(): boolean {
// //     const slug = this.state.organization()?.slug;
// //     if (!slug) return false;
// //     return this.router.url.includes(`/store/${slug}/home`) || 
// //            this.router.url === `/store/${slug}`;
// //   }
// // }