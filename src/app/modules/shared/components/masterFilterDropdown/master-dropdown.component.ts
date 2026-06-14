import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  forwardRef,
  inject
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  DropdownEndpoint,
  DropdownOption,
  MasterDropdownService
} from '../../../../core/services/master-dropdown.service';

@Component({
  selector: 'app-master-dropdown',
  standalone: true,
  imports: [FormsModule, SelectModule, MultiSelectModule],
  template: `
    <div class="master-dropdown w-full">
      @if (!isMulti) {
        <p-select
          [id]="id"
          [options]="options"
          [(ngModel)]="value"
          [optionLabel]="'label'"
          [optionValue]="'value'"
          [filter]="true"
          filterBy="label"
          [virtualScroll]="true"
          [virtualScrollItemSize]="40"
          [lazy]="true"
          [placeholder]="placeholder"
          [loading]="loading"
          [disabled]="disabled"
          [showClear]="showClear"
          appendTo="body"
          class="w-full"
          styleClass="w-full master-dropdown__control"
          (onChange)="onSelectionChange($event.value)"
          (onFilter)="handleFilter($event)"
          (onLazyLoad)="onScroll($event)"
          (onClear)="handleClear()"
          (onShow)="onShow.emit($event)"
          (onHide)="onHide.emit($event)"
          (onFocus)="onFocus.emit($event)"
          (onBlur)="handleBlur($event)">
        </p-select>
      }

      @if (isMulti) {
        <p-multiselect
          [id]="id"
          [options]="options"
          [(ngModel)]="value"
          [optionLabel]="'label'"
          [optionValue]="'value'"
          [filter]="true"
          filterBy="label"
          [virtualScroll]="true"
          [virtualScrollItemSize]="40"
          [lazy]="true"
          [placeholder]="placeholder"
          [loading]="loading"
          [disabled]="disabled"
          [showToggleAll]="false"
          [showClear]="showClear"
          [maxSelectedLabels]="3"
          appendTo="body"
          display="chip"
          class="w-full"
          styleClass="w-full master-dropdown__control"
          (onChange)="onSelectionChange($event.value)"
          (onFilter)="handleFilter($event)"
          (onLazyLoad)="onScroll($event)"
          (onClear)="handleClear()"
          (onPanelShow)="onShow.emit($event)"
          (onPanelHide)="onHide.emit($event)"
          (onFocus)="onFocus.emit($event)"
          (onBlur)="handleBlur($event)">
        </p-multiselect>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .master-dropdown {
      width: 100%;
    }

    /* Unified 2.5rem (40px) Geometry Alignment */
    :host ::ng-deep .master-dropdown__control .p-select-label,
    :host ::ng-deep .master-dropdown__control .p-multiselect-label,
    :host ::ng-deep .master-dropdown__control.p-select,
    :host ::ng-deep .master-dropdown__control.p-multiselect {
      min-height: 2.5rem; /* Aligned with master theme */
    }

    :host ::ng-deep .master-dropdown__control.p-select,
    :host ::ng-deep .master-dropdown__control.p-multiselect {
      width: 100%;
      align-items: center;
    }

    :host ::ng-deep .master-dropdown__control .p-select-label,
    :host ::ng-deep .master-dropdown__control .p-multiselect-label {
      display: flex;
      align-items: center;
      line-height: normal; /* Fixes text centering */
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MasterDropdownComponent),
      multi: true
    }
  ]
})
export class MasterDropdownComponent
  implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
  @Input({ required: true }) endpoint!: DropdownEndpoint;
  @Input() isMulti = false;
  @Input() placeholder = 'Select an option...';
  @Input() showClear = true;
  @Input() id = '';
  @Input() extraParams: Record<string, unknown> = {};
  @Input() limit = 50;

  @Output() onSelect = new EventEmitter<any>();
  @Output() onChangeEvent = new EventEmitter<any>();
  @Output('onChange') onChangeCompat = new EventEmitter<any>();
  @Output() onClearEvent = new EventEmitter<void>();
  @Output() onShow = new EventEmitter<any>();
  @Output() onHide = new EventEmitter<any>();
  @Output() onFocus = new EventEmitter<any>();
  @Output() onBlur = new EventEmitter<any>();
  @Output() onFilter = new EventEmitter<string>();

  private readonly dropdownService = inject(MasterDropdownService);

  options: DropdownOption[] = [];
  loading = false;
  value: any = null;
  disabled = false;

  private page = 1;
  private currentSearchTerm = '';
  private isLastPage = false;
  private latestRequestId = 0;
  private pendingSelectedIds = new Set<string>();

  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  private propagateChange = (_value: any) => { };
  onTouched = () => { };

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.currentSearchTerm = searchTerm.trim();
        this.resetPaging();
        this.fetchData({ resetOptions: true });
      });

    this.fetchData({ resetOptions: true });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const endpointChanged = changes['endpoint'] && !changes['endpoint'].firstChange;
    const extraParamsChanged = changes['extraParams'] && !changes['extraParams'].firstChange;

    if (endpointChanged || extraParamsChanged) {
      this.resetPaging();
      this.fetchData({ resetOptions: true });
    }
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  handleFilter(event: { filter?: string }): void {
    const term = event?.filter ?? '';
    this.onFilter.emit(term);
    this.searchSubject.next(term);
  }

  handleClear(): void {
    this.value = this.isMulti ? [] : null;
    this.pendingSelectedIds.clear();
    this.propagateChange(this.value);
    this.onTouched();
    this.onChangeEvent.emit(this.value);
    this.onClearEvent.emit();
    this.onSelect.emit(this.isMulti ? [] : null);
  }

  handleBlur(event: unknown): void {
    this.onTouched();
    this.onBlur.emit(event);
  }

  onScroll(event: { first?: number; rows?: number }): void {
    const first = event?.first ?? 0;
    const rows = event?.rows ?? this.limit;
    const nextPage = Math.floor(first / rows) + 1;

    if (nextPage > this.page && !this.loading && !this.isLastPage) {
      this.page = nextPage;
      this.fetchData({ resetOptions: false });
    }
  }

  onSelectionChange(newValue: any): void {
    this.value = newValue;
    this.syncPendingSelectedIds(newValue);
    this.propagateChange(this.value);
    this.onTouched();
    this.onChangeEvent.emit(this.value);
    this.onChangeCompat.emit(this.value);
    this.emitSelectData(newValue);
  }

  writeValue(obj: any): void {
    this.value = this.normalizeIncomingValue(obj);
    this.syncPendingSelectedIds(this.value);

    if (this.isEmptyValue(this.value)) {
      return;
    }

    const missingIds = this.getMissingIds(this.value);
    if (missingIds.length > 0) {
      this.fetchData({
        resetOptions: false,
        includeIds: missingIds,
        emitSelectionAfterFetch: true
      });
      return;
    }

    this.emitSelectData(this.value);
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  private resetPaging(): void {
    this.page = 1;
    this.isLastPage = false;
  }

  private fetchData(config: {
    resetOptions: boolean;
    includeIds?: string[];
    emitSelectionAfterFetch?: boolean;
  }): void {
    const { resetOptions, includeIds, emitSelectionAfterFetch } = config;

    if (this.isLastPage && !resetOptions && !includeIds?.length) {
      return;
    }

    const requestId = ++this.latestRequestId;
    this.loading = true;

    this.dropdownService
      .getDropdownData(
        this.endpoint,
        includeIds?.length ? '' : this.currentSearchTerm,
        includeIds?.length ? 1 : this.page,
        this.limit,
        includeIds,
        this.extraParams
      )
      .subscribe({
        next: (res) => {
          if (requestId !== this.latestRequestId && !includeIds?.length) {
            return;
          }

          const newData = Array.isArray(res?.data) ? res.data : [];

          if (!includeIds?.length) {
            this.isLastPage = !res?.hasMore;
          }

          this.options = this.mergeOptions(resetOptions ? [] : this.options, newData);
          this.loading = false;

          if (emitSelectionAfterFetch) {
            this.emitSelectData(this.value);
          }
        },
        error: () => {
          if (requestId === this.latestRequestId || includeIds?.length) {
            this.loading = false;
          }
        }
      });
  }

  private mergeOptions(existing: DropdownOption[], incoming: DropdownOption[]): DropdownOption[] {
    const merged = new Map<string, DropdownOption>();

    for (const option of existing) {
      merged.set(option.value, option);
    }

    for (const option of incoming) {
      merged.set(option.value, option);
    }

    const mergedOptions = Array.from(merged.values());

    if (this.pendingSelectedIds.size === 0) {
      return mergedOptions;
    }

    const selected: DropdownOption[] = [];
    const rest: DropdownOption[] = [];

    for (const option of mergedOptions) {
      if (this.pendingSelectedIds.has(option.value)) {
        selected.push(option);
      } else {
        rest.push(option);
      }
    }

    return [...selected, ...rest];
  }

  private emitSelectData(newValue: any): void {
    if (this.isMulti) {
      const selectedValues = Array.isArray(newValue) ? newValue : [];

      if (selectedValues.length === 0) {
        this.onSelect.emit([]);
        return;
      }

      const missingIds = this.getMissingIds(selectedValues);
      if (missingIds.length > 0) {
        this.fetchData({
          resetOptions: false,
          includeIds: missingIds,
          emitSelectionAfterFetch: true
        });
        return;
      }

      const selectedMap = new Map(this.options.map((option) => [option.value, option.data]));
      this.onSelect.emit(selectedValues.map((id: string) => selectedMap.get(id)).filter(Boolean));
      return;
    }

    if (newValue === null || newValue === undefined || newValue === '') {
      this.onSelect.emit(null);
      return;
    }

    const found = this.options.find((opt) => opt.value === newValue);
    if (found) {
      this.onSelect.emit(found.data);
      return;
    }

    this.fetchData({
      resetOptions: false,
      includeIds: [newValue],
      emitSelectionAfterFetch: true
    });
  }

  private getMissingIds(rawValue: any): string[] {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    const existingIds = new Set(this.options.map((option) => option.value));

    return values
      .filter((value) => value !== null && value !== undefined && value !== '')
      .filter((value) => !existingIds.has(value));
  }

  private syncPendingSelectedIds(rawValue: any): void {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    this.pendingSelectedIds = new Set(
      values.filter((value) => value !== null && value !== undefined && value !== '')
    );
  }

  private normalizeIncomingValue(rawValue: any): any {
    if (this.isMulti) {
      return Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];
    }

    return rawValue ?? null;
  }

  private isEmptyValue(rawValue: any): boolean {
    return this.isMulti ? !Array.isArray(rawValue) || rawValue.length === 0 : rawValue == null || rawValue === '';
  }
}
// import {
//   Component,
//   EventEmitter,
//   Input,
//   OnChanges,
//   OnDestroy,
//   OnInit,
//   Output,
//   SimpleChanges,
//   forwardRef,
//   inject
// } from '@angular/core';
// import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
// import { SelectModule } from 'primeng/select';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { Subject, Subscription } from 'rxjs';
// import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
// import {
//   DropdownEndpoint,
//   DropdownOption,
//   MasterDropdownService
// } from '../../../../core/services/master-dropdown.service';



// @Component({
//   selector: 'app-master-dropdown',
//   standalone: true,
//   imports: [FormsModule, SelectModule, MultiSelectModule],
//   template: `
//     <div class="master-dropdown w-full">
//       @if (!isMulti) {
//         <p-select
//           [id]="id"
//           [options]="options"
//           [(ngModel)]="value"
//           [optionLabel]="'label'"
//           [optionValue]="'value'"
//           [filter]="true"
//           filterBy="label"
//           [virtualScroll]="true"
//           [virtualScrollItemSize]="38"
//           [lazy]="true"
//           [placeholder]="placeholder"
//           [loading]="loading"
//           [disabled]="disabled"
//           [showClear]="showClear"
//           appendTo="body"
//           class="w-full"
//           styleClass="w-full master-dropdown__control"
//           (onChange)="onSelectionChange($event.value)"
//           (onFilter)="handleFilter($event)"
//           (onLazyLoad)="onScroll($event)"
//           (onClear)="handleClear()"
//           (onShow)="onShow.emit($event)"
//           (onHide)="onHide.emit($event)"
//           (onFocus)="onFocus.emit($event)"
//           (onBlur)="handleBlur($event)">
//         </p-select>
//       }

//       @if (isMulti) {
//         <p-multiselect
//           [id]="id"
//           [options]="options"
//           [(ngModel)]="value"
//           [optionLabel]="'label'"
//           [optionValue]="'value'"
//           [filter]="true"
//           filterBy="label"
//           [virtualScroll]="true"
//           [virtualScrollItemSize]="43"
//           [lazy]="true"
//           [placeholder]="placeholder"
//           [loading]="loading"
//           [disabled]="disabled"
//           [showToggleAll]="false"
//           [showClear]="showClear"
//           [maxSelectedLabels]="3"
//           appendTo="body"
//           display="chip"
//           class="w-full"
//           styleClass="w-full master-dropdown__control"
//           (onChange)="onSelectionChange($event.value)"
//           (onFilter)="handleFilter($event)"
//           (onLazyLoad)="onScroll($event)"
//           (onClear)="handleClear()"
//           (onPanelShow)="onShow.emit($event)"
//           (onPanelHide)="onHide.emit($event)"
//           (onFocus)="onFocus.emit($event)"
//           (onBlur)="handleBlur($event)">
//         </p-multiselect>
//       }
//     </div>
//   `,
//   styles: [`
//     :host {
//       display: block;
//       width: 100%;
//     }

//     .master-dropdown {
//       width: 100%;
//     }

//     :host ::ng-deep .master-dropdown__control .p-select-label,
//     :host ::ng-deep .master-dropdown__control .p-multiselect-label,
//     :host ::ng-deep .master-dropdown__control.p-select,
//     :host ::ng-deep .master-dropdown__control.p-multiselect {
//       min-height: 42px;
//     }

//     :host ::ng-deep .master-dropdown__control.p-select,
//     :host ::ng-deep .master-dropdown__control.p-multiselect {
//       width: 100%;
//       align-items: center;
//     }

//     :host ::ng-deep .master-dropdown__control .p-select-label,
//     :host ::ng-deep .master-dropdown__control .p-multiselect-label {
//       display: flex;
//       align-items: center;
//     }
//   `],
//   providers: [
//     {
//       provide: NG_VALUE_ACCESSOR,
//       useExisting: forwardRef(() => MasterDropdownComponent),
//       multi: true
//     }
//   ]
// })
// export class MasterDropdownComponent
//   implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
//   @Input({ required: true }) endpoint!: DropdownEndpoint;
//   @Input() isMulti = false;
//   @Input() placeholder = 'Select an option...';
//   @Input() showClear = true;
//   @Input() id = '';
//   @Input() extraParams: Record<string, unknown> = {};
//   @Input() limit = 50;

//   @Output() onSelect = new EventEmitter<any>();
//   @Output() onChangeEvent = new EventEmitter<any>();
//   @Output('onChange') onChangeCompat = new EventEmitter<any>();
//   @Output() onClearEvent = new EventEmitter<void>();
//   @Output() onShow = new EventEmitter<any>();
//   @Output() onHide = new EventEmitter<any>();
//   @Output() onFocus = new EventEmitter<any>();
//   @Output() onBlur = new EventEmitter<any>();
//   @Output() onFilter = new EventEmitter<string>();

//   private readonly dropdownService = inject(MasterDropdownService);

//   options: DropdownOption[] = [];
//   loading = false;
//   value: any = null;
//   disabled = false;

//   private page = 1;
//   private currentSearchTerm = '';
//   private isLastPage = false;
//   private latestRequestId = 0;
//   private pendingSelectedIds = new Set<string>();

//   private readonly searchSubject = new Subject<string>();
//   private searchSubscription?: Subscription;

//   private propagateChange = (_value: any) => { };
//   onTouched = () => { };

//   ngOnInit(): void {
//     this.searchSubscription = this.searchSubject
//       .pipe(debounceTime(300), distinctUntilChanged())
//       .subscribe((searchTerm) => {
//         this.currentSearchTerm = searchTerm.trim();
//         this.resetPaging();
//         this.fetchData({ resetOptions: true });
//       });

//     this.fetchData({ resetOptions: true });
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     const endpointChanged = changes['endpoint'] && !changes['endpoint'].firstChange;
//     const extraParamsChanged = changes['extraParams'] && !changes['extraParams'].firstChange;

//     if (endpointChanged || extraParamsChanged) {
//       this.resetPaging();
//       this.fetchData({ resetOptions: true });
//     }
//   }

//   ngOnDestroy(): void {
//     this.searchSubscription?.unsubscribe();
//   }

//   handleFilter(event: { filter?: string }): void {
//     const term = event?.filter ?? '';
//     this.onFilter.emit(term);
//     this.searchSubject.next(term);
//   }

//   handleClear(): void {
//     this.value = this.isMulti ? [] : null;
//     this.pendingSelectedIds.clear();
//     this.propagateChange(this.value);
//     this.onTouched();
//     this.onChangeEvent.emit(this.value);
//     this.onClearEvent.emit();
//     this.onSelect.emit(this.isMulti ? [] : null);
//   }

//   handleBlur(event: unknown): void {
//     this.onTouched();
//     this.onBlur.emit(event);
//   }

//   onScroll(event: { first?: number; rows?: number }): void {
//     const first = event?.first ?? 0;
//     const rows = event?.rows ?? this.limit;
//     const nextPage = Math.floor(first / rows) + 1;

//     if (nextPage > this.page && !this.loading && !this.isLastPage) {
//       this.page = nextPage;
//       this.fetchData({ resetOptions: false });
//     }
//   }

//   onSelectionChange(newValue: any): void {
//     this.value = newValue;
//     this.syncPendingSelectedIds(newValue);
//     this.propagateChange(this.value);
//     this.onTouched();
//     this.onChangeEvent.emit(this.value);
//     this.onChangeCompat.emit(this.value);
//     this.emitSelectData(newValue);
//   }

//   writeValue(obj: any): void {
//     this.value = this.normalizeIncomingValue(obj);
//     this.syncPendingSelectedIds(this.value);

//     if (this.isEmptyValue(this.value)) {
//       return;
//     }

//     const missingIds = this.getMissingIds(this.value);
//     if (missingIds.length > 0) {
//       this.fetchData({
//         resetOptions: false,
//         includeIds: missingIds,
//         emitSelectionAfterFetch: true
//       });
//       return;
//     }

//     this.emitSelectData(this.value);
//   }

//   registerOnChange(fn: any): void {
//     this.propagateChange = fn;
//   }

//   registerOnTouched(fn: any): void {
//     this.onTouched = fn;
//   }

//   setDisabledState(isDisabled: boolean): void {
//     this.disabled = isDisabled;
//   }

//   private resetPaging(): void {
//     this.page = 1;
//     this.isLastPage = false;
//   }

//   private fetchData(config: {
//     resetOptions: boolean;
//     includeIds?: string[];
//     emitSelectionAfterFetch?: boolean;
//   }): void {
//     const { resetOptions, includeIds, emitSelectionAfterFetch } = config;

//     if (this.isLastPage && !resetOptions && !includeIds?.length) {
//       return;
//     }

//     const requestId = ++this.latestRequestId;
//     this.loading = true;

//     this.dropdownService
//       .getDropdownData(
//         this.endpoint,
//         includeIds?.length ? '' : this.currentSearchTerm,
//         includeIds?.length ? 1 : this.page,
//         this.limit,
//         includeIds,
//         this.extraParams
//       )
//       .subscribe({
//         next: (res) => {
//           if (requestId !== this.latestRequestId && !includeIds?.length) {
//             return;
//           }

//           const newData = Array.isArray(res?.data) ? res.data : [];

//           if (!includeIds?.length) {
//             this.isLastPage = !res?.hasMore;
//           }

//           this.options = this.mergeOptions(resetOptions ? [] : this.options, newData);
//           this.loading = false;

//           if (emitSelectionAfterFetch) {
//             this.emitSelectData(this.value);
//           }
//         },
//         error: () => {
//           if (requestId === this.latestRequestId || includeIds?.length) {
//             this.loading = false;
//           }
//         }
//       });
//   }

//   private mergeOptions(existing: DropdownOption[], incoming: DropdownOption[]): DropdownOption[] {
//     const merged = new Map<string, DropdownOption>();

//     for (const option of existing) {
//       merged.set(option.value, option);
//     }

//     for (const option of incoming) {
//       merged.set(option.value, option);
//     }

//     const mergedOptions = Array.from(merged.values());

//     if (this.pendingSelectedIds.size === 0) {
//       return mergedOptions;
//     }

//     const selected: DropdownOption[] = [];
//     const rest: DropdownOption[] = [];

//     for (const option of mergedOptions) {
//       if (this.pendingSelectedIds.has(option.value)) {
//         selected.push(option);
//       } else {
//         rest.push(option);
//       }
//     }

//     return [...selected, ...rest];
//   }

//   private emitSelectData(newValue: any): void {
//     if (this.isMulti) {
//       const selectedValues = Array.isArray(newValue) ? newValue : [];

//       if (selectedValues.length === 0) {
//         this.onSelect.emit([]);
//         return;
//       }

//       const missingIds = this.getMissingIds(selectedValues);
//       if (missingIds.length > 0) {
//         this.fetchData({
//           resetOptions: false,
//           includeIds: missingIds,
//           emitSelectionAfterFetch: true
//         });
//         return;
//       }

//       const selectedMap = new Map(this.options.map((option) => [option.value, option.data]));
//       this.onSelect.emit(selectedValues.map((id: string) => selectedMap.get(id)).filter(Boolean));
//       return;
//     }

//     if (newValue === null || newValue === undefined || newValue === '') {
//       this.onSelect.emit(null);
//       return;
//     }

//     const found = this.options.find((opt) => opt.value === newValue);
//     if (found) {
//       this.onSelect.emit(found.data);
//       return;
//     }

//     this.fetchData({
//       resetOptions: false,
//       includeIds: [newValue],
//       emitSelectionAfterFetch: true
//     });
//   }

//   private getMissingIds(rawValue: any): string[] {
//     const values = Array.isArray(rawValue) ? rawValue : [rawValue];
//     const existingIds = new Set(this.options.map((option) => option.value));

//     return values
//       .filter((value) => value !== null && value !== undefined && value !== '')
//       .filter((value) => !existingIds.has(value));
//   }

//   private syncPendingSelectedIds(rawValue: any): void {
//     const values = Array.isArray(rawValue) ? rawValue : [rawValue];
//     this.pendingSelectedIds = new Set(
//       values.filter((value) => value !== null && value !== undefined && value !== '')
//     );
//   }

//   private normalizeIncomingValue(rawValue: any): any {
//     if (this.isMulti) {
//       return Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];
//     }

//     return rawValue ?? null;
//   }

//   private isEmptyValue(rawValue: any): boolean {
//     return this.isMulti ? !Array.isArray(rawValue) || rawValue.length === 0 : rawValue == null || rawValue === '';
//   }
// }
