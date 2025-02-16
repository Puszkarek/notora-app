import * as t from 'io-ts';
import { isDeepEqual } from 'remeda';

export const isEqual = <T>(valueA: T, valueB: T): valueA is T => {
  return isDeepEqual(valueA, valueB);
};

/**
 * Checks if the value is an Error
 *
 * @param value - The value to check
 * @returns True if the value is an Error
 */
export const isError = (value: unknown): value is Error => value instanceof Error;

/**
 * Checks if the value is an array
 *
 * @param value - The value to check
 * @returns True if the value is an array
 */
export const isArray = <T = unknown>(value: unknown): value is ReadonlyArray<T> => Array.isArray(value);

/**
 * Checks if the value is a string
 *
 * @param value - The value to check
 * @returns True if the value is a string
 */
export const isString: (value: unknown) => value is string = t.string.is;

/**
 * Checks if the value is a number
 * @param value - The value to check
 * @returns True if the value is a number
 */
export const isNull: (value: unknown) => value is null = t.null.is;

/**
 * Checks if the value is a string and not empty
 * @param value - The value to check
 * @returns True if the value is a number
 */
export const isValidString = (value: unknown): value is string => isString(value) && value !== '';
