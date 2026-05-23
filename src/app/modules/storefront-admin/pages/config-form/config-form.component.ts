// src/app/features/storefront-admin/pages/config-form/config-form.component.ts
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewEncapsulation,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { DynamicFieldRendererComponent } from '../../schema/dynamic-field-renderer.component';
import { DynamicFormEngineService } from '../../schema/dynamic-form-engine.service';
import { DynamicFieldDefinition, DynamicFormTabs, SectionFieldSchema } from '../../schema/section-schema.types';

@Component({
  selector: 'app-config-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TabsModule,
    DynamicFieldRendererComponent
  ],
  templateUrl: './config-form.component.html',
  styleUrls: ['./config-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ConfigFormComponent implements OnChanges, OnDestroy {
  @Input() config: Record<string, unknown> = {};
  @Input() schema: Record<string, SectionFieldSchema> = {};
  @Input() masters: any = { categories: [], brands: [], tags: [], products: [] };
  @Output() configChange = new EventEmitter<Record<string, unknown>>();

  private readonly engine = inject(DynamicFormEngineService);
  private readonly destroy$ = new Subject<void>();
  private readonly rebuild$ = new Subject<void>();

  private lastSchemaKey = '';

  /**
   * Guards the valueChanges subscription from firing while we are
   * programmatically patching the form via patchValue().
   *
   * Without this, the cycle is:
   *   patchValue() → valueChanges → configChange.emit()
   *     → parent.onConfigChange() → selectedSection.set()
   *       → [config] @Input changes → ngOnChanges → patchValue() → ∞
   */
  private _isPatching = false;

  form: FormGroup = new FormGroup({});
  activeTab = '0';
  tabs: DynamicFormTabs = { content: [], settings: [], style: [] };
  booleanGroup: DynamicFieldDefinition[] = [];
  expandedControls = new Map<AbstractControl, boolean>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema']) {
      const newKey = JSON.stringify(this.schema ?? {});
      if (newKey !== this.lastSchemaKey) {
        this.lastSchemaKey = newKey;
        this.buildForm();
      }
      return;
    }

    if (changes['config'] && !changes['config'].firstChange) {
      try {
        this._isPatching = true;
        this.form.patchValue(this.config ?? {}, { emitEvent: false });
      } catch {
        this.buildForm();
      } finally {
        this._isPatching = false;
      }
    }
  }

  buildForm(): void {
    this.rebuild$.next();
    this.expandedControls.clear();

    const result = this.engine.build(this.schema ?? {}, this.config ?? {});
    this.form         = result.form;
    this.tabs         = result.tabs;
    this.booleanGroup = result.booleans;

    this.form.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.rebuild$),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        if (this._isPatching) return;
        this.configChange.emit(this.engine.cleanValue(value));
      });
  }

  emitCurrentValue(): void {
    this.configChange.emit(this.engine.cleanValue(this.form.value));
  }

  ngOnDestroy(): void {
    this.rebuild$.next();
    this.rebuild$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
// // src/app/features/storefront-admin/pages/config-form/config-form.component.ts
// import {
//   Component,
//   EventEmitter,
//   Input,
//   OnChanges,
//   OnDestroy,
//   Output,
//   SimpleChanges,
//   ViewEncapsulation,
//   inject
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
// import { TabsModule } from 'primeng/tabs';
// import { Subject, takeUntil } from 'rxjs';
// import { DynamicFieldRendererComponent } from '../../schema/dynamic-field-renderer.component';
// import { DynamicFormEngineService } from '../../schema/dynamic-form-engine.service';
// import { DynamicFieldDefinition, DynamicFormTabs, SectionFieldSchema } from '../../schema/section-schema.types';

// @Component({
//   selector: 'app-config-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     TabsModule,
//     DynamicFieldRendererComponent
//   ],
//   templateUrl: './config-form.component.html',
//   styleUrls: ['./config-form.component.scss'],
//   encapsulation: ViewEncapsulation.None
// })
// export class ConfigFormComponent implements OnChanges, OnDestroy {
//   @Input() config: Record<string, unknown> = {};
//   @Input() schema: Record<string, SectionFieldSchema> = {};
//   @Input() masters: any = { categories: [], brands: [], tags: [], products: [] };
//   @Output() configChange = new EventEmitter<Record<string, unknown>>();

//   private readonly engine = inject(DynamicFormEngineService);
//   private readonly destroy$ = new Subject<void>();
//   private readonly rebuild$ = new Subject<void>();
//   private lastSchemaKey = '';

//   form: FormGroup = new FormGroup({});
//   activeTab = '0';
//   tabs: DynamicFormTabs = { content: [], settings: [], style: [] };
//   booleanGroup: DynamicFieldDefinition[] = [];
//   expandedControls = new Map<AbstractControl, boolean>();

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['schema']) {
//       const newKey = JSON.stringify(this.schema ?? {});
//       if (newKey !== this.lastSchemaKey) {
//         this.lastSchemaKey = newKey;
//         this.buildForm();
//       }
//       return;
//     }

//     if (changes['config'] && !changes['config'].firstChange) {
//       try {
//         this.form.patchValue(this.config ?? {}, { emitEvent: false });
//       } catch {
//         this.buildForm();
//       }
//     }
//   }

//   buildForm(): void {
//     this.rebuild$.next();
//     this.expandedControls.clear();

//     const result = this.engine.build(this.schema ?? {}, this.config ?? {});
//     this.form = result.form;
//     this.tabs = result.tabs;
//     this.booleanGroup = result.booleans;

//     this.form.valueChanges
//       .pipe(takeUntil(this.rebuild$), takeUntil(this.destroy$))
//       .subscribe(value => this.configChange.emit(this.engine.cleanValue(value)));
//   }

//   emitCurrentValue(): void {
//     this.configChange.emit(this.engine.cleanValue(this.form.value));
//   }

//   ngOnDestroy(): void {
//     this.rebuild$.next();
//     this.rebuild$.complete();
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }
