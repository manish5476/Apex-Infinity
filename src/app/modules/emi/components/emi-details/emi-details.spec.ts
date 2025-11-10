import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmiDetails } from './emi-details';

describe('EmiDetails', () => {
  let component: EmiDetails;
  let fixture: ComponentFixture<EmiDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmiDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmiDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
