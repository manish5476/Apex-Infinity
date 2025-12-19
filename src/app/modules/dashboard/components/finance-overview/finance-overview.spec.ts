import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceOverview } from './finance-overview';

describe('FinanceOverview', () => {
  let component: FinanceOverview;
  let fixture: ComponentFixture<FinanceOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanceOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinanceOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
