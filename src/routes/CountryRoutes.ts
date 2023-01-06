import { FastifyInstance } from 'fastify';
import CountryController from '../controllers/CountryController';
import { GetCountriesResponse } from '../controllers/CountryController.types';
import { Router, ContainerCradle } from '../lib/types';
import { PossibleErrorResponse } from '../types/routes';

class TripRoutes implements Router {
  controller: CountryController;

  constructor({ countryController }: ContainerCradle) {
    this.controller = countryController;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<GetCountriesResponse>;
    }>({
      method: 'GET',
      url: '/countries',
      handler: this.controller.getCountries,
    });
  }
}

export default TripRoutes;
