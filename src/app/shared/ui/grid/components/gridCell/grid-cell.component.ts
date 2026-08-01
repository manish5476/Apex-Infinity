import {
  Component, ChangeDetectionStrategy, input, output,
  signal, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Form Modules
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputMaskModule } from 'primeng/inputmask';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { RatingModule } from 'primeng/rating';
import { SliderModule } from 'primeng/slider';
import { TooltipModule } from 'primeng/tooltip';
import { StatusBadgeComponent } from '@shared/ui/badge/status-badge.component';
import { AvatarComponent } from '@shared/ui/media/avatar.component';
import { GridColumn, GridCellChangeEvent } from '../../grid-types';


@Component({
  selector: 'app-grid-cell',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    InputTextModule, InputNumberModule, InputMaskModule, ColorPickerModule,
    TextareaModule, SelectModule, AutoCompleteModule, DatePickerModule,
    CheckboxModule, ToggleSwitchModule, ToggleButtonModule, RatingModule, SliderModule,
    TooltipModule, StatusBadgeComponent, AvatarComponent,
    CurrencyPipe, PercentPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grid-cell.component.html',
  styleUrls: ['./grid-cell.component.scss'],
  host: { class: 'block w-full h-full' }
})
export class GridCellComponent implements OnChanges {
  rowData = input.required<any>();
  column = input.required<GridColumn>();
  isEditing = input<boolean>(false);

  cellChange = output<GridCellChangeEvent>();

  // Local mutable state strictly for the UI control binding
  editValue = signal<any>(null);
  private previousValue: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isEditing'] && this.isEditing()) {
      this.previousValue = this.rowData()[this.column().field];
      this.editValue.set(this.previousValue);
    }
  }

  onValueChange(newValue: any): void {
    // We update our local signal for UI responsiveness
    this.editValue.set(newValue);

    // IMMUTABLE DISPATCH: Do NOT mutate rowData directly here.
    // The core grid component handles merging this into the editDraft linkedSignal.
    this.cellChange.emit({
      field: this.column().field,
      previousValue: this.previousValue,
      newValue,
    });

    this.previousValue = newValue;
  }
}


// import {
//   Component, ChangeDetectionStrategy, input, output,
//   computed, signal, OnChanges, SimpleChanges
// } from '@angular/core';
// import { CommonModule, CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// // PrimeNG Form Modules
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { InputMaskModule } from 'primeng/inputmask';
// import { ColorPickerModule } from 'primeng/colorpicker';
// import { TextareaModule } from 'primeng/textarea';
// import { SelectModule } from 'primeng/select';
// import { AutoCompleteModule } from 'primeng/autocomplete';
// import { DatePickerModule } from 'primeng/datepicker';
// import { CheckboxModule } from 'primeng/checkbox';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { ToggleButtonModule } from 'primeng/togglebutton';
// import { RatingModule } from 'primeng/rating';
// import { SliderModule } from 'primeng/slider';
// import { TooltipModule } from 'primeng/tooltip';

// // Custom Shared Components
// import { GridColumn, GridCellChangeEvent } from '../../grid-types';
// import { StatusBadgeComponent } from '../../../badge/status-badge.component';
// import { AvatarComponent } from '../../../media/avatar.component';

// /**
//  * Component: app-grid-cell
//  * The heart of the progressive editing system.
//  *
//  * VIEW MODE  (isEditing = false):
//  *   Renders only text, badges, links, icons — zero form controls.
//  *   Clean, professional, enterprise look.
//  *
//  * EDIT MODE  (isEditing = true):
//  *   Renders minimal inline inputs: bottom-border only, height matches cell.
//  *   Inputs inherit table styling. No giant borders or oversized PrimeNG controls.
//  *
//  * The cellChange output carries {field, previousValue, newValue} for undo tracking.
//  */
// @Component({
//   selector: 'app-grid-cell',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule,
//     InputTextModule, InputNumberModule, InputMaskModule, ColorPickerModule,
//     TextareaModule, SelectModule, AutoCompleteModule, DatePickerModule,
//     CheckboxModule, ToggleSwitchModule, ToggleButtonModule, RatingModule, SliderModule,
//     TooltipModule, StatusBadgeComponent, AvatarComponent,
//     CurrencyPipe, DatePipe, PercentPipe,
//   ],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   host: { class: 'block w-full h-full' },
//   styleUrls: ['./grid-cell.component.scss'],
//   template: `
//     <div class="flex items-center w-full h-full">

