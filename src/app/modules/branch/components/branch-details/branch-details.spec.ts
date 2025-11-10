import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchDetails } from './branch-details';

describe('BranchDetails', () => {
  let component: BranchDetails;
  let fixture: ComponentFixture<BranchDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BranchDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
