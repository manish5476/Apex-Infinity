import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteTimelineComponent } from './notes-timeline/notes-timeline';
import { NotesManagerComponent } from '../../shared/components/notes-manager/notes-manager.component';
// Adjust imports to point to where we actually created these components


@Component({
  selector: 'app-notes-page',
  standalone: true,
  imports: [CommonModule, NoteTimelineComponent, NotesManagerComponent],
  template: `
    <div class="page-container">
      <!-- Timeline on top (Fixed Height) -->
      <div class="timeline-section">
        <app-note-timeline (dateSelected)="onDateSelected($event)"></app-note-timeline>
      </div>

      <!-- Manager fills remaining space -->
      <div class="manager-section">
        <app-notes-manager [date]="currentDateObj"></app-notes-manager>
      </div>
    </div>
  `,
  styles: [`
    :host {
        display: block;
        width: 100%;
        height: 100%;
        /* Crucial: Prevents the host from growing beyond the parent container */
        overflow: hidden; 
    }

    .page-container {
      display: flex;
      flex-direction: column;
      /* CHANGE: Use 100% instead of 100vh to fit within the main layout's content area */
      height: 100%; 
      width: 100%;
      background-color: var(--bg-ternary);
    }

    .timeline-section {
      flex: 0 0 auto; /* Don't shrink or grow */
      z-index: 10;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-primary);
      box-shadow: var(--shadow-sm);
    }

    .manager-section {
      flex: 1; /* Take all remaining height */
      display: flex; 
      flex-direction: column;
      width: 100%;
      padding: var(--spacing-lg); 
      
      /* IMPORTANT: min-height: 0 is required for nested flex scrolling to work */
      min-height: 0; 
      overflow: hidden; /* Ensure padding doesn't cause scroll on this container */
    }
    
    /* Force the child component to fill the space */
    app-notes-manager {
        flex: 1;
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex; 
        flex-direction: column;
    }
  `]
})
export class NotesPageComponent {
  // Initialize with today's date
  currentDateObj = { date: new Date() };

  onDateSelected(newDate: Date): void {
    // Wrap it in a new object reference to trigger OnChanges in the child
    this.currentDateObj = { date: newDate };
  }
}

// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { NoteTimelineComponent } from './notes-timeline/notes-timeline'; // Check path
// import { NotesManagerComponent } from '../../shared/components/notes-manager/notes-manager.component';

// @Component({
//   selector: 'app-notes-page',
//   standalone: true,
//   imports: [CommonModule, NoteTimelineComponent, NotesManagerComponent],
//   template: `
//     <div class="page-container">
//       <div class="timeline-section">
//         <app-note-timeline (dateSelected)="onDateSelected($event)"></app-note-timeline>
//       </div>

//       <div class="manager-section">
//         <app-notes-manager [date]="currentDateObj"></app-notes-manager>
//       </div>
//     </div>
//   `,
// styles: [`
//     :host {
//         display: block;
//         height: 100%;
//         width: 100%;
//         /* Ensure the host itself doesn't cause overflow */
//         overflow: hidden; 
//     }

//     .page-container {
//       display: flex;
//       flex-direction: column;
//       height: 100vh;
//       background-color: var(--bg-ternary);
//       width: 100%;
//     }

//     .timeline-section {
//       flex: 0 0 auto; /* Fixed height for timeline */
//       z-index: 10;
//       background: var(--bg-primary);
//       border-bottom: 1px solid var(--border-primary);
//       box-shadow: var(--shadow-sm);
//     }

//     .manager-section {
//       flex: 1; 
//       /* Make this a flex container so the child (app-notes-manager) fills it */
//       display: flex; 
//       flex-direction: column;
      
//       width: 100%;
//       padding: var(--spacing-lg); 
      
//       /* IMPORTANT: Don't use overflow: hidden here if you want padding visible */
//       /* overflow: hidden;  <-- REMOVE THIS */
//       min-height: 0; /* Crucial for nested flex scrolling */
//     }
    
//     /* Force the child component to fill the space */
//     app-notes-manager {
//         flex: 1;
//         width: 100%;
//         min-height: 0; /* Allows internal scrollbars to work */
//         display: flex; 
//         flex-direction: column;
//     }
//   `]
// })
// export class NotesPageComponent {
//   // Initialize with today's date
//   currentDateObj = { date: new Date() };

//   onDateSelected(newDate: Date): void {
//     // console.log('📅 Date Changed:', newDate);
//     // Wrap it in a new object reference to trigger OnChanges in the child
//     this.currentDateObj = { date: newDate };
//   }
// }