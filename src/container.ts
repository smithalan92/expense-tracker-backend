import * as awilix from 'awilix';
import makeEnv from './services/env';
import makePool from './services/db';
import DBAgent from './lib/DBAgent';
import { ContainerCradle } from './lib/types';

export default async function configureContainer() {
  const container = awilix.createContainer<ContainerCradle>();
  const env = makeEnv();
  container.register('env', awilix.asValue(env));

  const mysqlPool = makePool(container.cradle);

  const dbAgent = new DBAgent(mysqlPool);
  container.register('dbAgent', awilix.asValue(dbAgent));

  return container;
}
