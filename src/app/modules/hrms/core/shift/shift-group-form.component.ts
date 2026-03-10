import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';
import { HRMSService } from '../../hrms.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-shift-group-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, CardModule, ButtonModule,
    InputTextModule, TextareaModule, SelectModule, MultiSelectModule,
    DatePickerModule, ToastModule, SkeletonModule, InputNumberModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

    <div class="app-fullscreen-wrapper fade-in">
      
      <header class="dashboard-header glass-header">
        <div class="header-left">
          <button class="icon-btn back-btn" type="button" (click)="onCancel()" title="Go Back">
            <i class="pi pi-arrow-left"></i>
          </button>
          <div>
            <h1 class="page-title">{{ isEditMode() ? 'Edit Shift Group' : 'Create Shift Group' }}</h1>
            <p class="page-subtitle">{{ isEditMode() ? 'Modify existing rotation rules.' : 'Define a new rotating shift pattern.' }}</p>
          </div>
        </div>
        
        <div class="header-right">
          <div class="header-status" [class.valid]="form.valid">
            <div class="status-dot"></div>
            <span>{{ form.valid ? 'Ready' : 'Draft' }}</span>
          </div>
          <button type="button" class="btn btn-outline" (click)="onCancel()" [disabled]="isSaving() || isLoading()">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="isSaving() || isLoading() || form.invalid" (click)="onSubmit()">
            <ng-container *ngIf="!isSaving(); else loadingState">
              <i class="pi pi-save"></i>
              <span>{{ isEditMode() ? 'Update' : 'Save' }}</span>
            </ng-container>
            <ng-template #loadingState>
              <i class="pi pi-spin pi-spinner"></i>
              <span>{{ isEditMode() ? 'Updating...' : 'Saving...' }}</span>
            </ng-template>
          </button>
        </div>
      </header>

      <main class="dashboard-content" [class.loading-opacity]="isLoading()">
        
        @if (isLoading()) {
          <div class="bento-grid">
            <div class="span-2"><p-skeleton height="20rem" borderRadius="16px"></p-skeleton></div>
            <div><p-skeleton height="20rem" borderRadius="16px"></p-skeleton></div>
            <div class="span-3"><p-skeleton height="15rem" borderRadius="16px"></p-skeleton></div>
            <div class="span-3"><p-skeleton height="15rem" borderRadius="16px"></p-skeleton></div>
          </div>
        } @else {
          <form [formGroup]="form" class="bento-grid pb-6">
            
            <p-card styleClass="grid-card span-2 card-anim-1">
              <ng-template pTemplate="header">
                <div class="card-header-custom">
                  <i class="pi pi-info-circle text-primary"></i>
                  <h2>General Information</h2>
                </div>
              </ng-template>
              
              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="name">Group Name <span class="required">*</span></label>
                  <div class="input-icon-wrapper">
                    <i class="pi pi-id-card input-icon"></i>
                    <input id="name" type="text" formControlName="name" class="se-input with-icon" placeholder="e.g. Nursing Rotation A">
                  </div>
                </div>

                <div class="form-field">
                  <label for="code">System Code <span class="required">*</span></label>
                  <div class="input-icon-wrapper">
                    <i class="pi pi-tag input-icon"></i>
                    <input id="code" type="text" formControlName="code" class="se-input with-icon uppercase-input" placeholder="e.g. NURS-ROT-A">
                  </div>
                </div>

                <div class="form-field">
                  <label for="organizationId">Organization <span class="required">*</span></label>
                  <p-select 
                    id="organizationId" 
                    formControlName="organizationId" 
                    [options]="organizations" 
                    optionLabel="name" 
                    optionValue="id" 
                    placeholder="Select Org" 
                    styleClass="w-full prime-override" 
                    appendTo="body">
                  </p-select>
                </div>

                <div class="form-field">
                  <label for="branchId">Branch Assignment</label>
                  <p-select 
                    id="branchId" 
                    formControlName="branchId" 
                    [options]="branches" 
                    optionLabel="name" 
                    optionValue="id" 
                    placeholder="Select Branch" 
                    [showClear]="true" 
                    styleClass="w-full prime-override" 
                    appendTo="body">
                  </p-select>
                </div>

                <div class="form-field">
                  <label for="effectiveFrom">Effective From</label>
                  <p-datepicker 
                    id="effectiveFrom" 
                    formControlName="effectiveFrom" 
                    [showIcon]="false" 
                    iconDisplay="input" 
                    placeholder="Start Date" 
                    dateFormat="dd/mm/yy" 
                    styleClass="w-full prime-override-date" 
                    appendTo="body">
                  </p-datepicker>
                </div>

                <div class="form-field">
                  <label for="effectiveTo">Effective To</label>
                  <p-datepicker 
                    id="effectiveTo" 
                    formControlName="effectiveTo" 
                    [showIcon]="false" 
                    iconDisplay="input" 
                    placeholder="End Date (Optional)" 
                    dateFormat="dd/mm/yy" 
                    [showClear]="true" 
                    styleClass="w-full prime-override-date" 
                    appendTo="body">
                  </p-datepicker>
                </div>

                <div class="form-field span-2-inner">
                  <label for="description">Description</label>
                  <textarea 
                    pTextarea 
                    id="description" 
                    formControlName="description" 
                    rows="2" 
                    [autoResize]="true" 
                    class="w-full" 
                    placeholder="Describe the purpose of this shift group...">
                  </textarea>
                </div>
              </div>
            </p-card>

            <p-card styleClass="grid-card card-anim-2">
              <ng-template pTemplate="header">
                <div class="card-header-custom">
                  <i class="pi pi-users text-primary"></i>
                  <h2>Applicability & Status</h2>
                </div>
              </ng-template>
              
              <div class="flex-col gap-4 h-full">
                <p class="description-text mb-2">Select which departments and roles this group applies to.</p>
                
                <div class="form-field">
                  <label for="applicableDepartments">Applicable Departments</label>
                  <p-multiSelect 
                    id="applicableDepartments" 
                    formControlName="applicableDepartments" 
                    [options]="departments" 
                    optionLabel="name" 
                    optionValue="id" 
                    placeholder="Select Departments" 
                    [filter]="true" 
                    display="chip" 
                    styleClass="w-full prime-override-multi" 
                    appendTo="body">
                  </p-multiSelect>
                </div>

                <div class="form-field">
                  <label for="applicableDesignations">Applicable Designations</label>
                  <p-multiSelect 
                    id="applicableDesignations" 
                    formControlName="applicableDesignations" 
                    [options]="designations" 
                    optionLabel="name" 
                    optionValue="id" 
                    placeholder="Select Designations" 
                    [filter]="true" 
                    display="chip" 
                    styleClass="w-full prime-override-multi" 
                    appendTo="body">
                  </p-multiSelect>
                </div>

                <div class="status-toggle-wrapper mt-auto border-primary">
                  <label class="toggle-container">
                    <input type="checkbox" formControlName="isActive" class="toggle-input">
                    <span class="toggle-slider"></span>
                    <div class="toggle-text"><span class="toggle-label font-bold">Group is Active</span></div>
                  </label>
                </div>
              </div>
            </p-card>

            <p-card styleClass="grid-card span-3 card-anim-3">
              <ng-template pTemplate="header">
                <div class="card-header-custom flex-between w-full">
                  <div class="flex-align gap-2">
                    <i class="pi pi-clock text-primary"></i>
                    <h2>Shifts in Rotation</h2>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" (click)="addShift()">
                    <i class="pi pi-plus"></i> Add Shift
                  </button>
                </div>
              </ng-template>
              
              <p class="description-text mb-4">Add the individual shifts that make up this rotation group. Assign a sequence number to define their order.</p>

              <div formArrayName="shifts" class="flex-col gap-3">
                @for (shiftCtrl of shiftsArray.controls; track $index) {
                  <div [formGroupName]="$index" class="array-row fade-in">
                    <div class="drag-handle"><i class="pi pi-bars"></i></div>
                    
                    <div class="form-field flex-1 m-0">
                      <p-select 
                        formControlName="shiftId" 
                        [options]="availableShifts" 
                        optionLabel="name" 
                        optionValue="id" 
                        placeholder="Select Shift Model" 
                        styleClass="w-full prime-override" 
                        appendTo="body">
                      </p-select>
                    </div>
                    
                    <div class="form-field w-8rem m-0">
                      <p-inputNumber 
                        formControlName="sequence" 
                        placeholder="Seq" 
                        [showButtons]="true" 
                        [min]="1" 
                        styleClass="w-full">
                      </p-inputNumber>
                    </div>

                    <div class="form-field w-6rem m-0 flex-align justify-center">
                      <div class="color-picker-wrapper" pTooltip="UI Indicator Color" tooltipPosition="top">
                        <input type="color" formControlName="color" class="color-picker-input" />
                      </div>
                    </div>

                    <button type="button" class="icon-btn-danger" (click)="removeShift($index)" pTooltip="Remove" tooltipPosition="left">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                }
                
                @if (shiftsArray.length === 0) {
                  <div class="empty-array-state">
                    <i class="pi pi-calendar-plus"></i>
                    <p>No shifts added. Click "Add Shift" to include shifts in this group.</p>
                  </div>
                }
              </div>
            </p-card>

            <p-card styleClass="grid-card span-3 card-anim-4">
              <ng-template pTemplate="header">
                <div class="card-header-custom flex-between w-full">
                  <div class="flex-align gap-2">
                    <i class="pi pi-sync text-primary"></i>
                    <h2>Rotation Pattern</h2>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" (click)="addRotationPattern()">
                    <i class="pi pi-plus"></i> Add Pattern Rule
                  </button>
                </div>
              </ng-template>

              <div class="inner-grid-3 mb-4">
                <div class="form-field">
                  <label for="rotationType">Rotation Frequency <span class="required">*</span></label>
                  <p-select 
                    id="rotationType" 
                    formControlName="rotationType" 
                    [options]="rotationTypes" 
                    optionLabel="label" 
                    optionValue="value" 
                    styleClass="w-full prime-override" 
                    appendTo="body">
                  </p-select>
                </div>
              </div>

              <div formArrayName="rotationPattern" class="flex-col gap-3">
                @for (patternCtrl of rotationPatternArray.controls; track $index) {
                  <div [formGroupName]="$index" class="array-row fade-in">
                    
                    <div class="form-field flex-row-center gap-3 m-0 w-12rem">
                      <span class="data-label text-secondary m-0">Day Offset:</span>
                      <p-inputNumber 
                        formControlName="dayOffset" 
                        [min]="0" 
                        styleClass="w-full">
                      </p-inputNumber>
                    </div>
                    
                    <div class="form-field flex-1 m-0">
                      <p-select 
                        formControlName="shiftId" 
                        [options]="availableShifts" 
                        optionLabel="name" 
                        optionValue="id" 
                        placeholder="Assign Shift (Leave blank for Day Off)" 
                        [showClear]="true" 
                        styleClass="w-full prime-override" 
                        appendTo="body">
                      </p-select>
                    </div>

                    <button type="button" class="icon-btn-danger" (click)="removeRotationPattern($index)" pTooltip="Remove" tooltipPosition="left">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                }
                
                @if (rotationPatternArray.length === 0) {
                  <div class="empty-array-state">
                    <i class="pi pi-sitemap"></i>
                    <p>No pattern defined. Add offsets mapping days to specific shifts.</p>
                  </div>
                }
              </div>
            </p-card>

          </form>
        }
      </main>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       BASE THEME & LAYOUT 
       ========================================================================== */
    :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-secondary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    
    /* Utilities */
    .flex-col { display: flex; flex-direction: column; }
    .flex-align { display: flex; align-items: center; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-row-center { display: flex; align-items: center; }
    .justify-center { justify-content: center; }
    .flex-1 { flex: 1; }
    .h-full { height: 100%; }
    .w-full { width: 100%; }
    .w-6rem { width: 6rem; }
    .w-8rem { width: 8rem; }
    .w-12rem { width: 12rem; }
    
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    .m-0 { margin: 0 !important; }
    .mt-1 { margin-top: 4px; }
    .mt-auto { margin-top: auto; }
    .mb-2 { margin-bottom: var(--spacing-sm); }
    .mb-4 { margin-bottom: var(--spacing-lg); }
    .pb-6 { padding-bottom: var(--spacing-4xl); }
    
    .font-bold { font-weight: 700; }
    .text-primary { color: var(--color-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .border-primary { border-color: var(--color-primary) !important; }

    /* --------------------------------------------------------------------------
       HEADER
       -------------------------------------------------------------------------- */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-2xl); background: var(--bg-primary); border-bottom: 1px solid var(--border-secondary); z-index: 50; flex-shrink: 0; box-shadow: var(--shadow-xs); }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-btn { background: var(--bg-secondary); border: 1px solid var(--border-secondary); color: var(--text-secondary); border-radius: var(--ui-border-radius-lg); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; font-size: 18px; }
    .icon-btn:hover { background: var(--bg-primary); color: var(--text-primary); border-color: var(--color-primary); }
    
    .page-title { font-family: var(--font-heading); font-size: 24px; font-weight: 800; margin: 0 0 2px 0; line-height: 1.2; letter-spacing: -0.5px; }
    .page-subtitle { font-size: 13px; color: var(--text-secondary); margin: 0; }
    
    /* Header Status */
    .header-status { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: var(--text-secondary); padding: 6px 14px; background: var(--bg-secondary); border-radius: 20px; border: 1px solid var(--border-secondary); margin-right: var(--spacing-md); text-transform: uppercase; letter-spacing: 0.5px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-tertiary); }
    .header-status.valid { color: var(--color-success); border-color: var(--color-success-border); background: var(--color-success-bg); }
    .header-status.valid .status-dot { background: var(--color-success); }
    
    /* Buttons */
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 20px; font-size: 14px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border: none; }
    .btn-sm { height: 32px; padding: 0 14px; font-size: 12px; border-radius: 6px; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline { background: var(--bg-primary); border: 1px solid var(--border-secondary); color: var(--text-primary); }
    .btn-outline:not(:disabled):hover { background: var(--bg-secondary); border-color: var(--text-tertiary); }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .btn-primary:not(:disabled):hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
    
    .icon-btn-danger { background: var(--color-error-bg); color: var(--color-error); border: 1px solid var(--color-error-border); border-radius: 8px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 16px; }
    .icon-btn-danger:hover { background: var(--color-error); color: white; }

    /* --------------------------------------------------------------------------
       MAIN CONTENT & BENTO GRID
       -------------------------------------------------------------------------- */
    .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-2xl) var(--spacing-3xl); background: var(--bg-secondary); transition: opacity 0.3s; }
    .loading-opacity { opacity: 0.5; pointer-events: none; filter: grayscale(50%); }
    
    .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-2xl); align-items: start; max-width: 1600px; margin: 0 auto; }
    .span-2 { grid-column: span 2; } 
    .span-2-inner { grid-column: span 2; }
    .span-3 { grid-column: span 3; }
    
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
    .inner-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); }

    /* --------------------------------------------------------------------------
       P-CARD OVERRIDES (Premium Glass Look)
       -------------------------------------------------------------------------- */
    // ::ng-deep .grid-card .p-card { height: 100%; border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-secondary); background: var(--bg-primary); display: flex; flex-direction: column; transition: all 0.2s ease; overflow: hidden; background-clip: padding-box; }
    // ::ng-deep .grid-card .p-card:hover { box-shadow: var(--shadow-md); border-color: var(--color-primary-light, var(--border-primary)); }
    
    // ::ng-deep .grid-card .p-card-header { padding: 0; }
    .card-header-custom { padding: var(--spacing-xl) var(--spacing-2xl); background: var(--bg-secondary); border-bottom: 1px solid var(--border-secondary); display: flex; align-items: center; gap: 12px; border-top-left-radius: calc(var(--ui-border-radius-lg) - 1px); border-top-right-radius: calc(var(--ui-border-radius-lg) - 1px); }
    .card-header-custom h2 { margin: 0; font-size: 16px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.3px; }
    .card-header-custom i { font-size: 18px; }

    // ::ng-deep .grid-card .p-card-body { padding: var(--spacing-2xl); flex: 1; display: flex; flex-direction: column; }
    // ::ng-deep .grid-card .p-card-content { padding: 0; flex: 1; display: flex; flex-direction: column; }

    /* --------------------------------------------------------------------------
       FORM FIELDS & INPUTS
       -------------------------------------------------------------------------- */
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
    .data-label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
    .required { color: var(--color-error); font-weight: bold; margin-left: 2px; }

    .input-icon-wrapper { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 14px; color: var(--text-tertiary); font-size: 14px; z-index: 1; }
    
    .se-input { 
      width: 100%; background: var(--bg-primary); border: 1px solid var(--border-secondary); 
      border-radius: 8px; padding: 0 16px; font-size: 14px; font-family: var(--font-body); 
      color: var(--text-primary); box-sizing: border-box; height: 42px; font-weight: 500;
      transition: all 0.2s ease; outline: none;
    }
    .se-input.with-icon { padding-left: 40px; }
    .se-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    .se-input::placeholder { color: var(--text-tertiary); font-weight: 400; }
    
    .uppercase-input { text-transform: uppercase; font-family: var(--font-mono); font-weight: 600; letter-spacing: 0.5px; }

    // /* PrimeNG Overrides */
    // ::ng-deep .prime-override.p-select, 
    // ::ng-deep .prime-override-multi.p-multiselect,
    // ::ng-deep .prime-override-date .p-inputtext,
    // ::ng-deep .p-inputtext,
    // ::ng-deep .p-inputnumber-input {
    //   width: 100%; height: 42px; background: var(--bg-primary);
    //   border: 1px solid var(--border-secondary); border-radius: 8px;
    //   font-family: var(--font-body); font-size: 14px; font-weight: 500;
    //   color: var(--text-primary); display: flex; align-items: center;
    //   transition: all 0.2s ease; box-shadow: none; box-sizing: border-box;
    // }
    // ::ng-deep p-textarea.p-inputtext, ::ng-deep textarea.p-inputtext { height: auto; min-height: 80px; padding: 12px 16px; line-height: 1.5; }
    // ::ng-deep .p-inputtext:not(:disabled):hover, ::ng-deep .prime-override.p-select:not(.p-disabled):hover, ::ng-deep .prime-override-multi.p-multiselect:not(.p-disabled):hover { border-color: var(--text-tertiary); }
    // ::ng-deep .p-inputtext:focus, ::ng-deep .p-inputwrapper-focus .p-inputtext, ::ng-deep .prime-override.p-select.p-focus, ::ng-deep .prime-override-multi.p-multiselect.p-focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    // ::ng-deep .prime-override-multi .p-multiselect-label { padding: 4px 12px; }
    // ::ng-deep .prime-override-date .p-datepicker-input-icon-container { color: var(--text-tertiary); }

    /* --------------------------------------------------------------------------
       FORM ARRAYS & CUSTOM INPUTS
       -------------------------------------------------------------------------- */
    .array-row { 
      display: flex; align-items: center; gap: var(--spacing-lg); padding: var(--spacing-lg); 
      background: var(--bg-primary); border: 1px solid var(--border-secondary); 
      border-radius: 12px; transition: all 0.2s ease; 
    }
    .array-row:hover { border-color: var(--color-primary-border); box-shadow: var(--shadow-sm); }
    
    .drag-handle { cursor: grab; padding: 0 4px; color: var(--text-tertiary); font-size: 18px; }
    .drag-handle:hover { color: var(--text-primary); }

    .color-picker-wrapper { width: 42px; height: 42px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-secondary); display: flex; cursor: pointer; }
    .color-picker-input { -webkit-appearance: none; border: none; width: 150%; height: 150%; margin: -25%; cursor: pointer; padding: 0; }

    .empty-array-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 20px; background: var(--bg-secondary); border-radius: 12px; border: 1px dashed var(--border-secondary); color: var(--text-tertiary); text-align: center; }
    .empty-array-state i { font-size: 24px; margin-bottom: 8px; }
    .empty-array-state p { margin: 0; font-size: 13px; }
    .description-text { font-size: 14px; color: var(--text-secondary); line-height: 1.5; }

    /* Premium Toggle Switch */
    .status-toggle-wrapper { padding: var(--spacing-lg); background: var(--bg-secondary); border: 1px solid var(--border-secondary); border-radius: 12px; }
    .toggle-container { display: flex; align-items: center; cursor: pointer; gap: 14px; }
    .toggle-input { display: none; }
    .toggle-slider { position: relative; width: 44px; height: 24px; background-color: var(--border-secondary); border-radius: 24px; transition: all 0.3s ease; flex-shrink: 0; }
    .toggle-slider::before { content: ""; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: #ffffff; border-radius: 50%; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: var(--shadow-sm); }
    .toggle-input:checked + .toggle-slider { background-color: var(--color-success); }
    .toggle-input:checked + .toggle-slider::before { transform: translateX(20px); }
    .toggle-label { font-size: 14px; color: var(--text-primary); font-weight: 500; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(15px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .fade-in { animation: fadeIn 0.4s ease; }
    .card-anim-1 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.05s both; } 
    .card-anim-2 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.1s both; } 
    .card-anim-3 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.15s both; } 
    .card-anim-4 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.2s both; }

    /* Responsive */
    @media (max-width: 1200px) { .bento-grid { grid-template-columns: repeat(2, 1fr); } .span-2, .span-3 { grid-column: span 2; } }
    @media (max-width: 768px) { 
      .dashboard-content { padding: var(--spacing-lg); } 
      .dashboard-header { flex-direction: column; align-items: flex-start; gap: var(--spacing-lg); } 
      .header-right { width: 100%; justify-content: flex-end; } 
      .bento-grid { grid-template-columns: 1fr; } 
      .span-2, .span-2-inner, .span-3 { grid-column: span 1; } 
      .inner-grid-2, .inner-grid-3 { grid-template-columns: 1fr; } 
      .array-row { flex-wrap: wrap; }
      .w-8rem, .w-6rem, .w-12rem { width: 100%; }
    }
  `]
})
export class ShiftGroupFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form!: FormGroup;
  groupId: string | null = null;
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  isEditMode = signal<boolean>(false);

  // Mock Lookups 
  organizations = [{ id: '698f1a7feff3e811b71a590f', name: 'Main Organization' }];
  branches = [{ id: '698f1a82eff3e811b71a5916', name: 'Head Office HQ' }];
  departments = [{ id: 'd1', name: 'Sales' }, { id: 'd2', name: 'IT Support' }, { id: 'd3', name: 'Nursing' }];
  designations = [{ id: 'des1', name: 'Manager' }, { id: 'des2', name: 'Staff' }];
  
  availableShifts = [
    { id: '698f1a7feff3e811b71a5910', name: 'Morning Shift (08:00 - 16:00)' },
    { id: 'sh2', name: 'Evening Shift (16:00 - 00:00)' },
    { id: 'sh3', name: 'Night Shift (00:00 - 08:00)' }
  ];
  
  rotationTypes = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Custom', value: 'custom' }
  ];

  ngOnInit() {
    this.initForm();
    this.groupId = this.route.snapshot.paramMap.get('id');
    
    if (this.groupId) {
      this.isEditMode.set(true);
      this.loadShiftGroup(this.groupId);
    } else {
      this.isLoading.set(false);
      this.addShift();
      this.addRotationPattern();
    }
  }

  private initForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      description: [''],
      organizationId: [null, Validators.required],
      branchId: [null],
      
      shifts: this.fb.array([]),
      rotationType: ['weekly', Validators.required],
      rotationPattern: this.fb.array([]),
      
      applicableDepartments: [[]],
      applicableDesignations: [[]],
      
      isActive: [true],
      effectiveFrom: [null],
      effectiveTo: [null]
    });
  }

  get shiftsArray(): FormArray { return this.form.get('shifts') as FormArray; }
  get rotationPatternArray(): FormArray { return this.form.get('rotationPattern') as FormArray; }

  addShift(shiftData?: any) {
    const shiftGroup = this.fb.group({
      shiftId: [shiftData?.shiftId || null, Validators.required],
      sequence: [shiftData?.sequence || (this.shiftsArray.length + 1), Validators.required],
      color: [shiftData?.color || '#3b82f6']
    });
    this.shiftsArray.push(shiftGroup);
  }

  removeShift(index: number) { this.shiftsArray.removeAt(index); }

  addRotationPattern(patternData?: any) {
    const patternGroup = this.fb.group({
      dayOffset: [patternData?.dayOffset ?? this.rotationPatternArray.length, [Validators.required, Validators.min(0)]],
      shiftId: [patternData?.shiftId || null] 
    });
    this.rotationPatternArray.push(patternGroup);
  }

  removeRotationPattern(index: number) { this.rotationPatternArray.removeAt(index); }

  private loadShiftGroup(id: string) {
    this.isLoading.set(true);
    this.hrmsService.getShiftGroup(id).pipe(
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load shift group.' });
        this.onCancel();
        return of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe((res: any) => {
      const groupData = res?.data?.shiftGroup || res?.data?.data || res;
      if (groupData) {
        this.patchFormValues(groupData);
      }
    });
  }

  private patchFormValues(data: any) {
    this.form.patchValue({
      name: data.name,
      code: data.code,
      description: data.description,
      organizationId: data.organizationId,
      branchId: data.branchId,
      rotationType: data.rotationType || 'weekly',
      applicableDepartments: data.applicableDepartments || [],
      applicableDesignations: data.applicableDesignations || [],
      isActive: data.isActive ?? true,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
    });

    this.shiftsArray.clear();
    if (data.shifts && Array.isArray(data.shifts)) {
      data.shifts.forEach((s: any) => this.addShift(s));
    }

    this.rotationPatternArray.clear();
    if (data.rotationPattern && Array.isArray(data.rotationPattern)) {
      data.rotationPattern.forEach((rp: any) => this.addRotationPattern(rp));
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields correctly.' });
      return;
    }

    this.isSaving.set(true);
    const payload = { ...this.form.value };

    if (payload.effectiveFrom instanceof Date) { payload.effectiveFrom = payload.effectiveFrom.toISOString().split('T')[0]; }
    if (payload.effectiveTo instanceof Date) { payload.effectiveTo = payload.effectiveTo.toISOString().split('T')[0]; }

    const request$ = this.isEditMode() && this.groupId
      ? this.hrmsService.updateShiftGroup(this.groupId, payload)
      : this.hrmsService.createShiftGroup(payload);

    request$.pipe(
      catchError(err => {
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: err?.error?.message || 'An error occurred while saving.' });
        return of(null);
      }),
      finalize(() => this.isSaving.set(false))
    ).subscribe(res => {
      if (res) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Shift group saved successfully.' });
        setTimeout(() => this.onCancel(), 1000); 
      }
    });
  }

  onCancel() {
    this.router.navigate(['/hrms/shift-groups/list']);
  }
}

// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { catchError, finalize, forkJoin, of } from 'rxjs';

// // Services
// import { MessageService } from 'primeng/api';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { TextareaModule } from 'primeng/textarea';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { ToastModule } from 'primeng/toast';
// import { SkeletonModule } from 'primeng/skeleton';
// import { DividerModule } from 'primeng/divider';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { SelectModule } from 'primeng/select';
// import { DatePickerModule } from 'primeng/datepicker';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { HRMSService } from '../../hrms.service';

// @Component({
//   selector: 'app-shift-group-form',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, CardModule, ButtonModule,
//     InputTextModule, TextareaModule, SelectModule, MultiSelectModule,
//     DatePickerModule, ToggleSwitchModule, ToastModule, SkeletonModule,
//     DividerModule, InputNumberModule
//   ],
//   providers: [MessageService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast position="top-right"></p-toast>

//     <div class="page-wrapper fade-in">
      
//       <header class="dashboard-header slide-down mb-4">
//         <div class="header-left">
//           <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" size="large" styleClass="back-btn" (onClick)="onCancel()" pTooltip="Back to List" tooltipPosition="bottom"></p-button>
//           <div class="header-titles">
//             <h1 class="page-title">{{ isEditMode() ? 'Edit Shift Group' : 'Create Shift Group' }}</h1>
//             <p class="page-subtitle">{{ isEditMode() ? 'Modify existing rotation rules.' : 'Define a new rotating shift pattern.' }}</p>
//           </div>
//         </div>
//       </header>

//       @if (isLoading()) {
//         <p-card styleClass="premium-card glass-card">
//           <div class="flex-col gap-4 p-4">
//             <p-skeleton width="30%" height="2rem"></p-skeleton>
//             <div class="grid-2"><p-skeleton height="3rem"></p-skeleton><p-skeleton height="3rem"></p-skeleton></div>
//             <p-skeleton width="100%" height="10rem"></p-skeleton>
//           </div>
//         </p-card>
//       } @else {
        
//         <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex-col gap-5 pb-6">
          
//           <p-card styleClass="premium-card glass-card form-section-card slide-down" styleClass="animation-delay: 0.1s">
//             <ng-template pTemplate="title"><div class="section-title"><i class="pi pi-info-circle text-primary"></i> General Information</div></ng-template>
//             <div class="grid-2">
//               <div class="input-group">
//                 <label class="info-label">Group Name <span class="text-error">*</span></label>
//                 <input pInputText formControlName="name" placeholder="e.g. Nursing Rotation A" class="w-full premium-input" />
//               </div>
//               <div class="input-group">
//                 <label class="info-label">System Code <span class="text-error">*</span></label>
//                 <input pInputText formControlName="code" placeholder="e.g. NURS-ROT-A" class="w-full premium-input uppercase-text" />
//               </div>
//               <div class="input-group span-2">
//                 <label class="info-label">Description</label>
//                 <textarea pInputTextarea formControlName="description" rows="2" placeholder="Describe the purpose of this shift group..." class="w-full premium-input"></textarea>
//               </div>
//               <div class="input-group">
//                 <label class="info-label">Organization <span class="text-error">*</span></label>
//                 <p-select formControlName="organizationId" [options]="organizations" optionLabel="name" optionValue="id" placeholder="Select Org" styleClass="w-full premium-select"></p-select>
//               </div>
//               <div class="input-group">
//                 <label class="info-label">Branch</label>
//                 <p-select formControlName="branchId" [options]="branches" optionLabel="name" optionValue="id" placeholder="Select Branch" styleClass="w-full premium-select" [showClear]="true"></p-select>
//               </div>
//               <div class="input-group">
//                 <label class="info-label">Effective From</label>
//                 <p-datepicker formControlName="effectiveFrom" [showIcon]="false" placeholder="Start Date" dateFormat="dd/mm/yy" styleClass="w-full premium-calendar"></p-datepicker>
//               </div>
//               <div class="input-group">
//                 <label class="info-label">Effective To</label>
//                 <p-datepicker formControlName="effectiveTo" [showIcon]="false" placeholder="End Date (Optional)" dateFormat="dd/mm/yy" styleClass="w-full premium-calendar" [showClear]="true"></p-datepicker>
//               </div>
//               <div class="input-group flex-row-center gap-3 mt-3 span-2 bg-surface p-3 border-radius-md">
//                 <label class="info-label m-0">Group Status (Active)</label>
//                 <p-toggleswitch formControlName="isActive"></p-toggleswitch>
//               </div>
//             </div>
//           </p-card>

//           <p-card styleClass="premium-card glass-card form-section-card slide-down" styleClass="animation-delay: 0.15s">
//             <ng-template pTemplate="title">
//               <div class="flex-between">
//                 <div class="section-title"><i class="pi pi-clock text-primary"></i> Shifts in Rotation</div>
//                 <p-button label="Add Shift" icon="pi pi-plus" size="small" [outlined]="true" (onClick)="addShift()"></p-button>
//               </div>
//             </ng-template>
            
//             <p class="text-secondary text-sm mb-4">Add the individual shifts that make up this rotation group. Assign a sequence number to define their order.</p>

//             <div formArrayName="shifts" class="flex-col gap-3">
//               @for (shiftCtrl of shiftsArray.controls; track $index) {
//                 <div [formGroupName]="$index" class="array-row flex-align gap-3 p-3 bg-surface border-radius-md">
//                   <div class="drag-handle text-tertiary"><i class="pi pi-bars"></i></div>
                  
//                   <div class="input-group flex-1 m-0">
//                     <p-select formControlName="shiftId" [options]="availableShifts" optionLabel="name" optionValue="id" placeholder="Select Shift" styleClass="w-full premium-select" appendTo="body"></p-select>
//                   </div>
                  
//                   <div class="input-group w-8rem m-0">
//                     <p-inputNumber formControlName="sequence" placeholder="Seq" [showButtons]="true" [min]="1" styleClass="w-full premium-input"></p-inputNumber>
//                   </div>

//                   <div class="input-group w-6rem m-0 flex-align justify-center">
//                     <input type="color" formControlName="color" class="color-picker-input" pTooltip="Shift Color UI Indicator" tooltipPosition="top" />
//                   </div>

//                   <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="removeShift($index)" pTooltip="Remove"></p-button>
//                 </div>
//               }
//               @if (shiftsArray.length === 0) {
//                 <div class="empty-array-state border-dashed p-4 text-center text-tertiary border-radius-md">
//                   No shifts added. Click "Add Shift" to include shifts in this group.
//                 </div>
//               }
//             </div>
//           </p-card>

//           <p-card styleClass="premium-card glass-card form-section-card slide-down" styleClass="animation-delay: 0.2s">
//             <ng-template pTemplate="title">
//               <div class="flex-between">
//                 <div class="section-title"><i class="pi pi-sync text-primary"></i> Rotation Pattern</div>
//                 <p-button label="Add Pattern Rule" icon="pi pi-plus" size="small" [outlined]="true" (onClick)="addRotationPattern()"></p-button>
//               </div>
//             </ng-template>

//             <div class="grid-1 mb-4">
//               <div class="input-group w-full md:w-20rem">
//                 <label class="info-label">Rotation Frequency <span class="text-error">*</span></label>
//                 <p-select formControlName="rotationType" [options]="rotationTypes" placeholder="Select Type" styleClass="w-full premium-select"></p-select>
//               </div>
//             </div>

//             <div formArrayName="rotationPattern" class="flex-col gap-3">
//               @for (patternCtrl of rotationPatternArray.controls; track $index) {
//                 <div [formGroupName]="$index" class="array-row flex-align gap-3 p-3 bg-surface border-radius-md">
                  
//                   <div class="input-group w-10rem m-0 flex-row-center gap-2">
//                     <span class="text-secondary font-semibold whitespace-nowrap">Day Offset:</span>
//                     <p-inputNumber formControlName="dayOffset" [min]="0" styleClass="w-full premium-input"></p-inputNumber>
//                   </div>
                  
//                   <div class="input-group flex-1 m-0">
//                     <p-select formControlName="shiftId" [options]="availableShifts" optionLabel="name" optionValue="id" placeholder="Assign Shift for this day (Leave blank for Day Off)" [showClear]="true" styleClass="w-full premium-select" appendTo="body"></p-select>
//                   </div>

//                   <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="removeRotationPattern($index)"></p-button>
//                 </div>
//               }
//               @if (rotationPatternArray.length === 0) {
//                 <div class="empty-array-state border-dashed p-4 text-center text-tertiary border-radius-md">
//                   No pattern defined. Add offsets mapping days to specific shifts.
//                 </div>
//               }
//             </div>
//           </p-card>

//           <p-card styleClass="premium-card glass-card form-section-card slide-down" styleClass="animation-delay: 0.25s">
//             <ng-template pTemplate="title"><div class="section-title"><i class="pi pi-users text-primary"></i> Applicability</div></ng-template>
//             <p class="text-secondary text-sm mb-4">Select which departments and designations this shift group is allowed to be assigned to.</p>
            
//             <div class="grid-2">
//               <div class="input-group">
//                 <label class="info-label">Applicable Departments</label>
//                 <p-multiSelect formControlName="applicableDepartments" [options]="departments" optionLabel="name" optionValue="id" placeholder="Select Departments" [filter]="true" styleClass="w-full premium-select" display="chip"></p-multiSelect>
//               </div>
//               <div class="input-group">
//                 <label class="info-label">Applicable Designations</label>
//                 <p-multiSelect formControlName="applicableDesignations" [options]="designations" optionLabel="name" optionValue="id" placeholder="Select Designations" [filter]="true" styleClass="w-full premium-select" display="chip"></p-multiSelect>
//               </div>
//             </div>
//           </p-card>

//           <div class="form-footer flex-align justify-end gap-3 mt-4 slide-down" style="animation-delay: 0.3s">
//             <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="onCancel()"></p-button>
//             <p-button label="Save Shift Group" icon="pi pi-save" type="submit" [loading]="isSaving()" [disabled]="form.invalid" styleClass="p-button-primary shadow-md"></p-button>
//           </div>

//         </form>
//       }
//     </div>
//   `,
//   styles: [`
//     /* --------------------------------------------------------------------------
//        GLOBAL & VARIABLES
//        -------------------------------------------------------------------------- */
//     :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
//     .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1200px; margin: 0 auto; }

