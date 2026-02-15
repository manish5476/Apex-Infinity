import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog'; 
import { Meeting } from '../../core/models/note.types';
import { NoteService } from '../../core/services/notes.service';
import { AuthService } from '../auth/services/auth-service';
import { CreateMeetingDialogComponent } from './create-meeting-dialog/create-meeting-dialog';
import { DatePicker, DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

type MeetingFilter = 'upcoming' |'all'| 'pending' | 'past' | 'cancelled';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [CommonModule, RouterModule,DatePickerModule,FormsModule,SelectModule, ReactiveFormsModule, DatePipe],
  providers: [DialogService],
  template: `
    <div class="meeting-dashboard">
      
      <!-- ==================== SIDEBAR ==================== -->
      <aside class="sidebar">
        <div class="action-section">
          <button class="btn-create" (click)="onCreateMeeting()">
            <i class="pi pi-plus"></i> Schedule Meeting
          </button>
        </div>

        <nav class="nav-menu">
          <label>Schedule</label>
          <button class="nav-item"
        [class.active]="activeFilter() === 'all'"
        (click)="setFilter('all')">

  <i class="pi pi-list"></i>
  All Meetings
</button>

          <button class="nav-item" [class.active]="activeFilter() === 'upcoming'" (click)="setFilter('upcoming')">
            <i class="pi pi-calendar"></i> Upcoming
            <span class="badge">{{ counts().upcoming }}</span>
          </button>
          <button class="nav-item" [class.active]="activeFilter() === 'pending'" (click)="setFilter('pending')">
            <i class="pi pi-question-circle"></i> Pending RSVP
            <span class="badge warning">{{ counts().pending }}</span>
          </button>
          <button class="nav-item" [class.active]="activeFilter() === 'past'" (click)="setFilter('past')">
            <i class="pi pi-history"></i> Past Meetings
          </button>
          <button class="nav-item" [class.active]="activeFilter() === 'cancelled'" (click)="setFilter('cancelled')">
            <i class="pi pi-times-circle"></i> Cancelled
          </button>
        </nav>
      </aside>

      <!-- ==================== MAIN CONTENT ==================== -->
      <main class="content">
    <header class="top-bar glass-panel">

  <div class="title-group">
    <h2>Meetings Dashboard</h2>
    <span class="date-today">
      {{ today | date:'fullDate' }}
    </span>
  </div>

  <div class="controls">

    <!-- Status filter -->
    <p-select
      [options]="[{label:'All', value:null},{label:'Scheduled', value:'scheduled'},{label:'Completed', value:'completed'},{label:'Cancelled', value:'cancelled'}      ]"
      [ngModel]="selectedStatus()"
      (ngModelChange)="selectedStatus.set($event); loadMeetings()"
      placeholder="Status"
      class="filter-dd">
    </p-select>

    <!-- Date filter -->
    <p-datepicker
      [ngModel]="selectedDate()"
      (ngModelChange)="selectedDate.set($event); loadMeetings()"
      showIcon
      placeholder="Filter date"
      inputStyleClass="datepicker-input">
    </p-datepicker>

    <!-- Reset -->
    <button class="btn-sm"
            (click)="selectedDate.set(null);
                     selectedStatus.set(null);
                     loadMeetings()">
      Reset
    </button>

    <!-- Refresh -->
    <button class="btn-icon"
            (click)="loadMeetings()">
      <i class="pi pi-refresh"
         [class.spin]="isLoading()">
      </i>
    </button>

  </div>

</header>

        <div class="meetings-grid custom-scrollbar">
          @if (isLoading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Syncing schedule...</p>
            </div>
          }

          @if (!isLoading() && filteredMeetings().length === 0) {
            <div class="empty-state">
              <i class="pi pi-calendar-times"></i>
              <h3>No meetings found</h3>
              <p>
                @if (activeFilter() === 'upcoming') { You have no upcoming meetings. }
                @else if (activeFilter() === 'pending') { You're all caught up on RSVPs! }
@else if (activeFilter() === 'all') {
  No meetings found.
}
@else {
  No {{ activeFilter() }} meetings found.
}
              </p>
              @if (activeFilter() === 'upcoming') {
                <button class="btn-link" (click)="onCreateMeeting()">Schedule one now</button>
              }
            </div>
          }

          @for (meeting of filteredMeetings(); track meeting._id) {
            <div class="meeting-card glass-panel" [class.cancelled]="meeting.status === 'cancelled'">
              
              <!-- Date Strip -->
              <div class="date-strip">
                <span class="month">{{ meeting.startTime | date:'MMM' }}</span>
                <span class="day">{{ meeting.startTime | date:'dd' }}</span>
                <span class="time">{{ meeting.startTime | date:'shortTime' }}</span>
              </div>

              <!-- Content -->
              <div class="card-content">
                <div class="header">
                  <h3 class="title">{{ meeting.title }}</h3>
                  
                  <!-- Extended Status Badges -->
                  @if (meeting.status === 'cancelled') {
                    <span class="status-badge error">Cancelled</span>
                  } @else if (meeting.status === 'completed') {
                    <span class="status-badge success">Completed</span>
                  } @else if (meeting.status === 'in-progress') {
                    <span class="status-badge progress">In Progress</span>
                  } @else if (meeting.status === 'postponed') {
                    <span class="status-badge warning">Postponed</span>
                  }
                </div>

                <div class="meta-info">
                  <div class="row">
                    <i class="pi pi-clock"></i>
                    <span>{{ getDuration(meeting) }} mins &bull; {{ meeting.endTime | date:'shortTime' }}</span>
                  </div>
                  
                  <!-- Enhanced Location Handling (Physical/Virtual/Hybrid) -->
                  <div class="row location-row">
                    @if (meeting.locationType === 'virtual') {
                      <i class="pi pi-video"></i>
                      <a [href]="meeting.virtualLink || '#'" target="_blank" (click)="$event.stopPropagation()">Virtual Link</a>
                    } 
                    @else if (meeting.locationType === 'physical') {
                      <i class="pi pi-map-marker"></i>
                      <span>{{ meeting.physicalLocation || 'In Person' }}</span>
                    }
                    @else if (meeting.locationType === 'hybrid') {
                      <div class="hybrid-info">
                        <span class="loc"><i class="pi pi-map-marker"></i> {{ meeting.physicalLocation || 'Hybrid' }}</span>
                        <span class="sep">&bull;</span>
                        <a [href]="meeting.virtualLink || '#'" target="_blank" (click)="$event.stopPropagation()"><i class="pi pi-video"></i> Join</a>
                      </div>
                    }
                  </div>

                  <div class="row organizer">
                    <i class="pi pi-user"></i>
                    <span>Host: {{ getOrganizerName(meeting) }}</span>
                  </div>
                </div>

                <!-- Footer / Actions -->
                <div class="card-actions">
                  
                  <!-- 1. PENDING RSVP ACTIONS -->
                  @if (shouldShowRsvp(meeting)) {
                    <div class="rsvp-group">
                      <span class="label">RSVP:</span>
                      <button class="btn-rsvp accept" (click)="onRsvp(meeting._id, 'accepted')" title="Accept">
                        <i class="pi pi-check"></i>
                      </button>
                      <button class="btn-rsvp tentative" (click)="onRsvp(meeting._id, 'tentative')" title="Tentative">
                        <i class="pi pi-question"></i>
                      </button>
                      <button class="btn-rsvp decline" (click)="onRsvp(meeting._id, 'declined')" title="Decline">
                        <i class="pi pi-times"></i>
                      </button>
                    </div>
                  } 
                  <!-- 2. ORGANIZER ACTIONS -->
                  @else if (isOrganizer(meeting) && meeting.status === 'scheduled') {
                    <div class="org-actions">
                      <span class="role-badge">Organizer</span>
                      <div class="btn-group">
                        <button class="btn-sm" (click)="updateStatus(meeting._id, 'in-progress')">Start</button>
                        <button class="btn-sm" (click)="updateStatus(meeting._id, 'completed')">Finish</button>
                        <button class="btn-sm danger" (click)="updateStatus(meeting._id, 'cancelled')">Cancel</button>
                      </div>
                    </div>
                  }
                  <!-- 3. VIEW ONLY STATUS -->
                  @else {
                    <div class="my-status">
                      <span class="response-badge" [ngClass]="getMyRsvp(meeting)">
                        {{ getMyRsvp(meeting) | titlecase }}
                      </span>
                    </div>
                  }

                </div>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; background: var(--bg-primary); color: var(--text-primary); }
    .meeting-dashboard { display: flex; height: 100%; }

    /* Sidebar */
    .sidebar {
      width: 260px; background: var(--bg-secondary); border-right: 1px solid var(--border-secondary);
      display: flex; flex-direction: column; padding: 20px; gap: 24px;
      
      .btn-create {
        width: 100%; background: var(--accent-primary); color: white; border: none; padding: 12px;
        border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
        transition: transform 0.2s; &:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
      }

      .nav-menu {
        display: flex; flex-direction: column; gap: 4px;
        label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-tertiary); margin-bottom: 8px; padding-left: 12px; }
        
        .nav-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: none; background: transparent;
          color: var(--text-secondary); border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
          text-align: left; transition: all 0.2s;
          
          i { font-size: 1.1em; }
          &:hover { background: var(--bg-ternary); color: var(--text-primary); }
          &.active { background: #eff6ff; color: var(--accent-primary); font-weight: 600; }
          
          .badge { margin-left: auto; font-size: 10px; background: var(--bg-ternary); padding: 2px 8px; border-radius: 10px; color: var(--text-secondary); }
          .badge.warning { background: #fff7ed; color: #c2410c; }
        }
      }
    }

    /* Content */
    .content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    
    .top-bar {
      height: 70px; display: flex; align-items: center; justify-content: space-between; padding: 0 32px;
      border-bottom: 1px solid var(--border-secondary);
      .title-group {
        h2 { font-size: 20px; font-weight: 700; margin: 0; }
        .date-today { font-size: 12px; color: var(--text-tertiary); }
      }
      .btn-icon { background: none; border: 1px solid var(--border-secondary); width: 36px; height: 36px; border-radius: 8px; cursor: pointer; color: var(--text-secondary); &:hover { color: var(--text-primary); background: var(--bg-ternary); } }
      .spin { animation: spin 1s linear infinite; }
    }

    .meetings-grid {
      flex: 1; overflow-y: auto; padding: 32px; display: grid; gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      align-content: start;
    }

    /* Meeting Card */
    .meeting-card {
      display: flex; background: var(--bg-secondary); border: 1px solid var(--border-secondary);
      border-radius: 12px; overflow: hidden; transition: all 0.2s;
      
      &:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: var(--accent-primary); }
      &.cancelled { opacity: 0.7; filter: grayscale(0.5); }

      .date-strip {
        width: 70px; background: var(--bg-ternary); display: flex; flex-direction: column;
        align-items: center; justify-content: center; padding: 16px 0; border-right: 1px solid var(--border-secondary);
        
        .month { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-tertiary); }
        .day { font-size: 24px; font-weight: 800; color: var(--text-primary); line-height: 1; margin: 4px 0; }
        .time { font-size: 11px; color: var(--text-secondary); }
      }

      .card-content {
        flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 12px;
        
        .header {
          display: flex; justify-content: space-between; align-items: flex-start;
          .title { font-size: 16px; font-weight: 600; margin: 0; line-height: 1.3; }
          .status-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: 700; 
            &.error { background: #fee2e2; color: #ef4444; }
            &.success { background: #dcfce7; color: #16a34a; }
            &.progress { background: #dbeafe; color: #1e40af; }
            &.warning { background: #fff7ed; color: #c2410c; }
          }
        }

        .meta-info {
          display: flex; flex-direction: column; gap: 6px;
          .row { 
            display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary);
            i { font-size: 12px; color: var(--text-tertiary); width: 14px; }
            a { color: var(--accent-primary); text-decoration: none; &:hover { text-decoration: underline; } }
          }
          .hybrid-info {
             display: flex; align-items: center; gap: 6px;
             .sep { opacity: 0.5; }
          }
        }

        .card-actions {
          margin-top: auto; padding-top: 12px; border-top: 1px dashed var(--border-secondary);
          display: flex; justify-content: space-between; align-items: center;
          height: 40px;
          
          .rsvp-group {
            display: flex; align-items: center; gap: 8px;
            .label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; }
            .btn-rsvp {
              width: 28px; height: 28px; border-radius: 50%; border: 1px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: 0.2s;
              &.accept { background: #dcfce7; color: #16a34a; &:hover { background: #16a34a; color: white; } }
              &.tentative { background: #ffedd5; color: #f97316; &:hover { background: #f97316; color: white; } }
              &.decline { background: #fee2e2; color: #ef4444; &:hover { background: #ef4444; color: white; } }
            }
          }

          .my-status {
            font-size: 11px; font-weight: 600; width: 100%;
            .role-badge { color: var(--text-tertiary); background: var(--bg-ternary); padding: 4px 8px; border-radius: 4px; }
            .response-badge { 
              padding: 4px 8px; border-radius: 4px; display: block; text-align: center; background: var(--bg-ternary);
              &.accepted { background: #dcfce7; color: #15803d; }
              &.declined { background: #fee2e2; color: #b91c1c; }
              &.tentative { background: #ffedd5; color: #c2410c; }
              &.pending { background: #f1f5f9; color: #64748b; }
            }
          }

          .org-actions {
            display: flex; justify-content: space-between; width: 100%; align-items: center;
            .role-badge { font-size: 10px; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase; }
            .btn-group { display: flex; gap: 6px; }
            .btn-sm {
              font-size: 10px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-secondary); background: transparent; cursor: pointer; font-weight: 600; color: var(--text-secondary);
              &:hover { background: var(--bg-ternary); color: var(--text-primary); }
              &.danger:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }
            }
          }
        }
      }
    }

    /* Utilities */
    .loading-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); .spinner { width: 30px; height: 30px; border: 3px solid var(--border-secondary); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; } }
    .empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); i { font-size: 3rem; margin-bottom: 16px; opacity: 0.3; } h3 { color: var(--text-primary); margin: 0 0 8px 0; } .btn-link { background: none; border: none; color: var(--accent-primary); text-decoration: underline; cursor: pointer; } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class MeetingListComponent {
  private noteService = inject(NoteService);
  private authService = inject(AuthService);
  private dialogService = inject(DialogService); // Inject Service
  private fb = inject(FormBuilder);

  // --- State ---
  meetings = signal<Meeting[]>([]);
activeFilter = signal<MeetingFilter>('all');
  isLoading = signal(true);
  today = new Date();

  // --- Computed ---
  currentUser = toSignal(this.authService.currentUser$);

  // filteredMeetings = computed(() => {
  //   const filter = this.activeFilter();
  //   const all = this.meetings();
  //   const now = new Date();

  //   return all.filter(m => {
  //     const start = new Date(m.startTime);
  //     if (filter === 'cancelled') return m.status === 'cancelled';
  //     if (m.status === 'cancelled') return false; 

  //     if (filter === 'upcoming') return start >= now;
  //     if (filter === 'past') return start < now;
  //     if (filter === 'pending') {
  //       return start >= now && this.getMyRsvp(m) === 'pending' && !this.isOrganizer(m);
  //     }
  //     return true;
  //   }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  // });
filteredMeetings = computed(() => {
  const filter = this.activeFilter();
  const all = this.meetings();
  const now = new Date();

  return all.filter(m => {
    if (!m?.startTime) return false;

    const start = new Date(m.startTime);

    switch (filter) {
      case 'all':
        return true;

      case 'cancelled':
        return m.status === 'cancelled';

      case 'upcoming':
        return start >= now && m.status !== 'cancelled';

      case 'past':
        return start < now && m.status !== 'cancelled';

      case 'pending':
        return (
          start >= now &&
          this.getMyRsvp(m) === 'pending' &&
          !this.isOrganizer(m)
        );

      default:
        return true;
    }
  }).sort((a, b) =>
    new Date(a.startTime).getTime() -
    new Date(b.startTime).getTime()
  );
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

  // --- Actions ---
  setFilter(filter: MeetingFilter) {
    if (this.activeFilter() === filter) return;
    this.activeFilter.set(filter);
    this.loadMeetings();
  }

selectedDate = signal<Date | null>(null);
selectedStatus = signal<string | null>(null);

onDateSelect(date: Date | null) {
  this.selectedDate.set(date);
  this.loadMeetings(); // or call filtered logic if needed
}

loadMeetings() {
  this.isLoading.set(true);

  let status: string | undefined;
  let startDate: string | undefined;
  let endDate: string | undefined;

  const pickedDate = this.selectedDate();
  const pickedStatus = this.selectedStatus();

  // ✅ Status filter
  if (pickedStatus) {
    status = pickedStatus;
  }

  // ✅ Date filter
  if (pickedDate) {
    const iso = new Date(pickedDate).toISOString();
    startDate = iso;
    endDate = iso;
  }

  this.noteService.getUserMeetings(status, startDate, endDate).subscribe({
    next: (res) => {

      let fetched: any[] = [];

      if (Array.isArray(res?.data?.meetings)) {
        fetched = res.data.meetings;
      } else if (res?.data?.meetings) {
        fetched = [res.data.meetings];
      }

  fetched.sort((a, b) => {
  const t1 = new Date(a?.startTime || 0).getTime();
  const t2 = new Date(b?.startTime || 0).getTime();
  return t1 - t2;
});


      this.meetings.set(fetched);
      this.isLoading.set(false);
    },

    error: err => {
      console.error('Load failed', err);
      this.meetings.set([]);
      this.isLoading.set(false);
    }
  });
}


  onCreateMeeting() {
    const ref:any = this.dialogService.open(CreateMeetingDialogComponent, {
       header: 'Schedule Meeting',
      width: '70%',
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      contentStyle: { overflow: 'visible' },
      baseZIndex: 10000,
      // header: 'Schedule Meeting',
      // width: '500px',
      // contentStyle: { overflow: 'visible' },
      // baseZIndex: 10000,
      // dismissableMask: true
    });

    ref.onClose.subscribe((meeting: Meeting) => {
      if (meeting) {
        // If the new meeting matches the current filter, add it
        // Or simpler: just reload or append to upcoming
        this.meetings.update(ms => [...ms, meeting]);
        if (this.activeFilter() !== 'upcoming') {
          this.setFilter('upcoming');
        }
      }
    });
  }

  updateStatus(id: string, status: string) {
    if (!confirm(`Mark meeting as ${status}?`)) return;
    this.noteService.updateMeetingStatus(id, { status }).subscribe({
      next: (res) => {
        this.updateLocalMeeting(res.data.meeting);
      }
    });
  }

  onRsvp(id: string, response: 'accepted' | 'declined' | 'tentative') {
    this.noteService.rsvpToMeeting(id, response).subscribe({
      next: () => {
        this.meetings.update(list => list.map(m => {
          if (m._id !== id) return m;
          const user = this.currentUser();
          if (!user || !m.participants) return m;
          
          const updatedParticipants = m.participants.map(p => {
             const pUserId = typeof p.user === 'string' ? p.user : p.user._id;
             if (pUserId === user._id) {
               return { ...p, rsvp: response, invitationStatus: response } as any; 
             }
             return p;
          });
          
          if (this.activeFilter() === 'pending') {
             setTimeout(() => this.loadMeetings(), 500); 
          }
          
          return { ...m, participants: updatedParticipants };
        }));
      }
    });
  }

  // --- Helpers ---
  updateLocalMeeting(updated: Meeting) {
    this.meetings.update(list => list.map(m => m._id === updated._id ? updated : m));
  }

  isOrganizer(meeting: Meeting): boolean {
    const user = this.currentUser();
    if (!user) return false;
    const orgId = typeof meeting.organizer === 'string' ? meeting.organizer : meeting.organizer._id;
    return orgId === user._id;
  }

  getMyRsvp(meeting: Meeting): string {
    const user = this.currentUser();
    if (!user || !meeting.participants) return 'unknown';
    
    const p: any = meeting.participants.find(part => {
      const partId = typeof part.user === 'string' ? part.user : part.user._id;
      return partId === user._id;
    });
    // Schema preferred: invitationStatus
    return p ? (p.invitationStatus || p.rsvp) : 'unknown';
  }

  getOrganizerName(meeting: Meeting): string {
    if (meeting.organizer && typeof meeting.organizer === 'object' && 'name' in meeting.organizer) {
      return meeting.organizer.name;
    }
    return 'Unknown';
  }

  getDuration(meeting: Meeting): number {
    const start = new Date(meeting.startTime).getTime();
    const end = new Date(meeting.endTime).getTime();
    return Math.round((end - start) / 60000); 
  }

  shouldShowRsvp(meeting: Meeting): boolean {
    const myStatus = this.getMyRsvp(meeting);
    return !this.isOrganizer(meeting) && 
           (myStatus === 'pending' || !myStatus) && 
           meeting.status === 'scheduled';
  }
}

// import { Component, inject, signal, computed, effect } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { toSignal } from '@angular/core/rxjs-interop';
// import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
// import { DialogService } from 'primeng/dynamicdialog';
// import { Meeting } from '../../core/models/note.types';
// import { NoteService } from '../../core/services/notes.service';
// import { AuthService } from '../auth/services/auth-service';
// import { CreateMeetingDialogComponent } from './create-meeting-dialog/create-meeting-dialog';
// type MeetingFilter = 'upcoming' | 'pending' | 'past' | 'cancelled';

// @Component({
//   selector: 'app-meeting-list',
//   standalone: true,
//   imports: [CommonModule, RouterModule, ReactiveFormsModule, DatePipe],
//   providers: [DialogService], // PROVIDER ADDED HERE
//   template: `
//     <div class="meeting-dashboard">
      
//       <!-- ==================== SIDEBAR ==================== -->
//       <aside class="sidebar">
//         <div class="action-section">
//           <button class="btn-create" (click)="onCreateMeeting()">
//             <i class="pi pi-plus"></i> Schedule Meeting
//           </button>
//         </div>

//         <nav class="nav-menu">
//           <label>Schedule</label>
//           <button class="nav-item" [class.active]="activeFilter() === 'upcoming'" (click)="setFilter('upcoming')">
//             <i class="pi pi-calendar"></i> Upcoming
//             <span class="badge">{{ counts().upcoming }}</span>
//           </button>
//           <button class="nav-item" [class.active]="activeFilter() === 'pending'" (click)="setFilter('pending')">
//             <i class="pi pi-question-circle"></i> Pending RSVP
//             <span class="badge warning">{{ counts().pending }}</span>
//           </button>
//           <button class="nav-item" [class.active]="activeFilter() === 'past'" (click)="setFilter('past')">
//             <i class="pi pi-history"></i> Past Meetings
//           </button>
//           <button class="nav-item" [class.active]="activeFilter() === 'cancelled'" (click)="setFilter('cancelled')">
//             <i class="pi pi-times-circle"></i> Cancelled
//           </button>
//         </nav>
//       </aside>

//       <!-- ==================== MAIN CONTENT ==================== -->
//       <main class="content">
//         <header class="top-bar glass-panel">
//           <div class="title-group">
//             <h2>
//               @switch (activeFilter()) {
//                 @case ('upcoming') { Upcoming Meetings }
//                 @case ('pending') { Awaiting Response }
//                 @case ('past') { Meeting History }
//                 @case ('cancelled') { Cancelled Meetings }
//               }
//             </h2>
//             <span class="date-today">{{ today | date:'fullDate' }}</span>
//           </div>
          
//           <div class="controls">
//             <button class="btn-icon" (click)="loadMeetings()" title="Refresh">
//               <i class="pi pi-refresh" [class.spin]="isLoading()"></i>
//             </button>
//           </div>
//         </header>

//         <div class="meetings-grid custom-scrollbar">
//           @if (isLoading()) {
//             <div class="loading-state">
//               <div class="spinner"></div>
//               <p>Syncing schedule...</p>
//             </div>
//           }

//           @if (!isLoading() && filteredMeetings().length === 0) {
//             <div class="empty-state">
//               <i class="pi pi-calendar-times"></i>
//               <h3>No meetings found</h3>
//               <p>
//                 @if (activeFilter() === 'upcoming') { You have no upcoming meetings. }
//                 @else if (activeFilter() === 'pending') { You're all caught up on RSVPs! }
//                 @else { No {{ activeFilter() }} meetings found. }
//               </p>
//               @if (activeFilter() === 'upcoming') {
//                 <button class="btn-link" (click)="onCreateMeeting()">Schedule one now</button>
//               }
//             </div>
//           }

//           @for (meeting of filteredMeetings(); track meeting._id) {
//             <div class="meeting-card glass-panel" [class.cancelled]="meeting.status === 'cancelled'">
              
//               <!-- Date Strip -->
//               <div class="date-strip">
//                 <span class="month">{{ meeting.startTime | date:'MMM' }}</span>
//                 <span class="day">{{ meeting.startTime | date:'dd' }}</span>
//                 <span class="time">{{ meeting.startTime | date:'shortTime' }}</span>
//               </div>

//               <!-- Content -->
//               <div class="card-content">
//                 <div class="header">
//                   <h3 class="title">{{ meeting.title }}</h3>
//                   @if (meeting.status === 'cancelled') {
//                     <span class="status-badge error">Cancelled</span>
//                   } @else if (meeting.status === 'completed') {
//                     <span class="status-badge success">Completed</span>
//                   }
//                 </div>

//                 <div class="meta-info">
//                   <div class="row">
//                     <i class="pi pi-clock"></i>
//                     <span>{{ getDuration(meeting) }} mins &bull; {{ meeting.endTime | date:'shortTime' }}</span>
//                   </div>
//                   <div class="row">
//                     @if (meeting.locationType === 'virtual') {
//                       <i class="pi pi-video"></i>
//                       <a [href]="meeting.virtualLink || '#'" target="_blank" (click)="$event.stopPropagation()">Virtual Link</a>
//                     } @else {
//                       <i class="pi pi-map-marker"></i>
//                       <span>In Person</span>
//                     }
//                   </div>
//                   <div class="row organizer">
//                     <i class="pi pi-user"></i>
//                     <span>Host: {{ getOrganizerName(meeting) }}</span>
//                   </div>
//                 </div>

//                 <!-- Footer / Actions -->
//                 <div class="card-actions">
                  
//                   <!-- 1. PENDING RSVP ACTIONS -->
//                   @if (shouldShowRsvp(meeting)) {
//                     <div class="rsvp-group">
//                       <span class="label">RSVP:</span>
//                       <button class="btn-rsvp accept" (click)="onRsvp(meeting._id, 'accepted')" title="Accept">
//                         <i class="pi pi-check"></i>
//                       </button>
//                       <button class="btn-rsvp tentative" (click)="onRsvp(meeting._id, 'tentative')" title="Tentative">
//                         <i class="pi pi-question"></i>
//                       </button>
//                       <button class="btn-rsvp decline" (click)="onRsvp(meeting._id, 'declined')" title="Decline">
//                         <i class="pi pi-times"></i>
//                       </button>
//                     </div>
//                   } 
//                   <!-- 2. ORGANIZER ACTIONS -->
//                   @else if (isOrganizer(meeting) && meeting.status === 'scheduled') {
//                     <div class="org-actions">
//                       <span class="role-badge">Organizer</span>
//                       <div class="btn-group">
//                         <button class="btn-sm" (click)="updateStatus(meeting._id, 'completed')">Finish</button>
//                         <button class="btn-sm danger" (click)="updateStatus(meeting._id, 'cancelled')">Cancel</button>
//                       </div>
//                     </div>
//                   }
//                   <!-- 3. VIEW ONLY STATUS -->
//                   @else {
//                     <div class="my-status">
//                       <span class="response-badge" [ngClass]="getMyRsvp(meeting)">
//                         {{ getMyRsvp(meeting) | titlecase }}
//                       </span>
//                     </div>
//                   }

//                 </div>
//               </div>
//             </div>
//           }
//         </div>
//       </main>
//     </div>
//   `,
//   styles: [`
//     :host { display: block; height: 100%; background: var(--bg-primary); color: var(--text-primary); }
//     .meeting-dashboard { display: flex; height: 100%; }

//     /* Sidebar */
//     .sidebar {
//       width: 260px; background: var(--bg-secondary); border-right: 1px solid var(--border-secondary);
//       display: flex; flex-direction: column; padding: 20px; gap: 24px;
      
//       .btn-create {
//         width: 100%; background: var(--accent-primary); color: white; border: none; padding: 12px;
//         border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
//         transition: transform 0.2s; &:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
//       }

//       .nav-menu {
//         display: flex; flex-direction: column; gap: 4px;
//         label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-tertiary); margin-bottom: 8px; padding-left: 12px; }
        
//         .nav-item {
//           display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: none; background: transparent;
//           color: var(--text-secondary); border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
//           text-align: left; transition: all 0.2s;
          
//           i { font-size: 1.1em; }
//           &:hover { background: var(--bg-ternary); color: var(--text-primary); }
//           &.active { background: #eff6ff; color: var(--accent-primary); font-weight: 600; }
          
//           .badge { margin-left: auto; font-size: 10px; background: var(--bg-ternary); padding: 2px 8px; border-radius: 10px; color: var(--text-secondary); }
//           .badge.warning { background: #fff7ed; color: #c2410c; }
//         }
//       }
//     }

//     /* Content */
//     .content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    
//     .top-bar {
//       height: 70px; display: flex; align-items: center; justify-content: space-between; padding: 0 32px;
//       border-bottom: 1px solid var(--border-secondary);
//       .title-group {
//         h2 { font-size: 20px; font-weight: 700; margin: 0; }
//         .date-today { font-size: 12px; color: var(--text-tertiary); }
//       }
//       .btn-icon { background: none; border: 1px solid var(--border-secondary); width: 36px; height: 36px; border-radius: 8px; cursor: pointer; color: var(--text-secondary); &:hover { color: var(--text-primary); background: var(--bg-ternary); } }
//       .spin { animation: spin 1s linear infinite; }
//     }

//     .meetings-grid {
//       flex: 1; overflow-y: auto; padding: 32px; display: grid; gap: 16px;
//       grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
//       align-content: start;
//     }

//     /* Meeting Card */
//     .meeting-card {
//       display: flex; background: var(--bg-secondary); border: 1px solid var(--border-secondary);
//       border-radius: 12px; overflow: hidden; transition: all 0.2s;
      
//       &:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: var(--accent-primary); }
//       &.cancelled { opacity: 0.7; filter: grayscale(0.5); }

//       .date-strip {
//         width: 70px; background: var(--bg-ternary); display: flex; flex-direction: column;
//         align-items: center; justify-content: center; padding: 16px 0; border-right: 1px solid var(--border-secondary);
        
//         .month { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-tertiary); }
//         .day { font-size: 24px; font-weight: 800; color: var(--text-primary); line-height: 1; margin: 4px 0; }
//         .time { font-size: 11px; color: var(--text-secondary); }
//       }

//       .card-content {
//         flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 12px;
        
//         .header {
//           display: flex; justify-content: space-between; align-items: flex-start;
//           .title { font-size: 16px; font-weight: 600; margin: 0; line-height: 1.3; }
//           .status-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: 700; 
//             &.error { background: #fee2e2; color: #ef4444; }
//             &.success { background: #dcfce7; color: #16a34a; }
//           }
//         }

//         .meta-info {
//           display: flex; flex-direction: column; gap: 6px;
//           .row { 
//             display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary);
//             i { font-size: 12px; color: var(--text-tertiary); width: 14px; }
//             a { color: var(--accent-primary); text-decoration: none; &:hover { text-decoration: underline; } }
//           }
//         }

//         .card-actions {
//           margin-top: auto; padding-top: 12px; border-top: 1px dashed var(--border-secondary);
//           display: flex; justify-content: space-between; align-items: center;
//           height: 40px;
          
//           .rsvp-group {
//             display: flex; align-items: center; gap: 8px;
//             .label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; }
//             .btn-rsvp {
//               width: 28px; height: 28px; border-radius: 50%; border: 1px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: 0.2s;
//               &.accept { background: #dcfce7; color: #16a34a; &:hover { background: #16a34a; color: white; } }
//               &.tentative { background: #ffedd5; color: #f97316; &:hover { background: #f97316; color: white; } }
//               &.decline { background: #fee2e2; color: #ef4444; &:hover { background: #ef4444; color: white; } }
//             }
//           }

//           .my-status {
//             font-size: 11px; font-weight: 600; width: 100%;
//             .role-badge { color: var(--text-tertiary); background: var(--bg-ternary); padding: 4px 8px; border-radius: 4px; }
//             .response-badge { 
//               padding: 4px 8px; border-radius: 4px; display: block; text-align: center; background: var(--bg-ternary);
//               &.accepted { background: #dcfce7; color: #15803d; }
//               &.declined { background: #fee2e2; color: #b91c1c; }
//               &.tentative { background: #ffedd5; color: #c2410c; }
//               &.pending { background: #f1f5f9; color: #64748b; }
//             }
//           }

//           .org-actions {
//             display: flex; justify-content: space-between; width: 100%; align-items: center;
//             .role-badge { font-size: 10px; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase; }
//             .btn-group { display: flex; gap: 6px; }
//             .btn-sm {
//               font-size: 10px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-secondary); background: transparent; cursor: pointer; font-weight: 600; color: var(--text-secondary);
//               &:hover { background: var(--bg-ternary); color: var(--text-primary); }
//               &.danger:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }
//             }
//           }
//         }
//       }
//     }

//     /* Utilities */
//     .loading-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); .spinner { width: 30px; height: 30px; border: 3px solid var(--border-secondary); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; } }
//     .empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); i { font-size: 3rem; margin-bottom: 16px; opacity: 0.3; } h3 { color: var(--text-primary); margin: 0 0 8px 0; } .btn-link { background: none; border: none; color: var(--accent-primary); text-decoration: underline; cursor: pointer; } }
//     @keyframes spin { to { transform: rotate(360deg); } }
//   `]
// })
// export class MeetingListComponent {
//   private noteService = inject(NoteService);
//   private authService = inject(AuthService);
//   private dialogService = inject(DialogService); // Inject Service
//   private fb = inject(FormBuilder);

//   // --- State ---
//   meetings = signal<Meeting[]>([]);
//   activeFilter = signal<MeetingFilter>('upcoming');
//   isLoading = signal(true);
//   today = new Date();

//   // --- Computed ---
//   currentUser = toSignal(this.authService.currentUser$);

//   filteredMeetings = computed(() => {
//     const filter = this.activeFilter();
//     const all = this.meetings();
//     const now = new Date();

//     return all.filter(m => {
//       const start = new Date(m.startTime);
//       if (filter === 'cancelled') return m.status === 'cancelled';
//       if (m.status === 'cancelled') return false; 

//       if (filter === 'upcoming') return start >= now;
//       if (filter === 'past') return start < now;
//       if (filter === 'pending') {
//         return start >= now && this.getMyRsvp(m) === 'pending' && !this.isOrganizer(m);
//       }
//       return true;
//     }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
//   });

//   counts = computed(() => {
//     const all = this.meetings();
//     const now = new Date();
//     return {
//       upcoming: all.filter(m => new Date(m.startTime) >= now && m.status !== 'cancelled').length,
//       pending: all.filter(m => new Date(m.startTime) >= now && m.status !== 'cancelled' && this.getMyRsvp(m) === 'pending' && !this.isOrganizer(m)).length
//     };
//   });

//   constructor() {
//     this.loadMeetings();
//   }

//   // --- Actions ---
//   setFilter(filter: MeetingFilter) {
//     if (this.activeFilter() === filter) return;
//     this.activeFilter.set(filter);
//     this.loadMeetings();
//   }

//   loadMeetings() {
//     this.isLoading.set(true);
//     const filter = this.activeFilter();
//     let status: string | undefined = undefined;
//     let startDate: string | undefined = undefined;
//     let endDate: string | undefined = undefined;
//     const now = new Date().toISOString();

//     if (filter === 'upcoming') {
//       startDate = now;
//     } else if (filter === 'past') {
//       endDate = now;
//       status = 'completed';
//     } else if (filter === 'cancelled') {
//       status = 'cancelled';
//     } else if (filter === 'pending') {
//       startDate = now;
//     }

//     this.noteService.getUserMeetings(status, startDate, endDate).subscribe({
//       next: (res) => {
//         let fetched = res.data.meetings;
//         if (filter === 'pending') {
//           fetched = fetched.filter(m => 
//             this.getMyRsvp(m) === 'pending' && !this.isOrganizer(m) && m.status !== 'cancelled'
//           );
//         }
//         fetched.sort((a, b) => {
//           const t1 = new Date(a.startTime).getTime();
//           const t2 = new Date(b.startTime).getTime();
//           return filter === 'past' ? t2 - t1 : t1 - t2;
//         });
//         this.meetings.set(fetched);
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         console.error('Failed to load meetings', err);
//         this.isLoading.set(false);
//       }
//     });
//   }

//   onCreateMeeting() {
//     const ref:any = this.dialogService.open(CreateMeetingDialogComponent, {
//       header: 'Schedule Meeting',
//       width: '70%',
//       closable: true,
//       closeOnEscape: true,
//       dismissableMask: true,
//       contentStyle: { overflow: 'visible' },
//       baseZIndex: 10000,
//     });

//     ref.onClose.subscribe((meeting: Meeting) => {
//       if (meeting) {
//         // If the new meeting matches the current filter, add it
//         // Or simpler: just reload or append to upcoming
//         this.meetings.update(ms => [...ms, meeting]);
//         if (this.activeFilter() !== 'upcoming') {
//           this.setFilter('upcoming');
//         }
//       }
//     });
//   }

//   updateStatus(id: string, status: string) {
//     if (!confirm(`Mark meeting as ${status}?`)) return;
//     this.noteService.updateMeetingStatus(id, { status }).subscribe({
//       next: (res) => {
//         this.updateLocalMeeting(res.data.meeting);
//       }
//     });
//   }

//   onRsvp(id: string, response: 'accepted' | 'declined' | 'tentative') {
//     this.noteService.rsvpToMeeting(id, response).subscribe({
//       next: () => {
//         this.meetings.update(list => list.map(m => {
//           if (m._id !== id) return m;
//           const user = this.currentUser();
//           if (!user || !m.participants) return m;
          
//           const updatedParticipants = m.participants.map(p => {
//              const pUserId = typeof p.user === 'string' ? p.user : p.user._id;
//              if (pUserId === user._id) {
//                return { ...p, rsvp: response, invitationStatus: response } as any; 
//              }
//              return p;
//           });
          
//           if (this.activeFilter() === 'pending') {
//              setTimeout(() => this.loadMeetings(), 500); 
//           }
          
//           return { ...m, participants: updatedParticipants };
//         }));
//       }
//     });
//   }

//   // --- Helpers ---
//   updateLocalMeeting(updated: Meeting) {
//     this.meetings.update(list => list.map(m => m._id === updated._id ? updated : m));
//   }

//   isOrganizer(meeting: Meeting): boolean {
//     const user = this.currentUser();
//     if (!user) return false;
//     const orgId = typeof meeting.organizer === 'string' ? meeting.organizer : meeting.organizer._id;
//     return orgId === user._id;
//   }

//   getMyRsvp(meeting: Meeting): string {
//     const user = this.currentUser();
//     if (!user || !meeting.participants) return 'unknown';
    
//     const p: any = meeting.participants.find(part => {
//       const partId = typeof part.user === 'string' ? part.user : part.user._id;
//       return partId === user._id;
//     });
//     return p ? (p.invitationStatus || p.rsvp) : 'unknown';
//   }

//   getOrganizerName(meeting: Meeting): string {
//     if (meeting.organizer && typeof meeting.organizer === 'object' && 'name' in meeting.organizer) {
//       return meeting.organizer.name;
//     }
//     return 'Unknown';
//   }

//   getDuration(meeting: Meeting): number {
//     const start = new Date(meeting.startTime).getTime();
//     const end = new Date(meeting.endTime).getTime();
//     return Math.round((end - start) / 60000); 
//   }

//   shouldShowRsvp(meeting: Meeting): boolean {
//     const myStatus = this.getMyRsvp(meeting);
//     return !this.isOrganizer(meeting) && 
//            (myStatus === 'pending' || !myStatus) && 
//            meeting.status === 'scheduled';
//   }
// }


// // import { Component, inject, signal, computed, effect } from '@angular/core';
// // import { CommonModule, DatePipe } from '@angular/common';
// // import { RouterModule } from '@angular/router';
// // import { toSignal } from '@angular/core/rxjs-interop';
// // import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
// // import { Meeting } from '../../core/models/note.types';
// // import { NoteService } from '../../core/services/notes.service';
// // import { AuthService } from '../auth/services/auth-service';

// // type MeetingFilter = 'upcoming' | 'pending' | 'past' | 'cancelled';

// // @Component({
// //   selector: 'app-meeting-list',
// //   standalone: true,
// //   imports: [CommonModule, RouterModule, ReactiveFormsModule, DatePipe],
// //   template: `
// //     <div class="meeting-dashboard">
      
// //       <!-- ==================== SIDEBAR ==================== -->
// //       <aside class="sidebar">
// //         <div class="action-section">
// //           <button class="btn-create" (click)="onCreateMeeting()">
// //             <i class="pi pi-plus"></i> Schedule Meeting
// //           </button>
// //         </div>

// //         <nav class="nav-menu">
// //           <label>Schedule</label>
// //           <button class="nav-item" [class.active]="activeFilter() === 'upcoming'" (click)="setFilter('upcoming')">
// //             <i class="pi pi-calendar"></i> Upcoming
// //             <!-- Counts are tricky with server-side pagination, hiding or showing specific 'pending' count if available -->
// //           </button>
// //           <button class="nav-item" [class.active]="activeFilter() === 'pending'" (click)="setFilter('pending')">
// //             <i class="pi pi-question-circle"></i> Pending RSVP
// //           </button>
// //           <button class="nav-item" [class.active]="activeFilter() === 'past'" (click)="setFilter('past')">
// //             <i class="pi pi-history"></i> Past Meetings
// //           </button>
// //           <button class="nav-item" [class.active]="activeFilter() === 'cancelled'" (click)="setFilter('cancelled')">
// //             <i class="pi pi-times-circle"></i> Cancelled
// //           </button>
// //         </nav>
// //       </aside>

// //       <!-- ==================== MAIN CONTENT ==================== -->
// //       <main class="content">
// //         <header class="top-bar glass-panel">
// //           <div class="title-group">
// //             <h2>
// //               @switch (activeFilter()) {
// //                 @case ('upcoming') { Upcoming Meetings }
// //                 @case ('pending') { Awaiting Response }
// //                 @case ('past') { Meeting History }
// //                 @case ('cancelled') { Cancelled Meetings }
// //               }
// //             </h2>
// //             <span class="date-today">{{ today | date:'fullDate' }}</span>
// //           </div>
          
// //           <div class="controls">
// //             <button class="btn-icon" (click)="loadMeetings()" title="Refresh">
// //               <i class="pi pi-refresh" [class.spin]="isLoading()"></i>
// //             </button>
// //           </div>
// //         </header>

// //         <div class="meetings-grid custom-scrollbar">
// //           @if (isLoading()) {
// //             <div class="loading-state">
// //               <div class="spinner"></div>
// //               <p>Syncing schedule...</p>
// //             </div>
// //           }

// //           @if (!isLoading() && meetings().length === 0) {
// //             <div class="empty-state">
// //               <i class="pi pi-calendar-times"></i>
// //               <h3>No meetings found</h3>
// //               <p>
// //                 @if (activeFilter() === 'upcoming') { You have no upcoming meetings. }
// //                 @else if (activeFilter() === 'pending') { You're all caught up on RSVPs! }
// //                 @else { No {{ activeFilter() }} meetings found. }
// //               </p>
// //               @if (activeFilter() === 'upcoming') {
// //                 <button class="btn-link" (click)="onCreateMeeting()">Schedule one now</button>
// //               }
// //             </div>
// //           }

// //           @for (meeting of meetings(); track meeting._id) {
// //             <div class="meeting-card glass-panel" [class.cancelled]="meeting.status === 'cancelled'">
              
// //               <!-- Date Strip -->
// //               <div class="date-strip">
// //                 <span class="month">{{ meeting.startTime | date:'MMM' }}</span>
// //                 <span class="day">{{ meeting.startTime | date:'dd' }}</span>
// //                 <span class="time">{{ meeting.startTime | date:'shortTime' }}</span>
// //               </div>

// //               <!-- Content -->
// //               <div class="card-content">
// //                 <div class="header">
// //                   <h3 class="title">{{ meeting.title }}</h3>
// //                   @if (meeting.status === 'cancelled') {
// //                     <span class="status-badge error">Cancelled</span>
// //                   } @else if (meeting.status === 'completed') {
// //                     <span class="status-badge success">Completed</span>
// //                   }
// //                 </div>

// //                 <div class="meta-info">
// //                   <div class="row">
// //                     <i class="pi pi-clock"></i>
// //                     <span>{{ getDuration(meeting) }} mins &bull; {{ meeting.endTime | date:'shortTime' }}</span>
// //                   </div>
// //                   <div class="row">
// //                     @if (meeting.locationType === 'virtual') {
// //                       <i class="pi pi-video"></i>
// //                       <a [href]="meeting.virtualLink || '#'" target="_blank" (click)="$event.stopPropagation()">Virtual Link</a>
// //                     } @else {
// //                       <i class="pi pi-map-marker"></i>
// //                       <span>In Person</span>
// //                     }
// //                   </div>
// //                   <div class="row organizer">
// //                     <i class="pi pi-user"></i>
// //                     <span>Host: {{ getOrganizerName(meeting) }}</span>
// //                   </div>
// //                 </div>

// //                 <!-- Footer / Actions -->
// //                 <div class="card-actions">
                  
// //                   <!-- 1. PENDING RSVP ACTIONS -->
// //                   @if (shouldShowRsvp(meeting)) {
// //                     <div class="rsvp-group">
// //                       <span class="label">RSVP:</span>
// //                       <button class="btn-rsvp accept" (click)="onRsvp(meeting._id, 'accepted')" title="Accept">
// //                         <i class="pi pi-check"></i>
// //                       </button>
// //                       <button class="btn-rsvp tentative" (click)="onRsvp(meeting._id, 'tentative')" title="Tentative">
// //                         <i class="pi pi-question"></i>
// //                       </button>
// //                       <button class="btn-rsvp decline" (click)="onRsvp(meeting._id, 'declined')" title="Decline">
// //                         <i class="pi pi-times"></i>
// //                       </button>
// //                     </div>
// //                   } 
// //                   <!-- 2. ORGANIZER ACTIONS -->
// //                   @else if (isOrganizer(meeting) && meeting.status === 'scheduled') {
// //                     <div class="org-actions">
// //                       <span class="role-badge">Organizer</span>
// //                       <div class="btn-group">
// //                         <button class="btn-sm" (click)="updateStatus(meeting._id, 'completed')">Finish</button>
// //                         <button class="btn-sm danger" (click)="updateStatus(meeting._id, 'cancelled')">Cancel</button>
// //                       </div>
// //                     </div>
// //                   }
// //                   <!-- 3. VIEW ONLY STATUS -->
// //                   @else {
// //                     <div class="my-status">
// //                       <span class="response-badge" [ngClass]="getMyRsvp(meeting)">
// //                         {{ getMyRsvp(meeting) | titlecase }}
// //                       </span>
// //                     </div>
// //                   }

// //                 </div>
// //               </div>
// //             </div>
// //           }
// //         </div>
// //       </main>
// //     </div>
// //   `,
// //   styles: [`
// //     :host { display: block; height: 100%; background: var(--bg-primary); color: var(--text-primary); }
// //     .meeting-dashboard { display: flex; height: 100%; }

// //     /* Sidebar */
// //     .sidebar {
// //       width: 260px; background: var(--bg-secondary); border-right: 1px solid var(--border-secondary);
// //       display: flex; flex-direction: column; padding: 20px; gap: 24px;
      
// //       .btn-create {
// //         width: 100%; background: var(--accent-primary); color: white; border: none; padding: 12px;
// //         border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
// //         transition: transform 0.2s; &:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
// //       }

// //       .nav-menu {
// //         display: flex; flex-direction: column; gap: 4px;
// //         label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-tertiary); margin-bottom: 8px; padding-left: 12px; }
        
// //         .nav-item {
// //           display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: none; background: transparent;
// //           color: var(--text-secondary); border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
// //           text-align: left; transition: all 0.2s;
          
// //           i { font-size: 1.1em; }
// //           &:hover { background: var(--bg-ternary); color: var(--text-primary); }
// //           &.active { background: #eff6ff; color: var(--accent-primary); font-weight: 600; }
          
// //           .badge { margin-left: auto; font-size: 10px; background: var(--bg-ternary); padding: 2px 8px; border-radius: 10px; color: var(--text-secondary); }
// //           .badge.warning { background: #fff7ed; color: #c2410c; }
// //         }
// //       }
// //     }

// //     /* Content */
// //     .content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    
// //     .top-bar {
// //       height: 70px; display: flex; align-items: center; justify-content: space-between; padding: 0 32px;
// //       border-bottom: 1px solid var(--border-secondary);
// //       .title-group {
// //         h2 { font-size: 20px; font-weight: 700; margin: 0; }
// //         .date-today { font-size: 12px; color: var(--text-tertiary); }
// //       }
// //       .btn-icon { background: none; border: 1px solid var(--border-secondary); width: 36px; height: 36px; border-radius: 8px; cursor: pointer; color: var(--text-secondary); &:hover { color: var(--text-primary); background: var(--bg-ternary); } }
// //       .spin { animation: spin 1s linear infinite; }
// //     }

// //     .meetings-grid {
// //       flex: 1; overflow-y: auto; padding: 32px; display: grid; gap: 16px;
// //       grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
// //       align-content: start;
// //     }

// //     /* Meeting Card */
// //     .meeting-card {
// //       display: flex; background: var(--bg-secondary); border: 1px solid var(--border-secondary);
// //       border-radius: 12px; overflow: hidden; transition: all 0.2s;
      
// //       &:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: var(--accent-primary); }
// //       &.cancelled { opacity: 0.7; filter: grayscale(0.5); }

// //       .date-strip {
// //         width: 70px; background: var(--bg-ternary); display: flex; flex-direction: column;
// //         align-items: center; justify-content: center; padding: 16px 0; border-right: 1px solid var(--border-secondary);
        
// //         .month { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-tertiary); }
// //         .day { font-size: 24px; font-weight: 800; color: var(--text-primary); line-height: 1; margin: 4px 0; }
// //         .time { font-size: 11px; color: var(--text-secondary); }
// //       }

// //       .card-content {
// //         flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 12px;
        
// //         .header {
// //           display: flex; justify-content: space-between; align-items: flex-start;
// //           .title { font-size: 16px; font-weight: 600; margin: 0; line-height: 1.3; }
// //           .status-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: 700; 
// //             &.error { background: #fee2e2; color: #ef4444; }
// //             &.success { background: #dcfce7; color: #16a34a; }
// //           }
// //         }

// //         .meta-info {
// //           display: flex; flex-direction: column; gap: 6px;
// //           .row { 
// //             display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary);
// //             i { font-size: 12px; color: var(--text-tertiary); width: 14px; }
// //             a { color: var(--accent-primary); text-decoration: none; &:hover { text-decoration: underline; } }
// //           }
// //         }

// //         .card-actions {
// //           margin-top: auto; padding-top: 12px; border-top: 1px dashed var(--border-secondary);
// //           display: flex; justify-content: space-between; align-items: center;
// //           height: 40px;
          
// //           .rsvp-group {
// //             display: flex; align-items: center; gap: 8px;
// //             .label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; }
// //             .btn-rsvp {
// //               width: 28px; height: 28px; border-radius: 50%; border: 1px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: 0.2s;
// //               &.accept { background: #dcfce7; color: #16a34a; &:hover { background: #16a34a; color: white; } }
// //               &.tentative { background: #ffedd5; color: #f97316; &:hover { background: #f97316; color: white; } }
// //               &.decline { background: #fee2e2; color: #ef4444; &:hover { background: #ef4444; color: white; } }
// //             }
// //           }

// //           .my-status {
// //             font-size: 11px; font-weight: 600; width: 100%;
// //             .role-badge { color: var(--text-tertiary); background: var(--bg-ternary); padding: 4px 8px; border-radius: 4px; }
// //             .response-badge { 
// //               padding: 4px 8px; border-radius: 4px; display: block; text-align: center; background: var(--bg-ternary);
// //               &.accepted { background: #dcfce7; color: #15803d; }
// //               &.declined { background: #fee2e2; color: #b91c1c; }
// //               &.tentative { background: #ffedd5; color: #c2410c; }
// //               &.pending { background: #f1f5f9; color: #64748b; }
// //             }
// //           }

// //           .org-actions {
// //             display: flex; justify-content: space-between; width: 100%; align-items: center;
// //             .role-badge { font-size: 10px; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase; }
// //             .btn-group { display: flex; gap: 6px; }
// //             .btn-sm {
// //               font-size: 10px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-secondary); background: transparent; cursor: pointer; font-weight: 600; color: var(--text-secondary);
// //               &:hover { background: var(--bg-ternary); color: var(--text-primary); }
// //               &.danger:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }
// //             }
// //           }
// //         }
// //       }
// //     }

// //     /* Utilities */
// //     .loading-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); .spinner { width: 30px; height: 30px; border: 3px solid var(--border-secondary); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; } }
// //     .empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); i { font-size: 3rem; margin-bottom: 16px; opacity: 0.3; } h3 { color: var(--text-primary); margin: 0 0 8px 0; } .btn-link { background: none; border: none; color: var(--accent-primary); text-decoration: underline; cursor: pointer; } }
// //     @keyframes spin { to { transform: rotate(360deg); } }
// //   `]
// // })
// // export class MeetingListComponent {
// //   private noteService = inject(NoteService);
// //   private authService = inject(AuthService);
// //   private fb = inject(FormBuilder);

// //   // --- State ---
// //   meetings = signal<Meeting[]>([]);
// //   activeFilter = signal<MeetingFilter>('upcoming');
// //   isLoading = signal(true);
// //   today = new Date();

// //   // --- Computed ---
// //   currentUser = toSignal(this.authService.currentUser$);

// //   constructor() {
// //     this.loadMeetings();
// //   }

// //   // --- Actions ---
// //   setFilter(filter: MeetingFilter) {
// //     if (this.activeFilter() === filter) return;
// //     this.activeFilter.set(filter);
// //     this.loadMeetings(); // Reload with new server-side filters
// //   }

// //   loadMeetings() {
// //     this.isLoading.set(true);
// //     const filter = this.activeFilter();
    
// //     // Default params
// //     let status: string | undefined = undefined;
// //     let startDate: string | undefined = undefined;
// //     let endDate: string | undefined = undefined;

// //     // Apply Backend Filters
// //     const now = new Date().toISOString();

// //     if (filter === 'upcoming') {
// //       startDate = now;
// //       // Intentionally don't set status='active' strictly so we see scheduled/rescheduled
// //     } else if (filter === 'past') {
// //       endDate = now;
// //       status = 'completed'; // Or undefined to show all past
// //     } else if (filter === 'cancelled') {
// //       status = 'cancelled';
// //     } else if (filter === 'pending') {
// //       startDate = now;
// //       // Backend doesn't filter by "my pending RSVP" easily in one generic call unless customized.
// //       // We'll fetch upcoming and filter locally for pending.
// //     }

// //     this.noteService.getUserMeetings(status, startDate, endDate).subscribe({
// //       next: (res) => {
// //         let fetched = res.data.meetings;

// //         // Client-side Refinement for "Pending" & Sorting
// //         if (filter === 'pending') {
// //           fetched = fetched.filter(m => 
// //             this.getMyRsvp(m) === 'pending' && !this.isOrganizer(m) && m.status !== 'cancelled'
// //           );
// //         }

// //         // Sort: Past desc, Upcoming asc
// //         fetched.sort((a, b) => {
// //           const t1 = new Date(a.startTime).getTime();
// //           const t2 = new Date(b.startTime).getTime();
// //           return filter === 'past' ? t2 - t1 : t1 - t2;
// //         });

// //         this.meetings.set(fetched);
// //         this.isLoading.set(false);
// //       },
// //       error: (err) => {
// //         console.error('Failed to load meetings', err);
// //         this.isLoading.set(false);
// //       }
// //     });
// //   }

// //   onCreateMeeting() {
// //     // Ideally open a modal. For now, simple prompt or log.
// //     // If you have the CreateMeetingComponent, inject dialog service here.
// //     console.log('Open Create Meeting Dialog');
// //     alert('Create Meeting feature coming next!'); 
// //   }

// //   updateStatus(id: string, status: string) {
// //     if (!confirm(`Mark meeting as ${status}?`)) return;
// //     this.noteService.updateMeetingStatus(id, { status }).subscribe({
// //       next: (res) => {
// //         this.updateLocalMeeting(res.data.meeting);
// //       }
// //     });
// //   }

// //   onRsvp(id: string, response: 'accepted' | 'declined' | 'tentative') {
// //     this.noteService.rsvpToMeeting(id, response).subscribe({
// //       next: () => {
// //         // Update local state optimistically
// //         this.meetings.update(list => list.map(m => {
// //           if (m._id !== id) return m;
          
// //           const user = this.currentUser();
// //           if (!user || !m.participants) return m;
          
// //           // Map participants and update the specific user's status
// //           const updatedParticipants = m.participants.map(p => {
// //              const pUserId = typeof p.user === 'string' ? p.user : p.user._id;
// //              // Update using backend field 'invitationStatus' if mapped, or 'rsvp' locally
// //              if (pUserId === user._id) {
// //                // We handle both potential shapes here for safety
// //                return { ...p, rsvp: response, invitationStatus: response } as any; 
// //              }
// //              return p;
// //           });
          
// //           // If viewing "Pending" tab, remove it from view after response
// //           if (this.activeFilter() === 'pending') {
// //              setTimeout(() => this.loadMeetings(), 500); // Reload or filter out
// //           }
          
// //           return { ...m, participants: updatedParticipants };
// //         }));
// //       }
// //     });
// //   }

// //   // --- Helpers ---
// //   updateLocalMeeting(updated: Meeting) {
// //     this.meetings.update(list => list.map(m => m._id === updated._id ? updated : m));
// //   }

// //   isOrganizer(meeting: Meeting): boolean {
// //     const user = this.currentUser();
// //     if (!user) return false;
// //     const orgId = typeof meeting.organizer === 'string' ? meeting.organizer : meeting.organizer._id;
// //     return orgId === user._id;
// //   }

// //   getMyRsvp(meeting: Meeting): string {
// //     const user = this.currentUser();
// //     if (!user || !meeting.participants) return 'unknown';
    
// //     const p: any = meeting.participants.find(part => {
// //       const partId = typeof part.user === 'string' ? part.user : part.user._id;
// //       return partId === user._id;
// //     });
    
// //     // Check both fields due to backend/frontend mismatch (invitationStatus vs rsvp)
// //     return p ? (p.invitationStatus || p.rsvp) : 'unknown';
// //   }

// //   getOrganizerName(meeting: Meeting): string {
// //     if (meeting.organizer && typeof meeting.organizer === 'object' && 'name' in meeting.organizer) {
// //       return meeting.organizer.name;
// //     }
// //     return 'Unknown';
// //   }

// //   getDuration(meeting: Meeting): number {
// //     const start = new Date(meeting.startTime).getTime();
// //     const end = new Date(meeting.endTime).getTime();
// //     return Math.round((end - start) / 60000); // Minutes
// //   }

// //   shouldShowRsvp(meeting: Meeting): boolean {
// //     const myStatus = this.getMyRsvp(meeting);
// //     return !this.isOrganizer(meeting) && 
// //            (myStatus === 'pending' || !myStatus) && 
// //            meeting.status === 'scheduled';
// //   }
// // }




// // // import { Component, inject, signal, computed, effect } from '@angular/core';
// // // import { CommonModule, DatePipe } from '@angular/common';
// // // import { RouterModule } from '@angular/router';
// // // import { toSignal } from '@angular/core/rxjs-interop';
// // // import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
// // // import { Meeting } from '../../core/models/note.types';
// // // import { NoteService } from '../../core/services/notes.service';
// // // import { AuthService } from '../auth/services/auth-service';

// // // type MeetingFilter = 'upcoming' | 'pending' | 'past' | 'cancelled';

// // // @Component({
// // //   selector: 'app-meeting-list',
// // //   standalone: true,
// // //   imports: [CommonModule, RouterModule, ReactiveFormsModule, DatePipe],
// // //   template: `
// // //     <div class="meeting-dashboard">
      
// // //       <!-- ==================== SIDEBAR ==================== -->
// // //       <aside class="sidebar">
// // //         <div class="action-section">
// // //           <button class="btn-create" (click)="onCreateMeeting()">
// // //             <i class="pi pi-plus"></i> Schedule Meeting
// // //           </button>
// // //         </div>

// // //         <nav class="nav-menu">
// // //           <label>Schedule</label>
// // //           <button class="nav-item" [class.active]="activeFilter() === 'upcoming'" (click)="setFilter('upcoming')">
// // //             <i class="pi pi-calendar"></i> Upcoming
// // //             <span class="badge">{{ counts().upcoming }}</span>
// // //           </button>
// // //           <button class="nav-item" [class.active]="activeFilter() === 'pending'" (click)="setFilter('pending')">
// // //             <i class="pi pi-question-circle"></i> Pending RSVP
// // //             <span class="badge warning">{{ counts().pending }}</span>
// // //           </button>
// // //           <button class="nav-item" [class.active]="activeFilter() === 'past'" (click)="setFilter('past')">
// // //             <i class="pi pi-history"></i> Past Meetings
// // //           </button>
// // //           <button class="nav-item" [class.active]="activeFilter() === 'cancelled'" (click)="setFilter('cancelled')">
// // //             <i class="pi pi-times-circle"></i> Cancelled
// // //           </button>
// // //         </nav>
// // //       </aside>

// // //       <!-- ==================== MAIN CONTENT ==================== -->
// // //       <main class="content">
// // //         <header class="top-bar glass-panel">
// // //           <div class="title-group">
// // //             <h2>
// // //               @switch (activeFilter()) {
// // //                 @case ('upcoming') { Upcoming Meetings }
// // //                 @case ('pending') { Awaiting Response }
// // //                 @case ('past') { Meeting History }
// // //                 @case ('cancelled') { Cancelled }
// // //               }
// // //             </h2>
// // //             <span class="date-today">{{ today | date:'fullDate' }}</span>
// // //           </div>
          
// // //           <div class="controls">
// // //             <button class="btn-icon" (click)="loadMeetings()" title="Refresh">
// // //               <i class="pi pi-refresh" [class.spin]="isLoading()"></i>
// // //             </button>
// // //           </div>
// // //         </header>

// // //         <div class="meetings-grid custom-scrollbar">
// // //           @if (isLoading()) {
// // //             <div class="loading-state">
// // //               <div class="spinner"></div>
// // //               <p>Loading schedule...</p>
// // //             </div>
// // //           }

// // //           @if (!isLoading() && filteredMeetings().length === 0) {
// // //             <div class="empty-state">
// // //               <i class="pi pi-calendar-times"></i>
// // //               <h3>No meetings found</h3>
// // //               <p>You don't have any {{ activeFilter() }} meetings.</p>
// // //               @if (activeFilter() === 'upcoming') {
// // //                 <button class="btn-link" (click)="onCreateMeeting()">Schedule one now</button>
// // //               }
// // //             </div>
// // //           }

// // //           @for (meeting of filteredMeetings(); track meeting._id) {
// // //             <div class="meeting-card glass-panel" [class.cancelled]="meeting.status === 'cancelled'">
              
// // //               <!-- Date Strip -->
// // //               <div class="date-strip">
// // //                 <span class="month">{{ meeting.startTime | date:'MMM' }}</span>
// // //                 <span class="day">{{ meeting.startTime | date:'dd' }}</span>
// // //                 <span class="time">{{ meeting.startTime | date:'shortTime' }}</span>
// // //               </div>

// // //               <!-- Content -->
// // //               <div class="card-content">
// // //                 <div class="header">
// // //                   <h3 class="title">{{ meeting.title }}</h3>
// // //                   @if (meeting.status === 'cancelled') {
// // //                     <span class="status-badge error">Cancelled</span>
// // //                   } @else if (meeting.status === 'completed') {
// // //                     <span class="status-badge success">Completed</span>
// // //                   }
// // //                 </div>

// // //                 <div class="meta-info">
// // //                   <div class="row">
// // //                     <i class="pi pi-clock"></i>
// // //                     <span>{{ getDuration(meeting) }} mins</span>
// // //                   </div>
// // //                   <div class="row">
// // //                     @if (meeting.locationType === 'virtual') {
// // //                       <i class="pi pi-video"></i>
// // //                       <a [href]="meeting.virtualLink" target="_blank" (click)="$event.stopPropagation()">Virtual Meeting</a>
// // //                     } @else {
// // //                       <i class="pi pi-map-marker"></i>
// // //                       <span>In Person</span>
// // //                     }
// // //                   </div>
// // //                   <div class="row organizer">
// // //                     <i class="pi pi-user"></i>
// // //                     <span>Org: {{ getOrganizerName(meeting) }}</span>
// // //                   </div>
// // //                 </div>

// // //                 <!-- Footer / Actions -->
// // //                 <div class="card-actions">
// // //                   <!-- RSVP Actions (If not organizer and pending) -->
// // //                   @if (shouldShowRsvp(meeting)) {
// // //                     <div class="rsvp-group">
// // //                       <span class="label">RSVP:</span>
// // //                       <button class="btn-rsvp accept" (click)="onRsvp(meeting._id, 'accepted')" title="Accept">
// // //                         <i class="pi pi-check"></i>
// // //                       </button>
// // //                       <button class="btn-rsvp tentative" (click)="onRsvp(meeting._id, 'tentative')" title="Tentative">
// // //                         <i class="pi pi-question"></i>
// // //                       </button>
// // //                       <button class="btn-rsvp decline" (click)="onRsvp(meeting._id, 'declined')" title="Decline">
// // //                         <i class="pi pi-times"></i>
// // //                       </button>
// // //                     </div>
// // //                   } @else {
// // //                     <!-- My Status -->
// // //                     <div class="my-status">
// // //                       @if (isOrganizer(meeting)) {
// // //                         <span class="role-badge">You are Organizer</span>
// // //                       } @else {
// // //                         <span class="response-badge" [ngClass]="getMyRsvp(meeting)">
// // //                           You: {{ getMyRsvp(meeting) | titlecase }}
// // //                         </span>
// // //                       }
// // //                     </div>
// // //                   }

// // //                   <!-- Organizer Actions -->
// // //                   @if (isOrganizer(meeting) && meeting.status === 'scheduled') {
// // //                     <div class="org-actions">
// // //                       <button class="btn-sm" (click)="updateStatus(meeting._id, 'completed')">Complete</button>
// // //                       <button class="btn-sm danger" (click)="updateStatus(meeting._id, 'cancelled')">Cancel</button>
// // //                     </div>
// // //                   }
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           }
// // //         </div>
// // //       </main>
// // //     </div>
// // //   `,
// // //   styles: [`
// // //     :host { display: block; height: 100%; background: var(--bg-primary); color: var(--text-primary); }
// // //     .meeting-dashboard { display: flex; height: 100%; }

