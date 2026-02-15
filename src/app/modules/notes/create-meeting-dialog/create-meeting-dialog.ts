import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { NoteService } from '../../../core/services/notes.service';
import { MasterListService } from '../../../core/services/master-list.service';

@Component({
  selector: 'app-create-meeting-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-meeting-dialog.html',
  styleUrls: ['./create-meeting-dialog.scss']
})
export class CreateMeetingDialogComponent {
  private fb = inject(FormBuilder);
  private ref = inject(DynamicDialogRef);
  private noteService = inject(NoteService);
  private masterList = inject(MasterListService); // Assuming this service provides the list of users

  // --- State ---
  isSubmitting = signal(false);
  users = computed(() => this.masterList.users() || []);
  searchQuery = signal('');

  // --- Form ---
  meetingForm = this.fb.group({
    title: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    agenda: [''],
    locationType: ['virtual', Validators.required],
    virtualLink: [''],
    location: [''],
    participants: [[] as string[]] // Stores selected user IDs
  }, { validators: this.dateRangeValidator });

  // --- Computed Helpers ---
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const all = this.users();
    const selected = this.meetingForm.value.participants || [];
    
    // Filter by search AND exclude already selected (optional, or just show checked state)
    return all.filter(u => 
      (u.name.toLowerCase().includes(query) || u['email'].toLowerCase().includes(query))
    );
  });

  // --- Validators ---
  dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startTime')?.value;
    const end = group.get('endTime')?.value;
    return start && end && new Date(start) >= new Date(end) ? { invalidRange: true } : null;
  }

  // --- Actions ---
  toggleUser(userId: string) {
    const current = this.meetingForm.value.participants || [];
    const idx = current.indexOf(userId);
    
    let updated;
    if (idx > -1) {
      updated = current.filter(id => id !== userId);
    } else {
      updated = [...current, userId];
    }
    this.meetingForm.patchValue({ participants: updated });
  }

  isSelected(userId: string): boolean {
    return (this.meetingForm.value.participants || []).includes(userId);
  }

  onSubmit() {
    if (this.meetingForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.meetingForm.value;

    // Prepare payload matching backend expectations
    const payload = {
      title: formVal.title,
      startTime: formVal.startTime,
      endTime: formVal.endTime,
      agenda: formVal.agenda,
      locationType: formVal.locationType,
      virtualLink: formVal.locationType === 'virtual' ? formVal.virtualLink : undefined,
      description: formVal.locationType !== 'virtual' ? formVal.location : undefined, // Mapping location text to description or specific field if exists
      participants: (formVal.participants || []).map(uid => ({ user: uid, role: 'attendee' }))
    };

    this.noteService.createMeeting(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.ref.close(res.data.meeting); // Return created meeting to parent
      },
      error: (err) => {
        console.error('Failed to create meeting', err);
        this.isSubmitting.set(false);
      }
    });
  }

  close() {
    this.ref.close();
  }

  getInitials(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}