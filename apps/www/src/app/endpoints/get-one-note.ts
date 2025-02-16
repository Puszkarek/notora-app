import type { HttpClient } from '@angular/common/http';
import { ApiResponse, CheckListNote, checklistNoteCodec, ID, TextNote, textNoteCodec } from '@api-interfaces';
import { parseChecklistNote } from '@www/app/helpers/parse-checklist-note';
import { environment } from '@www/environments/environment';
import * as E from 'fp-ts/es6/Either';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const getOneNoteWithDetails = async (
  httpClient: HttpClient,
  noteID: ID,
): Promise<E.Either<Error, CheckListNote | TextNote>> => {
  return await firstValueFrom(
    httpClient
      .get<ApiResponse<CheckListNote | TextNote>>(`${environment.apiHost}/notes/${noteID}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map(({ data }) => {
          if (data.type === 'checklist') {
            const parsedData = parseChecklistNote(data);
            if (checklistNoteCodec.is(parsedData)) {
              return E.right(data);
            }
          } else if (textNoteCodec.is(data)) {
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
