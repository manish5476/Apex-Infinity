import { Component, ChangeDetectionStrategy, input, output, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridColumn } from '../grid-types';

interface ColumnToggle {
  field: string;
  header: string;
  visible: boolean;
  hideable: boolean;
  sticky?: 'left' | 'right' | false;
}

@Component({
  selector: 'app-grid-column-manager',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block absolute right-4 z-[500] origin-top-right',
    style: 'top: 52px;'
  },
  template: `
    <div class="w-[280px] bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-[var(--ui-border-radius-lg)] shadow-[var(--elevation-3)] overflow-hidden flex flex-col animate-[apex-pop-in_0.15s_ease-out]" (click)="$event.stopPropagation()">
      
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
        <span class="text-[length:var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] flex items-center gap-2">
          <i class="pi pi-table text-[var(--accent-primary)] text-[13px]"></i>
          Manage Columns
        </span>
        <button type="button" (click)="close.emit()" class="w-6 h-6 flex items-center justify-center rounded-[var(--ui-border-radius-sm)] text-[var(--text-tertiary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)] hover:text-[var(--text-primary)] transition-colors outline-none">
          <i class="pi pi-times text-xs"></i>
        </button>
      </div>

      <!-- Search -->
      <div class="p-3 border-b border-[var(--border-secondary)]">
        <div class="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-[var(--ui-border-radius-sm)] focus-within:border-[var(--accent-primary)] focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)] transition-all">
          <i class="pi pi-search text-[11px] text-[var(--text-tertiary)]"></i>
          <input type="text" placeholder="Find column..." class="flex-1 bg-transparent border-none outline-none text-[length:var(--font-size-xs)] text-[var(--text-primary)]" (input)="searchQuery.set($any($event.target).value)">
        </div>
      </div>

      <!-- Column List -->
      <div class="flex-1 overflow-y-auto max-h-[320px] p-2 custom-scrollbar relative">
        @for (col of filteredColumns(); track col.field; let idx = $index) {
          <div class="flex items-center gap-3 px-3 py-2 rounded-[var(--ui-border-radius-sm)] group hover:bg-[var(--component-bg-hover)] transition-colors cursor-grab active:cursor-grabbing"
               [class.opacity-50]="!col.hideable && !col.visible"
               draggable="true"
               (dragstart)="onDragStart($event, idx)"
               (dragover)="onDragOver($event, idx)"
               (dragend)="onDragEnd()"
               (drop)="onDrop($event, idx)"
               [class.border-t-2]="dragTargetIndex === idx && dragTargetIndex < dragSourceIndex"
               [class.border-b-2]="dragTargetIndex === idx && dragTargetIndex > dragSourceIndex"
               [class.border-[var(--accent-primary)]]="dragTargetIndex === idx">
            
            <i class="pi pi-bars text-[10px] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"></i>
            
            <!-- Custom Toggle Switch -->
            <label class="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" class="sr-only peer" [checked]="col.visible" [disabled]="!col.hideable && col.visible" (change)="onToggle(col.field, $any($event.target).checked)">
              <div class="w-7 h-4 bg-[var(--border-secondary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
            </label>

            <span class="flex-1 text-[length:var(--font-size-xs)] text-[var(--text-primary)] font-[var(--font-weight-medium)] truncate select-none">
              {{ col.header }}
            </span>

            <!-- Sticky Pins -->
            <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" class="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--bg-secondary)]" 
                      [class.text-[var(--accent-primary)]]="col.sticky === 'left'"
                      [class.text-[var(--text-tertiary)]]="col.sticky !== 'left'"
                      (click)="onPin(col.field, col.sticky === 'left' ? false : 'left')" title="Pin Left">
                <i class="pi pi-angle-double-left text-[10px]"></i>
              </button>
              <button type="button" class="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--bg-secondary)]"
                      [class.text-[var(--accent-primary)]]="col.sticky === 'right'"
                      [class.text-[var(--text-tertiary)]]="col.sticky !== 'right'"
                      (click)="onPin(col.field, col.sticky === 'right' ? false : 'right')" title="Pin Right">
                <i class="pi pi-angle-double-right text-[10px]"></i>
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Footer -->
      <div class="px-4 py-3 border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)] flex items-center justify-between">
        <span class="text-[10px] font-[var(--font-weight-medium)] text-[var(--text-tertiary)]">
          {{ visibleCount() }} of {{ toggles().length }} visible
        </span>
        <button type="button" class="text-[11px] font-[var(--font-weight-semibold)] text-[var(--accent-primary)] hover:underline outline-none" (click)="reset()">
          Reset to Default
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes apex-pop-in {
      from { opacity: 0; transform: scale(0.95) translateY(-10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
  `]
})
export class GridColumnManagerComponent {
  columns = input<GridColumn[]>([]);
  visibleColumns = input<string[]>([]);