//     /* Utility */
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
//     .flex-row-center { display: flex; align-items: center; }
//     .justify-center { justify-content: center; }
//     .justify-end { justify-content: flex-end; }
//     .flex-1 { flex: 1; }
    
//     .w-full { width: 100%; }
//     .w-6rem { width: 6rem; }
//     .w-8rem { width: 8rem; }
//     .w-10rem { width: 10rem; }
//     .whitespace-nowrap { white-space: nowrap; }
//     .uppercase-text { text-transform: uppercase; }
    
//     .grid-1 { display: grid; grid-template-columns: 1fr; gap: var(--spacing-xl); }
//     .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
//     .span-2 { grid-column: span 2; }
    
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
//     .gap-4 { gap: var(--spacing-lg); }
//     .gap-5 { gap: var(--spacing-2xl); }
    
//     .m-0 { margin: 0; }
//     .mt-3 { margin-top: var(--spacing-md); }
//     .mt-4 { margin-top: var(--spacing-xl); }
//     .mb-4 { margin-bottom: var(--spacing-xl); }
//     .p-3 { padding: var(--spacing-lg); }
//     .p-4 { padding: var(--spacing-xl); }
//     .pb-6 { padding-bottom: var(--spacing-4xl); }
    
//     .bg-surface { background: var(--bg-secondary); }
//     .border-radius-md { border-radius: var(--ui-border-radius-md); }
//     .border-dashed { border: 1px dashed var(--border-secondary); }
    
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-center { text-align: center; }
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary { color: var(--color-primary); }
//     .text-error { color: var(--color-error); }
//     .font-semibold { font-weight: var(--font-weight-semibold); }

