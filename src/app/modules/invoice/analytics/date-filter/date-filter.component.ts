import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';

import { MasterListService } from '../../../../core/services/master-list.service';

@Component({
  selector: 'app-date-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule],
  template: `
    <div class="date-filter-container">
      
      <div class="filter-group">
        <label class="filter-label">Start Date</label>
        <div class="input-wrapper">
          <p-datepicker [(ngModel)]="startDate" (onSelect)="onDateChange()" [showIcon]="true" iconDisplay="input" placeholder="Start Date" dateFormat="yy-mm-dd" appendTo="body" styleClass="w-full"></p-datepicker>
        </div>
      </div>

      <div class="filter-group">
        <label class="filter-label">End Date</label>
        <div class="input-wrapper">
          <p-datepicker [(ngModel)]="endDate" (onSelect)="onDateChange()" [showIcon]="true" iconDisplay="input" placeholder="End Date" dateFormat="yy-mm-dd" appendTo="body" styleClass="w-full"></p-datepicker>
        </div>
      </div>


      <button class="reset-btn" (click)="resetDates()" title="Reset Date Range">
        <i class="pi pi-refresh"></i>
      </button>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .date-filter-container {
      display: flex;
      align-items: flex-end;
      gap: var(--spacing-md);
      
      /* Container Styling matching Inputs */
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-sm) var(--spacing-md);
    }

    .filter-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .filter-label {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      color: var(--text-tertiary);
      letter-spacing: 0.5px;
      margin-left: 2px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    /* Customizing Native Date Input to match PrimeNG */
    .theme-date-input {
      width: 100%;
      background: var(--bg-primary); /* Solid bg vs container */
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      color: var(--text-primary);
      
      /* Typography */
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      
      /* Sizing - Matches your global input height */
      height: 2.25rem; 
      padding: 0 var(--spacing-sm);
      
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;

      /* Dark Mode Calendar Icon Fix */
      color-scheme: light dark; 

      &:hover {
        border-color: var(--border-secondary);
        background: var(--component-bg-hover);
      }

      &:focus {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px var(--accent-primary);
      }
      
      /* Placeholder styling */
      &::-webkit-datetime-edit-fields-wrapper { padding: 0; }
      &::-webkit-calendar-picker-indicator {
        cursor: pointer;
        opacity: 0.6;
        filter: invert(var(--icon-invert)); /* CSS Var for Dark mode flip if needed */
        transition: opacity 0.2s;
        
        &:hover { opacity: 1; }
      }
    }

    /* Reset Button - Styled as Icon Only Secondary */
    .reset-btn {
      height: 2.25rem;
      width: 2.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      
      background: var(--bg-ternary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      color: var(--text-secondary);
      
      cursor: pointer;
      transition: all 0.2s ease;
      
      i { font-size: 0.9rem; }

      &:hover {
        background: var(--component-bg-hover);
        color: var(--text-primary);
        border-color: var(--border-secondary);
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }

      &:active {
        transform: translateY(0);
      }
    }
  `]
})
export class DateFilterComponent {
  @Input() startDate?: string | Date;
  @Input() endDate?: string | Date;

  @Output() dateChange = new EventEmitter<any>();
  public  masterList = inject(MasterListService);

  onDateChange(): void {
    const start = this.startDate instanceof Date ? this.startDate.toISOString().split('T')[0] : this.startDate;
    const end = this.endDate instanceof Date ? this.endDate.toISOString().split('T')[0] : this.endDate;
    this.dateChange.emit({
      startDate: start,
      endDate: end
    });
  }


  resetDates(): void {
    this.startDate = undefined;
    this.endDate = undefined;
    this.onDateChange();
  }

}