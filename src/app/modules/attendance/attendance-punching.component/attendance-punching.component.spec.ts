import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendancePunchingComponent } from './attendance-punching.component';

describe('AttendancePunchingComponent', () => {
  let component: AttendancePunchingComponent;
  let fixture: ComponentFixture<AttendancePunchingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendancePunchingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendancePunchingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
