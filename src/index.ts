import init from './init';

(async () => {
  try {
    const { server, container } = await init();

    const env: Env = container.resolve('env');

    server.start();

    console.log(`${env.serviceName} started on ${server.port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
