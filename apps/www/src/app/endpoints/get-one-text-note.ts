import { HttpClient } from '@angular/common/http';
import { ApiResponse, ID, TextNoteContent, textNoteContentCodec } from '@api-interfaces';
import { environment } from '@www/environments/environment';
import * as E from 'fp-ts/es6/Either';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const getOneTextNote = async (httpClient: HttpClient, noteID: ID): Promise<E.Either<Error, TextNoteContent>> => {
  return await firstValueFrom(
    httpClient
      .get<ApiResponse<TextNoteContent>>(`${environment.apiHost}/notes/${noteID}/content`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map(({ data }) => {
          if (textNoteContentCodec.is(data)) {
            return E.right(data);
          }
          console.error('Invalid response', data);
          return E.left(new Error('Invalid response'));
        }),
        catchError((error: unknown) => {
          return of(E.left(E.toError(error)));
        }),
      ),
  );
};
