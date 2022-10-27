import { FastifyInstance } from 'fastify';
import CountryController from '../controllers/CountryController';
import { GetCitiesForCountriesParams, GetCitiesForCountriesResponse } from '../controllers/CountryController.types';
import { Router, ContainerCradle } from '../lib/types';
import { PossibleErrorResponse } from '../types/routes';

class CountryRoutes implements Router {
  controller: CountryController;

  constructor({ countryController }: ContainerCradle) {
    this.controller = countryController;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<GetCitiesForCountriesResponse>;
      Querystring: GetCitiesForCountriesParams;
    }>({
      method: 'GET',
      url: '/countries/cities',
      handler: this.controller.getCitiesForCountries,
    });
  }
}

export default CountryRoutes;
