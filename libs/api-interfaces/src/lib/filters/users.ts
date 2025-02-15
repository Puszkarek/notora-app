import type { ID } from '../common';

export type CreateOneUserFilter = {
  readonly organizationID: ID;
  readonly loggedUserID: ID;
};

export type UpdateOneUserFilter = {
  readonly userID: ID;
  readonly organizationID: ID;
  readonly loggedUserID: ID;
};

export type UpdateMyUserFilter = {
  readonly userID: ID;
};

export type SelfDeleteOneUserFilter = {
  readonly userID: ID;
  readonly organizationID: ID;
};

export type DeleteOneUserFilter = {
  readonly userID: ID;
  readonly loggedUserID: ID;
  readonly organizationID: ID;
};

export type IsOrganizationOwnerFilter = {
  readonly userID: ID;
  readonly organizationID: ID;
};

export type GetManyUsersFilter = {
  readonly organizationID: ID;
  readonly loggedUserID: ID;
};

export type GetOneUserFilter = {
  readonly userID: ID;
  readonly organizationID: ID;
};
