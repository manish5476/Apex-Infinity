import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppSharedGrid } from './app-shared-grid';

describe('AppSharedGrid', () => {
  let component: AppSharedGrid;
  let fixture: ComponentFixture<AppSharedGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSharedGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppSharedGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
