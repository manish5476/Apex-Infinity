import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { LayoutService } from '../layout.service';
import { MainscreenHeader } from '../mainscreen-header/mainscreen-header';
import { Mainscreensidebar } from '../mainscreensidebar/mainscreensidebar';

@Component({
  selector: 'app-main-screen',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, MainscreenHeader, Mainscreensidebar],
  template: `
    <div class="layout-container" 
         [class.sidebar-expanded]="layout.isExpanded()"
         [class.is-mobile]="layout.isMobile()">
      
      <app-mainscreen-header />

      <div class="main-content-area">
        <app-mainscreen-sidebar />

        <main class="main-content" (mouseenter)="layout.isHovered.set(false)">
          <div class="content-wrapper">
            <router-outlet />
          </div>
        </main>
      </div>

      @if (layout.isMobile() && layout.isMobileMenuOpen()) {
        <div class="mobile-backdrop" (click)="layout.toggleMobile()"></div>
      }
    </div>
  `,
  styleUrl: './main-screen.scss'
})
export class MainScreen {
  layout = inject(LayoutService);
}
// import { Component, OnInit, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
// import { CommonModule, AsyncPipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule, RouterOutlet } from '@angular/router'; // Corrected imports
// import { Observable } from 'rxjs';

// // Import component classes

// import { ThemeService } from "../../core/services/theme.service";
// import { MainscreenHeader } from '../mainscreen-header/mainscreen-header';
// import { Mainscreensidebar } from '../mainscreensidebar/mainscreensidebar';


// @Component({
//   selector: 'app-main-screen',
//   standalone: true, // Mark as standalone
//   imports: [
//     CommonModule, 
//     FormsModule, 
//     RouterModule, 
//     MainscreenHeader, // Import standalone component
//     Mainscreensidebar, // Import standalone component
    
//   ],
//   templateUrl: './main-screen.html',
//   styleUrl: './main-screen.scss',
// })
// export class MainScreen implements OnInit {
//   // --- State ---
//   isSidebarPinned: boolean = false;
//   isSidebarHovered: boolean = false;
//   isMobileMenuOpen: boolean = false;
//   isLoaded: boolean = false;

//   @ViewChild(RouterOutlet) outlet: RouterOutlet | undefined;

//   private mouseLeaveTimeout: any;

//   // --- Injections ---
//   private themeService = inject(ThemeService);
//   private cdr = inject(ChangeDetectorRef);

//   ngOnInit() {
//     setTimeout(() => this.isLoaded = true, 100); // Simulate loading delay
//   }

//   // --- Sidebar Pin/Hover Logic ---

//   toggleSidebar() {
//     this.isSidebarPinned = !this.isSidebarPinned;
//     if (!this.isSidebarPinned) {
//       this.isSidebarHovered = false;
//       clearTimeout(this.mouseLeaveTimeout);
//     }
//   }

//   togglePin() {
//     this.isSidebarPinned = !this.isSidebarPinned;
//     if (this.isSidebarPinned) {
//       this.isSidebarHovered = true;
//     }
//   }

//   onMouseEnter() {
//     clearTimeout(this.mouseLeaveTimeout);
//     if (!this.isSidebarPinned) {
//       this.isSidebarHovered = true;
//     }
//   }

//   onMouseLeave() {
//     if (!this.isSidebarPinned) {
//       this.mouseLeaveTimeout = setTimeout(() => {
//         this.isSidebarHovered = false;
//       }, 300); // 300ms delay to prevent quick flickering
//     }
//   }

//   onMouseEnterMainContent() {
//     if (!this.isSidebarPinned) this.isSidebarHovered = false;
//   }

//   toggleMobileMenu() {
//     this.isMobileMenuOpen = !this.isMobileMenuOpen;
//   }

//   onMouseEnterTriggerZone() {
//     if (!this.isSidebarPinned) this.isSidebarHovered = true;
//   }
// }
