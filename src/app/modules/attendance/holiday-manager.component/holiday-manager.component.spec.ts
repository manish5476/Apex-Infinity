import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HolidayManagerComponent } from './holiday-manager.component';

describe('HolidayManagerComponent', () => {
  let component: HolidayManagerComponent;
  let fixture: ComponentFixture<HolidayManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HolidayManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HolidayManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
