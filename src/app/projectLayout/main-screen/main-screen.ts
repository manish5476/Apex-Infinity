import { Component, OnInit, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router'; // Corrected imports
import { Observable } from 'rxjs';

// Import component classes

import { ThemeService } from "../../core/services/theme.service";
import { MainscreenHeader } from '../mainscreen-header/mainscreen-header';
import { Mainscreensidebar } from '../mainscreensidebar/mainscreensidebar';


@Component({
  selector: 'app-main-screen',
  standalone: true, // Mark as standalone
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    MainscreenHeader, // Import standalone component
    Mainscreensidebar, // Import standalone component
    
  ],
  templateUrl: './main-screen.html',
  styleUrl: './main-screen.scss',
})
export class MainScreen implements OnInit {
  // --- State ---
  isSidebarPinned: boolean = false;
  isSidebarHovered: boolean = false;
  isMobileMenuOpen: boolean = false;
  isLoaded: boolean = false;

  @ViewChild(RouterOutlet) outlet: RouterOutlet | undefined;

  private mouseLeaveTimeout: any;

  // --- Injections ---
  private themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    setTimeout(() => this.isLoaded = true, 100); // Simulate loading delay
  }

  // --- Sidebar Pin/Hover Logic ---

  toggleSidebar() {
    this.isSidebarPinned = !this.isSidebarPinned;
    if (!this.isSidebarPinned) {
      this.isSidebarHovered = false;
      clearTimeout(this.mouseLeaveTimeout);
    }
  }

  togglePin() {
    this.isSidebarPinned = !this.isSidebarPinned;
    if (this.isSidebarPinned) {
      this.isSidebarHovered = true;
    }
  }

  onMouseEnter() {
    clearTimeout(this.mouseLeaveTimeout);
    if (!this.isSidebarPinned) {
      this.isSidebarHovered = true;
    }
  }

  onMouseLeave() {
    if (!this.isSidebarPinned) {
      this.mouseLeaveTimeout = setTimeout(() => {
        this.isSidebarHovered = false;
      }, 300); // 300ms delay to prevent quick flickering
    }
  }

  onMouseEnterMainContent() {
    if (!this.isSidebarPinned) this.isSidebarHovered = false;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  onMouseEnterTriggerZone() {
    if (!this.isSidebarPinned) this.isSidebarHovered = true;
  }
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
//     AsyncPipe
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

// // import { Component, OnInit, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
// // import { CommonModule, AsyncPipe } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { RouterModule, RouterOutlet } from '@angular/router'; // Corrected imports
// // import { Observable } from 'rxjs';

// // // Import component classes
// // import { ThemeService } from "../../core/services/theme.service";
// // import { MainscreenHeader } from '../mainscreen-header/mainscreen-header';
// // import { Mainscreensidebar } from '../mainscreensidebar/mainscreensidebar';


// // @Component({
// //   selector: 'app-main-screen',
// //   standalone: true, // Mark as standalone
// //   imports: [
// //     CommonModule, 
// //     FormsModule, 
// //     RouterModule, 
// //     MainscreenHeader, // Import standalone component
// //     Mainscreensidebar, // Import standalone component
// //     AsyncPipe
// //   ],
// //   templateUrl: './main-screen.html',
// //   styleUrl: './main-screen.scss',
// // })
// // export class MainScreen implements OnInit {
// //   // --- State ---
// //   isSidebarPinned: boolean = false;
// //   isSidebarHovered: boolean = false;
// //   isMobileMenuOpen: boolean = false;
// //   isLoaded: boolean = false;

// //   @ViewChild(RouterOutlet) outlet: RouterOutlet | undefined;

// //   private mouseLeaveTimeout: any;

// //   // --- Injections ---
// //   private themeService = inject(ThemeService);
// //   private cdr = inject(ChangeDetectorRef);

// //   ngOnInit() {
// //     setTimeout(() => this.isLoaded = true, 100); // Simulate loading delay
// //   }

// //   // --- Sidebar Pin/Hover Logic ---

// //   toggleSidebar() {
// //     this.isSidebarPinned = !this.isSidebarPinned;
// //     if (!this.isSidebarPinned) {
// //       this.isSidebarHovered = false;
// //       clearTimeout(this.mouseLeaveTimeout);
// //     }
// //   }

// //   togglePin() {
// //     this.isSidebarPinned = !this.isSidebarPinned;
// //     if (this.isSidebarPinned) {
// //       this.isSidebarHovered = true;
// //     }
// //   }

// //   onMouseEnter() {
// //     clearTimeout(this.mouseLeaveTimeout);
// //     if (!this.isSidebarPinned) {
// //       this.isSidebarHovered = true;
// //     }
// //   }

// //   onMouseLeave() {
// //     if (!this.isSidebarPinned) {
// //       this.mouseLeaveTimeout = setTimeout(() => {
// //         this.isSidebarHovered = false;
// //       }, 300); // 300ms delay to prevent quick flickering
// //     }
// //   }

// //   onMouseEnterMainContent() {
// //     if (!this.isSidebarPinned) this.isSidebarHovered = false;
// //   }

// //   toggleMobileMenu() {
// //     this.isMobileMenuOpen = !this.isMobileMenuOpen;
// //   }

// //   onMouseEnterTriggerZone() {
// //     if (!this.isSidebarPinned) this.isSidebarHovered = true;
// //   }
// // }

// // // import { MainscreenHeader } from "../mainscreen-header/mainscreen-header";
// // // import { Mainscreensidebar } from "../mainscreensidebar/mainscreensidebar";
// // // import { Component, EventEmitter, Input, Output, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { FormsModule } from '@angular/forms';
// // // import { RouterModule, RouterOutlet } from '@angular/router';
// // // import { ThemeService } from "../../core/services/theme.service";
// // // import { Observable } from 'rxjs';
// // // import { AsyncPipe } from '@angular/common';

// // // @Component({
// // //   selector: 'app-main-screen',
// // //   imports: [CommonModule, FormsModule, RouterModule, MainscreenHeader, Mainscreensidebar],
// // //   templateUrl: './main-screen.html',
// // //   styleUrl: './main-screen.scss',
// // // })
// // // export class MainScreen {
// // //   @Input() selectedItems: any[] = [];
// // //   @Output() search = new EventEmitter<string>();
// // //   @Output() newItem = new EventEmitter<void>();
// // //   @Output() deleteItems = new EventEmitter<void>();

// // //   gradient$!: Observable<string>;
// // //   isSidebarPinned: boolean = false;
// // //   isSidebarHovered: boolean = false;
// // //   isMobileMenuOpen: boolean = false;
// // //   isLoaded: boolean = false;

// // //   @ViewChild(RouterOutlet) outlet: RouterOutlet | undefined;

// // //   private mouseLeaveTimeout: any;

// // //   constructor(private themeService: ThemeService, private cdr: ChangeDetectorRef) { }

// // //   ngOnInit() {
// // //     setTimeout(() => this.isLoaded = true, 100); // Simulate loading delay
// // //   }

// // //   ngAfterViewInit() {
// // //     if (this.outlet?.isActivated) {
// // //       this.isLoaded = true;
// // //     }
// // //   }

// // //   onColorChange(color: string) {
// // //     if (color && color.startsWith('#')) {
// // //       // this.themeService.updateGradient(color);
// // //     }
// // //   }

// // //   onSearch(term: string) {
// // //     this.search.emit(term);
// // //   }

// // //   toggleSidebar() {
// // //     this.isSidebarPinned = !this.isSidebarPinned;
// // //     if (!this.isSidebarPinned) {
// // //       this.isSidebarHovered = false;
// // //       clearTimeout(this.mouseLeaveTimeout);
// // //     }
// // //   }

// // //   togglePin() {
// // //     this.isSidebarPinned = !this.isSidebarPinned;
// // //     if (this.isSidebarPinned) {
// // //       this.isSidebarHovered = true;
// // //     }
// // //   }

// // //   onMouseEnter() {
// // //     clearTimeout(this.mouseLeaveTimeout);
// // //     if (!this.isSidebarPinned) {
// // //       this.isSidebarHovered = true;
// // //     }
// // //   }

// // //   onMouseLeave() {
// // //     if (!this.isSidebarPinned) {
// // //       this.mouseLeaveTimeout = setTimeout(() => {
// // //         this.isSidebarHovered = false;
// // //       }, 300); // 300ms delay to prevent quick flickering
// // //     }
// // //   }

// // //   onMouseEnterMainContent() {
// // //     if (!this.isSidebarPinned) this.isSidebarHovered = false;
// // //   }

// // //   toggleMobileMenu() {
// // //     this.isMobileMenuOpen = !this.isMobileMenuOpen;
// // //   }

// // //   onMouseEnterTriggerZone() {
// // //     if (!this.isSidebarPinned) this.isSidebarHovered = true;
// // //   }
// // // }
