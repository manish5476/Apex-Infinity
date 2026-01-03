import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceManagerComponent } from './attendance-manager.component';

describe('AttendanceManagerComponent', () => {
  let component: AttendanceManagerComponent;
  let fixture: ComponentFixture<AttendanceManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendanceManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
