// src/app/tab-workspace/tab-workspace-keyboard.service.ts

import { isPlatformBrowser } from '@angular/common';
import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { TabWorkspaceService } from './tab-workspace.service';

@Injectable({ providedIn: 'root' })
export class TabWorkspaceKeyboardService implements OnDestroy {
  private readonly tabService = inject(TabWorkspaceService);
  private readonly platformId = inject(PLATFORM_ID);

  private handler: ((e: KeyboardEvent) => void) | null = null;
  private isAttached = false;

  init(): void {
    if (!isPlatformBrowser(this.platformId) || this.isAttached) return;
    this.isAttached = true;

    this.handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      // Do not hijack input typing
      if (this.isFocusedOnInput()) return;

      // Ctrl+W: Close active tab
      if (e.key === 'w' || e.key === 'W') {
        if (!e.shiftKey && !e.altKey) {
          e.preventDefault();
          void this.tabService.closeCurrent();
          return;
        }
      }

      // Ctrl+Tab: Next tab
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        this.tabService.activateNext();
        return;
      }

      // Ctrl+Shift+Tab: Previous tab
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        this.tabService.activatePrev();
        return;
      }

      // Ctrl+1..9: Direct index jump
      const digit = parseInt(e.key, 10);
      if (!isNaN(digit) && digit >= 1 && digit <= 9) {
        e.preventDefault();
        const tabs = this.tabService.tabs();
        if (tabs.length === 0) return;

        const target = digit === 9
          ? tabs[tabs.length - 1] // Ctrl+9 jumps to last tab
          : tabs[digit - 1];

        if (target) {
          void this.tabService.activate(target.id);
        }
      }
    };

    window.addEventListener('keydown', this.handler, { capture: true });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.handler) {
      window.removeEventListener('keydown', this.handler, { capture: true });
      this.isAttached = false;
      this.handler = null;
    }
  }

  private isFocusedOnInput(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const active = document.activeElement;
    if (!active) return false;

    const tag = active.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if ((active as HTMLElement).isContentEditable) return true;
    if (active.getAttribute('role') === 'textbox') return true;
    return false;
  }
}
