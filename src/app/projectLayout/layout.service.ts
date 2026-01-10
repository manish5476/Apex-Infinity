import { Injectable, signal, computed, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  isPinned = signal(localStorage.getItem('sidebarPinned') === 'true');
  isHovered = signal(false);
  isMobileMenuOpen = signal(false);
  screenWidth = signal(0);

  isMobile = computed(() => this.screenWidth() < 768);
  isTablet = computed(() =>
    this.screenWidth() >= 768 && this.screenWidth() < 1024
  );
  isDesktop = computed(() => this.screenWidth() >= 1024);

  // Existing logic
  isExpanded = computed(() => {
    if (this.isMobile() || this.isTablet()) {
      return this.isMobileMenuOpen();
    }
    return this.isPinned() || this.isHovered();
  });

  // 👇 ADD THIS LINE
  isCollapsed = computed(() => !this.isExpanded());

  constructor() {
    effect(() =>
      localStorage.setItem('sidebarPinned', String(this.isPinned()))
    );
  }

  togglePin() {
    this.isPinned.update(v => !v);
  }

  toggleMobile() {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobile() {
    this.isMobileMenuOpen.set(false);
  }
}

// import { Injectable, signal, computed, effect } from '@angular/core';
// @Injectable({ providedIn: 'root' })
// export class LayoutService {
//   isPinned = signal(localStorage.getItem('sidebarPinned') === 'true');
//   isHovered = signal(false);
//   isMobileMenuOpen = signal(false);
//   screenWidth = signal(0);

//   isMobile = computed(() => this.screenWidth() < 768);
//   isTablet = computed(() =>
//     this.screenWidth() >= 768 && this.screenWidth() < 1024
//   );
//   isDesktop = computed(() => this.screenWidth() >= 1024);

//   isExpanded = computed(() => {
//     if (this.isMobile() || this.isTablet()) {
//       return this.isMobileMenuOpen();
//     }
//     return this.isPinned() || this.isHovered();
//   });

//   constructor() {
//     effect(() =>
//       localStorage.setItem('sidebarPinned', String(this.isPinned()))
//     );
//   }

//   togglePin() {
//     this.isPinned.update(v => !v);
//   }

//   toggleMobile() {
//     this.isMobileMenuOpen.update(v => !v);
//   }

//   closeMobile() {
//     this.isMobileMenuOpen.set(false);
//   }
// }