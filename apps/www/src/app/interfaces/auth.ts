import { User } from '@api-interfaces';

export type LoginStatus =
  | {
      readonly status: 'undefined' | 'needs-login' | 'logout';
    }
  | {
      readonly status: 'logged';
      readonly user: User;
    };
