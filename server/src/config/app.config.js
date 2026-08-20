import env from "./env.js";

const appConfig = Object.freeze({

  app: env.app,
  server: env.server,
  database: env.database,
  jwt: env.jwt,
  logging: env.logging,
  http: env.http,
  cookies: env.cookies,
  compression: env.compression,
  security: env.security,
  features: env.features,
  seeding: env.seeding,
});

export default appConfig;