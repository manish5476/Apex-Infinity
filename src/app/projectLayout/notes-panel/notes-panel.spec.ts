import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesPanel } from './notes-panel';

describe('NotesPanel', () => {
  let component: NotesPanel;
  let fixture: ComponentFixture<NotesPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotesPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
