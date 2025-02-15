import { Organization } from '@api-interfaces';
import { DEFAULT_USER } from '@server/test/mocks/users';
import { uuidv7 } from 'uuidv7';

/** The system should initialize with a default user */
export const DEFAULT_ORGANIZATION: Organization = {
  id: uuidv7(),
  memberIDs: [DEFAULT_USER.id],
  name: 'Demo Organization',
  ownerID: DEFAULT_USER.id,
  restaurantID: null,
};
