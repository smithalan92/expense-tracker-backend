import * as awilix from 'awilix';
import Server from './lib/Server';

async function makeServer(container: awilix.AwilixContainer) {
  // Load all repositories to the container
  container.loadModules(['repository/**'], {
    formatName: 'camelCase',
    cwd: __dirname,
    resolverOptions: {
      lifetime: awilix.Lifetime.SCOPED,
    },
  });

  const jobsPath = 'jobs/**';

  // Load jobs
  container.loadModules([jobsPath], {
    formatName: 'camelCase',
    cwd: __dirname,
    resolverOptions: {
      lifetime: awilix.Lifetime.SCOPED,
    },
  });

  // Then schedule jobs
  awilix
    .listModules([jobsPath], {
      cwd: __dirname,
    })
    .forEach((moduleDesc) => {
      let { name } = moduleDesc;
      name = name.slice(0, 1).toLowerCase() + name.slice(1);
      const job: Job = container.resolve(name);
      job.start();
    });

  const routesPath = 'routes/**';

  // Load routes
  container.loadModules([routesPath], {
    formatName: 'camelCase',
    cwd: __dirname,
    resolverOptions: {
      lifetime: awilix.Lifetime.SCOPED,
    },
  });

  // We need to create the server here as the routes need access to it
  const server = new Server(container.cradle);

  // Then register routes
  awilix
    .listModules([routesPath], {
      cwd: __dirname,
    })
    .forEach((moduleDesc) => {
      let { name } = moduleDesc;
      name = name.slice(0, 1).toLowerCase() + name.slice(1);
      server.registerRoutes(container.resolve(name));
    });

  return server;
}

export default makeServer;
