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

  isExpanded = computed(() => {
    if (this.isMobile() || this.isTablet()) {
      return this.isMobileMenuOpen();
    }
    return this.isPinned() || this.isHovered();
  });

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

// @Injectable({ providedIn: 'root' })
// export class LayoutService {
//   // --- State ---
//   isPinned = signal(localStorage.getItem('sidebarPinned') === 'true');
//   isHovered = signal(false);
//   isMobileMenuOpen = signal(false);
//   screenWidth = signal(window.innerWidth);

//   // --- Derived ---
//   isMobile = computed(() => this.screenWidth() < 1024);

//   isExpanded = computed(() => {
//     if (this.isMobile()) return this.isMobileMenuOpen();
//     return this.isPinned() || this.isHovered();
//   });

//   constructor() {
//     // Resize throttled via rAF (prevents layout thrash)
//     let raf = 0;
//     window.addEventListener('resize', () => {
//       cancelAnimationFrame(raf);
//       raf = requestAnimationFrame(() =>
//         this.screenWidth.set(window.innerWidth)
//       );
//     });

//     effect(() =>
//       localStorage.setItem('sidebarPinned', this.isPinned().toString())
//     );
//   }

//   togglePin() {
//     this.isPinned.update(v => !v);
//   }

//   toggleMobile() {
//     this.isMobileMenuOpen.update(v => !v);
//   }
// }
