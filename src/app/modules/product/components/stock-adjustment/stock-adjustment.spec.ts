import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockAdjustment } from './stock-adjustment';

describe('StockAdjustment', () => {
  let component: StockAdjustment;
  let fixture: ComponentFixture<StockAdjustment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockAdjustment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockAdjustment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