//       <!-- ======================= EDIT MODE ======================= -->
//       @if (isEditing() && column().editable !== false && !column().readOnly) {
//         @switch (column().type) {

//           @case ('number') {
//             <p-inputNumber
//               [(ngModel)]="editValue"
//               [minFractionDigits]="column().minFractionDigits ?? 0"
//               [maxFractionDigits]="column().maxFractionDigits ?? 2"
//               [min]="column().min ?? null"
//               [max]="column().max ?? null"
//               [inputStyleClass]="'apex-ie'"
//               (ngModelChange)="onValueChange($event)"
//               class="w-full">
//             </p-inputNumber>
//           }

//           @case ('currency') {
//             <p-inputNumber
//               [(ngModel)]="editValue"
//               mode="currency"
//               [currency]="column().currencyCode ?? 'INR'"
//               [inputStyleClass]="'apex-ie'"
//               (ngModelChange)="onValueChange($event)"
//               class="w-full">
//             </p-inputNumber>
//           }

//           @case ('percentage') {
//             <p-inputNumber
//               [(ngModel)]="editValue"
//               suffix="%"
//               [min]="column().min ?? 0"
//               [max]="column().max ?? 100"
//               [inputStyleClass]="'apex-ie'"
//               (ngModelChange)="onValueChange($event)"
//               class="w-full">
//             </p-inputNumber>
//           }

//           @case ('mask') {
//             <p-inputMask
//               [(ngModel)]="editValue"
//               [mask]="column().maskPattern ?? '999-99-9999'"
//               [slotChar]="column().slotChar ?? '_'"
//               [placeholder]="column().placeholder ?? ''"
//               (ngModelChange)="onValueChange($event)"
//               class="w-full">
//             </p-inputMask>
//             <!-- /* [inputStyleClass]="'apex-ie'" */ -->
//           }

//           @case ('textarea') {
//             <textarea
//               class="apex-ie resize-none w-full"
//               rows="1"
//               [(ngModel)]="editValue"
//               [placeholder]="column().placeholder ?? ''"
//               (ngModelChange)="onValueChange($event)"
//               (keydown.enter)="$event.stopPropagation()">
//             </textarea>
//           }

//           @case ('select') {
//             <p-select
//               [(ngModel)]="editValue"
//               [options]="column().options ?? []"
//               optionLabel="label"
//               optionValue="value"
//               appendTo="body"
//               [placeholder]="column().placeholder ?? 'Select…'"
//               class="w-full"
//               (ngModelChange)="onValueChange($event)">
//             </p-select>
//           }

//           @case ('autocomplete') {
//             <p-autoComplete
//               [(ngModel)]="editValue"
//               [suggestions]="column().options ?? []"
//               [placeholder]="column().placeholder ?? 'Search…'"
//               appendTo="body"
//               class="w-full"
//               (ngModelChange)="onValueChange($event)">
//             </p-autoComplete>
//           }

//           @case ('tags') {
//             <p-autoComplete
//               [(ngModel)]="editValue"
//               [multiple]="true"
//               [placeholder]="column().placeholder ?? 'Add tags…'"
//               appendTo="body"
//               class="w-full"
//               (ngModelChange)="onValueChange($event)">
//             </p-autoComplete>
//           }

//           @case ('date') {
//             <p-datepicker
//               [(ngModel)]="editValue"
//               appendTo="body"
//               [dateFormat]="column().dateFormat ?? 'yy-mm-dd'"
//               [timeOnly]="column().timeOnly ?? false"
//               [showTime]="column().showTime ?? false"
//               [selectionMode]="column().selectionMode ?? 'single'"
//               [inputStyleClass]="'apex-ie'"
//               class="w-full"
//               (ngModelChange)="onValueChange($event)">
//             </p-datepicker>
//           }

