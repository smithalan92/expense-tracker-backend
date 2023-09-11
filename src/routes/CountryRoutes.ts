import { FastifyInstance } from 'fastify';
import CountryController from '../controllers/CountryController';
import { GetCitiesForCountryParams, GetCitiesForCountryResponse, GetCountriesResponse } from '../controllers/CountryController.types';
import { ContainerCradle, Router } from '../lib/types';
import { PossibleErrorResponse } from '../types/routes';

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
