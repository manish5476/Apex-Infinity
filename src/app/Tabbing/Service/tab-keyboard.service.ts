// ─────────────────────────────────────────────────────────────────────────────
// tab-keyboard.service.ts
// FIX A: bail-out guard so shortcuts don't fire when user is typing in an input
// FIX B: removeEventListener note — service lives for app lifetime so ngOnDestroy
//         is cosmetic, but kept for correctness if the service is ever scoped.
// ─────────────────────────────────────────────────────────────────────────────

import { isPlatformBrowser } from '@angular/common';
import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { TabService } from './tab.service';

@Injectable({ providedIn: 'root' })
export class TabKeyboardService implements OnDestroy {

  private readonly tabService = inject(TabService);
  private readonly platformId = inject(PLATFORM_ID);
  private _handler!: (e: KeyboardEvent) => void;
  private _initialised = false;

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this._initialised) return;
    this._initialised = true;

    this._handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      // FIX A: Don't steal shortcuts when the user is typing
      if (this._isFocusedOnInput()) return;

      // Ctrl+W — close active tab
      if (e.key === 'w' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        this.tabService.closeActiveTab();
        return;
      }

      // Ctrl+Tab — next tab
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        this.tabService.activateNext();
        return;
      }

      // Ctrl+Shift+Tab — previous tab
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        this.tabService.activatePrev();
        return;
      }

      // Ctrl+1..9 — jump to tab by 1-based index
      const digit = parseInt(e.key, 10);
      if (!isNaN(digit) && digit >= 1 && digit <= 9) {
        e.preventDefault();
        const tabs = this.tabService.tabs();
        const target = digit === 9
          ? tabs[tabs.length - 1]   // Ctrl+9 → always last tab
          : tabs[digit - 1];
        if (target) this.tabService.activateTab(target.id);
      }
    };

    window.addEventListener('keydown', this._handler, { capture: true });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this._handler) {
      window.removeEventListener('keydown', this._handler, { capture: true });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  /** Returns true when focus is inside a text-entry element. */
  private _isFocusedOnInput(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if ((el as HTMLElement).isContentEditable) return true;
    // PrimeNG inline editors use role="textbox"
    if (el.getAttribute('role') === 'textbox') return true;
    return false;
  }
}