// // //     /* Sidebar */
// // //     .sidebar {
// // //       width: 260px; background: var(--bg-secondary); border-right: 1px solid var(--border-secondary);
// // //       display: flex; flex-direction: column; padding: 20px; gap: 24px;
      
// // //       .btn-create {
// // //         width: 100%; background: var(--accent-primary); color: white; border: none; padding: 12px;
// // //         border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
// // //         transition: transform 0.2s; &:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
// // //       }

// // //       .nav-menu {
// // //         display: flex; flex-direction: column; gap: 4px;
// // //         label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-tertiary); margin-bottom: 8px; padding-left: 12px; }
        
// // //         .nav-item {
// // //           display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: none; background: transparent;
// // //           color: var(--text-secondary); border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
// // //           text-align: left; transition: all 0.2s;
          
// // //           i { font-size: 1.1em; }
// // //           &:hover { background: var(--bg-ternary); color: var(--text-primary); }
// // //           &.active { background: #eff6ff; color: var(--accent-primary); font-weight: 600; }
          
// // //           .badge { margin-left: auto; font-size: 10px; background: var(--bg-ternary); padding: 2px 8px; border-radius: 10px; color: var(--text-secondary); }
// // //           .badge.warning { background: #fff7ed; color: #c2410c; }
// // //         }
// // //       }
// // //     }

