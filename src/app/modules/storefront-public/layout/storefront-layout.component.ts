import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { StorefrontStateService } from '../../../core/services/storefront-state.service';
import { NavbarSimpleComponent } from '../components/navbar-simple/navbar-simple.component';
import { FooterSimpleComponent } from '../components/footer-simple/footer-simple.component';
import { filter } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarSimpleComponent, FooterSimpleComponent],
  template: `
    <div class="min-h-screen flex flex-col font-sans relative overflow-x-hidden bg-[#FDFCF8] text-slate-900 selection:bg-rose-200 selection:text-rose-900">
      
      <div class="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" 
           style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise%22)%22 opacity=%221%22/%3E%3C/svg%3E')">
      </div>
      
      <div class="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-rose-400/10 blur-[120px] pointer-events-none z-0"></div>
      <div class="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-400/10 blur-[100px] pointer-events-none z-0"></div>

      @if (state.layout(); as layout) {
        @for (section of layout.header; track section.id) {
          @if (section.type === 'navbar_simple') {
            <div class="fixed top-0 left-0 right-0 z-50">
              <app-navbar-simple 
                [config]="section.config" 
                [organization]="state.organization()"
                [logo]="state.organization()?.logo"
                [orgSlug]="state.organization()?.slug"> 
              </app-navbar-simple>
            </div>
          }
        }
      }

      <main class="flex-grow w-full relative z-10 flex flex-col pt-28 md:pt-32 transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)]">
        
        <div class="flex-grow w-full transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
             [ngClass]="{
               'px-3 md:px-6 pb-6': isHomePage(), 
               'px-0': !isHomePage()
             }">
             
             <div class="w-full h-full relative transition-all duration-700"
                  [ngClass]="{
                    'rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white': isHomePage(),
                    'min-h-[85vh]': isHomePage()
                  }">
                  
                  <router-outlet></router-outlet>
                  
             </div>
        </div>

      </main>

      <div class="relative z-10 mt-auto">
        @if (state.layout(); as layout) {
          @for (section of layout.footer; track section.id) {
            @if (section.type === 'footer_simple') {
              <app-footer-simple [config]="section.config"></app-footer-simple>
            }
          }
        }
      </div>

      <div class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto">
        <div class="glass-dock px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl border border-white/40">
           <a [routerLink]="['/store', state.organization()?.slug]" routerLinkActive="text-rose-600" class="text-slate-500 hover:text-slate-900 transition-colors">
             <i class="pi pi-home text-xl"></i>
           </a>
           <a [routerLink]="['/store', state.organization()?.slug, 'products']" routerLinkActive="text-rose-600" class="text-slate-500 hover:text-slate-900 transition-colors">
             <i class="pi pi-th-large text-xl"></i>
           </a>
           <a [routerLink]="['/store', state.organization()?.slug, 'cart']" routerLinkActive="text-rose-600" class="relative text-slate-500 hover:text-slate-900 transition-colors">
             <i class="pi pi-shopping-bag text-xl"></i>
             <span class="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
           </a>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .glass-dock {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);
    }
  `],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(15px)' }),
        animate('500ms cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class StorefrontLayoutComponent {
  public state = inject(StorefrontStateService);
  private router = inject(Router);
  
  currentUrl = '';

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.url;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  isHomePage(): boolean {
    const slug = this.state.organization()?.slug;
    if (!slug) return false;
    return this.router.url.includes(`/store/${slug}/home`) || 
           this.router.url === `/store/${slug}`;
  }
}