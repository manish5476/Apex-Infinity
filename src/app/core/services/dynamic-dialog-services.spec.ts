import { TestBed } from '@angular/core/testing';

import { DynamicDialogServices } from './dynamic-dialog-services';

describe('DynamicDialogServices', () => {
  let service: DynamicDialogServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicDialogServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
