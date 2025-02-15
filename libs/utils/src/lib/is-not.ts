import * as t from 'io-ts';

export const isNotNull = <T>(value: T): value is Exclude<T, null> => !t.null.is(value);

export const isNotUndefined = <T>(value: T): value is Exclude<T, undefined> => !t.undefined.is(value);

export const isNotEmptyString = (value: string): value is string => value !== '';
