

import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, state } from '@angular/animations';

import { TabService } from '../Service/tab.service';

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

    :host ::ng-deep router-outlet + * {
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
// ─────────────────────────────────────────────────────────────────────────────
// // tab-outlet.component.ts
// // FIX A: removed unused @angular/animations imports (trigger/transition/etc.)
// // FIX B: router-outlet + * replaced with :host ::ng-deep so the fade-in
// //         animation survives Angular's Emulated view-encapsulation attribute
// //         selector wrapping.
// // ─────────────────────────────────────────────────────────────────────────────

// import {
//   ChangeDetectionStrategy,
//   Component,
//   inject,
// } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
// import { CommonModule } from '@angular/common';

// import { TabService } from '../Service/tab.service';

// @Component({
//   selector: 'apex-tab-outlet',
//   standalone: true,
//   imports: [CommonModule, RouterOutlet],
//   template: `
//     <div class="tab-outlet">
//       @if (tabService.tabCount() === 0) {
//         <div class="tab-outlet__empty">
//           <i class="pi pi-window-maximize"></i>
//           <p>No tabs open. Click an item in the sidebar to get started.</p>
//         </div>
//       }
//       <router-outlet></router-outlet>
//     </div>
//   `,
//   styles: [`
//     :host {
//       display: flex;
//       flex-direction: column;
//       flex: 1 1 0;
//       overflow: hidden;
//     }

//     .tab-outlet {
//       display: flex;
//       flex-direction: column;
//       flex: 1 1 0;
//       overflow: hidden;
//       position: relative;
//     }

//     .tab-outlet__empty {
//       position: absolute;
//       inset: 0;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: 12px;
//       color: var(--theme-text-3, #6c7086);
//       pointer-events: none;

//       i { font-size: 48px; opacity: .3; }
//       p { font-size: 14px; margin: 0; font-family: var(--theme-font-ui, sans-serif); }
//     }

//     /*
//      * FIX B: router-outlet renders its component as the *next sibling* of the
//      * outlet element, but Angular's Emulated encapsulation adds an attribute
//      * like [_nghost-xyz] to :host and [_ngcontent-xyz] to children.
//      * The bare "router-outlet + *" selector gets the attribute scoped and misses
//      * the dynamically-inserted routed component which has its OWN host attribute.
//      * ::ng-deep disables scoping for this one rule so it reaches the component.
//      */
//     :host ::ng-deep router-outlet + * {
//       display: flex;
//       flex-direction: column;
//       flex: 1 1 0;
//       overflow: auto;
//       animation: tabFadeIn 180ms ease-out;
//     }

//     @keyframes tabFadeIn {
//       from { opacity: 0; transform: translateY(4px); }
//       to   { opacity: 1; transform: translateY(0); }
//     }
//   `],
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class TabOutletComponent {
//   readonly tabService = inject(TabService);
// }