// // //     /* Content */
// // //     .content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    
// // //     .top-bar {
// // //       height: 70px; display: flex; align-items: center; justify-content: space-between; padding: 0 32px;
// // //       border-bottom: 1px solid var(--border-secondary);
// // //       .title-group {
// // //         h2 { font-size: 20px; font-weight: 700; margin: 0; }
// // //         .date-today { font-size: 12px; color: var(--text-tertiary); }
// // //       }
// // //       .btn-icon { background: none; border: 1px solid var(--border-secondary); width: 36px; height: 36px; border-radius: 8px; cursor: pointer; color: var(--text-secondary); &:hover { color: var(--text-primary); background: var(--bg-ternary); } }
// // //       .spin { animation: spin 1s linear infinite; }
// // //     }

// // //     .meetings-grid {
// // //       flex: 1; overflow-y: auto; padding: 32px; display: grid; gap: 16px;
// // //       grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
// // //       align-content: start;
// // //     }

// // //     /* Meeting Card */
// // //     .meeting-card {
// // //       display: flex; background: var(--bg-secondary); border: 1px solid var(--border-secondary);
// // //       border-radius: 12px; overflow: hidden; transition: all 0.2s;
      
// // //       &:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: var(--accent-primary); }
// // //       &.cancelled { opacity: 0.7; filter: grayscale(0.5); }

