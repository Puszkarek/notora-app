import { StoreTestingModule } from '@www/app/stores/root/store-testing.module';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe(AuthService.name, () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StoreTestingModule],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
