import * as t from 'io-ts';
import isEmail from 'validator/lib/isEmail';

export const idCodec = t.string;

export const emailCodec = t.refinement(t.string, isEmail, 'Email');

export type ID = t.TypeOf<typeof idCodec>;
export type Email = t.TypeOf<typeof emailCodec>;