//           @case ('datetime') {
//             <p-datepicker
//               [(ngModel)]="editValue"
//               appendTo="body"
//               [showTime]="true"
//               [dateFormat]="column().dateFormat ?? 'yy-mm-dd'"
//               [inputStyleClass]="'apex-ie'"
//               class="w-full"
//               (ngModelChange)="onValueChange($event)">
//             </p-datepicker>
//           }

//           @case ('boolean') {
//             <div class="flex items-center justify-center w-full">
//               <p-checkbox
//                 [(ngModel)]="editValue"
//                 [binary]="true"
//                 [inputId]="'checkbox_' + column().field"
//                 (ngModelChange)="onValueChange($event)">
//               </p-checkbox>
//             </div>
//           }

//           @case ('toggleswitch') {
//             <div class="flex items-center w-full">
//               <p-toggleswitch
//                 [(ngModel)]="editValue"
//                 (ngModelChange)="onValueChange($event)">
//               </p-toggleswitch>
//             </div>
//           }

//           @case ('togglebutton') {
//             <p-togglebutton
//               [(ngModel)]="editValue"
//               [onLabel]="column().onLabel ?? 'On'"
//               [offLabel]="column().offLabel ?? 'Off'"
//               (ngModelChange)="onValueChange($event)">
//             </p-togglebutton>
//           }

//           @case ('color') {
//             <div class="flex items-center gap-2 w-full">
//               <p-colorPicker
//                 [(ngModel)]="editValue"
//                 [format]="column().colorFormat ?? 'hex'"
//                 appendTo="body"
//                 (ngModelChange)="onValueChange($event)">
//               </p-colorPicker>
//               <span class="text-[10px] font-mono text-[var(--text-secondary)]">
//                 {{ editValue || '—' }}
//               </span>
//             </div>
//           }

//           @case ('rating') {
//             <p-rating
//               [(ngModel)]="editValue"
//               (ngModelChange)="onValueChange($event)">
//             </p-rating>
//           }

//           @case ('slider') {
//             <div class="w-full px-1 flex items-center gap-2">
//               <p-slider
//                 [(ngModel)]="editValue"
//                 [min]="column().min ?? 0"
//                 [max]="column().max ?? 100"
//                 [step]="column().step ?? 1"
//                 class="flex-1"
//                 (ngModelChange)="onValueChange($event)">
//               </p-slider>
//               <span class="text-[10px] font-mono text-[var(--text-secondary)] w-6 text-right shrink-0">
//                 {{ editValue ?? 0 }}
//               </span>
//             </div>
//           }

//           @default {
//             <!-- Default text editor -->
//             <input
//               type="text"
//               class="apex-ie w-full"
//               [(ngModel)]="editValue"
//               [placeholder]="column().placeholder ?? ''"
//               (ngModelChange)="onValueChange($event)">
//           }
//         }

//       <!-- ======================= VIEW MODE ======================= -->
//       } @else {
//         @switch (column().type) {

//           @case ('user') {
//             <div class="flex items-center gap-2 min-w-0">
//               <app-avatar
//                 [imageUrl]="rowData()[column().field + 'Avatar']"
//                 [name]="rowData()[column().field] || 'Unknown'"
//                 size="sm">
//               </app-avatar>
//               <span class="truncate text-[length:var(--font-size-xs)]
//                            font-[var(--font-weight-semibold)] text-[var(--text-primary)]">
//                 {{ rowData()[column().field] }}
//               </span>
//             </div>
//           }

//           @case ('badge') {
//             @if (rowData()[column().field]) {
//               <app-status-badge
//                 [status]="rowData()[column().field]"
//                 variant="subtle"
//                 size="sm">
//               </app-status-badge>
//             } @else {
//               <span class="text-[var(--text-tertiary)]">—</span>
//             }
//           }

//           @case ('status') {
//             @if (rowData()[column().field]) {
//               <app-status-badge
//                 [status]="rowData()[column().field]"
//                 variant="subtle"
//                 size="sm">
//               </app-status-badge>
//             } @else {
//               <span class="text-[var(--text-tertiary)]">—</span>
//             }
//           }

