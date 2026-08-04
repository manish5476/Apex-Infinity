// src/app/shared/ui/layout/split-layout.component.ts
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { SplitterModule } from 'primeng/splitter';

export type SplitLayoutDirection = 'horizontal' | 'vertical';

/**
 * Component: app-split-layout
 * Purpose: Resizable two-pane master/detail layout (e.g. list + inspector,
 * file tree + editor). Wraps PrimeNG's Splitter with token-driven gutter
 * styling and minimum sizes derived from the requested panelSizes so the
 * two inputs never fight each other.
 *
 * Desktop-oriented by design — does not auto-stack panels on narrow
 * viewports. If used in a context that must also work on mobile, wrap
 * consumption in a breakpoint check and swap to a stacked layout instead.
 */
@Component({
  selector: 'app-split-layout',
  standalone: true,
  imports: [SplitterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-split-layout-host',
  },
  template: `
    <p-splitter
      class="app-split-layout"
      [panelSizes]="panelSizes()"
      [minSizes]="minSizes()"
      [layout]="layout()"
      styleClass="app-split-layout__splitter">
      <ng-template pTemplate>
        <div class="app-split-layout__pane app-split-layout__pane--master">
          <ng-content select="[master]"></ng-content>
        </div>
      </ng-template>
      <ng-template pTemplate>
        <div class="app-split-layout__pane app-split-layout__pane--detail">
          <ng-content select="[detail]"></ng-content>
        </div>
      </ng-template>
    </p-splitter>
  `,
  styles: [`
    :host.app-split-layout-host {
      display: block;
      width: 100%;
      height: 100%;
      /* No dedicated token exists yet for a component minimum-viable
         height; kept as a named literal rather than an inline magic
         number in the template. */
      min-height: 31.25rem; /* 500px */
    }

    .app-split-layout {
      height: 100%;
    }

    /* ===== Panel content ===== */

    .app-split-layout__pane {
      height: 100%;
      width: 100%;
      overflow-y: auto;
    }

    .app-split-layout__pane--master {
      padding-right: var(--spacing-md);
    }

    .app-split-layout__pane--detail {
      padding-left: var(--spacing-md);
    }

    /* ===== Splitter panel + gutter theming =====
       PrimeNG's splitter renders its gutter as a sibling DOM element
       styled via its own internal classes; :host ::ng-deep is required
       to reach it since it isn't part of this component's own template
       content. */

    ::ng-deep .app-split-layout__splitter.p-splitter {
      border: none;
      background: transparent;
      height: 100%;
    }

    ::ng-deep .app-split-layout__splitter .p-splitter-gutter {
      background: var(--border-primary);
      transition: var(--transition-fast);
    }

    ::ng-deep .app-split-layout__splitter .p-splitter-gutter:hover {
      background: var(--accent-primary);
    }

    ::ng-deep .app-split-layout__splitter .p-splitter-gutter-handle {
      background: var(--border-secondary);
      transition: var(--transition-fast);
    }

    ::ng-deep .app-split-layout__splitter .p-splitter-gutter:hover .p-splitter-gutter-handle {
      background: var(--text-on-accent);
    }

    ::ng-deep .app-split-layout__splitter .p-splitter-gutter:active {
      background: var(--accent-hover);
      cursor: grabbing;
    }

    ::ng-deep .app-split-layout__splitter .p-splitter-gutter:focus-visible {
      outline: var(--focus-outline-width) solid var(--accent-primary);
      outline-offset: calc(-1 * var(--focus-ring-offset));
    }

    ::ng-deep .app-split-layout__splitter[layout='horizontal'] .p-splitter-gutter {
      cursor: col-resize;
      width: 6px;
    }

    ::ng-deep .app-split-layout__splitter[layout='vertical'] .p-splitter-gutter {
      cursor: row-resize;
      height: 6px;
    }
  `],
})
export class SplitLayoutComponent {
  panelSizes = input<number[]>([35, 65]);
  layout = input<SplitLayoutDirection>('horizontal');

  /**
   * Derived minimums so panelSizes and minSizes can never contradict
   * each other, regardless of what panelSizes the consumer passes.
   * Each minimum is ~2/3 of its panel's requested size, floored at 10,
   * so a panel always has room to shrink but never starts below its
   * own constraint.
   */
  protected minSizes = computed(() => {
    return this.panelSizes().map(size => Math.max(10, Math.floor(size * 0.6)));
  });
}
// // src/app/shared/ui/layout/split-layout.component.ts
// import { Component, ChangeDetectionStrategy, input } from '@angular/core';
// import { SplitterModule } from 'primeng/splitter';

// @Component({
//   selector: 'app-split-layout',
//   standalone: true,
//   imports: [SplitterModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   host: { class: 'block w-full h-full min-h-[500px]' },
//   template: `
//     <p-splitter 
//       [panelSizes]="panelSizes()" 
//       [minSizes]="[20, 30]"
//       [layout]="layout()"
//       class="border-none bg-transparent h-full">
//       <ng-template pTemplate>
//         <div class="h-full w-full pr-[var(--spacing-md)] overflow-y-auto">
//           <ng-content select="[master]"></ng-content>
//         </div>
//       </ng-template>
//       <ng-template pTemplate>
//         <div class="h-full w-full pl-[var(--spacing-md)] overflow-y-auto">
//           <ng-content select="[detail]"></ng-content>
//         </div>
//       </ng-template>
//     </p-splitter>
//   `
// })
// export class SplitLayoutComponent {
//   panelSizes = input<number[]>([35, 65]);
//   layout = input<'horizontal' | 'vertical'>('horizontal');
// }
