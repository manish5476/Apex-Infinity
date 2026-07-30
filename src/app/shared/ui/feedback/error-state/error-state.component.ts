import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/**
 * Component: app-error-state
 * Purpose: Standardized view for error boundaries or failed data loads.
 * Inputs: title (string), description (string), retryLabel (string)
 * Outputs: retry (EventEmitter)
 * Used By: Global
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center p-8 md:p-12 text-center w-full bg-red-50/50 rounded-xl border border-dashed border-red-200">
      <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4">
        <i class="pi pi-exclamation-triangle text-3xl"></i>
      </div>
      <h3 class="text-lg font-semibold text-red-900 mb-1 tracking-tight">{{ title() }}</h3>
      <p class="text-sm text-red-600 max-w-sm mb-6">{{ description() }}</p>
      
      @if (retryLabel()) {
        <p-button [label]="retryLabel()!" icon="pi pi-refresh" (onClick)="retry.emit()" styleClass="p-button-danger p-button-outlined p-button-sm"></p-button>
      }
      <ng-content></ng-content>
    </div>
  `
})
export class ErrorStateComponent {
  title = input<string>('Something went wrong');
  description = input<string>('An unexpected error occurred while loading this data. Please try again.');
  retryLabel = input<string>('Retry');
  
  retry = output<void>();
}
