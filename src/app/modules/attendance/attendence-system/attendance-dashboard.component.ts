
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, NgModel, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { AttendanceService } from '../services/attendance.service';

@Component({
  selector: 'app-attendance-dashboard',
  imports: [CommonModule,FormsModule,ReactiveFormsModule   ],
  templateUrl: './attendance-dashboard.component.html',
  styleUrls: ['./attendance-dashboard.component.scss'],
  providers: [DatePipe]
})
export class AttendanceDashboardComponent implements OnInit {
  attendanceHistory: any[] = [];
  todayStatus: string = 'Not Punched';
  isLoading = false;
  locationError: string = '';
  regularizeForm: FormGroup;
  showRegularizeModal = false;
  constructor(
    private attendanceService: AttendanceService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    // Initialize Regularization Form
    this.regularizeForm = this.fb.group({
      targetDate: ['', Validators.required],
      type: ['missed_punch', Validators.required],
      newFirstIn: [''],
      newLastOut: [''],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.fetchHistory();
  }

  // ==========================================================
  // 🟢 PUNCH IN / OUT LOGIC
  // ==========================================================
  handlePunch(type: 'in' | 'out') {
    this.isLoading = true;
    this.locationError = '';

    if (!navigator.geolocation) {
      this.locationError = 'Geolocation is not supported by your browser';
      this.isLoading = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const payload = {
          type: type,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };

        this.attendanceService.markAttendance(payload).subscribe({
          next: (res) => {
            alert(`Success: Punched ${type.toUpperCase()} at ${this.datePipe.transform(new Date(), 'shortTime')}`);
            this.fetchHistory(); // Refresh table
            this.isLoading = false;
          },
          error: (err) => {
            alert(`Error: ${err.error.message || 'Punch failed'}`);
            this.isLoading = false;
          }
        });
      },
      (err) => {
        this.locationError = 'Location access denied. Please enable GPS.';
        this.isLoading = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ==========================================================
  // 📅 HISTORY & DATA
  // ==========================================================
  fetchHistory() {
    // Get current month by default
    const currentMonth = new Date().toISOString().slice(0, 7); // "2023-10"

    this.attendanceService.getMyAttendance({ month: currentMonth }).subscribe({
      next: (res) => {
        this.attendanceHistory = res.data;
        // Simple logic to check today's status from logs
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = this.attendanceHistory.find(r => r.date === todayStr);
        if (todayRecord) {
          this.todayStatus = todayRecord.lastOut ? 'Punched Out' : 'Punched In';
        }
      }
    });
  }

  // ==========================================================
  // 📝 REGULARIZATION SUBMISSION
  // ==========================================================
  submitRegularization() {
    if (this.regularizeForm.invalid) return;

    const formVal = this.regularizeForm.value;

    // Construct Payload for Backend
    const payload = {
      targetDate: formVal.targetDate,
      type: formVal.type,
      correction: {
        reason: formVal.reason,
        // Convert time string "09:30" to Full Date Object if needed, or send time string based on backend expectation
        newFirstIn: formVal.newFirstIn ? this.combineDateAndTime(formVal.targetDate, formVal.newFirstIn) : undefined,
        newLastOut: formVal.newLastOut ? this.combineDateAndTime(formVal.targetDate, formVal.newLastOut) : undefined
      }
    };

    this.attendanceService.submitRegularization(payload).subscribe({
      next: () => {
        alert('Request Submitted for Approval');
        this.showRegularizeModal = false;
        this.regularizeForm.reset();
      },
      error: (err) => alert(err.error.message)
    });
  }

  // Helper: Combine "2023-10-25" and "09:00" into ISO String
  private combineDateAndTime(date: string, time: string): string {
    return new Date(`${date}T${time}:00`).toISOString();
  }
}