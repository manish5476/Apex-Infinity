import { Component, OnInit, inject, signal, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from "rxjs";

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';

// Services
import { InvoiceService } from '../../services/invoice-service';
import { EmiService } from '../../../emi/services/emi-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    ButtonModule, ConfirmDialogModule, TooltipModule,
    ToastModule, SkeletonModule, DialogModule,
    InputNumberModule, InputTextModule, SelectModule, TextareaModule,
    CheckboxModule, HasPermissionDirective
  ],
  providers: [ConfirmationService],
  template: `
    <p-toast position="bottom-right"></p-toast>
    <p-confirmDialog [style]="{width: '450px'}" appendTo="body" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}"></p-confirmDialog>

    <div class="page-layout">
      
      @if (isLoading()) {
        <div class="details-wrapper elevation-card loading-wrapper">
          <div class="header-skeleton">
            <p-skeleton width="200px" height="40px" borderRadius="12px"></p-skeleton>
            <div class="flex gap-sm">
              <p-skeleton width="120px" height="40px" borderRadius="8px"></p-skeleton>
              <p-skeleton width="120px" height="40px" borderRadius="8px"></p-skeleton>
            </div>
          </div>
          <div class="details-grid mt-2xl">
            <div class="left-col space-y-xl">
              <p-skeleton height="180px" borderRadius="16px"></p-skeleton>
              <p-skeleton height="400px" borderRadius="16px"></p-skeleton>
            </div>
            <div class="right-col">
              <p-skeleton height="500px" borderRadius="16px"></p-skeleton>
            </div>
          </div>
        </div>
      }

      @else if (invoice(); as inv) {
        <div class="details-wrapper elevation-card custom-scrollbar">
          
          <header class="details-header">
            <div class="header-left">
              <button pButton icon="pi pi-arrow-left" class="p-button-text p-button-rounded theme-btn-secondary back-btn" routerLink="/invoices"></button>
              <div class="title-group">
                <div class="title-row">
                  <h1>Invoice #{{ inv.invoiceNumber }}</h1>
                  <span class="grid-badge" [ngClass]="getBadgeClass(inv.status)">{{ inv.status }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-item"><i class="pi pi-calendar"></i> Issued: <span class="font-bold">{{ inv.invoiceDate | date:'mediumDate' }}</span></span>
                  <span class="divider"></span>
                  <span class="meta-item"><i class="pi pi-clock"></i> Due: <span class="font-bold">{{ inv.dueDate | date:'mediumDate' }}</span></span>
                </div>
              </div>
            </div>

            <div class="header-actions">
              @if (inv.status !== 'cancelled' && inv.balanceAmount > 0) {
                <button *hasPermission="PERMISSIONS.PAYMENT.CREATE" class="action-btn primary-glow" (click)="openPaymentModal()">
                  <i class="pi pi-wallet"></i> Record Payment
                </button>
              }

              <div class="icon-actions">
                <button *hasPermission="PERMISSIONS.INVOICE.DOWNLOAD" class="icon-btn theme-btn-secondary" pTooltip="Download PDF" tooltipPosition="bottom" (click)="onDownload()">
                  <i class="pi pi-download"></i>
                </button>
                <button class="icon-btn theme-btn-secondary" pTooltip="Email Invoice" tooltipPosition="bottom" (click)="onEmail()">
                  <i class="pi pi-envelope"></i>
                </button>
                <button *hasPermission="PERMISSIONS.SALES_RETURN.MANAGE || PERMISSIONS.INVOICE.UPDATE" class="icon-btn theme-btn-secondary" pTooltip="Return Items" tooltipPosition="bottom" (click)='onReturn()'>
                  <i class="pi pi-replay"></i>
                </button>

                @if (inv.status !== 'cancelled') {
                  <div class="vertical-sep"></div>
                  <button *hasPermission="PERMISSIONS.INVOICE.DELETE" class="icon-btn danger-btn" pTooltip="Cancel Invoice" tooltipPosition="bottom" (click)="openCancelModal()">
                    <i class="pi pi-ban"></i>
                  </button>
                }
              </div>
            </div>
          </header>

          <div class="details-grid">
            
            <div class="left-col">
              
              <div class="content-card elevation-card participants-card">
                <div class="party-block">
                  <div class="block-label">From</div>
                  <div class="party-info">
                    <div class="party-icon"><i class="pi pi-building"></i></div>
                    <div class="party-details">
                      <h3>{{ inv.branchId?.name || 'Head Office' }}</h3>
                      <p>{{ inv.branchId?.address?.street || 'No street provided' }}</p>
                      <p>{{ inv.branchId?.address?.city || 'City' }}, {{ inv.branchId?.address?.state || 'State' }} {{ inv.branchId?.address?.zipCode }}</p>
                    </div>
                  </div>
                </div>

                <div class="connector-line"></div>

                <div class="party-block">
                  <div class="block-label">Bill To</div>
                  <div class="party-info">
                    <div class="party-icon to-icon"><i class="pi pi-user"></i></div>
                    <div class="party-details">
                      <h3>{{ inv.customerId?.name || 'Unknown Customer' }}</h3>
                      <div class="contact-row">
                        <span><i class="pi pi-envelope"></i> {{ inv.customerId?.email || 'N/A' }}</span>
                        <span><i class="pi pi-phone"></i> {{ inv.customerId?.phone || 'N/A' }}</span>
                      </div>
                      <p class="address-text">{{ inv.billingAddress || 'No billing address provided' }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="content-card elevation-card items-card">
                <div class="card-header">
                  <h3>Items & Services</h3>
                  <span class="count-badge">{{ inv.items?.length || 0 }} Entries</span>
                </div>

                <div class="table-responsive-wrapper custom-scrollbar">
                  <table class="theme-table">
                    <thead>
                      <tr>
                        <th width="45%">Description</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Price</th>
                        <th class="text-right">Tax</th>
                        <th class="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of inv.items; track $index) {
                        <tr>
                          <td>
                            <div class="item-title">{{ item.name || item.productId?.name }}</div>
                            @if (item.hsnCode) {
                              <div class="item-sub">HSN: {{ item.hsnCode }}</div>
                            }
                          </td>
                          <td class="text-right font-mono">{{ item.quantity }} {{ item.unit }}</td>
                          <td class="text-right font-mono">{{ item.price | currency:'INR' }}</td>
                          <td class="text-right text-tertiary font-mono">{{ item.taxRate }}%</td>
                          <td class="text-right font-bold text-primary font-mono">
                            {{ (((item.quantity * item.price) - item.discount) * (1 + item.taxRate/100)) | currency:'INR' }}
                          </td>
                        </tr>
                      }
                      @if (!inv.items || inv.items.length === 0) {
                        <tr><td colspan="5" class="text-center text-tertiary p-xl">No items found.</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              @if (payments().length > 0) {
                <div class="content-card elevation-card payments-card">
                  <div class="card-header">
                    <h3>Payment History</h3>
                  </div>
                  <div class="timeline-wrapper">
                    @for (pay of payments(); track pay._id; let last = $last) {
                      <div class="timeline-row" [class.last]="last">
                        <div class="time-col">
                          <span class="t-date">{{ pay.paymentDate | date:'MMM d' }}</span>
                          <span class="t-time">{{ pay.paymentDate | date:'shortTime' }}</span>
                        </div>
                        <div class="marker-col">
                          <div class="dot"></div>
                          @if (!last) { <div class="line"></div> }
                        </div>
                        <div class="data-col">
                          <div class="pay-ticket">
                            <div class="pt-head">
                              <span class="pt-method">{{ pay.paymentMethod | titlecase }}</span>
                              <span class="pt-amount font-mono text-success">+{{ pay.amount | currency:'INR' }}</span>
                            </div>
                            @if (pay.transactionId || pay.referenceNumber) {
                              <div class="pt-ref font-mono">Ref: {{ pay.transactionId || pay.referenceNumber }}</div>
                            }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

            </div>

            <div class="right-col">
              
              <div class="content-card elevation-card sticky-card">
                <div class="fin-header">
                  <span class="fin-label">Payment Status</span>
                  <span class="grid-badge" [ngClass]="getPaymentClass(inv.paymentStatus)">
                    {{ inv.paymentStatus | uppercase }}
                  </span>
                </div>

                <div class="fin-body">
                  <div class="calc-row">
                    <span>Subtotal</span>
                    <span class="val font-mono">{{ inv.subTotal | currency:'INR' }}</span>
                  </div>
                  <div class="calc-row">
                    <span>Tax</span>
                    <span class="val font-mono">{{ inv.totalTax | currency:'INR' }}</span>
                  </div>
                  @if (inv.totalDiscount > 0) {
                    <div class="calc-row text-error">
                      <span>Discount</span>
                      <span class="val font-mono">-{{ inv.totalDiscount | currency:'INR' }}</span>
                    </div>
                  }
                  @if (inv.roundOff) {
                    <div class="calc-row">
                      <span>Round Off</span>
                      <span class="val font-mono">{{ inv.roundOff | currency:'INR' }}</span>
                    </div>
                  }

                  <div class="sep-line"></div>

                  <div class="calc-row grand-total">
                    <span>Grand Total</span>
                    <span class="val font-mono text-primary">{{ inv.grandTotal | currency:'INR' }}</span>
                  </div>

                  <div class="progress-section">
                    <div class="prog-bar">
                      <div class="prog-fill" [style.width.%]="inv.grandTotal > 0 ? (inv.paidAmount / inv.grandTotal) * 100 : 0"></div>
                    </div>
                    <div class="prog-labels">
                      <span class="paid font-mono">Paid: {{ inv.paidAmount | currency:'INR' }}</span>
                      <span class="due font-mono" [class.text-error]="inv.balanceAmount > 0">Due: {{ inv.balanceAmount | currency:'INR' }}</span>
                    </div>
                  </div>
                </div>

                @if (inv.notes) {
                  <div class="fin-footer">
                    <i class="pi pi-info-circle"></i>
                    <p>{{ inv.notes }}</p>
                  </div>
                }
              </div>

              <div class="quick-actions-grid">
                @if (existingEmiId()) {
                  <button class="qa-card" [routerLink]="['/emis', existingEmiId()]">
                    <div class="qa-icon"><i class="pi pi-percentage"></i></div>
                    <span>View EMI Plan</span>
                  </button>
                } @else if (inv.status !== 'cancelled' && inv.paymentStatus !== 'paid') {
                  <button *hasPermission="PERMISSIONS.EMI.CREATE" class="qa-card" [routerLink]="['/emis/create']" [queryParams]="{invoiceId: inv._id}">
                    <div class="qa-icon"><i class="pi pi-calculator"></i></div>
                    <span>Convert to EMI</span>
                  </button>
                }
                
                <button *hasPermission="PERMISSIONS.INVOICE.DOWNLOAD" class="qa-card" (click)="onDownload()">
                  <div class="qa-icon pdf"><i class="pi pi-file-pdf"></i></div>
                  <span>Download PDF</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      }
    </div>

    <p-dialog [modal]="true" appendTo="body" header="Record Payment" [(visible)]="showPaymentModal" [modal]="true"
      [style]="{width: '400px'}" [draggable]="false" [resizable]="false" styleClass="modern-dialog" [blockScroll]="true" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}" [dismissableMask]="true">
      <form [formGroup]="paymentForm" class="dialog-form">
        <div class="form-group">
          <label>Amount Received</label>
          <p-inputNumber formControlName="amount" mode="currency" currency="INR" locale="en-IN" [max]="invoice()?.grandTotal" styleClass="w-full theme-control"></p-inputNumber>
        </div>
        <div class="form-group">
          <label>Payment Mode</label>
          <p-select appendTo="body" formControlName="paymentMethod" [options]="paymentMethods" optionLabel="label"
            optionValue="value" [filter]="true" filterBy="label" styleClass="w-full theme-control"></p-select>
        </div>
        <div class="form-group">
          <label>Reference / Transaction ID</label>
          <input pInputText formControlName="referenceNumber" class="w-full theme-control" placeholder="Optional" />
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea pInputTextarea formControlName="notes" rows="2" class="w-full theme-control"></textarea>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <button pButton label="Cancel" class="p-button-text theme-btn-secondary" (click)="showPaymentModal.set(false)"></button>
          <button pButton label="Confirm" class="p-button-primary" (click)="submitPayment()" [loading]="isProcessing()"></button>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog [modal]="true" appendTo="body" header="Cancel Invoice" [(visible)]="showCancelModal" [modal]="true"
      [style]="{width: '450px'}" [draggable]="false" [resizable]="false" styleClass="modern-dialog" [blockScroll]="true" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}" [dismissableMask]="true">
      <form [formGroup]="cancelForm" class="dialog-form">
        <div class="warning-banner">
          <i class="pi pi-exclamation-triangle"></i>
          <span>This action cannot be undone.</span>
        </div>
        <div class="form-group">
          <label>Cancellation Reason</label>
          <textarea pInputTextarea formControlName="reason" rows="3" class="w-full theme-control" placeholder="Reason is required..."></textarea>
        </div>
        <div class="checkbox-row">
          <p-checkbox formControlName="restock" [binary]="true" inputId="restockCheck"></p-checkbox>
          <label for="restockCheck">Restock items to inventory?</label>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <button pButton label="Keep Invoice" class="p-button-text theme-btn-secondary" (click)="showCancelModal.set(false)"></button>
          <button pButton label="Confirm Cancel" class="p-button-danger" (click)="submitCancel()" [disabled]="cancelForm.invalid" [loading]="isProcessing()"></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    /* ============================================================================
       INVOICE DETAILS - FULL WIDTH & APEX CRM THEME
       ============================================================================ */

    :host {
      display: block;
      width: 100%;
      height: 100%;
      background: var(--bg-secondary);
      font-family: var(--font-body);
      padding: var(--spacing-xl);
      box-sizing: border-box;
    }

    .page-layout {
      height: 100%;
      display: flex;
      justify-content: center;
      overflow: hidden;
    }

    /* MAIN CONTAINER - Full width and bordered */
    .details-wrapper {
      width: 100%;
      max-width: 100%; 
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-md);
      overflow-x: hidden;
      overflow-y: auto;
    }

    /* STRUCTURAL CHROME */
    .elevation-card {
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--elevation-1);
    }

    /* ── HEADER ── */
   /* ── HEADER ── */
    .details-header {
      flex-shrink: 0;
      padding: var(--spacing-xl) var(--spacing-2xl);
      border-bottom: var(--ui-border-width) solid var(--border-primary);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-xl);
      background: var(--bg-secondary);
      position: sticky;
      top: 0;
      z-index: 10; 
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-xl);
    }

    .back-btn {
      margin-top: 4px;
      color: var(--text-secondary);
      width: 2.5rem; height: 2.5rem;
    }

    .title-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      
      h1 {
        font-family: var(--font-heading);
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        margin: 0;
      }
    }

    .meta-row {
      display: flex; align-items: center; gap: var(--spacing-md);
      font-size: var(--font-size-sm); color: var(--text-secondary);
      .divider { width: 4px; height: 4px; border-radius: 50%; background: var(--text-tertiary); }
      .font-bold { color: var(--text-primary); }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
    }

    .action-btn {
      display: flex; align-items: center; gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-xl);
      background: var(--accent-primary);
      color: var(--bg-primary);
      border: none; border-radius: var(--ui-border-radius-pill);
      font-size: var(--font-size-sm); font-weight: var(--font-weight-bold);
      cursor: pointer; transition: var(--transition-base);
      
      &.primary-glow { box-shadow: 0 4px 14px color-mix(in srgb, var(--accent-primary) 30%, transparent); }
      &:hover { transform: translateY(-1px); background: var(--accent-hover); }
    }

    .icon-actions {
      display: flex; align-items: center; gap: var(--spacing-sm);
      background: var(--bg-primary);
      padding: var(--spacing-xs);
      border-radius: var(--ui-border-radius-pill);
      border: var(--ui-border-width) solid var(--border-secondary);
    }

    .icon-btn {
      width: 36px; height: 36px; border-radius: 50%;
      border: none; background: transparent; color: var(--text-secondary);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: var(--transition-fast);
      
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
      &.danger-btn:hover { background: var(--color-error-bg); color: var(--color-error); }
    }

    .vertical-sep {
      width: 1px; height: 20px; background: var(--border-secondary); margin: 0 var(--spacing-xs);
    }

    /* ── MAIN GRID ── */
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: var(--spacing-2xl);
      padding: var(--spacing-2xl);
      align-items: start;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .left-col { display: flex; flex-direction: column; gap: var(--spacing-2xl); min-width: 0; }
    .right-col { display: flex; flex-direction: column; gap: var(--spacing-2xl); }

    /* Cards */
    .content-card {
      padding: var(--spacing-xl);
      display: flex; flex-direction: column; gap: var(--spacing-lg);
    }

    .card-header {
      display: flex; justify-content: space-between; align-items: center;
      h3 { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin: 0; color: var(--text-primary); }
    }

    .count-badge {
      background: var(--bg-ternary); color: var(--text-secondary);
      font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
      padding: var(--spacing-xs) var(--spacing-md); border-radius: var(--ui-border-radius-pill);
    }

    /* Participants */
    .participants-card {
      display: flex; flex-direction: row !important; align-items: center; justify-content: space-between;
      padding: var(--spacing-2xl); gap: var(--spacing-xl);
      
      @media (max-width: 640px) { flex-direction: column !important; align-items: flex-start; }
    }

    .party-block {
      flex: 1; display: flex; flex-direction: column; gap: var(--spacing-md);
    }

    .block-label {
      font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-tertiary);
    }

    .party-info {
      display: flex; align-items: flex-start; gap: var(--spacing-lg);
    }

    .party-icon {
      width: 48px; height: 48px; border-radius: var(--ui-border-radius-sm);
      display: flex; align-items: center; justify-content: center; font-size: 20px;
      background: color-mix(in srgb, var(--accent-primary) 10%, transparent); color: var(--accent-primary);
      &.to-icon { background: var(--bg-ternary); color: var(--text-secondary); }
    }

    .party-details {
      display: flex; flex-direction: column; gap: 4px;
      h3 { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); margin: 0; color: var(--text-primary); }
      p { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; line-height: 1.4; }
      .contact-row { display: flex; gap: var(--spacing-md); font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 4px; i { font-size: 10px; } }
    }

    .connector-line {
      width: 1px; height: 60px; background: var(--border-secondary);
      @media (max-width: 640px) { width: 100%; height: 1px; margin: var(--spacing-md) 0; }
    }

    /* Table */
    .table-responsive-wrapper {
      overflow-x: auto;
      width: 100%;
      border-radius: var(--ui-border-radius-sm);
      border: var(--ui-border-width) solid var(--border-secondary);
    }

    .theme-table {
      width: 100%;
      min-width: 600px;
      border-collapse: collapse;
      font-size: var(--font-size-sm);

      th {
        background: var(--bg-ternary); color: var(--text-secondary); font-weight: var(--font-weight-bold); text-transform: uppercase; font-size: var(--font-size-xs);
        padding: var(--spacing-md) var(--spacing-lg); border-bottom: var(--ui-border-width) solid var(--border-primary); text-align: left;
      }

      td { padding: var(--spacing-md) var(--spacing-lg); border-bottom: var(--ui-border-width) solid var(--component-divider); vertical-align: middle; color: var(--text-primary); }
      tr:last-child td { border-bottom: none; }
      tbody tr:hover td { background: var(--bg-hover); }
    }

    .item-title { font-weight: var(--font-weight-bold); color: var(--text-primary); margin-bottom: 2px; }
    .item-sub { font-size: var(--font-size-xs); color: var(--text-tertiary); font-family: var(--font-mono); }

    /* Timeline */
    .timeline-wrapper {
      display: flex; flex-direction: column;
    }
    
    .timeline-row {
      display: flex; gap: var(--spacing-md); min-height: 60px;
      
      .time-col { 
        width: 60px; display: flex; flex-direction: column; align-items: flex-end; padding-top: 2px;
        .t-date { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-primary); }
        .t-time { font-size: var(--font-size-xs); color: var(--text-tertiary); }
      }
      
      .marker-col {
        display: flex; flex-direction: column; align-items: center; width: 20px;
        .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-success); border: 2px solid var(--bg-primary); z-index: 2; margin-top: 4px; }
        .line { width: 2px; flex: 1; background: var(--border-secondary); margin-top: 4px; }
      }
      
      .data-col {
        flex: 1; padding-bottom: var(--spacing-xl);
      }
      
      &.last .data-col { padding-bottom: 0; }
    }

    .pay-ticket {
      background: var(--bg-ternary); padding: var(--spacing-md) var(--spacing-lg); border-radius: var(--ui-border-radius-sm); border: 1px solid var(--border-secondary);
      .pt-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
      .pt-method { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-primary); }
      .pt-amount { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); }
      .pt-ref { font-size: var(--font-size-xs); color: var(--text-tertiary); }
    }

    /* Financial Summary */
    .sticky-card {
      position: sticky; top: calc(80px + var(--spacing-2xl));
    }

    .fin-header {
      display: flex; justify-content: space-between; align-items: center; padding-bottom: var(--spacing-lg); border-bottom: 1px solid var(--border-secondary);
      .fin-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-secondary); }
    }

    .fin-body {
      display: flex; flex-direction: column; gap: var(--spacing-md);
    }

    .calc-row {
      display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-sm); color: var(--text-secondary);
      .val { color: var(--text-primary); font-weight: var(--font-weight-semibold); }
      &.text-error { color: var(--color-error); .val { color: var(--color-error); } }
      &.grand-total { margin-top: var(--spacing-sm); span { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--text-primary); } .val { font-size: var(--font-size-2xl); } }
    }

    .sep-line { height: 1px; background: var(--border-secondary); margin: var(--spacing-xs) 0; }

    .progress-section {
      margin-top: var(--spacing-lg);
      .prog-bar { height: 6px; background: var(--border-primary); border-radius: var(--ui-border-radius-pill); overflow: hidden; margin-bottom: var(--spacing-xs); }
      .prog-fill { height: 100%; background: var(--color-success); border-radius: var(--ui-border-radius-pill); transition: width 0.5s ease; }
      .prog-labels { display: flex; justify-content: space-between; font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--text-tertiary); }
      .due { color: var(--text-secondary); &.text-error { color: var(--color-error); } }
      .paid { color: var(--color-success); }
    }

    .fin-footer {
      margin-top: var(--spacing-lg); padding: var(--spacing-md); background: var(--bg-ternary); border-radius: var(--ui-border-radius-sm);
      display: flex; gap: var(--spacing-sm); font-size: var(--font-size-xs); color: var(--text-secondary); line-height: 1.4;
      i { color: var(--accent-primary); margin-top: 2px; }
      p { margin: 0; }
    }

    /* Quick Actions */
    .quick-actions-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--spacing-md);
    }

    .qa-card {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-sm);
      padding: var(--spacing-xl); background: var(--bg-primary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius-lg);
      cursor: pointer; transition: var(--transition-base); box-shadow: var(--shadow-sm);
      
      &:hover { border-color: var(--accent-primary); transform: translateY(-2px); box-shadow: var(--elevation-2); .qa-icon { background: var(--accent-primary); color: var(--bg-primary); } }
      
      .qa-icon { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-ternary); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; font-size: 18px; transition: var(--transition-base); }
      span { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; }
    }

    /* Badges */
    .grid-badge {
      padding: 3px 10px; border-radius: var(--ui-border-radius-pill); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
      text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; white-space: nowrap;
    }
    .badge-success-soft { background: var(--color-success-bg); color: var(--color-success-dark); border: 1px solid var(--color-success-border); }
    .badge-danger-soft { background: var(--color-error-bg); color: var(--color-error-dark); border: 1px solid var(--color-error-border); }
    .badge-warning-soft { background: var(--color-warning-bg); color: var(--color-warning-dark); border: 1px solid var(--color-warning-border); }
    .badge-info-soft { background: var(--color-info-bg); color: var(--color-info-dark); border: 1px solid var(--color-info-border); }
    .badge-neutral-soft { background: var(--bg-ternary); color: var(--text-secondary); border: 1px solid var(--border-primary); }

    /* Utilities */
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: var(--font-mono); }
    .w-full { width: 100%; }
    .mt-2xl { margin-top: var(--spacing-2xl); }
    .space-y-xl > * + * { margin-top: var(--spacing-xl); }
    .gap-sm { gap: var(--spacing-sm); }

    /* Modals */
    .dialog-form {
      display: flex; flex-direction: column; gap: var(--spacing-lg); padding-top: var(--spacing-md);
    }
    .form-group {
      display: flex; flex-direction: column; gap: var(--spacing-xs);
      label { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    }
    .checkbox-row { display: flex; align-items: center; gap: var(--spacing-sm); margin-top: var(--spacing-xs); label { font-size: var(--font-size-sm); color: var(--text-primary); font-weight: var(--font-weight-medium); cursor: pointer; } }
    .dialog-footer { display: flex; justify-content: flex-end; gap: var(--spacing-md); padding-top: var(--spacing-lg); border-top: 1px solid var(--border-secondary); }
    .warning-banner { display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-md); background: var(--color-error-bg); color: var(--color-error-dark); border-radius: var(--ui-border-radius-sm); border: 1px solid var(--color-error-border); font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); }

    /* Scrollbar */
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: var(--scroll-track); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: var(--ui-border-radius-pill); }
  `]
})
export class InvoiceDetailsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private invoiceService = inject(InvoiceService);
  private emiService = inject(EmiService);
  private messageService = inject(AppMessageService);
  private dialogServices = inject(DynamicDialogServices);
  public common = inject(CommonMethodService);

  PERMISSIONS = PERMISSIONS;

  invoice = signal<any | null>(null);
  payments = signal<any[]>([]);
  isLoading = signal(true);
  isProcessing = signal(false);
  existingEmiId = signal<string | null>(null);

  showPaymentModal = signal(false);
  showCancelModal = signal(false);

  paymentForm: FormGroup;
  cancelForm: FormGroup;

  paymentMethods = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank Transfer', value: 'bank' },
    { label: 'UPI', value: 'upi' },
    { label: 'Credit Card', value: 'card' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Other', value: 'other' }
  ];

  constructor() {
    this.paymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentMethod: ['cash', Validators.required],
      referenceNumber: [''],
      notes: ['']
    });

    this.cancelForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(5)]],
      restock: [true]
    });
  }

  ngOnInit(): void {
    this.loadInvoiceData();
  }

  openCancelModal(): void {
    this.showCancelModal.set(true);
    this.cancelForm.reset({ restock: true });
  }

  openPaymentModal(): void {
    this.showPaymentModal.set(true);
    this.paymentForm.patchValue({ 
      amount: this.invoice().balanceAmount,
      paymentMethod: 'cash',
      notes: ''
    });
  }

  private loadInvoiceData(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const invoiceId = params.get('id');
      if (!invoiceId) {
        this.router.navigate(['/invoices']);
        return;
      }

      this.isLoading.set(true);

      this.common.apiCall(
        this.invoiceService.getInvoiceById(invoiceId),
        (res: any) => {
          const data = res.data?.data || res.data?.invoice || res.data;
          this.invoice.set(data);
          
          this.checkEmiStatus(invoiceId);
          this.loadPaymentHistory(invoiceId);
          
          this.paymentForm.patchValue({ amount: data.balanceAmount });
          this.isLoading.set(false);
        }
      );
    });
  }

  private loadPaymentHistory(id: string): void {
    this.invoiceService.getInvoicePayments(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.payments.set(res.data?.payments || res.data || []);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  private checkEmiStatus(invoiceId: string) {
    this.emiService.getEmiByInvoice(invoiceId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.data?.emi) {
          this.existingEmiId.set(res.data.emi._id);
        }
      },
      error: () => this.existingEmiId.set(null) 
    });
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) {
      this.messageService.showWarn('Invalid Form: Please check your payment details.');
      return;
    }

    this.isProcessing.set(true);
    const payload = this.paymentForm.value;
    const id = this.invoice()._id;

    this.common.apiCall(
      this.invoiceService.addPayment(id, payload).pipe(
        finalize(() => this.isProcessing.set(false))
      ),
      () => {
        this.messageService.showSuccess('Payment balance updated successfully.');
        this.showPaymentModal.set(false);
        this.loadInvoiceData(); 
      }
    );
  }

  submitCancel(): void {
    if (this.cancelForm.invalid) {
      this.messageService.showWarn('Invalid Form: Please provide a cancellation reason.');
      return;
    }

    this.isProcessing.set(true);
    const { reason, restock } = this.cancelForm.value;
    const id = this.invoice()._id;

    this.common.apiCall(
      this.invoiceService.cancelInvoice(id, reason, restock).pipe(
        finalize(() => this.isProcessing.set(false))
      ),
      () => {
        this.messageService.showSuccess('Invoice cancelled and stock restored.');
        this.showCancelModal.set(false);
        this.loadInvoiceData();
      }
    );
  }

  onDownload(): void {
    const id = this.invoice()?._id;
    if (!id) return;
    this.isProcessing.set(true);
    this.invoiceService.downloadInvoicePDF(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        this.common.downloadBlob(blob, `INV-${this.invoice().invoiceNumber}.pdf`);
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
        this.isProcessing.set(false);
      }
    });
  }

  onEmail(): void {
    const id = this.invoice()?._id;
    if (!id) return;
    this.isProcessing.set(true);
    this.common.apiCall(
      this.invoiceService.emailInvoice(id).pipe(
        finalize(() => this.isProcessing.set(false))
      ),
      () => {
        this.messageService.showSuccess('Invoice emailed to customer successfully.');
      }
    );
  }

  onReturn(): void {
    const inv = this.invoice();
    if (!inv) return;
    
    this.dialogServices.openSalesReturn({ invoice: inv })?.onClose.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res) {
        this.loadInvoiceData();
      }
    });
  }

  getBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'active':
        return 'badge-success-soft';
      case 'unpaid':
      case 'overdue':
        return 'badge-danger-soft';
      case 'partial':
      case 'pending':
        return 'badge-warning-soft';
      case 'issued':
        return 'badge-info-soft';
      case 'draft':
      case 'cancelled':
      default:
        return 'badge-neutral-soft';
    }
  }

  getPaymentClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid': return 'badge-success-soft';
      case 'partial': return 'badge-warning-soft';
      case 'unpaid': return 'badge-danger-soft';
      default: return 'badge-info-soft';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