//     /* --------------------------------------------------------------------------
//        HEADER
//        -------------------------------------------------------------------------- */
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; }
//     .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
//     ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-secondary) !important; border: 1px solid var(--border-primary) !important; }
//     ::ng-deep .back-btn:hover { color: var(--color-primary) !important; background: var(--color-primary-bg) !important; border-color: var(--color-primary-border) !important; }
//     .header-titles { display: flex; flex-direction: column; gap: 2px; }
//     .page-title { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0; letter-spacing: -0.02em; }
//     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }

//     /* --------------------------------------------------------------------------
//        FORM & CARDS
//        -------------------------------------------------------------------------- */
//     .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-sm); }
    
//     ::ng-deep .form-section-card .p-card-body { padding: var(--spacing-2xl); }
//     ::ng-deep .form-section-card .p-card-content { padding: 0; }
    
//     .section-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); display: flex; align-items: center; gap: var(--spacing-sm); margin: 0; }
    
//     .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
//     .info-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }

//     /* Overrides for Inputs */
//     ::ng-deep .premium-input,
//     ::ng-deep .premium-select .p-select,
//     ::ng-deep .premium-select .p-multiselect,
//     ::ng-deep .premium-calendar .p-datepicker .p-inputtext,
//     ::ng-deep .premium-input .p-inputnumber-input {
//       background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); font-family: var(--font-body); color: var(--text-primary);
//     }
//     ::ng-deep .premium-input:not(:disabled):hover,
//     ::ng-deep .premium-select .p-select:not(.p-disabled):hover,
//     ::ng-deep .premium-select .p-multiselect:not(.p-disabled):hover,
//     ::ng-deep .premium-calendar .p-datepicker .p-inputtext:not(.p-disabled):hover { border-color: var(--color-primary); }
    
