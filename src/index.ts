import init from './init';

void (() => {
  try {
    const { server, container } = init();

    const env: Env = container.resolve('env');

    void server.start();

    console.log(`${env.serviceName} started on ${server.port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
