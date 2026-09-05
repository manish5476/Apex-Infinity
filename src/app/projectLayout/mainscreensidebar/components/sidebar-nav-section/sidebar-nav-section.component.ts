import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavGroup } from '../../navigation-model';
import { SidebarNavItemComponent } from '../sidebar-nav-item/sidebar-nav-item.component';

/**
 * SidebarNavSectionComponent
 *
 * Renders one navigation group with a modern uppercase category header,
 * item count, and toggle collapse.
 */
@Component({
  selector: 'app-sidebar-nav-section',
  standalone: true,
  imports: [CommonModule, SidebarNavItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-2.5">
      @if (!isMini() && group().groupLabel) {
        <button
          type="button"
          (click)="toggleGroup()"
          class="flex items-center justify-between w-full px-3 py-1.5 text-[10.5px] font-bold tracking-wider text-[var(--text-tertiary)] uppercase select-none hover:text-[var(--text-primary)] transition-colors group cursor-pointer focus:outline-none"
        >
          <span class="truncate">{{ group().groupLabel }} · {{ group().items.length }}</span>
          <i
            class="pi pi-chevron-down text-[9px] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-transform duration-200 shrink-0"
            [class.rotate-180]="isGroupCollapsed()"
          ></i>
        </button>
      } @else if (isMini()) {
        <div class="my-2 border-t border-[var(--border-secondary)] mx-2"></div>
      }

      <!-- Items Container -->
      <div
        class="space-y-[2px] transition-all duration-300 ease-in-out overflow-hidden"
        [class.max-h-0]="!isMini() && isGroupCollapsed()"
        [class.max-h-[2000px]]="isMini() || !isGroupCollapsed()"
      >
        @for (item of group().items; track item.label) {
          <app-sidebar-nav-item
            [item]="item"
            [isMini]="isMini()"
            [expandedKeys]="expandedKeys()"
            [activeParentLabels]="activeParentLabels()"
            (toggle)="toggle.emit($event)"
          />
        }
      </div>
    </div>
  `,
})
export class SidebarNavSectionComponent {
  group = input.required<NavGroup>();
  isMini = input<boolean>(false);
  expandedKeys = input<Set<string>>(new Set<string>());
  activeParentLabels = input<Set<string>>(new Set<string>());

  toggle = output<string>();

  isGroupCollapsed = signal<boolean>(false);

  toggleGroup(): void {
    this.isGroupCollapsed.update(v => !v);
  }
}
