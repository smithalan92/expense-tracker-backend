/* eslint-disable @typescript-eslint/no-floating-promises */
import configureContainer from './container';
import { Env } from './lib/types';
import makeServer from './server';

(async () => {
  let container;

  try {
    container = await configureContainer();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  }

  const env: Env = container.resolve('env');

  try {
    const server = await makeServer(container);

    server.start();
    console.log(`${env.serviceName} started on ${server.port}`);
  } catch (err) {
    console.error(err);
  }
})();
