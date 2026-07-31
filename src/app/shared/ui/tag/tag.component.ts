// src/app/shared/ui/tag/tag.component.ts
import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { StatusSeverity, BadgeVariant, getSeverityColorClasses } from '../badge/severity-tokens';

/**
 * Component: app-tag
 * Purpose: Removable/static categorical chip for entity metadata and active filter badges.
 * Shares its color system with app-status-badge via severity-tokens.ts.
 */
@Component({
  selector: 'app-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (icon()) {
      <i [class]="icon() + ' text-[11px] opacity-80'"></i>
    }
    <span class="truncate">
      @if (value()) { {{ value() }} } @else { <ng-content></ng-content> }
    </span>
    @if (removable()) {
      <button
        type="button"
        class="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full hover:bg-black/10 dark:hover:bg-white/15 transition-colors -mr-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        aria-label="Remove tag"
        (click)="remove.emit()">
        <i class="pi pi-times text-[9px]"></i>
      </button>
    }
  `,
})
export class TagComponent {
  value = input<string>('');
  severity = input<StatusSeverity>('neutral');
  variant = input<BadgeVariant>('subtle');
  removable = input<boolean>(false);
  icon = input<string>('');

  remove = output<void>();

  protected hostClasses = computed(() => {
    const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--ui-border-radius-sm)] text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)] border transition-[var(--transition-fast)] whitespace-nowrap select-none';
    return `${base} ${getSeverityColorClasses(this.severity(), this.variant())}`;
  });
}