// import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { finalize, takeUntil } from 'rxjs/operators'; // Import finalize

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ConfirmationService } from 'primeng/api';
// import { TooltipModule } from 'primeng/tooltip';
// import { TableModule } from 'primeng/table';
// import { ToastModule } from 'primeng/toast';
// import { SkeletonModule } from 'primeng/skeleton';
// import { DialogModule } from 'primeng/dialog';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { InputTextModule } from 'primeng/inputtext';
// import { SelectModule } from 'primeng/select';
// import { TextareaModule } from 'primeng/textarea';
// import { CheckboxModule } from 'primeng/checkbox';

// // Services
// import { InvoiceService } from '../../services/invoice-service';
// import { EmiService } from '../../../emi/services/emi-service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';

// import { CommonMethodService } from '../../../../core/utils/common-method.service';
// import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
// import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
// import { Subject } from "rxjs";

// @Component({
//   selector: 'app-invoice-details',
//   standalone: true,
//   imports: [
//     CommonModule, RouterModule, ReactiveFormsModule,
//     ButtonModule, TagModule, ConfirmDialogModule, TooltipModule,
//     TableModule, ToastModule, SkeletonModule, DialogModule,
//     InputNumberModule, InputTextModule, SelectModule, TextareaModule,
//     CheckboxModule, HasPermissionDirective
//   ],
//   providers: [ConfirmationService],
//   templateUrl: './invoice-details.html',
//   styleUrls: ['./invoice-details.scss'],
// })
// export class InvoiceDetailsComponent implements OnInit, OnDestroy {
//     private readonly destroy$ = new Subject<void>();
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private fb = inject(FormBuilder);
//   private invoiceService = inject(InvoiceService);
//   private emiService = inject(EmiService);
//   private confirmService = inject(ConfirmationService);
//   private messageService = inject(AppMessageService);
//   private dialogServices = inject(DynamicDialogServices);
//   public common = inject(CommonMethodService);


