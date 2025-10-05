import * as awilix from 'awilix';
import DBAgent from './lib/DBAgent';
import Server from './lib/Server';
import makePool from './services/db';
import makeEnv from './services/env';

function configureDB(container: awilix.AwilixContainer<ContainerCradle>) {
  const mysqlPool = makePool(container.cradle);
  const dbAgent = new DBAgent(mysqlPool);
  container.register('dbAgent', awilix.asValue(dbAgent));
}

function configureJobs(container: awilix.AwilixContainer) {
  const jobsPath = 'jobs/**';

  container.loadModules([jobsPath], {
    formatName: 'camelCase',
    cwd: __dirname,
    resolverOptions: { lifetime: awilix.Lifetime.SCOPED },
  });

  // Then schedule jobs
  awilix.listModules([jobsPath], { cwd: __dirname }).forEach((moduleDesc) => {
    let { name } = moduleDesc;
    name = name.slice(0, 1).toLowerCase() + name.slice(1);
    const job = container.resolve(name) as unknown as Job;
    job.start();
  });
}

function configureRoutes(container: awilix.AwilixContainer, server: Server) {
  const routesGlob = 'routes/**';

  // Load routes
  container.loadModules([routesGlob], {
    formatName: 'camelCase',
    cwd: __dirname,
    resolverOptions: { lifetime: awilix.Lifetime.SCOPED },
  });

  // Then register routes
  awilix.listModules([routesGlob], { cwd: __dirname }).forEach((moduleDesc) => {
    let { name } = moduleDesc;
    name = name.slice(0, 1).toLowerCase() + name.slice(1);
    server.registerRoutes(container.resolve(name) as unknown as Router);
  });
}

export default function init() {
  const container = awilix.createContainer<ContainerCradle>();

  const env = makeEnv();
  container.register('env', awilix.asValue(env));

  configureDB(container);

  // Load all repositories to the container
  container.loadModules(['repository/**'], {
    formatName: 'camelCase',
    cwd: __dirname,
    resolverOptions: { lifetime: awilix.Lifetime.SCOPED },
  });

  configureJobs(container);

  // We need to create the server here as the routes need access to it
  const server = new Server(container.cradle);

  configureRoutes(container, server);

  return { server, container };
}
