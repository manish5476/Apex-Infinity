import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionbuttonsComponent } from './actionbuttons.component';

describe('ActionbuttonsComponent', () => {
  let component: ActionbuttonsComponent;
  let fixture: ComponentFixture<ActionbuttonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionbuttonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionbuttonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
