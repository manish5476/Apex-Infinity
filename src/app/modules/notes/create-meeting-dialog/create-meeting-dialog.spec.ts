import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMeetingDialog } from './create-meeting-dialog';

describe('CreateMeetingDialog', () => {
  let component: CreateMeetingDialog;
  let fixture: ComponentFixture<CreateMeetingDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMeetingDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateMeetingDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