//     ::ng-deep .premium-input:focus,
//     ::ng-deep .premium-select .p-select.p-focus,
//     ::ng-deep .premium-select .p-multiselect.p-focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

//     /* HTML5 Color Picker Customization */
//     .color-picker-input {
//       -webkit-appearance: none; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; padding: 0; overflow: hidden; box-shadow: 0 0 0 1px var(--border-primary); transition: var(--transition-base);
//     }
//     .color-picker-input::-webkit-color-swatch-wrapper { padding: 0; }
//     .color-picker-input::-webkit-color-swatch { border: none; border-radius: 50%; }
//     .color-picker-input:hover { box-shadow: 0 0 0 2px var(--color-primary); }

//     .array-row { border: 1px solid var(--border-primary); transition: var(--transition-base); }
//     .array-row:hover { border-color: var(--color-primary-border); box-shadow: var(--shadow-xs); }
//     .drag-handle { cursor: grab; padding: 0 8px; }

//     .form-footer { position: sticky; bottom: 0; background: var(--bg-primary); padding: var(--spacing-lg) 0; border-top: 1px solid var(--border-primary); z-index: 10; margin-top: var(--spacing-2xl); }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

//     @media (max-width: 768px) {
//       .grid-2 { grid-template-columns: 1fr; }
//       .span-2 { grid-column: span 1; }
//       .array-row { flex-wrap: wrap; }
//       .w-8rem, .w-6rem, .w-10rem { width: 100%; }
//     }
//   `]
// })
// export class ShiftGroupFormComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(MessageService);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);

