import { Component, inject, signal, computed, ViewEncapsulation } from '@angular/core';
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
  template: `
    <div class="create-meeting-container">
      <form [formGroup]="meetingForm" (ngSubmit)="onSubmit()" class="meeting-form">
        
        <!-- ==================== MAIN FORM GRID ==================== -->
        <div class="form-section main-details">
          
          <!-- Title -->
          <div class="field full-width">
            <label for="title" class="required">Meeting Title</label>
            <input pInputText id="title" formControlName="title" placeholder="e.g., Q4 Roadmap Planning" [class.ng-invalid]="isFieldInvalid('title')" />
            @if (isFieldInvalid('title')) {
              <small class="error-text">Title is required</small>
            }
          </div>

          <!-- Date & Time Row -->
          <div class="form-row">
            <div class="field">
              <label for="startTime" class="required">Start Time</label>
              <p-datepicker 
                id="startTime" 
                formControlName="startTime" 
                [showTime]="true" 
                [showIcon]="true"
                hourFormat="12" 
                appendTo="body"
                placeholder="Select start"
                styleClass="w-full">
              </p-datepicker>
            </div>
            <div class="field">
              <label for="endTime" class="required">End Time</label>
              <p-datepicker 
                id="endTime" 
                formControlName="endTime" 
                [showTime]="true" 
                [showIcon]="true" 
                hourFormat="12"
                appendTo="body" 
                placeholder="Select end"
                styleClass="w-full">
              </p-datepicker>
            </div>
          </div>
          @if (meetingForm.errors?.['invalidRange'] && (meetingForm.touched || meetingForm.dirty)) {
            <small class="error-text">End time must be after start time</small>
          }

          <!-- Location Row -->
          <div class="form-row">
            <div class="field">
              <label for="locationType">Location Type</label>
              <p-select 
                id="locationType"
                [options]="locationOptions"
                formControlName="locationType"
                optionLabel="label"
                optionValue="value"
                styleClass="w-full"
                appendTo="body">
              </p-select>
            </div>

            <!-- Conditional: Virtual Link -->
            @if (meetingForm.get('locationType')?.value === 'virtual') {
              <div class="field">
                <label for="virtualLink">Video Link</label>
                <div class="p-input-icon-left w-full">
                  <i class="pi pi-link"></i>
                  <input pInputText id="virtualLink" formControlName="virtualLink" placeholder="Zoom/Meet URL" class="w-full" />
                </div>
              </div>
            }

            <!-- Conditional: Physical Location -->
            @if (meetingForm.get('locationType')?.value === 'physical') {
              <div class="field">
                <label for="location">Room / Address</label>
                <div class="p-input-icon-left w-full">
                  <i class="pi pi-map-marker"></i>
                  <input pInputText id="location" formControlName="location" placeholder="Conference Room A" class="w-full" />
                </div>
              </div>
            }
          </div>

          <!-- Agenda -->
          <div class="field full-width">
            <label for="agenda">Agenda / Description</label>
            <textarea pTextarea id="agenda" formControlName="agenda" rows="3" placeholder="What are we discussing?" class="w-full"></textarea>
          </div>
        </div>

        <!-- ==================== PARTICIPANTS SECTION ==================== -->
        <div class="form-section participants-section">
          <div class="section-header">
            <label>Invite Participants ({{ selectedCount() }})</label>
            <span class="p-input-icon-left search-box">
              <i class="pi pi-search"></i>
              <input type="text" pInputText [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" [ngModelOptions]="{standalone: true}" placeholder="Search users..." class="p-inputtext-sm" />
            </span>
          </div>

          <div class="participants-list custom-scrollbar">
            @for (user of filteredUsers(); track user._id) {
              <div class="user-item" [class.selected]="isSelected(user._id)" (click)="toggleUser(user._id)">
                <div class="avatar" [style.background-color]="getAvatarColor(user.name)">
                  {{ getInitials(user.name) }}
                </div>
                <div class="user-info">
                  <span class="name">{{ user.name }}</span>
                  <span class="email">{{ user['email'] }}</span>
                </div>
                <div class="checkbox">
                  <i class="pi" [class.pi-check-circle]="isSelected(user._id)" [class.pi-circle]="!isSelected(user._id)"></i>
                </div>
              </div>
            }
            @if (filteredUsers().length === 0) {
              <div class="empty-search">No users found</div>
            }
          </div>
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <p-button label="Cancel" styleClass="p-button-text p-button-secondary" (onClick)="close()"></p-button>
          <p-button label="Schedule Meeting" icon="pi pi-calendar-plus" [loading]="isSubmitting()" type="submit"></p-button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .create-meeting-container {
      padding: 0.5rem;
    }

    .meeting-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xl);
    }

    /* Grid Layout */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      &.full-width {
        grid-column: 1 / -1;
      }

      label {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--text-secondary);

        &.required::after {
          content: " *";
          color: var(--color-error);
        }
      }
    }

    /* PrimeNG Overrides for Alignment */
    .w-full { width: 100%; }
    
    .p-datepicker { 
      width: 100%; 
      .p-inputtext { width: 100%; }
    }
    
    .p-select { width: 100%; }

    /* Strict alignment for Input Icons */
    .p-input-icon-left {
      position: relative;
      display: block;
      width: 100%;
    }
    
    .p-input-icon-left > i {
      position: absolute;
      top: 50%;
      margin-top: -0.5rem; /* Exactly half of icon height (assuming 1rem icon) */
      left: 0.75rem;
      color: var(--text-tertiary);
      z-index: 1;
    }

    .p-input-icon-left > input {
      padding-left: 2.5rem;
      width: 100%;
    }

    .error-text {
      color: var(--color-error);
      font-size: var(--font-size-xs);
    }

    /* Participants Section */
    .participants-section {
      border-top: 1px solid var(--border-secondary);
      padding-top: var(--spacing-lg);
      margin-top: var(--spacing-md);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);

      label {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-bold);
        color: var(--text-secondary);
        text-transform: uppercase;
      }

      .search-box {
        position: relative;
        display: block;
      }
      
      .search-box i {
        position: absolute;
        top: 50%;
        margin-top: -0.5rem;
        left: 0.75rem;
        color: var(--text-tertiary);
        z-index: 1;
      }

      .search-box input {
        width: 200px;
        padding-left: 2.25rem;
        padding-top: 6px;
        padding-bottom: 6px;
      }
    }

    .participants-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      background: var(--bg-secondary);
    }

    .user-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      transition: background-color 0.2s;
      border-bottom: 1px solid var(--border-secondary);

      &:last-child { border-bottom: none; }
      &:hover { background-color: var(--bg-hover); }
      &.selected { background-color: color-mix(in srgb, var(--accent-primary) 5%, transparent); }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        
        .name { font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary); }
        .email { font-size: var(--font-size-xs); color: var(--text-tertiary); }
      }

      .checkbox i {
        color: var(--text-tertiary);
        font-size: 1.2rem;
        &.pi-check-circle { color: var(--accent-primary); }
      }
    }

    .empty-search {
      padding: 16px;
      text-align: center;
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
    }

    /* Footer */
    .dialog-footer {
      margin-top: var(--spacing-xl);
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--border-secondary);
    }

    /* Scrollbar */
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--border-secondary); border-radius: 3px; }
  `]
})
export class CreateMeetingDialogComponent {
  private fb = inject(FormBuilder);
  private ref = inject(DynamicDialogRef);
  private noteService = inject(NoteService);
  private masterList = inject(MasterListService);

  // --- State ---
  isSubmitting = signal(false);
  users = computed(() => this.masterList.users() || []);
  searchQuery = signal('');

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
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.meetingForm.value;

    // Mapping payload
    const payload = {
      title: formVal.title,
      startTime: formVal.startTime,
      endTime: formVal.endTime,
      agenda: formVal.agenda,
      locationType: formVal.locationType,
      virtualLink: formVal.locationType === 'virtual' || formVal.locationType === 'hybrid' ? formVal.virtualLink : undefined,
      physicalLocation: formVal.locationType === 'physical' || formVal.locationType === 'hybrid' ? formVal.location : undefined,
      // Map participants to object structure
      participants: (formVal.participants || []).map((uid: string) => ({ user: uid, role: 'attendee' }))
    };

    this.noteService.createMeeting(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.ref.close(res.data.meeting);
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
}