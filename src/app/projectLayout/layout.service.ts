import { Injectable, signal, computed, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  // State Signals
  isPinned = signal(localStorage.getItem('sidebarPinned') === 'true');
  isHovered = signal(false);
  isMobileMenuOpen = signal(false);
  screenWidth = signal(window.innerWidth);

  // Derived State (Automatic)
  isMobile = computed(() => this.screenWidth() < 1024);
  
  // The ultimate "is expanded" logic
  isExpanded = computed(() => {
    if (this.isMobile()) return this.isMobileMenuOpen();
    return this.isPinned() || this.isHovered();
  });

  constructor() {
    window.addEventListener('resize', () => this.screenWidth.set(window.innerWidth));
    // Persist pin state to browser memory
    effect(() => localStorage.setItem('sidebarPinned', this.isPinned().toString()));
  }

  togglePin() { this.isPinned.update(v => !v); }
  toggleMobile() { this.isMobileMenuOpen.update(v => !v); }
}

// import { Injectable, signal, computed, effect } from '@angular/core';

// @Injectable({ providedIn: 'root' })
// export class LayoutService {
//   // Signals for state management
//   isPinned = signal(localStorage.getItem('sidebarPinned') === 'true');
//   isHovered = signal(false);
//   isMobileMenuOpen = signal(false);
//   screenWidth = signal(window.innerWidth);

//   // Derived state
//   isMobile = computed(() => this.screenWidth() < 1024);
  
//   // The actual logic that determines if the sidebar is "visible"
//   isExpanded = computed(() => {
//     if (this.isMobile()) return this.isMobileMenuOpen();
//     return this.isPinned() || this.isHovered();
//   });

//   constructor() {
//     window.addEventListener('resize', () => this.screenWidth.set(window.innerWidth));
//         effect(() => {
//       localStorage.setItem('sidebarPinned', this.isPinned().toString());
//     });
//   }

//   togglePin() { this.isPinned.update(v => !v); }
//   toggleMobile() { this.isMobileMenuOpen.update(v => !v); }
//   closeAll() {
//     this.isMobileMenuOpen.set(false);
//     this.isHovered.set(false);
//   }
// }

// // import { Injectable, signal, computed, effect } from '@angular/core';

// // @Injectable({ providedIn: 'root' })
// // export class LayoutService {
// //   // Core State Signals
// //   isPinned = signal(localStorage.getItem('sidebarPinned') === 'true');
// //   isHovered = signal(false);
// //   isMobileMenuOpen = signal(false);
// //   screenWidth = signal(window.innerWidth);

// //   // Computed signals (derived state)
// //   isMobile = computed(() => this.screenWidth() < 1024);
  
// //   // The "Truth" for Sidebar expansion
// //   isExpanded = computed(() => {
// //     if (this.isMobile()) return this.isMobileMenuOpen();
// //     return this.isPinned() || this.isHovered();
// //   });

// //   constructor() {
// //     window.addEventListener('resize', () => this.screenWidth.set(window.innerWidth));
    
// //     // Persist pin state
// //     effect(() => {
// //       localStorage.setItem('sidebarPinned', this.isPinned().toString());
// //     });
// //   }

// //   togglePin() { this.isPinned.update(v => !v); }
// //   toggleMobile() { this.isMobileMenuOpen.update(v => !v); }
// // }