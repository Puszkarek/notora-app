/* eslint-disable prefer-destructuring */
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Exception, REQUEST_STATUS } from '@server/app/interfaces/error';
import { isArray, isError, isString } from '@utils';
import { option as O } from 'fp-ts';
import { pipe } from 'fp-ts/lib/function';

/**
 * Extract the error from an unknown value
 *
 * @param value - The value to extract the error
 * @returns The extracted error
 */
export const extractError = (value: unknown): Error => {
  return pipe(
    value,

    O.fromPredicate(isError),
    O.getOrElse(() => new Error('Unknown Error')),
  );
};

export const extractErrorMessage = (value: unknown): string => {
  return pipe(
    value,
    O.fromPredicate(isError),
    O.map(error => error.message),
    O.getOrElse(() => 'Unknown Error'),
  );
};

/**
 * Create a new exception
 *
 * @param message - The message of the exception
 * @param statusCode - The status code of the exception
 * @returns The generated exception
 */
const createExceptionError = (message: string, statusCode: REQUEST_STATUS): Exception => ({
  message,
  statusCode,
});

/**
 * The exceptions that can be thrown by the application
 */
export const EXCEPTIONS = {
  /** Converts a unknown error into a known exception with a Code */
  to: {
    /** Code 400 */
    bad: (message: unknown): Exception => createExceptionError(extractErrorMessage(message), REQUEST_STATUS.bad),
    /** Code 409 */
    conflict: (message: unknown): Exception =>
      createExceptionError(extractErrorMessage(message), REQUEST_STATUS.conflict),
    /** Code 404 */
    notFound: (message: unknown): Exception =>
      createExceptionError(extractErrorMessage(message), REQUEST_STATUS.not_found),
    /** Code 401 */
    unauthorized: (message: unknown): Exception =>
      createExceptionError(extractErrorMessage(message), REQUEST_STATUS.unauthorized),
  },
  /** Code 400 */
  bad: (message: string): Exception => createExceptionError(message, REQUEST_STATUS.bad),
  /** Code 404 */
  notFound: (message: string): Exception => createExceptionError(message, REQUEST_STATUS.not_found),
  /** Code 401 */
  unauthorized: (message: string): Exception => createExceptionError(message, REQUEST_STATUS.unauthorized),
  /** Code 403 */
  forbidden: (message: string): Exception => createExceptionError(message, REQUEST_STATUS.forbidden),
  /** Code 409 */
  conflict: (message: string): Exception => createExceptionError(message, REQUEST_STATUS.conflict),
  /** Code 413 */
  tooLarge: (message: string): Exception => createExceptionError(message, REQUEST_STATUS.too_large),
  /** Code 415 */
  unsupportedMediaType: (message: string): Exception =>
    createExceptionError(message, REQUEST_STATUS.unsupported_media_type),
  /** Code 422 */
  unprocessableEntity: (message: string): Exception =>
    createExceptionError(message, REQUEST_STATUS.unprocessable_entity),
};

// * User Prisma Errors

export const getCreateUserPrismaError = (error: unknown): Exception => {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target: unknown = error.meta?.['target'];
        if (isArray(target) && target.includes('email')) {
          return EXCEPTIONS.conflict('Email already exists');
        }
        return EXCEPTIONS.conflict('Unknown conflict');
      }
    }
  }

  return EXCEPTIONS.bad('Unknown Error');
};

export const getUpdateMyUserPrismaError = (error: unknown): Exception => {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target: unknown = error.meta?.['target'];
        if (isArray(target) && target.includes('email')) {
          return EXCEPTIONS.conflict('Email already exists');
        }
        return EXCEPTIONS.conflict('Unknown conflict');
      }
    }
  }

  return EXCEPTIONS.bad('Unknown Error');
};

export const getUpdateOneUserPrismaError = (error: unknown): Exception => {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target: unknown = error.meta?.['target'];
        if (isArray(target) && target.includes('email')) {
          return EXCEPTIONS.conflict('Email already exists');
        }
        return EXCEPTIONS.conflict('Unknown conflict');
      }
    }
  }

  return EXCEPTIONS.bad('Unknown Error');
};

// * Restaurant Prisma Errors
export const getUpdateOneRestaurantPrismaError = (error: unknown): Exception => {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025': {
        return EXCEPTIONS.notFound('Restaurant not found');
      }
    }
  }

  return EXCEPTIONS.bad('Unknown Error');
};

export const getUpdateOneRestaurantStatusPrismaError = (error: unknown): Exception => {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025': {
        return EXCEPTIONS.notFound('Restaurant not found');
      }
    }
  }

  return EXCEPTIONS.bad('Unknown Error');
};

// * Menu Items Prisma Errors

export const getUpdateOneMenuItemPrismaError = (error: unknown): Exception => {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025': {
        return EXCEPTIONS.notFound('Not found');
      }
    }
  }

  return EXCEPTIONS.bad('Unknown Error');
};

export const getDeleteOneMenuItemPrismaError = (error: unknown): Exception => {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025': {
        return EXCEPTIONS.notFound('Not found');
      }
    }
  }

  return EXCEPTIONS.bad('Unknown Error');
};
