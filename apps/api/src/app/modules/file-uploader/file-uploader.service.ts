/* eslint-disable functional/no-throw-statements */
import { randomBytes } from 'node:crypto';

import { Injectable, Scope } from '@nestjs/common';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { supabaseClient } from '@server/app/helpers/supabase-client';
import { Exception } from '@server/app/interfaces/error';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import { MemoryStoredFile } from 'nestjs-form-data';
import sharp from 'sharp';

export const validFormDataImageFileCodec = new t.Type<MemoryStoredFile, MemoryStoredFile, unknown>(
  'memoryStoredFile',
  (input: unknown): input is MemoryStoredFile => input instanceof MemoryStoredFile,
  (input, context) => {
    if (input instanceof MemoryStoredFile) {
      return t.success(input);
    }
    return t.failure(input, context);
  },
  value => value,
);

@Injectable({
  scope: Scope.DEFAULT,
})
export class FileUploaderService {
  private readonly _storageManager = supabaseClient.storage.from('images');

  public upload(
    file: MemoryStoredFile,
    {
      itemID,
      ownerID,
    }: {
      readonly itemID: string;
      readonly ownerID: string;
    },
  ): TE.TaskEither<Exception, string> {
    return pipe(
      TE.tryCatch(
        async () => {
          // * Compress the image
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const compressedImage = await sharp(file.buffer)
            .rotate()
            .resize({
              height: 600,
              width: 600,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .webp({
              quality: 80,
            })
            .toBuffer();

          const upload = await this._storageManager.upload(
            `${ownerID}/${itemID}-${randomBytes(2).toString('hex')}.webp`,
            compressedImage,
            {
              contentType: 'image/webp',
            },
          );

          if (upload.error) {
            throw new Error(upload.error.message);
          }

          return upload.data.path;
        },
        () => {
          return EXCEPTIONS.unprocessableEntity('Failed to upload file');
        },
      ),
    );
  }

  public delete(fileID: string): TE.TaskEither<Exception, void> {
    return pipe(
      TE.tryCatch(
        async () => {
          await this._storageManager.remove([fileID]);
        },
        () => EXCEPTIONS.notFound('Failed to delete file'),
      ),
    );
  }
}
