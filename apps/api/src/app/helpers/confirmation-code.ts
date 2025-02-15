import { randomInt } from 'node:crypto';

const CODE_LENGTH = 6;
const CODE_MIN_LENGTH = Math.pow(10, CODE_LENGTH - 1);
const CODE_MAX_LENGTH = Math.pow(10, CODE_LENGTH);

export const generateRandomConfirmationCode = (): string => randomInt(CODE_MIN_LENGTH, CODE_MAX_LENGTH).toString();
