import { User, USER_ROLE } from '@api-interfaces';
import { uuidv7 } from 'uuidv7';

/** The system should initialize with a default user */
export const DEFAULT_USER: Omit<User, 'organization' | 'email'> = {
  id: uuidv7(),
  name: 'Default User',
  role: USER_ROLE.admin,
};
