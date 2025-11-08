import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicAgGridColumnsComponent } from './dynamic-ag-grid-columns.component';

describe('DynamicAgGridColumnsComponent', () => {
  let component: DynamicAgGridColumnsComponent;
  let fixture: ComponentFixture<DynamicAgGridColumnsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicAgGridColumnsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicAgGridColumnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
