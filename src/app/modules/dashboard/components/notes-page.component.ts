import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteTimelineComponent } from './notes-timeline/notes-timeline';
import { NotesManagerComponent } from '../../shared/components/notes-manager/notes-manager.component';

@Component({
  selector: 'app-notes-page',
  standalone: true,
  imports: [CommonModule, NoteTimelineComponent, NotesManagerComponent],
  template: `
    <div class="notes-page-shell">
      <app-note-timeline 
        class="timeline-bar"
        (dateSelected)="onDateSelected($event)">
      </app-note-timeline>

      <div class="workspace-wrapper">
        <app-notes-manager 
          class="notes-workspace"
          [date]="currentDateObj">
        </app-notes-manager>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }

    .notes-page-shell {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background: var(--bg-primary);
    }

    .timeline-bar {
      position: sticky;
      top: 64px; 
      z-index: 30;
      padding: 6px 12px;
      background: rgba(15,23,42,0.9);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255,255,255,.05);
    }

    .workspace-wrapper {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      padding: 0;
    }

    .notes-workspace {
      height: 100%;
      width: 100%;
      display: flex;
      overflow: hidden;
    }
  `]
})
export class NotesPageComponent {
  currentDateObj = { date: new Date() };

  onDateSelected(date: Date) {
    this.currentDateObj = { date };
  }
}

// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { NoteTimelineComponent } from './notes-timeline/notes-timeline';
// import { NotesManagerComponent } from '../../shared/components/notes-manager/notes-manager.component';
// // Adjust imports to point to where we actually created these components


// @Component({
//   selector: 'app-notes-page',
//   standalone: true,
//   imports: [CommonModule, NoteTimelineComponent, NotesManagerComponent],
//   template: `
//    <div class="notes-page-shell">
//      <app-note-timeline class="timeline-bar"  (dateSelected)="onDateSelected($event)"></app-note-timeline>
//   <app-notes-manager class="notes-workspace" />
// </div>

//   `,
//   styles: [`
//     :host {
//         display: block;
//         width: 100%;
//         height: 100%;
//         /* Crucial: Prevents the host from growing beyond the parent container */
//         overflow: hidden; 
//     }

//     .page-container {
//       display: flex;
//       flex-direction: column;
//       /* CHANGE: Use 100% instead of 100vh to fit within the main layout's content area */
//       height: 100%; 
//       width: 100%;
//       background-color: var(--bg-ternary);
//     }

//     .timeline-section {
//       flex: 0 0 auto; /* Don't shrink or grow */
//       z-index: 10;
//       background: var(--bg-primary);
//       border-bottom: 1px solid var(--border-primary);
//       box-shadow: var(--shadow-sm);
//     }

//     .manager-section {
//       flex: 1; /* Take all remaining height */
//       display: flex; 
//       flex-direction: column;
//       width: 100%;
//       padding: var(--spacing-lg); 
      
//       /* IMPORTANT: min-height: 0 is required for nested flex scrolling to work */
//       min-height: 0; 
//       overflow: hidden; /* Ensure padding doesn't cause scroll on this container */
//     }
    
//     /* Force the child component to fill the space */
//     app-notes-manager {
//         flex: 1;
//         width: 100%;
//         height: 100%;
//         min-height: 0;
//         display: flex; 
//         flex-direction: column;
//     }
//     .timeline-bar {
//   position: sticky;
//   top: 64px; // below main navbar
//   z-index: 15;
//   background: rgba(15, 23, 42, 0.9);
//   backdrop-filter: blur(10px);
//   border-bottom: 1px solid rgba(255,255,255,.04);

//   display: flex;
//   align-items: center;
//   padding: 12px 24px;

//   overflow-x: auto;
//   scrollbar-width: none;
// }

// .timeline-bar::-webkit-scrollbar {
//   display: none;
// }

//   `]
// })
// export class NotesPageComponent {
//   // Initialize with today's date
//   currentDateObj = { date: new Date() };

//   onDateSelected(newDate: Date): void {
//     // Wrap it in a new object reference to trigger OnChanges in the child
//     this.currentDateObj = { date: newDate };
//   }
// }