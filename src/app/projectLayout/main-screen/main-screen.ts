import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LayoutService } from '../layout.service';
import { MainscreenHeader } from '../mainscreen-header/mainscreen-header';
import { Mainscreensidebar } from '../mainscreensidebar/mainscreensidebar';
@Component({
  selector: 'app-main-screen',
  standalone: true,
  imports: [RouterOutlet, MainscreenHeader, Mainscreensidebar],
  templateUrl: './main-screen.html',
  styleUrl: './main-screen.scss'
})
export class MainScreen {
  layout = inject(LayoutService);

  constructor() {
    this.updateWidth();
  }

  @HostListener('window:resize')
  updateWidth() {
    this.layout.screenWidth.set(window.innerWidth);
  }

  onMenuToggle() {
    if (this.layout.isDesktop()) {
      this.layout.togglePin();
    } else {
      this.layout.toggleMobile();
    }
  }
}


// @Component({
//   selector: 'app-main-screen',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterOutlet,
//     MainscreenHeader,
//     Mainscreensidebar
//   ],
//   template: `
//     <div class="layout-root"
//          [class.mobile]="layout.isMobile()">

//       <app-mainscreen-header />

//       <div class="layout-body">
//         <app-mainscreen-sidebar />

//         <main class="main-content">
//           <router-outlet />
//         </main>
//       </div>

//       @if (layout.isMobile() && layout.isMobileMenuOpen()) {
//         <div class="mobile-backdrop"
//              (click)="layout.toggleMobile()"></div>
//       }
//     </div>
//   `,
//   styleUrl: './main-screen.scss'
// })
// export class MainScreen {
//   layout = inject(LayoutService);
// }
