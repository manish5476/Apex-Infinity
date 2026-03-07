import { Component, Input, OnInit, OnDestroy, forwardRef, inject } from '@angular/core';
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
          [options]="options"
          [(ngModel)]="value"
          (onChange)="onSelectionChange($event.value)"
          (onFilter)="onSearch($event)"
          (onLazyLoad)="onScroll($event)"
          [filter]="true" 
          filterBy="label"
          [virtualScroll]="true" 
          [virtualScrollItemSize]="38"
          [lazy]="true"
          [placeholder]="placeholder"
          [loading]="loading"
          [disabled]="disabled"
          appendTo="body"
          class="w-full"
          styleClass="w-full">
        </p-select>
      }

      @if (isMulti) {
        <p-multiselect 
          [options]="options"
          [(ngModel)]="value"
          (onChange)="onSelectionChange($event.value)"
          (onFilter)="onSearch($event)"
          (onLazyLoad)="onScroll($event)"
          [filter]="true" 
          filterBy="label"
          [virtualScroll]="true" 
          [virtualScrollItemSize]="43"
          [lazy]="true"
          [placeholder]="placeholder"
          [loading]="loading"
          [disabled]="disabled"
          [showToggleAll]="false" 
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
export class MasterDropdownComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input({ required: true }) endpoint!: DropdownEndpoint;
  @Input() isMulti: boolean = false;
  @Input() placeholder: string = 'Select an option...';
  @Input() searchField?: string;
  @Input() labelField?: string;

  private dropdownService = inject(MasterDropdownService);
  options: DropdownOption[] = [];
  loading: boolean = false;
  value: any = null;
  disabled: boolean = false;

  private page: number = 1;
  private rowsPerPage: number = 50;
  private currentSearchTerm: string = '';
  private isLastPage: boolean = false;

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  onChange = (value: any) => { };
  onTouched = () => { };

  ngOnInit() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((searchTerm) => {
      this.currentSearchTerm = searchTerm;
      this.page = 1;
      this.isLastPage = false;
      this.fetchData(true);
    });

    this.fetchData(true);
  }

  ngOnDestroy() {
    if (this.searchSubscription) this.searchSubscription.unsubscribe();
  }

  private fetchData(resetOptions: boolean = false, includeIds?: string[]) {
    if (this.isLastPage && !resetOptions && !includeIds) return;

    this.loading = true;
    this.dropdownService.getDropdownData(
      this.endpoint, this.currentSearchTerm, this.page, this.searchField, this.labelField, includeIds
    ).subscribe({
      next: (newData) => {
        if (newData.length < this.rowsPerPage && !includeIds) {
          this.isLastPage = true;
        }

        if (resetOptions) {
          this.options = newData;
        } else {
          const existingIds = new Set(this.options.map(o => o.value));
          const uniqueNewData = newData.filter((item: DropdownOption) => !existingIds.has(item.value));
          this.options = [...this.options, ...uniqueNewData];
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearch(event: any) {
    this.searchSubject.next(event.filter || '');
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
  }

  writeValue(obj: any): void {
    this.value = obj;
    if (!obj) return;

    const idsToCheck = Array.isArray(obj) ? obj : [obj];
    const missingIds = idsToCheck.filter(id => !this.options.find(opt => opt.value === id));

    if (missingIds.length > 0) {
      this.fetchData(false, missingIds);
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}