//           @case ('currency') {
//             <span class="font-mono text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)]"
//                   [class.text-[var(--color-error)]]="rowData()[column().field] < 0">
//               {{ rowData()[column().field] | currency:(column().currencyCode ?? 'INR'):'symbol':'1.2-2' }}
//             </span>
//           }

//           @case ('percentage') {
//             <span class="font-mono text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)]">
//               {{ (rowData()[column().field] ?? 0) / 100 | percent:'1.1-2' }}
//             </span>
//           }

//           @case ('number') {
//             <span class="font-mono text-[length:var(--font-size-xs)] text-[var(--text-primary)] tabular-nums">
//               {{ rowData()[column().field] ?? '—' }}
//             </span>
//           }

//           @case ('date') {
//             @if (rowData()[column().field]) {
//               <span class="flex items-center gap-1 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
//                 <i class="pi pi-calendar text-[10px] opacity-60"></i>
//                 {{ rowData()[column().field] | date:(column().dateFormat ?? 'mediumDate') }}
//               </span>
//             } @else {
//               <span class="text-[var(--text-tertiary)]">—</span>
//             }
//           }

//           @case ('datetime') {
//             @if (rowData()[column().field]) {
//               <span class="flex items-center gap-1 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
//                 <i class="pi pi-clock text-[10px] opacity-60"></i>
//                 {{ rowData()[column().field] | date:(column().dateFormat ?? 'medium') }}
//               </span>
//             } @else {
//               <span class="text-[var(--text-tertiary)]">—</span>
//             }
//           }

//           @case ('timeago') {
//             <span class="text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
//               {{ rowData()[column().field] | date:'short' }}
//             </span>
//           }

//           @case ('boolean') {
//             <i class="pi text-sm"
//                [class.pi-check-circle]="rowData()[column().field]"
//                [class.text-[var(--color-success)]]="rowData()[column().field]"
//                [class.pi-minus-circle]="!rowData()[column().field]"
//                [class.text-[var(--text-tertiary)]]="!rowData()[column().field]">
//             </i>
//           }

//           @case ('toggleswitch') {
//             <p-toggleswitch [ngModel]="rowData()[column().field]" [disabled]="true"></p-toggleswitch>
//           }

//           @case ('tags') {
//             <div class="flex flex-wrap gap-1 min-w-0">
//               @for (tag of (rowData()[column().field] ?? []).slice(0, column().maxTags ?? 3); track tag) {
//                 <span class="px-2 py-0.5 rounded-full text-[9px] font-medium
//                              bg-[var(--bg-secondary)] text-[var(--text-secondary)]
//                              border border-[var(--border-secondary)]">
//                   {{ tag }}
//                 </span>
//               }
//               @if ((rowData()[column().field] ?? []).length > (column().maxTags ?? 3)) {
//                 <span class="px-2 py-0.5 rounded-full text-[9px]
//                              bg-[var(--bg-ternary)] text-[var(--text-tertiary)]">
//                   +{{ (rowData()[column().field]).length - (column().maxTags ?? 3) }}
//                 </span>
//               }
//             </div>
//           }

//           @case ('color') {
//             @if (rowData()[column().field]) {
//               <div class="flex items-center gap-2">
//                 <span class="w-4 h-4 rounded-full border border-[var(--border-secondary)] shadow-sm shrink-0"
//                       [style.background-color]="rowData()[column().field]">
//                 </span>
//                 <span class="font-mono text-[10px] text-[var(--text-secondary)] uppercase truncate">
//                   {{ rowData()[column().field] }}
//                 </span>
//               </div>
//             } @else {
//               <span class="text-[var(--text-tertiary)]">—</span>
//             }
//           }

//           @case ('slider') {
//             <div class="w-full flex items-center gap-2">
//               <div class="flex-1 h-1 bg-[var(--border-secondary)] rounded-full overflow-hidden">
//                 <div class="h-full bg-[var(--accent-primary)] transition-[width_0.2s]"
//                      [style.width.%]="rowData()[column().field] ?? 0">
//                 </div>
//               </div>
//               <span class="text-[10px] font-mono text-[var(--text-secondary)] tabular-nums shrink-0">
//                 {{ rowData()[column().field] ?? 0 }}%
//               </span>
//             </div>
//           }