// // //       .date-strip {
// // //         width: 70px; background: var(--bg-ternary); display: flex; flex-direction: column;
// // //         align-items: center; justify-content: center; padding: 16px 0; border-right: 1px solid var(--border-secondary);
        
// // //         .month { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-tertiary); }
// // //         .day { font-size: 24px; font-weight: 800; color: var(--text-primary); line-height: 1; margin: 4px 0; }
// // //         .time { font-size: 11px; color: var(--text-secondary); }
// // //       }

// // //       .card-content {
// // //         flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 12px;
        
// // //         .header {
// // //           display: flex; justify-content: space-between; align-items: flex-start;
// // //           .title { font-size: 16px; font-weight: 600; margin: 0; line-height: 1.3; }
// // //           .status-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: 700; 
// // //             &.error { background: #fee2e2; color: #ef4444; }
// // //             &.success { background: #dcfce7; color: #16a34a; }
// // //           }
// // //         }

// // //         .meta-info {
// // //           display: flex; flex-direction: column; gap: 6px;
// // //           .row { 
// // //             display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary);
// // //             i { font-size: 12px; color: var(--text-tertiary); width: 14px; }
// // //             a { color: var(--accent-primary); text-decoration: none; &:hover { text-decoration: underline; } }
// // //           }
// // //         }

