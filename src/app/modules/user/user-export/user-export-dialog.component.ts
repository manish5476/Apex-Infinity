import { Component, inject, signal, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { finalize, Subject } from 'rxjs';
import { takeUntil } from "rxjs/operators";

import { UserManagementService } from '../user-management.service';
import { MasterDropdownComponent } from '../../shared/components/masterFilterDropdown/master-dropdown.component';
import { AppMessageService } from '../../../core/services/message.service';

@Component({
  selector: 'app-user-export-dialog',
  standalone: true,
  imports: [FormsModule, SelectModule, ButtonModule, MasterDropdownComponent],
  templateUrl: './user-export-dialog.component.html',
  styleUrl: './user-export-dialog.component.scss'
})
export class UserExportDialogComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private userService = inject(UserManagementService);
  private messageService = inject(AppMessageService);
  private cdr = inject(ChangeDetectorRef);

  statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Active Only', value: true },
    { label: 'Inactive Only', value: false }
  ];

  // State
  format: 'json' | 'csv' = 'csv';
  departmentId: string | null = null;
  isActive: boolean | null = null;
  isLoading = signal(false);

  close() {
    this.ref.close();
  }

  onExport() {
    this.isLoading.set(true);
    
    const params = {
      format: this.format,
      departmentId: this.departmentId || undefined,
      isActive: this.isActive === null ? undefined : this.isActive
    };

    this.userService.exportUsers(params).pipe(
      finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }), takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `users-export-${timestamp}`;
        
        this.messageService.showSuccess(`Users exported successfully in ${this.format.toUpperCase()} format.`);
        this.handleDownload(response, filename);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  private handleDownload(data: any, filename: string) {
    const isBlob = data instanceof Blob;
    const type = this.format === 'json' ? 'application/json' : 'text/csv';
    
    let blob: Blob;
    if (isBlob) {
      blob = data;
    } else {
      const blobData = this.format === 'json' ? JSON.stringify(data, null, 2) : data;
      blob = new Blob([blobData], { type });
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${filename}.${this.format}`;
    
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    this.ref.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
