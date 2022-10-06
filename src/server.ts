import * as awilix from "awilix";
import Server from "./lib/Server";

async function makeServer(container: awilix.AwilixContainer) {
  const server = new Server(container.cradle);

  // Load all repositories to the container
  container.loadModules(["repository/**"], {
    formatName: "camelCase",
    cwd: __dirname,
    resolverOptions: {
      lifetime: awilix.Lifetime.SCOPED,
    },
  });

  // Load all controllers to the container
  container.loadModules(["controllers/**"], {
    formatName: "camelCase",
    cwd: __dirname,
    resolverOptions: {
      lifetime: awilix.Lifetime.SCOPED,
    },
  });

  const routesPath = "routes/**";

  // Load routes
  container.loadModules([routesPath], {
    formatName: "camelCase",
    cwd: __dirname,
    resolverOptions: {
      lifetime: awilix.Lifetime.SCOPED,
    },
  });

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