// // //         .card-actions {
// // //           margin-top: auto; padding-top: 12px; border-top: 1px dashed var(--border-secondary);
// // //           display: flex; justify-content: space-between; align-items: center;
          
// // //           .rsvp-group {
// // //             display: flex; align-items: center; gap: 8px;
// // //             .label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; }
// // //             .btn-rsvp {
// // //               width: 28px; height: 28px; border-radius: 50%; border: 1px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: 0.2s;
// // //               &.accept { background: #dcfce7; color: #16a34a; &:hover { background: #16a34a; color: white; } }
// // //               &.tentative { background: #ffedd5; color: #f97316; &:hover { background: #f97316; color: white; } }
// // //               &.decline { background: #fee2e2; color: #ef4444; &:hover { background: #ef4444; color: white; } }
// // //             }
// // //           }

// // //           .my-status {
// // //             font-size: 11px; font-weight: 600;
// // //             .role-badge { color: var(--text-tertiary); background: var(--bg-ternary); padding: 4px 8px; border-radius: 4px; }
// // //             .response-badge { 
// // //               padding: 4px 8px; border-radius: 4px;
// // //               &.accepted { background: #dcfce7; color: #15803d; }
// // //               &.declined { background: #fee2e2; color: #b91c1c; }
// // //               &.tentative { background: #ffedd5; color: #c2410c; }
// // //               &.pending { background: #f1f5f9; color: #64748b; }
// // //             }
// // //           }

