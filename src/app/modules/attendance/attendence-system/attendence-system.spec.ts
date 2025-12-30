import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendenceSystem } from './attendence-system';

describe('AttendenceSystem', () => {
  let component: AttendenceSystem;
  let fixture: ComponentFixture<AttendenceSystem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendenceSystem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendenceSystem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
