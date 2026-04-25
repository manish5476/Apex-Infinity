import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { SupplierService } from '../../services/supplier-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-supplier-kyc',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    ToastModule,
    TagModule,
    ProgressSpinnerModule,
    TooltipModule,
    DatePipe
  ],
  templateUrl: './supplier-kyc.html',
  styleUrl: './supplier-kyc.scss',
  providers: [] // Required for Toast
})
export class SupplierKyc implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private supplierService = inject(SupplierService);
  private messageService = inject(AppMessageService);

  supplierId!: string;
  loading = signal(true);
  uploading = signal(false);
  documents = signal<any[]>([]);

  // Upload Form State
  docTypes = [
    { label: 'GST Certificate', value: 'GST' },
    { label: 'PAN Card', value: 'PAN' },
    { label: 'Trade License', value: 'TradeLicense' },
    { label: 'MSME Certificate', value: 'MSME' },
    { label: 'Aadhaar', value: 'Aadhaar' },
    { label: 'Other Document', value: 'Other' }
  ];
  selectedDocType: string | null = null;
  selectedFile: File | null = null;

  ngOnInit() {
    this.supplierId = this.config.data?.supplierId;
    if (this.supplierId) {
      this.loadDocuments();
    }
  }

  loadDocuments() {
    this.loading.set(true);
    this.supplierService.getSupplierById(this.supplierId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.documents.set(res.data?.data?.documents || []);
        this.loading.set(false);
      },
      error: (err) => {
        // Passed the actual error to your global handler!
        this.messageService.handleHttpError(err);
        this.loading.set(false);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Optional: Add file size/type validation here (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        // Converted PrimeNG object to a clean, single warning string
        this.messageService.showWarn('File too large: Maximum file size is 5MB.');
        return;
      }
      this.selectedFile = file;
    }
  }

  clearSelection() {
    this.selectedFile = null;
    this.selectedDocType = null;
    const fileInput = document.getElementById('kycFileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  uploadDocument() {
    if (!this.selectedFile || !this.selectedDocType) {
      // Converted PrimeNG object to a clean, single warning string
      this.messageService.showWarn('Incomplete: Please select a document type and a file.');
      return;
    }

    this.uploading.set(true);
    this.supplierService.uploadKycDocument(this.supplierId, this.selectedFile, this.selectedDocType).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        // Simplified success message
        this.messageService.showSuccess('Document uploaded successfully.');
        this.clearSelection();
        const createdDoc = res?.data?.document;
        if (createdDoc) {
          this.documents.set([createdDoc, ...this.documents()]);
        } else {
          this.loadDocuments();
        }
        this.uploading.set(false);
      },
      error: (err) => {
        // Handed off the error parsing to the global HTTP error handler
        this.messageService.handleHttpError(err);
        this.uploading.set(false);
      }
    });
  }

  deleteDocument(doc: any) {
    const docId = doc?._id;
    if (!docId) return;

    if (confirm('Are you sure you want to delete this document?')) {
      this.supplierService.deleteKycDocument(this.supplierId, docId).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          // Simplified success message
          this.messageService.showSuccess('Document removed successfully.');

          this.documents.set(this.documents().filter((d: any) => d?._id !== docId));
        },
        error: (err) => {
          // Captured the 'err' argument and passed it to the handler
          this.messageService.handleHttpError(err);
        }
      });
    }
  }

  viewDocument(url: string) {
    window.open(url, '_blank');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
