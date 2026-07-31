// src/app/shared/ui/feedback/empty-state.component.ts
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <div class="flex flex-col items-center justify-center p-[var(--spacing-5xl)] text-center w-full bg-[var(--bg-secondary)] rounded-[var(--ui-border-radius-lg)] border border-dashed border-[var(--border-secondary)]">
      <div class="w-16 h-16 rounded-[var(--ui-border-radius-pill)] bg-[var(--bg-ternary)] flex items-center justify-center text-[var(--text-secondary)] mb-[var(--spacing-xl)]">
        <i [class]="icon() + ' text-[length:var(--font-size-3xl)]'"></i>
      </div>
      <h3 class="text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-[var(--spacing-xs)] tracking-tight">
        {{ title() }}
      </h3>
      <p class="text-[length:var(--font-size-sm)] text-[var(--text-secondary)] max-w-sm mb-[var(--spacing-3xl)]">
        {{ description() }}
      </p>
      
      @if (actionLabel()) {
        <p-button 
          [label]="actionLabel()!" 
          [icon]="actionIcon()" 
          (onClick)="action.emit()" 
          styleClass="p-button-primary p-button-sm">
        </p-button>
      }
      <ng-content></ng-content>
    </div>
  `
})
export class EmptyStateComponent {
  icon = input<string>('pi pi-folder-open');
  title = input<string>('No records found');
  description = input<string>('There is no data available to display at this time.');
  actionLabel = input<string>();
  actionIcon = input<string>('');

  action = output<void>();
}
