/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DropdownTriggerDirective } from './dropdown-trigger.directive';

describe(DropdownTriggerDirective.name, () => {
  let directive: DropdownTriggerDirective;
  beforeEach(() => {
    directive = new DropdownTriggerDirective(null!, null!, null!);
  });
  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