//   PERMISSIONS = PERMISSIONS;

//   // === Signals ===
//   invoice = signal<any | null>(null);
//   payments = signal<any[]>([]);
//   isLoading = signal(true);
//   isProcessing = signal(false);
//   existingEmiId = signal<string | null>(null);

//   // === Modals ===
//   showPaymentModal = signal(false);
//   showCancelModal = signal(false);

//   // === Forms ===
//   paymentForm: FormGroup;
//   cancelForm: FormGroup;

//   // === Constants ===
//   paymentMethods = [
//     { label: 'Cash', value: 'cash' },
//     { label: 'Bank Transfer', value: 'bank' },
//     { label: 'UPI', value: 'upi' },
//     { label: 'Credit Card', value: 'card' },
//     { label: 'Cheque', value: 'cheque' },
//     { label: 'Other', value: 'other' }
//   ];

//   constructor() {
//     this.paymentForm = this.fb.group({
//       amount: [0, [Validators.required, Validators.min(1)]],
//       paymentMethod: ['cash', Validators.required],
//       referenceNumber: [''],
//       notes: ['']
//     });

//     this.cancelForm = this.fb.group({
//       reason: ['', [Validators.required, Validators.minLength(5)]],
//       restock: [true]
//     });
//   }

//   ngOnInit(): void {
//     this.loadInvoiceData();
//   }

