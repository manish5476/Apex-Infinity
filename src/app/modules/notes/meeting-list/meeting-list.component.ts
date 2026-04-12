import { Component, inject, signal, computed, ViewEncapsulation, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogService } from 'primeng/dynamicdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip'; // Added for tooltip
import { Meeting } from '../../../core/models/note.types';
import { NoteService } from '../../../core/services/notes.service';
import { AuthService } from '../../auth/services/auth-service';
import { CreateMeetingDialogComponent } from '../create-meeting-dialog/create-meeting-dialog';
import { MeetingDetailsDialogComponent } from '../meeting-details-dialog/meeting-details-dialog.component';
import { AppMessageService } from '../../../core/services/message.service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

// Services & Models

type MeetingFilter = 'upcoming' | 'all' | 'pending' | 'past' | 'cancelled';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePickerModule,
    FormsModule,
    SelectModule,
    ReactiveFormsModule,
    DatePipe,
    TitleCasePipe,
    TooltipModule
  ],
  providers: [DialogService],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './meeting-list.component.html',
  styleUrl: './meeting-list.component.scss'
})
export class MeetingListComponent implements OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private noteService = inject(NoteService);
  private authService = inject(AuthService);
  private dialogService = inject(DialogService);
  private messageService = inject(AppMessageService);


  // --- State ---
  meetings = signal<Meeting[]>([]);
  activeFilter = signal<MeetingFilter>('all');
  isLoading = signal(true);
  today = new Date();

  // Filters
  selectedDate = signal<Date | null>(null);
  selectedStatus = signal<string | null>(null);

  statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  // --- Computed ---
  currentUser = this.authService.currentUser;

  filteredMeetings = computed(() => {
    const filter = this.activeFilter();
    const all = this.meetings();
    const now = new Date();
    const currentUserId = this.currentUser()?._id;

    if (!currentUserId) return [];

    return all.filter(m => {
      if (!m?.startTime) return false;
      const start = new Date(m.startTime);

      // Status Filter logic
      if (this.selectedStatus() && m.status !== this.selectedStatus()) return false;
      if (this.selectedDate()) {
        const sDate = new Date(this.selectedDate()!);
        if (start.getDate() !== sDate.getDate() || start.getMonth() !== sDate.getMonth()) return false;
      }

      switch (filter) {
        case 'cancelled': return m.status === 'cancelled';
        case 'upcoming': return start >= now && m.status !== 'cancelled';
        case 'past': return start < now && m.status !== 'cancelled';
        case 'pending':
          return start >= now &&
            this.getMyRsvp(m) === 'pending' &&
            !this.isOrganizer(m);
        default: return true;
      }
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  });

  counts = computed(() => {
    const all = this.meetings();
    const now = new Date();
    return {
      upcoming: all.filter(m => new Date(m.startTime) >= now && m.status !== 'cancelled').length,
      pending: all.filter(m => new Date(m.startTime) >= now && m.status !== 'cancelled' && this.getMyRsvp(m) === 'pending' && !this.isOrganizer(m)).length
    };
  });

  constructor() {
    this.loadMeetings();
  }

  // --- Logic ---
  setFilter(filter: MeetingFilter) {
    if (this.activeFilter() === filter) return;
    this.activeFilter.set(filter);
  }

  onStatusChange(val: string | null) {
    this.selectedStatus.set(val);
    this.loadMeetings();
  }

  onDateChange(val: Date | null) {
    this.selectedDate.set(val);
    this.loadMeetings();
  }

  resetFilters() {
    this.selectedDate.set(null);
    this.selectedStatus.set(null);
    this.activeFilter.set('all');
    this.loadMeetings();
  }

  openDialog(meeting: Meeting) {
    this.dialogService.open(MeetingDetailsDialogComponent, {
      header: 'Meeting Details',
      width: '650px',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      dismissableMask: true,
      data: meeting,
      // styleClass: 'glass-dialog' // If you have a global class
    });
  }
  isOrganizer(meeting: Meeting): boolean {
    const userId = this.currentUser()?._id;
    if (!userId || !meeting.organizer) return false;
    const orgId = (meeting.organizer as any)._id || meeting.organizer;
    return orgId === userId;
  }

  getOrganizerName(meeting: Meeting): string {
    if (meeting.organizer && typeof meeting.organizer === 'object' && 'name' in meeting.organizer) {
      return (meeting.organizer as any).name;
    }
    return 'Unknown';
  }

  getMyRsvp(meeting: Meeting): string {
    const userId = this.currentUser()?._id;
    if (!userId || !meeting.participants) return 'pending';
    const p = meeting.participants.find((part: any) => {
      const pId = part.user?._id || part.user;
      return pId === userId;
    });
    return p ? (p.invitationStatus || 'pending') : 'pending';
  }

  getDuration(meeting: Meeting): number {
    if (!meeting.startTime || !meeting.endTime) return 0;
    const start = new Date(meeting.startTime).getTime();
    const end = new Date(meeting.endTime).getTime();
    return Math.max(0, Math.round((end - start) / 60000));
  }

  shouldShowRsvp(meeting: Meeting): boolean {
    const isOrg = this.isOrganizer(meeting);
    const myStatus = this.getMyRsvp(meeting);
    return !isOrg && (myStatus === 'pending' || !myStatus) && meeting.status !== 'cancelled';
  }

  // --- Logic ---

  loadMeetings() {
    this.isLoading.set(true);

    const status = this.selectedStatus() || undefined;
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (this.selectedDate()) {
      const d = new Date(this.selectedDate()!);
      d.setHours(0, 0, 0, 0);
      startDate = d.toISOString();
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      endDate = end.toISOString();
    }

    this.noteService.getUserMeetings(status, startDate, endDate).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const data = res?.data?.meetings || [];
        const list = Array.isArray(data) ? data : [data];
        this.meetings.set(list);
        this.isLoading.set(false);
      },
      error: (err) => {
        // Use global handler to show exactly why the load failed
        this.messageService.handleHttpError(err);
        this.meetings.set([]);
        this.isLoading.set(false);
      }
    });
  }

  onCreateMeeting() {
    const ref: any = this.dialogService.open(CreateMeetingDialogComponent, {
      header: 'Schedule Meeting',
      width: '600px',
      contentStyle: { overflow: 'visible' },
      baseZIndex: 1000,
      dismissableMask: true
    });

    ref.onClose.pipe(takeUntil(this.destroy$)).subscribe((meeting: Meeting) => {
      if (meeting) {
        this.messageService.showSuccess('Meeting scheduled successfully.');
        this.meetings.update(prev => [...prev, meeting]);
        this.activeFilter.set('upcoming');
      }
    });
  }

  onRsvp(meetingId: string, response: 'accepted' | 'declined' | 'tentative') {
    this.noteService.rsvpToMeeting(meetingId, response).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        // Single-string success feedback
        this.messageService.showSuccess(`RSVP status updated to ${response}.`);

        this.meetings.update(list => list.map(m => {
          if (m._id !== meetingId) return m;

          const userId = this.currentUser()?._id;
          if (!m.participants || !userId) return m;

          const updatedParticipants = m.participants.map((p: any) => {
            const pId = p.user?._id || p.user;
            if (pId === userId) {
              return { ...p, invitationStatus: response, rsvp: response };
            }
            return p;
          });

          return { ...m, participants: updatedParticipants };
        }));
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  updateStatus(id: string, status: 'in_progress' | 'completed' | 'cancelled') {
    // Note: Consider replacing window.confirm with your confirmationService for a better UI
    if (!confirm(`Change meeting status to ${status}?`)) return;

    this.noteService.updateMeeting(id, { status }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res:any) => {
        if (res.data?.meeting) {
          this.messageService.showSuccess(`Meeting status changed to ${status}.`);
          this.meetings.update(list => list.map(m => m._id === id ? res.data.meeting : m));
        }
      },
      error: (err:any) => this.messageService.handleHttpError(err)
    });
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}



  // loadMeetings() {
  //   this.isLoading.set(true);
    
  //   // Prepare params for API
  //   const status = this.selectedStatus() || undefined;
  //   let startDate: string | undefined;
  //   let endDate: string | undefined;

  //   if (this.selectedDate()) {
  //     const d = new Date(this.selectedDate()!);
  //     d.setHours(0,0,0,0);
  //     startDate = d.toISOString();
  //     const end = new Date(d);
  //     end.setHours(23,59,59,999);
  //     endDate = end.toISOString();
  //   }

  //   this.noteService.getUserMeetings(status, startDate, endDate).subscribe({
  //     next: (res) => {
  //       const data = res?.data?.meetings || [];
  //       const list = Array.isArray(data) ? data : [data];
  //       this.meetings.set(list);
  //       this.isLoading.set(false);
  //     },
  //     error: (err) => {
  //       console.error('Failed to load meetings', err);
  //       this.meetings.set([]);
  //       this.isLoading.set(false);
  //     }
  //   });
  // }

  // NEW: Open Details Dialog
 
  // onCreateMeeting() {
  //   const ref :any  = this.dialogService.open(CreateMeetingDialogComponent, {
  //     header: 'Schedule Meeting',
  //     width: '600px',
  //     contentStyle: { overflow: 'visible' },
  //     baseZIndex: 1000,
  //     dismissableMask: true
  //   });

  //   ref.onClose.subscribe((meeting: Meeting) => {
  //     if (meeting) {
  //       this.meetings.update(prev => [...prev, meeting]);
  //       this.activeFilter.set('upcoming');
  //     }
  //   });
  // }

  // onRsvp(meetingId: string, response: 'accepted' | 'declined' | 'tentative') {
  //   this.noteService.rsvpToMeeting(meetingId, response).subscribe({
  //     next: () => {
  //       this.meetings.update(list => list.map(m => {
  //         if (m._id !== meetingId) return m;
          
  //         const userId = this.currentUser()?._id;
  //         if (!m.participants || !userId) return m;

  //         const updatedParticipants = m.participants.map((p: any) => {
  //           const pId = p.user?._id || p.user;
  //           if (pId === userId) {
  //             return { ...p, invitationStatus: response, rsvp: response };
  //           }
  //           return p;
  //         });

  //         return { ...m, participants: updatedParticipants };
  //       }));
  //     }
  //   });
  // }

  // updateStatus(id: string, status: string) {
  //   if (!confirm(`Change meeting status to ${status}?`)) return;
    
  //   this.noteService.updateMeetingStatus(id, { status }).subscribe({
  //     next: (res) => {
  //       if (res.data?.meeting) {
  //         this.meetings.update(list => list.map(m => m._id === id ? res.data.meeting : m));
  //       }
  //     }
  //   });
  // }

  // --- Helpers ---
 