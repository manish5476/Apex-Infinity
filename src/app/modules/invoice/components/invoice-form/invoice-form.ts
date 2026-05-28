import {
  Component, OnInit, OnDestroy,
  inject, signal, computed, ViewEncapsulation
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  FormBuilder, FormGroup, FormArray,
  Validators, ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil, finalize } from 'rxjs/operators';

import { InvoiceService } from '../../services/invoice-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { MasterDropdownService } from '../../../../core/services/master-dropdown.service';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    ToastModule, ButtonModule, InputTextModule, InputNumberModule,
    DatePickerModule, SelectModule, TextareaModule,
    ConfirmDialogModule, ProgressSpinnerModule,
    MasterDropdownComponent
  ],
  providers: [ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog [style]="{width: '400px'}" rejectButtonStyleClass="p-button-text"></p-confirmDialog>

    <div class="page-layout">
      <form [formGroup]="invoiceForm" class="invoice-container">
        
        <header class="invoice-header">
          <div class="header-left">
            <button pButton icon="pi pi-arrow-left" class="back-btn p-button-text" routerLink="/invoices"></button>
            <div class="header-titles">
              <div class="title-row">
                <h1>{{ formTitle() }}</h1>
                @if (editMode()) {
                  <span class="status-badge"
                    [ngClass]="invoiceForm.get('status')?.value === 'paid' ? 'status-success' : 'status-warn'">
                    {{ invoiceForm.get('status')?.value }}
                  </span>
                }
              </div>
              <div class="meta-row">
                <span class="meta-item">
                  <i class="pi pi-calendar"></i> {{ invoiceForm.get('invoiceDate')?.value | date:'mediumDate' }}
                </span>
                <span class="divider">•</span>
                <span class="meta-item">{{ editMode() ? 'Revision Mode' : 'New Draft' }}</span>
              </div>
            </div>
          </div>
          <div class="header-right">
            <div class="value-box">
              <span class="value-label">Grand Total</span>
              <span class="value-amount">{{ grandTotal() | currency:'INR' }}</span>
            </div>
          </div>
        </header>

        <div class="invoice-body custom-scrollbar">
          
          <section class="form-section elevation-card">
            <div class="form-grid">
              <div class="form-group span-4">
                <label>Customer <span class="required">*</span></label>
                <app-master-dropdown 
                  endpoint="customers" 
                  formControlName="customerId" 
                  (onSelect)="onCustomerSelect($event)" 
                  placeholder="Select Customer...">
                </app-master-dropdown>
              </div>

              <div class="form-group span-2">
                <label>Invoice #</label>
                <input pInputText formControlName="invoiceNumber" placeholder="Auto-gen" class="w-full theme-control font-mono" />
              </div>

              <div class="form-group span-2">
                <label>Branch</label>
                <app-master-dropdown 
                  endpoint="branches" 
                  formControlName="branchId" 
                  placeholder="Select Branch">
                </app-master-dropdown>
              </div>

              <div class="form-group span-2">
                <label>Invoice Date</label>
                <p-datepicker formControlName="invoiceDate" dateFormat="dd/mm/yy" styleClass="w-full theme-control" [showIcon]="true" appendTo="body"></p-datepicker>
              </div>

              <div class="form-group span-2">
                <label>Due Date</label>
                <p-datepicker formControlName="dueDate" dateFormat="dd/mm/yy" styleClass="w-full theme-control" [showIcon]="true" appendTo="body"></p-datepicker>
              </div>
            </div>
          </section>

          <section class="form-section elevation-card p-0 overflow-hidden">
            <div class="section-toolbar">
              <span class="toolbar-title">Itemization</span>
              <button pButton label="Add Line Item" icon="pi pi-plus" class="p-button-sm p-button-outlined theme-btn-secondary" (click)="addItem()"></button>
            </div>

            <div formArrayName="items" class="table-wrapper custom-scrollbar">
              <table class="theme-table">
                <thead>
                  <tr>
                    <th width="5%" class="text-center">#</th>
                    <th width="28%">Product / Service</th>
                    <th width="12%" class="text-center">Stock</th>
                    <th width="10%">Qty</th>
                    <th width="12%" class="text-right">Price</th>
                    <th width="10%" class="text-right">Disc</th>
                    <th width="10%" class="text-center">Tax %</th>
                    <th width="13%" class="text-right">Total</th>
                    <th width="5%" class="text-center"><i class="pi pi-cog"></i></th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of items.controls; track $index; let i = $index) {
                    <tr [formGroupName]="i">
                      <td class="text-center index-col">{{ i + 1 }}</td>
                      <td>
                        <app-master-dropdown 
                          endpoint="products" 
                          formControlName="productId" 
                          (onSelect)="onProductSelect($event, i)" 
                          placeholder="Select Item">
                        </app-master-dropdown>
                        @if (items.at(i).get('name')?.value) {
                          <div class="item-meta">HSN: {{ items.at(i).get('sku')?.value || '--' }}</div>
                        }
                      </td>
                      
                      <td class="text-center align-middle">
                        <span class="stock-pill" 
                              [class.stock-checking]="items.at(i).get('isCheckingStock')?.value"
                              [ngClass]="items.at(i).get('isLowStock')?.value ? 'stock-low' : 'stock-ok'">
                          {{ items.at(i).get('currentStock')?.value ?? '--' }}
                        </span>
                      </td>

                      <td>
                        <p-inputNumber formControlName="quantity" [min]="1" styleClass="w-full table-input" inputStyleClass="text-center font-bold w-full"></p-inputNumber>
                      </td>

                      <td>
                        <p-inputNumber formControlName="price" mode="decimal" [minFractionDigits]="2" styleClass="w-full table-input" inputStyleClass="text-right w-full"></p-inputNumber>
                      </td>

                      <td>
                        <p-inputNumber formControlName="discount" mode="decimal" [minFractionDigits]="2" styleClass="w-full table-input" inputStyleClass="text-right text-danger w-full"></p-inputNumber>
                      </td>

                      <td>
                        <p-inputNumber formControlName="taxRate" suffix="%" [min]="0" [max]="100" styleClass="w-full table-input" inputStyleClass="text-center text-primary w-full"></p-inputNumber>
                      </td>

                      <td class="text-right font-bold text-primary align-middle font-mono">
                        {{ (((items.at(i).get('quantity')?.value || 0) * (items.at(i).get('price')?.value || 0)) - (items.at(i).get('discount')?.value || 0)) * (1 + ((items.at(i).get('taxRate')?.value || 0) / 100)) | currency:'INR' }}
                      </td>

                      <td class="text-center align-middle">
                        <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-rounded p-button-sm" (click)="removeItem(i)"></button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              @if (items.controls.length === 0) {
                <div class="empty-state">
                  <i class="pi pi-shopping-cart"></i>
                  <p>No items added. Start billing.</p>
                </div>
              }
            </div>
          </section>

          <div class="footer-grid">
            <div class="left-panel">
              <div class="form-section elevation-card">
                <label class="section-label">Notes & Terms</label>
                <textarea pInputTextarea formControlName="notes" rows="3" class="w-full theme-control" placeholder="Payment terms, delivery notes..."></textarea>
              </div>

              <div class="quick-pay-card elevation-card">
                <div class="icon-circle"><i class="pi pi-wallet"></i></div>
                <div class="pay-inputs">
                  <label class="section-label">Quick Payment Received</label>
                  <div class="input-row">
                    <p-inputNumber formControlName="paidAmount" mode="currency" currency="INR" locale="en-IN" placeholder="0.00" styleClass="w-full theme-control"></p-inputNumber>
                    <p-select appendTo="body" formControlName="paymentMethod" [options]="paymentMethodOptions" optionLabel="label" optionValue="value" placeholder="Mode" styleClass="w-full theme-control" [filter]="true" filterBy="label"></p-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="right-panel">
              <div class="totals-card elevation-card">
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span class="val">{{ subTotal() | currency:'INR' }}</span>
                </div>
                <div class="summary-row">
                  <span>Discount</span>
                  <span class="val text-danger">- {{ totalDiscount() | currency:'INR' }}</span>
                </div>
                <div class="summary-row">
                  <span>Tax (GST)</span>
                  <span class="val text-success">+ {{ totalTax() | currency:'INR' }}</span>
                </div>

                <div class="summary-divider"></div>

                <div class="summary-row grand-total-row">
                  <span>Grand Total</span>
                  <span class="val">{{ grandTotal() | currency:'INR' }}</span>
                </div>

                <div class="balance-row" [ngClass]="balanceAmount() > 0 ? 'bg-warn' : 'bg-success'">
                  <span>{{ balanceAmount() > 0 ? 'Balance Due' : 'Paid in Full' }}</span>
                  <span>{{ balanceAmount() | currency:'INR' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="invoice-footer">
          <div class="footer-info">
            <i class="pi pi-info-circle"></i>
            <span>Stock is deducted only upon "Issue".</span>
          </div>
          <div class="footer-buttons">
            <button pButton type="button" label="Cancel" class="p-button-text p-button-secondary theme-btn-secondary" routerLink="/invoices"></button>
            
            @if (!editMode() || invoiceForm.get('status')?.value === 'draft') {
              <button pButton type="button" label="Save Draft" icon="pi pi-save" class="p-button-outlined theme-btn-secondary" (click)="handleSubmit('draft')" [loading]="isSubmitting()"></button>
            }
            
            <button pButton type="submit" [label]="editMode() && invoiceForm.get('status')?.value !== 'draft' ? 'Update Invoice' : 'Issue Invoice'" icon="pi pi-check" class="p-button-primary" (click)="handleSubmit('issued')" [loading]="isSubmitting()"></button>
          </div>
        </footer>
      </form>
    </div>
  `,
  styles: [`
    /* ============================================================================
       INVOICE FORM - FULL WIDTH, RESPONSIVE, BORDERED
       ============================================================================ */

    :host {
      display: block;
      width: 100%;
      height: 100%;
      background: var(--bg-secondary); /* External backdrop */
      font-family: var(--font-body);
      padding: var(--spacing-xl);
      box-sizing: border-box;
    }

    .page-layout {
      height: 100%;
      width: 100%;
      display: flex;
      justify-content: center;
      overflow: hidden;
    }

    /* MAIN CONTAINER - Full width and bordered */
    .invoice-container {
      width: 100%;
      max-width: 100%; 
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-md);
      overflow: hidden; 
    }

    /* STRUCTURAL CHROME */
    .elevation-card {
      background: var(--component-surface-raised, var(--bg-primary));
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--elevation-1);
      transition: var(--transition-base);

      &:hover {
        box-shadow: var(--elevation-2);
      }
    }

    /* 1. HEADER */
    .invoice-header {
      flex-shrink: 0;
      padding: var(--spacing-lg) var(--spacing-2xl);
      background: var(--bg-primary);
      border-bottom: var(--ui-border-width) solid var(--border-primary);
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: var(--z-sticky);
    }

    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    .back-btn { color: var(--text-secondary); width: 2.5rem; height: 2.5rem; }

    .title-row {
      display: flex; align-items: center; gap: var(--spacing-md);
      h1 { font-family: var(--font-heading); font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--text-primary); margin: 0; }
    }

    .status-badge {
      font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase;
      padding: var(--spacing-xs) var(--spacing-md); border-radius: var(--ui-border-radius-pill); letter-spacing: 0.05em;
      &.status-success { background: var(--color-success-bg); color: var(--color-success-dark); border: 1px solid var(--color-success-border); }
      &.status-warn { background: var(--color-warning-bg); color: var(--color-warning-dark); border: 1px solid var(--color-warning-border); }
    }

    .meta-row { display: flex; align-items: center; gap: var(--spacing-md); margin-top: var(--spacing-xs); font-size: var(--font-size-sm); color: var(--text-secondary); }
    .header-right .value-box { text-align: right; padding-left: var(--spacing-2xl); border-left: var(--ui-border-width-lg) solid var(--border-primary); }
    .value-label { display: block; font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-tertiary); }
    .value-amount { font-family: var(--font-mono); font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--accent-primary); line-height: var(--line-height-tight); }

    /* 2. BODY */
    .invoice-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-2xl);
      background: var(--bg-secondary);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xl);
    }

    /* 3. GRID & FORMS */
    .form-section {
      padding: var(--spacing-2xl);
      flex-shrink: 0; 
      display: flex;
      flex-direction: column;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--spacing-xl);
    }

    .span-2 { grid-column: span 2; }
    .span-3 { grid-column: span 3; }
    .span-4 { grid-column: span 4; }
    .span-12 { grid-column: span 12; }

    @media (max-width: 1024px) { .span-2, .span-3, .span-4 { grid-column: span 6; } }
    @media (max-width: 640px) { .span-2, .span-3, .span-4 { grid-column: span 12; } }

    .form-group label, .section-label {
      display: block; font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); text-transform: uppercase; color: var(--text-secondary); margin-bottom: var(--spacing-sm); letter-spacing: 0.02em;
    }

    .required { color: var(--color-error); }

    /* 4. TABLE SECTION */
    .section-toolbar {
      padding: var(--spacing-lg) var(--spacing-2xl);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
      background: transparent;
      display: flex; justify-content: space-between; align-items: center;
      flex-shrink: 0;
    }

    .toolbar-title { font-family: var(--font-heading); font-weight: var(--font-weight-semibold); font-size: var(--font-size-md); color: var(--text-primary); }

    /* Table Responsiveness & Height Fix */
    .table-wrapper {
      overflow-x: auto;
      overflow-y: hidden;
      width: 100%;
    }

    .theme-table {
      width: 100%;
      min-width: 1000px; 
      border-collapse: collapse;
      font-size: var(--font-size-sm);

      th {
        background: var(--bg-ternary); color: var(--text-secondary); font-weight: var(--font-weight-semibold); text-transform: uppercase; font-size: var(--font-size-xs);
        padding: var(--spacing-md) var(--spacing-lg); border-bottom: var(--ui-border-width) solid var(--border-primary); text-align: left;
      }

      td {
        padding: var(--spacing-md) var(--spacing-lg); border-bottom: var(--ui-border-width) solid var(--component-divider); vertical-align: middle; color: var(--text-primary); transition: var(--transition-fast);
      }

      tbody tr:hover td { background: var(--bg-hover); }
    }

    .item-meta { font-size: var(--font-size-xs); color: var(--text-tertiary); font-family: var(--font-mono); margin-top: var(--spacing-xs); }

    /* Non-blocking stock indicator */
    .stock-pill {
      font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); padding: var(--spacing-xs) var(--spacing-md); border-radius: var(--ui-border-radius); transition: var(--transition-base); display: inline-block; white-space: nowrap;
      &.stock-checking { opacity: 0.4; filter: grayscale(100%); }
      &.stock-ok { background: var(--color-success-bg); color: var(--color-success-dark); }
      &.stock-low { background: var(--color-error-bg); color: var(--color-error-dark); }
    }

    /* 5. FOOTER GRID */
    .footer-grid {
      display: grid;
      grid-template-columns: 7fr 5fr;
      gap: var(--spacing-2xl);
      flex-shrink: 0; 
    }

    @media (max-width: 1024px) { .footer-grid { grid-template-columns: 1fr; } }

    .quick-pay-card { margin-top: var(--spacing-xl); padding: var(--spacing-xl); display: flex; gap: var(--spacing-lg); align-items: flex-start; border-style: dashed; }
    .icon-circle { width: 3rem; height: 3rem; border-radius: 50%; background: var(--bg-ternary); border: var(--ui-border-width) solid var(--border-secondary); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-lg); flex-shrink: 0; }
    .pay-inputs { flex: 1; }
    .input-row { display: flex; gap: var(--spacing-md); margin-top: var(--spacing-xs); }

    /* TOTALS CARD */
    .totals-card { padding: var(--spacing-2xl); }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: var(--spacing-md); font-size: var(--font-size-md); color: var(--text-secondary); .val { font-weight: var(--font-weight-semibold); color: var(--text-primary); font-family: var(--font-mono); } .text-danger { color: var(--color-error); } .text-success { color: var(--color-success); } }
    .summary-divider { height: 1px; background: var(--border-tertiary); margin: var(--spacing-xl) 0; }
    .grand-total-row { span { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--text-primary); } .val { font-size: var(--font-size-2xl); color: var(--accent-primary); font-family: var(--font-mono); } }

    .balance-row {
      margin-top: var(--spacing-2xl); padding: var(--spacing-lg); border-radius: var(--ui-border-radius); display: flex; justify-content: space-between; font-weight: var(--font-weight-bold); font-size: var(--font-size-lg);
      &.bg-warn { background: var(--color-warning-bg); color: var(--color-warning-dark); border: var(--ui-border-width) solid var(--color-warning-border); }
      &.bg-success { background: var(--color-success-bg); color: var(--color-success-dark); border: var(--ui-border-width) solid var(--color-success-border); }
    }

    /* 6. STICKY FOOTER */
    .invoice-footer {
      flex-shrink: 0; padding: var(--spacing-lg) var(--spacing-2xl); background: var(--bg-primary); border-top: var(--ui-border-width) solid var(--border-primary); display: flex; justify-content: space-between; align-items: center; z-index: var(--z-fixed); box-shadow: 0 -4px 12px rgba(0,0,0,0.02);
    }

    .footer-info { font-size: var(--font-size-sm); color: var(--text-secondary); display: flex; align-items: center; gap: var(--spacing-sm); }
    .footer-buttons { display: flex; gap: var(--spacing-md); }
    .theme-btn-secondary { color: var(--text-secondary); border-color: var(--border-secondary); &:hover { background: var(--bg-hover); color: var(--text-primary); } }

    .empty-state { padding: var(--spacing-5xl); text-align: center; color: var(--text-tertiary); i { font-size: var(--font-size-4xl); margin-bottom: var(--spacing-md); display: block; opacity: 0.3; } p { font-size: var(--font-size-md); margin: 0; } }

    /* Scrollbar Integration */
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: var(--scroll-track); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: var(--ui-border-radius-pill); }
  `]
  // styles: [`
  //   /* ============================================================================
  //      INVOICE FORM - FULL WIDTH, RESPONSIVE, BORDERED
  //      ============================================================================ */

  //   :host {
  //     display: block;
  //     width: 100%;
  //     height: 100%;
  //     background: var(--bg-secondary); /* External backdrop */
  //     font-family: var(--font-body);
  //     padding: var(--spacing-xl);
  //     box-sizing: border-box;
  //   }

  //   .page-layout {
  //     height: 100%;
  //     width: 100%;
  //     display: flex;
  //     justify-content: center;
  //     overflow: hidden;
  //   }

  //   /* MAIN CONTAINER - Full width and bordered */
  //   .invoice-container {
  //     width: 100%;
  //     max-width: 100%; /* Removes previous 1400px restriction */
  //     height: 100%;
  //     display: flex;
  //     flex-direction: column;
  //     background: var(--bg-primary);
  //     border: var(--ui-border-width) solid var(--border-primary);
  //     border-radius: var(--ui-border-radius-lg);
  //     box-shadow: var(--shadow-md);
  //     overflow: hidden; /* Keeps header/footer docked while body scrolls */
  //   }

  //   /* STRUCTURAL CHROME */
  //   .elevation-card {
  //     background: var(--component-surface-raised, var(--bg-primary));
  //     border: var(--ui-border-width) solid var(--border-secondary);
  //     border-radius: var(--ui-border-radius-lg);
  //     box-shadow: var(--elevation-1);
  //     transition: var(--transition-base);

  //     &:hover {
  //       box-shadow: var(--elevation-2);
  //     }
  //   }

  //   /* 1. HEADER */
  //   .invoice-header {
  //     flex-shrink: 0;
  //     padding: var(--spacing-lg) var(--spacing-2xl);
  //     background: var(--bg-primary);
  //     border-bottom: var(--ui-border-width) solid var(--border-primary);
  //     display: flex;
  //     justify-content: space-between;
  //     align-items: center;
  //     z-index: var(--z-sticky);
  //   }

  //   .header-left {
  //     display: flex;
  //     align-items: center;
  //     gap: var(--spacing-xl);
  //   }

  //   .back-btn {
  //     color: var(--text-secondary);
  //     width: 2.5rem;
  //     height: 2.5rem;
  //   }

  //   .title-row {
  //     display: flex;
  //     align-items: center;
  //     gap: var(--spacing-md);

  //     h1 {
  //       font-family: var(--font-heading);
  //       font-size: var(--font-size-2xl);
  //       font-weight: var(--font-weight-bold);
  //       color: var(--text-primary);
  //       margin: 0;
  //     }
  //   }

  //   .status-badge {
  //     font-size: var(--font-size-xs);
  //     font-weight: var(--font-weight-bold);
  //     text-transform: uppercase;
  //     padding: var(--spacing-xs) var(--spacing-md);
  //     border-radius: var(--ui-border-radius-pill);
  //     letter-spacing: 0.05em;

  //     &.status-success {
  //       background: var(--color-success-bg);
  //       color: var(--color-success-dark);
  //       border: 1px solid var(--color-success-border);
  //     }

  //     &.status-warn {
  //       background: var(--color-warning-bg);
  //       color: var(--color-warning-dark);
  //       border: 1px solid var(--color-warning-border);
  //     }
  //   }

  //   .meta-row {
  //     display: flex;
  //     align-items: center;
  //     gap: var(--spacing-md);
  //     margin-top: var(--spacing-xs);
  //     font-size: var(--font-size-sm);
  //     color: var(--text-secondary);
  //   }

  //   .header-right .value-box {
  //     text-align: right;
  //     padding-left: var(--spacing-2xl);
  //     border-left: var(--ui-border-width-lg) solid var(--border-primary);
  //   }

  //   .value-label {
  //     display: block;
  //     font-size: var(--font-size-xs);
  //     font-weight: var(--font-weight-bold);
  //     text-transform: uppercase;
  //     letter-spacing: 0.1em;
  //     color: var(--text-tertiary);
  //   }

  //   .value-amount {
  //     font-family: var(--font-mono);
  //     font-size: var(--font-size-3xl);
  //     font-weight: var(--font-weight-bold);
  //     color: var(--accent-primary);
  //     line-height: var(--line-height-tight);
  //   }

  //   /* 2. BODY */
  //   .invoice-body {
  //     flex: 1;
  //     overflow-y: auto;
  //     padding: var(--spacing-2xl);
  //     background: var(--bg-secondary);
  //     display: flex;
  //     flex-direction: column;
  //     gap: var(--spacing-2xl);
  //   }

  //   /* 3. GRID & FORMS */
  //   .form-section {
  //     padding: var(--spacing-2xl);
  //   }

  //   .form-grid {
  //     display: grid;
  //     grid-template-columns: repeat(12, 1fr);
  //     gap: var(--spacing-xl);
  //   }

  //   .span-2 { grid-column: span 2; }
  //   .span-3 { grid-column: span 3; }
  //   .span-4 { grid-column: span 4; }
  //   .span-12 { grid-column: span 12; }

  //   @media (max-width: 1024px) {
  //     .span-2, .span-3, .span-4 { grid-column: span 6; }
  //   }
  //   @media (max-width: 640px) {
  //     .span-2, .span-3, .span-4 { grid-column: span 12; }
  //   }

  //   .form-group label, .section-label {
  //     display: block;
  //     font-size: var(--font-size-xs);
  //     font-weight: var(--font-weight-semibold);
  //     text-transform: uppercase;
  //     color: var(--text-secondary);
  //     margin-bottom: var(--spacing-sm);
  //     letter-spacing: 0.02em;
  //   }

  //   .required {
  //     color: var(--color-error);
  //   }

  //   /* 4. TABLE SECTION */
  //   .section-toolbar {
  //     padding: var(--spacing-lg) var(--spacing-2xl);
  //     border-bottom: var(--ui-border-width) solid var(--border-secondary);
  //     background: transparent;
  //     display: flex;
  //     justify-content: space-between;
  //     align-items: center;
  //   }

  //   .toolbar-title {
  //     font-family: var(--font-heading);
  //     font-weight: var(--font-weight-semibold);
  //     font-size: var(--font-size-md);
  //     color: var(--text-primary);
  //   }

  //   /* Table Responsiveness Fix */
  //   .table-wrapper {
  //     overflow-x: auto;
  //     width: 100%;
  //   }

  //   .theme-table {
  //     width: 100%;
  //     min-width: 1000px; /* Forces horizontal scrolling on small screens instead of squishing */
  //     border-collapse: collapse;
  //     font-size: var(--font-size-sm);

  //     th {
  //       background: var(--bg-ternary);
  //       color: var(--text-secondary);
  //       font-weight: var(--font-weight-semibold);
  //       text-transform: uppercase;
  //       font-size: var(--font-size-xs);
  //       padding: var(--spacing-md) var(--spacing-lg);
  //       border-bottom: var(--ui-border-width) solid var(--border-primary);
  //       text-align: left;
  //     }

  //     td {
  //       padding: var(--spacing-md) var(--spacing-lg);
  //       border-bottom: var(--ui-border-width) solid var(--component-divider);
  //       vertical-align: middle;
  //       color: var(--text-primary);
  //       transition: var(--transition-fast);
  //     }

  //     tbody tr:hover td {
  //       background: var(--bg-hover);
  //     }
  //   }

  //   .item-meta {
  //     font-size: var(--font-size-xs);
  //     color: var(--text-tertiary);
  //     font-family: var(--font-mono);
  //     margin-top: var(--spacing-xs);
  //   }

  //   /* Non-blocking stock indicator */
  //   .stock-pill {
  //     font-size: var(--font-size-xs);
  //     font-weight: var(--font-weight-bold);
  //     padding: var(--spacing-xs) var(--spacing-md);
  //     border-radius: var(--ui-border-radius);
  //     transition: var(--transition-base);
  //     display: inline-block;
  //     white-space: nowrap;

  //     &.stock-checking {
  //       opacity: 0.4;
  //       filter: grayscale(100%);
  //     }

  //     &.stock-ok {
  //       background: var(--color-success-bg);
  //       color: var(--color-success-dark);
  //     }

  //     &.stock-low {
  //       background: var(--color-error-bg);
  //       color: var(--color-error-dark);
  //     }
  //   }

  //   /* 5. FOOTER GRID */
  //   .footer-grid {
  //     display: grid;
  //     grid-template-columns: 7fr 5fr;
  //     gap: var(--spacing-2xl);
  //   }

  //   @media (max-width: 1024px) {
  //     .footer-grid { grid-template-columns: 1fr; }
  //   }

  //   .quick-pay-card {
  //     margin-top: var(--spacing-xl);
  //     padding: var(--spacing-xl);
  //     display: flex;
  //     gap: var(--spacing-lg);
  //     align-items: flex-start;
  //     border-style: dashed;
  //   }

  //   .icon-circle {
  //     width: 3rem;
  //     height: 3rem;
  //     border-radius: 50%;
  //     background: var(--bg-ternary);
  //     border: var(--ui-border-width) solid var(--border-secondary);
  //     color: var(--text-secondary);
  //     display: flex;
  //     align-items: center;
  //     justify-content: center;
  //     font-size: var(--font-size-lg);
  //     flex-shrink: 0;
  //   }

  //   .pay-inputs {
  //     flex: 1;
  //   }

  //   .input-row {
  //     display: flex;
  //     gap: var(--spacing-md);
  //     margin-top: var(--spacing-xs);
  //   }

  //   /* TOTALS CARD */
  //   .totals-card {
  //     padding: var(--spacing-2xl);
  //   }

  //   .summary-row {
  //     display: flex;
  //     justify-content: space-between;
  //     margin-bottom: var(--spacing-md);
  //     font-size: var(--font-size-md);
  //     color: var(--text-secondary);

  //     .val {
  //       font-weight: var(--font-weight-semibold);
  //       color: var(--text-primary);
  //       font-family: var(--font-mono);
  //     }

  //     .text-danger { color: var(--color-error); }
  //     .text-success { color: var(--color-success); }
  //   }

  //   .summary-divider {
  //     height: 1px;
  //     background: var(--border-tertiary);
  //     margin: var(--spacing-xl) 0;
  //   }

  //   .grand-total-row {
  //     span {
  //       font-size: var(--font-size-xl);
  //       font-weight: var(--font-weight-bold);
  //       color: var(--text-primary);
  //     }

  //     .val {
  //       font-size: var(--font-size-2xl);
  //       color: var(--accent-primary);
  //       font-family: var(--font-mono);
  //     }
  //   }

  //   .balance-row {
  //     margin-top: var(--spacing-2xl);
  //     padding: var(--spacing-lg);
  //     border-radius: var(--ui-border-radius);
  //     display: flex;
  //     justify-content: space-between;
  //     font-weight: var(--font-weight-bold);
  //     font-size: var(--font-size-lg);

  //     &.bg-warn {
  //       background: var(--color-warning-bg);
  //       color: var(--color-warning-dark);
  //       border: var(--ui-border-width) solid var(--color-warning-border);
  //     }

  //     &.bg-success {
  //       background: var(--color-success-bg);
  //       color: var(--color-success-dark);
  //       border: var(--ui-border-width) solid var(--color-success-border);
  //     }
  //   }

  //   /* 6. STICKY FOOTER */
  //   .invoice-footer {
  //     flex-shrink: 0;
  //     background: var(--bg-primary);
  //     border-top: var(--ui-border-width) solid var(--border-primary);
  //     padding: var(--spacing-lg) var(--spacing-2xl);
  //     display: flex;
  //     justify-content: space-between;
  //     align-items: center;
  //     z-index: var(--z-fixed);
  //     box-shadow: 0 -4px 12px rgba(0,0,0,0.02);
  //   }

  //   .footer-info {
  //     font-size: var(--font-size-sm);
  //     color: var(--text-secondary);
  //     display: flex;
  //     align-items: center;
  //     gap: var(--spacing-sm);
  //   }

  //   .footer-buttons {
  //     display: flex;
  //     gap: var(--spacing-md);
  //   }

  //   .theme-btn-secondary {
  //     color: var(--text-secondary);
  //     border-color: var(--border-secondary);

  //     &:hover {
  //       background: var(--bg-hover);
  //       color: var(--text-primary);
  //     }
  //   }

  //   .empty-state {
  //     padding: var(--spacing-5xl);
  //     text-align: center;
  //     color: var(--text-tertiary);

  //     i {
  //       font-size: var(--font-size-4xl);
  //       margin-bottom: var(--spacing-md);
  //       display: block;
  //       opacity: 0.3;
  //     }

  //     p {
  //       font-size: var(--font-size-md);
  //       margin: 0;
  //     }
  //   }

  //   /* Scrollbar Integration */
  //   .custom-scrollbar::-webkit-scrollbar {
  //     width: 6px;
  //     height: 6px;
  //   }
  //   .custom-scrollbar::-webkit-scrollbar-track {
  //     background: var(--scroll-track);
  //   }
  //   .custom-scrollbar::-webkit-scrollbar-thumb {
  //     background: var(--scroll-thumb);
  //     border-radius: var(--ui-border-radius-pill);
  //   }
  // `]

})
export class InvoiceFormComponent implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private masterDropdownService = inject(MasterDropdownService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  isLoading = signal(true);
  isSubmitting = signal(false);
  editMode = signal(false);
  invoiceId: string | null = null;
  stockWarnings = signal<StockWarning[]>([]);

  private destroy$ = new Subject<void>();

  formTitle = computed(() =>
    this.editMode()
      ? `Edit Invoice #${this.invoiceForm?.get('invoiceNumber')?.value || ''}`
      : 'New Invoice'
  );

  gstTypeOptions = [
    { label: 'Intra-State (CGST/SGST)', value: 'intra-state' },
    { label: 'Inter-State (IGST)', value: 'inter-state' },
    { label: 'Export / SEZ', value: 'export' },
  ];

  paymentMethodOptions = [
    { label: 'Cash', value: 'cash' },
    { label: 'UPI', value: 'upi' },
    { label: 'Bank Transfer', value: 'bank' },
    { label: 'Card', value: 'card' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Other', value: 'other' },
  ];

  subTotal = signal(0);
  totalDiscount = signal(0);
  totalTax = signal(0);
  grandTotal = signal(0);
  balanceAmount = signal(0);

  invoiceForm!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
    this.watchTotals();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.invoiceId = id;
        this.editMode.set(true);
        this.loadInvoice(id);
      } else {
        this.isLoading.set(false);
        this.generateInvoiceNumber();
        this.addItem();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.invoiceForm = this.fb.group({
      customerId: [null, Validators.required],
      branchId: [null, Validators.required],
      invoiceNumber: ['', Validators.required],
      invoiceDate: [new Date(), Validators.required],
      dueDate: [new Date()], // Defaults to current date
      status: ['draft', Validators.required],
      billingAddress: [''],
      shippingAddress: [''],
      placeOfSupply: [''],
      gstType: ['intra-state', Validators.required],
      items: this.fb.array([], Validators.required),
      roundOff: [0],
      paidAmount: [0, Validators.min(0)],
      paymentMethod: ['cash'],
      notes: [''],
    });
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItem(data?: Partial<InvoiceItem>): FormGroup {
    return this.fb.group({
      productId: [data?.productId ?? null, Validators.required],
      name: [data?.name ?? ''],
      sku: [data?.sku ?? ''],
      quantity: [data?.quantity ?? 1, [Validators.required, Validators.min(1)]],
      unit: [data?.unit ?? 'pcs'],
      price: [data?.price ?? 0, [Validators.required, Validators.min(0)]],
      discount: [data?.discount ?? 0, Validators.min(0)],
      taxRate: [data?.taxRate ?? 0, [Validators.required, Validators.min(0)]],
      currentStock: [data?.currentStock ?? null],
      isLowStock: [data?.isLowStock ?? false],
      isCheckingStock: [false],
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  private watchTotals(): void {
    this.invoiceForm.valueChanges.pipe(
      debounceTime(80),
      takeUntil(this.destroy$)
    ).subscribe(val => {
      let sub = 0, disc = 0, tax = 0;

      (val.items ?? []).forEach((item: any) => {
        const qty = +item.quantity || 0;
        const price = +item.price || 0;
        const d = +item.discount || 0;
        const tRate = +item.taxRate || 0;
        const base = qty * price;
        sub += base;
        disc += d;
        tax += (base - d) * tRate / 100;
      });

      const round = +val.roundOff || 0;
      const grand = Math.round(sub - disc + tax + round);
      const paid = +val.paidAmount || 0;

      this.subTotal.set(sub);
      this.totalDiscount.set(disc);
      this.totalTax.set(tax);
      this.grandTotal.set(grand);
      this.balanceAmount.set(grand - paid);
    });
  }

  calcLineTotal(index: number): number {
    const g = this.items.at(index).getRawValue();
    const base = (+g.quantity || 0) * (+g.price || 0);
    return (base - (+g.discount || 0)) * (1 + (+g.taxRate || 0) / 100);
  }

  onCustomerSelect(customer: any): void {
    if (!customer) return;

    const billAddr = this.formatAddress(customer['billingAddress']);
    this.invoiceForm.patchValue({
      billingAddress: billAddr,
      shippingAddress: this.formatAddress(customer['shippingAddress']) || billAddr,
      placeOfSupply: customer['billingAddress']?.state || '',
    });

    const terms = parseInt(customer['paymentTerms']) || 0;
    if (terms > 0) {
      const due = new Date();
      due.setDate(due.getDate() + terms);
      this.invoiceForm.patchValue({ dueDate: due });
    }
  }

  onProductSelect(product: any, index: number): void {
    if (!product) return;
    const productId = product._id;
    const branchId = this.invoiceForm.get('branchId')?.value;

    const itemGroup = this.items.at(index) as FormGroup;
    itemGroup.patchValue({
      name: product.name,
      price: product['sellingPrice'] ?? 0,
      taxRate: product['taxRate'] ?? 0,
      sku: product['sku'] ?? '',
      unit: product['unit'] ?? 'pcs',
      isCheckingStock: true,
      currentStock: null,
    });

    if (!branchId) {
      itemGroup.patchValue({ isCheckingStock: false });
      this.messageService.showWarn('Branch Required: Select a branch to check live stock.');
      return;
    }

    this.invoiceService.checkStock({
      branchId,
      items: [{ productId, quantity: 1 }]
    }).subscribe({
      next: (res: StockCheckResponse) => {
        const stockItem = res.data?.items?.[0];
        const available = stockItem?.availableStock ?? res.data?.summary?.totalStock ?? 0;

        const apiWarning = res.data?.warnings?.find(
          (w: StockWarning) => w.productId === productId
        );
        const reorderLevel = apiWarning?.reorderLevel ?? 10;
        const isLow = available <= reorderLevel;

        itemGroup.patchValue({
          currentStock: available,
          isLowStock: isLow,
          isCheckingStock: false,
        });

        this.updateStockWarnings(res.data?.warnings ?? []);
      },
      error: err => {
        console.error('Stock check failed', err);
        itemGroup.patchValue({ isCheckingStock: false, currentStock: 0 });
        this.messageService.showWarn('Stock Check: Failed to verify availability.');
      }
    });
  }

  private updateStockWarnings(incoming: StockWarning[]): void {
    const current = this.stockWarnings();
    const merged = [...current];
    incoming.forEach(w => {
      const idx = merged.findIndex(x => x.productId === w.productId);
      if (idx > -1) merged[idx] = w; else merged.push(w);
    });
    this.stockWarnings.set(merged);
  }

  handleSubmit(status: 'draft' | 'issued'): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.messageService.showWarn('Validation: Please complete all required fields.');
      return;
    }

    this.invoiceForm.patchValue({ status });
    const payload = this.buildPayload();

    if (status === 'draft') {
      this.saveInvoice(payload);
      return;
    }

    this.isSubmitting.set(true);
    this.invoiceService.checkStock({ branchId: payload.branchId, items: payload.items })
      .subscribe({
        next: (res: StockCheckResponse) => {
          if (!res.data.isValid) {
            const outOfStock = res.data.items
              .filter(i => !i.isAvailable)
              .map(i => `${i.name}: need ${(payload.items.find((x: any) => x.productId === i.productId)?.quantity)}, have ${i.availableStock}`)
              .join(' | ');
            this.messageService.showError(`Stock Unavailable: ${outOfStock || res.data.errors?.join(', ')}`);
            this.isSubmitting.set(false);
            return;
          }

          if (res.data.warnings?.length) {
            this.confirmationService.confirm({
              header: 'Stock Warning',
              message: `Stock will drop below reorder level for: ${res.data.warnings.map(w => w.productName).join(', ')}. Continue?`,
              icon: 'pi pi-exclamation-triangle',
              accept: () => this.saveInvoice(payload),
              reject: () => {
                this.isSubmitting.set(false);
                this.messageService.showInfo('Submission cancelled.');
              },
            });
          } else {
            this.saveInvoice(payload);
          }
        },
        error: err => {
          this.messageService.handleHttpError(err);
          this.isSubmitting.set(false);
        }
      });
  }

  private saveInvoice(payload: any): void {
    this.isSubmitting.set(true);
    const req$ = this.editMode()
      ? this.invoiceService.updateInvoice(this.invoiceId!, payload)
      : this.invoiceService.createInvoice(payload);

    req$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: res => {
        const num = res.data?.invoice?.invoiceNumber ?? 'New';
        const action = payload.status === 'draft' ? 'saved as draft' : 'issued';
        this.messageService.showSuccess(`Invoice #${num} has been ${action}.`);
        this.router.navigate(['/invoices']);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  private buildPayload(): any {
    const fv = this.invoiceForm.getRawValue();
    return {
      ...fv,
      subTotal: this.subTotal(),
      totalDiscount: this.totalDiscount(),
      totalTax: this.totalTax(),
      grandTotal: this.grandTotal(),
      balanceAmount: this.balanceAmount(),
      items: fv.items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        discount: i.discount,
        taxRate: i.taxRate,
        unit: i.unit,
      })),
    };
  }

  generateInvoiceNumber(): void {
    if (this.editMode()) return;
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const r = Math.floor(1000 + Math.random() * 9000);
    this.invoiceForm.patchValue({ invoiceNumber: `INV-${d}-${r}` });
  }

  getInitials(name: string): string {
    return name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '??';
  }

  formatAddress(addr: any): string {
    if (!addr) return '';
    return [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ');
  }

  private loadInvoice(id: string): void {
    this.invoiceService.getInvoiceWithStock(id).subscribe({
      next: (res: any) => {
        const data = res.data?.invoice ?? res.data;
        if (data) this.patchForm(data);
        this.isLoading.set(false);
      },
      error: err => {
        this.messageService.handleHttpError(err);
        this.router.navigate(['/invoices']);
      }
    });
  }

  private patchForm(data: any): void {
    this.invoiceForm.patchValue({
      customerId: data.customerId?._id ?? data.customerId,
      branchId: data.branchId?._id ?? data.branchId,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: data.status,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      placeOfSupply: data.placeOfSupply,
      roundOff: data.roundOff ?? 0,
      paidAmount: data.paidAmount ?? 0,
      paymentMethod: data.paymentMethod,
      gstType: data.gstType,
      notes: data.notes,
    });

    this.items.clear();
    (data.items ?? []).forEach((item: any) =>
      this.items.push(this.createItem({
        productId: item.productId?._id ?? item.productId,
        name: item.name,
        sku: item.hsnCode ?? item.sku,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        discount: item.discount,
        taxRate: item.taxRate,
        currentStock: item.currentStock ?? null,
        isLowStock: item.willBeLow ?? false,
      }))
    );
  }
}

interface InvoiceItem {
  productId: string | null;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  price: number;
  discount: number;
  taxRate: number;
  currentStock: number | null;
  isLowStock: boolean;
}

interface StockWarning {
  productId: string;
  productName: string;
  availableAfterSale: number;
  reorderLevel: number;
  message: string;
}

interface StockCheckResponseData {
  isValid: boolean;
  errors: string[];
  warnings: StockWarning[];
  summary: { totalStock: number; totalRequested: number };
  items: {
    productId: string;
    name: string;
    sku: string;
    requestedQuantity: number;
    availableStock: number;
    price: number;
    isAvailable: boolean;
  }[];
}

interface StockCheckResponse {
  status: string;
  data: StockCheckResponseData;
}
// import {
//   Component, OnInit, OnDestroy,
//   inject, signal, computed
// } from '@angular/core';
// import { CommonModule, CurrencyPipe } from '@angular/common';
// import {
//   FormBuilder, FormGroup, FormArray,
//   Validators, ReactiveFormsModule
// } from '@angular/forms';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { Subject } from 'rxjs';
// import { debounceTime, takeUntil, finalize } from 'rxjs/operators';

// import { InvoiceService } from '../../services/invoice-service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
// import { MasterDropdownService } from '../../../../core/services/master-dropdown.service';

// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { SelectModule } from 'primeng/select';
// import { DatePickerModule } from 'primeng/datepicker';
// import { TextareaModule } from 'primeng/textarea';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ConfirmationService } from 'primeng/api';

// @Component({
//   selector: 'app-invoice-form',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, RouterModule,
//     ToastModule, ButtonModule, InputTextModule, InputNumberModule,
//     DatePickerModule, SelectModule, TextareaModule,
//     ConfirmDialogModule, ProgressSpinnerModule,
//     MasterDropdownComponent
//   ],
//   providers: [ConfirmationService],
//   templateUrl: './invoice-form.html',
//   styleUrls: ['./invoice-form.scss'],
// })
// export class InvoiceFormComponent implements OnInit, OnDestroy {

//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private invoiceService = inject(InvoiceService);
//   private masterDropdownService = inject(MasterDropdownService);
//   private messageService = inject(AppMessageService);
//   private confirmationService = inject(ConfirmationService);

//   isLoading = signal(true);
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   invoiceId: string | null = null;
//   stockWarnings = signal<StockWarning[]>([]);

//   private destroy$ = new Subject<void>();

//   formTitle = computed(() =>
//     this.editMode()
//       ? `Edit Invoice #${this.invoiceForm?.get('invoiceNumber')?.value || ''}`
//       : 'New Invoice'
//   );

//   gstTypeOptions = [
//     { label: 'Intra-State (CGST/SGST)', value: 'intra-state' },
//     { label: 'Inter-State (IGST)', value: 'inter-state' },
//     { label: 'Export / SEZ', value: 'export' },
//   ];

//   paymentMethodOptions = [
//     { label: 'Cash', value: 'cash' },
//     { label: 'UPI', value: 'upi' },
//     { label: 'Bank Transfer', value: 'bank' },
//     { label: 'Card', value: 'card' },
//     { label: 'Cheque', value: 'cheque' },
//     { label: 'Other', value: 'other' },
//   ];

//   subTotal = signal(0);
//   totalDiscount = signal(0);
//   totalTax = signal(0);
//   grandTotal = signal(0);
//   balanceAmount = signal(0);

//   invoiceForm!: FormGroup;

//   ngOnInit(): void {
//     this.buildForm();
//     this.watchTotals();

//     this.route.paramMap.subscribe(params => {
//       const id = params.get('id');
//       if (id) {
//         this.invoiceId = id;
//         this.editMode.set(true);
//         this.loadInvoice(id);
//       } else {
//         this.isLoading.set(false);
//         this.generateInvoiceNumber();
//         this.addItem();
//       }
//     });
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   private buildForm(): void {
//     this.invoiceForm = this.fb.group({
//       customerId: [null, Validators.required],
//       branchId: [null, Validators.required],
//       invoiceNumber: ['', Validators.required],
//       invoiceDate: [new Date(), Validators.required],
//       dueDate: [null],
//       status: ['draft', Validators.required],
//       billingAddress: [''],
//       shippingAddress: [''],
//       placeOfSupply: [''],
//       gstType: ['intra-state', Validators.required],
//       items: this.fb.array([], Validators.required),
//       roundOff: [0],
//       paidAmount: [0, Validators.min(0)],
//       paymentMethod: ['cash'],
//       notes: [''],
//     });
//   }

//   get items(): FormArray {
//     return this.invoiceForm.get('items') as FormArray;
//   }

//   createItem(data?: Partial<InvoiceItem>): FormGroup {
//     return this.fb.group({
//       productId: [data?.productId ?? null, Validators.required],
//       name: [data?.name ?? ''],
//       sku: [data?.sku ?? ''],
//       quantity: [data?.quantity ?? 1, [Validators.required, Validators.min(1)]],
//       unit: [data?.unit ?? 'pcs'],
//       price: [data?.price ?? 0, [Validators.required, Validators.min(0)]],
//       discount: [data?.discount ?? 0, Validators.min(0)],
//       taxRate: [data?.taxRate ?? 0, [Validators.required, Validators.min(0)]],
//       currentStock: [data?.currentStock ?? null],
//       isLowStock: [data?.isLowStock ?? false],
//       isCheckingStock: [false],
//     });
//   }

//   addItem(): void {
//     this.items.push(this.createItem());
//   }

//   removeItem(index: number): void {
//     this.items.removeAt(index);
//   }

//   private watchTotals(): void {
//     this.invoiceForm.valueChanges.pipe(
//       debounceTime(80),
//       takeUntil(this.destroy$)
//     ).subscribe(val => {
//       let sub = 0, disc = 0, tax = 0;

//       (val.items ?? []).forEach((item: any) => {
//         const qty = +item.quantity || 0;
//         const price = +item.price || 0;
//         const d = +item.discount || 0;
//         const tRate = +item.taxRate || 0;
//         const base = qty * price;
//         sub += base;
//         disc += d;
//         tax += (base - d) * tRate / 100;
//       });

//       const round = +val.roundOff || 0;
//       const grand = Math.round(sub - disc + tax + round);
//       const paid = +val.paidAmount || 0;

//       this.subTotal.set(sub);
//       this.totalDiscount.set(disc);
//       this.totalTax.set(tax);
//       this.grandTotal.set(grand);
//       this.balanceAmount.set(grand - paid);
//     });
//   }

//   calcLineTotal(index: number): number {
//     const g = this.items.at(index).getRawValue();
//     const base = (+g.quantity || 0) * (+g.price || 0);
//     return (base - (+g.discount || 0)) * (1 + (+g.taxRate || 0) / 100);
//   }

//   onCustomerSelect(customer: any): void {
//     if (!customer) return;

//     const billAddr = this.formatAddress(customer['billingAddress']);
//     this.invoiceForm.patchValue({
//       billingAddress: billAddr,
//       shippingAddress: this.formatAddress(customer['shippingAddress']) || billAddr,
//       placeOfSupply: customer['billingAddress']?.state || '',
//     });

//     const terms = parseInt(customer['paymentTerms']) || 0;
//     if (terms > 0) {
//       const due = new Date();
//       due.setDate(due.getDate() + terms);
//       this.invoiceForm.patchValue({ dueDate: due });
//     }
//   }

//   onProductSelect(product: any, index: number): void {
//     if (!product) return;
//     const productId = product._id;
//     const branchId = this.invoiceForm.get('branchId')?.value;

//     const itemGroup = this.items.at(index) as FormGroup;
//     itemGroup.patchValue({
//       name: product.name,
//       price: product['sellingPrice'] ?? 0,
//       taxRate: product['taxRate'] ?? 0,
//       sku: product['sku'] ?? '',
//       unit: product['unit'] ?? 'pcs',
//       isCheckingStock: true,
//       currentStock: null,
//     });

//     if (!branchId) {
//       itemGroup.patchValue({ isCheckingStock: false });
//       this.messageService.showWarn('Branch Required: Select a branch to check live stock.');
//       return;
//     }

//     this.invoiceService.checkStock({
//       branchId,
//       items: [{ productId, quantity: 1 }]
//     }).subscribe({
//       next: (res: StockCheckResponse) => {
//         const stockItem = res.data?.items?.[0];
//         const available = stockItem?.availableStock ?? res.data?.summary?.totalStock ?? 0;

//         const apiWarning = res.data?.warnings?.find(
//           (w: StockWarning) => w.productId === productId
//         );
//         const reorderLevel = apiWarning?.reorderLevel ?? 10;
//         const isLow = available <= reorderLevel;

//         itemGroup.patchValue({
//           currentStock: available,
//           isLowStock: isLow,
//           isCheckingStock: false,
//         });

//         this.updateStockWarnings(res.data?.warnings ?? []);
//       },
//       error: err => {
//         console.error('Stock check failed', err);
//         itemGroup.patchValue({ isCheckingStock: false, currentStock: 0 });
//         this.messageService.showWarn('Stock Check: Failed to verify availability.');
//       }
//     });
//   }

//   private updateStockWarnings(incoming: StockWarning[]): void {
//     const current = this.stockWarnings();
//     const merged = [...current];
//     incoming.forEach(w => {
//       const idx = merged.findIndex(x => x.productId === w.productId);
//       if (idx > -1) merged[idx] = w; else merged.push(w);
//     });
//     this.stockWarnings.set(merged);
//   }

//   handleSubmit(status: 'draft' | 'issued'): void {
//     if (this.invoiceForm.invalid) {
//       this.invoiceForm.markAllAsTouched();
//       this.messageService.showWarn('Validation: Please complete all required fields.');
//       return;
//     }

//     this.invoiceForm.patchValue({ status });
//     const payload = this.buildPayload();

//     if (status === 'draft') {
//       this.saveInvoice(payload);
//       return;
//     }

//     this.isSubmitting.set(true);
//     this.invoiceService.checkStock({ branchId: payload.branchId, items: payload.items })
//       .subscribe({
//         next: (res: StockCheckResponse) => {
//           if (!res.data.isValid) {
//             const outOfStock = res.data.items
//               .filter(i => !i.isAvailable)
//               .map(i => `${i.name}: need ${(payload.items.find((x: any) => x.productId === i.productId)?.quantity)}, have ${i.availableStock}`)
//               .join(' | ');
//             this.messageService.showError(`Stock Unavailable: ${outOfStock || res.data.errors?.join(', ')}`);
//             this.isSubmitting.set(false);
//             return;
//           }

//           if (res.data.warnings?.length) {
//             this.confirmationService.confirm({
//               header: 'Stock Warning',
//               message: `Stock will drop below reorder level for: ${res.data.warnings.map(w => w.productName).join(', ')}. Continue?`,
//               icon: 'pi pi-exclamation-triangle',
//               accept: () => this.saveInvoice(payload),
//               reject: () => {
//                 this.isSubmitting.set(false);
//                 this.messageService.showInfo('Submission cancelled.');
//               },
//             });
//           } else {
//             this.saveInvoice(payload);
//           }
//         },
//         error: err => {
//           this.messageService.handleHttpError(err);
//           this.isSubmitting.set(false);
//         }
//       });
//   }

//   private saveInvoice(payload: any): void {
//     this.isSubmitting.set(true);
//     const req$ = this.editMode()
//       ? this.invoiceService.updateInvoice(this.invoiceId!, payload)
//       : this.invoiceService.createInvoice(payload);

//     req$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
//       next: res => {
//         const num = res.data?.invoice?.invoiceNumber ?? 'New';
//         const action = payload.status === 'draft' ? 'saved as draft' : 'issued';
//         this.messageService.showSuccess(`Invoice #${num} has been ${action}.`);
//         this.router.navigate(['/invoices']);
//       },
//       error: err => this.messageService.handleHttpError(err),
//     });
//   }

//   private buildPayload(): any {
//     const fv = this.invoiceForm.getRawValue();
//     return {
//       ...fv,
//       subTotal: this.subTotal(),
//       totalDiscount: this.totalDiscount(),
//       totalTax: this.totalTax(),
//       grandTotal: this.grandTotal(),
//       balanceAmount: this.balanceAmount(),
//       items: fv.items.map((i: any) => ({
//         productId: i.productId,
//         quantity: i.quantity,
//         price: i.price,
//         discount: i.discount,
//         taxRate: i.taxRate,
//         unit: i.unit,
//       })),
//     };
//   }

//   generateInvoiceNumber(): void {
//     if (this.editMode()) return;
//     const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
//     const r = Math.floor(1000 + Math.random() * 9000);
//     this.invoiceForm.patchValue({ invoiceNumber: `INV-${d}-${r}` });
//   }

//   getInitials(name: string): string {
//     return name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '??';
//   }

//   formatAddress(addr: any): string {
//     if (!addr) return '';
//     return [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ');
//   }

//   private loadInvoice(id: string): void {
//     this.invoiceService.getInvoiceWithStock(id).subscribe({
//       next: (res: any) => {
//         const data = res.data?.invoice ?? res.data;
//         if (data) this.patchForm(data);
//         this.isLoading.set(false);
//       },
//       error: err => {
//         this.messageService.handleHttpError(err);
//         this.router.navigate(['/invoices']);
//       }
//     });
//   }

//   private patchForm(data: any): void {
//     this.invoiceForm.patchValue({
//       customerId: data.customerId?._id ?? data.customerId,
//       branchId: data.branchId?._id ?? data.branchId,
//       invoiceNumber: data.invoiceNumber,
//       invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
//       dueDate: data.dueDate ? new Date(data.dueDate) : null,
//       status: data.status,
//       billingAddress: data.billingAddress,
//       shippingAddress: data.shippingAddress,
//       placeOfSupply: data.placeOfSupply,
//       roundOff: data.roundOff ?? 0,
//       paidAmount: data.paidAmount ?? 0,
//       paymentMethod: data.paymentMethod,
//       gstType: data.gstType,
//       notes: data.notes,
//     });

//     this.items.clear();
//     (data.items ?? []).forEach((item: any) =>
//       this.items.push(this.createItem({
//         productId: item.productId?._id ?? item.productId,
//         name: item.name,
//         sku: item.hsnCode ?? item.sku,
//         quantity: item.quantity,
//         unit: item.unit,
//         price: item.price,
//         discount: item.discount,
//         taxRate: item.taxRate,
//         currentStock: item.currentStock ?? null,
//         isLowStock: item.willBeLow ?? false,
//       }))
//     );
//   }
// }

// interface InvoiceItem {
//   productId: string | null;
//   name: string;
//   sku: string;
//   quantity: number;
//   unit: string;
//   price: number;
//   discount: number;
//   taxRate: number;
//   currentStock: number | null;
//   isLowStock: boolean;
// }

// interface StockWarning {
//   productId: string;
//   productName: string;
//   availableAfterSale: number;
//   reorderLevel: number;
//   message: string;
// }

// interface StockCheckResponseData {
//   isValid: boolean;
//   errors: string[];
//   warnings: StockWarning[];
//   summary: { totalStock: number; totalRequested: number };
//   items: {
//     productId: string;
//     name: string;
//     sku: string;
//     requestedQuantity: number;
//     availableStock: number;
//     price: number;
//     isAvailable: boolean;
//   }[];
// }

// interface StockCheckResponse {
//   status: string;
//   data: StockCheckResponseData;
// }// import {
// //   Component, OnInit, OnDestroy,
// //   inject, signal, computed
// // } from '@angular/core';
// // import { CommonModule, CurrencyPipe } from '@angular/common';
// // import {
// //   FormBuilder, FormGroup, FormArray,
// //   Validators, ReactiveFormsModule
// // } from '@angular/forms';
// // import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// // import { Subject } from 'rxjs';
// // import { debounceTime, takeUntil, finalize } from 'rxjs/operators';

// // // ── Services ──────────────────────────────────────────────────────────────
// // import { InvoiceService } from '../../services/invoice-service';
// // // import { MasterListService } from '../../../../core/services/master-list.service';
// // import { AppMessageService } from '../../../../core/services/message.service';
// // import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
// // import { MasterDropdownService } from '../../../../core/services/master-dropdown.service';

// // // ── PrimeNG ───────────────────────────────────────────────────────────────
// // import { ButtonModule } from 'primeng/button';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { SelectModule } from 'primeng/select';
// // import { DatePickerModule } from 'primeng/datepicker';
// // import { TextareaModule } from 'primeng/textarea';
// // import { ToastModule } from 'primeng/toast';
// // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // import { ConfirmationService } from 'primeng/api';
// // // import { AbsPipe } from '../../../shared/pipes/abs.pipe';

// // // ── Pipes ─────────────────────────────────────────────────────────────────

// // @Component({
// //   selector: 'app-invoice-form',
// //   standalone: true,
// //   imports: [
// //     CommonModule, ReactiveFormsModule, RouterModule,
// //     ToastModule, ButtonModule, InputTextModule, InputNumberModule,
// //     DatePickerModule, SelectModule, TextareaModule,
// //     ConfirmDialogModule, ProgressSpinnerModule,
// //     MasterDropdownComponent
// //   ],
// //   providers: [ConfirmationService],
// //   templateUrl: './invoice-form.html',
// //   styleUrls: ['./invoice-form.scss'],
// // })
// // export class InvoiceFormComponent implements OnInit, OnDestroy {

// //   // ── DI ──────────────────────────────────────────────────────────────────
// //   private fb = inject(FormBuilder);
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);
// //   private invoiceService = inject(InvoiceService);
// //   // private masterList = inject(MasterListService);
// //   private masterDropdownService = inject(MasterDropdownService);
// //   private messageService = inject(AppMessageService);
// //   private confirmationService = inject(ConfirmationService);

// //   // ── State ────────────────────────────────────────────────────────────────
// //   isLoading = signal(true);
// //   isSubmitting = signal(false);
// //   editMode = signal(false);
// //   invoiceId: string | null = null;

// //   /** Warnings coming from the checkStock API response */
// //   stockWarnings = signal<StockWarning[]>([]);

// //   private destroy$ = new Subject<void>();

// //   // ── Computed ─────────────────────────────────────────────────────────────
// //   formTitle = computed(() =>
// //     this.editMode()
// //       ? `Edit Invoice #${this.invoiceForm?.get('invoiceNumber')?.value || ''}`
// //       : 'New Invoice'
// //   );

// //   // ── Master data (from signals) ───────────────────────────────────────────
// //   // customerOptions = computed(() => this.masterList.customers());
// //   // productOptions = computed(() => this.masterList.products());
// //   // branchOptions = computed(() => this.masterList.branches());

// //   // ── Static options ───────────────────────────────────────────────────────
// //   gstTypeOptions = [
// //     { label: 'Intra-State (CGST/SGST)', value: 'intra-state' },
// //     { label: 'Inter-State (IGST)', value: 'inter-state' },
// //     { label: 'Export / SEZ', value: 'export' },
// //   ];

// //   paymentMethodOptions = [
// //     { label: 'Cash', value: 'cash' },
// //     { label: 'UPI', value: 'upi' },
// //     { label: 'Bank Transfer', value: 'bank' },
// //     { label: 'Card', value: 'card' },
// //     { label: 'Cheque', value: 'cheque' },
// //     { label: 'Other', value: 'other' },
// //   ];
// //   // ── Reactive totals ──────────────────────────────────────────────────────
// //   subTotal = signal(0);
// //   totalDiscount = signal(0);
// //   totalTax = signal(0);
// //   grandTotal = signal(0);
// //   balanceAmount = signal(0);

// //   // ── Form ─────────────────────────────────────────────────────────────────
// //   invoiceForm!: FormGroup;

// //   // ═══════════════════════════════════════════════════════════════════════
// //   // Lifecycle
// //   // ═══════════════════════════════════════════════════════════════════════

// //   ngOnInit(): void {
// //     this.buildForm();
// //     this.watchTotals();

// //     // Pre-select first branch (Now we don't have local options, but we can still patch if needed or let the dropdown handle it)
// //     // const defaultBranch = this.masterList.branches()[0]?._id;
// //     // if (defaultBranch) this.invoiceForm.patchValue({ branchId: defaultBranch });

// //     this.route.paramMap.subscribe(params => {
// //       const id = params.get('id');
// //       if (id) {
// //         this.invoiceId = id;
// //         this.editMode.set(true);
// //         this.loadInvoice(id);
// //       } else {
// //         this.isLoading.set(false);
// //         this.generateInvoiceNumber();
// //         this.addItem();
// //       }
// //     });
// //   }

// //   ngOnDestroy(): void {
// //     this.destroy$.next();
// //     this.destroy$.complete();
// //   }

// //   // ═══════════════════════════════════════════════════════════════════════
// //   // Form Builder
// //   // ═══════════════════════════════════════════════════════════════════════

// //   private buildForm(): void {
// //     this.invoiceForm = this.fb.group({
// //       customerId: [null, Validators.required],
// //       branchId: [null, Validators.required],
// //       invoiceNumber: ['', Validators.required],
// //       invoiceDate: [new Date(), Validators.required],
// //       dueDate: [null],
// //       status: ['draft', Validators.required],
// //       billingAddress: [''],
// //       shippingAddress: [''],
// //       placeOfSupply: [''],
// //       gstType: ['intra-state', Validators.required],
// //       items: this.fb.array([], Validators.required),
// //       roundOff: [0],
// //       paidAmount: [0, Validators.min(0)],
// //       paymentMethod: ['cash'],
// //       notes: [''],
// //     });
// //   }

// //   // ── FormArray helper ─────────────────────────────────────────────────────
// //   get items(): FormArray {
// //     return this.invoiceForm.get('items') as FormArray;
// //   }

// //   createItem(data?: Partial<InvoiceItem>): FormGroup {
// //     return this.fb.group({
// //       productId: [data?.productId ?? null, Validators.required],
// //       name: [data?.name ?? ''],
// //       sku: [data?.sku ?? ''],
// //       quantity: [data?.quantity ?? 1, [Validators.required, Validators.min(1)]],
// //       unit: [data?.unit ?? 'pcs'],
// //       price: [data?.price ?? 0, [Validators.required, Validators.min(0)]],
// //       discount: [data?.discount ?? 0, Validators.min(0)],
// //       taxRate: [data?.taxRate ?? 0, [Validators.required, Validators.min(0)]],
// //       currentStock: [data?.currentStock ?? null],
// //       isLowStock: [data?.isLowStock ?? false],
// //       isCheckingStock: [false],
// //     });
// //   }

// //   addItem(): void {
// //     this.items.push(this.createItem());
// //   }

// //   removeItem(index: number): void {
// //     this.items.removeAt(index);
// //   }

// //   // ═══════════════════════════════════════════════════════════════════════
// //   // Smart Totals (reactive, debounced)
// //   // ═══════════════════════════════════════════════════════════════════════

// //   private watchTotals(): void {
// //     this.invoiceForm.valueChanges.pipe(
// //       debounceTime(80),
// //       takeUntil(this.destroy$)
// //     ).subscribe(val => {
// //       let sub = 0, disc = 0, tax = 0;

// //       (val.items ?? []).forEach((item: any) => {
// //         const qty = +item.quantity || 0;
// //         const price = +item.price || 0;
// //         const d = +item.discount || 0;
// //         const tRate = +item.taxRate || 0;
// //         const base = qty * price;
// //         sub += base;
// //         disc += d;
// //         tax += (base - d) * tRate / 100;
// //       });

// //       const round = +val.roundOff || 0;
// //       const grand = Math.round(sub - disc + tax + round);
// //       const paid = +val.paidAmount || 0;

// //       this.subTotal.set(sub);
// //       this.totalDiscount.set(disc);
// //       this.totalTax.set(tax);
// //       this.grandTotal.set(grand);
// //       this.balanceAmount.set(grand - paid);
// //     });
// //   }

// //   // ── Line total helper (used in template) ─────────────────────────────────
// //   calcLineTotal(index: number): number {
// //     const g = this.items.at(index).getRawValue();
// //     const base = (+g.quantity || 0) * (+g.price || 0);
// //     return (base - (+g.discount || 0)) * (1 + (+g.taxRate || 0) / 100);
// //   }

// //   // ═══════════════════════════════════════════════════════════════════════
// //   // Customer Selection
// //   // ═══════════════════════════════════════════════════════════════════════

// //   onCustomerSelect(customer: any): void {
// //     if (!customer) return;

// //     const billAddr = this.formatAddress(customer['billingAddress']);
// //     this.invoiceForm.patchValue({
// //       billingAddress: billAddr,
// //       shippingAddress: this.formatAddress(customer['shippingAddress']) || billAddr,
// //       placeOfSupply: customer['billingAddress']?.state || '',
// //     });

// //     const terms = parseInt(customer['paymentTerms']) || 0;
// //     if (terms > 0) {
// //       const due = new Date();
// //       due.setDate(due.getDate() + terms);
// //       this.invoiceForm.patchValue({ dueDate: due });
// //     }
// //   }

// //   // ═══════════════════════════════════════════════════════════════════════
// //   // Product Selection + Live Stock Check
// //   // ═══════════════════════════════════════════════════════════════════════

// //   onProductSelect(product: any, index: number): void {
// //     console.log('product', product)
// //     if (!product) return;
// //     const productId = product._id;
// //     const branchId = this.invoiceForm.get('branchId')?.value;

// //     const itemGroup = this.items.at(index) as FormGroup;
// //     itemGroup.patchValue({
// //       name: product.name,
// //       price: product['sellingPrice'] ?? 0,
// //       taxRate: product['taxRate'] ?? 0,
// //       sku: product['sku'] ?? '',
// //       unit: product['unit'] ?? 'pcs',
// //       isCheckingStock: true,
// //       currentStock: null,
// //     });

// //     if (!branchId) {
// //       itemGroup.patchValue({ isCheckingStock: false });
// //       this.messageService.showWarn('Branch Required: Select a branch to check live stock.');
// //       return;
// //     }

// //     this.invoiceService.checkStock({
// //       branchId,
// //       items: [{ productId, quantity: 1 }]
// //     }).subscribe({
// //       next: (res: StockCheckResponse) => {
// //         const stockItem = res.data?.items?.[0];
// //         const available = stockItem?.availableStock ?? res.data?.summary?.totalStock ?? 0;

// //         const apiWarning = res.data?.warnings?.find(
// //           (w: StockWarning) => w.productId === productId
// //         );
// //         const reorderLevel = apiWarning?.reorderLevel ?? 10;
// //         const isLow = available <= reorderLevel;

// //         itemGroup.patchValue({
// //           currentStock: available,
// //           isLowStock: isLow,
// //           isCheckingStock: false,
// //         });

// //         this.updateStockWarnings(res.data?.warnings ?? []);
// //       },
// //       error: err => {
// //         console.error('Stock check failed', err);
// //         itemGroup.patchValue({ isCheckingStock: false, currentStock: 0 });
// //         this.messageService.showWarn('Stock Check: Failed to verify availability.');
// //       }
// //     });
// //   }

// //   /** Merge incoming warnings into the signal, deduplicate by productId */
// //   private updateStockWarnings(incoming: StockWarning[]): void {
// //     const current = this.stockWarnings();
// //     const merged = [...current];
// //     incoming.forEach(w => {
// //       const idx = merged.findIndex(x => x.productId === w.productId);
// //       if (idx > -1) merged[idx] = w; else merged.push(w);
// //     });
// //     this.stockWarnings.set(merged);
// //   }

// //   // ═══════════════════════════════════════════════════════════════════════
// //   // Submit Flow
// //   // ═══════════════════════════════════════════════════════════════════════

// //   handleSubmit(status: 'draft' | 'issued'): void {
// //     if (this.invoiceForm.invalid) {
// //       this.invoiceForm.markAllAsTouched();
// //       this.messageService.showWarn('Validation: Please complete all required fields.');
// //       return;
// //     }

// //     this.invoiceForm.patchValue({ status });
// //     const payload = this.buildPayload();

// //     // Drafts skip the stock check
// //     if (status === 'draft') {
// //       this.saveInvoice(payload);
// //       return;
// //     }

// //     // Issued → validate stock first
// //     this.isSubmitting.set(true);
// //     this.invoiceService.checkStock({ branchId: payload.branchId, items: payload.items })
// //       .subscribe({
// //         next: (res: StockCheckResponse) => {
// //           if (!res.data.isValid) {
// //             const outOfStock = res.data.items
// //               .filter(i => !i.isAvailable)
// //               .map(i => `${i.name}: need ${(payload.items.find((x: any) => x.productId === i.productId)?.quantity)}, have ${i.availableStock}`)
// //               .join(' | ');
// //             this.messageService.showError(`Stock Unavailable: ${outOfStock || res.data.errors?.join(', ')}`);
// //             this.isSubmitting.set(false);
// //             return;
// //           }

// //           if (res.data.warnings?.length) {
// //             this.confirmationService.confirm({
// //               header: 'Stock Warning',
// //               message: `Stock will drop below reorder level for: ${res.data.warnings.map(w => w.productName).join(', ')}. Continue?`,
// //               icon: 'pi pi-exclamation-triangle',
// //               accept: () => this.saveInvoice(payload),
// //               reject: () => {
// //                 this.isSubmitting.set(false);
// //                 this.messageService.showInfo('Submission cancelled.');
// //               },
// //             });
// //           } else {
// //             this.saveInvoice(payload);
// //           }
// //         },
// //         error: err => {
// //           this.messageService.handleHttpError(err);
// //           this.isSubmitting.set(false);
// //         }
// //       });
// //   }

// //   private saveInvoice(payload: any): void {
// //     this.isSubmitting.set(true);
// //     const req$ = this.editMode()
// //       ? this.invoiceService.updateInvoice(this.invoiceId!, payload)
// //       : this.invoiceService.createInvoice(payload);

// //     req$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
// //       next: res => {
// //         const num = res.data?.invoice?.invoiceNumber ?? 'New';
// //         const action = payload.status === 'draft' ? 'saved as draft' : 'issued';
// //         this.messageService.showSuccess(`Invoice #${num} has been ${action}.`);
// //         this.router.navigate(['/invoices']);
// //       },
// //       error: err => this.messageService.handleHttpError(err),
// //     });
// //   }

// //   // ── Payload builder ──────────────────────────────────────────────────────
// //   private buildPayload(): any {
// //     const fv = this.invoiceForm.getRawValue();
// //     return {
// //       ...fv,
// //       subTotal: this.subTotal(),
// //       totalDiscount: this.totalDiscount(),
// //       totalTax: this.totalTax(),
// //       grandTotal: this.grandTotal(),
// //       balanceAmount: this.balanceAmount(),
// //       items: fv.items.map((i: any) => ({
// //         productId: i.productId,
// //         quantity: i.quantity,
// //         price: i.price,
// //         discount: i.discount,
// //         taxRate: i.taxRate,
// //         unit: i.unit,
// //       })),
// //     };
// //   }

// //   // ═══════════════════════════════════════════════════════════════════════
// //   // Utilities
// //   // ═══════════════════════════════════════════════════════════════════════

// //   generateInvoiceNumber(): void {
// //     if (this.editMode()) return;
// //     const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
// //     const r = Math.floor(1000 + Math.random() * 9000);
// //     this.invoiceForm.patchValue({ invoiceNumber: `INV-${d}-${r}` });
// //   }

// //   getInitials(name: string): string {
// //     return name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '??';
// //   }

// //   formatAddress(addr: any): string {
// //     if (!addr) return '';
// //     return [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ');
// //   }

// //   // ── Load for edit mode ───────────────────────────────────────────────────
// //   private loadInvoice(id: string): void {
// //     this.invoiceService.getInvoiceWithStock(id).subscribe({
// //       next: (res: any) => {
// //         const data = res.data?.invoice ?? res.data;
// //         if (data) this.patchForm(data);
// //         this.isLoading.set(false);
// //       },
// //       error: err => {
// //         this.messageService.handleHttpError(err);
// //         this.router.navigate(['/invoices']);
// //       }
// //     });
// //   }

// //   private patchForm(data: any): void {
// //     this.invoiceForm.patchValue({
// //       customerId: data.customerId?._id ?? data.customerId,
// //       branchId: data.branchId?._id ?? data.branchId,
// //       invoiceNumber: data.invoiceNumber,
// //       invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
// //       dueDate: data.dueDate ? new Date(data.dueDate) : null,
// //       status: data.status,
// //       billingAddress: data.billingAddress,
// //       shippingAddress: data.shippingAddress,
// //       placeOfSupply: data.placeOfSupply,
// //       roundOff: data.roundOff ?? 0,
// //       paidAmount: data.paidAmount ?? 0,
// //       paymentMethod: data.paymentMethod,
// //       gstType: data.gstType,
// //       notes: data.notes,
// //     });

// //     this.items.clear();
// //     (data.items ?? []).forEach((item: any) =>
// //       this.items.push(this.createItem({
// //         productId: item.productId?._id ?? item.productId,
// //         name: item.name,
// //         sku: item.hsnCode ?? item.sku,
// //         quantity: item.quantity,
// //         unit: item.unit,
// //         price: item.price,
// //         discount: item.discount,
// //         taxRate: item.taxRate,
// //         currentStock: item.currentStock ?? null,
// //         isLowStock: item.willBeLow ?? false,
// //       }))
// //     );
// //   }
// // }

// // // ═══════════════════════════════════════════════════════════════════════════
// // // Types
// // // ═══════════════════════════════════════════════════════════════════════════

// // interface InvoiceItem {
// //   productId: string | null;
// //   name: string;
// //   sku: string;
// //   quantity: number;
// //   unit: string;
// //   price: number;
// //   discount: number;
// //   taxRate: number;
// //   currentStock: number | null;
// //   isLowStock: boolean;
// // }

// // interface StockWarning {
// //   productId: string;
// //   productName: string;
// //   availableAfterSale: number;
// //   reorderLevel: number;
// //   message: string;
// // }

// // interface StockCheckResponseData {
// //   isValid: boolean;
// //   errors: string[];
// //   warnings: StockWarning[];
// //   summary: { totalStock: number; totalRequested: number };
// //   items: {
// //     productId: string;
// //     name: string;
// //     sku: string;
// //     requestedQuantity: number;
// //     availableStock: number;
// //     price: number;
// //     isAvailable: boolean;
// //   }[];
// // }

// // interface StockCheckResponse {
// //   status: string;
// //   data: StockCheckResponseData;
// // }
