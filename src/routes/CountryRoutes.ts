import { type FastifyInstance } from 'fastify';
import type CountryController from '../controllers/CountryController';
import { type GetCitiesForCountryParams, type GetCitiesForCountryResponse, type GetCountriesResponse } from '../controllers/CountryController.types';
import { type ContainerCradle, type Router } from '../lib/types';
import { type PossibleErrorResponse } from '../types/routes';

class CountryRoutes implements Router {
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

    server.route<{
      Params: GetCitiesForCountryParams;
      Reply: PossibleErrorResponse<GetCitiesForCountryResponse>;
    }>({
      method: 'GET',
      url: '/countries/:countryId/cities',
      handler: this.controller.getCitiesForCountry,
    });
  }
}

export default CountryRoutes;
