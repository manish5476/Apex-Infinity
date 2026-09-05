import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridDensity } from '../grid-types';

@Component({
  selector: 'app-grid-loading',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full h-full' },
  template: `
    <div class="w-full h-full flex flex-col" role="status" aria-label="Loading data...">
      @for (row of skeletonRows(); track $index) {
        <div class="flex items-center border-b border-[var(--border-secondary)] px-4" [style.height.px]="rowHeight()">
          
          <!-- Checkbox Skeleton -->
          <div class="w-12 shrink-0 flex items-center justify-center">
            <div class="w-4 h-4 rounded-[4px] apex-dg-skeleton"></div>
          </div>
          
          <!-- Sr No Skeleton -->
          <div class="w-12 shrink-0 flex items-center justify-center">
            <div class="w-6 h-2.5 rounded-full apex-dg-skeleton"></div>
          </div>

          <!-- Column Skeletons -->
          <div class="flex-1 flex items-center gap-6 px-4 overflow-hidden">
            @for (col of columnWidths(); track $index) {
              <div class="h-2.5 rounded-full apex-dg-skeleton" 
                   [style.width]="col" 
                   [style.max-width]="randomWidth()">
              </div>
            }
          </div>

          <!-- Actions Skeleton -->
          <div class="w-20 shrink-0 flex items-center justify-end gap-2">
            <div class="w-6 h-6 rounded-full apex-dg-skeleton"></div>
            <div class="w-6 h-6 rounded-full apex-dg-skeleton"></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .apex-dg-skeleton {
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--border-secondary) 40%, transparent) 25%,
        color-mix(in srgb, var(--border-secondary) 80%, transparent) 50%,
        color-mix(in srgb, var(--border-secondary) 40%, transparent) 75%
      );
      background-size: 200% 100%;
      animation: apex-skeleton-shimmer 1.5s infinite linear;
    }
    @keyframes apex-skeleton-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class GridLoadingComponent {
  rowCount = input<number>(15);
  density = input<GridDensity>('compact');
  colWidths = input<(string | number)[]>([]);

  protected skeletonRows = computed(() => Array.from({ length: this.rowCount() }, (_, i) => i));

  protected columnWidths = computed(() => {
    const w = this.colWidths();
    return w.length
      ? w.map(width => (typeof width === 'number' ? `${width}px` : String(width)))
      : ['180px', '200px', '140px', '120px', '100px'];
  });

  protected rowHeight = computed(() => {
    switch (this.density()) {
      case 'comfortable': return 56;
      case 'normal': return 44;
      case 'compact': default: return 36;
    }
  });

  // Generates stable but random-looking widths for the text skeletons
  protected randomWidth(): string {
    const pcts = ['45%', '70%', '55%', '80%', '60%', '35%', '75%', '50%'];
    return pcts[Math.floor(Math.random() * pcts.length)];
  }
}