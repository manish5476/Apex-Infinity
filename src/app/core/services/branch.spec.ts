import { TestBed } from '@angular/core/testing';

import { Branch } from './branch';

describe('Branch', () => {
  let service: Branch;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Branch);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
