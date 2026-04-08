import { MessageService } from "primeng/api";
import { Component, inject, signal, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { NoteService } from '../../../core/services/notes.service';
import { Note } from '../../../core/models/note.types';
import { AppMessageService } from "../../../core/services/message.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-template-selector',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './template-selector.component.html',
  styleUrl: './template-selector.component.scss'
})
export class TemplateSelectorComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  ref = inject(DynamicDialogRef);
  noteService = inject(NoteService);
  messageService = inject(AppMessageService);
  templates = signal<Note[]>([]);
  isLoading = signal(true);

ngOnInit() {
    this.isLoading.set(true);
    
    this.noteService.getTemplate().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res.data) ? res.data : (res.data.templates || [res.data.note].filter(Boolean));
        this.templates.set(data);
        this.isLoading.set(false);
        if (data.length === 0) {
          this.messageService.showInfo('No templates found in your library.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.handleHttpError(err);
      }
    });
  }

  selectTemplate(template: Note) {
    this.ref.close(template);
  }

  close() {
    this.ref.close();
  }

  getTypeIcon(type: string) {
    const map: any = { note: 'pi pi-file', meeting: 'pi pi-calendar', task: 'pi pi-check-square', project: 'pi pi-briefcase' };
    return map[type] || 'pi pi-file';
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}