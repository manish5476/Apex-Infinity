import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-meeting-details-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, TabsModule, AvatarModule, TooltipModule, DatePipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="meeting-details-container">
      
      <!-- HEADER -->
      <div class="details-header">
        <div class="header-top">
          <p-tag [value]="meeting.status" [severity]="getStatusSeverity(meeting.status)"></p-tag>
          <span class="type-label">
            <i [class]="getLocationIcon(meeting.locationType)"></i>
            {{ meeting.locationType | titlecase }}
          </span>
        </div>
        <h1>{{ meeting.title }}</h1>
        <div class="time-row">
          <i class="pi pi-calendar"></i>
          <span>{{ meeting.startTime | date:'fullDate' }}</span>
          <span class="dot">&bull;</span>
          <i class="pi pi-clock"></i>
          <span>{{ meeting.startTime | date:'shortTime' }} - {{ meeting.endTime | date:'shortTime' }}</span>
        </div>
      </div>

      <!-- TABS -->
      <p-tabs value="0">
        <p-tablist>
          <p-tab value="0">Overview</p-tab>
          <p-tab value="1">Attendees ({{ meeting.participants?.length || 0 }})</p-tab>
        </p-tablist>
        
        <p-tabpanels>
          <!-- TAB 1: OVERVIEW -->
          <p-tabpanel value="0">
            <div class="panel-content">
              
              <!-- Join Button Area -->
              @if (meeting.locationType === 'virtual' || meeting.locationType === 'hybrid') {
                <div class="join-card">
                  <div class="link-info">
                    <span class="label">Video Link</span>
                    <a [href]="meeting.virtualLink" target="_blank" class="meeting-link">{{ meeting.virtualLink || 'No link provided' }}</a>
                  </div>
                  <p-button label="Join Meeting" icon="pi pi-video" [disabled]="!meeting.virtualLink" (onClick)="openLink(meeting.virtualLink)"></p-button>
                </div>
              }

              @if (meeting.locationType === 'physical' || meeting.locationType === 'hybrid') {
                <div class="info-row">
                  <i class="pi pi-map-marker"></i>
                  <div>
                    <label>Location</label>
                    <p>{{ meeting.physicalLocation || 'TBD' }}</p>
                  </div>
                </div>
              }

              <div class="agenda-section">
                <h3>Agenda</h3>
                <div class="agenda-text custom-scrollbar">
                  {{ meeting.agenda || meeting.description || 'No agenda provided for this meeting.' }}
                </div>
              </div>

              <div class="organizer-row">
                <p-avatar 
                  [label]="getInitials(getOrganizerName(meeting))" 
                  shape="circle" 
                  [style]="{'background-color': '#EEF2FF', 'color': '#4F46E5'}">
                </p-avatar>
                <div class="org-text">
                  <span class="label">Organizer</span>
                  <span class="name">{{ getOrganizerName(meeting) }}</span>
                </div>
              </div>
            </div>
          </p-tabpanel>

          <!-- TAB 2: ATTENDEES -->
          <p-tabpanel value="1">
            <div class="attendees-list custom-scrollbar">
              @for (p of meeting.participants; track p.user._id || p.user) {
                <div class="attendee-item">
                  <div class="left">
                    <p-avatar 
                      [label]="getInitials(p.user.name || 'U')" 
                      shape="circle"
                      styleClass="mr-2">
                    </p-avatar>
                    <div class="person-info">
                      <span class="name">{{ p.user.name || 'Unknown User' }}</span>
                      <span class="role">{{ p.role | titlecase }}</span>
                    </div>
                  </div>
                  <div class="right">
                    <span class="rsvp-badge" [ngClass]="p.invitationStatus || 'pending'">
                      <i [class]="getRsvpIcon(p.invitationStatus)"></i>
                      {{ (p.invitationStatus || 'Pending') | titlecase }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

      <!-- FOOTER ACTIONS -->
      <div class="dialog-footer">
        <p-button label="Close" styleClass="p-button-text" (onClick)="close()"></p-button>
        <!-- Optional: Add 'Edit' button if user is organizer -->
      </div>

    </div>
  `,
  styles: [`
    .meeting-details-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      font-family: var(--font-body);
    }

    /* Header */
    .details-header {
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--border-secondary);
      
      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);
        
        .type-label {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
        }
      }

      h1 {
        font-family: var(--font-heading);
        font-size: var(--font-size-2xl);
        font-weight: 700;
        margin: 0 0 var(--spacing-xs) 0;
        color: var(--text-primary);
      }

      .time-row {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-secondary);
        font-size: var(--font-size-md);
        
        .dot { color: var(--text-tertiary); }
      }
    }

    /* Content */
    .panel-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
      padding-top: var(--spacing-md);
    }

    .join-card {
      background: var(--bg-ternary);
      padding: var(--spacing-lg);
      border-radius: var(--ui-border-radius);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid var(--border-secondary);

      .link-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        .label { font-size: 11px; text-transform: uppercase; color: var(--text-tertiary); font-weight: 700; }
        .meeting-link { color: var(--accent-primary); font-weight: 600; text-decoration: none; &:hover { text-decoration: underline; } }
      }
    }

    .info-row {
      display: flex;
      gap: var(--spacing-md);
      i { font-size: 1.2rem; color: var(--text-tertiary); margin-top: 2px; }
      label { display: block; font-size: 11px; text-transform: uppercase; color: var(--text-tertiary); font-weight: 700; margin-bottom: 2px; }
      p { margin: 0; font-weight: 500; }
    }

    .agenda-section {
      h3 { font-size: var(--font-size-md); font-weight: 700; margin: 0 0 var(--spacing-sm) 0; }
      .agenda-text {
        background: var(--bg-secondary);
        padding: var(--spacing-md);
        border-radius: var(--ui-border-radius);
        border: 1px solid var(--border-secondary);
        font-size: var(--font-size-sm);
        line-height: 1.6;
        max-height: 150px;
        overflow-y: auto;
        white-space: pre-wrap;
      }
    }

    .organizer-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px dashed var(--border-secondary);
      
      .org-text {
        display: flex;
        flex-direction: column;
        .label { font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; font-weight: 700; }
        .name { font-weight: 600; font-size: var(--font-size-sm); }
      }
    }

    /* Attendees List */
    .attendees-list {
      display: flex;
      flex-direction: column;
      max-height: 300px;
      overflow-y: auto;
      /* Add some padding for the new tab panel spacing */
      padding-top: var(--spacing-md);
    }

    .attendee-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md) 0;
      border-bottom: 1px solid var(--border-secondary);

      &:last-child { border-bottom: none; }

      .left {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        
        .person-info {
          display: flex;
          flex-direction: column;
          .name { font-weight: 600; font-size: var(--font-size-sm); }
          .role { font-size: 11px; color: var(--text-tertiary); }
        }
      }

      .rsvp-badge {
        font-size: 11px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 4px;

        &.accepted { color: var(--color-success); background: var(--color-success-bg); }
        &.declined { color: var(--color-error); background: var(--color-error-bg); }
        &.tentative { color: var(--color-warning); background: var(--color-warning-bg); }
        &.pending { color: var(--text-secondary); background: var(--bg-ternary); }
      }
    }

    /* Footer */
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      padding-top: var(--spacing-md);
    }
  `]
})
export class MeetingDetailsDialogComponent {
  config = inject(DynamicDialogConfig);
  ref = inject(DynamicDialogRef);

  meeting = this.config.data;
  activeTab = 0;

  close() {
    this.ref.close();
  }

  openLink(url: string) {
    if (url) window.open(url, '_blank');
  }

  // --- Helpers ---
  getOrganizerName(m: any): string {
    return m.organizer?.name || 'Unknown';
  }

  getInitials(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  getStatusSeverity(status: string) {
    switch (status) {
      case 'confirmed': case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'in_progress': return 'info';
      default: return 'warn'; // scheduled/pending
    }
  }

  getLocationIcon(type: string): string {
    switch (type) {
      case 'virtual': return 'pi pi-video';
      case 'physical': return 'pi pi-map-marker';
      default: return 'pi pi-globe';
    }
  }

  getRsvpIcon(status: string): string {
    switch (status) {
      case 'accepted': return 'pi pi-check';
      case 'declined': return 'pi pi-times';
      case 'tentative': return 'pi pi-question';
      default: return 'pi pi-clock';
    }
  }
}