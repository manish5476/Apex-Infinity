import { Component, inject, signal, computed, ViewEncapsulation, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

import { NoteService } from '../../../core/services/notes.service';
import { MasterListService } from '../../../core/services/master-list.service';
import { AppMessageService } from '../../../core/services/message.service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-create-meeting-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    DatePickerModule, 
    SelectModule, 
    TextareaModule, 
    InputTextModule, 
    ButtonModule,
    CheckboxModule
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './create-meeting-dialog.html',
  styleUrl:'./create-meeting-dialog.scss'
})
export class CreateMeetingDialogComponent implements OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private ref = inject(DynamicDialogRef);
  private noteService = inject(NoteService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);

  // --- State ---
  isSubmitting = signal(false);
  users = computed(() => this.masterList.users() || []);
  searchQuery = signal('');
  constructor(private cdr: ChangeDetectorRef) {}

  locationOptions = [
    { label: 'Virtual Meeting', value: 'virtual' },
    { label: 'Physical Location', value: 'physical' },
    { label: 'Hybrid', value: 'hybrid' }
  ];

  // --- Form ---
  meetingForm = this.fb.group({
    title: ['', Validators.required],
    startTime: [null as Date | null, Validators.required],
    endTime: [null as Date | null, Validators.required],
    agenda: [''],
    locationType: ['virtual', Validators.required],
    virtualLink: [''],
    location: [''],
    participants: [[] as string[]]
  }, { validators: this.dateRangeValidator });

  // --- Computed Helpers ---
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const all = this.users();
    // Simple filter
    return all.filter(u => 
      u.name.toLowerCase().includes(query) || 
      (u['email'] && u['email'].toLowerCase().includes(query))
    );
  });

  selectedCount = computed(() => {
    return (this.meetingForm.get('participants')?.value || []).length;
  });

  // --- Validators ---
  dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startTime')?.value;
    const end = group.get('endTime')?.value;
    return start && end && new Date(start) >= new Date(end) ? { invalidRange: true } : null;
  }

  // --- Actions ---
  toggleUser(userId: string) {
    const current = this.meetingForm.get('participants')?.value || [];
    const idx = current.indexOf(userId);
    
    let updated;
    if (idx > -1) {
      updated = current.filter((id: string) => id !== userId);
    } else {
      updated = [...current, userId];
    }
    this.meetingForm.patchValue({ participants: updated });
    this.meetingForm.markAsDirty();
  }

  isSelected(userId: string): boolean {
    const current = this.meetingForm.get('participants')?.value || [];
    return current.includes(userId);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.meetingForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

onSubmit() {
    if (this.meetingForm.invalid) {
      this.meetingForm.markAllAsTouched();
      this.messageService.showWarn('Validation Error: Please fill in all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.meetingForm.value;

    // Fix: Use nullish coalescing to ensure these are at least empty strings
    const locationType = formVal.locationType ?? '';

    const payload = {
      title: formVal.title ?? '',
      startTime: formVal.startTime,
      endTime: formVal.endTime,
      agenda: formVal.agenda,
      locationType: locationType,
      virtualLink: ['virtual', 'hybrid'].includes(locationType) ? formVal.virtualLink : undefined,
      physicalLocation: ['physical', 'hybrid'].includes(locationType) ? formVal.location : undefined,
      participants: (formVal.participants || []).map((uid: string) => ({ user: uid, role: 'attendee' }))
    };

    this.noteService.createMeeting(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.messageService.showSuccess('Meeting scheduled successfully.');
        this.ref.close(res.data.meeting);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.messageService.handleHttpError(err);
        this.cdr.markForCheck();
      }
    });
  }
  
  close() {
    this.ref.close();
  }

  // --- Utils ---
  getInitials(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  getAvatarColor(name: string): string {
    const colors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#22d3ee', '#818cf8', '#c084fc', '#f472b6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}