//           @case ('email') {
//             @if (rowData()[column().field]) {
//               <a [href]="'mailto:' + rowData()[column().field]"
//                  class="flex items-center gap-1 text-[length:var(--font-size-xs)]
//                         text-[var(--link-color)] hover:underline truncate">
//                 <i class="pi pi-envelope text-[10px] opacity-70 shrink-0"></i>
//                 <span class="truncate">{{ rowData()[column().field] }}</span>
//               </a>
//             } @else {
//               <span class="text-[var(--text-tertiary)]">—</span>
//             }
//           }

//           @case ('phone') {
//             @if (rowData()[column().field]) {
//               <a [href]="'tel:' + rowData()[column().field]"
//                  class="flex items-center gap-1 text-[length:var(--font-size-xs)]
//                         text-[var(--link-color)] hover:underline">
//                 <i class="pi pi-phone text-[10px] opacity-70 shrink-0"></i>
//                 {{ rowData()[column().field] }}
//               </a>
//             } @else {
//               <span class="text-[var(--text-tertiary)]">—</span>
//             }
//           }

//           @case ('url') {
//             @if (rowData()[column().field]) {
//               <a [href]="rowData()[column().field]" target="_blank" rel="noopener"
//                  class="flex items-center gap-1 text-[length:var(--font-size-xs)]
//                         text-[var(--link-color)] hover:underline truncate">
//                 <i class="pi pi-external-link text-[10px] opacity-70 shrink-0"></i>
//                 <span class="truncate">{{ rowData()[column().field] }}</span>
//               </a>
//             } @else {
//               <span class="text-[var(--text-tertiary)]">—</span>
//             }
//           }

//           @case ('rating') {
//             <p-rating [ngModel]="rowData()[column().field]" [readonly]="true"></p-rating>
//           }

//           @case ('avatar') {
//             <app-avatar
//               [imageUrl]="rowData()[column().field]"
//               [name]="rowData()[column().field] || '?'"
//               size="sm">
//             </app-avatar>
//           }

//           @case ('initials') {
//             <app-avatar
//               [name]="rowData()[column().field] || '?'"
//               size="sm">
//             </app-avatar>
//           }

//           @default {
//             <!-- Default: text with tooltip on overflow -->
//             <span class="truncate block w-full text-[length:var(--font-size-xs)] text-[var(--text-primary)]"
//                   [pTooltip]="rowData()[column().field]"
//                   tooltipPosition="top"
//                   [tooltipDisabled]="!rowData()[column().field]">
//               {{ (column().formatter
//                   ? column().formatter!(rowData()[column().field], rowData())
//                   : rowData()[column().field]) ?? '—' }}
//             </span>
//           }
//         }
//       }
//     </div>
//   `,
// })
// export class GridCellComponent implements OnChanges {
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   rowData = input.required<any>();
//   column = input.required<GridColumn>();
//   isEditing = input<boolean>(false);

//   cellChange = output<GridCellChangeEvent>();

//   // Local mutable edit value — initialised from rowData when isEditing becomes true
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   protected editValue: any = null;

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   private previousValue: any = null;

//   ngOnChanges(changes: SimpleChanges): void {
//     // When entering edit mode, snapshot the current value
//     if (changes['isEditing'] && this.isEditing()) {
//       this.previousValue = this.rowData()[this.column().field];
//       this.editValue = this.previousValue;
//     }
//   }

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   protected onValueChange(newValue: any): void {
//     // Mutate the row object in-place so parent has the latest value
//     this.rowData()[this.column().field] = newValue;

//     // Emit change event for undo tracking
//     this.cellChange.emit({
//       field: this.column().field,
//       previousValue: this.previousValue,
//       newValue,
//     });

//     // Update previous value for next change tracking
//     this.previousValue = newValue;
//   }
// }
