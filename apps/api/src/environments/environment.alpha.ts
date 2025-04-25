export const environment = {
  apiURL: 'https://notora-alpha-api.fly.dev',
  wwwURL: 'https://notora-api.pages.dev',
  env: 'alpha',
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