//    // === Actions: Cancel ===
//   openCancelModal(): void {
//     this.showCancelModal.set(true);
//     this.cancelForm.reset({ restock: true });
//   }

//   // === Actions: Payment ===
//   openPaymentModal(): void {
//     this.showPaymentModal.set(true);
//     this.paymentForm.patchValue({ 
//       amount: this.invoice().balanceAmount,
//       paymentMethod: 'cash',
//       notes: ''
//     });
//   }

// private loadInvoiceData(): void {
//     this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
//       const invoiceId = params.get('id');
//       if (!invoiceId) {
//         this.router.navigate(['/invoices']);
//         return;
//       }

//       this.isLoading.set(true);

//       // 1. Get Invoice Details
//       this.common.apiCall(
//         this.invoiceService.getInvoiceById(invoiceId),
//         (res: any) => {
//           // Robust data extraction
//           const data = res.data?.data || res.data?.invoice || res.data;
//           this.invoice.set(data);
          
//           // Setup dependent data
//           this.checkEmiStatus(invoiceId);
//           this.loadPaymentHistory(invoiceId);
          
//           // Pre-fill payment form with balance
//           this.paymentForm.patchValue({ amount: data.balanceAmount });
          
//           this.isLoading.set(false);
//         }
//         // Removed the redundant 'Fetch Invoice' context string here
//       );
//     });
//   }

