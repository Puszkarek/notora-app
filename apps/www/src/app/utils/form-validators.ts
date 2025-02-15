import { AbstractControl, ValidationErrors } from '@angular/forms';

const makePositiveNumberValidator: () => (control: Readonly<AbstractControl>) => ValidationErrors | null = () => {
  const minAllowed = 0;
  return control => (control.value <= minAllowed ? { nonZero: true } : null);
};

const makeMinLengthWithTrim: (
  minLength: number,
) => (control: Readonly<AbstractControl<string>>) => ValidationErrors | null = minLength => control => {
  if (typeof control.value !== 'string') {
    return { minLength: true };
  }
  return control.value.trim().length < minLength ? { minLength: true } : null;
};

const makeOptionalMinLengthWithTrim: (
  minLength: number,
) => (control: Readonly<AbstractControl<string>>) => ValidationErrors | null = minLength => control => {
  if (typeof control.value !== 'string' || control.value.trim() === '') {
    return null;
  }
  return control.value.trim().length < minLength ? { minLength: true } : null;
};

const makeMinLength: (
  minLength: number,
) => <T>(control: Readonly<AbstractControl<string | Array<T>>>) => ValidationErrors | null = minLength => control =>
  control.value.length < minLength ? { minLength: true } : null;

export const CUSTOM_VALIDATORS = {
  minLengthWithTrim: makeMinLengthWithTrim,
  optionalMinLengthWithTrim: makeOptionalMinLengthWithTrim,
  minLength: makeMinLength,
  positiveNumber: makePositiveNumberValidator,
};
