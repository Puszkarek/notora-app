/* eslint-disable unicorn/prevent-abbreviations */
export const environment = {
  apiURL: 'https://notora-prod-api.fly.dev',
  wwwURL: 'https://notora-prod.pages.dev',
  env: 'prod',
  tokenSecret: process.env['TOKEN_SECRET'] ?? '',
  google: {
    clientID: process.env['GOOGLE_CLIENT_ID'] ?? '',
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
  },
  stripe: {
    secretKey: process.env['STRIPE_SECRET_KEY'] ?? '',
    webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'] ?? '',
  },
};
