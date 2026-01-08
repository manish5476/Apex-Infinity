// components/date-filter/date-filter.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="date-filter">
      <div class="filter-row">
        <div class="filter-group">
          <label>Start Date</label>
          <input type="date" [(ngModel)]="startDate" (change)="onDateChange()">
        </div>
        <div class="filter-group">
          <label>End Date</label>
          <input type="date" [(ngModel)]="endDate" (change)="onDateChange()">
        </div>
        <button class="btn btn-secondary" (click)="resetDates()">Reset</button>
      </div>
    </div>
  `,
  styles: [`
    .date-filter {
      background: white;
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
      box-shadow: var(--shadow-sm);
    }

    .filter-row {
      display: flex;
      gap: var(--spacing-lg);
      align-items: flex-end;
    }

    .filter-group {
      flex: 1;
    }

    label {
      display: block;
      font-size: var(--font-size-sm);
      color: #64748b;
      margin-bottom: var(--spacing-xs);
    }

    input[type="date"] {
      width: 100%;
      padding: var(--spacing-md);
      border: 1px solid #cbd5e1;
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-sm);
      transition: var(--transition-base);
    }

    input[type="date"]:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px var(--focus-ring-color);
    }

    .btn {
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: var(--transition-base);
      border: 1px solid #cbd5e1;
      background: white;
      color: #334155;
    }

    .btn:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      box-shadow: var(--shadow-sm);
    }
  `]
})
export class DateFilterComponent {
  @Input() startDate?: string;
  @Input() endDate?: string;
  @Output() dateChange = new EventEmitter<any>();

  onDateChange(): void {
    this.dateChange.emit({
      startDate: this.startDate,
      endDate: this.endDate
    });
  }

  resetDates(): void {
    this.startDate = '';
    this.endDate = '';
    this.onDateChange();
  }
}