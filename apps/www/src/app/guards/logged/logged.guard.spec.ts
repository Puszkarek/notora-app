import { StoreTestingModule } from '@www/app/stores/root/store-testing.module';
import { TestBed } from '@angular/core/testing';

import { LoggedGuard } from './logged.guard';

describe(LoggedGuard.name, () => {
  let guard: LoggedGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StoreTestingModule],
    });
    guard = TestBed.inject(LoggedGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
