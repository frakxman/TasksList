import { TestBed } from '@angular/core/testing';

import { TaksService } from './taks.service';

describe('TaksService', () => {
  let service: TaksService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaksService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
