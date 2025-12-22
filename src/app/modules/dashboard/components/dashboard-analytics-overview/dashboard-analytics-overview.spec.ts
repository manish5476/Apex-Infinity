import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAnalyticsOverview } from './dashboard-analytics-overview';

describe('DashboardAnalyticsOverview', () => {
  let component: DashboardAnalyticsOverview;
  let fixture: ComponentFixture<DashboardAnalyticsOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAnalyticsOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardAnalyticsOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
