// src/app/shared/ui/bento/bento-container.component.ts
import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';

export type BentoVariant = 'surface' | 'glass' | 'outlined' | 'elevated' | 'flat';

/**
 * Component: app-bento-container
 * Purpose: Reusable dashboard "bento box" card with optional header
 * (title/icon), optional collapsibility, and five visual treatments.
 * Fully token-driven; collapse animation uses a GPU-friendly grid-row
 * transition instead of max-height.
 */
@Component({
  selector: 'app-bento-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-bento-host',
  },
  template: `
    <div class="app-bento" [class]="variantClass()">
      @if (title() || icon()) {
        @if (collapsible()) {
          <button
            type="button"
            class="app-bento__header app-bento__header--interactive"
            [attr.aria-expanded]="!isCollapsed()"
            [attr.aria-controls]="contentId"
            (click)="toggleCollapse()">
            <h4 class="app-bento__title">
              @if (icon()) {
                <span class="app-bento__icon">
                  <i [class]="icon()"></i>
                </span>
              }
              {{ title() }}
            </h4>
            <div class="app-bento__actions" (click)="$event.stopPropagation()">
              <ng-content select="[header-action]"></ng-content>
              <span class="app-bento__chevron" aria-hidden="true">
                <i class="pi" [class.pi-chevron-down]="!isCollapsed()" [class.pi-chevron-up]="isCollapsed()"></i>
              </span>
            </div>
          </button>
        } @else {
          <div class="app-bento__header">
            <h4 class="app-bento__title">
              @if (icon()) {
                <span class="app-bento__icon">
                  <i [class]="icon()"></i>
                </span>
              }
              {{ title() }}
            </h4>
            <div class="app-bento__actions">
              <ng-content select="[header-action]"></ng-content>
            </div>
          </div>
        }
      }

      <div
        class="app-bento__collapse"
        [class.app-bento__collapse--closed]="isCollapsed()"
        [id]="contentId">
        <div class="app-bento__collapse-inner">
          <div class="app-bento__body">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host.app-bento-host {
      display: block;
      height: 100%;
      width: 100%;
    }

    .app-bento {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      border-radius: var(--ui-border-radius-xl);
      overflow: hidden;
      transition: var(--transition-base);
    }

    /* ===== Variants ===== */

    .app-bento--surface {
      background: var(--bg-primary);
      border: var(--ui-border-width) solid color-mix(in srgb, var(--border-secondary) 60%, transparent);
      box-shadow: var(--shadow-sm);
    }
    .app-bento--surface:hover {
      box-shadow: var(--elevation-1);
      border-color: var(--border-primary);
    }

    .app-bento--glass {
      background: color-mix(in srgb, var(--bg-primary) 80%, transparent);
      backdrop-filter: blur(20px);
      border: var(--ui-border-width) solid color-mix(in srgb, var(--border-secondary) 40%, transparent);
      box-shadow: var(--shadow-sm);
    }
    .app-bento--glass:hover {
      box-shadow: var(--shadow-md);
    }

    .app-bento--outlined {
      background: transparent;
      border: var(--ui-border-width) solid var(--border-secondary);
    }
    .app-bento--outlined:hover {
      border-color: var(--border-primary);
    }

    .app-bento--elevated {
      background: var(--bg-primary);
      border: var(--ui-border-width) solid color-mix(in srgb, var(--border-primary) 15%, transparent);
      box-shadow: var(--elevation-2);
    }
    .app-bento--elevated:hover {
      box-shadow: var(--elevation-3);
      transform: translateY(-4px);
    }

    .app-bento--flat {
      background: var(--bg-secondary);
      border: none;
    }

    /* ===== Header ===== */

    .app-bento__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-lg);
      padding: var(--spacing-2xl) var(--spacing-2xl) var(--spacing-md);
      width: 100%;
      background: transparent;
      border: none;
      font: inherit;
      text-align: left;
    }

    .app-bento__header--interactive {
      cursor: pointer;
      border-radius: var(--ui-border-radius-sm);
    }

    .app-bento__header--interactive:focus-visible {
      outline: var(--focus-outline-width) solid var(--accent-primary);
      outline-offset: calc(-1 * var(--focus-ring-offset));
    }

    .app-bento__title {
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      min-width: 0;
    }

    .app-bento__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: var(--spacing-4xl);
      height: var(--spacing-4xl);
      border-radius: var(--ui-border-radius-sm);
      background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
      color: var(--accent-primary);
      font-size: var(--font-size-sm);
    }

    .app-bento__actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-shrink: 0;
    }

    .app-bento__chevron {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--spacing-3xl);
      height: var(--spacing-3xl);
      border-radius: var(--ui-border-radius-sm);
      color: var(--text-secondary);
      transition: var(--transition-fast);
    }

    .app-bento__header--interactive:hover .app-bento__chevron {
      background: var(--bg-ternary);
      color: var(--text-primary);
    }

    /* ===== Collapse ===== */
    /* grid-template-rows 0fr -> 1fr is GPU-composited and works for any
       content height, unlike animating max-height against a hardcoded
       ceiling value. */

    .app-bento__collapse {
      display: grid;
      grid-template-rows: 1fr;
      transition: var(--transition-slow);
    }

    .app-bento__collapse--closed {
      grid-template-rows: 0fr;
    }

    .app-bento__collapse-inner {
      min-height: 0;
      overflow: hidden;
    }

    .app-bento__body {
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: var(--spacing-2xl);
    }
  `],
})
export class BentoContainerComponent {
  title = input<string>();
  icon = input<string>();
  variant = input<BentoVariant>('surface');
  collapsible = input<boolean>(false);