//   // State
//   form!: FormGroup;
//   groupId: string | null = null;
//   isLoading = signal<boolean>(true);
//   isSaving = signal<boolean>(false);
//   isEditMode = signal<boolean>(false);

//   // Mock Lookups (To be replaced with real API calls if available)
//   organizations = [{ id: '698f1a7feff3e811b71a590f', name: 'Main Organization' }];
//   branches = [{ id: '698f1a82eff3e811b71a5916', name: 'Head Office HQ' }];
//   departments = [{ id: 'd1', name: 'Sales' }, { id: 'd2', name: 'IT Support' }, { id: 'd3', name: 'Nursing' }];
//   designations = [{ id: 'des1', name: 'Manager' }, { id: 'des2', name: 'Staff' }];
//   availableShifts = [
//     { id: '698f1a7feff3e811b71a5910', name: 'Morning Shift (08:00 - 16:00)' },
//     { id: 'sh2', name: 'Evening Shift (16:00 - 00:00)' },
//     { id: 'sh3', name: 'Night Shift (00:00 - 08:00)' }
//   ];
//   rotationTypes = [
//     { label: 'Daily', value: 'daily' },
//     { label: 'Weekly', value: 'weekly' },
//     { label: 'Monthly', value: 'monthly' },
//     { label: 'Custom', value: 'custom' }
//   ];

