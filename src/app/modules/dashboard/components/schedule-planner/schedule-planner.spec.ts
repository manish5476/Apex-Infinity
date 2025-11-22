import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedulePlanner } from './schedule-planner';

describe('SchedulePlanner', () => {
  let component: SchedulePlanner;
  let fixture: ComponentFixture<SchedulePlanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulePlanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchedulePlanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
