import { environment } from '@www/environments/environment';

export const getGoogleConsentURL = (): string => {
  const callbackURL = `${window.location.origin}/login/callback`;
  const googleClientID = environment.googleClientID;

  const params = new URLSearchParams({
    client_id: googleClientID,
    redirect_uri: callbackURL,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'consent select_account',
    access_type: 'offline',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};
