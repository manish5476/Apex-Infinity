import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationCalendar } from './notification-calendar';

describe('NotificationCalendar', () => {
  let component: NotificationCalendar;
  let fixture: ComponentFixture<NotificationCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationCalendar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationCalendar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
