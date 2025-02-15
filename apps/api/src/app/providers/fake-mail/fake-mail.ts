import { EXCEPTIONS, extractError } from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import { Address, MailProvider, Message } from '@server/app/interfaces/mail';
import { TaskEither, tryCatch } from 'fp-ts/lib/TaskEither';

const KITCHI_EMAIL = 'app@gmail.com';
const KITCHI_ADDRESS: Address = { email: KITCHI_EMAIL, name: 'App' };

export class FakeMailProvider implements MailProvider {
  /** Fake transporter for demonstration */
  private readonly _transporter = {
    // eslint-disable-next-line @typescript-eslint/require-await
    sendMail: async (message: Message): Promise<void> =>
      console.log(`sending email to ${message.to.email} from ${message.from.email} with body ${message.body}`),
  };

  public readonly sendMail = (message: Message): TaskEither<Exception, void> => {
    return tryCatch(
      async () => {
        const { to, from, subject, body } = message;
        await this._transporter.sendMail({ body, from, subject, to });

        return void 0;
      },
      (error: unknown) => {
        return EXCEPTIONS.bad(extractError(error).message);
      },
    );
  };

  public readonly sendCode = (address: Address, code: string): TaskEither<Exception, void> => {
    return tryCatch(
      async () => {
        const subject = `Your verification code: ${code}`;
        const body = `Your verification code is: ${code}`;
        await this._transporter.sendMail({ body, from: KITCHI_ADDRESS, subject, to: address });

        return void 0;
      },
      (error: unknown) => {
        return EXCEPTIONS.bad(extractError(error).message);
      },
    );
  };
}