//   private loadPaymentHistory(id: string): void {
//     this.invoiceService.getInvoicePayments(id).pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res: any) => {
//         this.payments.set(res.data?.payments || res.data || []);
//       },
//       error: (err) => {
//         // Caught the silent failure so the user knows if payment history fails to load!
//         this.messageService.handleHttpError(err);
//       }
//     });
//   }

//   private checkEmiStatus(invoiceId: string) {
//     this.emiService.getEmiByInvoice(invoiceId).pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res: any) => {
//         if (res.data?.emi) {
//           this.existingEmiId.set(res.data.emi._id);
//         }
//       },
//       // Left this silent error alone, assuming a 404 (No EMI found) is expected behavior here!
//       error: () => this.existingEmiId.set(null) 
//     });
//   }

//   submitPayment(): void {
//     if (this.paymentForm.invalid) {
//       // Added user feedback for invalid forms
//       this.messageService.showWarn('Invalid Form: Please check your payment details.');
//       return;
//     }

//     this.isProcessing.set(true);
//     const payload = this.paymentForm.value;
//     const id = this.invoice()._id;

//     this.common.apiCall(
//       this.invoiceService.addPayment(id, payload).pipe(
//         finalize(() => this.isProcessing.set(false))
//       ),
//       () => {
//         // Simplified to a single string
//         this.messageService.showSuccess('Payment balance updated successfully.');
//         this.showPaymentModal.set(false);
        
