import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicCellComponent } from './dynamic-cell.component';

describe('DynamicCellComponent', () => {
  let component: DynamicCellComponent;
  let fixture: ComponentFixture<DynamicCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicCellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