//   ngOnInit() {
//     this.initForm();
//     this.groupId = this.route.snapshot.paramMap.get('id');
    
//     if (this.groupId) {
//       this.isEditMode.set(true);
//       this.loadShiftGroup(this.groupId);
//     } else {
//       this.isLoading.set(false);
//       // Pre-fill a default pattern for quick start
//       this.addShift();
//       this.addRotationPattern();
//     }
//   }

//   private initForm() {
//     this.form = this.fb.group({
//       name: ['', [Validators.required, Validators.maxLength(100)]],
//       code: ['', [Validators.required, Validators.maxLength(50)]],
//       description: [''],
//       organizationId: [null, Validators.required],
//       branchId: [null],
      
//       shifts: this.fb.array([]),
      
//       rotationType: ['weekly', Validators.required],
//       rotationPattern: this.fb.array([]),
      
//       applicableDepartments: [[]],
//       applicableDesignations: [[]],
      
//       isActive: [true],
//       effectiveFrom: [null],
//       effectiveTo: [null]
//     });
//   }

//   // --- FormArray Getters & Methods for 'shifts' ---
//   get shiftsArray(): FormArray {
//     return this.form.get('shifts') as FormArray;
//   }

//   addShift(shiftData?: any) {
//     const shiftGroup = this.fb.group({
//       shiftId: [shiftData?.shiftId || null, Validators.required],
//       sequence: [shiftData?.sequence || (this.shiftsArray.length + 1), Validators.required],
//       color: [shiftData?.color || '#3b82f6'] // Default blue
//     });
//     this.shiftsArray.push(shiftGroup);
//   }

