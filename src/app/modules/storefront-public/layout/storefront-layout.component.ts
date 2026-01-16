import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StorefrontStateService } from '../../../core/services/storefront-state.service';
import { FooterSimpleComponent } from '../components/footer-simple/footer-simple.component';
import { NavbarSimpleComponent } from '../components/navbar-simple/navbar-simple.component';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarSimpleComponent, FooterSimpleComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50 font-sans">
      
      @if (state.layout(); as layout) {
        @for (section of layout.header; track section.id) {
          @if (section.type === 'navbar_simple') {
            <app-navbar-simple 
              [config]="section.config" 
              [logo]="state.organization()?.logo"
              [orgSlug]="state.organization()?.slug">
            </app-navbar-simple>
          }
        }
      }

      <main class="flex-grow">
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
}

// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, ActivatedRoute } from '@angular/router';
// import { StorefrontStateService } from '../../../core/services/storefront-state.service';
// import { FooterSimpleComponent } from '../components/footer-simple/footer-simple.component';
// import { NavbarSimpleComponent } from '../components/navbar-simple/navbar-simple.component';

// // Services


// @Component({
//   selector: 'app-storefront-layout',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     RouterModule, 
//     NavbarSimpleComponent, 
//     FooterSimpleComponent
//   ],
//   template: `
//     <div class="min-h-screen flex flex-col bg-gray-50">
      
//       @if (state.layout(); as layout) {
//         @for (section of layout.header; track section.id) {
//           @if (section.type === 'navbar_simple') {
//             <app-navbar-simple 
//               [config]="section.config" 
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
//   // Public accessor for the template
//   public state = inject(StorefrontStateService);
// }