  visibilityChange = output<string[]>();
  pinChange = output<{ field: string; sticky: 'left' | 'right' | false }>();
  close = output<void>();

  searchQuery = signal('');

  // Re-syncs the toggles list in the exact order currently saved in state
  toggles = computed<ColumnToggle[]>(() => {
    const all = this.columns();
    const vis = this.visibleColumns();

    // Maintain visual order: Visible items in specified order, then hidden items
    const orderedVis = vis.map(v => all.find(c => c.field === v)).filter(Boolean) as GridColumn[];
    const hidden = all.filter(c => !vis.includes(c.field));
    const combined = [...orderedVis, ...hidden];

    return combined.map(col => ({
      field: col.field,
      header: col.header ?? col.field ?? 'Column',
      visible: vis.includes(col.field),
      hideable: col.hideable !== false,
      sticky: col.sticky,
    }));
  });

  filteredColumns = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.toggles().filter(c => !q || c.header.toLowerCase().includes(q));
  });

  visibleCount = computed(() => this.toggles().filter(c => c.visible).length);

  // --- Drag and Drop State ---
  dragSourceIndex: number = -1;
  dragTargetIndex: number = -1;

  onDragStart(event: DragEvent, index: number): void {
    this.dragSourceIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      // Set a ghost image or text payload if needed
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault(); // Necessary to allow dropping
    this.dragTargetIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDragEnd(): void {
    this.dragSourceIndex = -1;
    this.dragTargetIndex = -1;
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    if (this.dragSourceIndex === -1 || this.dragSourceIndex === dropIndex) {
      this.onDragEnd();
      return;
    }

    // Reorder the backing array
    const combined = [...this.toggles()];
    const [movedItem] = combined.splice(this.dragSourceIndex, 1);
    combined.splice(dropIndex, 0, movedItem);

    // Filter out only the visible ones to emit the new order
    const newVis = combined.filter(c => c.visible).map(c => c.field);
    this.visibilityChange.emit(newVis);

    this.onDragEnd();
  }

  // --- Interactions ---
  onToggle(field: string, visible: boolean): void {
    // We preserve the order of the current toggles list to prevent it jumping to the bottom
    const currentOrder = this.toggles().map(t => t.field);
    const newVisSet = new Set(this.visibleColumns());

    visible ? newVisSet.add(field) : newVisSet.delete(field);

    // Sort the new array based on the existing `currentOrder` so it doesn't shift positions wildly
    const finalVis = currentOrder.filter(f => newVisSet.has(f));
    this.visibilityChange.emit(finalVis);
  }

  reset(): void {
    // Reset to the original columns array order
    const defaults = this.columns()
      .filter(c => c.visible !== false)
      .map(c => c.field);
    this.visibilityChange.emit(defaults);
  }

  onPin(field: string, sticky: 'left' | 'right' | false): void {
    this.pinChange.emit({ field, sticky });
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.close.emit();
  }
}
