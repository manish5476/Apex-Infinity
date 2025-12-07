import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'activity-log',
  imports: [CommonModule],
  template: `
    <div class="glass-card">
      <h3>Recent Activity</h3>
      <div class="timeline">
        @for(e of events; track e._id) {
          <div class="event">
            <div class="dot"></div>
            <div class="content">
              <div class="desc">{{ e.action }}</div>
              <div class="time">{{ e.createdAt | date:'short' }}</div>
            </div>
          </div>
        }
        @if(!events?.length) { <div class="empty">No recent events</div> }
      </div>
    </div>
  `,
  styles: [`
  .glass-card {
    background: var(--bg-secondary); border: 1px solid var(--border-primary);
    border-radius: var(--ui-border-radius-xl); padding: 20px;
    h3 { margin: 0 0 16px 0; font-size: 15px; color: var(--text-primary); }
    .timeline { display: flex; flex-direction: column; gap: 0; }
    .event { display: flex; gap: 12px; position: relative; padding-bottom: 16px; }
    .event::before { content: ''; position: absolute; left: 3px; top: 8px; width: 1px; height: 100%; background: var(--border-secondary); }
    .event:last-child::before { display: none; }
    .dot { width: 7px; height: 7px; background: var(--accent-secondary); border-radius: 50%; margin-top: 6px; z-index: 1; }
    .content { flex: 1; }
    .desc { font-size: 13px; color: var(--text-primary); }
    .time { font-size: 11px; color: var(--text-secondary); }
    .empty { font-size: 12px; color: var(--text-secondary); font-style: italic; }
  }
`]

})
export class ActivityLogComponent {
  @Input() events: any[] | null = [];
}

