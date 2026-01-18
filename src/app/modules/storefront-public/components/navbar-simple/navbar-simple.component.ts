import { Component, Input, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar-simple',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            [class.pt-6]="!isScrolled()"
            [class.pt-3]="isScrolled()">

      <nav class="pointer-events-auto relative flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        [class.w-[95%]]="!isScrolled()"
        [class.max-w-[1400px]]="!isScrolled()"
        [class.w-auto]="isScrolled()" 
        [class.min-w-[300px]]="isScrolled()"
        [class.px-10]="!isScrolled()" 
        [class.py-4]="!isScrolled()"
        [class.px-6]="isScrolled()"
        [class.py-2.5]="isScrolled()"
        style="border-radius: 999px;"
        [ngClass]="isScrolled() ? 'bg-white/90 shadow-xl border border-black/5 backdrop-blur-xl' : 'bg-transparent'">

        <div class="flex-shrink-0 flex items-center cursor-pointer select-none pr-8" [routerLink]="['/store', orgSlug]">
          @if (logo) {
            <img [src]="logo" [alt]="organization?.name" class="h-8 w-auto object-contain">
          } @else {
            <span class="font-serif text-xl font-bold tracking-tighter"
                  [class.text-slate-900]="isScrolled() || !isDarkHero"
                  [class.text-white]="!isScrolled() && isDarkHero">
              {{ organization?.name }}
            </span>
          }
        </div>

        <div class="hidden md:flex flex-1 justify-center">
          <div class="flex items-center gap-1 bg-black/5 p-1 rounded-full backdrop-blur-md border border-white/10"
               [ngClass]="isScrolled() ? 'bg-slate-100/50' : 'bg-white/10'">
            
            @for (item of config?.menuItems; track item.url) {
              <a [routerLink]="['/store', orgSlug, getLink(item.url)]"
                 [routerLinkActive]="['bg-white', 'text-black', 'shadow-sm']"
                 [routerLinkActiveOptions]="{exact: item.url === '/'}"
                 class="px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 hover:bg-white/40"
                 [class.text-slate-600]="isScrolled()"
                 [class.text-white]="!isScrolled() && isDarkHero"
                 [class.text-slate-800]="!isScrolled() && !isDarkHero">
                 {{ item.label }}
              </a>
            }
          </div>
        </div>

        <div class="flex items-center gap-3 pl-8">
          <button class="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
                  [class.text-slate-900]="isScrolled() || !isDarkHero"
                  [class.text-white]="!isScrolled() && isDarkHero">
             <i class="pi pi-search text-lg"></i>
          </button>
          
          <button class="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-transform hover:scale-105 shadow-lg">
             <i class="pi pi-shopping-bag text-sm"></i>
          </button>
        </div>

      </nav>
    </header>
  `,
  styles: []
})
export class NavbarSimpleComponent {
  @Input() config: any;
  @Input() logo: string | undefined;
  @Input() orgSlug: string = '';
  @Input() organization: any;
  
  isDarkHero = false; 
  isScrolled = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  // ✅ HELPER METHOD: Safely cleans URL for routerLink
  getLink(url: string): string {
    if (!url || url === '/') return '';
    return url.startsWith('/') ? url.substring(1) : url;
  }
}

// import { Component, Input, HostListener, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

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

//         <div class="flex-shrink-0 flex items-center cursor-pointer select-none pr-8" [routerLink]="['/store', orgSlug]">
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
//               <a [routerLink]="['/store', orgSlug, item.url === '/' ? '' : item.url.replace(/^\//, '')]"
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
// export class NavbarSimpleComponent {
//   @Input() config: any;
//   @Input() logo: string | undefined;
//   @Input() orgSlug: string = '';
//   @Input() organization: any;
//   isDarkHero = false; 
//   isScrolled = signal(false);
//   @HostListener('window:scroll', [])
//   onWindowScroll() {
//     this.isScrolled.set(window.scrollY > 50);
//   }
// }

// // import { Component, Input, HostListener, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { RouterModule } from '@angular/router';

// // @Component({
// //   selector: 'app-navbar-simple',
// //   standalone: true,
// //   imports: [CommonModule, RouterModule],
// //   template: `
// //     <header class="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
// //             [class.pt-8]="!isScrolled()"
// //             [class.pt-4]="isScrolled()">

// //       <nav 
// //         class="pointer-events-auto relative flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
// //         [class.w-[92%]]="!isScrolled()"
// //         [class.max-w-[1280px]]="!isScrolled()"
// //         [class.w-auto]="isScrolled()" 
// //         [class.px-12]="!isScrolled()" 
// //         [class.py-4]="!isScrolled()"
// //         [class.px-8]="isScrolled()"
// //         [class.py-3]="isScrolled()"
// //         [class.gap-16]="!isScrolled()"
// //         [class.gap-8]="isScrolled()"
// //         style="
// //           border-radius: 100px;
// //           backdrop-filter: blur(2rem);
// //           -webkit-backdrop-filter: blur(2rem);
// //         "
// //         [ngClass]="{
// //           'glass-classic': !isScrolled(),
// //           'glass-scrolled': isScrolled()
// //         }">

// //         <div class="flex-shrink-0 flex items-center cursor-pointer select-none" [routerLink]="['/store', orgSlug]">
// //           @if (logo || organization?.logo) {
// //             <img [src]="logo || organization?.logo" 
// //                  [alt]="organization?.name" 
// //                  class="h-8 w-auto object-contain hover:opacity-80 transition-opacity duration-300">
// //           } @else {
// //             <span class="font-serif text-2xl font-bold tracking-tight whitespace-nowrap transition-colors duration-300"
// //                   [class.text-white]="!isScrolled()"
// //                   [class.text-slate-900]="isScrolled()">
// //               {{ organization?.name || 'Store' }}
// //             </span>
// //           }
// //         </div>

// //         <div class="hidden md:flex flex-1 justify-center">
// //           <div class="flex items-center gap-2">
// //             @for (item of config?.menuItems; track item.url) {
// //               <a [routerLink]="['/store', orgSlug, item.url.startsWith('/') ? item.url.substring(1) : item.url]"
// //                  [routerLinkActive]="['bg-white/20', 'shadow-inner']"
// //                  [routerLinkActiveOptions]="{exact: item.url === '/'}"
// //                  class="relative px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 group overflow-hidden border border-transparent"
// //                  [class.text-white]="!isScrolled()"
// //                  [class.text-slate-800]="isScrolled()"
// //                  [class.hover:border-white/20]="!isScrolled()">
                
// //                  <span class="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-500 rounded-full"></span>
// //                  <span class="relative z-10">{{ item.label }}</span>
// //               </a>
// //             }
// //           </div>
// //         </div>

// //         <div class="flex items-center gap-4 min-w-fit">
          
// //           <button class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/10"
// //                   [class.text-white]="!isScrolled()"
// //                   [class.text-slate-500]="isScrolled()">
// //              <i class="pi pi-search text-lg opacity-80 group-hover:opacity-100"></i>
// //           </button>
          
// //           <button class="hidden md:flex items-center gap-3 px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-[0.15em] transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm"
// //              [class.bg-white]="!isScrolled()"
// //              [class.text-slate-900]="!isScrolled()"
// //              [class.bg-slate-900]="isScrolled()"
// //              [class.text-white]="isScrolled()">
// //              <span>Account</span> 
// //              <span class="w-1.5 h-1.5 rounded-full bg-red-500" *ngIf="false"></span> </button>

// //           <div class="md:hidden">
// //             <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
// //                     [class.text-white]="!isScrolled()" 
// //                     [class.text-slate-900]="isScrolled()">
// //               <i class="pi pi-bars text-xl"></i>
// //             </button>
// //           </div>

// //         </div>
// //       </nav>
// //     </header>
// //   `,
// //   styles: [`
// //     .font-serif { font-family: 'Playfair Display', serif; }

// //     /* CLASSIC GLASS STYLE 
// //        The "Magic" HSL color you provided + Inset White Border for 3D Glass Effect 
// //     */
// //     .glass-classic {
// //       background: hsl(0deg 43.94% 60.01% / 40%);
// //       border: 1px solid rgba(255, 255, 255, 0.15);
// //       /* Inner white glow + Soft outer shadow */
// //       box-shadow: 
// //         inset 0 0 0 1px rgba(255, 255, 255, 0.2), 
// //         0 20px 40px -10px rgba(100, 50, 50, 0.15);
// //     }

// //     /* SCROLLED / COMPACT STYLE */
// //     .glass-scrolled {
// //       background: rgba(255, 255, 255, 0.85);
// //       border: 1px solid rgba(0, 0, 0, 0.05);
// //       box-shadow: 
// //         inset 0 0 0 1px rgba(255, 255, 255, 0.5),
// //         0 10px 30px -5px rgba(0, 0, 0, 0.1);
// //     }
// //   `]
// // })
// // export class NavbarSimpleComponent {
// //   @Input() config: any;
// //   @Input() logo: string | undefined;
// //   @Input() orgSlug: string = '';
// //   @Input() organization: any;

// //   isScrolled = signal(false);

// //   @HostListener('window:scroll', [])
// //   onWindowScroll() {
// //     this.isScrolled.set(window.scrollY > 30);
// //   }
// // }