// // //           .org-actions {
// // //             display: flex; gap: 6px;
// // //             .btn-sm {
// // //               font-size: 10px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-secondary); background: transparent; cursor: pointer; font-weight: 600; color: var(--text-secondary);
// // //               &:hover { background: var(--bg-ternary); color: var(--text-primary); }
// // //               &.danger:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }
// // //             }
// // //           }
// // //         }
// // //       }
// // //     }

// // //     /* Utilities */
// // //     .loading-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); .spinner { width: 30px; height: 30px; border: 3px solid var(--border-secondary); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; } }
// // //     .empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); i { font-size: 3rem; margin-bottom: 16px; opacity: 0.3; } h3 { color: var(--text-primary); margin: 0 0 8px 0; } .btn-link { background: none; border: none; color: var(--accent-primary); text-decoration: underline; cursor: pointer; } }
// // //     @keyframes spin { to { transform: rotate(360deg); } }
// // //   `]
// // // })
// // // export class MeetingListComponent {
// // //   private noteService = inject(NoteService);
// // //   private authService = inject(AuthService);
// // //   private fb = inject(FormBuilder);

// // //   // --- State ---
// // //   meetings = signal<Meeting[]>([]);
// // //   activeFilter = signal<MeetingFilter>('upcoming');
// // //   isLoading = signal(true);
// // //   today = new Date();

