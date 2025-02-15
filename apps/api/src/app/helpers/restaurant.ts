import { PublicRestaurant, Restaurant, Theme } from '@api-interfaces';
import * as t from 'io-ts';
import { uuidv7 } from 'uuidv7';

type IndexedRestaurant = {
  readonly id: string;
  readonly address: string;
  readonly createdAt: Date;
  readonly description: string | null;
  readonly name: string;
  readonly organizationID: string;
  readonly isClosed: boolean;
  readonly phone: string | null;
  readonly orderedMenuIDs: ReadonlyArray<string>;
  readonly menus: ReadonlyArray<{
    readonly id: string;
  }>;
  readonly tables: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;

  readonly theme: Theme | null;
  readonly serviceFeeInPercentage: number | null;

  readonly whatsapp: string | null;
  readonly facebook: string | null;
  readonly instagram: string | null;
  readonly email: string | null;
  readonly website: string | null;
};

type IndexedPublicRestaurant = Omit<IndexedRestaurant, 'menus' | 'tables' | 'orderedMenuIDs'>;

export const indexedRestaurantToRestaurant = ({
  id,
  address,
  createdAt,
  description,
  name,
  organizationID,
  phone,
  isClosed,
  menus,
  orderedMenuIDs,
  tables,
  theme,
  instagram,
  facebook,
  whatsapp,
  email,
  website,
  serviceFeeInPercentage,
}: IndexedRestaurant): Restaurant => ({
  id,
  address,
  createdAt,
  description,
  name,
  organizationID,
  phone,
  isClosed,
  menuIDs: menus
    .map(menu => menu.id)
    .sort((valueA, valueB) => orderedMenuIDs.indexOf(valueA) - orderedMenuIDs.indexOf(valueB)),
  tables,
  instagram,
  facebook,
  whatsapp,
  theme,
  email,
  website,
  serviceFeeInPercentage,
});

// eslint-disable-next-line id-length
export const indexedPublicRestaurantToPublicRestaurant = ({
  id,
  address,
  createdAt,
  description,
  name,
  isClosed,
  phone,
  theme,
  instagram,
  facebook,
  whatsapp,
  email,
  website,
  serviceFeeInPercentage,
}: IndexedPublicRestaurant): PublicRestaurant => ({
  id,
  address,
  createdAt,
  description,
  name,
  isClosed,
  phone,
  instagram,
  facebook,
  whatsapp,
  theme,
  email,
  website,
  serviceFeeInPercentage,
});

type GetPrismaThemeDataOutput =
  | { update?: { id: string } & Theme; disconnect?: { id: string }; create?: Theme & { id: string } }
  | undefined
  | null;

export const getPrismaThemeData = (
  theme: Theme | undefined | null,
  currentThemeID: string | undefined,
): GetPrismaThemeDataOutput => {
  if (t.undefined.is(theme)) {
    return undefined;
  }
  if (t.null.is(theme)) {
    if (currentThemeID) {
      return {
        disconnect: {
          id: currentThemeID,
        },
      };
    }
    return theme;
  }

  if (currentThemeID) {
    return {
      update: {
        id: currentThemeID,
        type: theme.type,
        value: theme.value,
      },
    };
  }

  return {
    create: {
      id: uuidv7(),
      type: theme.type,
      value: theme.value,
    },
  };
};
