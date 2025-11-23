import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesTimeline } from './notes-timeline';

describe('NotesTimeline', () => {
  let component: NotesTimeline;
  let fixture: ComponentFixture<NotesTimeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesTimeline]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotesTimeline);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
