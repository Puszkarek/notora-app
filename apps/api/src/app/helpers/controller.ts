import { createParamDecorator, ExecutionContext, HttpException, Logger } from '@nestjs/common';
import { Exception } from '@server/app/interfaces/error';
import { LoggedRequest } from '@server/app/interfaces/request';
import { taskEither as TE } from 'fp-ts';
import { pipe } from 'fp-ts/lib/function';
import { Task } from 'fp-ts/lib/Task';
import { TaskEither } from 'fp-ts/lib/TaskEither';

/**
 * On FP patterns we don't throw errors, but Nest depends of that to send the correct HTTP
 * Status code to the front-end, so we are doing this little abstraction to handle the errors
 *
 * P.S: should be called only on nest controllers, guards, etc...
 *
 * @param taskE - The either task to execute and get the response
 * @returns `T` if is a Right, otherwise throw an `HttpException` error with left
 */
export const executeTaskEither = <T>(taskE: TaskEither<Exception, T>): Task<T> => {
  return pipe(
    taskE,
    TE.getOrElse(error => {
      Logger.error(`[${error.statusCode}]: ${error.message}`);
      // eslint-disable-next-line functional/no-throw-statements
      throw new HttpException(error.message, error.statusCode);
    }),
  );
};

export const executeTaskEitherWithMessage =
  (successMessage: string, errorMessage?: string) =>
  // eslint-disable-next-line unicorn/consistent-function-scoping
  <T>(taskE: TaskEither<Exception, T>): Task<T> => {
    return pipe(
      taskE,
      TE.map(data => {
        Logger.log(successMessage);
        return data;
      }),
      TE.getOrElse(error => {
        Logger.error(errorMessage ?? error);
        // eslint-disable-next-line functional/no-throw-statements
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  };

export const UserParam = createParamDecorator((_data, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<LoggedRequest>();
  return request.user;
});
