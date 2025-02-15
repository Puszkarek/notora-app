import * as fs from 'node:fs';
import { promisify } from 'node:util';

import * as E from 'fp-ts/lib/Either';
import { flow } from 'fp-ts/lib/function';
import * as IOEither from 'fp-ts/lib/IOEither';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import { append } from 'ramda';

/** Dynamically create schema when in pipe */
export const schemaType = (schema: t.Props): t.TypeC<t.Props> => t.type(schema);

/** Safe Stringify */
export const safeStringifyJSON = <T>(data: ReadonlyArray<T>): IOEither.IOEither<Error, string> =>
  IOEither.tryCatch(() => JSON.stringify(data), E.toError);

/** Safe Parse */
export const safeParseJSON = <T>(data: string): IOEither.IOEither<Error, T> =>
  IOEither.tryCatch(() => JSON.parse(data) as T, E.toError);

/** Make promises */
const readFromFile = promisify(fs.readFile);
const writeToFile = promisify(fs.writeFile);

/** Get file data as string */
export const getFileContents = (path: string): TE.TaskEither<Error, string> =>
  TE.tryCatch(async () => readFromFile(path, 'utf8'), E.toError);

/** Write data to file */
export const writeContentsToFile =
  (path: string) =>
  (contents: string): TE.TaskEither<Error, void> =>
    TE.tryCatch(async () => writeToFile(path, contents), E.toError);

/** Get file data as Generic T */
export const getFileData = <T>(): ((path: string) => TE.TaskEither<Error, T>) =>
  flow(
    getFileContents,
    TE.chain((rawString: string) => TE.fromIOEither(safeParseJSON<T>(rawString))),
  );

/** Save data to file */
export const saveData =
  (pathToRead: string) =>
  (pathToSave: string) =>
  <T>(data: T): TE.TaskEither<Error, void> =>
    flow(
      getFileData<T>(),
      TE.map(list => append(data)([list])),
      TE.chain(parsedData => TE.fromIOEither(safeStringifyJSON(parsedData))),
      TE.chain(writeContentsToFile(pathToSave)),
    )(pathToRead);