  isCollapsed = signal<boolean>(false);

  protected readonly contentId = `bento-content-${Math.random().toString(36).slice(2, 9)}`;

  protected variantClass = computed(() => `app-bento--${this.variant()}`);

  toggleCollapse(): void {
    if (this.collapsible()) {
      this.isCollapsed.update(v => !v);
    }
  }
}


// import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';

// @Component({
//   selector: 'app-bento-container',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   host: {
//     '[class]': 'hostClasses()'
//   },
//   template: `
//     <div [class]="containerClasses()">
//       @if (title() || icon()) {
//         <div class="px-6 pt-6 pb-2 flex items-center justify-between" 
//              [class.cursor-pointer]="collapsible()" 
//              (click)="toggleCollapse()">
//           <h4 class="m-0 flex items-center gap-3 text-[length:var(--font-size-base)] font-bold text-[var(--text-primary)]">
//             @if (icon()) {
//               <div class="flex items-center justify-center w-7 h-7 rounded-md bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-[var(--accent-primary)]">
//                 <i [class]="icon()" class="text-sm"></i>
//               </div>
//             }
//             {{ title() }}
//           </h4>
//           <div class="flex items-center gap-2" (click)="$event.stopPropagation()">
//             <ng-content select="[header-action]"></ng-content>
//             @if (collapsible()) {
//               <button type="button" class="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]" (click)="toggleCollapse()">
//                  <i class="pi" [class.pi-chevron-down]="!isCollapsed()" [class.pi-chevron-up]="isCollapsed()"></i>
//               </button>
//             }
//           </div>
//         </div>
//       }
      
//       <div class="flex-1 flex flex-col transition-all duration-300 overflow-hidden"
//            [style.max-height]="isCollapsed() ? '0' : '2000px'"
//            [style.opacity]="isCollapsed() ? '0' : '1'">
//         <div class="p-6 flex-1 flex flex-col">
//           <ng-content></ng-content>
//         </div>
//       </div>
//     </div>
//   `,
// })
// export class BentoContainerComponent {
//   title = input<string>();
//   icon = input<string>();
//   variant = input<'surface' | 'glass' | 'outlined' | 'elevated' | 'flat'>('surface');
//   collapsible = input<boolean>(false);
  
//   isCollapsed = signal<boolean>(false);

//   toggleCollapse() {
//     if (this.collapsible()) {
//       this.isCollapsed.update(v => !v);
//     }
//   }

//   protected hostClasses = computed(() => 'block h-full w-full');

//   protected containerClasses = computed(() => {
//     const base = 'h-full w-full flex flex-col rounded-[var(--radius-2xl,20px)] transition-all duration-300 overflow-hidden group';
    
//     const variants = {
//       surface: 'bg-[var(--bg-primary)] border border-[color-mix(in_srgb,var(--border-secondary)_60%,transparent)] shadow-sm hover:shadow-[var(--elevation-1)] hover:border-[var(--border-primary)]',
//       glass: 'bg-[color-mix(in_srgb,var(--bg-primary)_80%,transparent)] backdrop-blur-xl border border-[color-mix(in_srgb,var(--border-secondary)_40%,transparent)] shadow-sm hover:shadow-md',
//       outlined: 'bg-transparent border border-[var(--border-secondary)] hover:border-[var(--border-primary)]',
//       elevated: 'bg-[var(--bg-primary)] border border-[color-mix(in_srgb,var(--border-primary)_15%,transparent)] shadow-[var(--elevation-2)] hover:shadow-[var(--elevation-3)] hover:-translate-y-1',
//       flat: 'bg-[var(--bg-secondary)] border-none'
//     };
    
//     return `${base} ${variants[this.variant()]}`;
//   });
// }
