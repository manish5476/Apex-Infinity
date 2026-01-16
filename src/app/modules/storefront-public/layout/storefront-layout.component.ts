import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { StorefrontStateService } from '../../../core/services/storefront-state.service';
import { NavbarSimpleComponent } from '../components/navbar-simple/navbar-simple.component';
import { FooterSimpleComponent } from '../components/footer-simple/footer-simple.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarSimpleComponent, FooterSimpleComponent],
  template: `
    <div class="min-h-screen flex flex-col font-sans relative">
      
      @if (state.layout(); as layout) {
        @for (section of layout.header; track section.id) {
          @if (section.type === 'navbar_simple') {
            <app-navbar-simple 
              [config]="section.config" 
              [organization]="state.organization()"
              [logo]="state.organization()?.logo"
              [orgSlug]="state.organization()?.slug"
              class="sticky top-0 z-50 w-full block"> 
            </app-navbar-simple>
          }
        }
      }

      <main class="flex-grow w-full" [class.pt-16]="!isHomePage()">
        <router-outlet></router-outlet>
      </main>

      @if (state.layout(); as layout) {
        @for (section of layout.footer; track section.id) {
          @if (section.type === 'footer_simple') {
            <app-footer-simple [config]="section.config"></app-footer-simple>
          }
        }
      }

    </div>
  `
})
export class StorefrontLayoutComponent {
  public state = inject(StorefrontStateService);
  private router = inject(Router);
  
  // Logic to detect if we are on the home page
  // We use this to toggle the top padding
  currentUrl = '';

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.url;
    });
  }

  isHomePage(): boolean {
    // Check if the URL ends with /home or is just the root store URL
    const slug = this.state.organization()?.slug;
    if (!slug) return false;
    
    // Example: /store/shivam/home OR /store/shivam
    return this.router.url.includes(`/store/${slug}/home`) || 
           this.router.url.endsWith(`/store/${slug}`);
  }
}

// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { StorefrontStateService } from '../../../core/services/storefront-state.service';
// import { FooterSimpleComponent } from '../components/footer-simple/footer-simple.component';
// import { NavbarSimpleComponent } from '../components/navbar-simple/navbar-simple.component';

// @Component({
//   selector: 'app-storefront-layout',
//   standalone: true,
//   imports: [CommonModule, RouterModule, NavbarSimpleComponent, FooterSimpleComponent],
//   template: `
//     <div class="min-h-screen flex flex-col bg-gray-50 font-sans">
      
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

//       <main class="flex-grow">
//         <router-outlet></router-outlet>
//       </main>

//       @if (state.layout(); as layout) {
//         @for (section of layout.footer; track section.id) {
//           @if (section.type === 'footer_simple') {
//             <app-footer-simple [config]="section.config"></app-footer-simple>
//           }
//         }
//       }
//     </div>
//   `
// })
// export class StorefrontLayoutComponent {
//   public state = inject(StorefrontStateService);
// }
