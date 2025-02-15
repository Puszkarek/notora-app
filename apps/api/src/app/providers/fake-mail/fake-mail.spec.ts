import { MailProvider } from '@server/app/interfaces/mail';

import { FakeMailProvider } from './fake-mail';

/**
 * If other mail provider start to be implemented we can abstract and just change update the
 * `beforeEach` since they will follow the same interface
 */
describe(FakeMailProvider.name, () => {
  let provider: MailProvider;
  beforeEach(() => {
    provider = new FakeMailProvider();
  });

  it('should create', () => {
    expect(provider).toBeTruthy();
  });
});
