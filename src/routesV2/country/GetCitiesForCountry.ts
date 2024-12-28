import { FastifyInstance } from 'fastify';
import CountryRepository__V2, { DBCityResult } from '../../repository/CountryRepository__V2';

class GetCitiesForCountry {
  countryRepository: CountryRepository__V2;

  constructor({ countryRepositoryV2 }: ContainerCradle) {
    this.countryRepository = countryRepositoryV2;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Params: GetCitiesForCountryParams;
      Reply: PossibleErrorResponse<GetCitiesForCountryResponse>;
    }>({
      method: 'GET',
      url: '/v2/countries/:countryId/cities',
      handler: async (req, reply) => {
        const cities = await this.countryRepository.getCitiesForCountries([req.params.countryId]);

        return reply.code(200).send({ cities });
      },
    });
  }
}

export default GetCitiesForCountry;

interface GetCitiesForCountryParams {
  countryId: number;
}

interface GetCitiesForCountryResponse {
  cities: DBCityResult[];
}
