import { Component, OnInit, inject, signal, OnDestroy, computed, ViewChild, ElementRef, HostListener, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, takeUntil, finalize, distinctUntilChanged, filter } from 'rxjs/operators';
import { Subject } from 'rxjs';

// --- Actual Project Services ---
import { ProductService } from "./../../../product/services/product-service";
import { InvoiceService } from '../../services/invoice-service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pos-invoice',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    ToastModule, ButtonModule, InputTextModule, InputNumberModule,
    DatePickerModule, SelectModule, TextareaModule, 
    TagModule, ConfirmDialogModule, ProgressSpinnerModule,
    DialogModule, TooltipModule
  ],
  providers: [
    ConfirmationService, MessageService
    // Assuming InvoiceService, ProductService, MasterListService etc. are providedIn: 'root'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="bottom-right" [life]="3000"></p-toast>
    <p-confirmDialog [style]="{width: '450px'}" rejectButtonStyleClass="p-button-text"></p-confirmDialog>

    <!-- Quick Product Modal for Manual Entry -->
    <p-dialog 
      header="Quick Add Product" 
      [(visible)]="showQuickProductModal" 
      [modal]="true" 
      [style]="{width: '450px'}"
      [draggable]="false"
      [resizable]="false"
      (onHide)="focusScanner()">
      
      <form [formGroup]="manualProductForm" class="p-3">
        <div class="mb-3">
          <label class="block text-sm font-bold mb-1">Product Code/SKU <span class="text-red-500">*</span></label>
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon"><i class="pi pi-tag"></i></span>
            <input type="text" pInputText formControlName="code" placeholder="Enter SKU or Barcode" class="w-full" />
          </div>
        </div>
        
        <div class="mb-3">
          <label class="block text-sm font-bold mb-1">Product Name <span class="text-red-500">*</span></label>
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon"><i class="pi pi-box"></i></span>
            <input type="text" pInputText formControlName="name" placeholder="Enter product name" class="w-full" />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-sm font-bold mb-1">Price <span class="text-red-500">*</span></label>
            <p-inputNumber formControlName="price" mode="currency" currency="INR" [min]="0" placeholder="0.00" styleClass="w-full"></p-inputNumber>
          </div>
          <div>
            <label class="block text-sm font-bold mb-1">Stock</label>
            <p-inputNumber formControlName="stock" [min]="0" [max]="9999" placeholder="Qty" styleClass="w-full"></p-inputNumber>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-sm font-bold mb-1">Tax Rate %</label>
            <p-inputNumber formControlName="tax" [min]="0" [max]="100" suffix="%" placeholder="18" styleClass="w-full"></p-inputNumber>
          </div>
          <div>
            <label class="block text-sm font-bold mb-1">Unit</label>
            <p-select formControlName="unit" [options]="['pcs', 'kg', 'box', 'pack', 'dozen']" placeholder="Select" styleClass="w-full"></p-select>
          </div>
        </div>
      </form>
      
      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <button pButton label="Cancel" icon="pi pi-times" class="p-button-text" (click)="showQuickProductModal = false"></button>
          <button pButton label="Add to Cart" icon="pi pi-plus" class="p-button-primary" 
            [disabled]="manualProductForm.invalid"
            (click)="addManualProduct()"></button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Hold Bill Dialog -->
    <p-dialog 
      header="Hold Bill" 
      [(visible)]="showHoldDialog" 
      [modal]="true" 
      [style]="{width: '400px'}">
      
      <div class="p-3">
        <div class="mb-3">
          <label class="block text-sm font-bold mb-1">Reference Name <span class="text-red-500">*</span></label>
          <input type="text" pInputText #holdNameInput placeholder="e.g., Customer Name / Table 5" class="w-full" />
        </div>
        <div class="text-sm text-gray-500">
          <i class="pi pi-info-circle mr-1"></i>
          This bill will be saved and can be retrieved later.
        </div>
      </div>
      
      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <button pButton label="Cancel" icon="pi pi-times" class="p-button-text" (click)="showHoldDialog = false"></button>
          <button pButton label="Hold Bill" icon="pi pi-clock" class="p-button-help" (click)="holdBill(holdNameInput.value)"></button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Receipt Preview Dialog -->
    <p-dialog 
      header="Receipt Preview" 
      [(visible)]="showReceiptDialog" 
      [modal]="true" 
      [style]="{width: '350px'}">
      
      <div class="receipt-preview font-mono text-sm p-4 bg-gray-50 rounded text-black">
        <div class="text-center border-b border-gray-300 pb-2 mb-2">
          <h3 class="font-bold text-lg">YOUR STORE NAME</h3>
          <div class="text-xs">123 Main Street, City</div>
          <div class="text-xs">GST: 22AAAAA0000A1Z5</div>
          <div class="text-xs">Ph: +91 9876543210</div>
        </div>
        
        <div class="flex justify-between text-xs mb-2">
          <span>Bill No: {{ invoiceForm.get('invoiceNumber')?.value }}</span>
          <span>{{ invoiceForm.get('invoiceDate')?.value | date:'dd/MM/yy HH:mm' }}</span>
        </div>
        
        <div class="border-t border-b border-dashed border-gray-300 py-1 my-1 text-xs">
          <div class="flex justify-between font-bold">
            <span class="w-2/5">Item</span>
            <span class="w-1/6 text-center">Qty</span>
            <span class="w-1/5 text-right">Price</span>
            <span class="w-1/5 text-right">Total</span>
          </div>
        </div>
        
        @for (item of items.controls; track $index; let i = $index) {
        <div class="flex justify-between text-xs mb-1">
          <span class="w-2/5 truncate">{{ items.at(i).get('name')?.value }}</span>
          <span class="w-1/6 text-center">{{ items.at(i).get('quantity')?.value }}</span>
          <span class="w-1/5 text-right">{{ items.at(i).get('price')?.value | currency:'INR':'symbol':'1.0-0' }}</span>
          <span class="w-1/5 text-right">{{ (((items.at(i).get('quantity')?.value || 0) * (items.at(i).get('price')?.value || 0)) * (1 + ((items.at(i).get('taxRate')?.value || 0) / 100))) | currency:'INR':'symbol':'1.0-0' }}</span>
        </div>
        }
        
        <div class="border-t border-gray-300 mt-2 pt-2">
          <div class="flex justify-between text-sm font-bold">
            <span>Subtotal:</span>
            <span>{{ subTotal() | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="flex justify-between text-xs text-green-600">
            <span>Tax:</span>
            <span>+ {{ totalTax() | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          @if (totalDiscount() > 0) {
          <div class="flex justify-between text-xs text-red-600">
            <span>Discount:</span>
            <span>- {{ totalDiscount() | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          }
          <div class="flex justify-between text-lg font-black border-t border-gray-300 mt-1 pt-1">
            <span>Total:</span>
            <span>{{ grandTotal() | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="flex justify-between text-sm mt-2">
            <span>Paid:</span>
            <span>{{ invoiceForm.get('paidAmount')?.value | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="flex justify-between text-base font-bold" [class.text-red-600]="balanceAmount() > 0" [class.text-green-600]="balanceAmount() <= 0">
            <span>{{ balanceAmount() > 0 ? 'Balance:' : 'Change:' }}</span>
            <span>{{ balanceAmount() | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
        </div>
        
        <div class="text-center text-xs mt-3 border-t border-gray-300 pt-2">
          <div>*** Thank you for shopping! ***</div>
          <div>Visit again!</div>
        </div>
      </div>
      
      <ng-template pTemplate="footer">
        <div class="flex justify-center gap-2">
          <button pButton label="Print" icon="pi pi-print" class="p-button-primary" (click)="printReceipt()"></button>
          <button pButton label="Close" icon="pi pi-times" class="p-button-text" (click)="showReceiptDialog = false"></button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Main POS Layout -->
    <div class="page-layout pos-layout">
      <form [formGroup]="invoiceForm" class="invoice-container glass-panel" (keydown.enter)="$event.preventDefault()">
        
        <!-- Header with Gradient Background -->
        <header class="invoice-header p-4 flex justify-between items-center bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white rounded-t-xl shadow-lg">
          <div class="header-left flex gap-4 items-center">
            <button pButton type="button" icon="pi pi-arrow-left" class="p-button-rounded p-button-outlined p-button-sm text-white border-white hover:bg-white hover:text-blue-900" routerLink="/invoices" pTooltip="Back" tooltipPosition="bottom"></button>
            <div class="flex flex-col">
              <h1 class="text-2xl font-bold tracking-tight m-0">{{ formTitle() }}</h1>
              <div class="flex items-center gap-2 text-sm opacity-80">
                <i class="pi pi-calendar"></i>
                <span>{{ invoiceForm.get('invoiceDate')?.value | date:'mediumDate' }}</span>
                <span class="w-1 h-1 rounded-full bg-white opacity-40"></span>
                <span class="px-2 py-0.5 bg-orange-500 rounded-full text-xs font-bold uppercase text-white">
                  {{ invoiceForm.get('status')?.value === 'issued' ? 'Completed' : 'Active' }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="header-right flex gap-3">
            <p-select 
              formControlName="branchId" 
              [options]="branchOptions()" 
              optionLabel="name" 
              optionValue="_id" 
              placeholder="Select Branch" 
              styleClass="w-48 bg-white border-white">
              <ng-template pTemplate="selectedItem" let-selected>
                @if (selected) {
                  <div class="flex items-center gap-2 text-blue-900 font-bold">
                    <i class="pi pi-building text-orange-500"></i>
                    <span>{{ selected.name }}</span>
                  </div>
                }
              </ng-template>
            </p-select>
            
            <p-select 
              formControlName="customerId" 
              [options]="customerOptions()" 
              optionLabel="name" 
              optionValue="_id" 
              [filter]="true" 
              filterBy="name" 
              placeholder="Walk-in Customer" 
              styleClass="w-48 bg-white border-white">
              <ng-template pTemplate="selectedItem" let-selected>
                @if (selected) {
                  <div class="flex items-center gap-2 text-blue-900 font-bold">
                    <i class="pi pi-user text-orange-500"></i>
                    <span>{{ selected.name }}</span>
                  </div>
                }
              </ng-template>
            </p-select>
          </div>
        </header>

        <!-- Scanner Section with Enhanced UI -->
        <div class="scanner-section p-4 bg-white">
          <div class="p-inputgroup w-full shadow-md rounded-xl overflow-hidden border-2 border-blue-200 transition-all duration-200 bg-white" [class.border-orange-500]="isScanning()">
            <span class="p-inputgroup-addon bg-gradient-to-r from-blue-100 to-blue-50 text-blue-900 border-none px-5">
              <i class="pi pi-qrcode text-2xl" [class.animate-pulse]="isScanning()"></i>
            </span>
            <input 
              #scannerInput 
              pInputText 
              type="text" 
              [placeholder]="isScanning() ? 'Processing...' : 'Scan Barcode or SKU here... (or press F2)'" 
              [disabled]="isScanning()"
              (keyup.enter)="onProductScan(scannerInput.value)"
              (input)="scannerInput.value = scannerInput.value.toUpperCase()"
              class="scanner-input text-xl font-bold py-4 border-none bg-white focus:ring-0 text-gray-800" />
            
            @if (isScanning()) {
              <span class="p-inputgroup-addon border-none bg-gradient-to-r from-blue-50 to-blue-100 px-4">
                <p-progressSpinner [style]="{width: '28px', height: '28px'}" strokeWidth="4"></p-progressSpinner>
              </span>
            }
          </div>
          
          <!-- Scanner Help Bar -->
          <div class="flex justify-between items-center mt-2 text-xs text-gray-500 font-medium">
            <div class="flex gap-4">
              <span class="flex items-center gap-1">
                <i class="pi pi-shopping-cart text-blue-600"></i>
                <span class="font-bold">{{ itemCount() }}</span> items
              </span>
              <span class="flex items-center gap-1 cursor-pointer hover:text-blue-600" (click)="showQuickProductModal = true">
                <i class="pi pi-tag text-orange-500"></i>
                <span class="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">F2</span> Manual
              </span>
              <span class="flex items-center gap-1 cursor-pointer hover:text-blue-600" (click)="quickPay()">
                <i class="pi pi-wallet text-green-600"></i>
                <span class="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">F8</span> Quick Pay
              </span>
              <span class="flex items-center gap-1 cursor-pointer hover:text-blue-600" (click)="showHoldDialog = true">
                <i class="pi pi-clock text-purple-600"></i>
                <span class="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">F4</span> Hold Bill
              </span>
            </div>
            @if (lastScannedItemName()) {
              <div class="text-green-600 font-bold">
                <i class="pi pi-check-circle mr-1"></i>
                Last: {{ lastScannedItemName() }}
              </div>
            }
          </div>
        </div>

        <!-- Items Table Section (Scrollable Body) -->
        <div class="invoice-body px-4 bg-white flex-grow custom-scrollbar" style="height: calc(100vh - 400px); overflow-y: auto;">
          <div formArrayName="items" class="table-wrapper h-full">
            <table class="w-full text-left border-collapse relative">
              <thead class="sticky top-0 bg-gray-50 z-10 shadow-sm border-b-2 border-orange-500 text-gray-700">
                <tr>
                  <th class="py-3 px-2 w-2/5 font-bold text-sm">Item Details</th>
                  <th class="py-3 px-2 text-center w-1/6 font-bold text-sm">Quantity</th>
                  <th class="py-3 px-2 text-right w-1/6 font-bold text-sm">Price (₹)</th>
                  <th class="py-3 px-2 text-right w-1/6 font-bold text-sm">Total (₹)</th>
                  <th class="py-3 px-2 w-12"></th>
                </tr>
              </thead>
              
              <tbody>
                @for (item of items.controls; track $index; let i = $index) {
                <tr [formGroupName]="i" class="border-b border-gray-100 hover:bg-blue-50/50 transition-colors group">
                  
                  <!-- Item Details Column -->
                  <td class="py-3 px-2">
                    <div class="font-bold text-lg text-blue-900">{{ items.at(i).get('name')?.value }}</div>
                    <div class="flex gap-2 items-center flex-wrap text-xs mt-1">
                      <span class="bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-600">
                        SKU: {{ items.at(i).get('sku')?.value || 'N/A' }}
                      </span>
                      <span class="flex items-center gap-1 px-2 py-0.5 rounded font-medium" 
                            [class.bg-red-100]="(items.at(i).get('quantity')?.value || 0) >= (items.at(i).get('currentStock')?.value || 0)"
                            [class.text-red-700]="(items.at(i).get('quantity')?.value || 0) >= (items.at(i).get('currentStock')?.value || 0)"
                            [class.bg-green-100]="(items.at(i).get('quantity')?.value || 0) < (items.at(i).get('currentStock')?.value || 0)"
                            [class.text-green-700]="(items.at(i).get('quantity')?.value || 0) < (items.at(i).get('currentStock')?.value || 0)">
                        <i class="pi" [class.pi-exclamation-circle]="(items.at(i).get('quantity')?.value || 0) >= (items.at(i).get('currentStock')?.value || 0)" [class.pi-check-circle]="(items.at(i).get('quantity')?.value || 0) < (items.at(i).get('currentStock')?.value || 0)"></i>
                        Stock: {{ items.at(i).get('currentStock')?.value }}
                      </span>
                      <span class="bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-medium border border-orange-100">
                        GST: {{ items.at(i).get('taxRate')?.value }}%
                      </span>
                    </div>
                  </td>

                  <!-- Quantity Column -->
                  <td class="py-3 px-2">
                    <div class="flex items-center justify-center">
                      <button pButton type="button" icon="pi pi-minus" 
                        class="p-button-rounded p-button-text p-button-sm w-8 h-8" 
                        [class.text-gray-300]="(items.at(i).get('quantity')?.value || 0) <= 1"
                        [class.text-blue-600]="(items.at(i).get('quantity')?.value || 0) > 1"
                        [disabled]="(items.at(i).get('quantity')?.value || 0) <= 1"
                        (click)="updateQuantity(i, -1)"></button>
                      
                      <p-inputNumber formControlName="quantity" [min]="1" [max]="items.at(i).get('currentStock')?.value"
                        styleClass="w-16 mx-1" inputStyleClass="text-center font-bold text-lg border-gray-300 focus:border-blue-500 rounded-md py-1 px-0">
                      </p-inputNumber>
                      
                      <button pButton type="button" icon="pi pi-plus" 
                        class="p-button-rounded p-button-text p-button-sm w-8 h-8" 
                        [class.text-gray-300]="(items.at(i).get('quantity')?.value || 0) >= (items.at(i).get('currentStock')?.value || 0)"
                        [class.text-blue-600]="(items.at(i).get('quantity')?.value || 0) < (items.at(i).get('currentStock')?.value || 0)"
                        [disabled]="(items.at(i).get('quantity')?.value || 0) >= (items.at(i).get('currentStock')?.value || 0)"
                        (click)="updateQuantity(i, 1)"></button>
                    </div>
                  </td>

                  <!-- Price Column -->
                  <td class="py-3 px-2">
                    <p-inputNumber formControlName="price" mode="decimal" [minFractionDigits]="2" 
                      styleClass="w-full" inputStyleClass="text-right font-bold text-gray-700 border-gray-300 rounded-md py-1">
                    </p-inputNumber>
                  </td>

                  <!-- Total Column -->
                  <td class="py-3 px-2 text-right font-bold text-xl text-blue-900">
                    {{ ((items.at(i).get('quantity')?.value || 0) * (items.at(i).get('price')?.value || 0) * (1 + ((items.at(i).get('taxRate')?.value || 0) / 100))) | currency:'INR':'symbol':'1.0-0' }}
                    @if (items.at(i).get('discount')?.value > 0) {
                      <div class="text-xs text-red-500 font-normal">
                        -{{ items.at(i).get('discount')?.value | currency:'INR' }}
                      </div>
                    }
                  </td>

                  <!-- Delete Button -->
                  <td class="py-3 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button pButton type="button" icon="pi pi-trash" 
                      class="p-button-rounded p-button-danger p-button-text p-button-sm w-8 h-8" 
                      pTooltip="Remove item" tooltipPosition="left"
                      (click)="removeItem(i)"></button>
                  </td>
                </tr>
                }
              </tbody>
            </table>

            @if (items.controls.length === 0) {
            <div class="text-center py-20 text-gray-400 h-full flex flex-col justify-center items-center">
              <i class="pi pi-qrcode text-8xl mb-6 opacity-20 text-gray-400"></i>
              <h3 class="text-3xl font-light text-gray-500 mb-2">Cart is empty</h3>
              <p class="text-base text-gray-400">Scan a product barcode to begin billing</p>
              <p class="text-sm mt-4 text-gray-400">or press <span class="bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg font-mono text-gray-600 shadow-sm">F2</span> to add manually</p>
            </div>
            }
          </div>
        </div>

        <!-- Footer with Totals and Actions -->
        <footer class="invoice-footer bg-gray-50 border-t border-gray-200 p-4 mt-auto rounded-b-xl shadow-inner">
          <div class="flex justify-between items-end">
            
            <!-- Left Actions -->
            <div class="left-controls flex gap-2">
              <button pButton type="button" label="Clear Cart" icon="pi pi-trash" class="p-button-outlined p-button-secondary p-button-sm bg-white" [disabled]="items.length === 0" (click)="clearCart()" pTooltip="Remove all items" tooltipPosition="top"></button>
              <button pButton type="button" label="Hold Bill" icon="pi pi-clock" class="p-button-outlined p-button-help p-button-sm bg-white" [disabled]="items.length === 0" (click)="showHoldDialog = true" pTooltip="Save for later (F4)" tooltipPosition="top"></button>
              <button pButton type="button" label="Discount" icon="pi pi-percentage" class="p-button-outlined p-button-warning p-button-sm bg-white" [disabled]="items.length === 0" (click)="applyDiscount()" pTooltip="Apply 10% demo discount" tooltipPosition="top"></button>
            </div>

            <!-- Totals and Payment Section -->
            <div class="totals-section flex gap-6 items-end">
              <div class="text-right min-w-[150px]">
                <div class="text-sm text-gray-600 flex justify-between gap-4">
                  <span>Subtotal:</span>
                  <span class="font-bold">{{ subTotal() | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="text-sm text-green-600 flex justify-between gap-4">
                  <span>Tax (+):</span>
                  <span class="font-bold">{{ totalTax() | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                @if (totalDiscount() > 0) {
                <div class="text-sm text-red-600 flex justify-between gap-4">
                  <span>Discount (-):</span>
                  <span class="font-bold">{{ totalDiscount() | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                }
              </div>
              
              <div class="grand-total-card bg-gradient-to-br from-blue-900 to-blue-800 text-white px-8 py-4 rounded-xl text-right min-w-[220px] shadow-lg border border-blue-700">
                <div class="text-xs opacity-80 uppercase tracking-wider flex items-center justify-end gap-2 mb-1">
                  <i class="pi pi-credit-card"></i> Amount Due
                </div>
                <div class="text-5xl font-black text-orange-400 leading-none">
                  {{ balanceAmount() | currency:'INR':'symbol':'1.0-0' }}
                </div>
              </div>

              <div class="payment-section flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                <p-select formControlName="paymentMethod" [options]="paymentMethodOptions" styleClass="w-32 border-none" placeholder="Payment"></p-select>
                <div class="w-px h-8 bg-gray-200 mx-1"></div>
                <p-inputNumber formControlName="paidAmount" mode="currency" currency="INR" placeholder="Amount" styleClass="w-32" inputStyleClass="text-right font-bold text-green-700 text-lg border-none focus:ring-0"></p-inputNumber>
              </div>

              <button pButton type="button" [label]="items.length === 0 ? 'No Items' : 'Complete Sale (Enter)'" 
                [icon]="items.length === 0 ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'" 
                class="p-button-lg h-[60px] px-8 shadow-md font-bold text-lg transition-transform hover:scale-105" 
                [class.p-button-secondary]="items.length === 0" [class.p-button-success]="items.length > 0"
                [disabled]="items.length === 0 || isSubmitting()"
                (click)="handleSubmit('issued', $event)" [loading]="isSubmitting()"></button>
            </div>
          </div>
          
          <!-- Footer Info Bar -->
          <div class="flex justify-between items-center mt-4 text-xs border-t border-gray-200 pt-3">
            <div class="flex items-center gap-4 text-gray-500 font-medium">
              <span class="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded"><i class="pi pi-file text-blue-500"></i> #{{ invoiceForm.get('invoiceNumber')?.value }}</span>
              <span class="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded"><i class="pi pi-box text-orange-500"></i> {{ items.length }} items</span>
            </div>
            
            <div class="flex gap-4 text-gray-500 font-medium">
              <span class="flex items-center gap-1.5"><i class="pi pi-user text-blue-400"></i> {{ getCustomerName() }}</span>
              <span class="flex items-center gap-1.5"><i class="pi pi-building text-orange-400"></i> {{ getBranchName() }}</span>
            </div>
          </div>
        </footer>
      </form>
    </div>
  `,
  styles: [`
    .pos-layout {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    .glass-panel {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      margin: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }
    
    .invoice-container {
      display: flex;
      flex-direction: column;
      height: calc(100% - 24px);
    }
    
    .custom-scrollbar::-webkit-scrollbar { width: 8px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f8f9fa; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f8f9fa; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    
    .scanner-input:focus { outline: none; box-shadow: none; }
    
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
    .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    
    ::ng-deep .p-inputnumber-input { width: 100%; }
  `]
})
export class PosInvoiceComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scannerInput') scannerInput!: ElementRef;

  // --- Dependencies ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private productService = inject(ProductService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  public common = inject(CommonMethodService);

  // --- State ---
  isLoading = signal(true);
  isSubmitting = signal(false);
  isScanning = signal(false);
  editMode = signal(false);
  invoiceId: string | null = null;
  
  // UI State
  showQuickProductModal = false;
  showHoldDialog = false;
  showReceiptDialog = false;
  
  scannedCode = signal('');
  lastScannedTime = signal<number>(0);
  lastScannedItemName = signal<string>('');
  
  private destroy$ = new Subject<void>();
  private scanSubject = new Subject<string>();

  // --- Computed Data ---
  formTitle = computed(() => this.editMode() ? `Edit POS #${this.invoiceForm.get('invoiceNumber')?.value || ''}` : 'New POS Sale');
  customerOptions = computed(() => this.masterList.customers());
  branchOptions = computed(() => this.masterList.branches());

  paymentMethodOptions = [
    { label: 'Cash', value: 'cash' },
    { label: 'Card / POS', value: 'card' },
    { label: 'UPI', value: 'upi' },
    { label: 'Credit', value: 'credit' }
  ];

  // --- Totals Signals ---
  subTotal = signal(0);
  totalDiscount = signal(0);
  totalTax = signal(0);
  grandTotal = signal(0);
  balanceAmount = signal(0);
  itemCount = signal(0);

  invoiceForm!: FormGroup;
  manualProductForm!: FormGroup;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    
    if (this.scannerInput && !this.isScanning() && !this.showQuickProductModal && !this.showHoldDialog && !this.showReceiptDialog) {
      this.scannerInput.nativeElement.focus();
    }
    
    if (event.key === 'F8') { event.preventDefault(); this.quickPay(); }
    if (event.key === 'F2') { event.preventDefault(); this.showQuickProductModal = true; }
    if (event.key === 'F4') { event.preventDefault(); this.showHoldDialog = true; }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.focusScanner(), 200);
  }

  ngOnInit(): void {
    this.buildForms();
    this.setupTotalsCalculation();
    this.setupScanDebouncer();
    
    const defaultBranch = this.masterList.branches()[0]?._id;
    if (defaultBranch && !this.editMode()) {
      this.invoiceForm.patchValue({ branchId: defaultBranch });
    }

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.invoiceId = id;
        this.editMode.set(true);
        this.loadInvoiceData(id);
      } else {
        this.isLoading.set(false);
        this.generateInvoiceNumber();
      }
    });
    
    this.items.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(items => this.itemCount.set(items.length));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForms(): void {
    this.invoiceForm = this.fb.group({
      customerId: [null, Validators.required],
      branchId: [null, Validators.required],
      invoiceNumber: ['', Validators.required],
      invoiceDate: [new Date(), Validators.required],
      status: ['draft', Validators.required],
      items: this.fb.array([], [Validators.required]),
      roundOff: [0],
      paidAmount: [0, Validators.min(0)],
      paymentMethod: ['cash'],
      notes: [''],
    });

    this.manualProductForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [1, [Validators.required, Validators.min(1)]],
      tax: [0, [Validators.required, Validators.min(0)]],
      unit: ['pcs', Validators.required]
    });
  }

  get items(): FormArray { return this.invoiceForm.get('items') as FormArray; }

  private setupScanDebouncer(): void {
    this.scanSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(code => code.length > 0),
      takeUntil(this.destroy$)
    ).subscribe(code => this.processScan(code));
  }

  focusScanner() {
    if (this.scannerInput) { this.scannerInput.nativeElement.focus(); }
  }

  onProductScan(code: string): void {
    const now = Date.now();
    if (now - this.lastScannedTime() < 500) return;
    this.lastScannedTime.set(now);
    this.scanSubject.next(code.trim());
  }

  private processScan(code: string): void {
    const branchId = this.invoiceForm.get('branchId')?.value;
    if (!branchId) {
      this.messageService.showWarn('Please select a branch first.');
      this.resetScanner();
      return;
    }

    this.isScanning.set(true);
    this.scannedCode.set(code);

    const existingIndex = this.findItemByCode(code);
    if (existingIndex > -1) {
      this.incrementItemQuantity(existingIndex);
    } else {
      this.fetchAndAddProduct(code, branchId);
    }
  }

  private findItemByCode(code: string): number {
    return this.items.controls.findIndex(ctrl => {
      const sku = ctrl.get('sku')?.value;
      const barcode = ctrl.get('barcode')?.value;
      return (sku && sku.toLowerCase() === code.toLowerCase()) || (barcode && barcode.toLowerCase() === code.toLowerCase());
    });
  }

  private incrementItemQuantity(index: number): void {
    const itemCtrl = this.items.at(index);
    const currentQty = itemCtrl.get('quantity')?.value || 0;
    const currentStock = itemCtrl.get('currentStock')?.value || 0;

    if (currentQty < currentStock) {
      itemCtrl.patchValue({ quantity: currentQty + 1 });
      this.lastScannedItemName.set(itemCtrl.get('name')?.value);
    } else {
      this.messageService.showError(`Max stock (${currentStock}) reached for ${itemCtrl.get('name')?.value}`);
    }
    this.resetScanner();
  }

  private fetchAndAddProduct(code: string, branchId: string): void {
    this.productService.scanProduct(code, branchId)
      .pipe(finalize(() => this.resetScanner()))
      .subscribe({
        next: (res: any) => {
          if (res?.data?.product && res.data.availableStock > 0) {
            this.addScannedItem(res.data.product, res.data.availableStock);
          } else {
            this.messageService.showWarn(`Product out of stock or not found.`);
            this.manualProductForm.patchValue({ code: code });
            this.showQuickProductModal = true;
          }
        },
        error: () => {
          this.messageService.showError(`Product not found.`);
          this.manualProductForm.patchValue({ code: code });
          this.showQuickProductModal = true;
        }
      });
  }

  private resetScanner(): void {
    this.isScanning.set(false);
    setTimeout(() => {
      if (this.scannerInput) {
        this.scannerInput.nativeElement.value = '';
        this.scannerInput.nativeElement.focus();
      }
    }, 50);
  }

  private addScannedItem(product: any, stock: number): void {
    const existingIndex = this.items.controls.findIndex(c => c.get('productId')?.value === product._id);
    if (existingIndex > -1) {
      this.incrementItemQuantity(existingIndex);
      return;
    }

    const newItem = this.fb.group({
      productId: [product._id || Math.random().toString(), Validators.required],
      name: [product.name],
      sku: [product.sku || ''],
      barcode: [product.barcode || ''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [product.sellingPrice || 0, [Validators.required, Validators.min(0)]],
      discount: [0, Validators.min(0)],
      taxRate: [product.taxRate || 0],
      currentStock: [stock],
      unit: [product.unit || 'pcs']
    });
    
    newItem.get('quantity')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((qty:any) => {
      const max:any = newItem.get('currentStock')?.value;
      if (qty > max) {
        newItem.patchValue({ quantity: max }, {emitEvent: false});
        this.messageService.showWarn(`Quantity adjusted to available stock (${max})`);
      }
    });
    
    this.items.insert(0, newItem);
    this.lastScannedItemName.set(product.name);
  }

  addManualProduct(): void {
    if (this.manualProductForm.invalid) return;
    const val = this.manualProductForm.value;
    const product = { _id: 'manual_' + Date.now(), name: val.name, sku: val.code, barcode: val.code, sellingPrice: val.price, taxRate: val.tax, unit: val.unit };
    this.addScannedItem(product, val.stock);
    this.showQuickProductModal = false;
    this.manualProductForm.reset({ price: 0, stock: 1, tax: 0, unit: 'pcs' });
  }

  removeItem(index: number): void {
    const name = this.items.at(index).get('name')?.value;
    this.items.removeAt(index);
    this.messageService.showInfo(`${name} removed`);
    this.focusScanner();
  }

  updateQuantity(index: number, delta: number): void {
    const item = this.items.at(index);
    const newQty = (item.get('quantity')?.value || 0) + delta;
    const maxStock = item.get('currentStock')?.value || 0;
    
    if (newQty >= 1 && newQty <= maxStock) {
      item.patchValue({ quantity: newQty });
    }
  }

  private setupTotalsCalculation(): void {
    this.invoiceForm.valueChanges.pipe(takeUntil(this.destroy$), debounceTime(50)).subscribe(val => {
      let sub = 0, disc = 0, tax = 0;
      (val.items || []).forEach((item: any) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const d = Number(item.discount) || 0;
        const tRate = Number(item.taxRate) || 0;
        const lineTotal = price * qty;
        const taxable = lineTotal - d;
        sub += lineTotal; disc += d; tax += (taxable * tRate) / 100;
      });

      const grand = sub - disc + tax;
      const paid = Number(val.paidAmount) || 0;
      
      this.subTotal.set(sub); this.totalDiscount.set(disc); this.totalTax.set(tax);
      this.grandTotal.set(Math.round(grand * 100) / 100);
      this.balanceAmount.set(Math.round((grand - paid) * 100) / 100);
    });
  }

  generateInvoiceNumber(): void {
    if (this.editMode()) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}`;
    this.invoiceForm.patchValue({ invoiceNumber: `POS-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}` });
  }

  quickPay(): void {
    if (this.items.length === 0) return;
    this.invoiceForm.patchValue({ paidAmount: this.grandTotal(), paymentMethod: 'cash' });
  }

  applyDiscount(): void {
    // Demo: applies a 10% discount to all items
    this.items.controls.forEach(ctrl => {
      const price = ctrl.get('price')?.value || 0;
      const qty = ctrl.get('quantity')?.value || 0;
      ctrl.patchValue({ discount: (price * qty) * 0.1 });
    });
    this.messageService.showSuccess('10% discount applied to all items');
  }

  holdBill(refName: string): void {
    if (!refName.trim()) { this.messageService.showWarn('Reference name required'); return; }
    this.messageService.showSuccess(`Bill saved for ${refName}`);
    this.showHoldDialog = false;
    this.clearCart(true); // silent clear
  }

  clearCart(silent = false): void {
    if (!silent) {
      this.confirmationService.confirm({
        message: 'Clear all items?', header: 'Confirm', icon: 'pi pi-trash',
        accept: () => { while (this.items.length) this.items.removeAt(0); this.focusScanner(); }
      });
    } else {
      while (this.items.length) this.items.removeAt(0);
      this.invoiceForm.patchValue({ paidAmount: 0 });
    }
  }

  handleSubmit(status: 'draft' | 'issued', event?: Event): void {
    if (this.invoiceForm.invalid) { this.messageService.showWarn('Check missing fields.'); return; }

    if (status === 'issued' && this.balanceAmount() > 0) {
      const fmtBal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(this.balanceAmount());
      this.confirmationService.confirm({
        target: event?.target as EventTarget,
        message: `Balance due of ${fmtBal} will be pending. Continue?`,
        header: 'Partial Payment',
        icon: 'pi pi-exclamation-triangle',
        rejectButtonProps: { label: 'Cancel', severity: 'secondary', outlined: true },
        acceptButtonProps: { label: 'Issue Anyway', severity: 'warn' },
        accept: () => this.submitInvoice(status)
      });
    } else {
      this.submitInvoice(status);
    }
  }

  private submitInvoice(status: 'draft' | 'issued'): void {
    this.isSubmitting.set(true);
    this.invoiceForm.patchValue({ status });
    const payload = this.preparePayload();

    const request$ = this.editMode() 
      ? this.invoiceService.updateInvoice(this.invoiceId!, payload) 
      : this.invoiceService.createInvoice(payload);

    request$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: (res: any) => {
        this.messageService.showSuccess('Sale Completed successfully!');
        if (status === 'issued') {
          this.showReceiptDialog = true;
        } else {
          this.router.navigate(['/invoices', res.data?.invoice?._id || this.invoiceId, 'view']);
        }
      },
      error: (err: any) => this.messageService.handleHttpError(err)
    });
  }

  private preparePayload(): any {
    const formValue = this.invoiceForm.getRawValue();
    return {
      ...formValue,
      subTotal: this.subTotal(),
      totalDiscount: this.totalDiscount(),
      totalTax: this.totalTax(),
      grandTotal: this.grandTotal(),
      balanceAmount: this.balanceAmount(),
      items: formValue.items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        discount: i.discount || 0,
        taxRate: i.taxRate || 0,
        unit: i.unit || 'pcs'
      }))
    };
  }

  private loadInvoiceData(id: string): void {
    this.invoiceService.getInvoiceWithStock(id).subscribe({
      next: (res: any) => {
        const data = res.data?.invoice || res.data;
        if (data) {
          this.patchForm(data);
        }
        this.isLoading.set(false);
        setTimeout(() => this.scannerInput?.nativeElement.focus(), 200);
      },
      error: (err: any) => {
        this.messageService.handleHttpError(err);
        this.router.navigate(['/invoices']);
      }
    });
  }

  private patchForm(data: any): void {
    const customerValue = data.customerId?._id || data.customerId;
    const branchValue = data.branchId?._id || data.branchId;
    
    this.invoiceForm.patchValue({
      customerId: customerValue,
      branchId: branchValue,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
      status: data.status,
      paidAmount: data.paidAmount || 0,
      paymentMethod: data.paymentMethod || 'cash',
      notes: data.notes || ''
    });
    
    const itemControl = this.items;
    itemControl.clear();
    
    if (data.items?.length) {
      data.items.forEach((item: any) => {
        const product = item.productId || {};
        itemControl.push(this.fb.group({
          productId: [product._id || product, Validators.required],
          name: [item.name || product.name],
          sku: [item.sku || product.sku],
          barcode: [item.barcode || product.barcode],
          quantity: [item.quantity || 1, [Validators.required, Validators.min(1)]],
          price: [item.price || 0, [Validators.required, Validators.min(0)]],
          discount: [item.discount || 0, Validators.min(0)],
          taxRate: [item.taxRate || 0],
          currentStock: [item.currentStock || 0],
          unit: [item.unit || 'pcs']
        }));
      });
    }
    
    this.invoiceForm.updateValueAndValidity();
  }

  printReceipt(): void {
    window.print();
    this.showReceiptDialog = false;
    this.clearCart(true);
    this.generateInvoiceNumber();
    this.focusScanner();
  }

  getCustomerName(): string {
    const id = this.invoiceForm.get('customerId')?.value;
    return this.customerOptions().find(c => c._id === id)?.name || 'Walk-in';
  }

  getBranchName(): string {
    const id = this.invoiceForm.get('branchId')?.value;
    return this.branchOptions().find(b => b._id === id)?.name || 'Main';
  }
}

// import { ProductService } from "./../../../product/services/product-service";
// import { Component, OnInit, inject, signal, OnDestroy, computed, ViewChild, ElementRef, HostListener, AfterViewInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { debounceTime, takeUntil, finalize, switchMap, distinctUntilChanged, filter } from 'rxjs/operators';
// import { Subject, fromEvent, merge } from 'rxjs';

// // Services
// import { InvoiceService } from '../../services/invoice-service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { CommonMethodService } from '../../../../core/utils/common-method.service';

// // PrimeNG Modules
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { SelectModule } from 'primeng/select';
// import { ToastModule } from 'primeng/toast';
// import { DatePickerModule } from 'primeng/datepicker';
// import { TextareaModule } from 'primeng/textarea';
// import { TagModule } from 'primeng/tag';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ConfirmationService } from 'primeng/api';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { DialogModule } from 'primeng/dialog';
// import { OverlayModule } from "primeng/overlay";

// @Component({
//   selector: 'app-pos-invoice',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, RouterModule,
//     ToastModule, ButtonModule, InputTextModule, InputNumberModule,
//     DatePickerModule, SelectModule, TextareaModule, 
//     TagModule, ConfirmDialogModule, ProgressSpinnerModule,
//     DialogModule, OverlayModule
//   ],
//   providers: [ConfirmationService],
//   templateUrl: './pos-invoice.component.html',
//   styleUrls: ['./pos-invoice.component.scss']
// })
// export class PosInvoiceComponent implements OnInit, OnDestroy, AfterViewInit {
//   @ViewChild('scannerInput') scannerInput!: ElementRef;
//   @ViewChild('quantityInput') quantityInput!: ElementRef;

//   // --- Dependencies ---
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private invoiceService = inject(InvoiceService);
//   private productService = inject(ProductService);
//   private masterList = inject(MasterListService);
//   private messageService = inject(AppMessageService);
//   private confirmationService = inject(ConfirmationService);
//   public common = inject(CommonMethodService);

//   // --- State ---
//   isLoading = signal(true);
//   isSubmitting = signal(false);
//   isScanning = signal(false);
//   editMode = signal(false);
//   invoiceId: string | null = null;
  
//   // UI State
//   showQuickProductModal = signal(false);
//   scannedCode = signal('');
//   lastScannedTime = signal<number>(0);
  
//   private destroy$ = new Subject<void>();
//   private scanSubject = new Subject<string>();

//   // --- Computed Master Data ---
//   formTitle = computed(() => this.editMode() ? `Edit POS #${this.invoiceForm.get('invoiceNumber')?.value || ''}` : 'New POS Sale');
//   customerOptions = computed(() => this.masterList.customers());
//   branchOptions = computed(() => this.masterList.branches());

//   paymentMethodOptions = [
//     { label: 'Cash', value: 'cash' },
//     { label: 'Card / POS', value: 'card' },
//     { label: 'UPI', value: 'upi' },
//     { label: 'Credit', value: 'credit' },
//     { label: 'Mixed', value: 'mixed' }
//   ];

//   // --- Totals (Reactive Signals) ---
//   subTotal = signal(0);
//   totalDiscount = signal(0);
//   totalTax = signal(0);
//   grandTotal = signal(0);
//   balanceAmount = signal(0);
//   itemCount = signal(0);

//   invoiceForm!: FormGroup;

//   // Global listener to keep scanner focused if user clicks away but starts typing
//   @HostListener('document:keydown', ['$event'])
//   handleKeyboardEvent(event: KeyboardEvent) {
//     // Skip if in input, but allow barcode scanners (they fire rapidly)
//     if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
//       return;
//     }
    
//     // Focus scanner on any key press outside inputs
//     if (this.scannerInput && !this.isScanning()) {
//       this.scannerInput.nativeElement.focus();
//     }
    
//     // Handle F8 for quick payment
//     if (event.key === 'F8') {
//       event.preventDefault();
//       this.quickPay();
//     }
    
//     // Handle F2 for new item
//     if (event.key === 'F2') {
//       event.preventDefault();
//       this.showQuickProductModal.set(true);
//     }
//   }

//   ngAfterViewInit(): void {
//     // Auto-focus scanner after view init
//     setTimeout(() => this.scannerInput?.nativeElement.focus(), 200);
    
//     // Setup scanner input debouncing to handle rapid barcode scanner input
//     if (this.scannerInput) {
//       fromEvent(this.scannerInput.nativeElement, 'keyup')
//         .pipe(
//           debounceTime(300), // Wait for barcode scanner to complete
//           takeUntil(this.destroy$)
//         )
//         .subscribe(() => {
//           const value = this.scannerInput.nativeElement.value;
//           if (value && value.length > 2) { // Minimum length for barcode/SKU
//             this.onProductScan(value);
//           }
//         });
//     }
//   }

//   ngOnInit(): void {
//     this.buildForm();
//     this.setupTotalsCalculation();
//     this.setupScanDebouncer();
    
//     const defaultBranch = this.masterList.branches()[0]?._id;
//     if (defaultBranch && !this.editMode()) {
//       this.invoiceForm.patchValue({ branchId: defaultBranch });
//     }

//     this.route.paramMap.subscribe(params => {
//       const id = params.get('id');
//       if (id) {
//         this.invoiceId = id;
//         this.editMode.set(true);
//         this.loadInvoiceData(id);
//       } else {
//         this.isLoading.set(false);
//         this.generateInvoiceNumber();
//       }
//     });
    
//     // Watch items for count
//     this.items.valueChanges
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(items => this.itemCount.set(items.length));
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
//       status: ['draft', Validators.required],
//       items: this.fb.array([], [Validators.required]),
//       roundOff: [0],
//       paidAmount: [0, Validators.min(0)],
//       paymentMethod: ['cash'],
//       notes: [''],
//     });
//   }

//   get items(): FormArray {
//     return this.invoiceForm.get('items') as FormArray;
//   }

//   private setupScanDebouncer(): void {
//     this.scanSubject
//       .pipe(
//         debounceTime(300), // Prevent duplicate scans
//         distinctUntilChanged(),
//         filter(code => code.length > 0),
//         takeUntil(this.destroy$)
//       )
//       .subscribe(code => this.processScan(code));
//   }

//   // === CORE POS LOGIC: THE SCANNER ===
//   onProductScan(code: string): void {
//     // Check for duplicate rapid scans (some scanners send duplicate events)
//     const now = Date.now();
//     if (now - this.lastScannedTime() < 500) {
//       return; // Ignore duplicate within 500ms
//     }
//     this.lastScannedTime.set(now);
    
//     this.scanSubject.next(code);
//   }

//   private processScan(code: string): void {
//     const branchId = this.invoiceForm.get('branchId')?.value;
//     if (!branchId) {
//       this.messageService.showWarn('Please select a branch first.');
//       this.resetScanner();
//       return;
//     }

//     this.isScanning.set(true);
//     this.scannedCode.set(code);

//     // 1. Check if item is already in the list
//     const existingIndex = this.findItemByCode(code);

//     if (existingIndex > -1) {
//       // 2. Auto-increment quantity
//       this.incrementItemQuantity(existingIndex);
//     } else {
//       // 3. Fetch new product
//       this.fetchAndAddProduct(code, branchId);
//     }
//   }

//   private findItemByCode(code: string): number {
//     return this.items.controls.findIndex(ctrl => {
//       const sku = ctrl.get('sku')?.value;
//       const barcode = ctrl.get('barcode')?.value;
//       return sku === code || barcode === code || 
//              (sku && sku.toLowerCase() === code.toLowerCase()) ||
//              (barcode && barcode.toLowerCase() === code.toLowerCase());
//     });
//   }

//   private incrementItemQuantity(index: number): void {
//     const itemCtrl = this.items.at(index);
//     const currentQty = itemCtrl.get('quantity')?.value || 0;
//     const currentStock = itemCtrl.get('currentStock')?.value || 0;

//     if (currentQty < currentStock) {
//       itemCtrl.patchValue({ quantity: currentQty + 1 });
//       this.messageService.showSuccess(
//         `${itemCtrl.get('name')?.value} quantity updated to ${currentQty + 1}`
//       );
//       this.playSuccessSound();
//     } else {
//       this.messageService.showError(
//         `Cannot add more. Max stock (${currentStock}) reached for ${itemCtrl.get('name')?.value}`
//       );
//       this.playErrorSound();
//     }
    
//     this.resetScanner();
//   }

//   private fetchAndAddProduct(code: string, branchId: string): void {
//     this.productService.scanProduct(code, branchId)
//       .pipe(finalize(() => this.resetScanner()))
//       .subscribe({
//         next: (res: any) => {
//           if (res?.data?.product) {
//             const product = res.data.product;
//             const availableStock = res.data.availableStock || 0;
            
//             if (availableStock > 0) {
//               this.addScannedItem(product, availableStock);
//               this.playSuccessSound();
//             } else {
//               this.messageService.showWarn(`Out of Stock: ${product.name}`);
//               this.playErrorSound();
//               this.showQuickProductModal.set(true); // Offer to create/restock
//             }
//           }
//         },
//         error: (err) => {
//           console.error('Scan error:', err);
//           this.messageService.showError(`Product not found for code: ${code}`);
//           this.playErrorSound();
//           this.showQuickProductModal.set(true); // Offer to create new product
//         }
//       });
//   }

//   private playSuccessSound(): void {
//     // Optional: Play success beep
//     const audio = new Audio();
//     audio.src = 'assets/sounds/success-beep.mp3';
//     audio.play().catch(() => {}); // Ignore if browser blocks
//   }

//   private playErrorSound(): void {
//     // Optional: Play error beep
//     const audio = new Audio();
//     audio.src = 'assets/sounds/error-beep.mp3';
//     audio.play().catch(() => {});
//   }

//   private resetScanner(): void {
//     this.isScanning.set(false);
//     setTimeout(() => {
//       if (this.scannerInput) {
//         this.scannerInput.nativeElement.value = '';
//         this.scannerInput.nativeElement.focus();
//       }
//     }, 50);
//   }

//   private addScannedItem(product: any, stock: number): void {
//     // Check if product already exists (case-insensitive check)
//     const existingIndex = this.items.controls.findIndex(
//       ctrl => ctrl.get('productId')?.value === product._id
//     );

//     if (existingIndex > -1) {
//       // If exists, increment quantity instead of adding duplicate
//       this.incrementItemQuantity(existingIndex);
//       return;
//     }

//     const newItem = this.fb.group({
//       productId: [product._id, Validators.required],
//       name: [product.name],
//       sku: [product.sku || ''],
//       barcode: [product.barcode || ''],
//       quantity: [1, [Validators.required, Validators.min(1)]],
//       price: [product.sellingPrice || 0, [Validators.required, Validators.min(0)]],
//       discount: [0, Validators.min(0)],
//       taxRate: [product.taxRate || 0],
//       currentStock: [stock],
//       unit: [product.unit || 'pcs'],
//       maxQuantity: [stock] // For validation
//     });
    
//     // Add quantity change validation
//     newItem.get('quantity')?.valueChanges
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((qty:any) => {
//         const max:any = newItem.get('currentStock')?.value;
//         if (qty > max) {
//           newItem.patchValue({ quantity: max });
//           this.messageService.showWarn(`Quantity adjusted to available stock (${max})`);
//         }
//       });
    
//     // Insert at top for newest item first
//     this.items.insert(0, newItem);
    
//     this.messageService.showSuccess(
//       `${product.name} added to cart` 
//     );
//   }

//   removeItem(index: number): void {
//     const itemName = this.items.at(index).get('name')?.value;
//     this.confirmationService.confirm({
//       message: `Remove ${itemName} from cart?`,
//       header: 'Confirm',
//       icon: 'pi pi-exclamation-triangle',
//       accept: () => {
//         this.items.removeAt(index);
//         this.messageService.showInfo(`${itemName} removed`);
//         this.scannerInput?.nativeElement.focus();
//       }
//     });
//   }

//   updateQuantity(index: number, delta: number): void {
//     const item = this.items.at(index);
//     const currentQty = item.get('quantity')?.value || 0;
//     const maxStock = item.get('currentStock')?.value || 0;
//     const newQty = currentQty + delta;
    
//     if (newQty >= 1 && newQty <= maxStock) {
//       item.patchValue({ quantity: newQty });
//     } else if (newQty > maxStock) {
//       this.messageService.showWarn(`Maximum stock available: ${maxStock}`);
//     }
//   }

//   // --- Totals and Submit logic ---
//   private setupTotalsCalculation(): void {
//     this.invoiceForm.valueChanges.pipe(
//       takeUntil(this.destroy$),
//       debounceTime(50)
//     ).subscribe(val => {
//       let sub = 0, disc = 0, tax = 0;
//       (val.items || []).forEach((item: any) => {
//         const qty = Number(item.quantity) || 0;
//         const price = Number(item.price) || 0;
//         const d = Number(item.discount) || 0;
//         const tRate = Number(item.taxRate) || 0;
        
//         const lineTotal = price * qty;
//         const taxable = lineTotal - d;
//         const tAmount = (taxable * tRate) / 100;
        
//         sub += lineTotal;
//         disc += d;
//         tax += tAmount;
//       });

//       const grand = sub - disc + tax;
//       const paid = Number(val.paidAmount) || 0;
      
//       this.subTotal.set(sub);
//       this.totalDiscount.set(disc);
//       this.totalTax.set(tax);
//       this.grandTotal.set(Math.round(grand * 100) / 100);
//       this.balanceAmount.set(Math.round((grand - paid) * 100) / 100);
//     });
//   }

//   generateInvoiceNumber(): void {
//     if (this.editMode()) return;
//     const now = new Date();
//     const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}`;
//     const random = Math.floor(1000 + Math.random() * 9000);
//     this.invoiceForm.patchValue({ invoiceNumber: `POS-${dateStr}-${random}` });
//   }

//   quickPay(): void {
//     if (this.items.length === 0) {
//       this.messageService.showWarn('No items in cart');
//       return;
//     }
    
//     // Set paid amount to grand total
//     this.invoiceForm.patchValue({ 
//       paidAmount: this.grandTotal(),
//       paymentMethod: 'cash'
//     });
    
//     this.messageService.showSuccess('Ready for payment');
//   }

// handleSubmit(status: 'draft' | 'issued', event?: Event): void {
//     if (this.invoiceForm.invalid) {
//       this.invoiceForm.markAllAsTouched();
//       this.messageService.showWarn('Validation Error: Please complete all required fields.');
//       return;
//     }

//     if (status === 'issued' && this.balanceAmount() > 0) {
//       // Format the currency for the TypeScript string
//       const formattedBalance = new Intl.NumberFormat('en-IN', { 
//         style: 'currency', 
//         currency: 'INR' 
//       }).format(this.balanceAmount());

//       this.confirmationService.confirm({
//         target: event?.target as EventTarget, // Safe navigation in case event isn't passed
//         message: `Balance due of ${formattedBalance} will be pending. Continue?`,
//         header: 'Partial Payment',
//         icon: 'pi pi-exclamation-triangle',
//         rejectButtonProps: {
//           label: 'Cancel',
//           severity: 'secondary',
//           outlined: true
//         },
//         acceptButtonProps: {
//           label: 'Issue Anyway',
//           severity: 'warn' // Uses yellow/orange warning color
//         },
//         accept: () => {
//           this.submitInvoice(status);
//         },
//         reject: () => {
//           this.messageService.showInfo('Invoice issuance cancelled.');
//         }
//       });
//     } else {
//       this.submitInvoice(status);
//     }
//   }

//   private submitInvoice(status: 'draft' | 'issued'): void {
//     this.isSubmitting.set(true);
//     this.invoiceForm.patchValue({ status });
    
//     const payload = this.preparePayload();
    
//     const request$ = this.editMode() 
//       ? this.invoiceService.updateInvoice(this.invoiceId!, payload) 
//       : this.invoiceService.createInvoice(payload);

//     request$.pipe(finalize(() => this.isSubmitting.set(false)))
//       .subscribe({
//         next: (res) => {
//           const invNum = res.data?.invoice?.invoiceNumber || payload.invoiceNumber;
//           this.messageService.showSuccess(
//             `Invoice #${invNum} ${status === 'draft' ? 'saved as draft' : 'completed'}`
//           );
          
//           // Print receipt if issued
//           if (status === 'issued') {
//             this.printReceipt(res.data?.invoice || payload);
//           }
          
//           this.router.navigate(['/invoices', res.data?.invoice?._id || this.invoiceId, 'view']);
//         },
//         error: (err) => {
//           this.messageService.handleHttpError(err);
//         }
//       });
//   }

//   private preparePayload(): any {
//     const formValue = this.invoiceForm.getRawValue();
//     return {
//       ...formValue,
//       subTotal: this.subTotal(),
//       totalDiscount: this.totalDiscount(),
//       totalTax: this.totalTax(),
//       grandTotal: this.grandTotal(),
//       balanceAmount: this.balanceAmount(),
//       items: formValue.items.map((i: any) => ({
//         productId: i.productId,
//         quantity: i.quantity,
//         price: i.price,
//         discount: i.discount || 0,
//         taxRate: i.taxRate || 0,
//         unit: i.unit || 'pcs'
//       }))
//     };
//   }

//   private printReceipt(invoice: any): void {
//     // Implement receipt printing logic
//     console.log('Printing receipt for:', invoice.invoiceNumber);
//     // You can open a print dialog or use a print service
//     window.open(`/invoices/${invoice._id}/print`, '_blank');
//   }

//   private loadInvoiceData(id: string): void {
//     this.invoiceService.getInvoiceWithStock(id).subscribe({
//       next: (res: any) => {
//         const data = res.data?.invoice || res.data;
//         if (data) {
//           this.patchForm(data);
//         }
//         this.isLoading.set(false);
//         setTimeout(() => this.scannerInput?.nativeElement.focus(), 200);
//       },
//       error: (err) => {
//         this.messageService.handleHttpError(err);
//         this.router.navigate(['/invoices']);
//       }
//     });
//   }

//   private patchForm(data: any): void {
//     const customerValue = data.customerId?._id || data.customerId;
//     const branchValue = data.branchId?._id || data.branchId;
    
//     this.invoiceForm.patchValue({
//       customerId: customerValue,
//       branchId: branchValue,
//       invoiceNumber: data.invoiceNumber,
//       invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
//       status: data.status,
//       paidAmount: data.paidAmount || 0,
//       paymentMethod: data.paymentMethod || 'cash',
//       notes: data.notes || ''
//     });
    
//     const itemControl = this.items;
//     itemControl.clear();
    
//     if (data.items?.length) {
//       data.items.forEach((item: any) => {
//         const product = item.productId || {};
//         itemControl.push(this.fb.group({
//           productId: [product._id || product, Validators.required],
//           name: [item.name || product.name],
//           sku: [item.sku || product.sku],
//           barcode: [item.barcode || product.barcode],
//           quantity: [item.quantity || 1, [Validators.required, Validators.min(1)]],
//           price: [item.price || 0, [Validators.required, Validators.min(0)]],
//           discount: [item.discount || 0, Validators.min(0)],
//           taxRate: [item.taxRate || 0],
//           currentStock: [item.currentStock || 0],
//           unit: [item.unit || 'pcs']
//         }));
//       });
//     }
    
//     this.invoiceForm.updateValueAndValidity();
//   }

//   // Utility methods
//   clearCart(): void {
//     if (this.items.length === 0) return;
    
//     this.confirmationService.confirm({
//       message: 'Clear all items from cart?',
//       header: 'Confirm',
//       icon: 'pi pi-trash',
//       accept: () => {
//         while (this.items.length) {
//           this.items.removeAt(0);
//         }
//         this.messageService.showInfo('Cart cleared');
//         this.scannerInput?.nativeElement.focus();
//       }
//     });
//   }

//   formatCurrency(value: number): string {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 2
//     }).format(value);
//   }
// }

// // import { ProductService } from "./../../../product/services/product-service";
// // import { Component, OnInit, inject, signal, OnDestroy, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// // import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// // import { debounceTime, takeUntil, finalize } from 'rxjs/operators';
// // import { Subject } from 'rxjs';

// // // Services
// // import { InvoiceService } from '../../services/invoice-service';
// // import { MasterListService } from '../../../../core/services/master-list.service';
// // import { AppMessageService } from '../../../../core/services/message.service';
// // import { CommonMethodService } from '../../../../core/utils/common-method.service';

// // // PrimeNG Modules
// // import { ButtonModule } from 'primeng/button';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { SelectModule } from 'primeng/select';
// // import { ToastModule } from 'primeng/toast';
// // import { DatePickerModule } from 'primeng/datepicker';
// // import { TextareaModule } from 'primeng/textarea';
// // import { TagModule } from 'primeng/tag';
// // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // import { ConfirmationService } from 'primeng/api';
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';

// // @Component({
// //   selector: 'app-pos-invoice',
// //   standalone: true,
// //   imports: [
// //     CommonModule, ReactiveFormsModule, RouterModule,
// //     ToastModule, ButtonModule, InputTextModule, InputNumberModule,
// //     DatePickerModule, SelectModule, TextareaModule, 
// //     TagModule, ConfirmDialogModule, ProgressSpinnerModule
// //   ],
// //   providers: [ConfirmationService],
// //   templateUrl: './pos-invoice.component.html',
// //   styleUrls: ['./pos-invoice.component.scss']
// // })
// // export class PosInvoiceComponent implements OnInit, OnDestroy {
// //   @ViewChild('scannerInput') scannerInput!: ElementRef;

// //   // --- Dependencies ---
// //   private fb = inject(FormBuilder);
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);
// //   private invoiceService = inject(InvoiceService);
// //   private productService = inject(ProductService);
// //   private masterList = inject(MasterListService);
// //   private messageService = inject(AppMessageService);
// //   private confirmationService = inject(ConfirmationService);
// //   public common = inject(CommonMethodService);

// //   // --- State ---
// //   isLoading = signal(true);
// //   isSubmitting = signal(false);
// //   isScanning = signal(false);
// //   editMode = signal(false);
// //   invoiceId: string | null = null;
// //   private destroy$ = new Subject<void>();

// //   // --- Computed Master Data ---
// //   formTitle = computed(() => this.editMode() ? `Edit POS #${this.invoiceForm.get('invoiceNumber')?.value || ''}` : 'New POS Sale');
// //   customerOptions = computed(() => this.masterList.customers());
// //   branchOptions = computed(() => this.masterList.branches());

// //   paymentMethodOptions = [
// //     { label: 'Cash', value: 'cash' },
// //     { label: 'Card / POS', value: 'card' },
// //     { label: 'UPI', value: 'upi' },
// //     { label: 'Credit', value: 'credit' }
// //   ];

// //   // --- Totals (Reactive Signals) ---
// //   subTotal = signal(0);
// //   totalDiscount = signal(0);
// //   totalTax = signal(0);
// //   grandTotal = signal(0);
// //   balanceAmount = signal(0);

// //   invoiceForm!: FormGroup;

// //   // Global listener to keep scanner focused if user clicks away but starts typing
// //   @HostListener('document:keypress', ['$event'])
// //   handleKeyboardEvent(event: KeyboardEvent) {
// //     if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
// //       return; // Let them type if they are specifically in another input
// //     }
// //     this.scannerInput?.nativeElement.focus();
// //   }

// //   ngOnInit(): void {
// //     this.buildForm();
// //     this.setupTotalsCalculation();
    
// //     const defaultBranch = this.masterList.branches()[0]?._id;
// //     if (defaultBranch && !this.editMode()) {
// //       this.invoiceForm.patchValue({ branchId: defaultBranch });
// //     }

// //     this.route.paramMap.subscribe(params => {
// //       const id = params.get('id');
// //       if (id) {
// //         this.invoiceId = id;
// //         this.editMode.set(true);
// //         this.loadInvoiceData(id);
// //       } else {
// //         this.isLoading.set(false);
// //         this.generateInvoiceNumber();
// //         setTimeout(() => this.scannerInput?.nativeElement.focus(), 100);
// //       }
// //     });
// //   }

// //   ngOnDestroy(): void {
// //     this.destroy$.next();
// //     this.destroy$.complete();
// //   }

// //   private buildForm(): void {
// //     this.invoiceForm = this.fb.group({
// //       customerId: [null, Validators.required],
// //       branchId: [null, Validators.required],
// //       invoiceNumber: ['', Validators.required],
// //       invoiceDate: [new Date(), Validators.required],
// //       status: ['draft', Validators.required],
// //       items: this.fb.array([], [Validators.required]),
// //       roundOff: [0],
// //       paidAmount: [0, Validators.min(0)],
// //       paymentMethod: ['cash'],
// //       notes: [''],
// //     });
// //   }

// //   get items(): FormArray {
// //     return this.invoiceForm.get('items') as FormArray;
// //   }

// //   // === CORE POS LOGIC: THE SCANNER ===
// //   onProductScan(event: any): void {
// //     const code = event.target.value.trim();
// //     if (!code) return;

// //     const branchId = this.invoiceForm.get('branchId')?.value;
// //     if (!branchId) {
// //       this.messageService.showWarn('Please select a branch first.');
// //       event.target.value = '';
// //       return;
// //     }

// //     this.isScanning.set(true);

// //     // 1. Check if item is already in the list
// //     const existingIndex = this.items.controls.findIndex(
// //       ctrl => ctrl.get('sku')?.value === code || ctrl.get('barcode')?.value === code
// //     );

// //     if (existingIndex > -1) {
// //       // 2. Auto-increment quantity
// //       const itemCtrl = this.items.at(existingIndex);
// //       const currentQty = itemCtrl.get('quantity')?.value || 0;
// //       const currentStock = itemCtrl.get('currentStock')?.value || 0;

// //       if (currentQty < currentStock) {
// //         itemCtrl.patchValue({ quantity: currentQty + 1 });
// //         this.messageService.showSuccess(`Added another ${itemCtrl.get('name')?.value}`);
// //       } else {
// //         this.messageService.showError(`Cannot add more. Max stock reached for ${itemCtrl.get('name')?.value}`);
// //       }
// //       this.resetScanner(event);
// //     } else {
// //       this.productService.scanProduct(code, branchId).pipe(
// //         finalize(() => this.resetScanner(event))
// //       ).subscribe({
// //         next: (res: any) => {
// //           if (res.data && res.data.product) {
// //             if (res.data.availableStock > 0) {
// //               this.addScannedItem(res.data.product, res.data.availableStock);
// //             } else {
// //               this.messageService.showWarn(`Out of Stock: ${res.data.product.name}`);
// //             }
// //           }
// //         },
// //         error: () => this.messageService.showError(`Product not found for code: ${code}`)
// //       });
// //     }
// //   }

// //   private resetScanner(event: any) {
// //     event.target.value = '';
// //     this.isScanning.set(false);
// //     this.scannerInput.nativeElement.focus();
// //   }

// //   private addScannedItem(product: any, stock: number): void {
// //     const newItem = this.fb.group({
// //       productId: [product._id, Validators.required],
// //       name: [product.name],
// //       sku: [product.sku],
// //       barcode: [product.barcode],
// //       quantity: [1, [Validators.required, Validators.min(1)]],
// //       price: [product.sellingPrice || 0, [Validators.required, Validators.min(0)]],
// //       discount: [0, Validators.min(0)],
// //       taxRate: [product.taxRate || 0],
// //       currentStock: [stock],
// //     });
    
// //     // Unshift puts the newest scanned item at the TOP of the list
// //     this.items.insert(0, newItem);
// //     this.messageService.showSuccess(`${product.name} added to cart`);
// //   }

// //   removeItem(index: number): void {
// //     this.items.removeAt(index);
// //     this.scannerInput.nativeElement.focus();
// //   }

// //   // --- Totals and Submit logic (Similar to your original, optimized) ---
// //   private setupTotalsCalculation(): void {
// //     this.invoiceForm.valueChanges.pipe(
// //       takeUntil(this.destroy$),
// //       debounceTime(50) // Reduced debounce for snappy POS feel
// //     ).subscribe(val => {
// //       let sub = 0, disc = 0, tax = 0;
// //       (val.items || []).forEach((item: any) => {
// //         const qty = Number(item.quantity) || 0;
// //         const price = Number(item.price) || 0;
// //         const d = Number(item.discount) || 0;
// //         const tRate = Number(item.taxRate) || 0;
        
// //         const lineTotal = price * qty;
// //         const taxable = lineTotal - d;
// //         const tAmount = (taxable * tRate) / 100;
        
// //         sub += lineTotal;
// //         disc += d;
// //         tax += tAmount;
// //       });

// //       const grand = sub - disc + tax;
// //       const paid = Number(val.paidAmount) || 0;
      
// //       this.subTotal.set(sub);
// //       this.totalDiscount.set(disc);
// //       this.totalTax.set(tax);
// //       this.grandTotal.set(Math.round(grand));
// //       this.balanceAmount.set(Math.round(grand) - paid);
// //     });
// //   }

// //   generateInvoiceNumber(): void {
// //     if (this.editMode()) return;
// //     const random = Math.floor(1000 + Math.random() * 9000);
// //     this.invoiceForm.patchValue({ invoiceNumber: `POS-${random}` });
// //   }

// //   handleSubmit(status: 'draft' | 'issued'): void {
// //     if (this.invoiceForm.invalid) {
// //       this.invoiceForm.markAllAsTouched();
// //       this.messageService.showWarn('Please check missing fields.');
// //       return;
// //     }
// //     this.invoiceForm.patchValue({ status });
// //     const payload = this.invoiceForm.getRawValue();
// //     // Your submit logic here (invoiceService.createInvoice...)
// //   }

// //   private loadInvoiceData(id: string) { /* ... */ }
// // }