import { isNotUndefined } from './is-not';

type UndefinedProperties<T extends object> = {
  readonly [K in keyof T as undefined extends T[K] ? K : never]: T[K];
};

type MakeOptional<T extends object> = Omit<T, keyof UndefinedProperties<T>>;

export const omitUndefined = <T extends object>(object: T): MakeOptional<T> => {
  const filteredEntries = Object.entries(object).filter(([__, value]) => isNotUndefined(value));

  return Object.fromEntries(filteredEntries) as MakeOptional<T>;
};