//   removeShift(index: number) {
//     this.shiftsArray.removeAt(index);
//   }

//   // --- FormArray Getters & Methods for 'rotationPattern' ---
//   get rotationPatternArray(): FormArray {
//     return this.form.get('rotationPattern') as FormArray;
//   }

//   addRotationPattern(patternData?: any) {
//     const patternGroup = this.fb.group({
//       dayOffset: [patternData?.dayOffset ?? this.rotationPatternArray.length, [Validators.required, Validators.min(0)]],
//       shiftId: [patternData?.shiftId || null] // Null implies a day off
//     });
//     this.rotationPatternArray.push(patternGroup);
//   }

//   removeRotationPattern(index: number) {
//     this.rotationPatternArray.removeAt(index);
//   }

//   // --- Data Loading & Saving ---
//   private loadShiftGroup(id: string) {
//     this.hrmsService.getShiftGroup(id).pipe(
//       catchError(() => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load shift group.' });
//         this.onCancel();
//         return of(null);
//       }),
//       finalize(() => this.isLoading.set(false))
//     ).subscribe((res: any) => {
//       const groupData = res?.data?.shiftGroup || res;
//       if (groupData) {
//         this.patchFormValues(groupData);
//       }
//     });
//   }

//   private patchFormValues(data: any) {
//     // 1. Patch basic fields
//     this.form.patchValue({
//       name: data.name,
//       code: data.code,
//       description: data.description,
//       organizationId: data.organizationId,
//       branchId: data.branchId,
//       rotationType: data.rotationType || 'weekly',
//       applicableDepartments: data.applicableDepartments || [],
//       applicableDesignations: data.applicableDesignations || [],
//       isActive: data.isActive ?? true,
//       effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
//       effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
//     });

