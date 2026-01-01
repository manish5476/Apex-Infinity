// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-my-requests.component',
//   imports: [],
//   templateUrl: './my-requests.component.html',
//   styleUrl: './my-requests.component.scss',
// })
// export class MyRequestsComponent {

// }
// my-requests.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Services
import { AttendanceService } from '../services/attendance.service';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [DatePipe, MessageService],
  templateUrl: './my-requests.component.html'
})
export class MyRequestsComponent implements OnInit {
  public attendanceService = inject(AttendanceService);
  private messageService = inject(MessageService);
  private datePipe = inject(DatePipe);

  // State
  myRequests = signal<any[]>([]);
  isLoading = signal(false);
  selectedRequest = signal<any>(null);
  showDetailsDialog = signal(false);

  // Status mapping
  statusColors: Record<string, any> = {
  pending: 'warn',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'secondary'
};


  ngOnInit() {
    this.loadMyRequests();
  }

  loadMyRequests() {
    this.isLoading.set(true);
    this.attendanceService.getMyRequests()
      .subscribe({
        next: (res) => {
          this.myRequests.set(res.data || []);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load requests'
          });
          this.isLoading.set(false);
        }
      });
  }

  viewDetails(request: any) {
    this.selectedRequest.set(request);
    this.showDetailsDialog.set(true);
  }

  cancelRequest(requestId: string) {
    // This would require a cancel endpoint in the API
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: 'Cancel functionality would be implemented here'
    });
  }

 getStatusSeverity(status: string): any {
  return this.statusColors[status] ?? 'info';
}


  formatType(type: string): string {
    return type?.replace('_', ' ')?.toUpperCase() || '';
  }
}