import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Form Modules
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputMaskModule } from 'primeng/inputmask';
import { InputOtpModule } from 'primeng/inputotp';
// import { InputTagsModule } from 'primeng/inputtags';
// import { InputColorModule } from 'primeng/inputcolor';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { RatingModule } from 'primeng/rating';
import { SliderModule } from 'primeng/slider';
import { KnobModule } from 'primeng/knob';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

// Custom Shared Components
import { GridColumn } from '../grid-types';
import { StatusBadgeComponent } from '../../badge/status-badge.component';
import { AvatarComponent } from '../../media/avatar.component';

@Component({
  selector: 'app-grid-cell',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    InputTextModule, InputNumberModule, InputMaskModule, InputOtpModule, //InputTagsModule, InputColorModule,
    TextareaModule, SelectModule, SelectButtonModule, AutoCompleteModule, DatePickerModule,
    CheckboxModule, ToggleSwitchModule, ToggleButtonModule, RatingModule, SliderModule, KnobModule,
    TagModule, TooltipModule, StatusBadgeComponent, AvatarComponent,
    CurrencyPipe, DatePipe, DecimalPipe, PercentPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full h-full' },
  template: `
    <div class="flex items-center w-full h-full min-h-[32px]">
      
      <!-- ========================================== -->
      <!-- EDITOR MODE                                -->
      <!-- ========================================== -->
      @if (isEditing() && column().editable !== false && !column().readOnly) {
        
        @switch (column().type) {
          
          @case ('number') {
            <p-inputNumber 
              [(ngModel)]="rowData()[column().field]" 
              [minFractionDigits]="column().minFractionDigits ?? 0"
              [maxFractionDigits]="column().maxFractionDigits ?? 2"
              [min]="column().min ?? null" 
              [max]="column().max ?? null"
              class="w-full" styleClass="w-full p-inputtext-sm">
            </p-inputNumber>
          }

          @case ('currency') {
            <p-inputNumber 
              [(ngModel)]="rowData()[column().field]" 
              mode="currency" 
              [currency]="column().currencyCode ?? 'USD'"
              class="w-full" styleClass="w-full p-inputtext-sm">
            </p-inputNumber>
          }

          @case ('mask') {
            <p-inputMask 
              [(ngModel)]="rowData()[column().field]" 
              [mask]="column().maskPattern || '999-99-9999'" 
              [slotChar]="column().slotChar || '_'" 
              [placeholder]="column().placeholder || ''"
              styleClass="w-full p-inputtext-sm">
            </p-inputMask>
          }

          @case ('otp') {
            <p-inputOtp [(ngModel)]="rowData()[column().field]" [mask]="true"></p-inputOtp>
          }

          @case ('tags') {
            <p-inputtags 
              [(ngModel)]="rowData()[column().field]" 
              [max]="column().maxTags" 
              styleClass="w-full p-inputtext-sm">
            </p-inputtags>
          }

          @case ('color') {
            <div class="flex items-center justify-center w-full">
               <p-inputcolor [(ngModel)]="rowData()[column().field]" [format]="column().colorFormat || 'hex'"></p-inputcolor>
            </div>
          }

          @case ('select') {
            <p-select 
              [options]="column().options ?? []" 
              [(ngModel)]="rowData()[column().field]" 
              appendTo="body" 
              [placeholder]="column().placeholder || 'Select...'"
              class="w-full" styleClass="w-full p-inputtext-sm">
            </p-select>
          }

          @case ('selectbutton') {
            <p-selectbutton 
              [options]="column().options ?? []" 
              [(ngModel)]="rowData()[column().field]" 
              optionLabel="label" optionValue="value">
            </p-selectbutton>
          }

          @case ('date') {
            <p-datepicker 
              [(ngModel)]="rowData()[column().field]" 
              appendTo="body" 
              [dateFormat]="column().dateFormat ?? 'yy-mm-dd'"
              [timeOnly]="column().timeOnly || false"
              [showTime]="column().showTime || false"
              [selectionMode]="column().selectionMode || 'single'"
              class="w-full" styleClass="w-full p-inputtext-sm">
            </p-datepicker>
          }

          @case ('boolean') {
            <p-checkbox [(ngModel)]="rowData()[column().field]" [binary]="true"></p-checkbox>
          }

          @case ('toggleswitch') {
            <p-toggleswitch [(ngModel)]="rowData()[column().field]"></p-toggleswitch>
          }

          @case ('togglebutton') {
            <p-togglebutton 
              [(ngModel)]="rowData()[column().field]" 
              [onLabel]="column().onLabel || 'On'" 
              [offLabel]="column().offLabel || 'Off'">
            </p-togglebutton>
          }

          @case ('slider') {
            <div class="w-full px-2">
              <p-slider [(ngModel)]="rowData()[column().field]" [min]="column().min || 0" [max]="column().max || 100" [step]="column().step || 1"></p-slider>
            </div>
          }

          @case ('knob') {
            <div class="flex justify-center w-full">
               <p-knob [(ngModel)]="rowData()[column().field]" [size]="40" [min]="column().min || 0" [max]="column().max || 100" [step]="column().step || 1"></p-knob>
            </div>
          }

          @case ('rating') {
            <p-rating [(ngModel)]="rowData()[column().field]" [cancel]="false"></p-rating>
          }

          @default {
            <input pInputText [(ngModel)]="rowData()[column().field]" type="text" [placeholder]="column().placeholder || ''" class="w-full p-inputtext-sm" />
          }
        }

      } 
      <!-- ========================================== -->
      <!-- VIEW MODE                                  -->
      <!-- ========================================== -->
      @else {
        
        @switch (column().type) {
          
          @case ('user') {
            <div class="flex items-center gap-3">
              <app-avatar [imageUrl]="rowData()[column().field + 'Avatar']" [name]="rowData()[column().field] || 'Unknown'" size="sm"></app-avatar>
              <span class="font-[var(--font-weight-semibold)] text-[var(--text-primary)] text-[length:var(--font-size-sm)]">{{ rowData()[column().field] }}</span>
            </div>
          }

          @case ('badge') {
            <app-status-badge [status]="rowData()[column().field]" variant="subtle" size="sm"></app-status-badge>
          }

          @case ('color') {
            @if (rowData()[column().field]) {
              <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full border border-[var(--border-secondary)] shadow-sm" [style.backgroundColor]="rowData()[column().field]"></span>
                <span class="font-mono text-[10px] text-[var(--text-secondary)] uppercase">{{ rowData()[column().field] }}</span>
              </div>
            } @else { <span class="text-[var(--text-tertiary)]">—</span> }
          }

          @case ('tags') {
            <div class="flex flex-wrap gap-1">
              @for (tag of (rowData()[column().field] || []).slice(0, column().maxTags || 3); track tag) {
                <span class="px-2 py-0.5 bg-[var(--bg-ternary)] text-[var(--text-secondary)] text-[10px] rounded-full font-medium border border-[var(--border-secondary)]">{{ tag }}</span>
              }
              @if ((rowData()[column().field] || []).length > (column().maxTags || 3)) {
                <span class="px-2 py-0.5 bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-[10px] rounded-full">+{{ rowData()[column().field].length - (column().maxTags || 3) }}</span>
              }
            </div>
          }

          @case ('currency') {
            <span class="font-mono font-medium" [class.text-[var(--color-error)]]="rowData()[column().field] < 0">
              {{ rowData()[column().field] | currency:(column().currencyCode || 'USD'):'symbol':'1.2-2' }}
            </span>
          }

          @case ('percentage') {
            <span class="font-mono font-medium">{{ rowData()[column().field] / 100 | percent:'1.1-2' }}</span>
          }

          @case ('slider') {
            <div class="w-full flex items-center gap-2">
               <div class="flex-1 h-1.5 bg-[var(--border-secondary)] rounded-full overflow-hidden">
                 <div class="h-full bg-[var(--accent-primary)]" [style.width.%]="rowData()[column().field]"></div>
               </div>
               <span class="text-[10px] font-mono text-[var(--text-secondary)]">{{ rowData()[column().field] || 0 }}%</span>
            </div>
          }

          @case ('date') {
            <span class="text-[var(--text-secondary)] text-[length:var(--font-size-sm)]">
              <i class="pi pi-calendar text-xs mr-1 opacity-70"></i> 
              {{ rowData()[column().field] | date:(column().dateFormat || 'mediumDate') }}
            </span>
          }

          @case ('boolean') {
          <!-- Handles both standard boolean, toggleswitch, and togglebutton beautifully in view mode -->
            <i class="pi" 
               [class.pi-check-circle]="rowData()[column().field]" 
               [class.text-[var(--color-success)]]="rowData()[column().field]" 
               [class.pi-minus-circle]="!rowData()[column().field]" 
               [class.text-[var(--text-tertiary)]]="!rowData()[column().field]">
            </i>
          }

          @case ('toggleswitch') {
             <!-- Alternative read-only view for a toggle switch -->
             <p-toggleswitch [ngModel]="rowData()[column().field]" [disabled]="true"></p-toggleswitch>
          }

          @case ('email') {
            <a [href]="'mailto:' + rowData()[column().field]" class="text-[var(--link-color)] hover:underline flex items-center gap-1 text-[length:var(--font-size-sm)]">
              <i class="pi pi-envelope text-xs opacity-70"></i> {{ rowData()[column().field] }}
            </a>
          }

          @case ('rating') {
            <p-rating [ngModel]="rowData()[column().field]" [readonly]="true" [cancel]="false"></p-rating>
          }

          @default {
            <span class="text-[length:var(--font-size-sm)] text-[var(--text-primary)] truncate block w-full" [pTooltip]="rowData()[column().field]">
              {{ rowData()[column().field] || '—' }}
            </span>
          }
        }
      }
    </div>
  `
})
export class GridCellComponent {
  column = input.required<GridColumn>();
  rowData = input.required<any>();
  isEditing = input<boolean>(false);
}