//         // Refresh data to reflect new status
//         this.loadInvoiceData(); 
//       }
//       // Removed the redundant 'Add Payment' string
//     );
//   }

//   submitCancel(): void {
//     if (this.cancelForm.invalid) {
//       // Added user feedback for invalid forms
//       this.messageService.showWarn('Invalid Form: Please provide a cancellation reason.');
//       return;
//     }

//     this.isProcessing.set(true);
//     const { reason, restock } = this.cancelForm.value;
//     const id = this.invoice()._id;

//     this.common.apiCall(
//       this.invoiceService.cancelInvoice(id, reason, restock).pipe(
//         finalize(() => this.isProcessing.set(false))
//       ),
//       () => {
//         // Simplified to a single string
//         this.messageService.showSuccess('Invoice cancelled and stock restored.');
//         this.showCancelModal.set(false);
//         this.loadInvoiceData();
//       }
//       // Removed the redundant 'Cancel Invoice' string
//     );
//   }

//   // === Actions: Standard ===
//   onDownload(): void {
//     const id = this.invoice()?._id;
//     if (!id) return;
//     this.isProcessing.set(true);
//     this.invoiceService.downloadInvoicePDF(id).pipe(takeUntil(this.destroy$)).subscribe({
//       next: (blob) => {
//         this.common.downloadBlob(blob, `INV-${this.invoice().invoiceNumber}.pdf`);
//         this.isProcessing.set(false);
//       },
//       error: (err) => {
//         // Replaced manual error extraction with your global HTTP handler
//         this.messageService.handleHttpError(err);
//         this.isProcessing.set(false);
//       }
//     });
//   }

//   onEmail(): void {
//     const id = this.invoice()?._id;
//     if (!id) return;
//     this.isProcessing.set(true);
//     this.common.apiCall(
//       this.invoiceService.emailInvoice(id).pipe(
//         finalize(() => this.isProcessing.set(false))
//       ),
//       () => {
//         // Simplified to a single string
//         this.messageService.showSuccess('Invoice emailed to customer successfully.');
//       }
//       // Removed the redundant 'Email Invoice' string
//     );
//   }

//   onReturn(): void {
//     const inv = this.invoice();
//     if (!inv) return;
    
//     this.dialogServices.openSalesReturn({ invoice: inv })?.onClose.pipe(takeUntil(this.destroy$)).subscribe(res => {
//       if (res) {
//         // Refresh data if return was successful
//         this.loadInvoiceData();
//       }
//     });
//   }

//   // Helper for Status Severity

//   getPaymentSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
//     switch (status?.toLowerCase()) {
//       case 'paid': return 'success';
//       case 'partial': return 'warn';
//       case 'unpaid': return 'danger';
//       default: return 'info';
//     }
//   }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//     }
// }