// // //   // --- Computed ---
// // //   // Fix: Converted Observable 'currentUser$' to Signal using toSignal()
// // //   currentUser = toSignal(this.authService.currentUser$);

// // //   filteredMeetings = computed(() => {
// // //     const filter = this.activeFilter();
// // //     const all = this.meetings();
// // //     const now = new Date();

// // //     return all.filter(m => {
// // //       const start = new Date(m.startTime);
// // //       if (filter === 'cancelled') return m.status === 'cancelled';
// // //       if (m.status === 'cancelled') return false; // Hide cancelled from other views

// // //       if (filter === 'upcoming') return start >= now;
// // //       if (filter === 'past') return start < now;
// // //       if (filter === 'pending') {
// // //         return start >= now && this.getMyRsvp(m) === 'pending' && !this.isOrganizer(m);
// // //       }
// // //       return true;
// // //     }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
// // //   });

// // //   counts = computed(() => {
// // //     const all = this.meetings();
// // //     const now = new Date();
// // //     return {
// // //       upcoming: all.filter(m => new Date(m.startTime) >= now && m.status !== 'cancelled').length,
// // //       pending: all.filter(m => new Date(m.startTime) >= now && m.status !== 'cancelled' && this.getMyRsvp(m) === 'pending' && !this.isOrganizer(m)).length
// // //     };
// // //   });

