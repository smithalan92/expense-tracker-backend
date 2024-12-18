import { type FastifyInstance } from 'fastify';
import type CityRepository from '../repository/CityRepository';
import { type DBCityResult } from '../repository/CityRepository';
import type CountryRepository from '../repository/CountryRepository';
import { type DBCountriesResult } from '../repository/CountryRepository';

class CountryRoutes implements Router {
  countryRepository: CountryRepository;
  cityRepository: CityRepository;

  constructor({ countryRepository, cityRepository }: ContainerCradle) {
    this.countryRepository = countryRepository;
    this.cityRepository = cityRepository;
  }

  configure(server: FastifyInstance) {
    this.makeGetCountriesRoute(server);
    this.makeGetCitiesForCountriesRoute(server);
  }

  makeGetCountriesRoute(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<GetCountriesResponse>;
    }>({
      method: 'GET',
      url: '/countries',
      handler: async (req, reply) => {
        const countries = await this.countryRepository.getCountries();

        return reply.code(200).send({ countries });
      },
    });
  }

  makeGetCitiesForCountriesRoute(server: FastifyInstance) {
    server.route<{
      Params: GetCitiesForCountryParams;
      Reply: PossibleErrorResponse<GetCitiesForCountryResponse>;
    }>({
      method: 'GET',
      url: '/countries/:countryId/cities',
      handler: async (req, reply) => {
        const cities = await this.cityRepository.getCitiesForCountryIds([req.params.countryId]);

        return reply.code(200).send({ cities });
      },
    });
  }
}

export default CountryRoutes;

export interface GetCountriesResponse {
  countries: DBCountriesResult[];
}

export interface GetCitiesForCountryParams {
  countryId: number;
}

export interface GetCitiesForCountryResponse {
  cities: DBCityResult[];
}
