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
    { label: 'GST Certificate', value: 'GST_CERTIFICATE' },
    { label: 'PAN Card', value: 'PAN_CARD' },
    { label: 'Cancelled Cheque', value: 'CANCELLED_CHEQUE' },
    { label: 'MSME Certificate', value: 'MSME_CERTIFICATE' },
    { label: 'Other Document', value: 'OTHER' }
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
        this.documents.set(res.data?.supplier?.documents || []);
        this.uploading.set(false);
      },
      error: (err) => {
        // Handed off the error parsing to the global HTTP error handler
        this.messageService.handleHttpError(err);
        this.uploading.set(false);
      }
    });
  }

  deleteDocument(docIndex: number) {
    if (confirm('Are you sure you want to delete this document?')) {
      this.supplierService.deleteKycDocument(this.supplierId, docIndex).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          // Simplified success message
          this.messageService.showSuccess('Document removed successfully.');
          
          // Remove from local array to update UI instantly without another API call
          const currentDocs = this.documents();
          currentDocs.splice(docIndex, 1);
          this.documents.set([...currentDocs]);
        },
        error: (err) => {
          // Captured the 'err' argument and passed it to the handler
          this.messageService.handleHttpError(err);
        }
      });
    }
  }
  
  // loadDocuments() {
  //   this.loading.set(true);
  //   this.supplierService.getSupplierById(this.supplierId).subscribe({
  //     next: (res) => {
  //       this.documents.set(res.data?.data?.documents || []);
  //       this.loading.set(false);
  //     },
  //     error: () => {
  //       this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load documents' });
  //       this.loading.set(false);
  //     }
  //   });
  // }

  // onFileSelected(event: any) {
  //   const file = event.target.files[0];
  //   if (file) {
  //     // Optional: Add file size/type validation here (e.g., max 5MB)
  //     if (file.size > 5 * 1024 * 1024) {
  //       this.messageService.add({ severity: 'warn', summary: 'File too large', detail: 'Maximum file size is 5MB' });
  //       return;
  //     }
  //     this.selectedFile = file;
  //   }
  // }

  // clearSelection() {
  //   this.selectedFile = null;
  //   this.selectedDocType = null;
  //   const fileInput = document.getElementById('kycFileInput') as HTMLInputElement;
  //   if (fileInput) fileInput.value = '';
  // }

  // uploadDocument() {
  //   if (!this.selectedFile || !this.selectedDocType) {
  //     this.messageService.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please select a document type and a file.' });
  //     return;
  //   }

  //   this.uploading.set(true);
  //   this.supplierService.uploadKycDocument(this.supplierId, this.selectedFile, this.selectedDocType).subscribe({
  //     next: (res) => {
  //       this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: 'Document uploaded successfully' });
  //       this.clearSelection();
  //       this.documents.set(res.data?.supplier?.documents || []);
  //       this.uploading.set(false);
  //     },
  //     error: (err) => {
  //       this.messageService.add({ severity: 'error', summary: 'Upload Failed', detail: err.error?.message || 'Something went wrong' });
  //       this.uploading.set(false);
  //     }
  //   });
  // }

  // deleteDocument(docIndex: number) {
  //   if (confirm('Are you sure you want to delete this document?')) {
  //     this.supplierService.deleteKycDocument(this.supplierId, docIndex).subscribe({
  //       next: () => {
  //         this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Document removed' });
  //         // Remove from local array to update UI instantly without another API call
  //         const currentDocs = this.documents();
  //         currentDocs.splice(docIndex, 1);
  //         this.documents.set([...currentDocs]);
  //       },
  //       error: () => {
  //         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete document' });
  //       }
  //     });
  //   }
  // }

  viewDocument(url: string) {
    window.open(url, '_blank');
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}