//     // 2. Clear and Patch FormArrays
//     this.shiftsArray.clear();
//     if (data.shifts && Array.isArray(data.shifts)) {
//       data.shifts.forEach((s: any) => this.addShift(s));
//     }

//     this.rotationPatternArray.clear();
//     if (data.rotationPattern && Array.isArray(data.rotationPattern)) {
//       data.rotationPattern.forEach((rp: any) => this.addRotationPattern(rp));
//     }
//   }

//   onSubmit() {
//     if (this.form.invalid) {
//       // Mark all as touched to show errors
//       this.form.markAllAsTouched();
//       this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields correctly.' });
//       return;
//     }

//     this.isSaving.set(true);
//     const payload = this.form.value;

//     const request$ = this.isEditMode() && this.groupId
//       ? this.hrmsService.updateShiftGroup(this.groupId, payload)
//       : this.hrmsService.createShiftGroup(payload);

//     request$.pipe(
//       catchError(err => {
//         this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: err?.error?.message || 'An error occurred while saving.' });
//         return of(null);
//       }),
//       finalize(() => this.isSaving.set(false))
//     ).subscribe(res => {
//       if (res) {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Shift group saved successfully.' });
//         // Slight delay to allow toast to be seen before navigation
//         setTimeout(() => this.onCancel(), 1000); 
//       }
//     });
//   }

//   onCancel() {
//     this.router.navigate(['/shift-groups']);
//   }
// }