export const environment = {
  apiURL: 'http://localhost:3000',
  wwwURL: 'http://localhost:4200',
  env: 'dev',
  tokenSecret: process.env['TOKEN_SECRET'] ?? '',
  supabase: {
    url: process.env['SUPABASE_URL'] ?? '',
    key: process.env['SUPABASE_KEY'] ?? '',
  },
  google: {
    clientID: process.env['GOOGLE_CLIENT_ID'] ?? '',
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
  },
  stripe: {
    secretKey: process.env['STRIPE_SECRET_KEY'] ?? '',
    webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'] ?? '',
  },
};
