// Starts the server: `node apps/server/src/main.ts`, configured by the environment (see config.ts).
import { buildApp } from './app.ts';
import { configFromEnv } from './config.ts';

const config = configFromEnv();
const { app, close } = await buildApp(config);
await app.listen({ port: config.port, host: config.host });
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void close().then(() => process.exit(0));
  });
}
