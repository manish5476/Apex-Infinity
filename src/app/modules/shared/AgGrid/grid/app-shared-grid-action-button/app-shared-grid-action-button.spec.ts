import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppSharedGridActionButton } from './app-shared-grid-action-button';

describe('AppSharedGridActionButton', () => {
  let component: AppSharedGridActionButton;
  let fixture: ComponentFixture<AppSharedGridActionButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSharedGridActionButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppSharedGridActionButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
