import { EXCEPTIONS } from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import * as TE from 'fp-ts/TaskEither';

type GoogleTokens = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
};

export const getGoogleTokensFromCode = (
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): TE.TaskEither<Exception, GoogleTokens> =>
  TE.tryCatch(async () => {
    const params = new URLSearchParams({
      code,
      // biome-ignore lint/style/useNamingConvention: This is Google's API, not us
      client_id: clientId,
      // biome-ignore lint/style/useNamingConvention: This is Google's API, not us
      client_secret: clientSecret,
      // biome-ignore lint/style/useNamingConvention: This is Google's API, not us
      redirect_uri: redirectUri,
      // biome-ignore lint/style/useNamingConvention: This is Google's API, not us
      grant_type: 'authorization_code',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      console.info(await response.text());
      throw new Error('Failed to get access token');
    }

    const json = await response.json();
    return json as GoogleTokens;
  }, EXCEPTIONS.to.internal);
