import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { GridDensity } from '../grid-types';

/**
 * Component: app-grid-loading
 * Animated skeleton loader that mirrors the grid's column layout.
 * Row count and density match the grid so the layout does not jump on load.
 */
@Component({
  selector: 'app-grid-loading',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full" role="status" aria-label="Loading data…">
      @for (row of skeletonRows(); track $index) {
        <div class="flex items-center border-b border-[var(--border-secondary)]"
             [class]="rowClass()">
          <!-- Checkbox skeleton -->
          <div class="w-12 shrink-0 flex items-center justify-center px-3">
            <div class="w-4 h-4 rounded-[4px] apex-dg-skeleton"></div>
          </div>
          <!-- Column skeletons -->
          @for (col of columnWidths(); track $index) {
            <div class="flex-1 px-3" [style.max-width]="col">
              <div class="h-3 rounded-full apex-dg-skeleton"
                   [style.width]="randomWidth()"></div>
            </div>
          }
          <!-- Actions skeleton -->
          <div class="w-24 shrink-0 flex items-center justify-end gap-1 px-3">
            <div class="w-6 h-6 rounded-[var(--ui-border-radius-sm)] apex-dg-skeleton"></div>
            <div class="w-6 h-6 rounded-[var(--ui-border-radius-sm)] apex-dg-skeleton"></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .apex-dg-skeleton {
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--text-tertiary) 10%, transparent) 25%,
        color-mix(in srgb, var(--text-tertiary) 20%, transparent) 50%,
        color-mix(in srgb, var(--text-tertiary) 10%, transparent) 75%
      );
      background-size: 200% 100%;
      animation: apex-skeleton-shimmer 1.5s infinite;
    }
    @keyframes apex-skeleton-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class GridLoadingComponent {
  rowCount  = input<number>(8);
  density   = input<GridDensity>('compact');
  colWidths = input<string[]>([]);

  protected skeletonRows(): number[] {
    return Array.from({ length: this.rowCount() }, (_, i) => i);
  }

  protected columnWidths(): string[] {
    const w = this.colWidths();
    return w.length ? w : ['180px', '200px', '140px', '120px'];
  }

  protected rowClass(): string {
    const map: Record<GridDensity, string> = {
      compact:     'h-9',
      normal:      'h-11',
      comfortable: 'h-14',
    };
    return map[this.density()];
  }

  /** Returns a pseudo-random percentage width for variety in skeleton rows */
  protected randomWidth(): string {
    // deterministic "random" per column for stable renders
    const pcts = ['45%', '70%', '55%', '80%', '60%', '35%', '75%', '50%'];
    return pcts[Math.floor(Math.random() * pcts.length)];
  }
}
