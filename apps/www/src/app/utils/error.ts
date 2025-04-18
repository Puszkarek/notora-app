import { UNKNOWN_ERROR_MESSAGE } from '@www/app/constants/messages';
import { HttpErrorResponse } from '@angular/common/http';
import { isError, isString } from '@utils';

export const toError = (value: unknown): Error => {
  if (value instanceof HttpErrorResponse) {
    const errorMessage: unknown = value.error?.message;
    return new Error(isString(errorMessage) ? errorMessage : UNKNOWN_ERROR_MESSAGE);
  }
  if (isError(value)) {
    return value;
  }

  return new Error(UNKNOWN_ERROR_MESSAGE);
};

export const toErrorMessage = (value: unknown): string => toError(value).message;
