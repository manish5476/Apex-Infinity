import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/**
 * Component: app-empty-state
 * Purpose: Standardized view when no data is available.
 * Inputs: icon (string), title (string), description (string), actionLabel (string)
 * Outputs: action (EventEmitter)
 * Used By: Global
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center p-8 md:p-12 text-center w-full bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
      <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <i [class]="icon() + ' text-3xl'"></i>
      </div>
      <h3 class="text-lg font-semibold text-slate-900 mb-1 tracking-tight">{{ title() }}</h3>
      <p class="text-sm text-slate-500 max-w-sm mb-6">{{ description() }}</p>
      
      @if (actionLabel()) {
        <p-button [label]="actionLabel()!" [icon]="actionIcon()" (onClick)="action.emit()" styleClass="p-button-primary p-button-sm"></p-button>
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
