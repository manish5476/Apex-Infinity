import {
  Component, Input, OnInit, OnDestroy, forwardRef, inject,
  EventEmitter, Output, OnChanges, SimpleChanges
} from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MasterDropdownService, DropdownEndpoint, DropdownOption } from '../../../../core/services/master-dropdown.service';

@Component({
  selector: 'app-master-dropdown',
  standalone: true,
  imports: [FormsModule, SelectModule, MultiSelectModule],
  template: `
    <div class="flex justify-center w-full">

      @if (!isMulti) {
        <p-select
          [id]="id"
          [options]="options"
          [(ngModel)]="value"
          (onChange)="onSelectionChange($event.value)"
          (onFilter)="handleFilter($event)"
          (onLazyLoad)="onScroll($event)"
          (onClear)="handleClear()"
          (onShow)="onShow.emit($event)"
          (onHide)="onHide.emit($event)"
          (onFocus)="onFocus.emit($event)"
          (onBlur)="handleBlur($event)"
          [filter]="true"
          filterBy="label"
          [virtualScroll]="true"
          [virtualScrollItemSize]="38"
          [lazy]="true"
          [placeholder]="placeholder"
          [loading]="loading"
          [disabled]="disabled"
          [showClear]="showClear"
          appendTo="body"
          class="w-full"
          styleClass="w-full">
        </p-select>
      }

      @if (isMulti) {
        <p-multiselect
          [id]="id"
          [options]="options"
          [(ngModel)]="value"
          (onChange)="onSelectionChange($event.value)"
          (onFilter)="handleFilter($event)"
          (onLazyLoad)="onScroll($event)"
          (onClear)="handleClear()"
          (onPanelShow)="onShow.emit($event)"
          (onPanelHide)="onHide.emit($event)"
          (onFocus)="onFocus.emit($event)"
          (onBlur)="handleBlur($event)"
          [filter]="true"
          filterBy="label"
          [virtualScroll]="true"
          [virtualScrollItemSize]="43"
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
          styleClass="w-full">
        </p-multiselect>
      }

    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MasterDropdownComponent),
      multi: true
    }
  ]
})
export class MasterDropdownComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
  @Input({ required: true }) endpoint!: DropdownEndpoint;
  @Input() isMulti: boolean = false;
  @Input() placeholder: string = 'Select an option...';
  @Input() showClear: boolean = true;
  @Input() id: string = '';
  @Input() extraParams: any = {};

  // ─── Value / Selection Events ───────────────────────────────────────────────
  /** Emits the full raw `data` object (or array) of the selected option(s) */
  @Output() onSelect = new EventEmitter<any>();
  /** Emits the raw value (id/string) whenever selection changes */
  @Output() onChangeEvent = new EventEmitter<any>();
  /** Emits null when the clear button is clicked */
  @Output() onClearEvent = new EventEmitter<void>();

  // ─── Panel / Focus Events ───────────────────────────────────────────────────
  /** Emits when the dropdown panel opens */
  @Output() onShow = new EventEmitter<any>();
  /** Emits when the dropdown panel closes */
  @Output() onHide = new EventEmitter<any>();
  /** Emits when the component gains focus */
  @Output() onFocus = new EventEmitter<any>();
  /** Emits when the component loses focus */
  @Output() onBlur = new EventEmitter<any>();
  /** Emits the current filter string as the user types */
  @Output() onFilter = new EventEmitter<string>();

  private dropdownService = inject(MasterDropdownService);
  options: DropdownOption[] = [];
  loading: boolean = false;
  value: any = null;
  disabled: boolean = false;

  private page: number = 1;
  private limit: number = 50;
  private currentSearchTerm: string = '';
  private isLastPage: boolean = false;

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  onChange = (value: any) => { };
  onTouched = () => { };

  ngOnInit() {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.currentSearchTerm = searchTerm;
        this.page = 1;
        this.isLastPage = false;
        this.fetchData(true);
      });

    this.fetchData(true);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      (changes['endpoint'] && !changes['endpoint'].firstChange) ||
      (changes['extraParams'] && !changes['extraParams'].firstChange)
    ) {
      this.page = 1;
      this.isLastPage = false;
      this.fetchData(true);
    }
  }

  ngOnDestroy() {
    if (this.searchSubscription) this.searchSubscription.unsubscribe();
  }

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  private fetchData(resetOptions: boolean = false, includeIds?: string[], afterFetchCallback?: () => void) {
    if (this.isLastPage && !resetOptions && !includeIds) return;

    this.loading = true;
    this.dropdownService
      .getDropdownData(this.endpoint, this.currentSearchTerm, this.page, this.limit, includeIds, this.extraParams)
      .subscribe({
        next: (res) => {
          const newData = res.data || [];
          this.isLastPage = !res.hasMore;

          if (resetOptions) {
            this.options = newData;
          } else {
            const existingIds = new Set(this.options.map(o => o.value));
            const uniqueNewData = newData.filter(item => !existingIds.has(item.value));
            this.options = [...this.options, ...uniqueNewData];
          }

          this.loading = false;
          afterFetchCallback?.();
        },
        error: () => {
          this.loading = false;
          afterFetchCallback?.();
        }
      });
  }

  // ─── PrimeNG Event Handlers ─────────────────────────────────────────────────

  handleFilter(event: any) {
    const term = event.filter ?? '';
    this.onFilter.emit(term);
    this.searchSubject.next(term);
  }

  handleClear() {
    this.value = null;
    this.onChange(null);
    this.onTouched();
    this.onChangeEvent.emit(null);
    this.onClearEvent.emit();
    this.onSelect.emit(this.isMulti ? [] : null);
  }

  handleBlur(event: any) {
    this.onTouched();
    this.onBlur.emit(event);
  }

  onScroll(event: any) {
    const { first, rows } = event;
    const scrollPage = Math.floor(first / rows) + 1;

    if (scrollPage > this.page && !this.loading && !this.isLastPage) {
      this.page = scrollPage;
      this.fetchData(false);
    }
  }

  onSelectionChange(newValue: any) {
    this.value = newValue;
    this.onChange(this.value);
    this.onTouched();
    this.onChangeEvent.emit(this.value);
    this.emitSelectData(newValue);
  }

  // ─── Emit Full Data Objects ──────────────────────────────────────────────────

  /**
   * Resolves and emits the full `data` object(s) for the selected value(s).
   * Handles the case where options may not yet be loaded (e.g. after writeValue).
   */
  private emitSelectData(newValue: any) {
    if (!this.isMulti) {
      if (newValue === null || newValue === undefined) {
        this.onSelect.emit(null);
        return;
      }
      const found = this.options.find(opt => opt.value === newValue);
      if (found) {
        this.onSelect.emit(found.data);
      } else {
        // Option not in list yet — fetch it, then emit
        this.fetchData(false, [newValue], () => {
          const loaded = this.options.find(opt => opt.value === newValue);
          this.onSelect.emit(loaded?.data ?? null);
        });
      }
    } else {
      if (!newValue || newValue.length === 0) {
        this.onSelect.emit([]);
        return;
      }
      const missingIds = newValue.filter((id: string) => !this.options.find(opt => opt.value === id));
      if (missingIds.length > 0) {
        this.fetchData(false, missingIds, () => {
          const resolved = this.options.filter(opt => newValue.includes(opt.value)).map(opt => opt.data);
          this.onSelect.emit(resolved);
        });
      } else {
        const resolved = this.options.filter(opt => newValue.includes(opt.value)).map(opt => opt.data);
        this.onSelect.emit(resolved);
      }
    }
  }

  // ─── ControlValueAccessor ───────────────────────────────────────────────────

  writeValue(obj: any): void {
    this.value = obj;
    if (!obj) return;

    const idsToCheck = Array.isArray(obj) ? obj : [obj];
    const missingIds = idsToCheck.filter(id => !this.options.find(opt => opt.value === id));

    if (missingIds.length > 0) {
      // Fetch missing options, then emit onSelect so parent gets full data
      this.fetchData(false, missingIds, () => {
        this.emitSelectData(obj);
      });
    } else {
      // Options already loaded — emit immediately
      this.emitSelectData(obj);
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}



























// import { Component, Input, OnInit, OnDestroy, forwardRef, inject, EventEmitter, Output, OnChanges, SimpleChanges } from '@angular/core';
// import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
// import { SelectModule } from 'primeng/select';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { Subject, Subscription } from 'rxjs';
// import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
// import { MasterDropdownService, DropdownEndpoint, DropdownOption } from '../../../../core/services/master-dropdown.service';

// @Component({
//   selector: 'app-master-dropdown',
//   standalone: true,
//   imports: [FormsModule, SelectModule, MultiSelectModule],
//   template: `
//     <div class="flex justify-center w-full">
      
//       @if (!isMulti) {
//         <p-select 
//           [id]="id"
//           [options]="options"
//           [(ngModel)]="value"
//           (onChange)="onSelectionChange($event.value)"
//           (onFilter)="onSearch($event)"
//           (onLazyLoad)="onScroll($event)"
//           (onClear)="onSelectionChange(null)"
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
//           styleClass="w-full">
//         </p-select>
//       }
 
//       @if (isMulti) {
//         <p-multiselect 
//           [id]="id"
//           [options]="options"
//           [(ngModel)]="value"
//           (onChange)="onSelectionChange($event.value)"
//           (onFilter)="onSearch($event)"
//           (onLazyLoad)="onScroll($event)"
//           (onClear)="onSelectionChange(null)"
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
//           styleClass="w-full">
//         </p-multiselect>
//       }
 
//     </div>
//   `,
//   providers: [
//     {
//       provide: NG_VALUE_ACCESSOR,
//       useExisting: forwardRef(() => MasterDropdownComponent),
//       multi: true
//     }
//   ]
// })
// export class MasterDropdownComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
//   @Input({ required: true }) endpoint!: DropdownEndpoint;
//   @Input() isMulti: boolean = false;
//   @Input() placeholder: string = 'Select an option...';
//   @Input() showClear: boolean = true;
//   @Input() id: string = '';
//   @Output() onSelect = new EventEmitter<any>();
//   @Output() onChangeEvent = new EventEmitter<any>(); // Renamed from onChange to avoid conflict
//   @Input() extraParams: any = {};

//   private dropdownService = inject(MasterDropdownService);
//   options: DropdownOption[] = [];
//   loading: boolean = false;
//   value: any = null;
//   disabled: boolean = false;

//   private page: number = 1;
//   private limit: number = 50;
//   private currentSearchTerm: string = '';
//   private isLastPage: boolean = false;

//   private searchSubject = new Subject<string>();
//   private searchSubscription!: Subscription;
  
//   onChange = (value: any) => { };
//   onTouched = () => { };

//   ngOnInit() {
//     this.searchSubscription = this.searchSubject.pipe(debounceTime(400),distinctUntilChanged()).subscribe((searchTerm) => {
//       this.currentSearchTerm = searchTerm;
//       this.page = 1;
//       this.isLastPage = false;
//       this.fetchData(true);
//     });

//     this.fetchData(true);
//   }
  
//   ngOnChanges(changes: SimpleChanges) {
//     if ((changes['endpoint'] && !changes['endpoint'].firstChange) || (changes['extraParams'] && !changes['extraParams'].firstChange)) {
//       this.page = 1;
//       this.isLastPage = false;
//       this.fetchData(true);
//     }
//   }

//   ngOnDestroy() {
//     if (this.searchSubscription) this.searchSubscription.unsubscribe();
//   }

//   private fetchData(resetOptions: boolean = false, includeIds?: string[]) {
//     if (this.isLastPage && !resetOptions && !includeIds) return;

//     this.loading = true;
//     this.dropdownService.getDropdownData(this.endpoint, this.currentSearchTerm, this.page, this.limit, includeIds, this.extraParams).subscribe({
//       next: (res) => {
//         const newData = res.data || [];
//         this.isLastPage = !res.hasMore;
//         if (resetOptions) {
//           this.options = newData;
//         } else {
//           const existingIds = new Set(this.options.map(o => o.value));
//           const uniqueNewData = newData.filter(item => !existingIds.has(item.value));
//           this.options = [...this.options, ...uniqueNewData];
//         }
//         this.loading = false;
//       },
//       error: () => this.loading = false
//     });
//   }

//   onSearch(event: any) {
//     this.searchSubject.next(event.filter || '');
//   }

//   onScroll(event: any) {
//     const { first, rows } = event;
//     const scrollPage = Math.floor(first / rows) + 1;

//     if (scrollPage > this.page && !this.loading && !this.isLastPage) {
//       this.page = scrollPage;
//       this.fetchData(false);
//     }
//   }

//   onSelectionChange(newValue: any) {
//     this.value = newValue;
//     this.onChange(this.value);
//     this.onTouched();
//     this.onChangeEvent.emit(this.value);
    
//     // Find the full object and emit it
//     if (!this.isMulti) {
//       if (newValue === null || newValue === undefined) {
//         this.onSelect.emit(null);
//         return;
//       }
//       const selectedOption = this.options.find(opt => opt.value === newValue);
//       if (selectedOption) {
//         this.onSelect.emit(selectedOption.data);
//       } else {
//         this.onSelect.emit(null);
//       }
//     } else {
//       if (!newValue || newValue.length === 0) {
//         this.onSelect.emit([]);
//         return;
//       }
//       const selectedOptions = this.options.filter(opt => newValue.includes(opt.value)).map(opt => opt.data);
//       this.onSelect.emit(selectedOptions);
//     }
//   }

//   writeValue(obj: any): void {
//     this.value = obj;
//     if (!obj) return;

//     const idsToCheck = Array.isArray(obj) ? obj : [obj];
//     const missingIds = idsToCheck.filter(id => !this.options.find(opt => opt.value === id));

//     if (missingIds.length > 0) {
//       this.fetchData(false, missingIds);
//     }
//   }

//   registerOnChange(fn: any): void { this.onChange = fn; }
//   registerOnTouched(fn: any): void { this.onTouched = fn; }
//   setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
// }



























// // import { Component, Input, OnInit, OnDestroy, forwardRef, inject } from '@angular/core';
// // import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
// // import { SelectModule } from 'primeng/select';
// // import { MultiSelectModule } from 'primeng/multiselect';
// // import { Subject, Subscription } from 'rxjs';
// // import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
// // import { MasterDropdownService, DropdownEndpoint, DropdownOption } from '../../../../core/services/master-dropdown.service';

// // @Component({
// //   selector: 'app-master-dropdown',
// //   standalone: true,
// //   imports: [FormsModule, SelectModule, MultiSelectModule],
// //   template: `
// //     <div class="flex justify-center w-full">
      
// //       @if (!isMulti) {
// //         <p-select 
// //           [options]="options"
// //           [(ngModel)]="value"
// //           (onChange)="onSelectionChange($event.value)"
// //           (onFilter)="onSearch($event)"
// //           (onLazyLoad)="onScroll($event)"
// //           [filter]="true" 
// //           filterBy="label"
// //           [virtualScroll]="true" 
// //           [virtualScrollItemSize]="38"
// //           [lazy]="true"
// //           [placeholder]="placeholder"
// //           [loading]="loading"
// //           [disabled]="disabled"
// //           appendTo="body"
// //           class="w-full"
// //           styleClass="w-full">
// //         </p-select>
// //       }

// //       @if (isMulti) {
// //         <p-multiselect 
// //           [options]="options"
// //           [(ngModel)]="value"
// //           (onChange)="onSelectionChange($event.value)"
// //           (onFilter)="onSearch($event)"
// //           (onLazyLoad)="onScroll($event)"
// //           [filter]="true" 
// //           filterBy="label"
// //           [virtualScroll]="true" 
// //           [virtualScrollItemSize]="43"
// //           [lazy]="true"
// //           [placeholder]="placeholder"
// //           [loading]="loading"
// //           [disabled]="disabled"
// //           [showToggleAll]="false" 
// //           [maxSelectedLabels]="3"
// //           appendTo="body"
// //           display="chip"
// //           class="w-full"
// //           styleClass="w-full">
// //         </p-multiselect>
// //       }

// //     </div>
// //   `,
// //   providers: [
// //     {
// //       provide: NG_VALUE_ACCESSOR,
// //       useExisting: forwardRef(() => MasterDropdownComponent),
// //       multi: true
// //     }
// //   ]
// // })
// // export class MasterDropdownComponent implements OnInit, OnDestroy, ControlValueAccessor {
// //   @Input({ required: true }) endpoint!: DropdownEndpoint;
// //   @Input() isMulti: boolean = false;
// //   @Input() placeholder: string = 'Select an option...';
// //   @Input() searchField?: string;
// //   @Input() labelField?: string;

// //   private dropdownService = inject(MasterDropdownService);
// //   options: DropdownOption[] = [];
// //   loading: boolean = false;
// //   value: any = null;
// //   disabled: boolean = false;

// //   private page: number = 1;
// //   private rowsPerPage: number = 50;
// //   private currentSearchTerm: string = '';
// //   private isLastPage: boolean = false;

// //   private searchSubject = new Subject<string>();
// //   private searchSubscription!: Subscription;

// //   onChange = (value: any) => { };
// //   onTouched = () => { };

// //   ngOnInit() {
// //     this.searchSubscription = this.searchSubject.pipe(
// //       debounceTime(400),
// //       distinctUntilChanged()
// //     ).subscribe((searchTerm) => {
// //       this.currentSearchTerm = searchTerm;
// //       this.page = 1;
// //       this.isLastPage = false;
// //       this.fetchData(true);
// //     });

// //     this.fetchData(true);
// //   }

// //   ngOnDestroy() {
// //     if (this.searchSubscription) this.searchSubscription.unsubscribe();
// //   }

// //   private fetchData(resetOptions: boolean = false, includeIds?: string[]) {
// //     if (this.isLastPage && !resetOptions && !includeIds) return;

// //     this.loading = true;
// //     this.dropdownService.getDropdownData(
// //       this.endpoint, this.currentSearchTerm, this.page, this.searchField, this.labelField, includeIds
// //     ).subscribe({
// //       next: (newData) => {
// //         if (newData.length < this.rowsPerPage && !includeIds) {
// //           this.isLastPage = true;
// //         }

// //         if (resetOptions) {
// //           this.options = newData;
// //         } else {
// //           const existingIds = new Set(this.options.map(o => o.value));
// //           const uniqueNewData = newData.filter((item: DropdownOption) => !existingIds.has(item.value));
// //           this.options = [...this.options, ...uniqueNewData];
// //         }
// //         this.loading = false;
// //       },
// //       error: () => this.loading = false
// //     });
// //   }

// //   onSearch(event: any) {
// //     this.searchSubject.next(event.filter || '');
// //   }

// //   onScroll(event: any) {
// //     const { first, rows } = event;
// //     const scrollPage = Math.floor(first / rows) + 1;

// //     if (scrollPage > this.page && !this.loading && !this.isLastPage) {
// //       this.page = scrollPage;
// //       this.fetchData(false);
// //     }
// //   }

// //   onSelectionChange(newValue: any) {
// //     this.value = newValue;
// //     this.onChange(this.value);
// //     this.onTouched();
// //   }

// //   writeValue(obj: any): void {
// //     this.value = obj;
// //     if (!obj) return;

// //     const idsToCheck = Array.isArray(obj) ? obj : [obj];
// //     const missingIds = idsToCheck.filter(id => !this.options.find(opt => opt.value === id));

// //     if (missingIds.length > 0) {
// //       this.fetchData(false, missingIds);
// //     }
// //   }

// //   registerOnChange(fn: any): void { this.onChange = fn; }
// //   registerOnTouched(fn: any): void { this.onTouched = fn; }
// //   setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
// // }