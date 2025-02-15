import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const KEY_LENGTH = 32;
const asyncScrypt = promisify(scrypt);

// TODO: move to a lib because we also use it in the test
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString('hex');
  const hash = (await asyncScrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const [salt, key] = hash.split(':') as [string, string];
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = (await asyncScrypt(password, salt, KEY_LENGTH)) as Buffer;
  return timingSafeEqual(keyBuffer, derivedKey);
};