// // //   constructor() {
// // //     this.loadMeetings();
// // //   }

// // //   // --- Data Loading ---
// // //   loadMeetings() {
// // //     this.isLoading.set(true);
// // //     // Fetch 'active' meetings by default, or all if API supports it. 
// // //     // Assuming getUserMeetings returns all relevant meetings for the user.
// // //     this.noteService.getUserMeetings().subscribe({
// // //       next: (res) => {
// // //         this.meetings.set(res.data.meetings);
// // //         this.isLoading.set(false);
// // //       },
// // //       error: (err) => {
// // //         console.error('Failed to load meetings', err);
// // //         this.isLoading.set(false);
// // //       }
// // //     });
// // //   }

// // //   // --- Actions ---
// // //   setFilter(filter: MeetingFilter) {
// // //     this.activeFilter.set(filter);
// // //   }

// // //   onCreateMeeting() {
// // //     // Logic to open create meeting dialog or navigate
// // //     console.log('Open Create Meeting Dialog');
// // //     // Example: this.dialogService.open(CreateMeetingComponent);
// // //   }

// // //   updateStatus(id: string, status: string) {
// // //     if (!confirm(`Mark meeting as ${status}?`)) return;
// // //     this.noteService.updateMeetingStatus(id, { status }).subscribe(res => {
// // //       this.updateLocalMeeting(res.data.meeting);
// // //     });
// // //   }

// // //   onRsvp(id: string, response: 'accepted' | 'declined' | 'tentative') {
// // //     this.noteService.rsvpToMeeting(id, response).subscribe(() => {
// // //       // Update local state optimistically
// // //       this.meetings.update(list => list.map(m => {
// // //         if (m._id !== id) return m;
// // //         // Update participant rsvp
// // //         const user = this.currentUser();
// // //         if (!user || !m.participants) return m;
        
// // //         const updatedParticipants = m.participants.map(p => {
// // //            // Check matching user ID (handling populated object vs string ID)
// // //            const pUserId = typeof p.user === 'string' ? p.user : p.user._id;
// // //            if (pUserId === user._id) {
// // //              return { ...p, rsvp: response };
// // //            }
// // //            return p;
// // //         });
// // //         return { ...m, participants: updatedParticipants };
// // //       }));
// // //     });
// // //   }

// // //   // --- Helpers ---
// // //   updateLocalMeeting(updated: Meeting) {
// // //     this.meetings.update(list => list.map(m => m._id === updated._id ? updated : m));
// // //   }

// // //   isOrganizer(meeting: Meeting): boolean {
// // //     const user = this.currentUser();
// // //     if (!user) return false;
// // //     const orgId = typeof meeting.organizer === 'string' ? meeting.organizer : meeting.organizer._id;
// // //     return orgId === user._id;
// // //   }

// // //   getMyRsvp(meeting: Meeting): string {
// // //     const user = this.currentUser();
// // //     if (!user || !meeting.participants) return 'unknown';
    
// // //     const p = meeting.participants.find(part => {
// // //       const partId = typeof part.user === 'string' ? part.user : part.user._id;
// // //       return partId === user._id;
// // //     });
// // //     return p ? p.rsvp : 'unknown';
// // //   }

// // //   getOrganizerName(meeting: Meeting): string {
// // //     if (typeof meeting.organizer === 'object' && meeting.organizer.name) {
// // //       return meeting.organizer.name;
// // //     }
// // //     return 'Unknown';
// // //   }

// // //   getDuration(meeting: Meeting): number {
// // //     const start = new Date(meeting.startTime).getTime();
// // //     const end = new Date(meeting.endTime).getTime();
// // //     return Math.round((end - start) / 60000); // Minutes
// // //   }

// // //   shouldShowRsvp(meeting: Meeting): boolean {
// // //     return !this.isOrganizer(meeting) && 
// // //            this.getMyRsvp(meeting) === 'pending' && 
// // //            meeting.status === 'scheduled';
// // //   }
// // // }