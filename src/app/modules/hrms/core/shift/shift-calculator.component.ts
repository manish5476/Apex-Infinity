import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';

import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-shift-calculator',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    DatePicker,
    InputNumberModule
  ],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="calculator-wrapper fade-in">
      <p-card styleClass="glass-panel border-radius-xl shadow-xl calc-card overflow-hidden">
        
        <ng-template pTemplate="title">
          <div class="card-header flex align-items-center gap-md mb-md border-bottom-subtle pb-md">
            <div class="card-icon flex-center bg-primary-light text-primary border-radius-md flex-shrink-0" style="width: 40px; height: 40px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
            </div>
            <div class="flex-col">
              <h2 class="card-title font-heading text-lg font-bold text-primary m-0 line-height-tight">Shift Calculator</h2>
              <p class="page-subtitle text-xs text-secondary m-0 mt-1">Test timings to evaluate net work hours.</p>
            </div>
          </div>
        </ng-template>

        <form [formGroup]="calcForm" (ngSubmit)="calculateHours()" class="calc-form flex-col gap-lg">
          
          <div class="form-row">
            <div class="form-field flex-col gap-xs w-full">
              <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Start Time</label>
              <p-datepicker 
                formControlName="startTime" 
                [timeOnly]="true" 
                appendTo="body"
                [showIcon]="true"
                icon="pi pi-clock"
                styleClass="w-full premium-input"
                [inputStyle]="{'width':'100%'}">
              </p-datepicker>
            </div>
            
            <div class="form-field flex-col gap-xs w-full">
              <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">End Time</label>
              <p-datepicker 
                formControlName="endTime" 
                [timeOnly]="true" 
                appendTo="body"
                [showIcon]="true"
                icon="pi pi-clock"
                styleClass="w-full premium-input"
                [inputStyle]="{'width':'100%'}">
              </p-datepicker>
            </div>
          </div>

          <div class="form-field flex-col gap-xs mt-sm">
            <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Unpaid Break (Mins)</label>
            <p-inputNumber 
              formControlName="breakMins" 
              [min]="0" 
              [max]="300"
              suffix=" Minutes"
              placeholder="e.g. 60"
              styleClass="w-full premium-input"
              [inputStyle]="{'width':'100%'}">
            </p-inputNumber>
          </div>

          <p-button 
            type="submit" 
            [label]="isCalculating() ? 'Calculating...' : 'Calculate Hours'" 
            [icon]="isCalculating() ? 'pi pi-spin pi-spinner' : 'pi pi-calculator'" 
            [disabled]="calcForm.invalid || isCalculating()"
            styleClass="w-full mt-sm"
            class="w-full">
          </p-button>
        </form>

        @if (resultData(); as res) {
          <div class="result-area slide-down mt-xl pt-lg border-top-subtle">
            
            <div class="result-grid">
              <div class="result-box primary-result glass-inset flex-col flex-center border-radius-md p-md mb-md">
                <span class="res-label text-xs font-bold text-secondary uppercase tracking-widest mb-xs">Net Work Hours</span>
                <span class="res-value big-val text-primary font-mono font-bold line-height-tight flex align-items-baseline gap-xs">
                  <span style="font-size: 2.5rem;">{{ res.workHours }}</span>
                  <small class="text-tertiary text-sm">hrs</small>
                </span>
              </div>

              <div class="flex gap-md w-full">
                <div class="result-box flex-grow-1 bg-secondary border-secondary flex-col flex-center border-radius-md p-sm border-1 border-solid">
                  <span class="res-label text-xs font-bold text-tertiary uppercase tracking-widest mb-xs">Gross Duration</span>
                  <span class="res-value font-mono font-bold text-primary flex align-items-baseline gap-xs">
                    <span style="font-size: 1.25rem;">{{ res.totalHours }}</span>
                    <small class="text-tertiary" style="font-size: 0.75rem;">hrs</small>
                  </span>
                </div>

                <div class="result-box flex-grow-1 bg-secondary border-secondary flex-col flex-center border-radius-md p-sm border-1 border-solid">
                  <span class="res-label text-xs font-bold text-tertiary uppercase tracking-widest mb-xs">Break Deduction</span>
                  <span class="res-value font-mono font-bold color-warning flex align-items-baseline gap-xs">
                    <span style="font-size: 1.25rem;">-{{ res.breakHours }}</span>
                    <small class="text-tertiary" style="font-size: 0.75rem;">hrs</small>
                  </span>
                </div>
              </div>
            </div>

            @if (res.crossesMidnight) {
              <div class="midnight-warning flex align-items-center gap-sm mt-md p-sm border-radius-sm">
                <i class="pi pi-moon"></i>
                <span class="text-xs font-medium">This shift crosses midnight into the next day.</span>
              </div>
            }
          </div>
        }
      </p-card>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       BASE & UTILITIES
       ========================================================================== */
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); }
    
    .calculator-wrapper { padding: var(--spacing-xl); display: flex; justify-content: center; }
    
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .align-items-center { align-items: center; }
    .align-items-baseline { align-items: baseline; }
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-grow-1 { flex-grow: 1; }
    .w-full { width: 100%; }
    
    .m-0 { margin: 0; }
    .mb-xs { margin-bottom: var(--spacing-xs); }
    .mb-sm { margin-bottom: var(--spacing-sm); }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mt-1 { margin-top: 4px; }
    .mt-sm { margin-top: var(--spacing-sm); }
    .mt-md { margin-top: var(--spacing-md); }
    .mt-xl { margin-top: var(--spacing-xl); }
    .pb-md { padding-bottom: var(--spacing-md); }
    .pt-lg { padding-top: var(--spacing-lg); }
    .p-sm { padding: var(--spacing-sm); }
    .p-md { padding: var(--spacing-md); }
    .gap-xs { gap: var(--spacing-xs); }
    .gap-sm { gap: var(--spacing-sm); }
    .gap-md { gap: var(--spacing-md); }
    .gap-lg { gap: var(--spacing-lg); }

    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-sm { font-size: var(--font-size-sm); }
    .text-lg { font-size: var(--font-size-lg); }
    .uppercase { text-transform: uppercase; }
    .tracking-widest { letter-spacing: 0.05em; }
    .line-height-tight { line-height: var(--line-height-tight); }

    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .bg-primary { background: var(--bg-primary); }
    .bg-secondary { background: var(--bg-secondary); }
    .bg-primary-light { background: color-mix(in srgb, var(--color-primary) 10%, transparent); }
    .color-warning { color: var(--color-warning, #d97706); }
    .border-secondary { border-color: var(--border-secondary); }

    /* Forms & Structure */
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    .glass-inset { background: color-mix(in srgb, var(--color-primary) 5%, transparent); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent); }
    
    .border-radius-sm { border-radius: var(--ui-border-radius-sm); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .border-radius-xl { border-radius: var(--radius-2xl); }
    .border-top-subtle { border-top: 1px solid var(--border-secondary); }
    .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
    .border-1 { border-width: 1px; }
    .border-solid { border-style: solid; }
    .shadow-xl { box-shadow: var(--shadow-xl); }
    .overflow-hidden { overflow: hidden; }

    .midnight-warning { background: #eef2ff; border: 1px solid #c7d2fe; color: #4f46e5; }

    /* ==========================================================================
       PRIME NG OVERRIDES
       ========================================================================== */
    .calc-card { width: 100%; max-width: 420px; }
    
    /* Remove default padding to handle it manually for tighter design */
    :host ::ng-deep .calc-card .p-card-body { padding: var(--spacing-xl); }
    :host ::ng-deep .calc-card .p-card-content { padding: 0; }
    
    /* Input Styling */
    :host ::ng-deep .premium-input .p-inputtext {
      background: var(--bg-primary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius-sm);
      transition: var(--transition-base);
      font-family: var(--font-mono, monospace);
      font-size: var(--font-size-sm);
      padding: 0.6rem;
    }
    
    :host ::ng-deep .premium-input .p-inputtext:enabled:hover {
      border-color: var(--color-primary);
    }
    
    :host ::ng-deep .premium-input .p-datepicker-trigger {
      background: transparent;
      color: var(--text-tertiary);
      border: none;
    }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.3s cubic-bezier(0.2, 0.9, 0.2, 1) both; }
  `]
})
export class ShiftCalculatorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private datePipe = inject(DatePipe);

  isCalculating = signal(false);
  resultData = signal<any | null>(null);
  calcForm!: FormGroup;

  ngOnInit() {
    this.calcForm = this.fb.group({
      startTime: [this.timeStringToDate('09:00'), Validators.required],
      endTime: [this.timeStringToDate('18:00'), Validators.required],
      breakMins: [60, [Validators.required, Validators.min(0)]]
    });
  }

  // Helper to convert primeNG Date objects to API-friendly strings
  private dateToTimeString(date: Date): string {
    return this.datePipe.transform(date, 'HH:mm') || '00:00';
  }

  // Helper to initialize the form with proper Date objects
  private timeStringToDate(timeStr: string): Date {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  calculateHours() {
    if (this.calcForm.invalid) return;

    this.isCalculating.set(true);
    this.resultData.set(null);

    const formVal = this.calcForm.value;
    const startStr = this.dateToTimeString(formVal.startTime);
    const endStr = this.dateToTimeString(formVal.endTime);

    // Mocking the break object required by the service payload to deduct duration
    const payload = {
      startTime: startStr,
      endTime: endStr,
      breaks: formVal.breakMins > 0 ? [
        { startTime: '12:00', endTime: this.addMins('12:00', formVal.breakMins) } 
      ] : []
    };

    this.hrmsService.calculateShiftHours(payload).pipe(
      finalize(() => this.isCalculating.set(false))
    ).subscribe({
      next: (res: any) => {
        const payloadData = res?.data || null;
        this.resultData.set(payloadData);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  // Helper just to mock a break end time string for the payload calculation
  private addMins(timeStr: string, minsToAdd: number): string {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + minsToAdd, 0);
    const rh = String(date.getHours()).padStart(2, '0');
    const rm = String(date.getMinutes()).padStart(2, '0');
    return `${rh}:${rm}`;
  }
}

// import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { finalize } from 'rxjs';

// // Services
// import { AppMessageService } from '../../../../core/services/message.service';
// import { HRMSService } from '../../hrms.service';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { TooltipModule } from 'primeng/tooltip';

// @Component({
//   selector: 'app-shift-calculator',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ReactiveFormsModule,
//     CardModule,
//     ButtonModule,
//     InputTextModule,
//     InputNumberModule,
//     TooltipModule
//   ],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="calculator-wrapper fade-in flex items-center justify-center w-full h-full p-xl">
      
//       <p-card styleClass="bento-card glass-panel calc-card mx-auto shadow-lg relative overflow-hidden">
        
//         <div class="bg-glow absolute rounded-full pointer-events-none"></div>

//         <ng-template pTemplate="header">
//           <div class="card-header flex items-center gap-md p-lg border-bottom bg-surface z-10 relative">
//             <div class="card-icon bg-primary border-secondary rounded-md w-10 h-10 flex items-center justify-center text-accent shadow-xs">
//               <i class="pi pi-stopwatch text-xl"></i>
//             </div>
//             <div class="flex-col">
//               <h2 class="card-title text-primary font-heading font-bold text-lg m-0 leading-tight">Shift Calculator</h2>
//               <p class="page-subtitle text-secondary text-xs m-0 mt-1">Test timings to evaluate net work hours.</p>
//             </div>
//           </div>
//         </ng-template>

//         <form [formGroup]="calcForm" (ngSubmit)="calculateHours()" class="calc-form flex-col gap-lg z-10 relative">
          
//           <div class="form-row grid gap-md">
//             <div class="form-field flex-col gap-xs">
//               <label class="info-label text-label text-xs font-semibold uppercase tracking-wide">Start Time</label>
//               <input pInputText type="time" formControlName="startTime" class="w-full font-mono text-md premium-input" />
//             </div>
            
//             <div class="form-field flex-col gap-xs">
//               <label class="info-label text-label text-xs font-semibold uppercase tracking-wide">End Time</label>
//               <input pInputText type="time" formControlName="endTime" class="w-full font-mono text-md premium-input" />
//             </div>
//           </div>

//           <div class="form-field flex-col gap-xs">
//             <label class="info-label text-label text-xs font-semibold uppercase tracking-wide flex items-center gap-xs">
//               Unpaid Break Duration 
//               <i class="pi pi-info-circle text-tertiary cursor-help" 
//                  pTooltip="Total minutes deducted from the gross shift duration." 
//                  appendTo="body" 
//                  tooltipPosition="top"></i>
//             </label>
//             <p-inputNumber 
//               formControlName="breakMins" 
//               [min]="0" 
//               placeholder="e.g. 60"
//               suffix=" mins"
//               styleClass="w-full premium-input-number"
//               inputStyleClass="w-full font-mono text-md">
//             </p-inputNumber>
//           </div>

//           <p-button 
//             type="submit" 
//             label="Calculate Hours" 
//             icon="pi pi-calculator" 
//             [loading]="isCalculating()" 
//             [disabled]="calcForm.invalid"
//             styleClass="w-full mt-sm shadow-sm transition-base">
//           </p-button>
//         </form>

//         <div class="result-area transition-all duration-500 ease-in-out z-10 relative" [class.show]="resultData()">
//           @if (resultData(); as res) {
//             <div class="divider border-top my-lg w-full"></div>
            
//             <div class="internal-bento-grid grid gap-sm">
              
//               <div class="result-box primary-result bg-accent-light border-accent rounded-md p-md flex-col items-center justify-center text-center span-2 card-anim-1">
//                 <span class="res-label text-xs font-bold uppercase tracking-wide text-accent opacity-80 mb-1">Net Work Hours</span>
//                 <div class="flex items-baseline gap-xs">
//                   <span class="res-value font-mono font-bold text-4xl text-accent leading-none">{{ res.workHours }}</span>
//                   <span class="text-xs font-medium text-accent opacity-70">hrs</span>
//                 </div>
//               </div>

//               <div class="result-box bg-surface border-secondary rounded-md p-sm flex-col items-center justify-center text-center card-anim-2">
//                 <span class="res-label text-xs font-semibold uppercase tracking-wide text-tertiary mb-1">Gross</span>
//                 <div class="flex items-baseline gap-xs">
//                   <span class="res-value font-mono font-bold text-xl text-primary leading-none">{{ res.totalHours }}</span>
//                   <span class="text-[0.65rem] text-tertiary">hrs</span>
//                 </div>
//               </div>

//               <div class="result-box bg-warning-light border-warning rounded-md p-sm flex-col items-center justify-center text-center card-anim-3">
//                 <span class="res-label text-xs font-semibold uppercase tracking-wide text-warning-dark mb-1">Break</span>
//                 <div class="flex items-baseline gap-xs">
//                   <span class="res-value font-mono font-bold text-xl text-warning-dark leading-none">-{{ res.breakHours }}</span>
//                   <span class="text-[0.65rem] text-warning-dark opacity-70">hrs</span>
//                 </div>
//               </div>

//             </div>

//             @if (res.crossesMidnight) {
//               <div class="midnight-warning mt-md bg-info-light border-info rounded-md p-sm flex items-center gap-sm card-anim-4 shadow-xs">
//                 <div class="bg-info text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
//                   <i class="pi pi-moon text-xs"></i>
//                 </div>
//                 <span class="text-info-dark text-xs font-medium leading-tight">This shift crosses midnight into the next day.</span>
//               </div>
//             }
//           }
//         </div>
//       </p-card>
//     </div>
//   `,
//   styles: [`
//     /* ==========================================================================
//        HOST & LAYOUT UTILITIES
//        ========================================================================== */
//     :host { 
//       display: block; 
//       width: 100%; 
//       font-family: var(--font-body); 
//     }
    
//     .flex { display: flex; }
//     .flex-col { display: flex; flex-direction: column; }
//     .items-center { align-items: center; }
//     .items-baseline { align-items: baseline; }
//     .justify-center { justify-content: center; }
//     .text-center { text-align: center; }
//     .w-full { width: 100%; }
//     .h-full { height: 100%; }
//     .w-6 { width: 1.5rem; }
//     .h-6 { height: 1.5rem; }
//     .w-10 { width: 2.5rem; }
//     .h-10 { height: 2.5rem; }
//     .mx-auto { margin-left: auto; margin-right: auto; }
//     .relative { position: relative; }
//     .absolute { position: absolute; }
//     .z-10 { z-index: 10; }
//     .pointer-events-none { pointer-events: none; }
//     .flex-shrink-0 { flex-shrink: 0; }
//     .grid { display: grid; }
    
//     /* Spacing */
//     .gap-xs { gap: var(--spacing-xs); }
//     .gap-sm { gap: var(--spacing-sm); }
//     .gap-md { gap: var(--spacing-md); }
//     .gap-lg { gap: var(--spacing-lg); }
//     .p-sm { padding: var(--spacing-sm); }
//     .p-md { padding: var(--spacing-md); }
//     .p-lg { padding: var(--spacing-lg); }
//     .p-xl { padding: var(--spacing-xl); }
//     .m-0 { margin: 0; }
//     .mt-1 { margin-top: 0.25rem; }
//     .mt-sm { margin-top: var(--spacing-sm); }
//     .mt-md { margin-top: var(--spacing-md); }
//     .my-lg { margin-top: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
//     .mb-1 { margin-bottom: 0.25rem; }

//     /* Typography */
//     .text-primary { color: var(--text-primary); }
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-accent { color: var(--color-primary); }
//     .text-white { color: #ffffff; }
//     .text-label { color: var(--text-label); }
    
//     .font-heading { font-family: var(--font-heading); }
//     .font-mono { font-family: var(--font-mono); }
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .font-semibold { font-weight: var(--font-weight-semibold); }
//     .font-medium { font-weight: var(--font-weight-medium); }
    
//     .text-xs { font-size: var(--font-size-xs); }
//     // .text-[0.65rem] { font-size: 0.65rem; }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-md { font-size: var(--font-size-md); }
//     .text-lg { font-size: var(--font-size-lg); }
//     .text-xl { font-size: var(--font-size-xl); }
//     .text-4xl { font-size: var(--font-size-4xl); }
    
//     .uppercase { text-transform: uppercase; }
//     .tracking-wide { letter-spacing: 0.05em; }
//     .leading-tight { line-height: var(--line-height-tight); }
//     .leading-none { line-height: 1; }
//     .opacity-70 { opacity: 0.7; }
//     .opacity-80 { opacity: 0.8; }

//     /* Backgrounds & Borders */
//     .bg-primary { background: var(--bg-primary); }
//     .bg-surface { background: var(--component-surface-raised); }
    
//     /* Semantic Colors derived from theme */
//     .bg-accent-light { background: color-mix(in srgb, var(--color-primary) 8%, transparent); }
//     .border-accent { border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent); }
    
//     .text-warning-dark { color: var(--color-warning-dark, #b45309); }
//     .bg-warning-light { background: var(--color-warning-bg, #fffbeb); }
//     .border-warning { border: 1px solid var(--color-warning-border, #fde68a); }
    
//     .text-info-dark { color: var(--color-info-dark, #1e40af); }
//     .bg-info { background: var(--color-info, #3b82f6); }
//     .bg-info-light { background: var(--color-info-bg, #eff6ff); }
//     .border-info { border: 1px solid var(--color-info-border, #bfdbfe); }
    
//     .border-secondary { border: var(--ui-border-width) solid var(--border-secondary); }
//     .border-bottom { border-bottom: var(--ui-border-width) solid var(--border-primary); }
//     .border-top { border-top: var(--ui-border-width) solid var(--border-primary); }
    
//     .rounded-md { border-radius: var(--ui-border-radius); }
//     .rounded-full { border-radius: var(--ui-border-radius-pill); }
    
//     .shadow-xs { box-shadow: var(--shadow-xs); }
//     .shadow-sm { box-shadow: var(--shadow-sm); }
//     .shadow-lg { box-shadow: var(--shadow-lg); }
//     .transition-base { transition: var(--transition-base); }
//     .cursor-help { cursor: help; }

//     /* ==========================================================================
//        COMPONENT SPECIFIC STYLES
//        ========================================================================== */
//     .calc-card { 
//       width: 100%; 
//       max-width: 420px; 
//     }
    
//     .form-row { grid-template-columns: 1fr 1fr; }
//     .internal-bento-grid { grid-template-columns: 1fr 1fr; }
//     .span-2 { grid-column: span 2; }

//     /* Decorative Glow for premium glass feel */
//     .bg-glow {
//       top: -50px; right: -50px;
//       width: 200px; height: 200px;
//       background: radial-gradient(circle, color-mix(in srgb, var(--color-primary) 15%, transparent) 0%, transparent 70%);
//     }

//     /* Expanding Results Area */
//     .result-area { 
//       opacity: 0; 
//       max-height: 0; 
//       overflow: hidden; 
//     }
//     .result-area.show { 
//       opacity: 1; 
//       max-height: 500px; /* Generous height for expansion */
//     }

//     /* ---------------------------------------------------------
//        PRIMENG OVERRIDES 
//        --------------------------------------------------------- */
//     :host ::ng-deep .bento-card.p-card {
//       background: var(--component-bg);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//     }
//     :host ::ng-deep .bento-card .p-card-body {
//       padding: var(--spacing-xl);
//     }
//     :host ::ng-deep .bento-card .p-card-content {
//       padding: 0;
//     }
//     :host ::ng-deep .bento-card .p-card-header {
//       padding: 0;
//       border-radius: var(--ui-border-radius-lg) var(--ui-border-radius-lg) 0 0;
//       overflow: hidden;
//     }

//     /* Refined Input Styling */
//     :host ::ng-deep .premium-input,
//     :host ::ng-deep .premium-input-number .p-inputnumber-input {
//       background: var(--bg-primary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       padding: 0.6rem 0.75rem;
//       transition: var(--transition-base);
//       box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
//       height: 42px;
//       box-sizing: border-box;
//       color: var(--text-primary);
//     }
//     :host ::ng-deep .premium-input:not(:disabled):hover,
//     :host ::ng-deep .premium-input-number .p-inputnumber-input:not(:disabled):hover {
//       border-color: var(--color-primary);
//     }
//     :host ::ng-deep .premium-input:focus,
//     :host ::ng-deep .premium-input-number .p-inputnumber-input:focus {
//       border-color: var(--color-primary);
//       box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
//       outline: none;
//     }

//     /* ---------------------------------------------------------
//        ANIMATIONS 
//        --------------------------------------------------------- */
//     @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
//     @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .card-anim-1 { animation: popIn 0.3s cubic-bezier(0.2, 0.9, 0.2, 1) 0.1s both; }
//     .card-anim-2 { animation: popIn 0.3s cubic-bezier(0.2, 0.9, 0.2, 1) 0.15s both; }
//     .card-anim-3 { animation: popIn 0.3s cubic-bezier(0.2, 0.9, 0.2, 1) 0.2s both; }
//     .card-anim-4 { animation: fadeIn 0.3s cubic-bezier(0.2, 0.9, 0.2, 1) 0.3s both; }
//   `]
// })
// export class ShiftCalculatorComponent {
//   private fb = inject(FormBuilder);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);

//   // State Signals
//   isCalculating = signal(false);
//   resultData = signal<any | null>(null);

//   // Form definition
//   calcForm = this.fb.group({
//     startTime: ['09:00', Validators.required],
//     endTime: ['18:00', Validators.required],
//     breakMins: [60, [Validators.required, Validators.min(0)]]
//   });

//   calculateHours() {
//     if (this.calcForm.invalid) {
//       this.calcForm.markAllAsTouched();
//       return;
//     }

//     this.isCalculating.set(true);
//     // Add a tiny artificial delay before clearing to allow the CSS transition to play smoothly
//     this.resultData.set(null);

//     const formVal = this.calcForm.value;

//     const payload:any = {
//       startTime: formVal.startTime,
//       endTime: formVal.endTime,
//       breaks: (formVal.breakMins ?? 0) > 0 ? [
//         { startTime: '13:00', endTime: this.addMins('13:00', formVal.breakMins ?? 0) }
//       ] : []
//     };

//     this.hrmsService.calculateShiftHours(payload).pipe(
//       finalize(() => this.isCalculating.set(false))
//     ).subscribe({
//       next: (res: any) => {
//         const payloadData = res?.data || null;
//         this.resultData.set(payloadData);
//       },
//       error: (err) => {
//         this.messageService.handleHttpError(err);
//       }
//     });
//   }

//   // Helper function
//   private addMins(timeStr: string, minsToAdd: number): string {
//     const [h, m] = timeStr.split(':').map(Number);
//     const date = new Date();
//     date.setHours(h, m + minsToAdd, 0);
//     const rh = String(date.getHours()).padStart(2, '0');
//     const rm = String(date.getMinutes()).padStart(2, '0');
//     return `${rh}:${rm}`;
//   }
// }

// // import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// // import { finalize } from 'rxjs';
// // import { AppMessageService } from '../../../../core/services/message.service';
// // import { HRMSService } from '../../hrms.service';

// // @Component({
// //   selector: 'app-shift-calculator',
// //   standalone: true,
// //   imports: [CommonModule, ReactiveFormsModule],
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   template: `
// //     <div class="calculator-wrapper fade-in">
// //       <div class="grid-card calc-card">
        
// //         <div class="card-header">
// //           <div class="card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg></div>
// //           <div>
// //             <h2 class="card-title" style="font-size: 1.1rem;">Shift Hours Calculator</h2>
// //             <p class="page-subtitle" style="font-size: 0.7rem; margin-top: 2px;">Test timings to evaluate net work hours.</p>
// //           </div>
// //         </div>

// //         <div class="card-body">
// //           <form [formGroup]="calcForm" (ngSubmit)="calculateHours()" class="calc-form">
            
// //             <div class="form-row">
// //               <div class="form-field">
// //                 <label>Start Time</label>
// //                 <input type="time" formControlName="startTime" class="se-input">
// //               </div>
              
// //               <div class="form-field">
// //                 <label>End Time</label>
// //                 <input type="time" formControlName="endTime" class="se-input">
// //               </div>
// //             </div>

// //             <div class="form-field mt-3">
// //               <label>Unpaid Break Duration (Mins)</label>
// //               <input type="number" formControlName="breakMins" class="se-input" min="0" placeholder="e.g. 60">
// //             </div>

// //             <button type="submit" class="btn btn-primary w-full mt-4" [disabled]="calcForm.invalid || isCalculating()">
// //               @if (isCalculating()) {
// //                 <div class="spinner-sm"></div> Calculating...
// //               } @else {
// //                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
// //                 Calculate Hours
// //               }
// //             </button>
// //           </form>

// //           <div class="result-area" [class.show]="resultData()">
// //             @if (resultData(); as res) {
// //               <div class="divider"></div>
              
// //               <div class="result-grid">
// //                 <div class="result-box primary-result">
// //                   <span class="res-label">Net Work Hours</span>
// //                   <span class="res-value big-val">{{ res.workHours }} <small>hrs</small></span>
// //                 </div>

// //                 <div class="result-box">
// //                   <span class="res-label">Gross Duration</span>
// //                   <span class="res-value">{{ res.totalHours }} <small>hrs</small></span>
// //                 </div>

// //                 <div class="result-box">
// //                   <span class="res-label">Break Deduction</span>
// //                   <span class="res-value color-warning">-{{ res.breakHours }} <small>hrs</small></span>
// //                 </div>
// //               </div>

// //               @if (res.crossesMidnight) {
// //                 <div class="midnight-warning">
// //                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
// //                   <span>This shift crosses midnight into the next day.</span>
// //                 </div>
// //               }
// //             }
// //           </div>

// //         </div>
// //       </div>
// //     </div>
// //   `,
// //   styles: [`
// //     .calculator-wrapper { padding: var(--spacing-xl); display: flex; justify-content: center; font-family: var(--font-body); }
// //     .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-md); display: flex; flex-direction: column; }
// //     .calc-card { width: 100%; max-width: 450px; }
    
// //     .card-header { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-lg); border-bottom: 1px solid var(--border-primary); background: var(--component-surface-raised); border-radius: var(--ui-border-radius-lg) var(--ui-border-radius-lg) 0 0; }
// //     .card-icon { color: var(--color-primary); display: flex; align-items: center; background: var(--bg-primary); padding: 8px; border-radius: 8px; border: 1px solid var(--border-primary); }
// //     .card-title { font-family: var(--font-heading); font-weight: var(--font-weight-bold); margin: 0; color: var(--text-primary); }
// //     .page-subtitle { color: var(--text-secondary); }
    
// //     .card-body { padding: var(--spacing-lg); }
    
// //     .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
// //     .form-field { display: flex; flex-direction: column; gap: 4px; }
// //     .form-field label { font-size: 0.6875rem; font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
// //     .se-input { background: var(--bg-primary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); padding: 0.5rem; font-size: var(--font-size-md); color: var(--text-primary); height: 42px; box-sizing: border-box; outline: none; transition: all 0.2s; font-family: var(--font-mono, monospace); }
// //     .se-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
    
// //     .mt-3 { margin-top: 12px; }
// //     .mt-4 { margin-top: 16px; }
// //     .w-full { width: 100%; }
    
// //     .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; font-weight: var(--font-weight-bold); border-radius: var(--ui-border-radius); cursor: pointer; transition: var(--transition-fast); border: var(--ui-border-width) solid transparent; height: 42px; font-size: 0.875rem; }
// //     .btn-primary { background: var(--color-primary); color: #ffffff; }
// //     .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
// //     .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
// //     .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px; }

// //     /* Results */
// //     .result-area { opacity: 0; max-height: 0; overflow: hidden; transition: all 0.4s ease; }
// //     .result-area.show { opacity: 1; max-height: 400px; margin-top: 16px; }
// //     .divider { height: 1px; background: var(--border-secondary); margin-bottom: 16px; }
    
// //     .result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
// //     .result-box { background: var(--bg-secondary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); padding: 12px; display: flex; flex-direction: column; align-items: center; text-align: center; }
// //     .primary-result { grid-column: span 2; background: color-mix(in srgb, var(--color-primary) 5%, transparent); border-color: color-mix(in srgb, var(--color-primary) 20%, transparent); }
    
// //     .res-label { font-size: 0.65rem; font-weight: var(--font-weight-bold); text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px; }
// //     .res-value { font-size: 1.25rem; font-family: var(--font-mono, monospace); font-weight: var(--font-weight-bold); color: var(--text-primary); }
// //     .big-val { font-size: 2.5rem; color: var(--color-primary); line-height: 1; }
// //     .color-warning { color: #d97706; }
// //     small { font-size: 0.5em; font-weight: normal; color: var(--text-tertiary); }

// //     .midnight-warning { margin-top: 12px; padding: 8px 12px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #4f46e5; font-weight: var(--font-weight-medium); }

// //     @keyframes spin { to { transform: rotate(360deg); } }
// //     @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
// //     .fade-in { animation: fadeIn 0.4s ease-out; }
// //   `]
// // })
// // export class ShiftCalculatorComponent {
// //   private fb = inject(FormBuilder);
// //   private hrmsService = inject(HRMSService);
// //   private messageService = inject(AppMessageService);

// //   isCalculating = signal(false);
// //   resultData = signal<any | null>(null);

// //   calcForm: FormGroup = this.fb.group({
// //     startTime: ['09:00', Validators.required],
// //     endTime: ['18:00', Validators.required],
// //     breakMins: [60, [Validators.required, Validators.min(0)]]
// //   });

// //   calculateHours() {
// //     if (this.calcForm.invalid) return;

// //     this.isCalculating.set(true);
// //     this.resultData.set(null);

// //     const formVal = this.calcForm.value;

// //     // Based on service parameter: { startTime: string; endTime: string; breaks?: any[] }
// //     // Sending break duration as a mock "breaks" array block to fulfill the hours calculation
// //     const payload = {
// //       startTime: formVal.startTime,
// //       endTime: formVal.endTime,
// //       breaks: formVal.breakMins > 0 ? [
// //         { startTime: '13:00', endTime: this.addMins('13:00', formVal.breakMins) } // Dummy block just for duration logic
// //       ] : []
// //     };

// //     this.hrmsService.calculateShiftHours(payload).pipe(
// //       finalize(() => this.isCalculating.set(false))
// //     ).subscribe({
// //       next: (res: any) => {
// //         // Matches JSON: { data: { totalHours, breakHours, workHours, crossesMidnight } }
// //         const payloadData = res?.data || null;
// //         this.resultData.set(payloadData);
// //       },
// //       error: (err) => {
// //         this.messageService.handleHttpError(err)
// //       }
// //     });
// //   }

// //   // Helper just to mock a break end time for the payload
// //   private addMins(timeStr: string, minsToAdd: number): string {
// //     const [h, m] = timeStr.split(':').map(Number);
// //     const date = new Date();
// //     date.setHours(h, m + minsToAdd, 0);
// //     const rh = String(date.getHours()).padStart(2, '0');
// //     const rm = String(date.getMinutes()).padStart(2, '0');
// //     return `${rh}:${rm}`;
// //   }
// // }
