// ─────────────────────────────────────────────────────────────────────────────
// tab-outlet.component.ts  –  Wraps <router-outlet> inside a shell that reacts
//                              to tab state and shows/hides content smoothly.
// ─────────────────────────────────────────────────────────────────────────────

import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, state } from '@angular/animations';

import { TabService } from '../tab.service';

@Component({
  selector: 'apex-tab-outlet',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="tab-outlet">
      @if (tabService.tabCount() === 0) {
        <div class="tab-outlet__empty">
          <i class="pi pi-window-maximize"></i>
          <p>No tabs open. Click an item in the sidebar to get started.</p>
        </div>
      }
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1 1 0; overflow: hidden; }

    .tab-outlet {
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      overflow: hidden;
      position: relative;
    }

    .tab-outlet__empty {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--theme-text-3, #6c7086);
      pointer-events: none;

      i    { font-size: 48px; opacity: .3; }
      p    { font-size: 14px; margin: 0; font-family: var(--theme-font-ui, sans-serif); }
    }

    router-outlet + * {
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      overflow: auto;
      animation: tabFadeIn 180ms ease-out;
    }

    @keyframes tabFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0);   }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabOutletComponent {
  readonly tabService = inject(TabService);
}
