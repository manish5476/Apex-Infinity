// src/app/shared/ui/feedback/error-state.component.ts
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <div class="flex flex-col items-center justify-center p-[var(--spacing-5xl)] text-center w-full bg-[var(--color-error-bg)] rounded-[var(--ui-border-radius-lg)] border border-dashed border-[var(--color-error-border)]">
      <div class="w-16 h-16 rounded-[var(--ui-border-radius-pill)] bg-[var(--color-error-light)] flex items-center justify-center text-[var(--color-error)] mb-[var(--spacing-xl)]">
        <i class="pi pi-exclamation-triangle text-[length:var(--font-size-3xl)]"></i>
      </div>
      <h3 class="text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--color-error)] mb-[var(--spacing-xs)] tracking-tight">
        {{ title() }}
      </h3>
      <p class="text-[length:var(--font-size-sm)] text-[var(--color-error-dark)] max-w-sm mb-[var(--spacing-3xl)]">
        {{ description() }}
      </p>
      
      @if (retryLabel()) {
        <p-button 
          [label]="retryLabel()!" 
          icon="pi pi-refresh" 
          (onClick)="retry.emit()" 
          styleClass="p-button-danger p-button-outlined p-button-sm">
        </p-button>
      }
    </div>
  `
})
export class ErrorStateComponent {
  title = input<string>('Something went wrong');
  description = input<string>('An unexpected error occurred while loading this data. Please try again.');
  retryLabel = input<string>('Retry');

  retry = output<void>();
}

